/**
 * FileIcon component - Shows file/folder icons using VS Code codicons
 *
 * Uses @vscode/codicons for lightweight, VS Code-style icons.
 * Maps common file extensions to appropriate icon categories.
 */
import React from 'react';
import '@vscode/codicons/dist/codicon.css';
export interface FileIconProps {
    /** The filename to determine the icon from */
    filename: string;
    /** Whether this is a directory (shows folder icon) */
    isDirectory: boolean;
}
/**
 * FileIcon component - Renders codicon icons for files and folders
 */
export declare function FileIcon({ filename, isDirectory, }: FileIconProps): React.ReactElement;
