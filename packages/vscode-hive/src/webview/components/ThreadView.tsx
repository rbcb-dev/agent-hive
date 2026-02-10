/**
 * ThreadView component - Shared thread display with annotations, reply input, and resolve functionality.
 * Used by both InlineThread (compact mode) and ThreadPanel (full mode).
 */

import React, { useState } from 'react';
import type { ReviewThread, ReviewAnnotation } from 'hive-core';
import { Button } from '../primitives';

export interface ThreadViewProps {
  /** The thread to display */
  thread: ReviewThread;
  /** Called when user submits a reply */
  onReply: (body: string) => void;
  /** Called when user resolves the thread */
  onResolve: () => void;
  /** Compact mode for inline display (fewer rows, smaller spacing) */
  compact?: boolean;
}

function AnnotationItem({
  annotation,
}: {
  annotation: ReviewAnnotation;
}): React.ReactElement {
  const isLLM = annotation.author.type === 'llm';

  return (
    <div
      className={`thread-view-annotation ${isLLM ? 'annotation-llm' : 'annotation-human'}`}
    >
      <div className="annotation-header">
        <span className="annotation-author">{annotation.author.name}</span>
        {isLLM ? <span className="annotation-badge">AI</span> : null}
        <span className="annotation-time">
          {new Date(annotation.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="annotation-body">{annotation.body}</div>
      {annotation.suggestion ? (
        <div className="annotation-suggestion">
          <span className="suggestion-label">Suggestion:</span>
          <pre className="suggestion-code">
            {annotation.suggestion.replacement}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function ThreadView({
  thread,
  onReply,
  onResolve,
  compact = false,
}: ThreadViewProps): React.ReactElement {
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(replyText.trim());
      setReplyText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleReply();
    }
  };

  const isResolved = thread.status === 'resolved';
  const textareaRows = compact ? 2 : 3;
  const inputId = `thread-reply-input-${thread.id}`;
  const hintId = `thread-reply-hint-${thread.id}`;

  const classNames = [
    'thread-view',
    isResolved ? 'thread-view-resolved' : '',
    compact ? 'thread-view-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} data-testid="thread-view">
      <div className="thread-view-header">
        {!isResolved ? (
          <Button
            type="text"
            size="small"
            icon={<span className="codicon codicon-check" />}
            aria-label="Mark thread as resolved"
            onClick={onResolve}
          >
            Resolve
          </Button>
        ) : null}
      </div>

      <div className="thread-view-annotations">
        {thread.annotations.map((annotation) => (
          <AnnotationItem key={annotation.id} annotation={annotation} />
        ))}
      </div>

      <div className="thread-view-reply">
        <label htmlFor={inputId} className="visually-hidden">
          Reply to thread
        </label>
        <textarea
          id={inputId}
          className="reply-input"
          placeholder="Reply…"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={textareaRows}
          aria-describedby={hintId}
        />
        <span id={hintId} className="visually-hidden">
          Press Cmd+Enter to submit
        </span>
        <Button
          type="text"
          size="small"
          icon={<span className="codicon codicon-reply" />}
          onClick={handleReply}
          disabled={!replyText.trim()}
          aria-label="Reply"
        >
          Reply
        </Button>
      </div>
    </div>
  );
}
