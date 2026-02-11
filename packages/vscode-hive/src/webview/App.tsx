/**
 * Main App component - Hive Review UI
 *
 * This component integrates the new HivePanel (sidebar + content) layout
 * with the existing review session functionality:
 * - HiveWorkspaceProvider: Shared workspace state for sidebar navigation
 * - HivePanel: Master-detail layout with FeatureSidebar and content area
 * - useReviewSession: Manages review session state for review mode
 * - useFileContentCache: Manages file content caching with TTL
 *
 * Layout:
 * Uses antd Layout components with HiveThemeProvider for theming:
 * - Layout: Root container with minHeight 100vh
 * - Header: Contains ScopeTabs for review-specific navigation
 * - Main: HivePanel (sidebar + content area driven by HiveWorkspaceProvider)
 * - Footer: ReviewSummary for submission (when in review mode)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Layout, Button } from './primitives';
import { HiveThemeProvider } from './theme/Provider';
import { HiveWorkspaceProvider } from './providers/HiveWorkspaceProvider';
import { ScopeTabs } from './components/ScopeTabs';
import { HivePanel } from './components/HivePanel';
import { FileNavigator } from './components/FileNavigator';
import { ThreadList } from './components/ThreadList';
import { ThreadPanel } from './components/ThreadPanel';
import { ReviewSummary } from './components/ReviewSummary';
import { DiffViewer } from './components/DiffViewer';
import { CodeViewer } from './components/CodeViewer';
import { MarkdownViewer } from './components/MarkdownViewer';
import { useReviewSession, useFileContentCache, useWorkspaceMessages } from './hooks';
import { addMessageListener } from './vscodeApi';
import type { ReviewThread, DiffFile } from 'hive-core';
import type { ExtensionToWebviewMessage } from './types';

const { Header, Sider, Content } = Layout;

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

/**
 * WorkspaceView — Workspace mode branch of the App
 *
 * Calls useWorkspaceMessages() to connect HiveWorkspaceProvider state
 * to extension messaging (auto-requests features on mount, diffs on
 * feature/task selection). Only mounted when no review session is active.
 */
function WorkspaceView({
  style,
}: {
  style?: React.CSSProperties;
}): React.ReactElement {
  useWorkspaceMessages();
  return <HivePanel style={style} />;
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
          message.warning,
        );
      } else if (message.type === 'fileError') {
        fileContentCache.setError(message.uri, message.error);
      }
    };

    return addMessageListener(handleFileMessages);
  }, [fileContentCache]);

  // Wrapper for CodeViewer's thread click callback
  const handleCodeViewerThreadClick = useCallback(
    (clickedThreads: ReviewThread[]) => {
      if (clickedThreads.length > 0) {
        handleSelectThread(clickedThreads[0].id);
      }
    },
    [handleSelectThread],
  );

  // Sidebar collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Determine if selected file is markdown and extract content
  const isSelectedFileMarkdown = selectedFile
    ? isMarkdownFile(selectedFile)
    : false;
  const markdownContent =
    selectedFileData && isSelectedFileMarkdown
      ? extractContentFromDiff(selectedFileData)
      : null;

  // Determine if we're in review mode (session has data)
  const isReviewMode = !!session;

  return (
    <HiveThemeProvider>
      <HiveWorkspaceProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <Header
            style={{
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--ant-color-bg-container)',
            }}
          >
            <ScopeTabs
              scopes={SCOPES}
              activeScope={activeScope}
              onScopeChange={handleScopeChange}
            />
          </Header>
          {isReviewMode ? (
            /* Review mode: existing layout with FileNavigator, ThreadList, etc. */
            <Layout hasSider>
              <Sider
                width={280}
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                style={{ background: 'var(--ant-color-bg-container)' }}
              >
                <nav
                  role="navigation"
                  style={{ padding: collapsed ? '8px' : '16px' }}
                >
                  <div className="sidebar-section">
                    {!collapsed && <h3>Files</h3>}
                    <FileNavigator
                      files={filePaths}
                      threads={threads}
                      selectedFile={selectedFile}
                      onSelectFile={handleSelectFile}
                    />
                  </div>
                  <div className="sidebar-section">
                    {!collapsed && <h3>Threads</h3>}
                    <ThreadList
                      threads={threadSummaries}
                      selectedThread={selectedThread}
                      onSelectThread={handleSelectThread}
                    />
                  </div>
                </nav>
              </Sider>
              <Layout>
                <Content style={{ padding: 16, overflow: 'auto' }} role="main">
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
                          <Button
                            type="primary"
                            size="small"
                            icon={
                              <span className="codicon codicon-comment" />
                            }
                            onClick={handleAddComment}
                            aria-label="Add a comment on this content"
                          >
                            Add Comment
                          </Button>
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
                </Content>
              </Layout>
            </Layout>
          ) : (
            /* Workspace mode: HivePanel with sidebar navigation + messaging */
            <WorkspaceView style={{ flex: 1 }} />
          )}
          <div
            style={{
              padding: 16,
              borderTop: '1px solid var(--ant-color-border)',
            }}
          >
            <ReviewSummary onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        </Layout>
      </HiveWorkspaceProvider>
    </HiveThemeProvider>
  );
}
