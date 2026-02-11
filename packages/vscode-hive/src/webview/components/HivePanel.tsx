/**
 * HivePanel — Unified App Layout with Sidebar
 *
 * Master-detail layout composing FeatureSidebar in the sider and
 * content components (DiffViewer, MarkdownViewer, etc.) in the main area.
 *
 * Content area renders based on activeView from HiveWorkspaceProvider:
 * - plan → MarkdownViewer placeholder (populated via Task 4 messaging)
 * - context → MarkdownViewer with context file content
 * - task → Task summary header + diff list
 * - diff / code → DiffViewer for selected file
 *
 * ```
 * ┌─────────────────────────────────────────────┐
 * │  HivePanel                                  │
 * │ ┌───────────┬──────────────────────────────┐│
 * │ │ Sidebar   │ Content Area                 ││
 * │ │           │                              ││
 * │ │ Navigator │ DiffViewer / MarkdownViewer  ││
 * │ │ ───────── │ / CodeViewer                 ││
 * │ │ Changed   │                              ││
 * │ │ Files     │                              ││
 * │ └───────────┴──────────────────────────────┘│
 * └─────────────────────────────────────────────┘
 * ```
 */

import React, { useMemo, useCallback } from 'react';
import { Layout } from '../primitives';
import { FeatureSidebar } from './FeatureSidebar';
import { CommitHistory } from './CommitHistory';
import { DiffViewer } from './DiffViewer';
import { MarkdownViewer } from './MarkdownViewer';
import { PlanReview } from './PlanReview';
import { useHiveWorkspace } from '../providers/HiveWorkspaceProvider';
import { useWorkspaceContent } from '../hooks/useWorkspaceContent';
import { postMessage } from '../vscodeApi';
import type { DiffFile, Range } from 'hive-core';

const { Sider, Content } = Layout;

// ---------------------------------------------------------------------------
// Content routing
// ---------------------------------------------------------------------------

/**
 * Resolve the selected file from workspace fileChanges.
 * Searches across all task DiffPayloads for a matching file path.
 */
function resolveFileFromChanges(
  fileChanges: Map<string, import('hive-core').DiffPayload[]>,
  filePath: string,
): DiffFile | null {
  for (const payloads of fileChanges.values()) {
    for (const payload of payloads) {
      const found = payload.files.find((f) => f.path === filePath);
      if (found) return found;
    }
  }
  return null;
}

function HivePanelContent(): React.ReactElement {
  const { state, actions } = useHiveWorkspace();
  const {
    activeView,
    activeFeature,
    activeTask,
    activeFile,
    fileChanges,
    reviewThreads,
    commits,
    commitDiff,
  } = state;
  const { planContent, planComments, contextContent } = useWorkspaceContent();

  // Resolve the selected diff file from workspace state
  const selectedDiffFile = useMemo(() => {
    if (!activeFile || fileChanges.size === 0) return null;
    return resolveFileFromChanges(fileChanges, activeFile);
  }, [activeFile, fileChanges]);

  // Filter review threads for the active diff file's URI
  const fileThreads = useMemo(() => {
    if (!activeFile || !reviewThreads || reviewThreads.length === 0) return [];
    return reviewThreads.filter((t) => t.uri === activeFile);
  }, [activeFile, reviewThreads]);

  // Thread action callbacks
  const handleAddThread = useCallback(
    (path: string, line: number, body: string) => {
      if (activeFeature) {
        const entityId = activeTask ?? activeFeature;
        const range = {
          start: { line, character: 0 },
          end: { line, character: 0 },
        };
        actions.addThread(entityId, path, range, body, 'comment');
      }
    },
    [activeFeature, activeTask, actions],
  );

  const handleReply = useCallback(
    (threadId: string, body: string) => {
      actions.replyToThread(threadId, body);
    },
    [actions],
  );

  const handleResolve = useCallback(
    (threadId: string) => {
      actions.resolveThread(threadId);
    },
    [actions],
  );

  // Plan comment callbacks — send messages to extension
  const handleAddPlanComment = useCallback(
    (range: Range, body: string) => {
      if (activeFeature) {
        postMessage({
          type: 'addPlanComment',
          feature: activeFeature,
          range,
          body,
        });
      }
    },
    [activeFeature],
  );

  const handleResolvePlanComment = useCallback(
    (commentId: string) => {
      if (activeFeature) {
        postMessage({
          type: 'resolvePlanComment',
          feature: activeFeature,
          commentId,
        });
      }
    },
    [activeFeature],
  );

  const handleReplyToPlanComment = useCallback(
    (commentId: string, body: string) => {
      if (activeFeature) {
        postMessage({
          type: 'replyToPlanComment',
          feature: activeFeature,
          commentId,
          body,
        });
      }
    },
    [activeFeature],
  );

  // Commit selection callback — request diff for the selected commit
  const handleCommitSelect = useCallback(
    (sha: string) => {
      if (activeFeature && activeTask) {
        postMessage({
          type: 'requestCommitDiff',
          feature: activeFeature,
          task: activeTask,
          sha,
        });
      }
    },
    [activeFeature, activeTask],
  );

  // No feature selected — show welcome prompt
  if (!activeFeature) {
    return (
      <div className="hive-panel-empty">
        <p>Select a feature to get started</p>
      </div>
    );
  }

  switch (activeView) {
    case 'plan':
      return (
        <div className="hive-panel-plan">
          <PlanReview
            content={planContent ?? ''}
            comments={planComments}
            onAddComment={handleAddPlanComment}
            onResolveComment={handleResolvePlanComment}
            onReplyToComment={handleReplyToPlanComment}
          />
        </div>
      );

    case 'context':
      return (
        <div className="hive-panel-context">
          <MarkdownViewer content={contextContent} />
        </div>
      );

    case 'task':
      return (
        <div className="hive-panel-task">
          <h3>{activeTask}</h3>
          <p>Task details for {activeTask ?? 'no task selected'}</p>
          <CommitHistory
            commits={commits}
            onCommitSelect={handleCommitSelect}
          />
        </div>
      );

    case 'diff':
    case 'code': {
      // If commitDiff is available, resolve from it; otherwise from fileChanges
      const diffFile = commitDiff
        ? (commitDiff
            .flatMap((d) => d.files)
            .find((f) => f.path === activeFile) ??
          commitDiff[0]?.files[0] ??
          null)
        : selectedDiffFile;
      return (
        <div className="hive-panel-diff">
          <DiffViewer
            file={diffFile}
            threads={fileThreads}
            onAddThread={handleAddThread}
            onReply={handleReply}
            onResolve={handleResolve}
          />
        </div>
      );
    }

    default:
      return (
        <div className="hive-panel-empty">
          <p>Select a feature to get started</p>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// HivePanel
// ---------------------------------------------------------------------------

export interface HivePanelProps {
  /** Sidebar width in pixels */
  sidebarWidth?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function HivePanel({
  sidebarWidth = 280,
  className,
  style,
}: HivePanelProps = {}): React.ReactElement {
  return (
    <div
      data-testid="hive-panel"
      className={`hive-panel ${className ?? ''}`.trim()}
      style={{ height: '100%', ...style }}
    >
      <Layout hasSider style={{ height: '100%' }}>
        <Sider
          width={sidebarWidth}
          style={{
            background: 'var(--ant-color-bg-container)',
            overflow: 'auto',
          }}
          data-testid="hive-panel-sidebar"
        >
          <FeatureSidebar>
            <FeatureSidebar.Navigator />
            <FeatureSidebar.ChangedFiles />
          </FeatureSidebar>
        </Sider>
        <Layout>
          <Content
            style={{ padding: 16, overflow: 'auto' }}
            data-testid="hive-panel-content"
          >
            <HivePanelContent />
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
