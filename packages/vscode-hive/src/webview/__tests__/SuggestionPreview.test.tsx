/**
 * Tests for SuggestionPreview component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
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
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // Should show old code
      expect(screen.getByText(mockOldCode)).toBeInTheDocument();

      // Should show new code (suggestion replacement)
      expect(
        screen.getByText(mockAnnotation.suggestion!.replacement),
      ).toBeInTheDocument();
    });

    it('shows diff in split view by default with before/after code viewers', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // In split view, we should see "Before:" and "After:" labels
      expect(screen.getByText('Before:')).toBeInTheDocument();
      expect(screen.getByText('After:')).toBeInTheDocument();

      // Code viewers should be rendered with code content
      expect(screen.getByText(mockOldCode)).toBeInTheDocument();
      expect(
        screen.getByText(mockAnnotation.suggestion!.replacement),
      ).toBeInTheDocument();
    });

    it('displays file location information', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      expect(screen.getByText(/src\/utils\.ts/)).toBeInTheDocument();
      expect(screen.getByText(/line 11/i)).toBeInTheDocument(); // 0-based to 1-based
    });

    it('renders suggestion body in markdown viewer', async () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // The body should be rendered through MarkdownViewer
      // The content appears in the rendered markdown (may need to wait for async rendering)
      expect(
        await screen.findByText(
          /Consider using a more descriptive variable name/,
        ),
      ).toBeInTheDocument();
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
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      expect(container.querySelector('.suggestion-preview')).toBeNull();
    });
  });

  describe('Apply button', () => {
    it('renders Apply button when pending', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
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
          suggestionStatus={{ status: 'pending' }}
        />,
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
          suggestionStatus={{ status: 'applied' }}
        />,
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
          suggestionStatus={{ status: 'applying' }}
        />,
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeDisabled();
    });
  });

  describe('conflict detection', () => {
    it('shows conflict warning when status is conflict', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'conflict' }}
        />,
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
          suggestionStatus={{ status: 'conflict' }}
        />,
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
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      const preview = screen.getByRole('region', {
        name: /suggestion preview/i,
      });
      expect(preview).toBeInTheDocument();
    });
  });

  describe('diff view toggle', () => {
    it('renders diff mode toggle with Split and Unified options', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // Should show the toggle options
      expect(screen.getByText('Split')).toBeInTheDocument();
      expect(screen.getByText('Unified')).toBeInTheDocument();
    });

    it('defaults to split view mode', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // In split view mode, should show "Before:" and "After:" labels
      expect(screen.getByText('Before:')).toBeInTheDocument();
      expect(screen.getByText('After:')).toBeInTheDocument();
    });

    it('switches to unified view when Unified is clicked', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // Click on Unified option
      const unifiedOption = screen.getByText('Unified');
      fireEvent.click(unifiedOption);

      // Before/After labels should no longer be visible in unified mode
      expect(screen.queryByText('Before:')).not.toBeInTheDocument();
      expect(screen.queryByText('After:')).not.toBeInTheDocument();
    });

    it('can switch back to split view from unified', () => {
      render(
        <SuggestionPreview
          annotation={mockAnnotation}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // Switch to unified
      fireEvent.click(screen.getByText('Unified'));
      expect(screen.queryByText('Before:')).not.toBeInTheDocument();

      // Switch back to split
      fireEvent.click(screen.getByText('Split'));
      expect(screen.getByText('Before:')).toBeInTheDocument();
      expect(screen.getByText('After:')).toBeInTheDocument();
    });
  });

  describe('markdown rendering', () => {
    it('renders annotation body as markdown', async () => {
      const annotationWithMarkdown: ReviewAnnotation = {
        ...mockAnnotation,
        body: 'Consider using **bold** and `code`',
      };

      render(
        <SuggestionPreview
          annotation={annotationWithMarkdown}
          oldCode={mockOldCode}
          uri="src/utils.ts"
          range={mockRange}
          onApply={vi.fn()}
          suggestionStatus={{ status: 'pending' }}
        />,
      );

      // Should have markdown viewer that renders the content (may need to wait for async)
      // MarkdownViewer might show "Loading..." first, then rendered content
      expect(await screen.findByText(/Consider using/)).toBeInTheDocument();
    });
  });
});
