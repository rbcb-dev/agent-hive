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
import React from 'react';
/**
 * Check if a file path is a markdown file
 */
export declare function isMarkdownFile(filePath: string): boolean;
export declare function App(): React.ReactElement;
