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
function createLargeHunk(hunkIndex: number, linesPerHunk: number = 30): DiffHunk {
  const startLine = hunkIndex * 50 + 1;
  const lines: DiffHunk['lines'] = [];
  
  for (let i = 0; i < linesPerHunk; i++) {
    const lineType = i % 5 === 0 ? 'remove' as const : 
                     i % 5 === 1 ? 'add' as const : 
                     'context' as const;
    lines.push({
      type: lineType,
      content: `${lineType === 'context' ? '//' : ''} Line ${startLine + i}: ${lineType === 'remove' ? 'Old code removed here' : lineType === 'add' ? 'New code added here' : 'Unchanged context line'}`,
    });
  }
  
  const adds = lines.filter(l => l.type === 'add').length;
  const removes = lines.filter(l => l.type === 'remove').length;
  
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
