/**
 * CodeViewer component - Renders code with VS Code-style syntax highlighting and line numbers
 * Uses Shiki for accurate TextMate-based highlighting with bundled themes.
 * Supports thread markers in the gutter for inline thread display.
 *
 * BREAKING CHANGE: theme prop has been removed. Theme is now obtained from
 * HiveThemeProvider context via useTheme() hook. Components using CodeViewer
 * must be wrapped in HiveThemeProvider.
 */
import React from 'react';
import type { ReviewThread } from 'hive-core';
export interface CodeViewerProps {
    /** The code to display */
    code: string;
    /** Programming language for syntax highlighting */
    language: string;
    /** Starting line number (default: 1) */
    startLine?: number;
    /** Whether to show line numbers (default: true) */
    showLineNumbers?: boolean;
    /** Lines to highlight (1-indexed) */
    highlightLines?: number[];
    /** Line types for diff display (1-indexed) */
    lineTypes?: Record<number, 'add' | 'remove' | 'context'>;
    /** Optional CSS class name */
    className?: string;
    /** Review threads anchored to lines in this file (0-indexed line numbers in range.start.line) */
    threads?: ReviewThread[];
    /** Called when a thread marker is clicked */
    onThreadClick?: (threads: ReviewThread[], lineNumber: number) => void;
    /** Called when user replies to a thread */
    onThreadReply?: (threadId: string, body: string) => void;
    /** Called when user resolves a thread */
    onThreadResolve?: (threadId: string) => void;
}
export declare function CodeViewer({ code, language, startLine, showLineNumbers, highlightLines, lineTypes, className, threads, onThreadClick, onThreadReply, onThreadResolve, }: CodeViewerProps): React.ReactElement;
