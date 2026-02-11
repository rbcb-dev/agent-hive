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

import React from 'react';
import { Layout } from '../primitives';
import { FeatureSidebar } from './FeatureSidebar';
import { DiffViewer } from './DiffViewer';
import { useHiveWorkspace } from '../providers/HiveWorkspaceProvider';

const { Sider, Content } = Layout;

// ---------------------------------------------------------------------------
// Content routing
// ---------------------------------------------------------------------------

function HivePanelContent(): React.ReactElement {
  const { state } = useHiveWorkspace();
  const { activeView, activeFeature, activeTask, activeFile } = state;

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
          <p>Plan view for {activeFeature}</p>
        </div>
      );

    case 'context':
      return (
        <div className="hive-panel-context">
          <p>Context view for {activeFeature}</p>
        </div>
      );

    case 'task':
      return (
        <div className="hive-panel-task">
          <h3>{activeTask}</h3>
          <p>Task details for {activeTask ?? 'no task selected'}</p>
        </div>
      );

    case 'diff':
    case 'code':
      return (
        <div className="hive-panel-diff">
          <DiffViewer file={null} />
          {activeFile && (
            <p className="hive-panel-file-path">{activeFile}</p>
          )}
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
          style={{ background: 'var(--ant-color-bg-container)', overflow: 'auto' }}
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
