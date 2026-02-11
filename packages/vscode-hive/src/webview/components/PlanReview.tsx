/**
 * PlanReview component — Read-only plan display with inline comment annotations
 *
 * Displays plan markdown with line numbers and a gutter for comment markers.
 * Users can click on a line gutter to add a new comment, and click on
 * existing comment markers to expand/collapse comment threads.
 *
 * This component is read-only for the plan content — it does not edit markdown.
 * It renders annotations (comments) inline, similar to CodeViewer's thread pattern.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { PlanComment } from 'hive-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlanReviewProps {
  /** Plan markdown content to display */
  content: string;
  /** Existing comments on the plan */
  comments: PlanComment[];
  /** Called when user adds a new comment on a line */
  onAddComment: (line: number, body: string) => void;
  /** Called when user resolves a comment */
  onResolveComment: (commentId: string) => void;
  /** Called when user replies to a comment */
  onReplyToComment: (commentId: string, body: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Group comments by line number */
function groupCommentsByLine(
  comments: PlanComment[],
): Map<number, PlanComment[]> {
  const map = new Map<number, PlanComment[]>();
  for (const comment of comments) {
    if (!map.has(comment.line)) {
      map.set(comment.line, []);
    }
    map.get(comment.line)!.push(comment);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CommentThreadProps {
  comments: PlanComment[];
  onResolve: (commentId: string) => void;
  onReply: (commentId: string, body: string) => void;
}

function CommentThread({
  comments,
  onResolve,
  onReply,
}: CommentThreadProps): React.ReactElement {
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleReply = useCallback(
    (commentId: string) => {
      if (replyText.trim()) {
        onReply(commentId, replyText.trim());
        setReplyText('');
        setReplyingTo(null);
      }
    },
    [replyText, onReply],
  );

  return (
    <div className="plan-comment-thread" data-testid="plan-comment-thread">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={`plan-comment ${comment.resolved ? 'plan-comment-resolved' : ''}`}
        >
          <div className="plan-comment-header">
            <span className="plan-comment-author">{comment.author}</span>
            <span className="plan-comment-time">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="plan-comment-body">{comment.body}</div>

          {/* Replies */}
          {comment.replies?.map((reply) => (
            <div key={reply.id} className="plan-comment-reply">
              <div className="plan-comment-header">
                <span className="plan-comment-author">{reply.author}</span>
                <span className="plan-comment-time">
                  {new Date(reply.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="plan-comment-body">{reply.body}</div>
            </div>
          ))}

          {/* Actions */}
          {!comment.resolved && (
            <div className="plan-comment-actions">
              <button
                type="button"
                className="plan-comment-resolve-btn"
                aria-label="Resolve comment"
                onClick={() => onResolve(comment.id)}
              >
                Resolve
              </button>
              {replyingTo === comment.id ? (
                <div className="plan-comment-reply-input">
                  <input
                    type="text"
                    placeholder="Reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyText.trim()) {
                        handleReply(comment.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Reply"
                    disabled={!replyText.trim()}
                    onClick={() => handleReply(comment.id)}
                  >
                    Reply
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="plan-comment-reply-btn"
                  aria-label="Reply"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  Reply
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface CommentInputProps {
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

function CommentInput({
  onSubmit,
  onCancel,
}: CommentInputProps): React.ReactElement {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  }, [text, onSubmit]);

  return (
    <div className="plan-comment-input" data-testid="plan-comment-input">
      <input
        type="text"
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            handleSubmit();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        autoFocus
      />
      <button
        type="button"
        aria-label="Submit comment"
        disabled={!text.trim()}
        onClick={handleSubmit}
      >
        Submit
      </button>
      <button type="button" aria-label="Cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanReview
// ---------------------------------------------------------------------------

export function PlanReview({
  content,
  comments,
  onAddComment,
  onResolveComment,
  onReplyToComment,
}: PlanReviewProps): React.ReactElement {
  // Track which line has expanded comments
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  // Track which line is receiving a new comment
  const [commentingLine, setCommentingLine] = useState<number | null>(null);

  // Group comments by line number
  const commentsByLine = useMemo(
    () => groupCommentsByLine(comments),
    [comments],
  );

  // Parse plan into lines
  const lines = useMemo(() => content.split('\n'), [content]);

  // Handle gutter click — open comment input for this line
  const handleGutterClick = useCallback(
    (lineNumber: number) => {
      if (commentingLine === lineNumber) {
        setCommentingLine(null);
      } else {
        setCommentingLine(lineNumber);
        setExpandedLine(null);
      }
    },
    [commentingLine],
  );

  // Handle comment marker click — expand/collapse existing comments
  const handleMarkerClick = useCallback(
    (lineNumber: number) => {
      if (expandedLine === lineNumber) {
        setExpandedLine(null);
      } else {
        setExpandedLine(lineNumber);
        setCommentingLine(null);
      }
    },
    [expandedLine],
  );

  // Handle new comment submission
  const handleAddComment = useCallback(
    (lineNumber: number, body: string) => {
      onAddComment(lineNumber, body);
      setCommentingLine(null);
    },
    [onAddComment],
  );

  // Empty state
  if (!content) {
    return (
      <div className="plan-review plan-review-empty" data-testid="plan-review">
        <p>No plan content to review</p>
      </div>
    );
  }

  const lineNumberWidth = String(lines.length).length;

  return (
    <div
      className="plan-review"
      data-testid="plan-review"
      role="region"
      aria-label="Plan review"
    >
      <div className="plan-review-content">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const lineComments = commentsByLine.get(lineNumber);
          const hasComments = lineComments && lineComments.length > 0;
          const isExpanded = expandedLine === lineNumber;
          const isCommenting = commentingLine === lineNumber;
          const allResolved = lineComments?.every((c) => c.resolved) ?? false;

          return (
            <React.Fragment key={lineNumber}>
              <div
                className="plan-line"
                data-testid={`plan-line-${lineNumber}`}
              >
                {/* Comment gutter — click to add a comment */}
                <span
                  className="plan-line-gutter"
                  data-testid={`plan-line-gutter-${lineNumber}`}
                  onClick={() => handleGutterClick(lineNumber)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Add comment on line ${lineNumber}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleGutterClick(lineNumber);
                    }
                  }}
                >
                  {/* Comment marker for lines with existing comments */}
                  {hasComments ? (
                    <button
                      className={`comment-marker ${allResolved ? 'comment-marker-resolved' : 'comment-marker-open'}`}
                      data-testid={`comment-marker-${lineNumber}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkerClick(lineNumber);
                      }}
                      aria-label={`${lineComments.length} comment${lineComments.length > 1 ? 's' : ''} on line ${lineNumber}`}
                      aria-expanded={isExpanded}
                    >
                      {lineComments.length > 1 ? lineComments.length : '💬'}
                    </button>
                  ) : null}
                </span>

                {/* Line number */}
                <span
                  className="plan-line-number"
                  style={{ minWidth: `${lineNumberWidth}ch` }}
                >
                  {lineNumber}
                </span>

                {/* Line content */}
                <span className="plan-line-content">{line || '\u00A0'}</span>
              </div>

              {/* Expanded comment thread */}
              {isExpanded && lineComments ? (
                <div className="plan-comment-container">
                  <CommentThread
                    comments={lineComments}
                    onResolve={onResolveComment}
                    onReply={onReplyToComment}
                  />
                </div>
              ) : null}

              {/* New comment input */}
              {isCommenting ? (
                <div className="plan-comment-container">
                  <CommentInput
                    onSubmit={(body) => handleAddComment(lineNumber, body)}
                    onCancel={() => setCommentingLine(null)}
                  />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
