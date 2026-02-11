import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { ThreadList } from './ThreadList';
import type { ThreadSummary } from '../types';

const meta = {
  title: 'Components/ThreadList',
  component: ThreadList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    selectedThread: {
      control: 'text',
      description: 'ID of the currently selected thread',
    },
  },
} satisfies Meta<typeof ThreadList>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Mock ThreadSummary data
// =============================================================================

function createMockThreadSummary(
  overrides: Partial<ThreadSummary> = {},
): ThreadSummary {
  return {
    id:
      overrides.id ??
      `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    uri:
      overrides.uri !== undefined
        ? overrides.uri
        : 'src/components/Example.tsx',
    firstLine: overrides.firstLine ?? 'This is a comment preview...',
    status: overrides.status ?? 'open',
    commentCount: overrides.commentCount ?? 1,
    lastUpdated: overrides.lastUpdated ?? new Date().toISOString(),
  };
}

const openThread1 = createMockThreadSummary({
  id: 'thread-1',
  uri: 'src/app.ts',
  firstLine: 'Consider using async/await here instead of raw promises',
  status: 'open',
  commentCount: 3,
});

const resolvedThread = createMockThreadSummary({
  id: 'thread-2',
  uri: 'src/utils.ts',
  firstLine: 'This function could be simplified with reduce()',
  status: 'resolved',
  commentCount: 5,
});

const openThread2 = createMockThreadSummary({
  id: 'thread-3',
  uri: 'src/hooks/useData.ts',
  firstLine: 'Missing error handling in this useEffect',
  status: 'open',
  commentCount: 2,
});

const outdatedThread = createMockThreadSummary({
  id: 'thread-4',
  uri: 'src/components/Button.tsx',
  firstLine: 'This comment is on code that has changed',
  status: 'outdated',
  commentCount: 1,
});

const planThread = createMockThreadSummary({
  id: 'thread-5',
  uri: null, // No file - this is a plan-level comment
  firstLine: 'Overall approach looks good, but consider edge cases',
  status: 'open',
  commentCount: 4,
});

// =============================================================================
// Stories
// =============================================================================

/**
 * Empty state when there are no threads
 */
export const Empty: Story = {
  args: {
    threads: [],
    selectedThread: null,
    onSelectThread: fn(),
  },
};

/**
 * Thread list with multiple threads
 */
export const WithThreads: Story = {
  args: {
    threads: [openThread1, openThread2, planThread],
    selectedThread: null,
    onSelectThread: fn(),
  },
};

/**
 * Mix of open, resolved, and outdated threads
 */
export const WithMixedStatus: Story = {
  args: {
    threads: [
      openThread1,
      resolvedThread,
      openThread2,
      outdatedThread,
      planThread,
    ],
    selectedThread: null,
    onSelectThread: fn(),
  },
};

/**
 * Thread list with one item selected
 */
export const WithSelection: Story = {
  args: {
    threads: [openThread1, resolvedThread, openThread2],
    selectedThread: 'thread-2',
    onSelectThread: fn(),
  },
};

/**
 * Interactive test - selecting a thread fires the callback
 */
export const SelectThread: Story = {
  args: {
    threads: [openThread1, resolvedThread, openThread2],
    selectedThread: null,
    onSelectThread: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the thread item with "async/await" text and click it
    const threadItem = canvas
      .getByText(/async\/await/i)
      .closest('.thread-list-item');
    if (threadItem) {
      await userEvent.click(threadItem);
    }

    // Verify the callback was called with the correct thread ID
    await expect(args.onSelectThread).toHaveBeenCalledWith('thread-1');
  },
};

/**
 * Status indicators are visible and correctly colored
 */
export const StatusIndicators: Story = {
  args: {
    threads: [openThread1, resolvedThread, outdatedThread],
    selectedThread: null,
    onSelectThread: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all status indicators are visible
    const openIndicators = canvas.getAllByText('open');
    const resolvedIndicators = canvas.getAllByText('resolved');
    const outdatedIndicators = canvas.getAllByText('outdated');

    await expect(openIndicators).toHaveLength(1);
    await expect(resolvedIndicators).toHaveLength(1);
    await expect(outdatedIndicators).toHaveLength(1);
  },
};

/**
 * Keyboard navigation - Enter key selects thread
 */
export const KeyboardNavigation: Story = {
  args: {
    threads: [openThread1, resolvedThread],
    selectedThread: null,
    onSelectThread: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the thread item and focus it
    const threadItem = canvas
      .getByText(/async\/await/i)
      .closest('.thread-list-item');
    if (threadItem instanceof HTMLElement) {
      threadItem.focus();
      await userEvent.keyboard('{Enter}');
    }

    // Verify the callback was called
    await expect(args.onSelectThread).toHaveBeenCalledWith('thread-1');
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for ThreadList.
 *
 * Verifies:
 * - Thread items are visible and readable
 * - Status indicators are rendered as text
 * - Thread items are clickable
 * - Keyboard Tab can focus interactive elements
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    threads: [openThread1, resolvedThread, openThread2],
    selectedThread: null,
    onSelectThread: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify thread preview text is visible
    await expect(canvas.getByText(/async\/await/i)).toBeInTheDocument();
    await expect(
      canvas.getByText(/simplified with reduce/i),
    ).toBeInTheDocument();

    // Verify status indicators are visible as text (readable by screen readers)
    const openIndicators = canvas.getAllByText('open');
    await expect(openIndicators.length).toBeGreaterThan(0);
    await expect(canvas.getByText('resolved')).toBeInTheDocument();

    // Verify a thread item is clickable
    const threadItem = canvas
      .getByText(/async\/await/i)
      .closest('.thread-list-item');
    if (threadItem) {
      await userEvent.click(threadItem);
    }
    await expect(args.onSelectThread).toHaveBeenCalledWith('thread-1');

    // Tab navigation should move focus to interactive elements
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(document.body);
  },
};

// Generate many threads for VirtualList testing
const manyThreads: ThreadSummary[] = Array.from({ length: 100 }, (_, i) =>
  createMockThreadSummary({
    id: `thread-${i}`,
    uri: `src/file-${i}.ts`,
    firstLine: `Comment ${i}: This is a sample comment for testing virtual scrolling performance with large lists`,
    status: i % 3 === 0 ? 'resolved' : i % 5 === 0 ? 'outdated' : 'open',
    commentCount: (i % 10) + 1,
  }),
);

/**
 * Large list using VirtualList (>50 items) for performance
 */
export const LargeList: Story = {
  args: {
    threads: manyThreads,
    selectedThread: null,
    onSelectThread: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Lists with more than 50 items automatically use VirtualList for performance. Only visible items are rendered.',
      },
    },
  },
};

/**
 * Large list with selection
 */
export const LargeListWithSelection: Story = {
  args: {
    threads: manyThreads,
    selectedThread: 'thread-42',
    onSelectThread: fn(),
  },
};
