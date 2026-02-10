/**
 * FileNavigator component - Tree view of files with thread count badges
 *
 * Displays a hierarchical folder structure with files from the review scope.
 * Shows thread count badges per file and supports click-to-load inline viewing.
 *
 * Uses antd Tree with virtual scrolling for large file trees.
 */
import React from 'react';
import type { ReviewThread } from 'hive-core';
export interface FileNavigatorProps {
    /** List of file paths in the review scope */
    files: string[];
    /** All review threads (used to compute per-file counts) */
    threads: ReviewThread[];
    /** Currently selected file path, or null */
    selectedFile: string | null;
    /** Callback when a file is selected - receives full file path */
    onSelectFile: (path: string) => void;
}
export declare function FileNavigator({ files, threads, selectedFile, onSelectFile, }: FileNavigatorProps): React.ReactElement;
