/**
 * Tests for CommitHistory component
 *
 * Verifies:
 * - Shows commit list with SHA (7-char short), message, relative timestamp
 * - Shows "No commits yet" when empty
 * - Clicking commit calls onCommitSelect(sha)
 * - Accessibility: list role, commit items have aria labels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from './test-utils';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { TaskCommit } from 'hive-core';

import { CommitHistory } from '../components/CommitHistory';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const now = new Date();

function minutesAgo(n: number): string {
  return new Date(now.getTime() - n * 60 * 1000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();
}

const singleCommit: TaskCommit[] = [
  {
    sha: 'abc1234567890def',
    message: 'feat: add login form',
    timestamp: minutesAgo(5),
  },
];

const multipleCommits: TaskCommit[] = [
  {
    sha: 'abc1234567890def',
    message: 'feat: add login form',
    timestamp: minutesAgo(5),
  },
  {
    sha: 'def4567890abcdef',
    message: 'fix: handle empty email',
    timestamp: hoursAgo(2),
  },
  {
    sha: '7890abcdef123456',
    message: 'refactor: extract validation',
    timestamp: hoursAgo(24),
  },
];

// ---------------------------------------------------------------------------
// Tests: Empty state
// ---------------------------------------------------------------------------

describe('CommitHistory - Empty state', () => {
  it('shows "No commits yet" when commits array is empty', () => {
    render(<CommitHistory commits={[]} />);

    expect(screen.getByText('No commits yet')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: Commit list rendering
// ---------------------------------------------------------------------------

describe('CommitHistory - Commit list', () => {
  it('renders commit SHA as 7-char short hash', () => {
    render(<CommitHistory commits={singleCommit} />);

    expect(screen.getByText('abc1234')).toBeInTheDocument();
    // Full SHA should NOT be displayed
    expect(screen.queryByText('abc1234567890def')).not.toBeInTheDocument();
  });

  it('renders commit message', () => {
    render(<CommitHistory commits={singleCommit} />);

    expect(screen.getByText('feat: add login form')).toBeInTheDocument();
  });

  it('renders relative timestamp', () => {
    render(<CommitHistory commits={singleCommit} />);

    // Should show "5 minutes ago" or similar relative time
    expect(screen.getByText(/5 minutes? ago/i)).toBeInTheDocument();
  });

  it('renders multiple commits', () => {
    render(<CommitHistory commits={multipleCommits} />);

    expect(screen.getByText('abc1234')).toBeInTheDocument();
    expect(screen.getByText('def4567')).toBeInTheDocument();
    expect(screen.getByText('7890abc')).toBeInTheDocument();

    expect(screen.getByText('feat: add login form')).toBeInTheDocument();
    expect(screen.getByText('fix: handle empty email')).toBeInTheDocument();
    expect(
      screen.getByText('refactor: extract validation'),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: Interaction
// ---------------------------------------------------------------------------

describe('CommitHistory - Interaction', () => {
  it('calls onCommitSelect with full SHA when commit is clicked', async () => {
    const user = userEvent.setup();
    const onCommitSelect = vi.fn();

    render(
      <CommitHistory commits={singleCommit} onCommitSelect={onCommitSelect} />,
    );

    const commitItem = screen
      .getByText('feat: add login form')
      .closest('[role="listitem"]')!;
    await user.click(commitItem);

    expect(onCommitSelect).toHaveBeenCalledWith('abc1234567890def');
    expect(onCommitSelect).toHaveBeenCalledTimes(1);
  });

  it('does not crash when onCommitSelect is not provided', async () => {
    const user = userEvent.setup();

    render(<CommitHistory commits={singleCommit} />);

    const commitItem = screen
      .getByText('feat: add login form')
      .closest('[role="listitem"]')!;
    // Should not throw
    await user.click(commitItem);
  });
});

// ---------------------------------------------------------------------------
// Tests: Accessibility
// ---------------------------------------------------------------------------

describe('CommitHistory - Accessibility', () => {
  it('renders with list role', () => {
    render(<CommitHistory commits={multipleCommits} />);

    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });

  it('commit items have listitem role', () => {
    render(<CommitHistory commits={multipleCommits} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('commit items have descriptive aria-labels', () => {
    render(<CommitHistory commits={singleCommit} />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute(
      'aria-label',
      expect.stringContaining('abc1234'),
    );
    expect(item).toHaveAttribute(
      'aria-label',
      expect.stringContaining('feat: add login form'),
    );
  });

  it('commit items are keyboard navigable when onCommitSelect provided', async () => {
    const user = userEvent.setup();
    const onCommitSelect = vi.fn();

    render(
      <CommitHistory commits={singleCommit} onCommitSelect={onCommitSelect} />,
    );

    const item = screen.getByRole('listitem');
    item.focus();
    await user.keyboard('{Enter}');

    expect(onCommitSelect).toHaveBeenCalledWith('abc1234567890def');
  });
});
