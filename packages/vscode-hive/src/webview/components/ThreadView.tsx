/**
 * ThreadView component - Shared thread display with annotations, reply input, and resolve functionality.
 * Used by both InlineThread (compact mode) and ThreadPanel (full mode).
 */

import React, { useState } from 'react';
import type { ReviewThread, ReviewAnnotation } from 'hive-core';
import { Button } from '../primitives';
import { SuggestionPreview, type SuggestionStatus } from './SuggestionPreview';

export interface ThreadViewProps {
  /** The thread to display */
  thread: ReviewThread;
  /** Called when user submits a reply */
  onReply: (body: string) => void;
  /** Called when user resolves the thread */
  onResolve: () => void;
  /** Called when user unresolves a resolved thread */
  onUnresolve?: () => void;
  /** Called when user deletes the entire thread (after confirmation) */
  onDelete?: () => void;
  /** Called when user edits an annotation body */
  onEditAnnotation?: (annotationId: string, body: string) => void;
  /** Called when user deletes an annotation (after confirmation) */
  onDeleteAnnotation?: (annotationId: string) => void;
  /** Compact mode for inline display (fewer rows, smaller spacing) */
  compact?: boolean;
  /** Called when user applies a suggestion (annotation id) */
  onApplySuggestion?: (annotationId: string) => void;
  /** Current status of the suggestion apply action */
  suggestionStatus?: SuggestionStatus;
}

function AnnotationItem({
  annotation,
  thread,
  onApplySuggestion,
  suggestionStatus,
  onEditAnnotation,
  onDeleteAnnotation,
}: {
  annotation: ReviewAnnotation;
  thread: ReviewThread;
  onApplySuggestion?: (annotationId: string) => void;
  suggestionStatus?: SuggestionStatus;
  onEditAnnotation?: (annotationId: string, body: string) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
}): React.ReactElement {
  const isLLM = annotation.author.type === 'llm';
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(annotation.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSaveEdit = () => {
    if (editBody.trim()) {
      onEditAnnotation?.(annotation.id, editBody.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditBody(annotation.body);
    setIsEditing(false);
  };

  const handleConfirmDelete = () => {
    onDeleteAnnotation?.(annotation.id);
    setConfirmingDelete(false);
  };

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
        {onEditAnnotation ? (
          <Button
            type="text"
            size="small"
            icon={<span className="codicon codicon-edit" />}
            aria-label="Edit annotation"
            onClick={() => setIsEditing(true)}
          />
        ) : null}
        {onDeleteAnnotation ? (
          <Button
            type="text"
            size="small"
            icon={<span className="codicon codicon-trash" />}
            aria-label="Delete annotation"
            onClick={() => setConfirmingDelete(true)}
          />
        ) : null}
      </div>
      {confirmingDelete ? (
        <div className="annotation-confirm-delete">
          <span>Delete this annotation?</span>
          <Button
            type="text"
            size="small"
            aria-label="Confirm delete annotation"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
          <Button
            type="text"
            size="small"
            aria-label="Cancel annotation delete"
            onClick={() => setConfirmingDelete(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}
      {isEditing ? (
        <div className="annotation-edit">
          <textarea
            className="annotation-edit-input"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
          />
          <Button
            type="text"
            size="small"
            aria-label="Save edit"
            onClick={handleSaveEdit}
          >
            Save
          </Button>
          <Button
            type="text"
            size="small"
            aria-label="Cancel edit"
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="annotation-body">{annotation.body}</div>
      )}
      {annotation.suggestion && (
        <SuggestionPreview
          annotation={annotation}
          oldCode=""
          uri={thread.uri ?? ''}
          range={thread.range}
          onApply={onApplySuggestion ?? (() => {})}
          suggestionStatus={suggestionStatus ?? { status: 'pending' }}
        />
      )}
    </div>
  );
}

export function ThreadView({
  thread,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
  onEditAnnotation,
  onDeleteAnnotation,
  compact = false,
  onApplySuggestion,
  suggestionStatus,
}: ThreadViewProps): React.ReactElement {
  const [replyText, setReplyText] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
        {isResolved && onUnresolve ? (
          <Button
            type="text"
            size="small"
            icon={<span className="codicon codicon-debug-restart" />}
            aria-label="Unresolve thread"
            onClick={onUnresolve}
          >
            Unresolve
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="text"
            size="small"
            icon={<span className="codicon codicon-trash" />}
            aria-label="Delete thread"
            onClick={() => setConfirmingDelete(true)}
          />
        ) : null}
      </div>
      {confirmingDelete ? (
        <div className="thread-view-confirm-delete">
          <span>Delete this thread and all annotations?</span>
          <Button
            type="text"
            size="small"
            aria-label="Confirm delete"
            onClick={() => {
              onDelete?.();
              setConfirmingDelete(false);
            }}
          >
            Delete
          </Button>
          <Button
            type="text"
            size="small"
            aria-label="Cancel"
            onClick={() => setConfirmingDelete(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      <div className="thread-view-annotations">
        {thread.annotations.map((annotation) => (
          <AnnotationItem
            key={annotation.id}
            annotation={annotation}
            thread={thread}
            onApplySuggestion={onApplySuggestion}
            suggestionStatus={suggestionStatus}
            onEditAnnotation={onEditAnnotation}
            onDeleteAnnotation={onDeleteAnnotation}
          />
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
