/**
 * DiffViewer component - Professional diff display using react-diff-view
 *
 * Maintains backward compatibility with existing DiffFile-based API while
 * internally using react-diff-view for better rendering and features.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Diff, Hunk, parseDiff, getChangeKey } from 'react-diff-view';
import type {
  HunkData,
  ChangeData,
  ChangeEventArgs,
  EventMap,
  RenderGutter,
} from 'react-diff-view';
import type { DiffFile, ReviewThread } from 'hive-core';
import { InlineDiffThread } from './InlineDiffThread';
import { InlineThreadComposer } from './InlineThreadComposer';
import 'react-diff-view/style/index.css';

export interface DiffViewerProps {
  file: DiffFile | null;
  viewType?: 'unified' | 'split';
  onLineClick?: (path: string, lineNumber: number) => void;
  threads?: ReviewThread[];
  onAddThread?: (path: string, line: number, body: string) => void;
  onReply?: (threadId: string, body: string) => void;
  onResolve?: (threadId: string) => void;
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
  threads,
  onAddThread,
  onReply,
  onResolve,
}: DiffViewerProps): React.ReactElement {
  // Track which change key has the composer open (null = closed)
  const [composerChangeKey, setComposerChangeKey] = useState<string | null>(
    null,
  );
  // Track the line number for the composer (needed for onAddThread callback)
  const [composerLineNumber, setComposerLineNumber] = useState<number | null>(
    null,
  );

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

  // Build a set of line numbers that have threads for gutter indicators
  const threadLineNumbers = useMemo(() => {
    if (!threads || threads.length === 0) return new Set<number>();
    return new Set(threads.map((t) => t.range.start.line));
  }, [threads]);

  // Build widgets map: changeKey → InlineDiffThread widget(s) + composer widget
  const widgets = useMemo(() => {
    const widgetMap: Record<string, React.ReactNode> = {};

    // Add thread widgets — support multiple threads per change key
    if (threads && threads.length > 0 && parsedFile) {
      const allChanges: ChangeData[] = parsedFile.hunks.reduce<ChangeData[]>(
        (acc, hunk) => [...acc, ...hunk.changes],
        [],
      );

      // Group threads by change key
      const threadsByKey = new Map<string, typeof threads>();

      for (const thread of threads) {
        const targetLine = thread.range.start.line;

        // Find the change matching this line number
        const matchingChange = allChanges.find((change) => {
          if (change.type === 'insert') return change.lineNumber === targetLine;
          if (change.type === 'delete') return change.lineNumber === targetLine;
          if (change.type === 'normal')
            return (
              change.newLineNumber === targetLine ||
              change.oldLineNumber === targetLine
            );
          return false;
        });

        if (matchingChange) {
          const key = getChangeKey(matchingChange);
          const existing = threadsByKey.get(key) ?? [];
          existing.push(thread);
          threadsByKey.set(key, existing);
        }
      }

      // Render grouped threads into widget map
      for (const [key, keyThreads] of threadsByKey) {
        widgetMap[key] = (
          <>
            {keyThreads.map((thread) => (
              <InlineDiffThread
                key={thread.id}
                thread={thread}
                onReply={onReply ?? (() => {})}
                onResolve={onResolve ?? (() => {})}
              />
            ))}
          </>
        );
      }
    }

    // Add composer widget if active
    if (composerChangeKey && onAddThread && file) {
      widgetMap[composerChangeKey] = (
        <InlineThreadComposer
          onSubmit={(body) => {
            if (composerLineNumber !== null) {
              onAddThread(file.path, composerLineNumber, body);
            }
            setComposerChangeKey(null);
            setComposerLineNumber(null);
          }}
          onCancel={() => {
            setComposerChangeKey(null);
            setComposerLineNumber(null);
          }}
        />
      );
    }

    return Object.keys(widgetMap).length > 0 ? widgetMap : undefined;
  }, [
    threads,
    parsedFile,
    onReply,
    onResolve,
    composerChangeKey,
    composerLineNumber,
    onAddThread,
    file,
  ]);

  // Custom gutter renderer to show thread indicators
  const renderGutter: RenderGutter | undefined = useMemo(() => {
    if (threadLineNumbers.size === 0) return undefined;

    return ({ change, side, renderDefault, inHoverState, wrapInAnchor }) => {
      const lineNumber =
        change.type === 'insert'
          ? change.lineNumber
          : change.type === 'delete'
            ? change.lineNumber
            : change.newLineNumber;

      if (lineNumber !== undefined && threadLineNumbers.has(lineNumber)) {
        return (
          <>
            {renderDefault()}
            <span className="thread-indicator" title="Has comment thread">
              💬
            </span>
          </>
        );
      }

      return renderDefault();
    };
  }, [threadLineNumbers]);

  // Helper to extract line number from a change
  const getLineNumber = useCallback(
    (change: ChangeData): number | undefined => {
      if (change.type === 'insert') return change.lineNumber;
      if (change.type === 'delete') return change.lineNumber;
      if (change.type === 'normal') return change.newLineNumber;
      return undefined;
    },
    [],
  );

  // Handle gutter click events for line selection and thread creation
  const gutterEvents: EventMap | undefined =
    onLineClick || onAddThread
      ? {
          onClick: (args: ChangeEventArgs) => {
            const { change } = args;
            if (change) {
              const lineNumber = getLineNumber(change);
              if (lineNumber !== undefined) {
                // If onAddThread is provided, open the composer
                if (onAddThread) {
                  const key = getChangeKey(change);
                  setComposerChangeKey(key);
                  setComposerLineNumber(lineNumber);
                }
                // Also fire onLineClick if provided
                if (onLineClick && file) {
                  onLineClick(file.path, lineNumber);
                }
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
            widgets={widgets}
            renderGutter={renderGutter}
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
