/**
 * SuggestionPreview component - Shows diff preview and apply button for code suggestions
 * Uses antd Alert with Button action for consistent UI.
 *
 * Features:
 * - Markdown rendering for annotation body
 * - Toggleable diff view (split vs unified)
 * - Split view shows before/after side by side with CodeViewer
 * - Unified view shows diff in traditional format with DiffViewer
 */
import React from 'react';
import type { ReviewAnnotation, Range } from 'hive-core';
export type DiffViewMode = 'split' | 'unified';
export type SuggestionStatus = {
    status: 'pending';
} | {
    status: 'applying';
} | {
    status: 'applied';
} | {
    status: 'conflict';
    conflictDetails?: string;
};
export interface SuggestionPreviewProps {
    annotation: ReviewAnnotation;
    oldCode: string;
    uri: string;
    range: Range;
    onApply: (annotationId: string) => void;
    suggestionStatus: SuggestionStatus;
}
export declare function SuggestionPreview({ annotation, oldCode, uri, range, onApply, suggestionStatus, }: SuggestionPreviewProps): React.ReactElement | null;
