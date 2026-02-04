/**
 * Tests for ThreadList component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadList } from '../components/ThreadList';
import type { ThreadSummary } from '../types';

describe('ThreadList', () => {
  const mockThreads: ThreadSummary[] = [
    { id: 'thread-1', uri: 'src/app.ts', firstLine: 'Consider using async/await here', status: 'open', commentCount: 3, lastUpdated: '2024-01-15T10:00:00Z' },
    { id: 'thread-2', uri: 'src/utils.ts', firstLine: 'This could be simplified', status: 'resolved', commentCount: 2, lastUpdated: '2024-01-15T09:00:00Z' },
    { id: 'thread-3', uri: null, firstLine: 'Plan looks good overall', status: 'open', commentCount: 1, lastUpdated: '2024-01-15T08:00:00Z' },
  ];

  it('renders all threads', () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    expect(screen.getByText('Consider using async/await here')).toBeInTheDocument();
    expect(screen.getByText('This could be simplified')).toBeInTheDocument();
    expect(screen.getByText('Plan looks good overall')).toBeInTheDocument();
  });

  it('displays thread status', () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    // Should have 2 open and 1 resolved status indicators
    const openIndicators = screen.getAllByText('open');
    const resolvedIndicators = screen.getAllByText('resolved');
    expect(openIndicators).toHaveLength(2);
    expect(resolvedIndicators).toHaveLength(1);
  });

  it('displays file paths for code threads', () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
    expect(screen.getByText('src/utils.ts')).toBeInTheDocument();
  });

  it('highlights the selected thread', () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThread="thread-2"
        onSelectThread={() => {}}
      />
    );

    const selectedItem = screen.getByText('This could be simplified').closest('.thread-list-item');
    expect(selectedItem).toHaveClass('selected');
  });

  it('calls onSelectThread when thread is clicked', () => {
    const onSelectThread = vi.fn();
    render(
      <ThreadList
        threads={mockThreads}
        selectedThread={null}
        onSelectThread={onSelectThread}
      />
    );

    fireEvent.click(screen.getByText('This could be simplified'));
    expect(onSelectThread).toHaveBeenCalledWith('thread-2');
  });

  it('displays comment counts', () => {
    render(
      <ThreadList
        threads={mockThreads}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders empty state when no threads', () => {
    render(
      <ThreadList
        threads={[]}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  it('uses VirtualList for large lists (>50 items)', () => {
    // Generate 60 threads
    const manyThreads: ThreadSummary[] = Array.from({ length: 60 }, (_, i) => ({
      id: `thread-${i}`,
      uri: `src/file-${i}.ts`,
      firstLine: `Comment ${i}`,
      status: 'open' as const,
      commentCount: 1,
      lastUpdated: '2024-01-15T10:00:00Z',
    }));

    const { container } = render(
      <ThreadList
        threads={manyThreads}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    // VirtualList renders with rc-virtual-list class
    expect(container.querySelector('.rc-virtual-list')).toBeInTheDocument();
  });

  it('uses Flex layout for small lists (<=50 items)', () => {
    const { container } = render(
      <ThreadList
        threads={mockThreads}
        selectedThread={null}
        onSelectThread={() => {}}
      />
    );

    // Should have thread-list class without virtual list
    expect(container.querySelector('.thread-list')).toBeInTheDocument();
    expect(container.querySelector('.rc-virtual-list')).not.toBeInTheDocument();
  });
});
