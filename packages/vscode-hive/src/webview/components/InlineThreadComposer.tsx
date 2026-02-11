/**
 * InlineThreadComposer component - Inline form for creating a new comment thread
 * within a diff view. Rendered as a react-diff-view widget at the clicked line.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../primitives';

export interface InlineThreadComposerProps {
  /** Called when the user submits a comment */
  onSubmit: (body: string) => void;
  /** Called when the user cancels */
  onCancel: () => void;
}

export function InlineThreadComposer({
  onSubmit,
  onCancel,
}: InlineThreadComposerProps): React.ReactElement {
  const [body, setBody] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <div
      className="inline-thread-composer"
      data-testid="inline-thread-composer"
    >
      <textarea
        ref={inputRef}
        className="composer-input"
        placeholder="Add a comment..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
      />
      <div className="composer-actions">
        <Button size="small" type="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="small"
          type="primary"
          onClick={handleSubmit}
          disabled={!body.trim()}
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
