import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { PlanReview } from './PlanReview';
import type { PlanComment } from 'hive-core';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const samplePlan = `# Feature: User Authentication

## Overview

Implement OAuth2-based authentication with JWT tokens.
Support Google, GitHub, and email/password login flows.

### 1. Set Up Auth Service

Create the authentication service with token management.
Add session storage and refresh token rotation.

### 2. Implement Login UI

Build the login form with provider buttons.
Add form validation and error handling.

### 3. Add Route Guards

Protect authenticated routes with middleware.
Redirect unauthenticated users to login.`;

const emptyComments: PlanComment[] = [];

const sampleComments: PlanComment[] = [
  {
    id: 'comment-1',
    line: 5,
    body: 'Should we also support SAML for enterprise customers?',
    author: 'human',
    timestamp: '2026-01-15T10:00:00Z',
  },
  {
    id: 'comment-2',
    line: 10,
    body: 'Consider using Redis for session storage instead of in-memory.',
    author: 'human',
    timestamp: '2026-01-15T10:30:00Z',
    replies: [
      {
        id: 'reply-1',
        body: 'Good suggestion — Redis gives us distributed session support.',
        author: 'agent',
        timestamp: '2026-01-15T10:35:00Z',
      },
    ],
  },
  {
    id: 'comment-3',
    line: 17,
    body: 'This was addressed in the updated plan.',
    author: 'human',
    timestamp: '2026-01-15T11:00:00Z',
    resolved: true,
  },
];

const resolvedComments: PlanComment[] = [
  {
    id: 'resolved-1',
    line: 5,
    body: 'Already addressed in the overview.',
    author: 'human',
    timestamp: '2026-01-15T10:00:00Z',
    resolved: true,
  },
  {
    id: 'resolved-2',
    line: 10,
    body: 'Fixed in latest revision.',
    author: 'agent',
    timestamp: '2026-01-15T11:00:00Z',
    resolved: true,
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'Components/PlanReview',
  component: PlanReview,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
PlanReview displays plan markdown with line numbers and inline comment annotations.
Users can click on line gutters to add comments, and click on existing comment markers
to expand/collapse comment threads.

**Features:**
- Read-only plan display with line numbers
- Comment markers in the gutter showing existing comments
- Click gutter to add a new comment on any line
- Expand comments to view threads with replies
- Resolve comments inline
- Reply to existing comments
- Resolved comments are visually dimmed
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      description: 'Plan markdown content to display',
    },
    comments: {
      description: 'Existing comments on the plan',
    },
    onAddComment: {
      description: 'Called when user adds a new comment on a line',
    },
    onResolveComment: {
      description: 'Called when user resolves a comment',
    },
    onReplyToComment: {
      description: 'Called when user replies to a comment',
    },
  },
} satisfies Meta<typeof PlanReview>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Empty plan with no comments — shows the plan content with comment gutters.
 */
export const Empty: Story = {
  args: {
    content: samplePlan,
    comments: emptyComments,
    onAddComment: fn(),
    onResolveComment: fn(),
    onReplyToComment: fn(),
  },
};

/**
 * Plan with existing comments — markers appear in the gutter at commented lines.
 */
export const WithComments: Story = {
  args: {
    content: samplePlan,
    comments: sampleComments,
    onAddComment: fn(),
    onResolveComment: fn(),
    onReplyToComment: fn(),
  },
};

/**
 * Interactive: Click on a line gutter to open the comment input.
 */
export const AddComment: Story = {
  args: {
    content: samplePlan,
    comments: emptyComments,
    onAddComment: fn(),
    onResolveComment: fn(),
    onReplyToComment: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click on line 5 gutter to add a comment
    const gutter = canvas.getByTestId('plan-line-gutter-5');
    await userEvent.click(gutter);

    // Comment input should appear
    const input = canvas.getByPlaceholderText(/add a comment/i);
    await expect(input).toBeInTheDocument();

    // Type a comment and submit
    await userEvent.type(input, 'This needs more detail');
    const submitBtn = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(submitBtn);

    // Verify callback
    await expect(args.onAddComment).toHaveBeenCalledWith(
      5,
      'This needs more detail',
    );
  },
};

/**
 * Interactive: Resolve an existing comment.
 */
export const ResolveComment: Story = {
  args: {
    content: samplePlan,
    comments: [sampleComments[0]],
    onAddComment: fn(),
    onResolveComment: fn(),
    onReplyToComment: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click on comment marker to expand
    const marker = canvas.getByTestId('comment-marker-5');
    await userEvent.click(marker);

    // Click resolve
    const resolveBtn = canvas.getByRole('button', { name: /resolve/i });
    await userEvent.click(resolveBtn);

    // Verify callback
    await expect(args.onResolveComment).toHaveBeenCalledWith('comment-1');
  },
};

/**
 * Interactive: Reply to an existing comment.
 */
export const ReplyToComment: Story = {
  args: {
    content: samplePlan,
    comments: [sampleComments[0]],
    onAddComment: fn(),
    onResolveComment: fn(),
    onReplyToComment: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click on comment marker to expand
    const marker = canvas.getByTestId('comment-marker-5');
    await userEvent.click(marker);

    // Click Reply button to open input
    const replyToggle = canvas.getByRole('button', { name: /^reply$/i });
    await userEvent.click(replyToggle);

    // Type a reply and submit
    const replyInput = canvas.getByPlaceholderText(/reply/i);
    await userEvent.type(replyInput, 'Will address this');
    const replySubmit = canvas.getByRole('button', { name: /^reply$/i });
    await userEvent.click(replySubmit);

    // Verify callback
    await expect(args.onReplyToComment).toHaveBeenCalledWith(
      'comment-1',
      'Will address this',
    );
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for PlanReview.
 *
 * Verifies:
 * - Plan content is visible as text
 * - Line gutters are accessible via role="button"
 * - Comment markers have proper aria-labels
 * - Keyboard navigation works (Tab through interactive elements)
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    content: samplePlan,
    comments: sampleComments,
    onAddComment: fn(),
    onResolveComment: fn(),
    onReplyToComment: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Plan content is visible
    await expect(
      canvas.getByText('# Feature: User Authentication'),
    ).toBeInTheDocument();

    // Region is labeled
    const region = canvas.getByRole('region', { name: /plan review/i });
    await expect(region).toBeInTheDocument();

    // Comment markers have accessible labels
    const marker = canvas.getByTestId('comment-marker-5');
    await expect(marker).toHaveAttribute('aria-label');

    // Line gutters have role="button" and are focusable
    const gutter = canvas.getByTestId('plan-line-gutter-1');
    await expect(gutter).toHaveAttribute('role', 'button');
    await expect(gutter).toHaveAttribute('tabindex', '0');

    // Tab navigation works
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(document.body);
  },
};
