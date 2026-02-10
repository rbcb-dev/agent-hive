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
  | { type: 'submit'; verdict: string; summary: string }
  | { type: 'selectFile'; path: string }
  | { type: 'selectThread'; threadId: string }
  | { type: 'changeScope'; scope: string }
  | { type: 'requestFile'; uri: string };

/**
 * Messages sent from extension to webview
 */
export type ExtensionToWebviewMessage =
  | { type: 'sessionData'; session: import('hive-core').ReviewSession }
  | { type: 'sessionUpdate'; session: import('hive-core').ReviewSession }
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
  | { type: 'fileError'; uri: string; error: string };

/**
 * File tree item for navigation
 */
export interface FileTreeItem {
  path: string;
  name: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | 'B';
  commentCount: number;
  additions: number;
  deletions: number;
}

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
