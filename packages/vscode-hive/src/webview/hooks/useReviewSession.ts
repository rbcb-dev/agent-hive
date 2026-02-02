/**
 * useReviewSession hook - Manages review session state and interactions
 * Centralizes session data, scope management, file/thread selection, and extension communication.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { notifyReady, addMessageListener, postMessage } from '../vscodeApi';
import type { 
  ReviewSession, 
  ReviewThread,
  ReviewVerdict,
  DiffFile,
} from 'hive-core';
import type { ExtensionToWebviewMessage, ThreadSummary } from '../types';

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
  
  // Handlers
  handleScopeChange: (scope: string) => void;
  handleSelectFile: (path: string) => void;
  handleSelectThread: (threadId: string) => void;
  handleReply: (threadId: string, body: string) => void;
  handleResolve: (threadId: string) => void;
  handleSubmit: (verdict: ReviewVerdict, summary: string) => void;
  handleAddComment: () => void;
}

/**
 * Convert session threads to thread summaries for the list view
 */
function threadsToSummaries(threads: ReviewThread[]): ThreadSummary[] {
  return threads.map((thread) => ({
    id: thread.id,
    uri: thread.uri,
    firstLine: thread.annotations[0]?.body.slice(0, 80) || '',
    status: thread.status,
    commentCount: thread.annotations.length,
    lastUpdated: thread.updatedAt,
  }));
}

/**
 * Extract file paths from session diffs for FileNavigator
 */
function diffsToFilePaths(
  diffs: Record<string, { files: DiffFile[] }>
): string[] {
  const filePaths: string[] = [];
  
  for (const diffPayload of Object.values(diffs)) {
    for (const file of diffPayload.files) {
      filePaths.push(file.path);
    }
  }
  
  return filePaths;
}

/**
 * Hook for managing review session state and extension communication.
 * Handles all session-related state including scope, file selection, threads, and submissions.
 */
export function useReviewSession(): UseReviewSessionResult {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [activeScope, setActiveScope] = useState('feature');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeContent, setScopeContent] = useState<ScopeContent | undefined>(undefined);

  // Handle messages from extension
  const handleMessage = useCallback((message: ExtensionToWebviewMessage) => {
    switch (message.type) {
      case 'sessionData':
      case 'sessionUpdate':
        setSession(message.session);
        break;
      case 'scopeChanged':
        setActiveScope(message.scope);
        setScopeContent(message.scopeContent);
        break;
      case 'error':
        console.error('Extension error:', message.message);
        break;
      // Note: fileContent and fileError are handled by useFileContentCache
    }
  }, []);

  // Set up message listener and notify ready on mount
  useEffect(() => {
    const removeListener = addMessageListener(handleMessage);
    notifyReady();
    return removeListener;
  }, [handleMessage]);

  // Handlers
  const handleScopeChange = useCallback((scope: string) => {
    setActiveScope(scope);
    postMessage({ type: 'changeScope', scope });
  }, []);

  const handleSelectFile = useCallback((path: string) => {
    setSelectedFile(path);
    postMessage({ type: 'selectFile', path });
  }, []);

  const handleSelectThread = useCallback((threadId: string) => {
    setSelectedThread(threadId);
    postMessage({ type: 'selectThread', threadId });
  }, []);

  const handleReply = useCallback((threadId: string, body: string) => {
    if (!session) return;
    
    const thread = session.threads.find(t => t.id === threadId);
    if (!thread) {
      // This is a new thread, so we need to create it with addComment
      postMessage({
        type: 'addComment',
        entityId: threadId,
        uri: scopeContent?.uri || activeScope,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        body,
        annotationType: 'comment',
      });
    } else {
      // This is a reply to existing thread
      postMessage({ type: 'reply', threadId, body });
    }
  }, [session, scopeContent, activeScope]);

  const handleResolve = useCallback((threadId: string) => {
    postMessage({ type: 'resolve', threadId });
  }, []);

  const handleSubmit = useCallback((verdict: ReviewVerdict, summary: string) => {
    setIsSubmitting(true);
    postMessage({ type: 'submit', verdict, summary });
    // Note: isSubmitting will be reset when we receive a session update
  }, []);

  const handleAddComment = useCallback(() => {
    if (!session) return;
    
    // Create a new thread on the current scope's content
    const threadId = `thread-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create a temporary thread for comment input
    const newThread: ReviewThread = {
      id: threadId,
      entityId: threadId,
      uri: scopeContent?.uri || activeScope,
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      annotations: [],
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };

    // Select the new thread to show the comment input
    setSelectedThread(threadId);
    
    // Add thread to session
    setSession({
      ...session,
      threads: [...session.threads, newThread],
    });
  }, [session, activeScope, scopeContent]);

  // Derived state
  const threads = session?.threads || [];
  const threadSummaries = useMemo(() => threadsToSummaries(threads), [threads]);
  const filePaths = useMemo(
    () => (session ? diffsToFilePaths(session.diffs) : []),
    [session]
  );
  const selectedThreadData = threads.find((t) => t.id === selectedThread) || null;
  const selectedFileData = selectedFile 
    ? Object.values(session?.diffs || {})
        .flatMap((d) => d.files)
        .find((f) => f.path === selectedFile) || null
    : null;

  return {
    session,
    activeScope,
    scopeContent,
    selectedFile,
    selectedThread,
    isSubmitting,
    threads,
    threadSummaries,
    filePaths,
    selectedThreadData,
    selectedFileData,
    handleScopeChange,
    handleSelectFile,
    handleSelectThread,
    handleReply,
    handleResolve,
    handleSubmit,
    handleAddComment,
  };
}
