/**
 * Review tools for Hive code review workflow.
 *
 * Provides user-facing tools for managing review sessions, threads, and annotations.
 *
 * Tools:
 * - hive_review_start: Start a new review session
 * - hive_review_list: List review sessions for a feature
 * - hive_review_get: Get a specific review session
 * - hive_review_add_comment: Add a comment thread
 * - hive_review_suggest: Add a suggestion with replacement
 * - hive_review_reply: Reply to an existing thread
 * - hive_review_resolve: Resolve a thread
 * - hive_review_unresolve: Unresolve a thread
 * - hive_review_delete_thread: Delete a thread from a session
 * - hive_review_edit: Edit an annotation's body
 * - hive_review_mark_applied: Mark a suggestion as applied
 * - hive_review_submit: Submit review with verdict
 * - hive_plan_comment_resolve: Resolve a plan comment
 * - hive_plan_comment_reply: Reply to a plan comment
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import type { ReviewService, PlanService } from 'hive-core';
import type {
  ReviewScope,
  ReviewVerdict,
  AnnotationType,
  Range,
  ReviewIndex,
  ReviewConfig,
  ReviewSession,
} from 'hive-core';
import { DEFAULT_REVIEW_CONFIG } from 'hive-core';

/**
 * Options for creating review tools.
 */
export interface ReviewToolsOptions {
  /** The ReviewService instance for review lifecycle */
  reviewService: ReviewService;
  /** Function to resolve feature name from explicit or context */
  resolveFeature: (explicit?: string) => string | null;
}

/**
 * Create review tools.
 *
 * @param reviewService - The ReviewService instance for review lifecycle
 * @param resolveFeature - Function to resolve feature name
 * @param reviewConfig - Optional review configuration (defaults to DEFAULT_REVIEW_CONFIG)
 * @param planService - Optional PlanService instance for plan comment tools
 */
export function createReviewTools(
  reviewService: ReviewService,
  resolveFeature: (explicit?: string) => string | null,
  reviewConfig: ReviewConfig = DEFAULT_REVIEW_CONFIG,
  planService?: PlanService,
): {
  hive_review_start: ToolDefinition;
  hive_review_list: ToolDefinition;
  hive_review_get: ToolDefinition;
  hive_review_add_comment: ToolDefinition;
  hive_review_suggest: ToolDefinition;
  hive_review_reply: ToolDefinition;
  hive_review_resolve: ToolDefinition;
  hive_review_unresolve: ToolDefinition;
  hive_review_delete_thread: ToolDefinition;
  hive_review_edit: ToolDefinition;
  hive_review_mark_applied: ToolDefinition;
  hive_review_submit: ToolDefinition;
  hive_plan_comment_resolve: ToolDefinition;
  hive_plan_comment_reply: ToolDefinition;
} {
  /**
   * Get active session ID for a feature.
   */
  async function getActiveSessionId(feature: string): Promise<string | null> {
    const sessions = await reviewService.listSessions(feature);
    // Find the most recent in_progress session
    const activeSession = sessions.find((s) => s.status === 'in_progress');
    return activeSession?.id || null;
  }

  /**
   * Get the configured parallelReviewers limit
   */
  function getParallelReviewersLimit(): number {
    return (
      reviewConfig.parallelReviewers ??
      DEFAULT_REVIEW_CONFIG.parallelReviewers ??
      1
    );
  }

  return {
    /**
     * Start a new review session.
     */
    hive_review_start: tool({
      description: 'Start a new code review session for a feature or task',
      args: {
        feature: tool.schema
          .string()
          .optional()
          .describe('Feature name (defaults to active feature)'),
        scope: tool.schema
          .enum(['feature', 'task', 'context', 'plan', 'code'])
          .optional()
          .describe('Review scope (default: feature)'),
        baseRef: tool.schema
          .string()
          .optional()
          .describe('Base git ref (default: main)'),
        headRef: tool.schema
          .string()
          .optional()
          .describe('Head git ref (default: HEAD)'),
        reviewer: tool.schema
          .string()
          .optional()
          .describe('Reviewer agent ID (e.g., "hygienic-reviewer")'),
        sessionId: tool.schema
          .string()
          .optional()
          .describe('Existing session ID to add reviewer to'),
      },
      async execute({
        feature: explicitFeature,
        scope = 'feature',
        baseRef,
        headRef,
        reviewer,
        sessionId,
      }): Promise<string> {
        const feature = resolveFeature(explicitFeature);
        if (!feature) {
          return 'Error: No feature specified. Create a feature or provide feature param.';
        }

        try {
          // If sessionId is provided, add reviewer to existing session
          if (sessionId && reviewer) {
            const existingSession = await reviewService.getSession(sessionId);
            if (!existingSession) {
              return `Error: Session "${sessionId}" not found`;
            }

            const currentReviewers = existingSession.reviewers || [];
            const limit = getParallelReviewersLimit();

            // Check if limit would be exceeded
            if (currentReviewers.length >= limit) {
              return `Error: Maximum parallel reviewers (${limit}) reached. Cannot add more reviewers.`;
            }

            // Check if reviewer already exists
            if (!currentReviewers.includes(reviewer)) {
              existingSession.reviewers = [...currentReviewers, reviewer];
              existingSession.updatedAt = new Date().toISOString();
              await reviewService.updateSession(existingSession);
            }

            return JSON.stringify(existingSession, null, 2);
          }

          // Create new session
          const session = await reviewService.startSession(
            feature,
            scope as ReviewScope,
            baseRef,
            headRef,
          );

          // Add reviewer if specified
          if (reviewer) {
            session.reviewers = [reviewer];
            await reviewService.updateSession(session);
          }

          return JSON.stringify(session, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to start review session'}`;
        }
      },
    }),

    /**
     * List review sessions for a feature.
     */
    hive_review_list: tool({
      description: 'List all review sessions for a feature',
      args: {
        feature: tool.schema
          .string()
          .optional()
          .describe('Feature name (defaults to active feature)'),
      },
      async execute({ feature: explicitFeature }): Promise<string> {
        const feature = resolveFeature(explicitFeature);
        if (!feature) {
          return 'Error: No feature specified. Create a feature or provide feature param.';
        }

        try {
          const sessions = await reviewService.listSessions(feature);
          return JSON.stringify(sessions, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to list review sessions'}`;
        }
      },
    }),

    /**
     * Get a specific review session.
     */
    hive_review_get: tool({
      description: 'Get details of a specific review session',
      args: {
        sessionId: tool.schema.string().describe('Review session ID'),
      },
      async execute({ sessionId }): Promise<string> {
        try {
          const session = await reviewService.getSession(sessionId);
          if (!session) {
            return `Error: Session "${sessionId}" not found`;
          }
          return JSON.stringify(session, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to get review session'}`;
        }
      },
    }),

    /**
     * Add a comment thread to a review session.
     */
    hive_review_add_comment: tool({
      description: 'Add a comment or question to a review session',
      args: {
        sessionId: tool.schema
          .string()
          .optional()
          .describe('Review session ID (defaults to active session)'),
        entityId: tool.schema
          .string()
          .describe('Entity being reviewed (feature, task, file path)'),
        uri: tool.schema
          .string()
          .optional()
          .describe('File URI for code reviews'),
        range: tool.schema
          .object({
            start: tool.schema
              .object({
                line: tool.schema.number().describe('Start line (0-based)'),
                character: tool.schema
                  .number()
                  .describe('Start character (0-based)'),
              })
              .describe('Start position'),
            end: tool.schema
              .object({
                line: tool.schema.number().describe('End line (0-based)'),
                character: tool.schema
                  .number()
                  .describe('End character (0-based)'),
              })
              .describe('End position'),
          })
          .describe('Range of code being commented on'),
        type: tool.schema
          .enum(['comment', 'question', 'task', 'approval'])
          .describe('Annotation type'),
        body: tool.schema.string().describe('Comment body'),
        agentId: tool.schema
          .string()
          .optional()
          .describe('Agent ID for attribution (e.g., "hygienic-reviewer")'),
      },
      async execute({
        sessionId,
        entityId,
        uri,
        range,
        type,
        body,
        agentId,
      }): Promise<string> {
        try {
          // Resolve session ID
          let resolvedSessionId = sessionId;
          if (!resolvedSessionId) {
            const feature = resolveFeature();
            if (!feature) {
              return 'Error: No feature specified. Create a feature or provide sessionId.';
            }
            resolvedSessionId = await getActiveSessionId(feature);
            if (!resolvedSessionId) {
              return 'Error: No active review session. Start one with hive_review_start.';
            }
          }

          const thread = await reviewService.addThread(
            resolvedSessionId,
            entityId,
            uri || null,
            range as Range,
            {
              type: type as AnnotationType,
              body,
              author: { type: 'llm', name: 'Agent', agentId },
            },
          );
          return JSON.stringify(thread, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to add comment'}`;
        }
      },
    }),

    /**
     * Add a suggestion with code replacement.
     */
    hive_review_suggest: tool({
      description: 'Add a code suggestion with replacement text',
      args: {
        sessionId: tool.schema
          .string()
          .optional()
          .describe('Review session ID (defaults to active session)'),
        entityId: tool.schema
          .string()
          .describe('Entity being reviewed (feature, task, file path)'),
        uri: tool.schema
          .string()
          .optional()
          .describe('File URI for code reviews'),
        range: tool.schema
          .object({
            start: tool.schema
              .object({
                line: tool.schema.number().describe('Start line (0-based)'),
                character: tool.schema
                  .number()
                  .describe('Start character (0-based)'),
              })
              .describe('Start position'),
            end: tool.schema
              .object({
                line: tool.schema.number().describe('End line (0-based)'),
                character: tool.schema
                  .number()
                  .describe('End character (0-based)'),
              })
              .describe('End position'),
          })
          .describe('Range of code to replace'),
        body: tool.schema.string().describe('Suggestion explanation'),
        replacement: tool.schema.string().describe('Replacement code'),
        agentId: tool.schema
          .string()
          .optional()
          .describe('Agent ID for attribution (e.g., "hygienic-reviewer")'),
      },
      async execute({
        sessionId,
        entityId,
        uri,
        range,
        body,
        replacement,
        agentId,
      }): Promise<string> {
        try {
          // Resolve session ID
          let resolvedSessionId = sessionId;
          if (!resolvedSessionId) {
            const feature = resolveFeature();
            if (!feature) {
              return 'Error: No feature specified. Create a feature or provide sessionId.';
            }
            resolvedSessionId = await getActiveSessionId(feature);
            if (!resolvedSessionId) {
              return 'Error: No active review session. Start one with hive_review_start.';
            }
          }

          const thread = await reviewService.addThread(
            resolvedSessionId,
            entityId,
            uri || null,
            range as Range,
            {
              type: 'suggestion',
              body,
              author: { type: 'llm', name: 'Agent', agentId },
              suggestion: { replacement },
            },
          );
          return JSON.stringify(thread, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to add suggestion'}`;
        }
      },
    }),

    /**
     * Reply to an existing thread.
     */
    hive_review_reply: tool({
      description: 'Reply to an existing review thread',
      args: {
        threadId: tool.schema.string().describe('Thread ID to reply to'),
        body: tool.schema.string().describe('Reply body'),
        agentId: tool.schema
          .string()
          .optional()
          .describe('Agent ID for attribution (e.g., "hygienic-reviewer")'),
      },
      async execute({ threadId, body, agentId }): Promise<string> {
        try {
          const annotation = await reviewService.replyToThread(
            threadId,
            body,
            agentId,
          );
          return JSON.stringify(annotation, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Thread not found'}`;
        }
      },
    }),

    /**
     * Resolve a thread.
     */
    hive_review_resolve: tool({
      description: 'Mark a review thread as resolved',
      args: {
        threadId: tool.schema.string().describe('Thread ID to resolve'),
      },
      async execute({ threadId }): Promise<string> {
        try {
          const thread = await reviewService.resolveThread(threadId);
          return JSON.stringify(thread, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Thread not found'}`;
        }
      },
    }),

    /**
     * Submit a review with verdict.
     */
    hive_review_submit: tool({
      description:
        'Submit review with verdict (approve, request_changes, or comment)',
      args: {
        sessionId: tool.schema
          .string()
          .optional()
          .describe('Review session ID (defaults to active session)'),
        verdict: tool.schema
          .enum(['approve', 'request_changes', 'comment'])
          .describe('Review verdict'),
        summary: tool.schema.string().describe('Review summary'),
      },
      async execute({ sessionId, verdict, summary }): Promise<string> {
        try {
          // Resolve session ID
          let resolvedSessionId = sessionId;
          if (!resolvedSessionId) {
            const feature = resolveFeature();
            if (!feature) {
              return 'Error: No feature specified. Create a feature or provide sessionId.';
            }
            resolvedSessionId = await getActiveSessionId(feature);
            if (!resolvedSessionId) {
              return 'Error: No active review session. Start one with hive_review_start.';
            }
          }

          const session = await reviewService.submitSession(
            resolvedSessionId,
            verdict as ReviewVerdict,
            summary,
          );
          return JSON.stringify(session, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to submit review'}`;
        }
      },
    }),

    /**
     * Unresolve a thread — sets status back to 'open'.
     */
    hive_review_unresolve: tool({
      description: 'Reopen a resolved review thread (set status back to open)',
      args: {
        threadId: tool.schema.string().describe('Thread ID to unresolve'),
      },
      async execute({ threadId }): Promise<string> {
        try {
          const thread = await reviewService.unresolveThread(threadId);
          return JSON.stringify(thread, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Thread not found'}`;
        }
      },
    }),

    /**
     * Delete a thread from a session.
     */
    hive_review_delete_thread: tool({
      description: 'Delete a review thread from a session',
      args: {
        sessionId: tool.schema.string().describe('Review session ID'),
        threadId: tool.schema.string().describe('Thread ID to delete'),
      },
      async execute({ sessionId, threadId }): Promise<string> {
        try {
          await reviewService.deleteThread(sessionId, threadId);
          return JSON.stringify(
            { deleted: true, sessionId, threadId },
            null,
            2,
          );
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to delete thread'}`;
        }
      },
    }),

    /**
     * Edit an annotation's body.
     */
    hive_review_edit: tool({
      description: "Edit a review annotation's body text",
      args: {
        threadId: tool.schema
          .string()
          .describe('Thread ID containing the annotation'),
        annotationId: tool.schema
          .string()
          .describe('Annotation ID to edit'),
        body: tool.schema.string().describe('New annotation body'),
      },
      async execute({ threadId, annotationId, body }): Promise<string> {
        try {
          const annotation = await reviewService.editAnnotation(
            threadId,
            annotationId,
            body,
          );
          return JSON.stringify(annotation, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to edit annotation'}`;
        }
      },
    }),

    /**
     * Mark a suggestion annotation as applied.
     */
    hive_review_mark_applied: tool({
      description: 'Mark a suggestion annotation as applied',
      args: {
        threadId: tool.schema
          .string()
          .describe('Thread ID containing the suggestion'),
        annotationId: tool.schema
          .string()
          .describe('Annotation ID of the suggestion to mark as applied'),
      },
      async execute({ threadId, annotationId }): Promise<string> {
        try {
          const annotation = await reviewService.markSuggestionApplied(
            threadId,
            annotationId,
          );
          return JSON.stringify(annotation, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to mark suggestion as applied'}`;
        }
      },
    }),

    /**
     * Resolve a plan comment.
     */
    hive_plan_comment_resolve: tool({
      description: 'Resolve a plan comment by ID',
      args: {
        feature: tool.schema
          .string()
          .optional()
          .describe('Feature name (defaults to active feature)'),
        commentId: tool.schema
          .string()
          .describe('Comment ID to resolve'),
      },
      async execute({ feature: explicitFeature, commentId }): Promise<string> {
        if (!planService) {
          return 'Error: Plan comment tools not available (no PlanService configured)';
        }
        const feature = resolveFeature(explicitFeature);
        if (!feature) {
          return 'Error: No feature specified. Create a feature or provide feature param.';
        }
        try {
          planService.resolveComment(feature, commentId);
          return JSON.stringify(
            { resolved: true, feature, commentId },
            null,
            2,
          );
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to resolve comment'}`;
        }
      },
    }),

    /**
     * Reply to a plan comment.
     */
    hive_plan_comment_reply: tool({
      description: 'Reply to a plan comment',
      args: {
        feature: tool.schema
          .string()
          .optional()
          .describe('Feature name (defaults to active feature)'),
        commentId: tool.schema
          .string()
          .describe('Comment ID to reply to'),
        body: tool.schema.string().describe('Reply body'),
      },
      async execute({
        feature: explicitFeature,
        commentId,
        body,
      }): Promise<string> {
        if (!planService) {
          return 'Error: Plan comment tools not available (no PlanService configured)';
        }
        const feature = resolveFeature(explicitFeature);
        if (!feature) {
          return 'Error: No feature specified. Create a feature or provide feature param.';
        }
        try {
          const reply = planService.addReply(feature, commentId, {
            body,
            author: 'agent',
          });
          return JSON.stringify(reply, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to reply to comment'}`;
        }
      },
    }),
  };
}
