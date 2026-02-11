/**
 * Tests for PlanReview component
 *
 * Verifies:
 * - Renders plan markdown with line numbers
 * - Shows existing comments at correct lines
 * - Click line gutter opens comment input
 * - Submit comment calls onAddComment callback
 * - Resolved comments visually dimmed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from './test-utils';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { PlanComment } from 'hive-core';

import { PlanReview } from '../components/PlanReview';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const samplePlan = `# My Plan

## Overview

This is a sample plan.

### 1. First Task

Do something useful.

### 2. Second Task

Do something else.`;

const mockComments: PlanComment[] = [
  {
    id: 'comment-1',
    line: 5,
    body: 'This overview needs more detail',
    author: 'human',
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 'comment-2',
    line: 9,
    body: 'Good task description',
    author: 'agent',
    timestamp: '2026-01-01T01:00:00Z',
    resolved: true,
  },
];

const resolvedComment: PlanComment = {
  id: 'comment-resolved',
  line: 3,
  body: 'This was addressed',
  author: 'human',
  timestamp: '2026-01-01T00:00:00Z',
  resolved: true,
};

const commentWithReplies: PlanComment = {
  id: 'comment-with-replies',
  line: 5,
  body: 'What about edge cases?',
  author: 'human',
  timestamp: '2026-01-01T00:00:00Z',
  replies: [
    {
      id: 'reply-1',
      body: 'Good point, will add error handling',
      author: 'agent',
      timestamp: '2026-01-01T02:00:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests: Basic rendering
// ---------------------------------------------------------------------------

describe('PlanReview - Basic rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan markdown with line numbers', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Should render the component
    expect(screen.getByTestId('plan-review')).toBeInTheDocument();

    // Should render line numbers for each line
    const lines = samplePlan.split('\n');
    expect(screen.getByTestId('plan-line-1')).toBeInTheDocument();
    expect(screen.getByTestId(`plan-line-${lines.length}`)).toBeInTheDocument();
  });

  it('renders empty state when content is empty', () => {
    render(
      <PlanReview
        content=""
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    expect(screen.getByText(/no plan content/i)).toBeInTheDocument();
  });

  it('displays plan line content', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    expect(screen.getByText('# My Plan')).toBeInTheDocument();
    expect(screen.getByText('This is a sample plan.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: Comments rendering
// ---------------------------------------------------------------------------

describe('PlanReview - Comments rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows existing comments at correct lines', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={mockComments}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Comment markers should be present at lines with comments
    expect(screen.getByTestId('comment-marker-5')).toBeInTheDocument();
    expect(screen.getByTestId('comment-marker-9')).toBeInTheDocument();

    // Lines without comments should not have markers
    expect(screen.queryByTestId('comment-marker-1')).not.toBeInTheDocument();
  });

  it('shows comment body when comment marker is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PlanReview
        content={samplePlan}
        comments={mockComments}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Click on the comment marker at line 5
    await user.click(screen.getByTestId('comment-marker-5'));

    // Comment body should now be visible
    expect(
      screen.getByText('This overview needs more detail'),
    ).toBeInTheDocument();
  });

  it('resolved comments are visually dimmed', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={[resolvedComment]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    const marker = screen.getByTestId('comment-marker-3');
    // Resolved markers should have the resolved class
    expect(marker).toHaveClass('comment-marker-resolved');
  });

  it('shows comment count when multiple comments on same line', () => {
    const multiComments: PlanComment[] = [
      {
        id: 'c1',
        line: 5,
        body: 'First comment',
        author: 'human',
        timestamp: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c2',
        line: 5,
        body: 'Second comment',
        author: 'agent',
        timestamp: '2026-01-01T01:00:00Z',
      },
    ];

    render(
      <PlanReview
        content={samplePlan}
        comments={multiComments}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    const marker = screen.getByTestId('comment-marker-5');
    expect(marker).toHaveTextContent('2');
  });
});

// ---------------------------------------------------------------------------
// Tests: Adding comments
// ---------------------------------------------------------------------------

describe('PlanReview - Adding comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('click line gutter opens comment input', async () => {
    const user = userEvent.setup();

    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Click on the line gutter for line 3
    await user.click(screen.getByTestId('plan-line-gutter-3'));

    // Comment input should appear
    expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
  });

  it('submit comment calls onAddComment callback', async () => {
    const user = userEvent.setup();
    const onAddComment = vi.fn();

    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={onAddComment}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Click on the line gutter for line 3
    await user.click(screen.getByTestId('plan-line-gutter-3'));

    // Type a comment
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, 'This needs clarification');

    // Click submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify callback was called with line number and body
    expect(onAddComment).toHaveBeenCalledWith(3, 'This needs clarification');
  });

  it('comment input is cleared after submission', async () => {
    const user = userEvent.setup();

    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Click on the line gutter for line 3
    await user.click(screen.getByTestId('plan-line-gutter-3'));

    // Type and submit
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, 'Test comment');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Input should be cleared and hidden
    expect(
      screen.queryByPlaceholderText(/add a comment/i),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: Resolve and reply
// ---------------------------------------------------------------------------

describe('PlanReview - Resolve and reply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolve button calls onResolveComment with comment id', async () => {
    const user = userEvent.setup();
    const onResolveComment = vi.fn();

    render(
      <PlanReview
        content={samplePlan}
        comments={[mockComments[0]]}
        onAddComment={vi.fn()}
        onResolveComment={onResolveComment}
        onReplyToComment={vi.fn()}
      />,
    );

    // Expand the comment
    await user.click(screen.getByTestId('comment-marker-5'));

    // Click resolve
    const resolveButton = screen.getByRole('button', { name: /resolve/i });
    await user.click(resolveButton);

    expect(onResolveComment).toHaveBeenCalledWith('comment-1');
  });

  it('reply calls onReplyToComment with comment id and body', async () => {
    const user = userEvent.setup();
    const onReplyToComment = vi.fn();

    render(
      <PlanReview
        content={samplePlan}
        comments={[mockComments[0]]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={onReplyToComment}
      />,
    );

    // Expand the comment
    await user.click(screen.getByTestId('comment-marker-5'));

    // Click Reply button to open the reply input
    const replyToggle = screen.getByRole('button', { name: /^reply$/i });
    await user.click(replyToggle);

    // Type a reply
    const replyInput = screen.getByPlaceholderText(/reply/i);
    await user.type(replyInput, 'Will fix this');

    // Click the submit reply button
    const replySubmit = screen.getByRole('button', { name: /^reply$/i });
    await user.click(replySubmit);

    expect(onReplyToComment).toHaveBeenCalledWith('comment-1', 'Will fix this');
  });

  it('shows existing replies for comments', async () => {
    const user = userEvent.setup();

    render(
      <PlanReview
        content={samplePlan}
        comments={[commentWithReplies]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Expand the comment
    await user.click(screen.getByTestId('comment-marker-5'));

    // Should show the original comment body and the reply
    expect(screen.getByText('What about edge cases?')).toBeInTheDocument();
    expect(
      screen.getByText('Good point, will add error handling'),
    ).toBeInTheDocument();
  });
});
