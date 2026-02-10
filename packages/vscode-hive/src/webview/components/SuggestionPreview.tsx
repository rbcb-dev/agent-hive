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

import React, { useState, useMemo } from 'react';
import type { ReviewAnnotation, Range, DiffFile } from 'hive-core';
import { Alert, Button, Flex, Segmented, Typography } from '../primitives';
import { MarkdownViewer } from './MarkdownViewer';
import { CodeViewer } from './CodeViewer';
import { DiffViewer } from './DiffViewer';
import { getLanguageId } from '../fileUtils';

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

/**
 * Convert old code and replacement to a DiffFile for unified view
 */
function createDiffFile(
  uri: string,
  oldCode: string,
  newCode: string,
  startLine: number,
): DiffFile {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  return {
    path: uri,
    status: 'M',
    additions: newLines.length,
    deletions: oldLines.length,
    hunks: [
      {
        oldStart: startLine,
        oldLines: oldLines.length,
        newStart: startLine,
        newLines: newLines.length,
        lines: [
          // Add old lines as removals
          ...oldLines.map((content) => ({
            type: 'remove' as const,
            content,
          })),
          // Add new lines as additions
          ...newLines.map((content) => ({
            type: 'add' as const,
            content,
          })),
        ],
      },
    ],
  };
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
  // Default to split view mode
  const [diffMode, setDiffMode] = useState<DiffViewMode>('split');

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
  const alertType = hasConflict ? 'warning' : 'info';

  // Get language from file path for syntax highlighting
  const language = getLanguageId(uri);

  // Create DiffFile for unified view
  const diffFile = useMemo(
    () => createDiffFile(uri, oldCode, replacement, lineNumber),
    [uri, oldCode, replacement, lineNumber],
  );

  // Handle diff mode toggle
  const handleDiffModeChange = (value: string | number) => {
    setDiffMode(value as DiffViewMode);
  };

  // Build the action button or applied badge
  const actionElement = isApplied ? (
    <span className="suggestion-applied-badge">Applied</span>
  ) : (
    <Button
      type="primary"
      size="small"
      onClick={handleApply}
      loading={isApplying}
      disabled={isDisabled}
      aria-label="Apply suggestion"
    >
      {isApplying ? 'Applying...' : 'Apply'}
    </Button>
  );

  // Build the description content with location, optional conflict warning, body, and diff
  const descriptionContent = (
    <Flex vertical gap="small" className="suggestion-content">
      {/* Location info and diff mode toggle */}
      <Flex justify="space-between" align="center" wrap gap="small">
        <span className="suggestion-location">
          <span className="suggestion-file">{uri}</span>
          <span className="suggestion-line">line {lineNumber}</span>
        </span>
        <Segmented
          size="small"
          options={[
            { label: 'Split', value: 'split' },
            { label: 'Unified', value: 'unified' },
          ]}
          value={diffMode}
          onChange={handleDiffModeChange}
        />
      </Flex>

      {/* Conflict warning */}
      {hasConflict && (
        <div className="suggestion-conflict-warning" role="alert">
          <span className="conflict-icon">⚠️</span>
          <span>
            Conflict detected: File has changed since this suggestion was
            created.
          </span>
        </div>
      )}

      {/* Annotation body as markdown */}
      <MarkdownViewer content={annotation.body} maxHeight={150} />

      {/* Toggleable diff view */}
      {diffMode === 'unified' ? (
        <DiffViewer file={diffFile} viewType="unified" />
      ) : (
        <Flex gap="middle" className="suggestion-split-diff">
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary">Before:</Typography.Text>
            <CodeViewer
              code={oldCode}
              language={language}
              showLineNumbers={false}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary">After:</Typography.Text>
            <CodeViewer
              code={replacement}
              language={language}
              showLineNumbers={false}
            />
          </div>
        </Flex>
      )}
    </Flex>
  );

  return (
    <div
      className="suggestion-preview"
      role="region"
      aria-label="Suggestion preview"
    >
      <Alert
        type={alertType}
        message="Suggested Change"
        description={descriptionContent}
        action={actionElement}
        showIcon
      />
    </div>
  );
}
