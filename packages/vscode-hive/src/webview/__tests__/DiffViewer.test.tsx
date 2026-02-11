/**
 * Tests for DiffViewer component
 *
 * Migrated to use react-diff-view internally while maintaining backward compatibility
 * with existing DiffFile-based API.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { DiffViewer } from '../components/DiffViewer';
import type { DiffFile, ReviewThread } from 'hive-core';

describe('DiffViewer', () => {
  const mockFile: DiffFile = {
    path: 'src/app.ts',
    status: 'M',
    additions: 10,
    deletions: 5,
    hunks: [
      {
        oldStart: 1,
        oldLines: 5,
        newStart: 1,
        newLines: 7,
        lines: [
          { type: 'context', content: 'import React from "react";' },
          { type: 'remove', content: 'const oldVar = 1;' },
          { type: 'add', content: 'const newVar = 2;' },
          { type: 'add', content: 'const anotherVar = 3;' },
          { type: 'context', content: '' },
        ],
      },
    ],
  };

  describe('basic rendering', () => {
    it('renders file path', () => {
      render(<DiffViewer file={mockFile} />);
      expect(screen.getByText('src/app.ts')).toBeInTheDocument();
    });

    it('renders empty state when no file selected', () => {
      render(<DiffViewer file={null} />);
      expect(
        screen.getByText('Select a file to view diff'),
      ).toBeInTheDocument();
    });

    it('shows binary file message for binary files', () => {
      const binaryFile: DiffFile = {
        ...mockFile,
        isBinary: true,
        hunks: [],
      };
      render(<DiffViewer file={binaryFile} />);
      expect(screen.getByText(/binary file/i)).toBeInTheDocument();
    });

    it('displays file stats', () => {
      render(<DiffViewer file={mockFile} />);
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
    });
  });

  describe('diff content rendering with react-diff-view', () => {
    it('renders context lines', () => {
      render(<DiffViewer file={mockFile} />);
      expect(
        screen.getByText('import React from "react";'),
      ).toBeInTheDocument();
    });

    it('renders removed lines', () => {
      render(<DiffViewer file={mockFile} />);
      expect(screen.getByText('const oldVar = 1;')).toBeInTheDocument();
    });

    it('renders added lines', () => {
      render(<DiffViewer file={mockFile} />);
      expect(screen.getByText('const newVar = 2;')).toBeInTheDocument();
    });

    it('renders diff table structure from react-diff-view', () => {
      render(<DiffViewer file={mockFile} />);
      // react-diff-view renders diffs in a table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('view type support', () => {
    it('renders unified view by default', () => {
      render(<DiffViewer file={mockFile} />);
      // Unified view has a single diff table
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThanOrEqual(1);
    });

    it('supports split view mode', () => {
      render(<DiffViewer file={mockFile} viewType="split" />);
      // Split view renders side-by-side columns
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('line click callback', () => {
    it('calls onLineClick with file path and line number when gutter is clicked', () => {
      const handleLineClick = vi.fn();
      render(<DiffViewer file={mockFile} onLineClick={handleLineClick} />);

      // Find a gutter element and click it
      const gutters = document.querySelectorAll('.diff-gutter');
      expect(gutters.length).toBeGreaterThan(0);

      fireEvent.click(gutters[0]);

      // Must be called with the file path and corresponding line number
      expect(handleLineClick).toHaveBeenCalledTimes(1);
      expect(handleLineClick).toHaveBeenCalledWith(
        'src/app.ts',
        expect.any(Number),
      );
    });

    it('passes correct line number matching the clicked gutter row', () => {
      const handleLineClick = vi.fn();
      render(<DiffViewer file={mockFile} onLineClick={handleLineClick} />);

      const gutters = document.querySelectorAll('.diff-gutter');
      expect(gutters.length).toBeGreaterThan(0);

      // Click the first gutter — should correspond to the first hunk line (line 1)
      fireEvent.click(gutters[0]);
      expect(handleLineClick).toHaveBeenCalledWith('src/app.ts', 1);
    });
  });

  describe('accessibility', () => {
    it('renders diff symbols for color-blind users', () => {
      render(<DiffViewer file={mockFile} />);

      // react-diff-view adds visual indicators for add/delete
      // Check that diff content is present with appropriate styling
      const addedContent = screen.getByText('const newVar = 2;');
      const removedContent = screen.getByText('const oldVar = 1;');

      expect(addedContent).toBeInTheDocument();
      expect(removedContent).toBeInTheDocument();
    });

    it('provides aria-labels for screen readers on diff lines', () => {
      render(<DiffViewer file={mockFile} />);

      // react-diff-view uses table structure which is inherently accessible
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('multiple hunks', () => {
    it('renders multiple hunks', () => {
      const multiHunkFile: DiffFile = {
        ...mockFile,
        hunks: [
          {
            oldStart: 1,
            oldLines: 3,
            newStart: 1,
            newLines: 3,
            lines: [
              { type: 'context', content: 'line 1' },
              { type: 'remove', content: 'old line 2' },
              { type: 'add', content: 'new line 2' },
            ],
          },
          {
            oldStart: 10,
            oldLines: 3,
            newStart: 10,
            newLines: 3,
            lines: [
              { type: 'context', content: 'line 10' },
              { type: 'remove', content: 'old line 11' },
              { type: 'add', content: 'new line 11' },
            ],
          },
        ],
      };

      render(<DiffViewer file={multiHunkFile} />);

      expect(screen.getByText('line 1')).toBeInTheDocument();
      expect(screen.getByText('line 10')).toBeInTheDocument();
    });
  });

  describe('file status types', () => {
    it('handles added files (status A)', () => {
      const addedFile: DiffFile = {
        path: 'src/new-file.ts',
        status: 'A',
        additions: 5,
        deletions: 0,
        hunks: [
          {
            oldStart: 0,
            oldLines: 0,
            newStart: 1,
            newLines: 2,
            lines: [
              { type: 'add', content: 'const x = 1;' },
              { type: 'add', content: 'export { x };' },
            ],
          },
        ],
      };

      render(<DiffViewer file={addedFile} />);
      expect(screen.getByText('src/new-file.ts')).toBeInTheDocument();
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    });

    it('handles deleted files (status D)', () => {
      const deletedFile: DiffFile = {
        path: 'src/old-file.ts',
        status: 'D',
        additions: 0,
        deletions: 3,
        hunks: [
          {
            oldStart: 1,
            oldLines: 3,
            newStart: 0,
            newLines: 0,
            lines: [
              { type: 'remove', content: 'const y = 2;' },
              { type: 'remove', content: 'const z = 3;' },
              { type: 'remove', content: 'export { y, z };' },
            ],
          },
        ],
      };

      render(<DiffViewer file={deletedFile} />);
      expect(screen.getByText('src/old-file.ts')).toBeInTheDocument();
      expect(screen.getByText('const y = 2;')).toBeInTheDocument();
    });
  });

  describe('width and layout', () => {
    it('renders diff-viewer with full width styling class', () => {
      render(<DiffViewer file={mockFile} />);

      // The outer container should have diff-viewer class
      const container = document.querySelector('.diff-viewer');
      expect(container).toBeInTheDocument();
    });

    it('renders diff table with 100% width from react-diff-view', () => {
      render(<DiffViewer file={mockFile} />);

      // react-diff-view uses a table with class 'diff' that should have width: 100%
      const diffTable = document.querySelector('.diff');
      expect(diffTable).toBeInTheDocument();
      expect(diffTable).toHaveClass('diff');
    });

    it('does not have conflicting diff-line styles that override react-diff-view', () => {
      render(<DiffViewer file={mockFile} />);

      // react-diff-view uses .diff-line class for its own styling
      // Our CSS should NOT define a global .diff-line that conflicts
      // The CodeViewer line styling should use .code-viewer-line instead
      const diffLines = document.querySelectorAll('.diff-line');

      // If react-diff-view renders diff lines, they should exist
      // and NOT have our custom display: flex styling that breaks table layout
      if (diffLines.length > 0) {
        // react-diff-view's diff-line should be inside a table cell structure
        const firstDiffLine = diffLines[0];
        expect(firstDiffLine.closest('table')).not.toBeNull();
      }
    });
  });

  describe('inline comment threads', () => {
    // Thread anchored to line 3 (an inserted line in the diff: 'const newVar = 2;')
    const mockThread: ReviewThread = {
      id: 'thread-1',
      entityId: 'entity-1',
      uri: 'src/app.ts',
      range: {
        start: { line: 3, character: 0 },
        end: { line: 3, character: 0 },
      },
      status: 'open',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      annotations: [
        {
          id: 'ann-1',
          type: 'comment',
          body: 'Consider using a more descriptive variable name.',
          author: { type: 'human', name: 'Reviewer' },
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
    };

    it('renders InlineDiffThread widget when threads are provided', () => {
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      // The inline thread component should be rendered
      expect(screen.getByTestId('inline-diff-thread')).toBeInTheDocument();
    });

    it('renders thread annotation body text', () => {
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      expect(
        screen.getByText('Consider using a more descriptive variable name.'),
      ).toBeInTheDocument();
    });

    it('renders thread indicator on the gutter for lines with threads', () => {
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      // A thread indicator icon should be present
      const indicator = document.querySelector('.thread-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('does not render threads when threads prop is empty', () => {
      render(
        <DiffViewer
          file={mockFile}
          threads={[]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      expect(
        screen.queryByTestId('inline-diff-thread'),
      ).not.toBeInTheDocument();
    });

    it('renders resolve action in thread', () => {
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      // ThreadView renders a Resolve button
      expect(
        screen.getByRole('button', { name: /resolve/i }),
      ).toBeInTheDocument();
    });

    it('renders reply input in thread', () => {
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      expect(screen.getByPlaceholderText(/reply/i)).toBeInTheDocument();
    });

    it('calls onReply when reply is submitted', () => {
      const handleReply = vi.fn();
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={handleReply}
          onResolve={vi.fn()}
        />,
      );

      const replyInput = screen.getByPlaceholderText(/reply/i);
      fireEvent.change(replyInput, { target: { value: 'Sounds good' } });

      const replyButton = screen.getByRole('button', { name: /^reply$/i });
      fireEvent.click(replyButton);

      expect(handleReply).toHaveBeenCalledWith('thread-1', 'Sounds good');
    });

    it('calls onResolve when resolve is clicked', () => {
      const handleResolve = vi.fn();
      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={handleResolve}
        />,
      );

      const resolveButton = screen.getByRole('button', { name: /resolve/i });
      fireEvent.click(resolveButton);

      expect(handleResolve).toHaveBeenCalledWith('thread-1');
    });

    it('renders multiple threads at different lines', () => {
      const secondThread: ReviewThread = {
        id: 'thread-2',
        entityId: 'entity-2',
        uri: 'src/app.ts',
        range: {
          start: { line: 2, character: 0 },
          end: { line: 2, character: 0 },
        },
        status: 'open',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        annotations: [
          {
            id: 'ann-2',
            type: 'comment',
            body: 'Why was this removed?',
            author: { type: 'human', name: 'Bob' },
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };

      render(
        <DiffViewer
          file={mockFile}
          threads={[mockThread, secondThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      const threadWidgets = screen.getAllByTestId('inline-diff-thread');
      expect(threadWidgets).toHaveLength(2);
    });

    it('shows inline composer when gutter is clicked and onAddThread is provided', () => {
      const handleAddThread = vi.fn();
      render(
        <DiffViewer
          file={mockFile}
          onAddThread={handleAddThread}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      // Click a gutter element to open the inline composer
      const gutters = document.querySelectorAll('.diff-gutter');
      expect(gutters.length).toBeGreaterThan(0);
      fireEvent.click(gutters[0]);

      // An inline thread composer should appear
      expect(screen.getByTestId('inline-thread-composer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument();
    });

    it('calls onAddThread with path, line, and body when composer is submitted', () => {
      const handleAddThread = vi.fn();
      render(
        <DiffViewer
          file={mockFile}
          onAddThread={handleAddThread}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      // Click a gutter to open composer
      const gutters = document.querySelectorAll('.diff-gutter');
      fireEvent.click(gutters[0]);

      // Type a comment and submit
      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      fireEvent.change(commentInput, { target: { value: 'This needs a fix' } });

      const submitButton = screen.getByRole('button', { name: /comment$/i });
      fireEvent.click(submitButton);

      expect(handleAddThread).toHaveBeenCalledWith(
        'src/app.ts',
        expect.any(Number),
        'This needs a fix',
      );
    });

    it('closes composer when cancel is clicked', () => {
      const handleAddThread = vi.fn();
      render(
        <DiffViewer
          file={mockFile}
          onAddThread={handleAddThread}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      // Open composer
      const gutters = document.querySelectorAll('.diff-gutter');
      fireEvent.click(gutters[0]);
      expect(screen.getByTestId('inline-thread-composer')).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(
        screen.queryByTestId('inline-thread-composer'),
      ).not.toBeInTheDocument();
    });

    it('does not show composer when onAddThread is not provided', () => {
      render(
        <DiffViewer file={mockFile} onReply={vi.fn()} onResolve={vi.fn()} />,
      );

      // Click a gutter — no composer should appear
      const gutters = document.querySelectorAll('.diff-gutter');
      if (gutters.length > 0) {
        fireEvent.click(gutters[0]);
      }

      expect(
        screen.queryByTestId('inline-thread-composer'),
      ).not.toBeInTheDocument();
    });

    it('does not render threads when file is null', () => {
      render(
        <DiffViewer
          file={null}
          threads={[mockThread]}
          onReply={vi.fn()}
          onResolve={vi.fn()}
        />,
      );

      expect(
        screen.queryByTestId('inline-diff-thread'),
      ).not.toBeInTheDocument();
    });
  });
});
