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
 * - review.submitted: A review session was submitted
 * - review.thread.resolved: A review thread was resolved
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

// ============================================================================
// Event map
// ============================================================================

export interface ReviewLifecycleEventMap {
  'plan.commented': PlanCommentedPayload;
  'plan.approved': PlanApprovedPayload;
  'plan.revised': PlanRevisedPayload;
  'review.submitted': ReviewSubmittedPayload;
  'review.thread.resolved': ReviewThreadResolvedPayload;
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
 * - plan.revised: logs plan revision for audit trail
 * - review.submitted: logs review session status update
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
}
