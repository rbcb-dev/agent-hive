/**
 * Tests for PlanReview component
 *
 * Verifies:
 * - Renders plan markdown with line numbers
 * - Shows existing comments at correct lines (using range.start.line)
 * - Click line gutter opens comment input
 * - Submit comment calls onAddComment with Range (0-based)
 * - Resolved comments visually dimmed
 * - Range selection via mouse across multiple lines
 * - Full range highlighting when comment thread is active
 * - 0-based line contract: internal Range uses 0-based, display uses 1-based
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from './test-utils';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { PlanComment, Range } from 'hive-core';

import { PlanReview } from '../components/PlanReview';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a 0-based Range for plan lines (character always 0 for plan comments) */
function makeRange(startLine: number, endLine: number): Range {
  return {
    start: { line: startLine, character: 0 },
    end: { line: endLine, character: 0 },
  };
}

// ---------------------------------------------------------------------------
// Test data — all ranges use 0-based lines
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
    range: makeRange(4, 4), // display line 5 (0-based line 4)
    body: 'This overview needs more detail',
    author: 'human',
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 'comment-2',
    range: makeRange(8, 8), // display line 9 (0-based line 8)
    body: 'Good task description',
    author: 'agent',
    timestamp: '2026-01-01T01:00:00Z',
    resolved: true,
  },
];

const resolvedComment: PlanComment = {
  id: 'comment-resolved',
  range: makeRange(2, 2), // display line 3
  body: 'This was addressed',
  author: 'human',
  timestamp: '2026-01-01T00:00:00Z',
  resolved: true,
};

const commentWithReplies: PlanComment = {
  id: 'comment-with-replies',
  range: makeRange(4, 4), // display line 5
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
// Tests: Comments rendering (using range.start.line for grouping)
// ---------------------------------------------------------------------------

describe('PlanReview - Comments rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows existing comments at correct lines (grouped by range.start.line)', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={mockComments}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Comment markers should be present at display lines (1-based: 5 and 9)
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

    // Click on the comment marker at display line 5
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
        range: makeRange(4, 4), // display line 5
        body: 'First comment',
        author: 'human',
        timestamp: '2026-01-01T00:00:00Z',
      },
      {
        id: 'c2',
        range: makeRange(4, 4), // display line 5
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
// Tests: Adding comments (range-based)
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

    // Click on the line gutter for display line 3
    await user.click(screen.getByTestId('plan-line-gutter-3'));

    // Comment input should appear
    expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
  });

  it('submit comment calls onAddComment with Range (0-based)', async () => {
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

    // Click on the line gutter for display line 3 (0-based line 2)
    await user.click(screen.getByTestId('plan-line-gutter-3'));

    // Type a comment
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, 'This needs clarification');

    // Click submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Verify callback was called with Range (0-based) and body
    expect(onAddComment).toHaveBeenCalledWith(
      makeRange(2, 2),
      'This needs clarification',
    );
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

    // Click on the line gutter for display line 3
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

// ---------------------------------------------------------------------------
// Tests: Range selection
// ---------------------------------------------------------------------------

describe('PlanReview - Range selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mousedown + mousemove across lines creates a selection', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Simulate mousedown on line 3 content, then mouseenter on line 5
    const line3 = screen.getByTestId('plan-line-3');
    const line5 = screen.getByTestId('plan-line-5');

    fireEvent.mouseDown(line3);
    fireEvent.mouseEnter(line5);
    fireEvent.mouseUp(line5);

    // Lines 3-5 should be highlighted as selected
    expect(line3).toHaveClass('plan-line-selected');
    expect(screen.getByTestId('plan-line-4')).toHaveClass('plan-line-selected');
    expect(line5).toHaveClass('plan-line-selected');

    // Lines outside selection should not be highlighted
    expect(screen.getByTestId('plan-line-1')).not.toHaveClass(
      'plan-line-selected',
    );
    expect(screen.getByTestId('plan-line-6')).not.toHaveClass(
      'plan-line-selected',
    );
  });

  it('shows "Add Comment" button after selection', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    const line3 = screen.getByTestId('plan-line-3');
    const line5 = screen.getByTestId('plan-line-5');

    fireEvent.mouseDown(line3);
    fireEvent.mouseEnter(line5);
    fireEvent.mouseUp(line5);

    // "Add Comment" button should be visible (use exact name to avoid matching gutter buttons)
    expect(
      screen.getByRole('button', { name: 'Add comment' }),
    ).toBeInTheDocument();
  });

  it('selecting lines 3-5 calls onAddComment with 0-based Range', async () => {
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

    const line3 = screen.getByTestId('plan-line-3');
    const line5 = screen.getByTestId('plan-line-5');

    // Select lines 3-5 (display lines, 1-based)
    fireEvent.mouseDown(line3);
    fireEvent.mouseEnter(line5);
    fireEvent.mouseUp(line5);

    // Click "Add Comment" button to open comment input (exact name match)
    const addBtn = screen.getByRole('button', { name: 'Add comment' });
    await user.click(addBtn);

    // Type comment and submit
    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, 'Range comment');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Should be called with 0-based Range: lines 3-5 display = 0-based 2-4
    expect(onAddComment).toHaveBeenCalledWith(
      {
        start: { line: 2, character: 0 },
        end: { line: 4, character: 0 },
      },
      'Range comment',
    );
  });

  it('reverse selection (drag up) normalizes to correct range', () => {
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

    // Select from line 5 (down) to line 3 (up)
    const line5 = screen.getByTestId('plan-line-5');
    const line3 = screen.getByTestId('plan-line-3');

    fireEvent.mouseDown(line5);
    fireEvent.mouseEnter(line3);
    fireEvent.mouseUp(line3);

    // Both lines should be selected regardless of direction
    expect(line3).toHaveClass('plan-line-selected');
    expect(line5).toHaveClass('plan-line-selected');
  });
});

// ---------------------------------------------------------------------------
// Tests: Range highlighting for active comments
// ---------------------------------------------------------------------------

describe('PlanReview - Range highlighting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('highlights full range when comment thread is expanded', async () => {
    const user = userEvent.setup();

    // Comment spanning 0-based lines 2-4 (display 3-5)
    const rangeComment: PlanComment = {
      id: 'range-comment',
      range: makeRange(2, 4),
      body: 'This section needs work',
      author: 'human',
      timestamp: '2026-01-01T00:00:00Z',
    };

    render(
      <PlanReview
        content={samplePlan}
        comments={[rangeComment]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Click the comment marker at display line 3 (start of range)
    await user.click(screen.getByTestId('comment-marker-3'));

    // Lines 3-5 (display) should have the active highlight class
    expect(screen.getByTestId('plan-line-3')).toHaveClass(
      'plan-line-comment-active',
    );
    expect(screen.getByTestId('plan-line-4')).toHaveClass(
      'plan-line-comment-active',
    );
    expect(screen.getByTestId('plan-line-5')).toHaveClass(
      'plan-line-comment-active',
    );

    // Lines outside range should not be highlighted
    expect(screen.getByTestId('plan-line-1')).not.toHaveClass(
      'plan-line-comment-active',
    );
    expect(screen.getByTestId('plan-line-6')).not.toHaveClass(
      'plan-line-comment-active',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: 0-based line contract
// ---------------------------------------------------------------------------

describe('PlanReview - 0-based line contract', () => {
  it('display shows 1-based line numbers while Range uses 0-based internally', () => {
    render(
      <PlanReview
        content={samplePlan}
        comments={[]}
        onAddComment={vi.fn()}
        onResolveComment={vi.fn()}
        onReplyToComment={vi.fn()}
      />,
    );

    // Display line 1 should show "1" in the line number
    const line1 = screen.getByTestId('plan-line-1');
    const lineNumber = within(line1).getByText('1');
    expect(lineNumber).toBeInTheDocument();

    // There should be no line 0 in display
    expect(screen.queryByTestId('plan-line-0')).not.toBeInTheDocument();
  });

  it('gutter click on display line 1 produces 0-based Range with line 0', async () => {
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

    // Click display line 1 gutter
    await user.click(screen.getByTestId('plan-line-gutter-1'));

    const input = screen.getByPlaceholderText(/add a comment/i);
    await user.type(input, 'First line comment');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Range should be 0-based: display line 1 → 0-based line 0
    expect(onAddComment).toHaveBeenCalledWith(
      makeRange(0, 0),
      'First line comment',
    );
  });
});
