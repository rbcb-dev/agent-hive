/**
 * ThreadPanel component - Single thread with comments and reply input
 */

import React, { useState } from 'react';
import type { ReviewThread, ReviewAnnotation } from 'hive-core';

export interface ThreadPanelProps {
  thread: ReviewThread | null;
  onReply: (threadId: string, body: string) => void;
  onResolve: (threadId: string) => void;
}

function AnnotationItem({ annotation }: { annotation: ReviewAnnotation }): React.ReactElement {
  const isLLM = annotation.author.type === 'llm';
  
  return (
    <div className={`annotation ${isLLM ? 'annotation-llm' : 'annotation-human'}`}>
      <div className="annotation-header">
        <span className="annotation-author">{annotation.author.name}</span>
        {isLLM && <span className="annotation-badge">AI</span>}
        <span className="annotation-time">
          {new Date(annotation.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="annotation-body">{annotation.body}</div>
      {annotation.suggestion && (
        <div className="annotation-suggestion">
          <span className="suggestion-label">Suggestion:</span>
          <pre className="suggestion-code">{annotation.suggestion.replacement}</pre>
        </div>
      )}
    </div>
  );
}

export function ThreadPanel({ thread, onReply, onResolve }: ThreadPanelProps): React.ReactElement {
  const [replyText, setReplyText] = useState('');

  if (!thread) {
    return (
      <div className="thread-panel thread-panel-empty">
        <p>Select a thread to view</p>
      </div>
    );
  }

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

  return (
    <div className="thread-panel">
      <div className="thread-panel-header">
        {thread.uri && (
          <div className="thread-location">
            <span className="thread-file">{thread.uri}</span>
            <span className="thread-line">line {thread.range.start.line + 1}</span>
          </div>
        )}
        <div className="thread-actions">
          {thread.status === 'open' && (
            <button
              className="btn-resolve"
              onClick={() => onResolve(thread.id)}
            >
              Resolve
            </button>
          )}
        </div>
      </div>

      <div className="thread-annotations">
        {thread.annotations.map((annotation) => (
          <AnnotationItem key={annotation.id} annotation={annotation} />
        ))}
      </div>

      <div className="thread-reply">
        <textarea
          className="reply-input"
          placeholder="Reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          className="btn-reply"
          onClick={handleReply}
          disabled={!replyText.trim()}
        >
          Reply
        </button>
      </div>
    </div>
  );
}
