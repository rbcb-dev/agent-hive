/**
 * Tests for FileNavigator component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileNavigator } from '../components/FileNavigator';
import type { ReviewThread } from 'hive-core';

describe('FileNavigator', () => {
  const mockFiles = [
    'src/components/Button.tsx',
    'src/components/Input.tsx',
    'src/utils/helpers.ts',
    'src/index.ts',
    'README.md',
  ];

  const mockThreads: ReviewThread[] = [
    {
      id: 'thread-1',
      entityId: 'entity-1',
      uri: 'src/components/Button.tsx',
      range: { start: { line: 10, character: 0 }, end: { line: 15, character: 0 } },
      status: 'open',
      annotations: [{ id: 'ann-1', type: 'comment', author: { type: 'human', name: 'user' }, body: 'Test comment', createdAt: '2026-01-30T00:00:00Z', updatedAt: '2026-01-30T00:00:00Z' }],
      createdAt: '2026-01-30T00:00:00Z',
      updatedAt: '2026-01-30T00:00:00Z',
    },
    {
      id: 'thread-2',
      entityId: 'entity-1',
      uri: 'src/components/Button.tsx',
      range: { start: { line: 20, character: 0 }, end: { line: 25, character: 0 } },
      status: 'open',
      annotations: [{ id: 'ann-2', type: 'comment', author: { type: 'human', name: 'user' }, body: 'Another comment', createdAt: '2026-01-30T00:00:00Z', updatedAt: '2026-01-30T00:00:00Z' }],
      createdAt: '2026-01-30T00:00:00Z',
      updatedAt: '2026-01-30T00:00:00Z',
    },
    {
      id: 'thread-3',
      entityId: 'entity-1',
      uri: 'src/utils/helpers.ts',
      range: { start: { line: 5, character: 0 }, end: { line: 10, character: 0 } },
      status: 'resolved',
      annotations: [{ id: 'ann-3', type: 'comment', author: { type: 'human', name: 'user' }, body: 'Resolved comment', createdAt: '2026-01-30T00:00:00Z', updatedAt: '2026-01-30T00:00:00Z' }],
      createdAt: '2026-01-30T00:00:00Z',
      updatedAt: '2026-01-30T00:00:00Z',
    },
  ];

  it('renders file tree with folder structure', () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Should show folder nodes
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('components')).toBeInTheDocument();
    expect(screen.getByText('utils')).toBeInTheDocument();

    // Should show file names
    expect(screen.getByText('Button.tsx')).toBeInTheDocument();
    expect(screen.getByText('Input.tsx')).toBeInTheDocument();
    expect(screen.getByText('helpers.ts')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('shows thread count badges per file', () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={mockThreads}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Button.tsx has 2 threads
    const buttonItem = screen.getByText('Button.tsx').closest('[data-testid="file-item"]');
    expect(buttonItem).toBeInTheDocument();
    const buttonBadge = buttonItem?.querySelector('[data-testid="thread-count"]');
    expect(buttonBadge).toHaveTextContent('2');

    // helpers.ts has 1 thread
    const helpersItem = screen.getByText('helpers.ts').closest('[data-testid="file-item"]');
    const helpersBadge = helpersItem?.querySelector('[data-testid="thread-count"]');
    expect(helpersBadge).toHaveTextContent('1');

    // Input.tsx has no threads - no badge
    const inputItem = screen.getByText('Input.tsx').closest('[data-testid="file-item"]');
    const inputBadge = inputItem?.querySelector('[data-testid="thread-count"]');
    expect(inputBadge).not.toBeInTheDocument();
  });

  it('calls onSelectFile with full path when file is clicked', () => {
    const onSelectFile = vi.fn();
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={onSelectFile}
      />
    );

    fireEvent.click(screen.getByText('Button.tsx'));
    expect(onSelectFile).toHaveBeenCalledWith('src/components/Button.tsx');
  });

  it('highlights currently selected file', () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile="src/components/Button.tsx"
        onSelectFile={() => {}}
      />
    );

    const buttonItem = screen.getByText('Button.tsx').closest('[data-testid="file-item"]');
    expect(buttonItem).toHaveClass('selected');
  });

  it('does not highlight non-selected files', () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile="src/components/Button.tsx"
        onSelectFile={() => {}}
      />
    );

    const inputItem = screen.getByText('Input.tsx').closest('[data-testid="file-item"]');
    expect(inputItem).not.toHaveClass('selected');
  });

  it('renders empty state when no files', () => {
    render(
      <FileNavigator
        files={[]}
        threads={[]}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    expect(screen.getByText('No files in review scope')).toBeInTheDocument();
  });

  it('supports keyboard navigation with Enter key', () => {
    const onSelectFile = vi.fn();
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={onSelectFile}
      />
    );

    const buttonItem = screen.getByText('Button.tsx').closest('[data-testid="file-item"]');
    fireEvent.keyDown(buttonItem!, { key: 'Enter' });
    expect(onSelectFile).toHaveBeenCalledWith('src/components/Button.tsx');
  });

  it('expands and collapses folders', () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Initially all folders should be expanded (showing files)
    expect(screen.getByText('Button.tsx')).toBeVisible();

    // Click on the folder to collapse
    const componentsFolder = screen.getByText('components').closest('[data-testid="folder-node"]');
    fireEvent.click(componentsFolder!);

    // Files should be hidden after collapse
    expect(screen.queryByText('Button.tsx')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(componentsFolder!);
    expect(screen.getByText('Button.tsx')).toBeVisible();
  });

  it('maintains folder expansion state when switching files', () => {
    const { rerender } = render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Collapse the components folder
    const componentsFolder = screen.getByText('components').closest('[data-testid="folder-node"]');
    fireEvent.click(componentsFolder!);

    // Change selected file
    rerender(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile="src/utils/helpers.ts"
        onSelectFile={() => {}}
      />
    );

    // components folder should still be collapsed
    expect(screen.queryByText('Button.tsx')).not.toBeInTheDocument();
    // helpers.ts should still be visible
    expect(screen.getByText('helpers.ts')).toBeInTheDocument();
  });
});
