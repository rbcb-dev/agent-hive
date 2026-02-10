/**
 * MarkdownViewer component - Display markdown with raw/rendered toggle
 *
 * Supports:
 * - Rendered markdown preview with syntax-highlighted code blocks (via Shiki)
 * - Raw markdown with line numbers for thread anchoring
 * - Toggle between views while preserving anchoring
 * - XSS sanitization for security
 *
 * BREAKING CHANGE: theme prop has been removed. Theme is now obtained from
 * HiveThemeProvider context via useTheme() hook. Components using MarkdownViewer
 * must be wrapped in HiveThemeProvider.
 */
import React from 'react';
export interface MarkdownViewerProps {
    /** Markdown content to display */
    content: string | null;
    /** File path for header display */
    filePath?: string;
    /** Callback when a line is clicked in raw view (for thread anchoring) */
    onLineClick?: (lineNumber: number) => void;
    /** Whether to enable code block highlighting (default: true) */
    highlightCode?: boolean;
    /** Maximum height for the viewer container. When set, enables scrolling for long content. */
    maxHeight?: number | string;
}
export declare function MarkdownViewer({ content, filePath, onLineClick, highlightCode, maxHeight, }: MarkdownViewerProps): React.ReactElement;
