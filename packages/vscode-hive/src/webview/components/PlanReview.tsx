/**
 * PlanReview component — Read-only plan display with inline comment annotations
 *
 * Displays plan markdown with line numbers and a gutter for comment markers.
 * Users can click on a line gutter to add a new comment, and click on
 * existing comment markers to expand/collapse comment threads.
 *
 * Supports range-based commenting:
 * - Click a line gutter for single-line comments
 * - Mouse-select across lines for multi-line range comments
 * - Comments use 0-based Range internally; display uses 1-based line numbers
 *
 * This component is read-only for the plan content — it does not edit markdown.
 * It renders annotations (comments) inline, similar to CodeViewer's thread pattern.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { PlanComment, Range } from 'hive-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlanReviewProps {
  /** Plan markdown content to display */
  content: string;
  /** Existing comments on the plan */
  comments: PlanComment[];
  /** Called when user adds a new comment on a range (0-based) */
  onAddComment: (range: Range, body: string) => void;
  /** Called when user resolves a comment */
  onResolveComment: (commentId: string) => void;
  /** Called when user replies to a comment */
  onReplyToComment: (commentId: string, body: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a 0-based Range for plan lines (character always 0) */
function makeRange(startLine: number, endLine: number): Range {
  return {
    start: { line: startLine, character: 0 },
    end: { line: endLine, character: 0 },
  };
}

/**
 * Group comments by their start line (display line number, 1-based).
 * Uses range.start.line (0-based) + 1 for the display line key.
 */
function groupCommentsByLine(
  comments: PlanComment[],
): Map<number, PlanComment[]> {
  const map = new Map<number, PlanComment[]>();
  for (const comment of comments) {
    const displayLine = comment.range.start.line + 1;
    if (!map.has(displayLine)) {
      map.set(displayLine, []);
    }
    map.get(displayLine)!.push(comment);
  }
  return map;
}

/**
 * Compute the set of display lines (1-based) covered by a list of comments.
 * Each comment's range spans from start.line to end.line (inclusive, 0-based).
 */
function getHighlightedLines(comments: PlanComment[]): Set<number> {
  const lines = new Set<number>();
  for (const comment of comments) {
    const startDisplay = comment.range.start.line + 1;
    const endDisplay = comment.range.end.line + 1;
    for (let i = startDisplay; i <= endDisplay; i++) {
      lines.add(i);
    }
  }
  return lines;
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
  // Track which line has expanded comments (1-based display line)
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  // Track which line is receiving a new comment (1-based display line)
  const [commentingLine, setCommentingLine] = useState<number | null>(null);

  // Selection state for range-based commenting (1-based display lines)
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Pending range for the "Add Comment" button (after selection)
  const [pendingRange, setPendingRange] = useState<{
    startLine: number;
    endLine: number;
  } | null>(null);

  // Group comments by line number
  const commentsByLine = useMemo(
    () => groupCommentsByLine(comments),
    [comments],
  );

  // Compute highlighted lines for expanded comments
  const highlightedLines = useMemo(() => {
    if (expandedLine === null) return new Set<number>();
    const lineComments = commentsByLine.get(expandedLine);
    if (!lineComments) return new Set<number>();
    return getHighlightedLines(lineComments);
  }, [expandedLine, commentsByLine]);

  // Parse plan into lines
  const lines = useMemo(() => content.split('\n'), [content]);

  // Compute normalized selection range (always min→max)
  const normalizedSelection = useMemo(() => {
    if (selectionStart === null) return null;
    const end = selectionEnd ?? selectionStart;
    return {
      startLine: Math.min(selectionStart, end),
      endLine: Math.max(selectionStart, end),
    };
  }, [selectionStart, selectionEnd]);

  // Handle gutter click — open comment input for this line
  const handleGutterClick = useCallback(
    (lineNumber: number) => {
      // Clear any active selection
      setPendingRange(null);
      setSelectionStart(null);
      setSelectionEnd(null);

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
      // Clear any active selection
      setPendingRange(null);
      setSelectionStart(null);
      setSelectionEnd(null);

      if (expandedLine === lineNumber) {
        setExpandedLine(null);
      } else {
        setExpandedLine(lineNumber);
        setCommentingLine(null);
      }
    },
    [expandedLine],
  );

  // Handle new comment submission (from gutter click — single line)
  const handleAddComment = useCallback(
    (lineNumber: number, body: string) => {
      // Convert 1-based display line to 0-based Range
      const range = makeRange(lineNumber - 1, lineNumber - 1);
      onAddComment(range, body);
      setCommentingLine(null);
    },
    [onAddComment],
  );

  // Handle new comment submission (from range selection)
  const handleAddRangeComment = useCallback(
    (body: string) => {
      if (pendingRange) {
        // Convert 1-based display lines to 0-based Range
        const range = makeRange(
          pendingRange.startLine - 1,
          pendingRange.endLine - 1,
        );
        onAddComment(range, body);
        setPendingRange(null);
        setCommentingLine(null);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    },
    [pendingRange, onAddComment],
  );

  // Mouse selection handlers
  const handleMouseDown = useCallback(
    (lineNumber: number) => {
      setIsSelecting(true);
      setSelectionStart(lineNumber);
      setSelectionEnd(lineNumber);
      setPendingRange(null);
      setCommentingLine(null);
      setExpandedLine(null);
    },
    [],
  );

  const handleMouseEnter = useCallback(
    (lineNumber: number) => {
      if (isSelecting) {
        setSelectionEnd(lineNumber);
      }
    },
    [isSelecting],
  );

  const handleMouseUp = useCallback(
    (_lineNumber: number) => {
      if (isSelecting && selectionStart !== null) {
        const end = selectionEnd ?? selectionStart;
        const startLine = Math.min(selectionStart, end);
        const endLine = Math.max(selectionStart, end);
        setPendingRange({ startLine, endLine });
        setIsSelecting(false);
      }
    },
    [isSelecting, selectionStart, selectionEnd],
  );

  // Handle "Add Comment" button click from selection
  const handleAddCommentFromSelection = useCallback(() => {
    if (pendingRange) {
      setCommentingLine(pendingRange.startLine);
    }
  }, [pendingRange]);

  // Check if a line is in the current selection
  const isLineSelected = useCallback(
    (lineNumber: number): boolean => {
      const range = pendingRange ?? normalizedSelection;
      if (!range) return false;
      return lineNumber >= range.startLine && lineNumber <= range.endLine;
    },
    [pendingRange, normalizedSelection],
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
          const selected = isLineSelected(lineNumber);
          const commentActive = highlightedLines.has(lineNumber);

          // Build CSS class list
          const lineClasses = [
            'plan-line',
            selected ? 'plan-line-selected' : '',
            commentActive ? 'plan-line-comment-active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <React.Fragment key={lineNumber}>
              <div
                className={lineClasses}
                data-testid={`plan-line-${lineNumber}`}
                onMouseDown={() => handleMouseDown(lineNumber)}
                onMouseEnter={() => handleMouseEnter(lineNumber)}
                onMouseUp={() => handleMouseUp(lineNumber)}
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
                      {lineComments.length > 1 ? lineComments.length : '\uD83D\uDCAC'}
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

              {/* "Add Comment" button after selection ends on this line */}
              {pendingRange &&
                lineNumber === pendingRange.endLine &&
                !isCommenting ? (
                <div className="plan-selection-actions">
                  <button
                    type="button"
                    aria-label="Add comment"
                    className="plan-selection-add-comment-btn"
                    onClick={handleAddCommentFromSelection}
                  >
                    Add Comment
                  </button>
                </div>
              ) : null}

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

              {/* New comment input (from gutter click — single line) */}
              {isCommenting && !pendingRange ? (
                <div className="plan-comment-container">
                  <CommentInput
                    onSubmit={(body) => handleAddComment(lineNumber, body)}
                    onCancel={() => setCommentingLine(null)}
                  />
                </div>
              ) : null}

              {/* New comment input (from range selection) */}
              {isCommenting && pendingRange && lineNumber === pendingRange.startLine ? (
                <div className="plan-comment-container">
                  <CommentInput
                    onSubmit={handleAddRangeComment}
                    onCancel={() => {
                      setCommentingLine(null);
                      setPendingRange(null);
                      setSelectionStart(null);
                      setSelectionEnd(null);
                    }}
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
