/**
 * DiffViewer component - Professional diff display using react-diff-view
 *
 * Maintains backward compatibility with existing DiffFile-based API while
 * internally using react-diff-view for better rendering and features.
 */
import React from 'react';
import type { DiffFile } from 'hive-core';
import 'react-diff-view/style/index.css';
export interface DiffViewerProps {
    file: DiffFile | null;
    viewType?: 'unified' | 'split';
    onLineClick?: (path: string, lineNumber: number) => void;
}
export declare function DiffViewer({ file, viewType, onLineClick, }: DiffViewerProps): React.ReactElement;
