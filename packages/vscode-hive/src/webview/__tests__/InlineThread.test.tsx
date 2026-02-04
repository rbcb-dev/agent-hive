/**
 * Tests for InlineThread component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { InlineThread } from '../components/InlineThread';
import type { ReviewThread } from 'hive-core';

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

describe('InlineThread', () => {
  const mockOnReply = vi.fn();
  const mockOnResolve = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders thread with all annotations', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('This looks good but could be improved')).toBeInTheDocument();
      expect(screen.getByText('I agree, we should refactor this')).toBeInTheDocument();
    });

    it('displays author names for each annotation', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
    });

    it('shows AI badge for LLM authors', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      // Find the AI badge (should only appear once for Claude)
      const aiBadges = screen.getAllByText('AI');
      expect(aiBadges.length).toBe(1);
    });

    it('renders with inline-thread class', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      const container = screen.getByTestId('inline-thread');
      expect(container).toHaveClass('inline-thread');
    });
  });

  describe('close button', () => {
    it('renders close button', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('reply functionality', () => {
    it('has reply input field', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText(/reply/i)).toBeInTheDocument();
    });

    it('calls onReply with thread id and text when reply button is clicked', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText(/reply/i);
      fireEvent.change(input, { target: { value: 'My reply text' } });
      
      const replyButton = screen.getByRole('button', { name: /^reply$/i });
      fireEvent.click(replyButton);

      expect(mockOnReply).toHaveBeenCalledWith('thread-1', 'My reply text');
    });

    it('clears input after successful reply', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText(/reply/i) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: 'My reply text' } });
      fireEvent.click(screen.getByRole('button', { name: /^reply$/i }));

      expect(input.value).toBe('');
    });

    it('disables reply button when input is empty', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      const replyButton = screen.getByRole('button', { name: /^reply$/i });
      expect(replyButton).toBeDisabled();
    });
  });

  describe('resolve functionality', () => {
    it('shows resolve button for open threads', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument();
    });

    it('calls onResolve with thread id when resolve button is clicked', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /resolve/i }));
      expect(mockOnResolve).toHaveBeenCalledWith('thread-1');
    });

    it('hides resolve button for resolved threads', () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      render(
        <InlineThread
          thread={resolvedThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('button', { name: /resolve/i })).not.toBeInTheDocument();
    });
  });

  describe('thread status', () => {
    it('shows resolved indicator for resolved threads', () => {
      const resolvedThread = { ...mockThread, status: 'resolved' as const };
      render(
        <InlineThread
          thread={resolvedThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      const container = screen.getByTestId('inline-thread');
      expect(container).toHaveClass('thread-resolved');
    });
  });

  describe('suggestion display', () => {
    it('renders suggestions with replacement code', () => {
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
        <InlineThread
          thread={threadWithSuggestion}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on close button', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /close thread/i })).toBeInTheDocument();
    });

    it('has labeled reply input', () => {
      render(
        <InlineThread
          thread={mockThread}
          onReply={mockOnReply}
          onResolve={mockOnResolve}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByPlaceholderText(/reply/i);
      expect(input).toHaveAccessibleName();
    });
  });
});
