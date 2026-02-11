/**
 * Review lifecycle event hooks for observability.
 *
 * This module provides a typed event emitter for review lifecycle events
 * and hook implementations that log events for audit trail purposes.
 *
 * Events:
 * - plan.commented: A comment was added to a plan
 * - plan.approved: A plan was approved
 * - plan.revised: A plan was revised (rewritten)
 * - plan.comment.resolved: A plan comment was resolved
 * - plan.comment.unresolved: A plan comment was unresolved (reopened)
 * - plan.comment.deleted: A plan comment was deleted
 * - review.submitted: A review session was submitted
 * - review.thread.resolved: A review thread was resolved
 * - review.thread.created: A review thread was created
 * - review.thread.unresolved: A review thread was unresolved (reopened)
 * - review.thread.deleted: A review thread was deleted
 * - review.annotation.edited: A review annotation was edited
 *
 * All hooks are fire-and-forget — errors in handlers do not propagate.
 */

// ============================================================================
// Event payload types
// ============================================================================

export interface PlanCommentedPayload {
  feature: string;
  commentId: string;
  unresolvedCount: number;
}

export interface PlanApprovedPayload {
  feature: string;
  approvedAt: string;
}

export interface PlanRevisedPayload {
  feature: string;
  previousCommentCount: number;
}

export interface ReviewSubmittedPayload {
  feature: string;
  sessionId: string;
  verdict: string;
  status: string;
}

export interface ReviewThreadResolvedPayload {
  feature: string;
  sessionId: string;
  threadId: string;
}

export interface PlanCommentResolvedPayload {
  feature: string;
  commentId: string;
}

export interface PlanCommentUnresolvedPayload {
  feature: string;
  commentId: string;
}

export interface PlanCommentDeletedPayload {
  feature: string;
  commentId: string;
}

export interface ReviewThreadCreatedPayload {
  feature: string;
  sessionId: string;
  threadId: string;
  uri: string | null;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface ReviewThreadUnresolvedPayload {
  feature: string;
  sessionId: string;
  threadId: string;
}

export interface ReviewThreadDeletedPayload {
  feature: string;
  sessionId: string;
  threadId: string;
}

export interface ReviewAnnotationEditedPayload {
  feature: string;
  sessionId: string;
  threadId: string;
  annotationId: string;
}

// ============================================================================
// Event map
// ============================================================================

export interface ReviewLifecycleEventMap {
  'plan.commented': PlanCommentedPayload;
  'plan.approved': PlanApprovedPayload;
  'plan.revised': PlanRevisedPayload;
  'plan.comment.resolved': PlanCommentResolvedPayload;
  'plan.comment.unresolved': PlanCommentUnresolvedPayload;
  'plan.comment.deleted': PlanCommentDeletedPayload;
  'review.submitted': ReviewSubmittedPayload;
  'review.thread.resolved': ReviewThreadResolvedPayload;
  'review.thread.created': ReviewThreadCreatedPayload;
  'review.thread.unresolved': ReviewThreadUnresolvedPayload;
  'review.thread.deleted': ReviewThreadDeletedPayload;
  'review.annotation.edited': ReviewAnnotationEditedPayload;
}

export type ReviewLifecycleEvent = keyof ReviewLifecycleEventMap;

// ============================================================================
// Event emitter
// ============================================================================

type Handler<T> = (payload: T) => void;

/**
 * Typed event emitter for review lifecycle events.
 *
 * Fire-and-forget semantics: errors in handlers are caught and logged
 * but never propagated to the caller.
 */
export class ReviewEventEmitter {
  private listeners = new Map<string, Set<Handler<any>>>();

  on<E extends ReviewLifecycleEvent>(
    event: E,
    handler: Handler<ReviewLifecycleEventMap[E]>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<E extends ReviewLifecycleEvent>(
    event: E,
    handler: Handler<ReviewLifecycleEventMap[E]>,
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered listeners.
   * Errors in individual handlers are caught and logged — they do not
   * prevent other handlers from running or propagate to the caller.
   */
  emit<E extends ReviewLifecycleEvent>(
    event: E,
    payload: ReviewLifecycleEventMap[E],
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.warn(
          `[hive:review-hooks] Error in ${event} handler:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }
}

// ============================================================================
// Hook registration
// ============================================================================

interface Logger {
  log: (message: string) => void;
}

const defaultLogger: Logger = {
  log: (message: string) => console.log(message),
};

/**
 * Create and register review lifecycle hooks on the emitter.
 *
 * Hooks registered:
 * - plan.commented: logs unresolved comment count hint
 * - plan.approved: logs plan approval
 * - plan.revised: logs plan revision for audit trail
 * - plan.comment.resolved: logs comment resolution
 * - plan.comment.unresolved: logs comment unresolve
 * - plan.comment.deleted: logs comment deletion
 * - review.submitted: logs review session status update
 * - review.thread.resolved: logs thread resolution
 * - review.thread.created: logs thread creation
 * - review.thread.unresolved: logs thread unresolve
 * - review.thread.deleted: logs thread deletion
 * - review.annotation.edited: logs annotation edit
 *
 * @param emitter - The ReviewEventEmitter to register hooks on
 * @param logger - Optional logger (defaults to console.log)
 */
export function createReviewHooks(
  emitter: ReviewEventEmitter,
  logger: Logger = defaultLogger,
): void {
  // On plan.commented: log system prompt hint about unresolved comments count
  emitter.on('plan.commented', (payload) => {
    logger.log(
      `[hive:review] Plan commented on feature "${payload.feature}" ` +
        `(comment ${payload.commentId}): ${payload.unresolvedCount} unresolved comment(s)`,
    );
  });

  // On plan.revised: log plan revision for audit trail
  emitter.on('plan.revised', (payload) => {
    logger.log(
      `[hive:review] Plan revised for feature "${payload.feature}" ` +
        `(${payload.previousCommentCount} comments cleared)`,
    );
  });

  // On review.submitted: log review session status update
  emitter.on('review.submitted', (payload) => {
    logger.log(
      `[hive:review] Review submitted for feature "${payload.feature}" ` +
        `session ${payload.sessionId}: verdict=${payload.verdict}, status=${payload.status}`,
    );
  });

  // On plan.approved: log approval event
  emitter.on('plan.approved', (payload) => {
    logger.log(
      `[hive:review] Plan approved for feature "${payload.feature}" ` +
        `at ${payload.approvedAt}`,
    );
  });

  // On review.thread.resolved: log thread resolution
  emitter.on('review.thread.resolved', (payload) => {
    logger.log(
      `[hive:review] Thread ${payload.threadId} resolved in session ` +
        `${payload.sessionId} for feature "${payload.feature}"`,
    );
  });

  // On plan.comment.resolved: log comment resolution
  emitter.on('plan.comment.resolved', (payload) => {
    logger.log(
      `[hive:review] plan.comment.resolved — comment ${payload.commentId} ` +
        `resolved for feature "${payload.feature}"`,
    );
  });

  // On plan.comment.unresolved: log comment unresolve
  emitter.on('plan.comment.unresolved', (payload) => {
    logger.log(
      `[hive:review] plan.comment.unresolved — comment ${payload.commentId} ` +
        `unresolved for feature "${payload.feature}"`,
    );
  });

  // On plan.comment.deleted: log comment deletion
  emitter.on('plan.comment.deleted', (payload) => {
    logger.log(
      `[hive:review] plan.comment.deleted — comment ${payload.commentId} ` +
        `deleted for feature "${payload.feature}"`,
    );
  });

  // On review.thread.created: log thread creation
  emitter.on('review.thread.created', (payload) => {
    logger.log(
      `[hive:review] review.thread.created — thread ${payload.threadId} ` +
        `created in session ${payload.sessionId} for feature "${payload.feature}" ` +
        `at ${payload.uri ?? '(no uri)'}`,
    );
  });

  // On review.thread.unresolved: log thread unresolve
  emitter.on('review.thread.unresolved', (payload) => {
    logger.log(
      `[hive:review] review.thread.unresolved — thread ${payload.threadId} ` +
        `unresolved in session ${payload.sessionId} for feature "${payload.feature}"`,
    );
  });

  // On review.thread.deleted: log thread deletion
  emitter.on('review.thread.deleted', (payload) => {
    logger.log(
      `[hive:review] review.thread.deleted — thread ${payload.threadId} ` +
        `deleted in session ${payload.sessionId} for feature "${payload.feature}"`,
    );
  });

  // On review.annotation.edited: log annotation edit
  emitter.on('review.annotation.edited', (payload) => {
    logger.log(
      `[hive:review] review.annotation.edited — annotation ${payload.annotationId} ` +
        `in thread ${payload.threadId} edited for feature "${payload.feature}"`,
    );
  });
}
