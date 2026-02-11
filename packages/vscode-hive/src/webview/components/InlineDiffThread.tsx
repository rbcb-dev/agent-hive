/**
 * InlineDiffThread component - Renders a ReviewThread as a widget within a diff view.
 * Used by DiffViewer to inject thread UI at specific diff lines via react-diff-view's widget system.
 */

import React from 'react';
import type { ReviewThread } from 'hive-core';
import { ThreadView } from './ThreadView';

export interface InlineDiffThreadProps {
  /** The thread to display */
  thread: ReviewThread;
  /** Called when user submits a reply */
  onReply: (threadId: string, body: string) => void;
  /** Called when user resolves the thread */
  onResolve: (threadId: string) => void;
  /** Called when user unresolves a resolved thread */
  onUnresolve?: (threadId: string) => void;
  /** Called when user deletes the thread */
  onDelete?: (threadId: string) => void;
  /** Called when user edits an annotation body */
  onEditAnnotation?: (threadId: string, annotationId: string, body: string) => void;
  /** Called when user deletes an annotation */
  onDeleteAnnotation?: (threadId: string, annotationId: string) => void;
}

export function InlineDiffThread({
  thread,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
  onEditAnnotation,
  onDeleteAnnotation,
}: InlineDiffThreadProps): React.ReactElement {
  return (
    <div
      className="inline-diff-thread"
      data-testid="inline-diff-thread"
      data-thread-id={thread.id}
    >
      <ThreadView
        thread={thread}
        onReply={(body) => onReply(thread.id, body)}
        onResolve={() => onResolve(thread.id)}
        onUnresolve={onUnresolve ? () => onUnresolve(thread.id) : undefined}
        onDelete={onDelete ? () => onDelete(thread.id) : undefined}
        onEditAnnotation={
          onEditAnnotation
            ? (annotationId, body) => onEditAnnotation(thread.id, annotationId, body)
            : undefined
        }
        onDeleteAnnotation={
          onDeleteAnnotation
            ? (annotationId) => onDeleteAnnotation(thread.id, annotationId)
            : undefined
        }
        compact
      />
    </div>
  );
}
