import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { InlineThread } from './InlineThread';
import {
  createMockReviewThread,
  createMockAnnotation,
} from '../__stories__/mocks';

const meta = {
  title: 'Components/InlineThread',
  component: InlineThread,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
InlineThread displays a review thread inline below a code line.
It shows annotations, allows replying, and supports resolving threads.

**Features:**
- Displays thread annotations with author info
- Shows AI badge for LLM authors
- Reply input with Cmd+Enter shortcut
- Resolve button for open threads
- Close button to dismiss the inline view
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    thread: {
      description: 'The ReviewThread to display',
    },
    onReply: {
      description: 'Called when user submits a reply',
    },
    onResolve: {
      description: 'Called when user resolves the thread',
    },
    onClose: {
      description: 'Called when user closes the inline view',
    },
  },
} satisfies Meta<typeof InlineThread>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create reusable mock data
const singleAnnotationThread = createMockReviewThread({
  id: 'thread-default',
  uri: 'src/components/Example.tsx',
  range: { start: { line: 10, character: 0 }, end: { line: 10, character: 50 } },
  annotations: [
    createMockAnnotation({
      id: 'ann-1',
      body: 'Consider extracting this logic into a separate function for better testability.',
      author: { type: 'human', name: 'Alice' },
    }),
  ],
});

const threadWithReplies = createMockReviewThread({
  id: 'thread-replies',
  uri: 'src/utils/parser.ts',
  range: { start: { line: 25, character: 0 }, end: { line: 30, character: 0 } },
  annotations: [
    createMockAnnotation({
      id: 'ann-1',
      body: 'This function could benefit from better error handling.',
      author: { type: 'human', name: 'Alice' },
    }),
    createMockAnnotation({
      id: 'ann-2',
      body: 'I agree. I suggest wrapping the parse call in a try-catch and returning a Result type instead of throwing.',
      author: { type: 'llm', name: 'Claude', agentId: 'hygienic-reviewer' },
    }),
    createMockAnnotation({
      id: 'ann-3',
      body: 'Good idea! I\'ll implement that in the next iteration.',
      author: { type: 'human', name: 'Bob' },
    }),
  ],
});

const resolvedThread = createMockReviewThread({
  id: 'thread-resolved',
  status: 'resolved',
  uri: 'src/index.ts',
  annotations: [
    createMockAnnotation({
      id: 'ann-1',
      body: 'Missing export for the main function.',
      author: { type: 'human', name: 'Reviewer' },
    }),
    createMockAnnotation({
      id: 'ann-2',
      body: 'Fixed - added the export.',
      author: { type: 'human', name: 'Developer' },
    }),
  ],
});

const threadWithSuggestion = createMockReviewThread({
  id: 'thread-suggestion',
  uri: 'src/config.ts',
  range: { start: { line: 5, character: 0 }, end: { line: 5, character: 20 } },
  annotations: [
    createMockAnnotation({
      id: 'ann-1',
      type: 'suggestion',
      body: 'Use const instead of let for immutable values.',
      author: { type: 'llm', name: 'Claude', agentId: 'hygienic-reviewer' },
      suggestion: { replacement: 'const config = { debug: false };' },
    }),
  ],
});

/**
 * Default inline thread with a single annotation
 */
export const Default: Story = {
  args: {
    thread: singleAnnotationThread,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
};

/**
 * Thread with multiple replies showing a conversation
 */
export const WithReplies: Story = {
  args: {
    thread: threadWithReplies,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a thread with multiple annotations forming a conversation. Note the AI badge on the LLM author.',
      },
    },
  },
};

/**
 * Resolved thread - resolve button is hidden
 */
export const Resolved: Story = {
  args: {
    thread: resolvedThread,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'A resolved thread shows a "Resolved" status and hides the resolve button.',
      },
    },
  },
};

/**
 * Thread with a code suggestion
 */
export const WithSuggestion: Story = {
  args: {
    thread: threadWithSuggestion,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Annotations of type "suggestion" display the proposed code replacement.',
      },
    },
  },
};

/**
 * Interactive test - clicking close button
 */
export const CloseInteraction: Story = {
  args: {
    thread: singleAnnotationThread,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click the close button
    const closeButton = canvas.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    // Verify callback was called
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

/**
 * Interactive test - resolve button functionality
 */
export const ResolveInteraction: Story = {
  args: {
    thread: singleAnnotationThread,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click the resolve button
    const resolveButton = canvas.getByRole('button', { name: /resolve/i });
    await userEvent.click(resolveButton);

    // Verify callback was called with thread ID
    await expect(args.onResolve).toHaveBeenCalledWith('thread-default');
  },
};

/**
 * Interactive test - reply flow (type text, click reply)
 */
export const ReplyInteraction: Story = {
  args: {
    thread: singleAnnotationThread,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the reply input
    const replyInput = canvas.getByPlaceholderText(/reply/i);
    
    // Type a reply
    await userEvent.type(replyInput, 'Thanks for the feedback, I\'ll update this.');

    // Click the reply button
    const replyButton = canvas.getByRole('button', { name: /^reply$/i });
    await userEvent.click(replyButton);

    // Verify callback was called with thread ID and reply text
    await expect(args.onReply).toHaveBeenCalledWith(
      'thread-default',
      'Thanks for the feedback, I\'ll update this.'
    );

    // Verify input was cleared after reply
    await expect(replyInput).toHaveValue('');
  },
};

/**
 * Interactive test - reply button is disabled when input is empty
 */
export const ReplyButtonDisabled: Story = {
  args: {
    thread: singleAnnotationThread,
    onReply: fn(),
    onResolve: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Reply button should be disabled initially
    const replyButton = canvas.getByRole('button', { name: /^reply$/i });
    await expect(replyButton).toBeDisabled();

    // Type something
    const replyInput = canvas.getByPlaceholderText(/reply/i);
    await userEvent.type(replyInput, 'test');

    // Button should now be enabled
    await expect(replyButton).not.toBeDisabled();

    // Clear the input
    await userEvent.clear(replyInput);

    // Button should be disabled again
    await expect(replyButton).toBeDisabled();
  },
};
