import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DiffHunk } from 'hive-core';

import { DiffViewer } from './DiffViewer';
import { createMockDiffFile } from '../__stories__/mocks';

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
      { type: 'add', content: '      <span className="counter-value">{count}</span>' },
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
