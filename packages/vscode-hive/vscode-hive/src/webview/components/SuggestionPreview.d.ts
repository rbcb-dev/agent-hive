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
export declare function SuggestionPreview({ annotation, oldCode, uri, range, onApply, isApplied, isApplying, hasConflict, }: SuggestionPreviewProps): React.ReactElement | null;
