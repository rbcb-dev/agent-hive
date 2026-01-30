/**
 * Tests for SuggestionPreview component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionPreview } from '../components/SuggestionPreview';
import type { ReviewAnnotation, Range } from 'hive-core';

describe('SuggestionPreview', () => {
  const mockRange: Range = {
    start: { line: 10, character: 0 },
    end: { line: 12, character: 0 },
  };

  const mockAnnotation: ReviewAnnotation = {
    id: 'anno-123',
    type: 'suggestion',
    body: 'Consider using a more descriptive variable name',
    author: { type: 'llm', name: 'claude' },
    createdAt: '2026-01-30T12:00:00Z',
    updatedAt: '2026-01-30T12:00:00Z',
    suggestion: {
      replacement: 'const descriptiveVar = calculateTotal(items);',
    },
  };

  const mockOldCode = 'const x = calc(items);';

  describe('rendering', () => {
    it('renders old and new code in diff format', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      // Should show old code
      expect(screen.getByText(mockOldCode)).toBeInTheDocument();

      // Should show new code (suggestion replacement)
      expect(screen.getByText(mockAnnotation.suggestion!.replacement)).toBeInTheDocument();
    });

    it('shows diff markers for old and new code', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      // Should have removal and addition indicators
      const oldLine = screen.getByText(mockOldCode).closest('.suggestion-line');
      expect(oldLine).toHaveClass('suggestion-line-remove');

      const newLine = screen.getByText(mockAnnotation.suggestion!.replacement).closest('.suggestion-line');
      expect(newLine).toHaveClass('suggestion-line-add');
    });

    it('displays file location information', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      expect(screen.getByText(/src\/utils\.ts/)).toBeInTheDocument();
      expect(screen.getByText(/line 11/i)).toBeInTheDocument(); // 0-based to 1-based
    });

    it('renders suggestion body/description', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      expect(screen.getByText(mockAnnotation.body)).toBeInTheDocument();
    });

    it('renders nothing when annotation has no suggestion', () => {
      const annotationWithoutSuggestion: ReviewAnnotation = {
        ...mockAnnotation,
        suggestion: undefined,
      };

      const { container } = render(
        <SuggestionPreview
          annotation={annotationWithoutSuggestion}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      expect(container.querySelector('.suggestion-preview')).toBeNull();
    });
  });

  describe('Apply button', () => {
    it('renders Apply button when not applied', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeInTheDocument();
      expect(applyButton).not.toBeDisabled();
    });

    it('calls onApply with annotation id when Apply button clicked', () => {
      const onApply = vi.fn();
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={onApply}
          isApplied={false}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      fireEvent.click(applyButton);

      expect(onApply).toHaveBeenCalledOnce();
      expect(onApply).toHaveBeenCalledWith(mockAnnotation.id);
    });

    it('shows "Applied" badge when suggestion is applied', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={true}
        />
      );

      expect(screen.getByText(/applied/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
    });

    it('disables Apply button when applying is in progress', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
          isApplying={true}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeDisabled();
    });
  });

  describe('conflict detection', () => {
    it('shows conflict warning when hasConflict is true', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
          hasConflict={true}
        />
      );

      expect(screen.getByText(/conflict/i)).toBeInTheDocument();
      expect(screen.getByText(/file.*changed/i)).toBeInTheDocument();
    });

    it('disables Apply button when there is a conflict', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
          hasConflict={true}
        />
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          isApplied={false}
        />
      );

      const preview = screen.getByRole('region', { name: /suggestion preview/i });
      expect(preview).toBeInTheDocument();
    });
  });
});
