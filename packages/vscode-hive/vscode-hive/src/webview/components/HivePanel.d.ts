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
export interface HivePanelProps {
    /** Sidebar width in pixels */
    sidebarWidth?: number;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
export declare function HivePanel({ sidebarWidth, className, style, }?: HivePanelProps): React.ReactElement;
