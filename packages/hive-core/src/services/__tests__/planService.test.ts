import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { PlanService } from '../planService';
import type { CommentsJson } from '../../types';

const TEST_DIR = '/tmp/hive-core-planservice-test-' + process.pid;
const PROJECT_ROOT = TEST_DIR;

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

function setupFeature(featureName: string): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.mkdirSync(featurePath, { recursive: true });

  fs.writeFileSync(
    path.join(featurePath, 'feature.json'),
    JSON.stringify({
      name: featureName,
      status: 'planning',
      createdAt: new Date().toISOString(),
    }),
  );
}

function writePlan(featureName: string, content: string): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(path.join(featurePath, 'plan.md'), content);
}

function writeComments(featureName: string, data: unknown): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(
    path.join(featurePath, 'comments.json'),
    JSON.stringify(data, null, 2),
  );
}

function readComments(featureName: string): CommentsJson | null {
  const commentsPath = path.join(
    TEST_DIR,
    '.hive',
    'features',
    featureName,
    'comments.json',
  );
  if (!fs.existsSync(commentsPath)) return null;
  return JSON.parse(fs.readFileSync(commentsPath, 'utf-8'));
}

describe('PlanService', () => {
  let service: PlanService;

  beforeEach(() => {
    cleanup();
    service = new PlanService(PROJECT_ROOT);
  });

  afterEach(() => {
    cleanup();
  });

  describe('write', () => {
    it('clears comments when writing a plan', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Old Plan');

      // Pre-populate some comments
      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Please revise',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      service.write(feature, '# New Plan');

      const comments = readComments(feature);
      expect(comments).toBeDefined();
      expect(comments!.threads).toEqual([]);
    });
  });

  describe('read', () => {
    it('returns plan content with comments', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# My Plan\n\nSome content');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 5,
            body: 'Looks good',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      const result = service.read(feature);
      expect(result).not.toBeNull();
      expect(result!.content).toBe('# My Plan\n\nSome content');
      expect(result!.comments).toHaveLength(1);
      expect(result!.comments[0].body).toBe('Looks good');
      expect(result!.comments[0].author).toBe('human');
    });

    it('returns null when no plan exists', () => {
      const feature = 'nonexistent';
      setupFeature(feature);
      const result = service.read(feature);
      expect(result).toBeNull();
    });
  });

  describe('addComment', () => {
    it('persists a new comment with generated id and timestamp', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      const comment = service.addComment(feature, {
        line: 3,
        body: 'Needs more detail',
        author: 'human',
      });

      expect(comment.id).toMatch(/^comment-/);
      expect(comment.timestamp).toBeTruthy();
      expect(comment.body).toBe('Needs more detail');
      expect(comment.author).toBe('human');
      expect(comment.line).toBe(3);

      // Verify persisted
      const comments = service.getComments(feature);
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe(comment.id);
    });

    it('appends to existing comments', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      service.addComment(feature, {
        line: 1,
        body: 'First comment',
        author: 'human',
      });
      service.addComment(feature, {
        line: 5,
        body: 'Second comment',
        author: 'agent',
      });

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(2);
      expect(comments[0].body).toBe('First comment');
      expect(comments[1].body).toBe('Second comment');
    });
  });

  describe('old-format migration', () => {
    it('migrates comments missing author and timestamp to defaults', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      // Old format: no author, no timestamp
      writeComments(feature, {
        threads: [
          {
            id: 'old-1',
            line: 2,
            body: 'Old comment without author',
          },
        ],
      });

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(1);
      expect(comments[0].author).toBe('human');
      expect(comments[0].timestamp).toBeTruthy();
      expect(comments[0].body).toBe('Old comment without author');
    });

    it('migrates old-format comments with replies as string array', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      // Old VS Code format: replies are string[]
      writeComments(feature, {
        threads: [
          {
            id: 'old-2',
            line: 3,
            body: 'Main comment',
            replies: ['Reply one', 'Reply two'],
          },
        ],
      });

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(1);
      expect(comments[0].author).toBe('human');
      expect(comments[0].replies).toBeDefined();
      expect(comments[0].replies).toHaveLength(2);
      expect(comments[0].replies![0].body).toBe('Reply one');
      expect(comments[0].replies![0].author).toBe('human');
      expect(comments[0].replies![0].id).toBeTruthy();
      expect(comments[0].replies![0].timestamp).toBeTruthy();
      expect(comments[0].replies![1].body).toBe('Reply two');
    });

    it('preserves already-migrated comments with author and timestamp', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      const ts = '2025-06-15T10:00:00.000Z';
      writeComments(feature, {
        threads: [
          {
            id: 'new-1',
            line: 1,
            body: 'Already correct',
            author: 'agent',
            timestamp: ts,
          },
        ],
      });

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(1);
      expect(comments[0].author).toBe('agent');
      expect(comments[0].timestamp).toBe(ts);
    });
  });

  describe('resolved field', () => {
    it('supports resolved flag on comments', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Resolved comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
            resolved: true,
          },
          {
            id: 'c2',
            line: 3,
            body: 'Unresolved comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(2);
      expect(comments[0].resolved).toBe(true);
      expect(comments[1].resolved).toBeUndefined();
    });
  });

  describe('replies field', () => {
    it('supports PlanCommentReply objects in replies', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Main comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
            replies: [
              {
                id: 'r1',
                body: 'Reply body',
                author: 'agent',
                timestamp: '2025-01-02T00:00:00.000Z',
              },
            ],
          },
        ],
      });

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(1);
      expect(comments[0].replies).toHaveLength(1);
      expect(comments[0].replies![0].id).toBe('r1');
      expect(comments[0].replies![0].body).toBe('Reply body');
      expect(comments[0].replies![0].author).toBe('agent');
    });
  });

  describe('approval with unresolved comments', () => {
    it('approves when no comments exist', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      // Should not throw
      expect(() => service.approve(feature)).not.toThrow();
      expect(service.isApproved(feature)).toBe(true);
    });

    it('approves when all comments are resolved', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
            resolved: true,
          },
        ],
      });

      expect(() => service.approve(feature)).not.toThrow();
      expect(service.isApproved(feature)).toBe(true);
    });

    it('throws when unresolved comments exist', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Resolved comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
            resolved: true,
          },
          {
            id: 'c2',
            line: 5,
            body: 'Unresolved comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      expect(() => service.approve(feature)).toThrow(/unresolved comment/i);
      expect(service.isApproved(feature)).toBe(false);
    });

    it('throws when comment has resolved set to false', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Explicitly unresolved',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
            resolved: false,
          },
        ],
      });

      expect(() => service.approve(feature)).toThrow(/unresolved comment/i);
      expect(service.isApproved(feature)).toBe(false);
    });
  });

  describe('resolveComment', () => {
    it('marks a comment as resolved by id', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Fix this',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      service.resolveComment(feature, 'c1');

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(1);
      expect(comments[0].resolved).toBe(true);
    });

    it('throws when comment id does not exist', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, { threads: [] });

      expect(() => service.resolveComment(feature, 'nonexistent')).toThrow(
        /not found/i,
      );
    });

    it('preserves other comments when resolving one', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'First',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'c2',
            line: 5,
            body: 'Second',
            author: 'agent',
            timestamp: '2025-01-02T00:00:00.000Z',
          },
        ],
      });

      service.resolveComment(feature, 'c1');

      const comments = service.getComments(feature);
      expect(comments).toHaveLength(2);
      expect(comments[0].resolved).toBe(true);
      expect(comments[1].resolved).toBeUndefined();
    });
  });

  describe('event callbacks', () => {
    it('calls onCommentAdded after addComment', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      const events: Array<{
        feature: string;
        commentId: string;
        unresolvedCount: number;
      }> = [];
      service.onCommentAdded = (f, cId, count) => {
        events.push({ feature: f, commentId: cId, unresolvedCount: count });
      };

      service.addComment(feature, {
        line: 1,
        body: 'A comment',
        author: 'human',
      });

      expect(events).toHaveLength(1);
      expect(events[0].feature).toBe(feature);
      expect(events[0].commentId).toMatch(/^comment-/);
      expect(events[0].unresolvedCount).toBe(1);
    });

    it('calls onPlanRevised after write with previous comment count', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Old Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Comment 1',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'c2',
            line: 3,
            body: 'Comment 2',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      const events: Array<{
        feature: string;
        previousCommentCount: number;
      }> = [];
      service.onPlanRevised = (f, count) => {
        events.push({ feature: f, previousCommentCount: count });
      };

      service.write(feature, '# New Plan');

      expect(events).toHaveLength(1);
      expect(events[0].feature).toBe(feature);
      expect(events[0].previousCommentCount).toBe(2);
    });

    it('calls onPlanApproved after approve', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      const events: Array<{ feature: string; approvedAt: string }> = [];
      service.onPlanApproved = (f, at) => {
        events.push({ feature: f, approvedAt: at });
      };

      service.approve(feature);

      expect(events).toHaveLength(1);
      expect(events[0].feature).toBe(feature);
      expect(events[0].approvedAt).toBeTruthy();
    });

    it('does not fail when no event callbacks are set', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      // No callbacks set — should not throw
      expect(() => {
        service.addComment(feature, {
          line: 1,
          body: 'Comment',
          author: 'human',
        });
        service.write(feature, '# Revised');
        service.approve(feature);
      }).not.toThrow();
    });
  });

  describe('addReply', () => {
    it('adds a reply to an existing comment', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Main comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      const reply = service.addReply(feature, 'c1', {
        body: 'My reply',
        author: 'agent',
      });

      expect(reply.id).toMatch(/^reply-/);
      expect(reply.body).toBe('My reply');
      expect(reply.author).toBe('agent');
      expect(reply.timestamp).toBeTruthy();

      // Verify persisted
      const comments = service.getComments(feature);
      expect(comments[0].replies).toHaveLength(1);
      expect(comments[0].replies![0].id).toBe(reply.id);
      expect(comments[0].replies![0].body).toBe('My reply');
    });

    it('appends to existing replies', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, {
        threads: [
          {
            id: 'c1',
            line: 1,
            body: 'Main comment',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
            replies: [
              {
                id: 'r1',
                body: 'Existing reply',
                author: 'human',
                timestamp: '2025-01-01T00:00:00.000Z',
              },
            ],
          },
        ],
      });

      service.addReply(feature, 'c1', {
        body: 'New reply',
        author: 'agent',
      });

      const comments = service.getComments(feature);
      expect(comments[0].replies).toHaveLength(2);
      expect(comments[0].replies![0].body).toBe('Existing reply');
      expect(comments[0].replies![1].body).toBe('New reply');
    });

    it('throws when comment id does not exist', () => {
      const feature = 'test-feature';
      setupFeature(feature);
      writePlan(feature, '# Plan');

      writeComments(feature, { threads: [] });

      expect(() =>
        service.addReply(feature, 'nonexistent', {
          body: 'Reply',
          author: 'human',
        }),
      ).toThrow(/not found/i);
    });
  });
});
