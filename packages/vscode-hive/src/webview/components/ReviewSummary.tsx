/**
 * ReviewSummary component - Verdict selector + summary input + submit
 * 
 * Uses antd primitives: RadioGroup (button style), TextArea, Button
 * Uses @vscode/codicons for icons in verdict buttons and submit button.
 */

import React, { useState } from 'react';
import type { ReviewVerdict } from 'hive-core';
import { Flex, RadioGroup, TextArea, Button } from '../primitives';
import type { RadioChangeEvent } from '../primitives';
import '@vscode/codicons/dist/codicon.css';

export interface ReviewSummaryProps {
  onSubmit: (verdict: ReviewVerdict, summary: string) => void;
  isSubmitting: boolean;
}

const VERDICT_OPTIONS = [
  { 
    label: (
      <>
        <span className="codicon codicon-check" aria-hidden="true" />
        {' '}Approve
      </>
    ), 
    value: 'approve' 
  },
  { 
    label: (
      <>
        <span className="codicon codicon-request-changes" aria-hidden="true" />
        {' '}Request Changes
      </>
    ), 
    value: 'request_changes' 
  },
  { 
    label: (
      <>
        <span className="codicon codicon-comment" aria-hidden="true" />
        {' '}Comment
      </>
    ), 
    value: 'comment' 
  },
];

export function ReviewSummary({ onSubmit, isSubmitting }: ReviewSummaryProps): React.ReactElement {
  const [selectedVerdict, setSelectedVerdict] = useState<ReviewVerdict | null>(null);
  const [summary, setSummary] = useState('');

  const handleVerdictChange = (e: RadioChangeEvent) => {
    setSelectedVerdict(e.target.value as ReviewVerdict);
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
  };

  const handleSubmit = () => {
    if (selectedVerdict) {
      onSubmit(selectedVerdict, summary);
    }
  };

  return (
    <Flex vertical gap="middle" className="review-summary">
      <RadioGroup
        options={VERDICT_OPTIONS}
        value={selectedVerdict ?? undefined}
        onChange={handleVerdictChange}
        optionType="button"
        buttonStyle="solid"
        disabled={isSubmitting}
      />
      <TextArea
        value={summary}
        onChange={handleSummaryChange}
        placeholder="Write your review summary..."
        autoSize={{ minRows: 3, maxRows: 8 }}
        showCount
        disabled={isSubmitting}
      />
      <Button
        type="primary"
        icon={<span className="codicon codicon-send" aria-hidden="true" />}
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!selectedVerdict || isSubmitting}
      >
        {isSubmitting ? 'Submitting…' : 'Submit Review'}
      </Button>
    </Flex>
  );
}
