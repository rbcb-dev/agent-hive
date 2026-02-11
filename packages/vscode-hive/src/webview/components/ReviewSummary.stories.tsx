/**
 * Storybook stories for ReviewSummary component
 *
 * Shows the review submission form with verdict selector and summary input.
 * Stories demonstrate different verdict states and submission states.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { ReviewSummary } from './ReviewSummary';

const meta = {
  title: 'Components/ReviewSummary',
  component: ReviewSummary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Review submission form with verdict selector (Approve, Request Changes, Comment) and summary textarea.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isSubmitting: {
      control: 'boolean',
      description: 'Whether the review is currently being submitted',
    },
    onSubmit: {
      action: 'submit',
      description: 'Callback when user submits the review',
    },
  },
} satisfies Meta<typeof ReviewSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty state - no verdict selected, submit disabled
 * Initial state when the component first renders
 */
export const Empty: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
};

/**
 * Pending state - submission in progress
 * All inputs disabled, submit button shows "Submitting…"
 */
export const Pending: Story = {
  args: {
    isSubmitting: true,
    onSubmit: fn(),
  },
};

/**
 * Approved state - Approve verdict selected
 * Shows the green checkmark verdict indicator with "Approve" highlighted
 */
export const Approved: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Select the Approve verdict
    const approveButton = canvas.getByRole('button', { name: /Approve/i });
    await userEvent.click(approveButton);

    // Verify it's selected (has 'selected' class)
    await expect(approveButton).toHaveClass('selected');
  },
};

/**
 * Request Changes state - Request Changes verdict selected
 * Shows the red X verdict indicator with "Request Changes" highlighted
 */
export const RequestChanges: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Select the Request Changes verdict
    const requestChangesButton = canvas.getByRole('button', {
      name: /Request Changes/i,
    });
    await userEvent.click(requestChangesButton);

    // Verify it's selected
    await expect(requestChangesButton).toHaveClass('selected');
  },
};

/**
 * Comment state - Comment verdict selected
 * Shows the blue comment icon with "Comment" highlighted
 */
export const Comment: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Select the Comment verdict
    const commentButton = canvas.getByRole('button', { name: /Comment/i });
    await userEvent.click(commentButton);

    // Verify it's selected
    await expect(commentButton).toHaveClass('selected');
  },
};

/**
 * With Summary - Shows a pre-filled summary textarea
 * Demonstrates how the summary field looks with content
 */
export const WithSummary: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Select a verdict first
    const approveButton = canvas.getByRole('button', { name: /Approve/i });
    await userEvent.click(approveButton);

    // Enter summary text
    const textarea = canvas.getByPlaceholderText(/summary/i);
    await userEvent.type(
      textarea,
      'LGTM! Great implementation with clean code structure.',
    );

    // Verify the summary was entered
    await expect(textarea).toHaveValue(
      'LGTM! Great implementation with clean code structure.',
    );
  },
};

/**
 * All Verdicts - Interactive demonstration of switching between verdicts
 * Shows that selecting a new verdict deselects the previous one
 */
export const SwitchingVerdicts: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get all verdict buttons
    const approveButton = canvas.getByRole('button', { name: /Approve/i });
    const requestChangesButton = canvas.getByRole('button', {
      name: /Request Changes/i,
    });
    const commentButton = canvas.getByRole('button', { name: /Comment/i });

    // Select Approve
    await userEvent.click(approveButton);
    await expect(approveButton).toHaveClass('selected');

    // Switch to Request Changes
    await userEvent.click(requestChangesButton);
    await expect(requestChangesButton).toHaveClass('selected');
    await expect(approveButton).not.toHaveClass('selected');

    // Switch to Comment
    await userEvent.click(commentButton);
    await expect(commentButton).toHaveClass('selected');
    await expect(requestChangesButton).not.toHaveClass('selected');
  },
};

/**
 * Statistics display - Shows thread/comment counts
 * (This story assumes statistics might be added to the component in the future)
 * For now, demonstrates the verdict options which serve as the main "statistics"
 * showing available review outcomes.
 */
export const VerdictStatistics: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Displays the three verdict options (Approve, Request Changes, Comment) with their distinct visual indicators: green checkmark for approve, red X for request changes, and blue comment icon.',
      },
    },
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for ReviewSummary.
 *
 * Verifies:
 * - Verdict buttons are discoverable via role queries
 * - Summary textarea has a placeholder for screen readers
 * - Submit button is present and accessible
 * - Keyboard Tab moves through interactive elements
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify verdict radio group is accessible
    const radioGroup = canvas.getByRole('radiogroup');
    await expect(radioGroup).toBeInTheDocument();

    // Verify verdict options are accessible as radio inputs
    await expect(
      canvas.getByRole('radio', { name: /Approve/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('radio', { name: /Request Changes/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('radio', { name: /Comment/i }),
    ).toBeInTheDocument();

    // Verify submit button is accessible
    await expect(
      canvas.getByRole('button', { name: /Submit Review/i }),
    ).toBeInTheDocument();

    // Verify summary textarea is present with placeholder
    const textarea = canvas.getByPlaceholderText(/summary/i);
    await expect(textarea).toBeInTheDocument();
  },
};

/**
 * Keyboard Submit - Tests Cmd/Ctrl+Enter keyboard shortcut
 * Verifies that pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) triggers submit
 */
export const KeyboardSubmit: Story = {
  args: {
    isSubmitting: false,
    onSubmit: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the keyboard shortcut for submitting reviews. Press Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) while focused on the textarea to submit.',
      },
    },
    // Disable snapshot for interaction test - visual state is same as WithSummary
    snapshot: { disable: true },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Select a verdict first (required for submit) - click the label text
    const approveLabel = canvas.getByText(/Approve/i);
    await userEvent.click(approveLabel);

    // Get the textarea and type some content
    const textarea = canvas.getByPlaceholderText(/summary/i);
    await userEvent.type(textarea, 'LGTM! Clean implementation.');

    // Verify onSubmit hasn't been called yet
    await expect(args.onSubmit).not.toHaveBeenCalled();

    // Submit with Cmd+Enter (metaKey) - using type() pattern like ThreadPanel story
    await userEvent.type(textarea, '{Meta>}{Enter}{/Meta}');

    // Verify onSubmit was called with correct args
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(args.onSubmit).toHaveBeenCalledWith(
      'approve',
      'LGTM! Clean implementation.',
    );
  },
};
