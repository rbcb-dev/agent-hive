/**
 * Storybook stories for CommitHistory component
 *
 * Stories: Empty, SingleCommit, MultipleCommits, WithSelection, AccessibilityCheck
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';
import type { TaskCommit } from 'hive-core';

import { CommitHistory } from './CommitHistory';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const singleCommit: TaskCommit[] = [
  {
    sha: 'abc1234567890def',
    message: 'feat: add login form component',
    timestamp: minutesAgo(5),
  },
];

const multipleCommits: TaskCommit[] = [
  {
    sha: 'abc1234567890def',
    message: 'feat: add login form component',
    timestamp: minutesAgo(5),
  },
  {
    sha: 'def4567890abcdef',
    message: 'fix: handle empty email validation',
    timestamp: hoursAgo(2),
  },
  {
    sha: '7890abcdef123456',
    message: 'refactor: extract form validation logic',
    timestamp: hoursAgo(8),
  },
  {
    sha: 'fedcba9876543210',
    message: 'chore: add test fixtures',
    timestamp: daysAgo(1),
  },
  {
    sha: '1234567890abcdef',
    message: 'feat: initial task scaffold',
    timestamp: daysAgo(3),
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Components/CommitHistory',
  component: CommitHistory,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onCommitSelect: { action: 'commitSelected' },
  },
} satisfies Meta<typeof CommitHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Empty — no commits yet.
 * Shows "No commits yet" message.
 */
export const Empty: Story = {
  args: {
    commits: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No commits yet')).toBeInTheDocument();
  },
};

/**
 * SingleCommit — one commit in history.
 * Shows SHA, message, and relative timestamp.
 */
export const SingleCommit: Story = {
  args: {
    commits: singleCommit,
    onCommitSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('abc1234')).toBeInTheDocument();
    await expect(
      canvas.getByText('feat: add login form component'),
    ).toBeInTheDocument();
    await expect(canvas.getByRole('list')).toBeInTheDocument();
    await expect(canvas.getByRole('listitem')).toBeInTheDocument();
  },
};

/**
 * MultipleCommits — several commits in chronological order.
 * Demonstrates the full list rendering with varied timestamps.
 */
export const MultipleCommits: Story = {
  args: {
    commits: multipleCommits,
    onCommitSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('listitem');
    await expect(items).toHaveLength(5);
    // All SHAs visible as short form
    await expect(canvas.getByText('abc1234')).toBeInTheDocument();
    await expect(canvas.getByText('def4567')).toBeInTheDocument();
    await expect(canvas.getByText('7890abc')).toBeInTheDocument();
    await expect(canvas.getByText('fedcba9')).toBeInTheDocument();
    await expect(canvas.getByText('1234567')).toBeInTheDocument();
  },
};

/**
 * WithSelection — clicking a commit triggers onCommitSelect.
 */
export const WithSelection: Story = {
  args: {
    commits: multipleCommits,
    onCommitSelect: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const firstItem = canvas.getAllByRole('listitem')[0];
    await userEvent.click(firstItem);
    await expect(args.onCommitSelect).toHaveBeenCalledWith('abc1234567890def');
  },
};

/**
 * AccessibilityCheck — verifies ARIA structure.
 * - list role on container
 * - listitem role on each commit
 * - aria-label on each item with SHA and message
 */
export const AccessibilityCheck: Story = {
  args: {
    commits: singleCommit,
    onCommitSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // List role
    const list = canvas.getByRole('list');
    await expect(list).toBeInTheDocument();
    await expect(list).toHaveAttribute('aria-label', 'Commit history');

    // Item role with descriptive aria-label
    const item = canvas.getByRole('listitem');
    await expect(item).toHaveAttribute(
      'aria-label',
      expect.stringContaining('abc1234'),
    );
    await expect(item).toHaveAttribute(
      'aria-label',
      expect.stringContaining('feat: add login form component'),
    );

    // Keyboard navigable (has tabIndex)
    await expect(item).toHaveAttribute('tabindex', '0');
  },
};
