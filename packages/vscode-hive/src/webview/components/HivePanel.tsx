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
import type { DiffFile } from 'hive-core';

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
  const { state } = useHiveWorkspace();
  const { activeView, activeFeature, activeTask, activeFile, fileChanges } =
    state;
  const { planContent, planComments, contextContent } = useWorkspaceContent();

  // Resolve the selected diff file from workspace state
  const selectedDiffFile = useMemo(() => {
    if (!activeFile || fileChanges.size === 0) return null;
    return resolveFileFromChanges(fileChanges, activeFile);
  }, [activeFile, fileChanges]);

  // Plan comment callbacks — send messages to extension
  const handleAddPlanComment = useCallback(
    (line: number, body: string) => {
      if (activeFeature) {
        postMessage({
          type: 'addPlanComment',
          feature: activeFeature,
          line,
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
          <CommitHistory commits={[]} />
        </div>
      );

    case 'diff':
    case 'code':
      return (
        <div className="hive-panel-diff">
          <DiffViewer file={selectedDiffFile} />
        </div>
      );

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
