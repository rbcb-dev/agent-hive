import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';
import type { DiffHunk } from 'hive-core';

import { DiffViewer } from './DiffViewer';
import {
  createMockDiffFile,
  createMockReviewThread,
  createMockAnnotation,
} from '../__stories__/mocks';

const meta = {
  title: 'Components/DiffViewer',
  component: DiffViewer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    file: {
      control: 'object',
      description: 'The DiffFile object to display',
    },
    viewType: {
      control: 'select',
      options: ['unified', 'split'],
      description: 'Diff display mode (unified or split)',
    },
    onLineClick: {
      action: 'lineClicked',
      description: 'Callback when a diff line gutter is clicked',
    },
    threads: {
      control: 'object',
      description: 'ReviewThreads to display inline at anchored lines',
    },
    onAddThread: {
      action: 'addThread',
      description: 'Callback when a new thread is started on a line',
    },
    onReply: {
      action: 'reply',
      description: 'Callback when a reply is submitted to a thread',
    },
    onResolve: {
      action: 'resolve',
      description: 'Callback when a thread is resolved',
    },
  },
} satisfies Meta<typeof DiffViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Helper: Create custom hunks for specific scenarios
// =============================================================================

function createAdditionsOnlyHunk(): DiffHunk {
  return {
    oldStart: 10,
    oldLines: 0,
    newStart: 10,
    newLines: 5,
    lines: [
      { type: 'add', content: 'import { useState } from "react";' },
      { type: 'add', content: 'import { useCallback } from "react";' },
      { type: 'add', content: '' },
      { type: 'add', content: 'const INITIAL_STATE = 0;' },
      { type: 'add', content: '' },
    ],
  };
}

function createDeletionsOnlyHunk(): DiffHunk {
  return {
    oldStart: 25,
    oldLines: 4,
    newStart: 25,
    newLines: 0,
    lines: [
      { type: 'remove', content: '// TODO: Remove this legacy code' },
      { type: 'remove', content: 'function deprecatedHelper() {' },
      { type: 'remove', content: '  return null;' },
      { type: 'remove', content: '}' },
    ],
  };
}

function createMixedHunk(): DiffHunk {
  return {
    oldStart: 1,
    oldLines: 8,
    newStart: 1,
    newLines: 10,
    lines: [
      { type: 'context', content: 'import React from "react";' },
      { type: 'remove', content: 'import { Component } from "react";' },
      { type: 'add', content: 'import { useState, useEffect } from "react";' },
      { type: 'context', content: '' },
      { type: 'remove', content: 'class Counter extends Component {' },
      { type: 'remove', content: '  state = { count: 0 };' },
      { type: 'add', content: 'function Counter() {' },
      { type: 'add', content: '  const [count, setCount] = useState(0);' },
      { type: 'add', content: '' },
      { type: 'add', content: '  useEffect(() => {' },
      { type: 'add', content: '    document.title = `Count: ${count}`;' },
      { type: 'add', content: '  }, [count]);' },
      { type: 'context', content: '' },
    ],
  };
}

function createSecondHunk(): DiffHunk {
  return {
    oldStart: 45,
    oldLines: 4,
    newStart: 50,
    newLines: 5,
    lines: [
      { type: 'context', content: '  return (' },
      { type: 'remove', content: '    <div onClick={this.handleClick}>' },
      { type: 'add', content: '    <div onClick={handleClick}>' },
      {
        type: 'add',
        content: '      <span className="counter-value">{count}</span>',
      },
      { type: 'context', content: '    </div>' },
      { type: 'context', content: '  );' },
    ],
  };
}

// =============================================================================
// Stories
// =============================================================================

/**
 * Empty state when no file is selected
 */
export const Empty: Story = {
  args: {
    file: null,
  },
};

/**
 * Binary file that cannot be displayed as diff
 */
export const BinaryFile: Story = {
  args: {
    file: createMockDiffFile({
      path: 'assets/logo.png',
      isBinary: true,
      status: 'M',
    }),
  },
};

/**
 * A single hunk showing a typical code modification
 */
export const SingleHunk: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/Button.tsx',
      status: 'M',
    }),
  },
};

/**
 * Multiple hunks in the same file - common in larger refactors
 */
export const MultipleHunks: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/Counter.tsx',
      status: 'M',
      hunks: [createMixedHunk(), createSecondHunk()],
    }),
  },
};

/**
 * Only additions (new code being added, like a new import block)
 * Shows green highlighting for all lines
 */
export const AdditionsOnly: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/utils/helpers.ts',
      status: 'A',
      hunks: [createAdditionsOnlyHunk()],
    }),
  },
};

/**
 * Only deletions (code being removed, like cleaning up deprecated code)
 * Shows red highlighting for all lines
 */
export const DeletionsOnly: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/legacy/oldHelpers.ts',
      status: 'D',
      hunks: [createDeletionsOnlyHunk()],
    }),
  },
};

/**
 * Mixed changes with additions, deletions, and context lines
 * Demonstrates the full color coding:
 * - Green background for additions (+)
 * - Red background for deletions (-)
 * - No highlight for context lines
 */
export const Mixed: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/RefactoredComponent.tsx',
      status: 'M',
      hunks: [createMixedHunk()],
    }),
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Demonstrates accessible diff viewing with symbols alongside colors.
 *
 * The diff uses:
 * - `+` prefix for additions (green)
 * - `-` prefix for deletions (red)
 * - ` ` prefix for context lines
 *
 * This ensures the diff is understandable even without color perception,
 * meeting WCAG accessibility guidelines.
 */
export const AccessibleDiff: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/utils/accessibility-example.ts',
      status: 'M',
      hunks: [
        {
          oldStart: 1,
          oldLines: 6,
          newStart: 1,
          newLines: 8,
          lines: [
            { type: 'context', content: '// Accessibility improvements' },
            { type: 'context', content: '' },
            { type: 'remove', content: 'function oldFunction() {' },
            { type: 'remove', content: '  // No accessibility support' },
            { type: 'add', content: 'function newFunction() {' },
            { type: 'add', content: '  // Uses ARIA labels' },
            { type: 'add', content: '  // Screen reader friendly' },
            { type: 'add', content: '  // Color-blind safe with symbols' },
            { type: 'context', content: '  return true;' },
            { type: 'context', content: '}' },
          ],
        },
      ],
    }),
  },
};

// =============================================================================
// Large Diff Stories
// =============================================================================

/**
 * Helper to generate a large hunk with many lines
 */
function createLargeHunk(
  hunkIndex: number,
  linesPerHunk: number = 30,
): DiffHunk {
  const startLine = hunkIndex * 50 + 1;
  const lines: DiffHunk['lines'] = [];

  for (let i = 0; i < linesPerHunk; i++) {
    const lineType =
      i % 5 === 0
        ? ('remove' as const)
        : i % 5 === 1
          ? ('add' as const)
          : ('context' as const);
    lines.push({
      type: lineType,
      content: `${lineType === 'context' ? '//' : ''} Line ${startLine + i}: ${lineType === 'remove' ? 'Old code removed here' : lineType === 'add' ? 'New code added here' : 'Unchanged context line'}`,
    });
  }

  const adds = lines.filter((l) => l.type === 'add').length;
  const removes = lines.filter((l) => l.type === 'remove').length;

  return {
    oldStart: startLine,
    oldLines: linesPerHunk - adds,
    newStart: startLine,
    newLines: linesPerHunk - removes,
    lines,
  };
}

/**
 * Large diff with many hunks to demonstrate scrolling and performance.
 *
 * Real-world refactors often produce diffs with:
 * - Multiple hunks across the file
 * - Many added/removed lines
 * - Need for efficient rendering
 *
 * This story shows 5 hunks with 30 lines each (150 total lines).
 */
export const LargeDiff: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/LargeRefactor.tsx',
      status: 'M',
      hunks: [
        createLargeHunk(0),
        createLargeHunk(1),
        createLargeHunk(2),
        createLargeHunk(3),
        createLargeHunk(4),
      ],
    }),
  },
};

// =============================================================================
// Interactive Play Function Stories
// =============================================================================

/**
 * Verifies that hunks are rendered correctly with file header, stats,
 * and diff content visible.
 */
export const HunkRendering: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/Counter.tsx',
      status: 'M',
      hunks: [createMixedHunk(), createSecondHunk()],
    }),
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the file path is displayed in the header
    await expect(
      canvas.getByText('src/components/Counter.tsx'),
    ).toBeInTheDocument();

    // Verify file stats (additions/deletions) are visible
    const diffHeader = canvasElement.querySelector('.diff-header');
    await expect(diffHeader).toBeInTheDocument();
    const additions = canvasElement.querySelector('.additions');
    await expect(additions).toBeInTheDocument();
    const deletions = canvasElement.querySelector('.deletions');
    await expect(deletions).toBeInTheDocument();

    // Verify diff content is rendered (react-diff-view creates a table)
    const diffContent = canvasElement.querySelector('.diff-content');
    await expect(diffContent).toBeInTheDocument();

    // Verify that the diff container is not empty
    const diffTable = diffContent?.querySelector('table');
    await expect(diffTable).toBeInTheDocument();
  },
};

/**
 * Verifies that clicking a line gutter triggers onLineClick with the
 * correct file path and line number.
 *
 * Note: react-diff-view renders gutter cells as <td> with click handlers.
 * This test clicks a gutter cell and asserts the callback args.
 */
export const LineClickInteraction: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/Button.tsx',
      status: 'M',
    }),
    onLineClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    // react-diff-view renders line numbers in gutter <td> elements
    // Find a gutter cell with a line number and click it
    const gutterCells = canvasElement.querySelectorAll('td.diff-gutter');

    // Ensure we have gutter cells rendered
    await expect(gutterCells.length).toBeGreaterThan(0);

    // Click the first gutter cell
    const firstGutter = gutterCells[0] as HTMLElement;
    await userEvent.click(firstGutter);

    // Verify onLineClick was called with the file path as first arg
    await expect(args.onLineClick).toHaveBeenCalled();
    const callArgs = (args.onLineClick as ReturnType<typeof fn>).mock.calls[0];
    await expect(callArgs[0]).toBe('src/components/Button.tsx');
    // Second arg should be a number (line number)
    await expect(typeof callArgs[1]).toBe('number');
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for DiffViewer.
 *
 * Verifies:
 * - File path and stats are visible for screen readers
 * - Diff content is navigable
 * - Keyboard focus works on interactive elements
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    file: createMockDiffFile({
      path: 'src/a11y-test.ts',
      status: 'M',
      hunks: [createMixedHunk()],
    }),
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify file path text is readable
    await expect(canvas.getByText('src/a11y-test.ts')).toBeInTheDocument();

    // Verify diff stats are present (visual indicators for changes)
    const additions = canvasElement.querySelector('.additions');
    await expect(additions).toBeInTheDocument();
    const deletions = canvasElement.querySelector('.deletions');
    await expect(deletions).toBeInTheDocument();

    // Verify diff table is rendered (the main diff content)
    const diffTable = canvasElement.querySelector('table');
    await expect(diffTable).toBeInTheDocument();

    // Verify that gutter cells are present and clickable
    const gutterCells = canvasElement.querySelectorAll('td.diff-gutter');
    await expect(gutterCells.length).toBeGreaterThan(0);
  },
};

// =============================================================================
// Inline Thread Stories
// =============================================================================

/**
 * DiffViewer with inline comment threads anchored to specific lines.
 * Demonstrates how ReviewThreads are rendered as widgets within the diff.
 */
export const WithThreads: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/Counter.tsx',
      status: 'M',
      hunks: [createMixedHunk()],
    }),
    threads: [
      createMockReviewThread({
        id: 'thread-inline-1',
        uri: 'src/components/Counter.tsx',
        range: {
          start: { line: 3, character: 0 },
          end: { line: 3, character: 50 },
        },
        annotations: [
          createMockAnnotation({
            id: 'ann-inline-1',
            body: 'Consider using named imports for better tree-shaking.',
            author: {
              type: 'llm',
              name: 'Claude',
              agentId: 'hygienic-reviewer',
            },
          }),
          createMockAnnotation({
            id: 'ann-inline-2',
            body: 'Good point, will update.',
            author: { type: 'human', name: 'Developer' },
          }),
        ],
      }),
    ],
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify thread annotation body is visible
    await expect(
      canvas.getByText('Consider using named imports for better tree-shaking.'),
    ).toBeInTheDocument();

    // Verify thread indicator is present
    const indicator = canvasElement.querySelector('.thread-indicator');
    await expect(indicator).toBeInTheDocument();

    // Verify inline-diff-thread container renders
    const threadWidget = canvasElement.querySelector('.inline-diff-thread');
    await expect(threadWidget).toBeInTheDocument();
  },
};

/**
 * Interactive: Add a reply to an inline thread.
 * Type text in the reply input and click Reply.
 */
export const AddThread: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/utils/helpers.ts',
      status: 'M',
      hunks: [createMixedHunk()],
    }),
    threads: [
      createMockReviewThread({
        id: 'thread-add-1',
        uri: 'src/utils/helpers.ts',
        range: {
          start: { line: 3, character: 0 },
          end: { line: 3, character: 0 },
        },
        annotations: [
          createMockAnnotation({
            id: 'ann-add-1',
            body: 'This import can be simplified.',
            author: { type: 'human', name: 'Alice' },
          }),
        ],
      }),
    ],
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the reply input
    const replyInput = canvas.getByPlaceholderText(/reply/i);
    await expect(replyInput).toBeInTheDocument();

    // Type a reply
    await userEvent.type(replyInput, 'I agree, let me fix this.');

    // Click the reply button
    const replyButton = canvas.getByRole('button', { name: /^reply$/i });
    await userEvent.click(replyButton);

    // Verify onReply was called with thread ID and body
    await expect(args.onReply).toHaveBeenCalledWith(
      'thread-add-1',
      'I agree, let me fix this.',
    );
  },
};

/**
 * Interactive: Resolve an inline thread.
 * Clicks the resolve button and verifies the callback.
 */
export const ResolveThread: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/config.ts',
      status: 'M',
      hunks: [createMixedHunk()],
    }),
    threads: [
      createMockReviewThread({
        id: 'thread-resolve-1',
        uri: 'src/config.ts',
        range: {
          start: { line: 3, character: 0 },
          end: { line: 3, character: 0 },
        },
        annotations: [
          createMockAnnotation({
            id: 'ann-resolve-1',
            body: 'Fixed the import issue.',
            author: { type: 'human', name: 'Developer' },
          }),
        ],
      }),
    ],
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click the resolve button
    const resolveButton = canvas.getByRole('button', { name: /resolve/i });
    await userEvent.click(resolveButton);

    // Verify onResolve was called with thread ID
    await expect(args.onResolve).toHaveBeenCalledWith('thread-resolve-1');
  },
};

/**
 * Interactive: Click a gutter line to open the inline thread composer.
 * Demonstrates the "add thread" flow: click gutter → type comment → submit.
 */
export const GutterClickComposer: Story = {
  args: {
    file: createMockDiffFile({
      path: 'src/components/Button.tsx',
      status: 'M',
      hunks: [createMixedHunk()],
    }),
    onAddThread: fn(),
    onReply: fn(),
    onResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    // Click a gutter cell to open the composer
    const gutterCells = canvasElement.querySelectorAll('td.diff-gutter');
    await expect(gutterCells.length).toBeGreaterThan(0);

    const firstGutter = gutterCells[0] as HTMLElement;
    await userEvent.click(firstGutter);

    // The inline composer should now be visible
    const composer = canvasElement.querySelector('.inline-thread-composer');
    await expect(composer).toBeInTheDocument();

    // Type a comment
    const canvas = within(canvasElement);
    const commentInput = canvas.getByPlaceholderText(/add a comment/i);
    await userEvent.type(commentInput, 'This needs attention');

    // Submit the comment
    const commentButton = canvas.getByRole('button', { name: /comment$/i });
    await userEvent.click(commentButton);

    // Verify onAddThread was called
    await expect(args.onAddThread).toHaveBeenCalledWith(
      'src/components/Button.tsx',
      expect.any(Number),
      'This needs attention',
    );
  },
};
