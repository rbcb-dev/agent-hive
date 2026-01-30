/**
 * SuggestionPreview component - Shows diff preview and apply button for code suggestions
 */

import React from 'react';
import type { ReviewAnnotation, Range } from 'hive-core';

export interface SuggestionPreviewProps {
  annotation: ReviewAnnotation;
  oldCode: string;
  uri: string;
  range: Range;
  onApply: (annotationId: string) => void;
  isApplied: boolean;
  isApplying?: boolean;
  hasConflict?: boolean;
}

export function SuggestionPreview({
  annotation,
  oldCode,
  uri,
  range,
  onApply,
  isApplied,
  isApplying = false,
  hasConflict = false,
}: SuggestionPreviewProps): React.ReactElement | null {
  // Don't render if annotation has no suggestion
  if (!annotation.suggestion) {
    return null;
  }

  const replacement = annotation.suggestion.replacement;
  const lineNumber = range.start.line + 1; // Convert 0-based to 1-based

  const handleApply = () => {
    onApply(annotation.id);
  };

  const isDisabled = isApplying || hasConflict;

  return (
    <div
      className="suggestion-preview"
      role="region"
      aria-label="Suggestion preview"
    >
      <div className="suggestion-header">
        <span className="suggestion-location">
          <span className="suggestion-file">{uri}</span>
          <span className="suggestion-line">line {lineNumber}</span>
        </span>
        {isApplied ? (
          <span className="suggestion-applied-badge">Applied</span>
        ) : (
          <button
            className="suggestion-apply-btn"
            onClick={handleApply}
            disabled={isDisabled}
            aria-label="Apply suggestion"
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
        )}
      </div>

      {hasConflict && (
        <div className="suggestion-conflict-warning" role="alert">
          <span className="conflict-icon">⚠️</span>
          <span>Conflict detected: File has changed since this suggestion was created.</span>
        </div>
      )}

      <div className="suggestion-description">{annotation.body}</div>

      <div className="suggestion-diff">
        <div className="suggestion-line suggestion-line-remove">
          <span className="suggestion-line-prefix">-</span>
          <span className="suggestion-line-content">{oldCode}</span>
        </div>
        <div className="suggestion-line suggestion-line-add">
          <span className="suggestion-line-prefix">+</span>
          <span className="suggestion-line-content">{replacement}</span>
        </div>
      </div>
    </div>
  );
}
