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
 * - hive_review_submit: Submit review with verdict
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin';
import type { ReviewService } from 'hive-core';
import type {
  ReviewScope,
  ReviewVerdict,
  AnnotationType,
  Range,
  ReviewIndex,
} from 'hive-core';

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
 */
export function createReviewTools(
  reviewService: ReviewService,
  resolveFeature: (explicit?: string) => string | null
): {
  hive_review_start: ToolDefinition;
  hive_review_list: ToolDefinition;
  hive_review_get: ToolDefinition;
  hive_review_add_comment: ToolDefinition;
  hive_review_suggest: ToolDefinition;
  hive_review_reply: ToolDefinition;
  hive_review_resolve: ToolDefinition;
  hive_review_submit: ToolDefinition;
} {
  /**
   * Get active session ID for a feature.
   */
  async function getActiveSessionId(feature: string): Promise<string | null> {
    const sessions = await reviewService.listSessions(feature);
    // Find the most recent in_progress session
    const activeSession = sessions.find(s => s.status === 'in_progress');
    return activeSession?.id || null;
  }

  return {
    /**
     * Start a new review session.
     */
    hive_review_start: tool({
      description: 'Start a new code review session for a feature or task',
      args: {
        feature: tool.schema.string().optional().describe('Feature name (defaults to active feature)'),
        scope: tool.schema.enum(['feature', 'task', 'context', 'plan', 'code']).optional().describe('Review scope (default: feature)'),
        baseRef: tool.schema.string().optional().describe('Base git ref (default: main)'),
        headRef: tool.schema.string().optional().describe('Head git ref (default: HEAD)'),
      },
      async execute({ feature: explicitFeature, scope = 'feature', baseRef, headRef }): Promise<string> {
        const feature = resolveFeature(explicitFeature);
        if (!feature) {
          return 'Error: No feature specified. Create a feature or provide feature param.';
        }

        try {
          const session = await reviewService.startSession(
            feature,
            scope as ReviewScope,
            baseRef,
            headRef
          );
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
        feature: tool.schema.string().optional().describe('Feature name (defaults to active feature)'),
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
        sessionId: tool.schema.string().optional().describe('Review session ID (defaults to active session)'),
        entityId: tool.schema.string().describe('Entity being reviewed (feature, task, file path)'),
        uri: tool.schema.string().optional().describe('File URI for code reviews'),
        range: tool.schema.object({
          start: tool.schema.object({
            line: tool.schema.number().describe('Start line (0-based)'),
            character: tool.schema.number().describe('Start character (0-based)'),
          }).describe('Start position'),
          end: tool.schema.object({
            line: tool.schema.number().describe('End line (0-based)'),
            character: tool.schema.number().describe('End character (0-based)'),
          }).describe('End position'),
        }).describe('Range of code being commented on'),
        type: tool.schema.enum(['comment', 'question', 'task', 'approval']).describe('Annotation type'),
        body: tool.schema.string().describe('Comment body'),
      },
      async execute({ sessionId, entityId, uri, range, type, body }): Promise<string> {
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
              author: { type: 'llm', name: 'Agent' },
            }
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
        sessionId: tool.schema.string().optional().describe('Review session ID (defaults to active session)'),
        entityId: tool.schema.string().describe('Entity being reviewed (feature, task, file path)'),
        uri: tool.schema.string().optional().describe('File URI for code reviews'),
        range: tool.schema.object({
          start: tool.schema.object({
            line: tool.schema.number().describe('Start line (0-based)'),
            character: tool.schema.number().describe('Start character (0-based)'),
          }).describe('Start position'),
          end: tool.schema.object({
            line: tool.schema.number().describe('End line (0-based)'),
            character: tool.schema.number().describe('End character (0-based)'),
          }).describe('End position'),
        }).describe('Range of code to replace'),
        body: tool.schema.string().describe('Suggestion explanation'),
        replacement: tool.schema.string().describe('Replacement code'),
      },
      async execute({ sessionId, entityId, uri, range, body, replacement }): Promise<string> {
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
              author: { type: 'llm', name: 'Agent' },
              suggestion: { replacement },
            }
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
      },
      async execute({ threadId, body }): Promise<string> {
        try {
          const annotation = await reviewService.replyToThread(threadId, body);
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
      description: 'Submit review with verdict (approve, request_changes, or comment)',
      args: {
        sessionId: tool.schema.string().optional().describe('Review session ID (defaults to active session)'),
        verdict: tool.schema.enum(['approve', 'request_changes', 'comment']).describe('Review verdict'),
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
            summary
          );
          return JSON.stringify(session, null, 2);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : 'Failed to submit review'}`;
        }
      },
    }),
  };
}
