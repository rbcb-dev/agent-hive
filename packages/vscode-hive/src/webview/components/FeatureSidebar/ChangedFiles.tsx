/**
 * ChangedFiles — File tree sub-component of FeatureSidebar
 *
 * Shows changed files with diff status indicators (A/M/D/R/C).
 * - Feature-level: aggregates files from ALL tasks, latest task wins for duplicates
 * - Task-level: shows only that task's files
 *
 * Consumes state from HiveWorkspaceProvider — no data props needed.
 */

import React, { useMemo, useCallback } from 'react';
import { Typography } from '../../primitives';
import { FileIcon } from '../FileIcon';
import { useHiveWorkspace } from '../../providers/HiveWorkspaceProvider';
import { useFeatureSidebar } from './FeatureSidebarContext';
import {
  aggregateChangedFiles,
  STATUS_COLORS,
  STATUS_LABELS,
} from './types';
import type { ChangedFileEntry, DiffStatus } from './types';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: DiffStatus }): React.ReactElement {
  return (
    <Text
      data-testid={`status-badge-${status}`}
      style={{
        color: STATUS_COLORS[status],
        fontWeight: 600,
        fontSize: 11,
        marginLeft: 8,
        flexShrink: 0,
      }}
      title={STATUS_LABELS[status]}
    >
      {status}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// File entry component
// ---------------------------------------------------------------------------

function ChangedFileItem({
  entry,
  onClick,
}: {
  entry: ChangedFileEntry;
  onClick: (path: string) => void;
}): React.ReactElement {
  const handleClick = useCallback(() => {
    onClick(entry.path);
  }, [entry.path, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(entry.path);
      }
    },
    [entry.path, onClick],
  );

  const filename = entry.path.split('/').pop() ?? entry.path;

  return (
    <div
      data-testid={`changed-file-${entry.path}`}
      className="changed-file-item"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '2px 8px',
        cursor: 'pointer',
        gap: 4,
      }}
    >
      <FileIcon filename={filename} isDirectory={false} />

      {entry.status === 'R' && entry.oldPath ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: 12 }}
            ellipsis
            title={entry.oldPath}
          >
            {entry.oldPath}
          </Text>
          <Text type="secondary" style={{ flexShrink: 0 }}>→</Text>
          <Text
            style={{ fontSize: 12 }}
            ellipsis
            title={entry.path}
          >
            {entry.path}
          </Text>
        </span>
      ) : (
        <Text
          style={{ fontSize: 12, flex: 1, minWidth: 0 }}
          ellipsis
          title={entry.path}
        >
          {entry.path}
        </Text>
      )}

      <StatusBadge status={entry.status} />

      {(entry.additions > 0 || entry.deletions > 0) && (
        <span style={{ display: 'flex', gap: 4, marginLeft: 4, flexShrink: 0 }}>
          {entry.additions > 0 && (
            <Text style={{ color: '#3fb950', fontSize: 11 }}>
              +{entry.additions}
            </Text>
          )}
          {entry.deletions > 0 && (
            <Text style={{ color: '#f85149', fontSize: 11 }}>
              -{entry.deletions}
            </Text>
          )}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChangedFiles(): React.ReactElement {
  // Validate compound component context
  useFeatureSidebar();

  const { state, actions } = useHiveWorkspace();
  const { activeFeature, activeTask, fileChanges } = state;

  const entries = useMemo(() => {
    if (!activeFeature) return [];
    return aggregateChangedFiles(fileChanges, activeTask);
  }, [activeFeature, activeTask, fileChanges]);

  const handleFileClick = useCallback(
    (path: string) => {
      actions.selectFile(path);
    },
    [actions],
  );

  if (!activeFeature || entries.length === 0) {
    return (
      <div className="feature-sidebar-changed-files feature-sidebar-changed-files-empty">
        <Text type="secondary">No files to display</Text>
      </div>
    );
  }

  return (
    <div className="feature-sidebar-changed-files">
      <Text
        strong
        style={{ padding: '4px 8px', display: 'block', fontSize: 11 }}
      >
        Changed Files
      </Text>
      {entries.map((entry) => (
        <ChangedFileItem
          key={`${entry.taskFolder}-${entry.path}`}
          entry={entry}
          onClick={handleFileClick}
        />
      ))}
    </div>
  );
}
