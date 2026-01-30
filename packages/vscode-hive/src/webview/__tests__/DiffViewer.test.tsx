/**
 * Tests for DiffViewer component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffViewer } from '../components/DiffViewer';
import type { DiffFile } from 'hive-core';

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

  it('renders file path', () => {
    render(
      <DiffViewer file={mockFile} />
    );

    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
  });

  it('renders context lines', () => {
    render(
      <DiffViewer file={mockFile} />
    );

    expect(screen.getByText('import React from "react";')).toBeInTheDocument();
  });

  it('renders removed lines with proper styling', () => {
    render(
      <DiffViewer file={mockFile} />
    );

    const removedLine = screen.getByText('const oldVar = 1;');
    expect(removedLine.closest('.diff-line')).toHaveClass('line-remove');
  });

  it('renders added lines with proper styling', () => {
    render(
      <DiffViewer file={mockFile} />
    );

    const addedLine = screen.getByText('const newVar = 2;');
    expect(addedLine.closest('.diff-line')).toHaveClass('line-add');
  });

  it('displays file stats', () => {
    render(
      <DiffViewer file={mockFile} />
    );

    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('renders empty state when no file selected', () => {
    render(
      <DiffViewer file={null} />
    );

    expect(screen.getByText('Select a file to view diff')).toBeInTheDocument();
  });

  it('shows binary file message for binary files', () => {
    const binaryFile: DiffFile = {
      ...mockFile,
      isBinary: true,
      hunks: [],
    };
    render(
      <DiffViewer file={binaryFile} />
    );

    expect(screen.getByText(/binary file/i)).toBeInTheDocument();
  });
});
