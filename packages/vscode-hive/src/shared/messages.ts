/**
 * Shared message protocol types for extension ↔ webview communication.
 *
 * This is the single source of truth. Both `reviewPanel.ts` (extension side)
 * and `webview/types.ts` (webview side) re-export from here.
 */

import type {
  ReviewSession,
  ReviewConfig,
  Range,
  FeatureInfo,
  DiffPayload,
  PlanComment,
} from 'hive-core';

/**
 * Messages sent from webview to extension
 */
export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | {
      type: 'addComment';
      threadId?: string;
      entityId: string;
      uri?: string;
      range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
      body: string;
      annotationType: string;
    }
  | { type: 'reply'; threadId: string; body: string }
  | { type: 'resolve'; threadId: string }
  | {
      /**
       * Apply a code suggestion to a file. The extension handler (`_handleApplySuggestion`
       * in reviewPanel.ts) is fully implemented, but **no production webview component
       * currently sends this message**. It is exercised only in type-level tests
       * (messages.test.ts, reviewPanel.test.ts). Wire a real sender in review mode
       * (e.g. from SuggestionPreview's onApply callback) when suggestion-apply UX
       * is ready, or remove this variant if the feature is abandoned.
       */
      type: 'applySuggestion';
      threadId: string;
      annotationId: string;
      uri: string;
      range: Range;
      replacement: string;
    }
  | { type: 'submit'; verdict: string; summary: string }
  | { type: 'selectFile'; path: string }
  | { type: 'selectThread'; threadId: string }
  | { type: 'changeScope'; scope: string }
  | { type: 'requestFile'; uri: string }
  | { type: 'requestFeatures' }
  | { type: 'requestFeatureDiffs'; feature: string }
  | { type: 'requestTaskDiff'; feature: string; task: string }
  | { type: 'requestPlanContent'; feature: string }
  | { type: 'requestContextContent'; feature: string; name: string }
  | { type: 'addPlanComment'; feature: string; line: number; body: string }
  | { type: 'resolvePlanComment'; feature: string; commentId: string }
  | {
      type: 'replyToPlanComment';
      feature: string;
      commentId: string;
      body: string;
    };

/**
 * Messages sent from extension to webview
 */
export type ExtensionToWebviewMessage =
  | {
      type: 'sessionData';
      session: ReviewSession;
      config: ReviewConfig;
    }
  | { type: 'sessionUpdate'; session: ReviewSession }
  | {
      /**
       * Declared but **never emitted** by the extension host. Kept for forward
       * compatibility — emit this when review config hot-reload is implemented,
       * or remove if the feature is abandoned.
       */
      type: 'configUpdate';
      config: ReviewConfig;
    }
  | { type: 'error'; message: string }
  | {
      type: 'scopeChanged';
      scope: string;
      scopeContent?: { uri: string; content: string; language: string };
    }
  | {
      type: 'fileContent';
      uri: string;
      content: string;
      language?: string;
      warning?: string;
    }
  | { type: 'fileError'; uri: string; error: string }
  | {
      /**
       * Emitted by the extension host after handling 'applySuggestion', but
       * **not consumed by any webview hook or component** yet. The webview
       * should listen for this to update SuggestionPreview status (pending →
       * applied/conflict) once the applySuggestion sender is wired.
       */
      type: 'suggestionApplied';
      threadId: string;
      annotationId: string;
      success: boolean;
      error?: string;
    }
  | { type: 'featuresData'; features: FeatureInfo[] }
  | {
      type: 'featureDiffs';
      feature: string;
      diffs: Record<string, DiffPayload[]>;
    }
  | {
      type: 'taskDiff';
      feature: string;
      task: string;
      diffs: DiffPayload[];
    }
  | {
      type: 'planContent';
      feature: string;
      content: string;
      comments: PlanComment[];
    }
  | { type: 'contextContent'; feature: string; name: string; content: string };
