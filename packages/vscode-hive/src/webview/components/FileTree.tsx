/**
 * FileTree component - Tree view of files with comment counts
 *
 * @deprecated Use FileNavigator instead. This component will be removed in v2.0.
 *
 * FileNavigator provides:
 * - Hierarchical folder structure with expand/collapse
 * - Thread count badges computed from ReviewThread[]
 * - Better state management for navigation
 */

import React from 'react';
import type { FileTreeItem } from '../types';

export interface FileTreeProps {
  files: FileTreeItem[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

function getStatusColor(status: FileTreeItem['status']): string {
  switch (status) {
    case 'A':
      return 'var(--vscode-gitDecoration-addedResourceForeground, #81b88b)';
    case 'M':
      return 'var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d)';
    case 'D':
      return 'var(--vscode-gitDecoration-deletedResourceForeground, #c74e39)';
    case 'R':
      return 'var(--vscode-gitDecoration-renamedResourceForeground, #73c991)';
    default:
      return 'var(--vscode-foreground)';
  }
}

export function FileTree({
  files,
  selectedFile,
  onSelectFile,
}: FileTreeProps): React.ReactElement {
  if (files.length === 0) {
    return (
      <div className="file-tree file-tree-empty">
        <p>No files to review</p>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {files.map((file) => (
        <div
          key={file.path}
          className={`file-tree-item ${selectedFile === file.path ? 'selected' : ''}`}
          onClick={() => onSelectFile(file.path)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectFile(file.path)}
        >
          <span
            className="file-status"
            style={{ color: getStatusColor(file.status) }}
          >
            {file.status}
          </span>
          <span className="file-name">{file.name}</span>
          <span className="file-stats">
            {file.additions > 0 && (
              <span className="additions">+{file.additions}</span>
            )}
            {file.deletions > 0 && (
              <span className="deletions">-{file.deletions}</span>
            )}
          </span>
          {file.commentCount > 0 && (
            <span className="comment-count">{file.commentCount}</span>
          )}
        </div>
      ))}
    </div>
  );
}
