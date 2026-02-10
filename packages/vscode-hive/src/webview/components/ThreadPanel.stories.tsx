import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { ThreadPanel } from './ThreadPanel';
import {
  createMockReviewThread,
  createMockAnnotation,
} from '../__stories__/mocks';

const meta = {
  title: 'Components/ThreadPanel',
  component: ThreadPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    thread: {
      description: 'The review thread to display (null shows empty state)',
    },
    onReply: {
      description: 'Callback when user submits a reply',
      action: 'reply',
    },
    onResolve: {
      description: 'Callback when user resolves the thread',
      action: 'resolve',
    },
  },
} satisfies Meta<typeof ThreadPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Empty state when no thread is selected
 */
export const Empty: Story = {
  args: {
    thread: null,
    onReply: fn(),
    onResolve: fn(),
  },
};

/**
 * Thread with a single human comment
 */
export const WithThread: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-1',
      uri: 'src/components/Button.tsx',
      range: {
        start: { line: 10, character: 0 },
        end: { line: 15, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-1',
          body: 'This component should use a more descriptive name. Consider renaming to PrimaryButton.',
          author: { type: 'human', name: 'Alex' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
};

/**
 * Thread with an AI-generated annotation (shows AI badge)
 */
export const WithAIAnnotation: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-ai',
      uri: 'src/utils/helpers.ts',
      range: {
        start: { line: 42, character: 0 },
        end: { line: 50, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-ai',
          body: 'This function has a potential null reference error. The `user` parameter should be validated before accessing its properties.',
          author: { type: 'llm', name: 'Claude', agentId: 'claude-reviewer' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
};

/**
 * Thread with a code suggestion annotation
 */
export const WithSuggestion: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-suggestion',
      uri: 'src/api/client.ts',
      range: {
        start: { line: 25, character: 0 },
        end: { line: 30, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-suggestion',
          type: 'suggestion',
          body: 'Consider using async/await instead of promise chaining for better readability.',
          author: { type: 'human', name: 'Sam' },
          suggestion: {
            replacement: `async function fetchData(url: string) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}`,
          },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
};

/**
 * Resolved thread (no resolve button shown)
 */
export const Resolved: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-resolved',
      uri: 'src/components/Header.tsx',
      range: {
        start: { line: 5, character: 0 },
        end: { line: 8, character: 0 },
      },
      status: 'resolved',
      annotations: [
        createMockAnnotation({
          id: 'annotation-resolved-1',
          body: 'This import is unused.',
          author: { type: 'human', name: 'Taylor' },
        }),
        createMockAnnotation({
          id: 'annotation-resolved-2',
          body: 'Fixed! Removed the unused import.',
          author: { type: 'human', name: 'Jordan' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
};

// =============================================================================
// Interactive Play Functions
// =============================================================================

/**
 * Tests the reply flow: type a message and submit with Cmd+Enter
 */
export const ReplyWithCmdEnter: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-reply-test',
      uri: 'src/test.ts',
      range: {
        start: { line: 1, character: 0 },
        end: { line: 5, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-reply-test',
          body: 'Please add a comment here.',
          author: { type: 'human', name: 'Reviewer' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the reply textarea
    const replyInput = canvas.getByRole('textbox', {
      name: /reply to thread/i,
    });

    // Type a reply message
    const replyText = 'This is my reply to the comment.';
    await userEvent.type(replyInput, replyText);

    // Verify text was entered
    await expect(replyInput).toHaveValue(replyText);

    // Submit with Cmd+Enter (metaKey)
    await userEvent.type(replyInput, '{Meta>}{Enter}{/Meta}');

    // Verify callback was called with the thread ID and message
    await expect(args.onReply).toHaveBeenCalledWith(
      'thread-reply-test',
      replyText,
    );
  },
};

/**
 * Tests the reply flow: type a message and click the Reply button
 */
export const ReplyWithButton: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-button-test',
      uri: 'src/test.ts',
      range: {
        start: { line: 1, character: 0 },
        end: { line: 5, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-button-test',
          body: 'Another review comment.',
          author: { type: 'human', name: 'Reviewer' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the reply textarea
    const replyInput = canvas.getByRole('textbox', {
      name: /reply to thread/i,
    });

    // Type a reply message
    const replyText = 'Clicking the button to reply.';
    await userEvent.type(replyInput, replyText);

    // Find and click the Reply button
    const replyButton = canvas.getByRole('button', { name: /submit reply/i });
    await userEvent.click(replyButton);

    // Verify callback was called
    await expect(args.onReply).toHaveBeenCalledWith(
      'thread-button-test',
      replyText,
    );
  },
};

/**
 * Tests the resolve action: clicking the Resolve button
 */
export const ResolveAction: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-resolve-test',
      uri: 'src/resolve-test.ts',
      range: {
        start: { line: 1, character: 0 },
        end: { line: 3, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-resolve-test',
          body: 'This issue needs to be resolved.',
          author: { type: 'human', name: 'Reviewer' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click the Resolve button
    const resolveButton = canvas.getByRole('button', {
      name: /mark thread as resolved/i,
    });
    await userEvent.click(resolveButton);

    // Verify the onResolve callback was called with the thread ID
    await expect(args.onResolve).toHaveBeenCalledWith('thread-resolve-test');
  },
};

/**
 * Tests that the Reply button is disabled when textarea is empty
 */
export const ReplyButtonDisabledWhenEmpty: Story = {
  args: {
    thread: createMockReviewThread({
      id: 'thread-disabled-test',
      uri: 'src/test.ts',
      range: {
        start: { line: 1, character: 0 },
        end: { line: 5, character: 0 },
      },
      status: 'open',
      annotations: [
        createMockAnnotation({
          id: 'annotation-disabled-test',
          body: 'Comment here.',
          author: { type: 'human', name: 'Reviewer' },
        }),
      ],
    }),
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the Reply button and verify it's disabled when textarea is empty
    const replyButton = canvas.getByRole('button', { name: /submit reply/i });
    await expect(replyButton).toBeDisabled();

    // Type something
    const replyInput = canvas.getByRole('textbox', {
      name: /reply to thread/i,
    });
    await userEvent.type(replyInput, 'Some text');

    // Now button should be enabled
    await expect(replyButton).toBeEnabled();

    // Clear the input
    await userEvent.clear(replyInput);

    // Button should be disabled again
    await expect(replyButton).toBeDisabled();
  },
};
