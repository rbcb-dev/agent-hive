/**
 * ThreadPanel component - Single thread with comments and reply input
 * Uses the shared ThreadView component with full mode.
 */

import React from 'react';
import type { ReviewThread } from 'hive-core';
import { ThreadView } from './ThreadView';

export interface ThreadPanelProps {
  thread: ReviewThread | null;
  onReply: (threadId: string, body: string) => void;
  onResolve: (threadId: string) => void;
}

export function ThreadPanel({ thread, onReply, onResolve }: ThreadPanelProps): React.ReactElement {
  if (!thread) {
    return (
      <div className="thread-panel thread-panel-empty">
        <p>Select a thread to view</p>
      </div>
    );
  }

  return (
    <div className="thread-panel" style={{ overflow: 'auto' }}>
      <div className="thread-panel-header">
        {thread.uri && (
          <div className="thread-location">
            <span className="thread-file">{thread.uri}</span>
            <span className="thread-line">line {thread.range.start.line + 1}</span>
          </div>
        )}
      </div>

      <ThreadView
        thread={thread}
        onReply={(body) => onReply(thread.id, body)}
        onResolve={() => onResolve(thread.id)}
        compact={false}
      />
    </div>
  );
}
