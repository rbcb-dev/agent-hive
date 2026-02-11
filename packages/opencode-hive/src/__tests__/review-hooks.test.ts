import { describe, test, expect, beforeEach } from 'bun:test';
import {
  ReviewEventEmitter,
  createReviewHooks,
} from '../hooks/review-hooks.js';
import type {
  PlanCommentResolvedPayload,
  PlanCommentUnresolvedPayload,
  PlanCommentDeletedPayload,
  ReviewThreadCreatedPayload,
  ReviewThreadUnresolvedPayload,
  ReviewThreadDeletedPayload,
  ReviewAnnotationEditedPayload,
} from '../hooks/review-hooks.js';

/**
 * Tests for extended review lifecycle events.
 *
 * Validates that new event types are properly defined and
 * that emitter + hook handlers work correctly for:
 * - plan.comment.resolved
 * - plan.comment.unresolved
 * - plan.comment.deleted
 * - review.thread.created
 * - review.thread.unresolved
 * - review.thread.deleted
 * - review.annotation.edited
 */

describe('ReviewEventEmitter new event types', () => {
  let emitter: ReviewEventEmitter;

  beforeEach(() => {
    emitter = new ReviewEventEmitter();
  });

  test('emits plan.comment.resolved with feature and commentId', () => {
    let received: PlanCommentResolvedPayload | null = null;
    emitter.on('plan.comment.resolved', (payload) => {
      received = payload;
    });

    emitter.emit('plan.comment.resolved', {
      feature: 'my-feature',
      commentId: 'c-123',
    });

    expect(received).toEqual({
      feature: 'my-feature',
      commentId: 'c-123',
    });
  });

  test('emits plan.comment.unresolved with feature and commentId', () => {
    let received: PlanCommentUnresolvedPayload | null = null;
    emitter.on('plan.comment.unresolved', (payload) => {
      received = payload;
    });

    emitter.emit('plan.comment.unresolved', {
      feature: 'my-feature',
      commentId: 'c-456',
    });

    expect(received).toEqual({
      feature: 'my-feature',
      commentId: 'c-456',
    });
  });

  test('emits plan.comment.deleted with feature and commentId', () => {
    let received: PlanCommentDeletedPayload | null = null;
    emitter.on('plan.comment.deleted', (payload) => {
      received = payload;
    });

    emitter.emit('plan.comment.deleted', {
      feature: 'my-feature',
      commentId: 'c-789',
    });

    expect(received).toEqual({
      feature: 'my-feature',
      commentId: 'c-789',
    });
  });

  test('emits review.thread.created with full payload', () => {
    let received: ReviewThreadCreatedPayload | null = null;
    emitter.on('review.thread.created', (payload) => {
      received = payload;
    });

    emitter.emit('review.thread.created', {
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-1',
      uri: 'src/main.ts',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      },
    });

    expect(received).toEqual({
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-1',
      uri: 'src/main.ts',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      },
    });
  });

  test('emits review.thread.unresolved with feature, sessionId, threadId', () => {
    let received: ReviewThreadUnresolvedPayload | null = null;
    emitter.on('review.thread.unresolved', (payload) => {
      received = payload;
    });

    emitter.emit('review.thread.unresolved', {
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-2',
    });

    expect(received).toEqual({
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-2',
    });
  });

  test('emits review.thread.deleted with feature, sessionId, threadId', () => {
    let received: ReviewThreadDeletedPayload | null = null;
    emitter.on('review.thread.deleted', (payload) => {
      received = payload;
    });

    emitter.emit('review.thread.deleted', {
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-3',
    });

    expect(received).toEqual({
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-3',
    });
  });

  test('emits review.annotation.edited with full payload', () => {
    let received: ReviewAnnotationEditedPayload | null = null;
    emitter.on('review.annotation.edited', (payload) => {
      received = payload;
    });

    emitter.emit('review.annotation.edited', {
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-4',
      annotationId: 'a-1',
    });

    expect(received).toEqual({
      feature: 'my-feature',
      sessionId: 's-1',
      threadId: 't-4',
      annotationId: 'a-1',
    });
  });
});

describe('createReviewHooks registers handlers for new events', () => {
  let emitter: ReviewEventEmitter;
  let logs: string[];

  beforeEach(() => {
    emitter = new ReviewEventEmitter();
    logs = [];
    const logger = { log: (msg: string) => logs.push(msg) };
    createReviewHooks(emitter, logger);
  });

  test('plan.comment.resolved logs comment resolution', () => {
    emitter.emit('plan.comment.resolved', {
      feature: 'test-feat',
      commentId: 'c-1',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('plan.comment.resolved');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('c-1');
  });

  test('plan.comment.unresolved logs comment unresolve', () => {
    emitter.emit('plan.comment.unresolved', {
      feature: 'test-feat',
      commentId: 'c-2',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('plan.comment.unresolved');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('c-2');
  });

  test('plan.comment.deleted logs comment deletion', () => {
    emitter.emit('plan.comment.deleted', {
      feature: 'test-feat',
      commentId: 'c-3',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('plan.comment.deleted');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('c-3');
  });

  test('review.thread.created logs thread creation with uri', () => {
    emitter.emit('review.thread.created', {
      feature: 'test-feat',
      sessionId: 's-1',
      threadId: 't-1',
      uri: 'src/foo.ts',
      range: {
        start: { line: 5, character: 0 },
        end: { line: 10, character: 0 },
      },
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('review.thread.created');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('t-1');
    expect(logs[0]).toContain('src/foo.ts');
  });

  test('review.thread.unresolved logs thread unresolve', () => {
    emitter.emit('review.thread.unresolved', {
      feature: 'test-feat',
      sessionId: 's-1',
      threadId: 't-2',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('review.thread.unresolved');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('t-2');
  });

  test('review.thread.deleted logs thread deletion', () => {
    emitter.emit('review.thread.deleted', {
      feature: 'test-feat',
      sessionId: 's-1',
      threadId: 't-3',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('review.thread.deleted');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('t-3');
  });

  test('review.annotation.edited logs annotation edit', () => {
    emitter.emit('review.annotation.edited', {
      feature: 'test-feat',
      sessionId: 's-1',
      threadId: 't-4',
      annotationId: 'a-1',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('review.annotation.edited');
    expect(logs[0]).toContain('test-feat');
    expect(logs[0]).toContain('a-1');
  });

  test('existing events still work (plan.commented)', () => {
    emitter.emit('plan.commented', {
      feature: 'test-feat',
      commentId: 'c-x',
      unresolvedCount: 3,
    });

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('3 unresolved');
  });
});
