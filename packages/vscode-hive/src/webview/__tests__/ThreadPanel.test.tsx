/**
 * Tests for ThreadPanel component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { ThreadPanel } from '../components/ThreadPanel';
import type { ReviewThread } from 'hive-core';

describe('ThreadPanel', () => {
  const mockThread: ReviewThread = {
    id: 'thread-1',
    entityId: 'entity-1',
    uri: 'src/app.ts',
    range: { start: { line: 10, character: 0 }, end: { line: 15, character: 0 } },
    status: 'open',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    annotations: [
      {
        id: 'ann-1',
        type: 'comment',
        body: 'This looks problematic',
        author: { type: 'human', name: 'Alice' },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'ann-2',
        type: 'comment',
        body: 'I agree, we should fix this',
        author: { type: 'llm', name: 'Claude', agentId: 'claude-1' },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    ],
  };

  it('renders thread location', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
    // Line is 0-based in data, displayed as 1-based (10 + 1 = 11)
    expect(screen.getByText(/line 11/i)).toBeInTheDocument();
  });

  it('renders all annotations', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.getByText('This looks problematic')).toBeInTheDocument();
    expect(screen.getByText('I agree, we should fix this')).toBeInTheDocument();
  });

  it('displays author names', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('shows LLM badge for AI-authored comments', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    // Claude's comment should have an LLM indicator
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('has a reply input field', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Reply…')).toBeInTheDocument();
  });

  it('calls onReply when reply is submitted', () => {
    const onReply = vi.fn();
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={onReply}
        onResolve={() => {}}
      />
    );

    const input = screen.getByPlaceholderText('Reply…');
    fireEvent.change(input, { target: { value: 'My reply' } });
    fireEvent.click(screen.getByText('Reply'));

    expect(onReply).toHaveBeenCalledWith('thread-1', 'My reply');
  });

  it('disables reply button when input is empty', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    const replyButton = screen.getByText('Reply');
    expect(replyButton).toBeDisabled();
  });

  it('has a resolve button for open threads', () => {
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('calls onResolve when resolve button is clicked', () => {
    const onResolve = vi.fn();
    render(
      <ThreadPanel
        thread={mockThread}
        onReply={() => {}}
        onResolve={onResolve}
      />
    );

    fireEvent.click(screen.getByText('Resolve'));
    expect(onResolve).toHaveBeenCalledWith('thread-1');
  });

  it('hides resolve button for resolved threads', () => {
    const resolvedThread = { ...mockThread, status: 'resolved' as const };
    render(
      <ThreadPanel
        thread={resolvedThread}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
  });

  it('renders empty state when no thread selected', () => {
    render(
      <ThreadPanel
        thread={null}
        onReply={() => {}}
        onResolve={() => {}}
      />
    );

    expect(screen.getByText('Select a thread to view')).toBeInTheDocument();
  });
});
