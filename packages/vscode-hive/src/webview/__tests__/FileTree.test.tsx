/**
 * Tests for FileTree component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileTree } from '../components/FileTree';
import type { FileTreeItem } from '../types';

describe('FileTree', () => {
  const mockFiles: FileTreeItem[] = [
    { path: 'src/app.ts', name: 'app.ts', status: 'M', commentCount: 2, additions: 10, deletions: 5 },
    { path: 'src/utils.ts', name: 'utils.ts', status: 'A', commentCount: 0, additions: 50, deletions: 0 },
    { path: 'src/old.ts', name: 'old.ts', status: 'D', commentCount: 1, additions: 0, deletions: 30 },
  ];

  it('renders all files', () => {
    render(
      <FileTree
        files={mockFiles}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    expect(screen.getByText('app.ts')).toBeInTheDocument();
    expect(screen.getByText('utils.ts')).toBeInTheDocument();
    expect(screen.getByText('old.ts')).toBeInTheDocument();
  });

  it('displays file status indicators', () => {
    render(
      <FileTree
        files={mockFiles}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Status badges should show M, A, D
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('displays comment counts for files with comments', () => {
    render(
      <FileTree
        files={mockFiles}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Should show comment counts: 2 and 1
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('highlights the selected file', () => {
    render(
      <FileTree
        files={mockFiles}
        selectedFile="src/app.ts"
        onSelectFile={() => {}}
      />
    );

    const appItem = screen.getByText('app.ts').closest('.file-tree-item');
    expect(appItem).toHaveClass('selected');
  });

  it('calls onSelectFile when file is clicked', () => {
    const onSelectFile = vi.fn();
    render(
      <FileTree
        files={mockFiles}
        selectedFile={null}
        onSelectFile={onSelectFile}
      />
    );

    fireEvent.click(screen.getByText('utils.ts'));
    expect(onSelectFile).toHaveBeenCalledWith('src/utils.ts');
  });

  it('displays additions and deletions', () => {
    render(
      <FileTree
        files={mockFiles}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // app.ts has +10 -5
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('renders empty state when no files', () => {
    render(
      <FileTree
        files={[]}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    expect(screen.getByText('No files to review')).toBeInTheDocument();
  });
});
