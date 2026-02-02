/**
 * Main App component - Hive Review UI
 * 
 * This component now uses custom hooks for state management:
 * - useReviewSession: Manages session state, scope, file/thread selection, and extension messaging
 * - useFileContentCache: Manages file content caching with TTL
 */

import React, { useCallback, useEffect } from 'react';
import { ScopeTabs } from './components/ScopeTabs';
import { FileNavigator } from './components/FileNavigator';
import { ThreadList } from './components/ThreadList';
import { ThreadPanel } from './components/ThreadPanel';
import { ReviewSummary } from './components/ReviewSummary';
import { DiffViewer } from './components/DiffViewer';
import { CodeViewer } from './components/CodeViewer';
import { MarkdownViewer } from './components/MarkdownViewer';
import { useReviewSession, useFileContentCache } from './hooks';
import { addMessageListener } from './vscodeApi';
import type { ReviewThread, DiffFile } from 'hive-core';
import type { ExtensionToWebviewMessage } from './types';

const SCOPES = [
  { id: 'feature', label: 'Feature' },
  { id: 'task', label: 'Task' },
  { id: 'context', label: 'Context' },
  { id: 'plan', label: 'Plan' },
  { id: 'code', label: 'Code' },
];

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
  // Use custom hooks for state management
  const {
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
  } = useReviewSession();

  const fileContentCache = useFileContentCache();

  // Bridge file content messages to the cache hook
  useEffect(() => {
    const handleFileMessages = (message: ExtensionToWebviewMessage) => {
      if (message.type === 'fileContent') {
        fileContentCache.setContent(
          message.uri,
          message.content,
          message.language,
          message.warning
        );
      } else if (message.type === 'fileError') {
        fileContentCache.setError(message.uri, message.error);
      }
    };

    return addMessageListener(handleFileMessages);
  }, [fileContentCache]);

  // Wrapper for CodeViewer's thread click callback
  const handleCodeViewerThreadClick = useCallback((clickedThreads: ReviewThread[]) => {
    if (clickedThreads.length > 0) {
      handleSelectThread(clickedThreads[0].id);
    }
  }, [handleSelectThread]);

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
                 <div className="scope-toolbar">
                   <button 
                     onClick={handleAddComment}
                     className="btn btn-primary"
                     title="Add a comment on this content"
                   >
                     + Add Comment
                   </button>
                 </div>
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
