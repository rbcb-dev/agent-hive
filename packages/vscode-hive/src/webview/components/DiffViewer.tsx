/**
 * DiffViewer component - Professional diff display using react-diff-view
 *
 * Maintains backward compatibility with existing DiffFile-based API while
 * internally using react-diff-view for better rendering and features.
 */

import React, { useMemo } from 'react';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import type {
  HunkData,
  ChangeData,
  ChangeEventArgs,
  EventMap,
} from 'react-diff-view';
import type { DiffFile } from 'hive-core';
import 'react-diff-view/style/index.css';

export interface DiffViewerProps {
  file: DiffFile | null;
  viewType?: 'unified' | 'split';
  onLineClick?: (path: string, lineNumber: number) => void;
}

/**
 * Convert our internal DiffFile format to a unified diff string
 * that react-diff-view can parse
 */
function convertToUnifiedDiff(file: DiffFile): string {
  const lines: string[] = [];

  // Add the file header
  lines.push(`diff --git a/${file.path} b/${file.path}`);
  lines.push(`--- a/${file.path}`);
  lines.push(`+++ b/${file.path}`);

  // Add each hunk
  for (const hunk of file.hunks) {
    // Hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    lines.push(
      `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
    );

    // Add hunk lines with proper prefixes
    for (const line of hunk.lines) {
      const prefix =
        line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
      lines.push(`${prefix}${line.content}`);
    }
  }

  return lines.join('\n');
}

/**
 * Map file status to diff type
 */
function getDiffType(
  status: DiffFile['status'],
): 'add' | 'delete' | 'modify' | 'rename' | 'copy' {
  switch (status) {
    case 'A':
      return 'add';
    case 'D':
      return 'delete';
    case 'R':
      return 'rename';
    case 'C':
      return 'copy';
    case 'M':
    case 'U':
    case 'B':
    default:
      return 'modify';
  }
}

export function DiffViewer({
  file,
  viewType = 'unified',
  onLineClick,
}: DiffViewerProps): React.ReactElement {
  // Parse the diff using react-diff-view
  const parsedFiles = useMemo(() => {
    if (!file || file.isBinary || file.hunks.length === 0) {
      return [];
    }

    try {
      const unifiedDiff = convertToUnifiedDiff(file);
      return parseDiff(unifiedDiff);
    } catch (error) {
      console.error('Failed to parse diff:', error);
      return [];
    }
  }, [file]);

  if (!file) {
    return (
      <div className="diff-viewer diff-viewer-empty">
        <p>Select a file to view diff</p>
      </div>
    );
  }

  if (file.isBinary) {
    return (
      <div className="diff-viewer diff-viewer-binary">
        <div className="diff-header">
          <span className="file-path">{file.path}</span>
        </div>
        <p className="binary-message">Binary file not shown</p>
      </div>
    );
  }

  const diffType = getDiffType(file.status);
  const parsedFile = parsedFiles[0];

  // Handle gutter click events for line selection
  const gutterEvents: EventMap | undefined = onLineClick
    ? {
        onClick: (args: ChangeEventArgs) => {
          const { change } = args;
          if (change) {
            // Get line number from the change - handle different change types
            let lineNumber: number | undefined;
            if (change.type === 'insert') {
              lineNumber = change.lineNumber;
            } else if (change.type === 'delete') {
              lineNumber = change.lineNumber;
            } else if (change.type === 'normal') {
              lineNumber = change.newLineNumber;
            }
            if (lineNumber !== undefined) {
              onLineClick(file.path, lineNumber);
            }
          }
        },
      }
    : undefined;

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <span className="file-path">{file.path}</span>
        <span className="file-stats">
          <span className="additions">+{file.additions}</span>
          <span className="deletions">-{file.deletions}</span>
        </span>
      </div>
      <div className="diff-content">
        {parsedFile && parsedFile.hunks.length > 0 ? (
          <Diff
            viewType={viewType}
            diffType={diffType}
            hunks={parsedFile.hunks}
            gutterEvents={gutterEvents}
          >
            {(hunks: HunkData[]) =>
              hunks.map((hunk) => (
                <Hunk key={`${hunk.oldStart}-${hunk.newStart}`} hunk={hunk} />
              ))
            }
          </Diff>
        ) : (
          // Fallback for empty or unparseable diffs
          <div className="diff-empty">
            <p>No changes to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
