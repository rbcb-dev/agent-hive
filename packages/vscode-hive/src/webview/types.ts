/**
 * Webview types for the Hive Review UI
 * Re-exports core types and adds webview-specific message types
 */

// Re-export core review types
export type {
  ReviewScope,
  ReviewStatus,
  ReviewVerdict,
  ThreadStatus,
  AnnotationType,
  Position,
  Range,
  GitMeta,
  ReviewAnnotation,
  ReviewThread,
  DiffHunkLine,
  DiffHunk,
  DiffFile,
  DiffPayload,
  ReviewSession,
  ReviewIndex,
  FeatureInfo,
  PlanComment,
} from 'hive-core';

// Canonical message protocol types — re-exported from shared module
export type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
} from '../shared/messages.js';

/**
 * Thread summary for navigation
 */
export interface ThreadSummary {
  id: string;
  uri: string | null;
  firstLine: string;
  status: 'open' | 'resolved' | 'outdated';
  commentCount: number;
  lastUpdated: string;
}

/**
 * Scope tab configuration
 */
export interface ScopeTab {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Review UI State
 */
export interface ReviewUIState {
  activeScope: string;
  selectedFile: string | null;
  selectedThread: string | null;
  isSubmitting: boolean;
}
