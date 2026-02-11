/**
 * CommitHistory — Shows commit history for a task
 *
 * Displays a list of commits with:
 * - 7-char short SHA
 * - Commit message
 * - Relative timestamp
 *
 * Shows "No commits yet" for empty commit lists.
 */

import React from 'react';
import { Flex, Typography } from '../primitives';
import type { TaskCommit } from 'hive-core';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CommitHistoryProps {
  commits: TaskCommit[];
  onCommitSelect?: (sha: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorten a SHA to 7 characters */
function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Format a timestamp as a relative time string */
function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return 'just now';
}

// ---------------------------------------------------------------------------
// CommitItem
// ---------------------------------------------------------------------------

interface CommitItemProps {
  commit: TaskCommit;
  onClick?: () => void;
}

function CommitItem({ commit, onClick }: CommitItemProps): React.ReactElement {
  const short = shortSha(commit.sha);
  const time = relativeTime(commit.timestamp);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onClick) {
      onClick();
    }
  };

  return (
    <div
      role="listitem"
      aria-label={`Commit ${short}: ${commit.message}`}
      className="commit-history-item"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      style={{
        padding: '6px 8px',
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: '1px solid var(--vscode-widget-border, #333)',
      }}
    >
      <Flex gap={8} align="center">
        <Text
          code
          style={{
            fontSize: 12,
            color: 'var(--vscode-textLink-foreground, #3794ff)',
            flexShrink: 0,
          }}
        >
          {short}
        </Text>
        <Text
          ellipsis
          style={{
            flex: 1,
            fontSize: 13,
          }}
        >
          {commit.message}
        </Text>
        <Text
          type="secondary"
          style={{
            fontSize: 11,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {time}
        </Text>
      </Flex>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommitHistory
// ---------------------------------------------------------------------------

export function CommitHistory({
  commits,
  onCommitSelect,
}: CommitHistoryProps): React.ReactElement {
  if (commits.length === 0) {
    return (
      <div className="commit-history-empty">
        <Text type="secondary">No commits yet</Text>
      </div>
    );
  }

  return (
    <div className="commit-history" role="list" aria-label="Commit history">
      {commits.map((commit) => (
        <CommitItem
          key={commit.sha}
          commit={commit}
          onClick={
            onCommitSelect ? () => onCommitSelect(commit.sha) : undefined
          }
        />
      ))}
    </div>
  );
}
