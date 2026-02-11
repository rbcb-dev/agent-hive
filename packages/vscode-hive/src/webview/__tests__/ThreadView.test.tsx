/**
 * Tests for ThreadView shared component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { ThreadView } from '../components/ThreadView';
import type { ReviewThread } from 'hive-core';
import type { SuggestionStatus } from '../components/SuggestionPreview';

const mockThread: ReviewThread = {
  id: 'thread-1',
  entityId: 'entity-1',
  uri: 'src/example.ts',
  range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
  status: 'open',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  annotations: [
    {
      id: 'ann-1',
      type: 'comment',
      body: 'This looks good but could be improved',
      author: { type: 'human', name: 'Alice' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'ann-2',
      type: 'comment',
      body: 'I agree, we should refactor this',
      author: { type: 'llm', name: 'Claude', agentId: 'hygienic-reviewer' },
      createdAt: '2026-01-01T01:00:00Z',
      updatedAt: '2026-01-01T01:00:00Z',
    },
  ],
};

describe('ThreadView', () => {
  const mockOnReply = vi.fn();
  const mockOnResolve = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('annotation rendering', () => {
    it('renders all annotations', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      expect(
        screen.getByText('This looks good but could be improved'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('I agree, we should refactor this'),
      ).toBeInTheDocument();
    });

    it('displays author names', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
    });

    it('shows AI badge for LLM authors', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const aiBadges = screen.getAllByText('AI');
      expect(aiBadges.length).toBe(1);
    });

    it('displays suggestion replacement code via SuggestionPreview', () => {
      const threadWithSuggestion: ReviewThread = {
        ...mockThread,
        annotations: [
          {
            id: 'ann-1',
            type: 'suggestion',
            body: 'Use const instead of let',
            author: { type: 'llm', name: 'Claude' },
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            suggestion: { replacement: 'const x = 1;' },
          },
        ],
      };

      render(
        <ThreadView
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      // SuggestionPreview should render (not raw <pre>)
      expect(
        screen.getByRole('region', { name: /suggestion preview/i }),
      ).toBeInTheDocument();
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });
  });

  describe('reply functionality', () => {
    it('has reply input field', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      expect(screen.getByPlaceholderText(/reply/i)).toBeInTheDocument();
    });

    it('calls onReply with body when reply submitted', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const input = screen.getByPlaceholderText(/reply/i);
      fireEvent.change(input, { target: { value: 'My reply text' } });

      const replyButton = screen.getByRole('button', { name: /^reply$/i });
      fireEvent.click(replyButton);

      expect(mockOnReply).toHaveBeenCalledWith('My reply text');
    });

    it('clears input after successful reply', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const input = screen.getByPlaceholderText(
        /reply/i,
      ) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'My reply text' } });
      fireEvent.click(screen.getByRole('button', { name: /^reply$/i }));

      expect(input.value).toBe('');
    });

    it('disables reply button when input is empty', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const replyButton = screen.getByRole('button', { name: /^reply$/i });
      expect(replyButton).toBeDisabled();
    });

    it('submits on Cmd+Enter', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const input = screen.getByPlaceholderText(/reply/i);
      fireEvent.change(input, { target: { value: 'My reply text' } });
      fireEvent.keyDown(input, { key: 'Enter', metaKey: true });

      expect(mockOnReply).toHaveBeenCalledWith('My reply text');
    });
  });

  describe('resolve functionality', () => {
    it('shows resolve button for open threads', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      expect(
        screen.getByRole('button', { name: /resolve/i }),
      ).toBeInTheDocument();
    });

    it('calls onResolve when resolve button clicked', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: /resolve/i }));
      expect(mockOnResolve).toHaveBeenCalledTimes(1);
    });

    it('hides resolve button for resolved threads', () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      render(
        <ThreadView
          thread={resolvedThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /resolve/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('applies compact class when compact=true', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          compact
        />,
      );

      const container = screen.getByTestId('thread-view');
      expect(container).toHaveClass('thread-view-compact');
    });

    it('does not apply compact class when compact=false', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          compact={false}
        />,
      );

      const container = screen.getByTestId('thread-view');
      expect(container).not.toHaveClass('thread-view-compact');
    });

    it('uses fewer rows in textarea when compact', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          compact
        />,
      );

      const textarea = screen.getByPlaceholderText(
        /reply/i,
      ) as HTMLTextAreaElement;
      expect(textarea.rows).toBe(2);
    });

    it('uses more rows in textarea when not compact', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          compact={false}
        />,
      );

      const textarea = screen.getByPlaceholderText(
        /reply/i,
      ) as HTMLTextAreaElement;
      expect(textarea.rows).toBe(3);
    });
  });

  describe('thread status', () => {
    it('shows resolved class for resolved threads', () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      render(
        <ThreadView
          thread={resolvedThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const container = screen.getByTestId('thread-view');
      expect(container).toHaveClass('thread-view-resolved');
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on resolve button', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      expect(
        screen.getByRole('button', { name: /mark thread as resolved/i }),
      ).toBeInTheDocument();
    });

    it('has labeled reply input', () => {
      render(
        <ThreadView
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      const input = screen.getByPlaceholderText(/reply/i);
      expect(input).toHaveAccessibleName();
    });
  });

  describe('SuggestionPreview integration', () => {
    const threadWithSuggestion: ReviewThread = {
      ...mockThread,
      annotations: [
        {
          id: 'ann-suggest',
          type: 'suggestion',
          body: 'Use const instead of let',
          author: { type: 'llm', name: 'Claude' },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          suggestion: { replacement: 'const x = 1;' },
        },
      ],
    };

    const mockOnApplySuggestion = vi.fn();
    const pendingStatus: SuggestionStatus = { status: 'pending' };

    it('renders SuggestionPreview for annotations with suggestions', () => {
      render(
        <ThreadView
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onApplySuggestion={mockOnApplySuggestion}
          suggestionStatus={pendingStatus}
        />,
      );

      // SuggestionPreview renders a region with aria-label "Suggestion preview"
      expect(
        screen.getByRole('region', { name: /suggestion preview/i }),
      ).toBeInTheDocument();
    });

    it('does not render raw <pre> for suggestions when SuggestionPreview props provided', () => {
      const { container } = render(
        <ThreadView
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onApplySuggestion={mockOnApplySuggestion}
          suggestionStatus={pendingStatus}
        />,
      );

      // The old <pre className="suggestion-code"> should not exist
      expect(container.querySelector('pre.suggestion-code')).toBeNull();
    });

    it('passes onApply callback through to SuggestionPreview', () => {
      render(
        <ThreadView
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onApplySuggestion={mockOnApplySuggestion}
          suggestionStatus={pendingStatus}
        />,
      );

      // SuggestionPreview renders an Apply button when pending
      const applyButton = screen.getByRole('button', {
        name: /apply suggestion/i,
      });
      fireEvent.click(applyButton);

      expect(mockOnApplySuggestion).toHaveBeenCalledWith('ann-suggest');
    });

    it('shows applied status when suggestionStatus is applied', () => {
      render(
        <ThreadView
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onApplySuggestion={mockOnApplySuggestion}
          suggestionStatus={{ status: 'applied' }}
        />,
      );

      expect(screen.getByText(/applied/i)).toBeInTheDocument();
    });

    it('renders SuggestionPreview with defaults when props not explicitly provided', () => {
      render(
        <ThreadView
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
        />,
      );

      // SuggestionPreview should render even without explicit props (uses defaults)
      expect(
        screen.getByRole('region', { name: /suggestion preview/i }),
      ).toBeInTheDocument();
      // No raw <pre> should exist
      const container = document.querySelector('pre.suggestion-code');
      expect(container).toBeNull();
    });
  });
});
