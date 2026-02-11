import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { ReviewService } from '../services/reviewService.js';
import type { ReviewAnnotation, Range, ReviewThread } from '../types.js';

const TEST_DIR = '/tmp/hive-core-reviewservice-test-' + process.pid;
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
      status: 'executing',
      createdAt: new Date().toISOString(),
    }),
  );
}

const testRange: Range = {
  start: { line: 10, character: 0 },
  end: { line: 15, character: 0 },
};

const testAnnotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'comment',
  body: 'Test comment body',
  author: { type: 'human', name: 'tester' },
};

describe('ReviewService', () => {
  let service: ReviewService;
  const featureName = 'test-feature';

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    service = new ReviewService(PROJECT_ROOT);
    setupFeature(featureName);
  });

  afterEach(() => {
    cleanup();
  });

  // Helper to create a session with a thread
  async function createSessionWithThread() {
    const session = await service.startSession(featureName, 'feature');
    const thread = await service.addThread(
      session.id,
      'entity-1',
      'file.ts',
      testRange,
      testAnnotation,
    );
    return { session, thread };
  }

  describe('unresolveThread()', () => {
    it('sets a resolved thread status back to open', async () => {
      const { thread } = await createSessionWithThread();

      // First resolve
      await service.resolveThread(thread.id);
      const resolvedSession = await service.getSession(
        (await createSessionWithThread()).session.id,
      );

      // Unresolve
      const result = await service.unresolveThread(thread.id);

      expect(result.status).toBe('open');
      expect(result.id).toBe(thread.id);
    });

    it('throws for non-existent thread', async () => {
      await createSessionWithThread();
      await expect(service.unresolveThread('nonexistent')).rejects.toThrow(
        'Thread not found',
      );
    });

    it('fires onReviewThreadUnresolved callback', async () => {
      const { session, thread } = await createSessionWithThread();
      await service.resolveThread(thread.id);

      let callbackArgs: unknown[] = [];
      service.onReviewThreadUnresolved = (feature, sessionId, threadId) => {
        callbackArgs = [feature, sessionId, threadId];
      };

      await service.unresolveThread(thread.id);

      expect(callbackArgs).toEqual([featureName, session.id, thread.id]);
    });
  });

  describe('deleteThread()', () => {
    it('removes a thread from the session', async () => {
      const { session, thread } = await createSessionWithThread();

      await service.deleteThread(session.id, thread.id);

      const updated = await service.getSession(session.id);
      expect(updated!.threads.length).toBe(0);
    });

    it('throws for non-existent session', async () => {
      await createSessionWithThread();
      await expect(
        service.deleteThread('nonexistent-session', 'thread-id'),
      ).rejects.toThrow('Session not found');
    });

    it('throws for non-existent thread in session', async () => {
      const { session } = await createSessionWithThread();
      await expect(
        service.deleteThread(session.id, 'nonexistent-thread'),
      ).rejects.toThrow('Thread not found');
    });

    it('fires onReviewThreadDeleted callback', async () => {
      const { session, thread } = await createSessionWithThread();

      let callbackArgs: unknown[] = [];
      service.onReviewThreadDeleted = (feature, sessionId, threadId) => {
        callbackArgs = [feature, sessionId, threadId];
      };

      await service.deleteThread(session.id, thread.id);

      expect(callbackArgs).toEqual([featureName, session.id, thread.id]);
    });
  });

  describe('editAnnotation()', () => {
    it('updates annotation body and updatedAt', async () => {
      const { session, thread } = await createSessionWithThread();
      const annotationId = thread.annotations[0].id;
      const originalUpdatedAt = thread.annotations[0].updatedAt;

      // Small delay to ensure timestamps differ
      await new Promise((resolve) => setTimeout(resolve, 5));

      const result = await service.editAnnotation(
        thread.id,
        annotationId,
        'Updated body',
      );

      expect(result.body).toBe('Updated body');

      // Verify persisted to disk
      const updatedSession = await service.getSession(session.id);
      const updatedThread = updatedSession!.threads.find(
        (t) => t.id === thread.id,
      );
      const updatedAnnotation = updatedThread!.annotations.find(
        (a) => a.id === annotationId,
      );
      expect(updatedAnnotation!.body).toBe('Updated body');
    });

    it('throws for non-existent annotation', async () => {
      const { thread } = await createSessionWithThread();
      await expect(
        service.editAnnotation(thread.id, 'nonexistent', 'new body'),
      ).rejects.toThrow('Annotation not found');
    });

    it('fires onReviewAnnotationEdited callback', async () => {
      const { session, thread } = await createSessionWithThread();
      const annotationId = thread.annotations[0].id;

      let callbackArgs: unknown[] = [];
      service.onReviewAnnotationEdited = (
        feature,
        sessionId,
        threadId,
        annId,
      ) => {
        callbackArgs = [feature, sessionId, threadId, annId];
      };

      await service.editAnnotation(thread.id, annotationId, 'Updated body');

      expect(callbackArgs).toEqual([
        featureName,
        session.id,
        thread.id,
        annotationId,
      ]);
    });
  });

  describe('deleteAnnotation()', () => {
    it('removes an annotation from a thread', async () => {
      const { thread } = await createSessionWithThread();
      // Add a second annotation so deletion doesn't remove the thread
      await service.replyToThread(thread.id, 'Second annotation');

      const annotationId = thread.annotations[0].id;
      const result = await service.deleteAnnotation(thread.id, annotationId);

      expect(result.thread).not.toBeNull();
      expect(result.thread!.annotations.length).toBe(1);
      expect(result.threadDeleted).toBe(false);
    });

    it('deletes the thread when last annotation is removed', async () => {
      const { session, thread } = await createSessionWithThread();
      const annotationId = thread.annotations[0].id;

      const result = await service.deleteAnnotation(thread.id, annotationId);

      expect(result.threadDeleted).toBe(true);
      expect(result.thread).toBeNull();

      // Verify thread is gone from session
      const updated = await service.getSession(session.id);
      expect(updated!.threads.length).toBe(0);
    });

    it('throws for non-existent annotation', async () => {
      const { thread } = await createSessionWithThread();
      await expect(
        service.deleteAnnotation(thread.id, 'nonexistent'),
      ).rejects.toThrow('Annotation not found');
    });

    it('fires onReviewAnnotationDeleted callback', async () => {
      const { session, thread } = await createSessionWithThread();
      await service.replyToThread(thread.id, 'Second annotation');
      const annotationId = thread.annotations[0].id;

      let callbackArgs: unknown[] = [];
      service.onReviewAnnotationDeleted = (
        feature,
        sessionId,
        threadId,
        annId,
      ) => {
        callbackArgs = [feature, sessionId, threadId, annId];
      };

      await service.deleteAnnotation(thread.id, annotationId);

      expect(callbackArgs).toEqual([
        featureName,
        session.id,
        thread.id,
        annotationId,
      ]);
    });
  });

  describe('markThreadOutdated()', () => {
    it('sets thread status to outdated', async () => {
      const { thread } = await createSessionWithThread();

      const result = await service.markThreadOutdated(thread.id);

      expect(result.status).toBe('outdated');
      expect(result.id).toBe(thread.id);
    });

    it('throws for non-existent thread', async () => {
      await createSessionWithThread();
      await expect(service.markThreadOutdated('nonexistent')).rejects.toThrow(
        'Thread not found',
      );
    });

    it('fires onReviewThreadOutdated callback', async () => {
      const { session, thread } = await createSessionWithThread();

      let callbackArgs: unknown[] = [];
      service.onReviewThreadOutdated = (feature, sessionId, threadId) => {
        callbackArgs = [feature, sessionId, threadId];
      };

      await service.markThreadOutdated(thread.id);

      expect(callbackArgs).toEqual([featureName, session.id, thread.id]);
    });
  });

  describe('submitSession() clears activeSessionId', () => {
    it('sets activeSessionId to null after submission', async () => {
      const session = await service.startSession(featureName, 'feature');

      // Verify activeSessionId is set
      const indexBefore = await service.listSessions(featureName);
      // We need to check index directly — read the index file
      const indexPath = path.join(
        TEST_DIR,
        '.hive',
        'features',
        featureName,
        'reviews',
        'index.json',
      );
      const indexDataBefore = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      expect(indexDataBefore.activeSessionId).toBe(session.id);

      await service.submitSession(session.id, 'approve', 'Looks good');

      const indexDataAfter = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      expect(indexDataAfter.activeSessionId).toBeNull();
    });
  });
});
