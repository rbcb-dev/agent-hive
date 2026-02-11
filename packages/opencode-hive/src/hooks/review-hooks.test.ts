/**
 * Unit tests for review lifecycle event hooks.
 *
 * Tests:
 * - ReviewEventEmitter emits events correctly
 * - Event handlers receive correct payloads
 * - Handlers are fire-and-forget (errors don't propagate)
 * - createReviewHooks wires up the system prompt hint for unresolved comments
 * - plan.revised logs audit trail
 * - review.submitted updates session status observation
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ReviewEventEmitter,
  type ReviewLifecycleEvent,
  type PlanCommentedPayload,
  type PlanApprovedPayload,
  type PlanRevisedPayload,
  type ReviewSubmittedPayload,
  type ReviewThreadResolvedPayload,
  createReviewHooks,
} from './review-hooks.js';

describe('ReviewEventEmitter', () => {
  let emitter: ReviewEventEmitter;

  beforeEach(() => {
    emitter = new ReviewEventEmitter();
  });

  it('emits plan.commented event with correct payload', () => {
    const received: PlanCommentedPayload[] = [];

    emitter.on('plan.commented', (payload) => {
      received.push(payload);
    });

    const payload: PlanCommentedPayload = {
      feature: 'my-feature',
      commentId: 'comment-123',
      unresolvedCount: 3,
    };

    emitter.emit('plan.commented', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);
  });

  it('emits plan.approved event with correct payload', () => {
    const received: PlanApprovedPayload[] = [];

    emitter.on('plan.approved', (payload) => {
      received.push(payload);
    });

    const payload: PlanApprovedPayload = {
      feature: 'my-feature',
      approvedAt: '2026-01-01T00:00:00.000Z',
    };

    emitter.emit('plan.approved', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);
  });

  it('emits plan.revised event with correct payload', () => {
    const received: PlanRevisedPayload[] = [];

    emitter.on('plan.revised', (payload) => {
      received.push(payload);
    });

    const payload: PlanRevisedPayload = {
      feature: 'my-feature',
      previousCommentCount: 5,
    };

    emitter.emit('plan.revised', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);
  });

  it('emits review.submitted event with correct payload', () => {
    const received: ReviewSubmittedPayload[] = [];

    emitter.on('review.submitted', (payload) => {
      received.push(payload);
    });

    const payload: ReviewSubmittedPayload = {
      feature: 'my-feature',
      sessionId: 'session-abc',
      verdict: 'approve',
      status: 'approved',
    };

    emitter.emit('review.submitted', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);
  });

  it('emits review.thread.resolved event with correct payload', () => {
    const received: ReviewThreadResolvedPayload[] = [];

    emitter.on('review.thread.resolved', (payload) => {
      received.push(payload);
    });

    const payload: ReviewThreadResolvedPayload = {
      feature: 'my-feature',
      sessionId: 'session-abc',
      threadId: 'thread-123',
    };

    emitter.emit('review.thread.resolved', payload);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(payload);
  });

  it('supports multiple listeners on the same event', () => {
    let count = 0;

    emitter.on('plan.commented', () => {
      count++;
    });

    emitter.on('plan.commented', () => {
      count++;
    });

    emitter.emit('plan.commented', {
      feature: 'my-feature',
      commentId: 'c1',
      unresolvedCount: 1,
    });

    expect(count).toBe(2);
  });

  it('does not propagate errors from handlers (fire-and-forget)', () => {
    const received: string[] = [];

    emitter.on('plan.commented', () => {
      throw new Error('Handler error - should not propagate');
    });

    emitter.on('plan.commented', (payload) => {
      received.push(payload.commentId);
    });

    // Should not throw, even though first handler throws
    expect(() => {
      emitter.emit('plan.commented', {
        feature: 'my-feature',
        commentId: 'c1',
        unresolvedCount: 1,
      });
    }).not.toThrow();

    // Second handler should still run
    expect(received).toEqual(['c1']);
  });

  it('handles emit with no listeners without error', () => {
    expect(() => {
      emitter.emit('plan.approved', {
        feature: 'my-feature',
        approvedAt: '2026-01-01T00:00:00.000Z',
      });
    }).not.toThrow();
  });

  it('off removes a listener', () => {
    let count = 0;
    const handler = () => {
      count++;
    };

    emitter.on('plan.commented', handler);
    emitter.emit('plan.commented', {
      feature: 'f',
      commentId: 'c',
      unresolvedCount: 0,
    });
    expect(count).toBe(1);

    emitter.off('plan.commented', handler);
    emitter.emit('plan.commented', {
      feature: 'f',
      commentId: 'c',
      unresolvedCount: 0,
    });
    expect(count).toBe(1); // Should not have incremented
  });
});

describe('createReviewHooks', () => {
  it('registers plan.commented handler that logs unresolved count', () => {
    const emitter = new ReviewEventEmitter();
    const logs: string[] = [];

    createReviewHooks(emitter, {
      log: (msg: string) => logs.push(msg),
    });

    emitter.emit('plan.commented', {
      feature: 'my-feature',
      commentId: 'c1',
      unresolvedCount: 3,
    });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.includes('3'))).toBe(true);
    expect(logs.some((l) => l.includes('my-feature'))).toBe(true);
  });

  it('registers plan.revised handler that logs audit trail', () => {
    const emitter = new ReviewEventEmitter();
    const logs: string[] = [];

    createReviewHooks(emitter, {
      log: (msg: string) => logs.push(msg),
    });

    emitter.emit('plan.revised', {
      feature: 'my-feature',
      previousCommentCount: 5,
    });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.includes('revised'))).toBe(true);
    expect(logs.some((l) => l.includes('my-feature'))).toBe(true);
  });

  it('registers review.submitted handler that logs status', () => {
    const emitter = new ReviewEventEmitter();
    const logs: string[] = [];

    createReviewHooks(emitter, {
      log: (msg: string) => logs.push(msg),
    });

    emitter.emit('review.submitted', {
      feature: 'my-feature',
      sessionId: 'session-abc',
      verdict: 'approve',
      status: 'approved',
    });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.includes('submitted'))).toBe(true);
    expect(logs.some((l) => l.includes('session-abc'))).toBe(true);
  });

  it('uses console.log by default when no logger provided', () => {
    const emitter = new ReviewEventEmitter();

    // Should not throw when creating with default logger
    expect(() => createReviewHooks(emitter)).not.toThrow();
  });
});
