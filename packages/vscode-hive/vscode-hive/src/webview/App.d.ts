/**
 * Main App component - Hive Review UI
 *
 * This component now uses custom hooks for state management:
 * - useReviewSession: Manages session state, scope, file/thread selection, and extension messaging
 * - useFileContentCache: Manages file content caching with TTL
 *
 * Layout:
 * Uses antd Layout components with HiveThemeProvider for theming:
 * - Layout: Root container with minHeight 100vh
 * - Header: Contains ScopeTabs for navigation
 * - Sider: Collapsible sidebar with FileNavigator and ThreadList
 * - Content: Main content area with DiffViewer/CodeViewer/MarkdownViewer
 * - Footer: ReviewSummary for submission
 */
import React from 'react';
/**
 * Check if a file path is a markdown file
 */
export declare function isMarkdownFile(filePath: string): boolean;
export declare function App(): React.ReactElement;
