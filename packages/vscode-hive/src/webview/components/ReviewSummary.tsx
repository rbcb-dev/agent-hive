/**
 * ReviewSummary component - Verdict selector + summary input + submit
 */

import React, { useState } from 'react';
import type { ReviewVerdict } from 'hive-core';

export interface ReviewSummaryProps {
  onSubmit: (verdict: ReviewVerdict, summary: string) => void;
  isSubmitting: boolean;
}

interface VerdictOption {
  id: ReviewVerdict;
  label: string;
  icon: string;
  color: string;
}

const VERDICT_OPTIONS: VerdictOption[] = [
  { id: 'approve', label: 'Approve', icon: '✓', color: 'var(--vscode-charts-green, #388a34)' },
  { id: 'request_changes', label: 'Request Changes', icon: '✗', color: 'var(--vscode-charts-red, #c74e39)' },
  { id: 'comment', label: 'Comment', icon: '💬', color: 'var(--vscode-charts-blue, #2196f3)' },
];

export function ReviewSummary({ onSubmit, isSubmitting }: ReviewSummaryProps): React.ReactElement {
  const [selectedVerdict, setSelectedVerdict] = useState<ReviewVerdict | null>(null);
  const [summary, setSummary] = useState('');

  const handleSubmit = () => {
    if (selectedVerdict) {
      onSubmit(selectedVerdict, summary);
    }
  };

  return (
    <div className="review-summary">
      <div className="verdict-selector">
        <span className="verdict-label">Review verdict:</span>
        <div className="verdict-options">
          {VERDICT_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`verdict-option ${selectedVerdict === option.id ? 'selected' : ''}`}
              style={{ '--verdict-color': option.color } as React.CSSProperties}
              onClick={() => setSelectedVerdict(option.id)}
              disabled={isSubmitting}
            >
              <span className="verdict-icon">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="summary-input">
        <textarea
          className="summary-textarea"
          placeholder="Leave a summary for your review..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={isSubmitting}
          rows={4}
        />
      </div>

      <div className="submit-actions">
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={!selectedVerdict || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
