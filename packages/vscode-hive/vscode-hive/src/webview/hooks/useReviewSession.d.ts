/**
 * useReviewSession hook - Manages review session state and interactions
 * Centralizes session data, scope management, file/thread selection, and extension communication.
 */
import type { ReviewSession, ReviewThread, ReviewVerdict, DiffFile } from 'hive-core';
import type { ThreadSummary } from '../types';
/** Scope content provided by the extension */
export interface ScopeContent {
    uri: string;
    content: string;
    language: string;
}
export interface UseReviewSessionResult {
    /** Current review session (null if not loaded) */
    session: ReviewSession | null;
    /** Currently active scope tab */
    activeScope: string;
    /** Content for the active scope (provided by extension) */
    scopeContent: ScopeContent | undefined;
    /** Currently selected file path */
    selectedFile: string | null;
    /** Currently selected thread ID */
    selectedThread: string | null;
    /** Whether a review submission is in progress */
    isSubmitting: boolean;
    /** All threads from the session */
    threads: ReviewThread[];
    /** Thread summaries for the thread list */
    threadSummaries: ThreadSummary[];
    /** File paths from session diffs */
    filePaths: string[];
    /** Selected thread data */
    selectedThreadData: ReviewThread | null;
    /** Selected file diff data */
    selectedFileData: DiffFile | null;
    handleScopeChange: (scope: string) => void;
    handleSelectFile: (path: string) => void;
    handleSelectThread: (threadId: string) => void;
    handleReply: (threadId: string, body: string) => void;
    handleResolve: (threadId: string) => void;
    handleSubmit: (verdict: ReviewVerdict, summary: string) => void;
    handleAddComment: () => void;
}
/**
 * Hook for managing review session state and extension communication.
 * Handles all session-related state including scope, file selection, threads, and submissions.
 */
export declare function useReviewSession(): UseReviewSessionResult;
