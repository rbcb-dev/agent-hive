/**
 * Main App component - Hive Review UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScopeTabs } from './components/ScopeTabs';
import { FileTree } from './components/FileTree';
import { ThreadList } from './components/ThreadList';
import { ThreadPanel } from './components/ThreadPanel';
import { ReviewSummary } from './components/ReviewSummary';
import { DiffViewer } from './components/DiffViewer';
import { MarkdownViewer } from './components/MarkdownViewer';
import { notifyReady, addMessageListener, postMessage } from './vscodeApi';
import type { 
  ReviewSession, 
  ReviewThread, 
  ReviewVerdict,
  DiffFile,
} from 'hive-core';
import type { FileTreeItem, ThreadSummary, ExtensionToWebviewMessage } from './types';

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
 * Extract file tree items from session diffs
 */
function diffsToFileTree(
  diffs: Record<string, { files: DiffFile[] }>,
  threads: ReviewThread[]
): FileTreeItem[] {
  const fileItems: FileTreeItem[] = [];
  
  for (const diffPayload of Object.values(diffs)) {
    for (const file of diffPayload.files) {
      const commentCount = threads.filter((t) => t.uri === file.path).length;
      fileItems.push({
        path: file.path,
        name: file.path.split('/').pop() || file.path,
        status: file.status,
        commentCount,
        additions: file.additions,
        deletions: file.deletions,
      });
    }
  }
  
  return fileItems;
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

  // Handle messages from extension
  const handleMessage = useCallback((message: ExtensionToWebviewMessage) => {
    switch (message.type) {
      case 'sessionData':
      case 'sessionUpdate':
        setSession(message.session);
        break;
      case 'scopeChanged':
        setActiveScope(message.scope);
        break;
      case 'error':
        console.error('Extension error:', message.message);
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

  // Derived state
  const threads = session?.threads || [];
  const threadSummaries = threadsToSummaries(threads);
  const fileTree = session ? diffsToFileTree(session.diffs, threads) : [];
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
            <FileTree
              files={fileTree}
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
            {activeScope !== 'code' && (
              <div className="scope-content">
                <p>Review content for {activeScope} scope</p>
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
