/**
 * DiffViewer component - Basic diff display
 */

import React from 'react';
import type { DiffFile, DiffHunk, DiffHunkLine } from 'hive-core';

export interface DiffViewerProps {
  file: DiffFile | null;
}

function DiffLine({ line }: { line: DiffHunkLine }): React.ReactElement {
  const classMap = {
    context: 'line-context',
    add: 'line-add',
    remove: 'line-remove',
  };

  const prefixMap = {
    context: ' ',
    add: '+',
    remove: '-',
  };

  const ariaLabelMap = {
    context: 'unchanged',
    add: 'added',
    remove: 'removed',
  };

  return (
    <div
      className={`diff-line ${classMap[line.type]}`}
      role="row"
      aria-label={`${ariaLabelMap[line.type]} line: ${line.content}`}
    >
      <span className="line-prefix" aria-hidden="true">{prefixMap[line.type]}</span>
      <span className="line-content">{line.content}</span>
    </div>
  );
}

function DiffHunkView({ hunk }: { hunk: DiffHunk }): React.ReactElement {
  return (
    <div className="diff-hunk" role="region" aria-label={`Diff hunk starting at line ${hunk.newStart}`}>
      <div className="hunk-header" aria-label={`Hunk header: lines ${hunk.oldStart} to ${hunk.oldStart + hunk.oldLines - 1} changed to lines ${hunk.newStart} to ${hunk.newStart + hunk.newLines - 1}`}>
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>
      <div className="hunk-lines" role="rowgroup" aria-label="Diff lines">
        {hunk.lines.map((line, index) => (
          <DiffLine key={`${hunk.newStart}-${index}-${line.type}`} line={line} />
        ))}
      </div>
    </div>
  );
}

export function DiffViewer({ file }: DiffViewerProps): React.ReactElement {
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
        {file.hunks.map((hunk, index) => (
          <DiffHunkView key={index} hunk={hunk} />
        ))}
      </div>
    </div>
  );
}
