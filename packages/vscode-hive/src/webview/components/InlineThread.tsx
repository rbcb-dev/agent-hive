/**
 * InlineThread component - Displays a thread inline below a code line
 * with annotations, reply input, and resolve functionality.
 * Uses the shared ThreadView component with compact mode.
 */

import React from 'react';
import type { ReviewThread } from 'hive-core';
import { ThreadView } from './ThreadView';

export interface InlineThreadProps {
  /** The thread to display */
  thread: ReviewThread;
  /** Called when user submits a reply */
  onReply: (threadId: string, body: string) => void;
  /** Called when user resolves the thread */
  onResolve: (threadId: string) => void;
  /** Called when user closes the inline thread view */
  onClose: () => void;
}

export function InlineThread({
  thread,
  onReply,
  onResolve,
  onClose,
}: InlineThreadProps): React.ReactElement {
  const isResolved = thread.status === 'resolved';

  return (
    <div
      className={`inline-thread ${isResolved ? 'thread-resolved' : ''}`}
      data-testid="inline-thread"
    >
      <div className="inline-thread-header">
        <span className="thread-status-label">
          {isResolved ? 'Resolved' : 'Open'}
        </span>
        <div className="inline-thread-actions">
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close thread"
          >
            ×
          </button>
        </div>
      </div>

      <ThreadView
        thread={thread}
        onReply={(body) => onReply(thread.id, body)}
        onResolve={() => onResolve(thread.id)}
        compact
      />
    </div>
  );
}
