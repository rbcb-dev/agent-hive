/**
 * ReviewSummary component - Verdict selector + summary input + submit
 *
 * Uses antd primitives: RadioGroup (button style), TextArea, Button
 * Uses @vscode/codicons for icons in verdict buttons and submit button.
 */
import React from 'react';
import type { ReviewVerdict } from 'hive-core';
import '@vscode/codicons/dist/codicon.css';
export interface ReviewSummaryProps {
    onSubmit: (verdict: ReviewVerdict, summary: string) => void;
    isSubmitting: boolean;
}
export declare function ReviewSummary({ onSubmit, isSubmitting, }: ReviewSummaryProps): React.ReactElement;
