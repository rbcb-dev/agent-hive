/**
 * ThreadList component - List of review threads with status
 */

import React from 'react';
import type { ThreadSummary } from '../types';

export interface ThreadListProps {
  threads: ThreadSummary[];
  selectedThread: string | null;
  onSelectThread: (threadId: string) => void;
}

function getStatusColor(status: ThreadSummary['status']): string {
  switch (status) {
    case 'open': return 'var(--vscode-charts-yellow, #cca700)';
    case 'resolved': return 'var(--vscode-charts-green, #388a34)';
    case 'outdated': return 'var(--vscode-descriptionForeground, #999999)';
    default: return 'var(--vscode-foreground)';
  }
}

export function ThreadList({ threads, selectedThread, onSelectThread }: ThreadListProps): React.ReactElement {
  if (threads.length === 0) {
    return (
      <div className="thread-list thread-list-empty">
        <p>No comments yet</p>
      </div>
    );
  }

  return (
    <div className="thread-list">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className={`thread-list-item ${selectedThread === thread.id ? 'selected' : ''}`}
          onClick={() => onSelectThread(thread.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectThread(thread.id)}
        >
          <div className="thread-header">
            {thread.uri && <span className="thread-file">{thread.uri}</span>}
            <span
              className="thread-status"
              style={{ color: getStatusColor(thread.status) }}
            >
              {thread.status}
            </span>
          </div>
          <div className="thread-preview">{thread.firstLine}</div>
          <div className="thread-meta">
            <span className="comment-count">{thread.commentCount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
