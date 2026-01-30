/**
 * InlineThread component - Displays a thread inline below a code line
 * with annotations, reply input, and resolve functionality.
 */

import React, { useState } from 'react';
import type { ReviewThread, ReviewAnnotation } from 'hive-core';

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

function AnnotationItem({ annotation }: { annotation: ReviewAnnotation }): React.ReactElement {
  const isLLM = annotation.author.type === 'llm';

  return (
    <div className={`inline-annotation ${isLLM ? 'annotation-llm' : 'annotation-human'}`}>
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
          <pre className="suggestion-code">{annotation.suggestion.replacement}</pre>
        </div>
      ) : null}
    </div>
  );
}

export function InlineThread({
  thread,
  onReply,
  onResolve,
  onClose,
}: InlineThreadProps): React.ReactElement {
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(thread.id, replyText.trim());
      setReplyText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleReply();
    }
  };

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
          {!isResolved ? (
            <button
              className="btn-resolve"
              onClick={() => onResolve(thread.id)}
              aria-label="Mark thread as resolved"
            >
              Resolve
            </button>
          ) : null}
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close thread"
          >
            ×
          </button>
        </div>
      </div>

      <div className="inline-thread-annotations">
        {thread.annotations.map((annotation) => (
          <AnnotationItem key={annotation.id} annotation={annotation} />
        ))}
      </div>

      <div className="inline-thread-reply">
        <label htmlFor={`reply-input-${thread.id}`} className="visually-hidden">
          Reply to thread
        </label>
        <textarea
          id={`reply-input-${thread.id}`}
          className="reply-input"
          placeholder="Reply…"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          aria-describedby={`reply-hint-${thread.id}`}
        />
        <span id={`reply-hint-${thread.id}`} className="visually-hidden">
          Press Cmd+Enter to submit
        </span>
        <button
          className="btn-reply"
          onClick={handleReply}
          disabled={!replyText.trim()}
          aria-label="Reply"
        >
          Reply
        </button>
      </div>
    </div>
  );
}
