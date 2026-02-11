import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { ReviewService } from './reviewService.js';
import type {
  ReviewSession,
  ReviewIndex,
  ReviewScope,
  Range,
  AnnotationType,
} from '../types.js';

describe('ReviewService', () => {
  let tempDir: string;
  let service: ReviewService;

  beforeEach(() => {
    // Create a temp directory for test isolation
    tempDir = fs.mkdtempSync(path.join('/tmp', 'hive-test-'));
    service = new ReviewService(tempDir);

    // Create the feature directory structure
    const featureDir = path.join(tempDir, '.hive', 'features', 'test-feature');
    fs.mkdirSync(featureDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('startSession', () => {
    it('creates a new review session with default scope', async () => {
      const session = await service.startSession('test-feature', 'feature');

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.featureName).toBe('test-feature');
      expect(session.scope).toBe('feature');
      expect(session.status).toBe('in_progress');
      expect(session.verdict).toBeNull();
      expect(session.summary).toBeNull();
      expect(session.threads).toEqual([]);
      expect(session.schemaVersion).toBe(1);
    });

    it('creates a session with code scope and git refs', async () => {
      const session = await service.startSession(
        'test-feature',
        'code',
        'main',
        'feature-branch',
      );

      expect(session.scope).toBe('code');
      expect(session.gitMeta.baseRef).toBe('main');
      expect(session.gitMeta.headRef).toBe('feature-branch');
    });

    it('creates reviews directory if it does not exist', async () => {
      await service.startSession('test-feature', 'task');

      const reviewDir = path.join(
        tempDir,
        '.hive',
        'features',
        'test-feature',
        'reviews',
      );
      expect(fs.existsSync(reviewDir)).toBe(true);
    });

    it('updates the review index with the new session', async () => {
      const session = await service.startSession('test-feature', 'feature');

      const indexPath = path.join(
        tempDir,
        '.hive',
        'features',
        'test-feature',
        'reviews',
        'index.json',
      );
      const index = JSON.parse(
        fs.readFileSync(indexPath, 'utf-8'),
      ) as ReviewIndex;

      expect(index.activeSessionId).toBe(session.id);
      expect(index.sessions).toHaveLength(1);
      expect(index.sessions[0].id).toBe(session.id);
      expect(index.sessions[0].scope).toBe('feature');
      expect(index.sessions[0].status).toBe('in_progress');
    });
  });

  describe('getSession', () => {
    it('returns null for non-existent session', async () => {
      const session = await service.getSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('returns the session when it exists', async () => {
      const created = await service.startSession('test-feature', 'feature');
      const retrieved = await service.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.featureName).toBe('test-feature');
    });
  });

  describe('listSessions', () => {
    it('returns empty array when no sessions exist', async () => {
      const sessions = await service.listSessions('test-feature');
      expect(sessions).toEqual([]);
    });

    it('returns all sessions for a feature', async () => {
      await service.startSession('test-feature', 'feature');
      await service.startSession('test-feature', 'task');
      await service.startSession('test-feature', 'code');

      const sessions = await service.listSessions('test-feature');
      expect(sessions).toHaveLength(3);
    });
  });

  describe('submitSession', () => {
    it('updates session with verdict and summary', async () => {
      const created = await service.startSession('test-feature', 'feature');
      const submitted = await service.submitSession(
        created.id,
        'approve',
        'LGTM!',
      );

      expect(submitted.status).toBe('approved');
      expect(submitted.verdict).toBe('approve');
      expect(submitted.summary).toBe('LGTM!');
    });

    it('sets status to changes_requested when verdict is request_changes', async () => {
      const created = await service.startSession('test-feature', 'feature');
      const submitted = await service.submitSession(
        created.id,
        'request_changes',
        'Needs fixes',
      );

      expect(submitted.status).toBe('changes_requested');
      expect(submitted.verdict).toBe('request_changes');
    });

    it('sets status to commented when verdict is comment', async () => {
      const created = await service.startSession('test-feature', 'feature');
      const submitted = await service.submitSession(
        created.id,
        'comment',
        'Just a note',
      );

      expect(submitted.status).toBe('commented');
      expect(submitted.verdict).toBe('comment');
    });

    it('throws error for non-existent session', async () => {
      await expect(
        service.submitSession('non-existent', 'approve', 'LGTM'),
      ).rejects.toThrow();
    });
  });

  describe('addThread', () => {
    it('creates a new thread with annotation', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'This is a comment',
          author: { type: 'human', name: 'tester' },
        },
      );

      expect(thread).toBeDefined();
      expect(thread.id).toBeDefined();
      expect(thread.entityId).toBe('entity-1');
      expect(thread.uri).toBeNull();
      expect(thread.range).toEqual(range);
      expect(thread.status).toBe('open');
      expect(thread.annotations).toHaveLength(1);
      expect(thread.annotations[0].body).toBe('This is a comment');
      expect(thread.annotations[0].type).toBe('comment');
    });

    it('creates a thread with uri for code scope', async () => {
      const session = await service.startSession('test-feature', 'code');
      const range: Range = {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'file-entity',
        'src/index.ts',
        range,
        {
          type: 'suggestion',
          body: 'Consider refactoring',
          author: { type: 'llm', name: 'claude', agentId: 'reviewer-1' },
          suggestion: { replacement: 'refactored code' },
        },
      );

      expect(thread.uri).toBe('src/index.ts');
      expect(thread.annotations[0].type).toBe('suggestion');
      expect(thread.annotations[0].suggestion).toEqual({
        replacement: 'refactored code',
      });
    });

    it('persists the thread to the session file', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      await service.addThread(session.id, 'entity-1', null, range, {
        type: 'comment',
        body: 'Test comment',
        author: { type: 'human', name: 'tester' },
      });

      // Reload session from disk
      const reloaded = await service.getSession(session.id);
      expect(reloaded!.threads).toHaveLength(1);
      expect(reloaded!.threads[0].annotations[0].body).toBe('Test comment');
    });

    it('throws error for non-existent session', async () => {
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      await expect(
        service.addThread('non-existent', 'entity', null, range, {
          type: 'comment',
          body: 'Test',
          author: { type: 'human', name: 'test' },
        }),
      ).rejects.toThrow();
    });
  });

  describe('replyToThread', () => {
    it('adds a reply annotation to an existing thread', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'Original comment',
          author: { type: 'human', name: 'author' },
        },
      );

      const reply = await service.replyToThread(thread.id, 'This is a reply');

      expect(reply).toBeDefined();
      expect(reply.id).toBeDefined();
      expect(reply.body).toBe('This is a reply');
      expect(reply.type).toBe('comment');
    });

    it('persists the reply to the session file', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'Original',
          author: { type: 'human', name: 'author' },
        },
      );

      await service.replyToThread(thread.id, 'Reply');

      // Reload session
      const reloaded = await service.getSession(session.id);
      const reloadedThread = reloaded!.threads.find((t) => t.id === thread.id);
      expect(reloadedThread!.annotations).toHaveLength(2);
      expect(reloadedThread!.annotations[1].body).toBe('Reply');
    });

    it('throws error for non-existent thread', async () => {
      await expect(
        service.replyToThread('non-existent-thread', 'Reply'),
      ).rejects.toThrow();
    });
  });

  describe('resolveThread', () => {
    it('marks a thread as resolved', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'To resolve',
          author: { type: 'human', name: 'author' },
        },
      );

      const resolved = await service.resolveThread(thread.id);

      expect(resolved.status).toBe('resolved');
    });

    it('persists the resolved status', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'To resolve',
          author: { type: 'human', name: 'author' },
        },
      );

      await service.resolveThread(thread.id);

      // Reload
      const reloaded = await service.getSession(session.id);
      const reloadedThread = reloaded!.threads.find((t) => t.id === thread.id);
      expect(reloadedThread!.status).toBe('resolved');
    });

    it('throws error for non-existent thread', async () => {
      await expect(
        service.resolveThread('non-existent-thread'),
      ).rejects.toThrow();
    });
  });

  describe('internal helpers', () => {
    it('generates unique IDs', async () => {
      const session1 = await service.startSession('test-feature', 'feature');
      const session2 = await service.startSession('test-feature', 'task');

      expect(session1.id).not.toBe(session2.id);
    });

    it('creates review directory structure correctly', async () => {
      await service.startSession('test-feature', 'feature');

      const reviewDir = path.join(
        tempDir,
        '.hive',
        'features',
        'test-feature',
        'reviews',
      );
      expect(fs.existsSync(reviewDir)).toBe(true);
      expect(fs.existsSync(path.join(reviewDir, 'index.json'))).toBe(true);
    });
  });

  describe('markSuggestionApplied', () => {
    it('marks a suggestion annotation as applied', async () => {
      const session = await service.startSession('test-feature', 'code');
      const range: Range = {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'file-entity',
        'src/index.ts',
        range,
        {
          type: 'suggestion',
          body: 'Consider refactoring',
          author: { type: 'llm', name: 'claude' },
          suggestion: { replacement: 'refactored code' },
        },
      );

      const annotationId = thread.annotations[0].id;
      const updated = await service.markSuggestionApplied(
        thread.id,
        annotationId,
      );

      expect(updated.meta).toBeDefined();
      expect(updated.meta!.applied).toBe(true);
      expect(updated.meta!.appliedAt).toBeDefined();
    });

    it('persists the applied status to the session file', async () => {
      const session = await service.startSession('test-feature', 'code');
      const range: Range = {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'file-entity',
        'src/index.ts',
        range,
        {
          type: 'suggestion',
          body: 'Refactor this',
          author: { type: 'llm', name: 'claude' },
          suggestion: { replacement: 'new code' },
        },
      );

      const annotationId = thread.annotations[0].id;
      await service.markSuggestionApplied(thread.id, annotationId);

      // Reload session
      const reloaded = await service.getSession(session.id);
      const reloadedThread = reloaded!.threads.find((t) => t.id === thread.id);
      const reloadedAnnotation = reloadedThread!.annotations.find(
        (a) => a.id === annotationId,
      );

      expect(reloadedAnnotation!.meta?.applied).toBe(true);
    });

    it('throws error for non-existent thread', async () => {
      await expect(
        service.markSuggestionApplied('non-existent-thread', 'anno-id'),
      ).rejects.toThrow();
    });

    it('throws error for non-existent annotation', async () => {
      const session = await service.startSession('test-feature', 'code');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity',
        'file.ts',
        range,
        {
          type: 'suggestion',
          body: 'Suggestion',
          author: { type: 'llm', name: 'claude' },
          suggestion: { replacement: 'code' },
        },
      );

      await expect(
        service.markSuggestionApplied(thread.id, 'non-existent-annotation'),
      ).rejects.toThrow();
    });

    it('throws error if annotation is not a suggestion', async () => {
      const session = await service.startSession('test-feature', 'code');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity',
        'file.ts',
        range,
        {
          type: 'comment', // Not a suggestion
          body: 'Just a comment',
          author: { type: 'human', name: 'user' },
        },
      );

      const annotationId = thread.annotations[0].id;
      await expect(
        service.markSuggestionApplied(thread.id, annotationId),
      ).rejects.toThrow(/not a suggestion/i);
    });
  });

  describe('event callbacks', () => {
    it('calls onReviewSubmitted after submitSession', async () => {
      const session = await service.startSession('test-feature', 'feature');

      const events: Array<{
        feature: string;
        sessionId: string;
        verdict: string;
        status: string;
      }> = [];
      service.onReviewSubmitted = (f, sId, v, s) => {
        events.push({ feature: f, sessionId: sId, verdict: v, status: s });
      };

      await service.submitSession(session.id, 'approve', 'Looks good!');

      expect(events).toHaveLength(1);
      expect(events[0].feature).toBe('test-feature');
      expect(events[0].sessionId).toBe(session.id);
      expect(events[0].verdict).toBe('approve');
      expect(events[0].status).toBe('approved');
    });

    it('calls onReviewThreadResolved after resolveThread', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'Fix this',
          author: { type: 'human', name: 'reviewer' },
        },
      );

      const events: Array<{
        feature: string;
        sessionId: string;
        threadId: string;
      }> = [];
      service.onReviewThreadResolved = (f, sId, tId) => {
        events.push({ feature: f, sessionId: sId, threadId: tId });
      };

      await service.resolveThread(thread.id);

      expect(events).toHaveLength(1);
      expect(events[0].feature).toBe('test-feature');
      expect(events[0].sessionId).toBe(session.id);
      expect(events[0].threadId).toBe(thread.id);
    });

    it('does not fail when no event callbacks are set', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'Comment',
          author: { type: 'human', name: 'user' },
        },
      );

      // No callbacks set — should not throw
      await expect(
        service.submitSession(session.id, 'approve', 'OK'),
      ).resolves.toBeDefined();
    });
  });

  describe('schema versioning', () => {
    it('creates sessions with schemaVersion 1', async () => {
      const session = await service.startSession('test-feature', 'feature');
      expect(session.schemaVersion).toBe(1);
    });

    it('creates index with schemaVersion 1', async () => {
      await service.startSession('test-feature', 'feature');

      const indexPath = path.join(
        tempDir,
        '.hive',
        'features',
        'test-feature',
        'reviews',
        'index.json',
      );
      const index = JSON.parse(
        fs.readFileSync(indexPath, 'utf-8'),
      ) as ReviewIndex;
      expect(index.schemaVersion).toBe(1);
    });
  });

  describe('timestamps', () => {
    it('sets createdAt and updatedAt on session creation', async () => {
      const before = new Date().toISOString();
      const session = await service.startSession('test-feature', 'feature');
      const after = new Date().toISOString();

      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
      expect(session.createdAt >= before).toBe(true);
      expect(session.createdAt <= after).toBe(true);
    });

    it('updates updatedAt when adding thread', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const originalUpdatedAt = session.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      await service.addThread(session.id, 'entity-1', null, range, {
        type: 'comment',
        body: 'Test',
        author: { type: 'human', name: 'test' },
      });

      const updated = await service.getSession(session.id);
      expect(updated!.updatedAt >= originalUpdatedAt).toBe(true);
    });

    it('sets createdAt and updatedAt on thread', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'Test',
          author: { type: 'human', name: 'test' },
        },
      );

      expect(thread.createdAt).toBeDefined();
      expect(thread.updatedAt).toBeDefined();
    });

    it('sets createdAt and updatedAt on annotation', async () => {
      const session = await service.startSession('test-feature', 'feature');
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 1, character: 0 },
      };

      const thread = await service.addThread(
        session.id,
        'entity-1',
        null,
        range,
        {
          type: 'comment',
          body: 'Test',
          author: { type: 'human', name: 'test' },
        },
      );

      expect(thread.annotations[0].createdAt).toBeDefined();
      expect(thread.annotations[0].updatedAt).toBeDefined();
    });
  });
});
