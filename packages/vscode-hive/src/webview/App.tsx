/**
 * Main App component - Hive Review UI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScopeTabs } from './components/ScopeTabs';
import { FileNavigator } from './components/FileNavigator';
import { ThreadList } from './components/ThreadList';
import { ThreadPanel } from './components/ThreadPanel';
import { ReviewSummary } from './components/ReviewSummary';
import { DiffViewer } from './components/DiffViewer';
import { CodeViewer } from './components/CodeViewer';
import { MarkdownViewer } from './components/MarkdownViewer';
import { notifyReady, addMessageListener, postMessage } from './vscodeApi';
import type { 
  ReviewSession, 
  ReviewThread, 
  ReviewVerdict,
  DiffFile,
} from 'hive-core';
import type { ThreadSummary, ExtensionToWebviewMessage } from './types';

const SCOPES = [
  { id: 'feature', label: 'Feature' },
  { id: 'task', label: 'Task' },
  { id: 'context', label: 'Context' },
  { id: 'plan', label: 'Plan' },
  { id: 'code', label: 'Code' },
];

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
 * Check if a file path is a markdown file
 */
export function isMarkdownFile(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  return lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown');
}

/**
 * Extract the "new" content from diff hunks (added + context lines)
 * This reconstructs the file content after the changes
 */
function extractContentFromDiff(file: DiffFile): string {
  const lines: string[] = [];
  
  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      // Include context and added lines (the "new" state)
      if (line.type === 'context' || line.type === 'add') {
        lines.push(line.content);
      }
    }
  }
  
  return lines.join('\n');
}

export function App(): React.ReactElement {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [activeScope, setActiveScope] = useState('feature');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeContent, setScopeContent] = useState<{ uri: string; content: string; language: string } | undefined>(undefined);
  
  // File content state for inline viewing
  const [fileContentCache, setFileContentCache] = useState<Map<string, {
    content: string;
    language?: string;
    warning?: string;
    timestamp: number;
  }>>(new Map());
  const [fileErrors, setFileErrors] = useState<Map<string, string>>(new Map());
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());

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
      case 'fileContent':
        // Store file content in cache with timestamp
        setFileContentCache(prev => {
          const newCache = new Map(prev);
          newCache.set(message.uri, {
            content: message.content,
            language: message.language,
            warning: message.warning,
            timestamp: Date.now(),
          });
          return newCache;
        });
        // Clear any previous error for this file
        setFileErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.delete(message.uri);
          return newErrors;
        });
        // Remove from loading state
        setLoadingFiles(prev => {
          const newLoading = new Set(prev);
          newLoading.delete(message.uri);
          return newLoading;
        });
        break;
      case 'fileError':
        // Store the error
        setFileErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.set(message.uri, message.error);
          return newErrors;
        });
        // Remove from loading state
        setLoadingFiles(prev => {
          const newLoading = new Set(prev);
          newLoading.delete(message.uri);
          return newLoading;
        });
        break;
    }
  }, []);

  // Set up message listener and notify ready on mount
  useEffect(() => {
    const removeListener = addMessageListener(handleMessage);
    notifyReady();
    return removeListener;
  }, [handleMessage]);

  // Handlers
  const handleScopeChange = (scope: string) => {
    setActiveScope(scope);
    postMessage({ type: 'changeScope', scope });
  };

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    postMessage({ type: 'selectFile', path });
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThread(threadId);
    postMessage({ type: 'selectThread', threadId });
  };

  // Wrapper for CodeViewer's thread click callback
  const handleCodeViewerThreadClick = useCallback((threads: ReviewThread[]) => {
    if (threads.length > 0) {
      handleSelectThread(threads[0].id);
    }
  }, []);

  const handleReply = (threadId: string, body: string) => {
    postMessage({ type: 'reply', threadId, body });
  };

  const handleResolve = (threadId: string) => {
    postMessage({ type: 'resolve', threadId });
  };

  const handleSubmit = (verdict: ReviewVerdict, summary: string) => {
    setIsSubmitting(true);
    postMessage({ type: 'submit', verdict, summary });
    // Note: isSubmitting will be reset when we receive a session update
  };

  /**
   * Request file content for inline viewing
   * This does NOT open an editor tab - content is received via fileContent message
   * @param uri - File path (relative or absolute)
   */
  const requestFileContent = useCallback((uri: string) => {
    // Don't request if already loading
    if (loadingFiles.has(uri)) {
      return;
    }
    
    // Mark as loading
    setLoadingFiles(prev => {
      const newLoading = new Set(prev);
      newLoading.add(uri);
      return newLoading;
    });
    
    // Send request to extension
    postMessage({ type: 'requestFile', uri });
  }, [loadingFiles]);

  /**
   * Get cached file content, or request if not cached
   * Cache entries expire after 5 minutes to prevent memory bloat
   */
  const getFileContent = useCallback((uri: string) => {
    const cached = fileContentCache.get(uri);
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }
    
    // Request fresh content
    requestFileContent(uri);
    return null;
  }, [fileContentCache, requestFileContent]);

  /**
   * Check if a file is currently loading
   */
  const isFileLoading = useCallback((uri: string) => {
    return loadingFiles.has(uri);
  }, [loadingFiles]);

  /**
   * Get error for a file, if any
   */
  const getFileError = useCallback((uri: string) => {
    return fileErrors.get(uri);
  }, [fileErrors]);

  /**
   * Clear file content cache (useful for forced refresh)
   */
  const clearFileCache = useCallback((uri?: string) => {
    if (uri) {
      setFileContentCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(uri);
        return newCache;
      });
      setFileErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(uri);
        return newErrors;
      });
    } else {
      setFileContentCache(new Map());
      setFileErrors(new Map());
    }
  }, []);

  // Derived state
  const threads = session?.threads || [];
  const threadSummaries = threadsToSummaries(threads);
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

  // Determine if selected file is markdown and extract content
  const isSelectedFileMarkdown = selectedFile ? isMarkdownFile(selectedFile) : false;
  const markdownContent = (selectedFileData && isSelectedFileMarkdown) 
    ? extractContentFromDiff(selectedFileData)
    : null;

  return (
    <div className="hive-review">
      <header className="review-header">
        <ScopeTabs
          scopes={SCOPES}
          activeScope={activeScope}
          onScopeChange={handleScopeChange}
        />
      </header>

      <div className="review-body">
        <nav className="review-sidebar" role="navigation">
          <div className="sidebar-section">
            <h3>Files</h3>
            <FileNavigator
              files={filePaths}
              threads={threads}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
            />
          </div>
          <div className="sidebar-section">
            <h3>Threads</h3>
            <ThreadList
              threads={threadSummaries}
              selectedThread={selectedThread}
              onSelectThread={handleSelectThread}
            />
          </div>
        </nav>

        <main className="review-main" role="main">
           <div className="content-area">
             {activeScope === 'code' && isSelectedFileMarkdown && (
               <MarkdownViewer 
                 content={markdownContent} 
                 filePath={selectedFile || undefined}
               />
             )}
             {activeScope === 'code' && !isSelectedFileMarkdown && (
               <DiffViewer file={selectedFileData} />
             )}
             {activeScope !== 'code' && scopeContent && (
               <>
                 {scopeContent.language === 'markdown' ? (
                   <MarkdownViewer 
                     content={scopeContent.content}
                     filePath={scopeContent.uri}
                   />
                 ) : (
                   <CodeViewer
                     code={scopeContent.content}
                     language={scopeContent.language}
                     threads={[]}
                     onThreadClick={handleCodeViewerThreadClick}
                   />
                 )}
               </>
             )}
             {activeScope !== 'code' && !scopeContent && (
               <div className="scope-content">
                 <p>No content available for {activeScope} scope</p>
               </div>
             )}
           </div>

           <aside className="thread-sidebar">
             <ThreadPanel
               thread={selectedThreadData}
               onReply={handleReply}
               onResolve={handleResolve}
             />
           </aside>
         </main>
      </div>

      <footer className="review-footer">
        <ReviewSummary
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </footer>
    </div>
  );
}
