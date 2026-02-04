/**
 * Tests for FileNavigator component
 * 
 * Uses antd Tree with virtual scrolling and custom title rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from './test-utils';
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

    // Button.tsx has 2 threads - look for badge text in same node
    const buttonNode = screen.getByText('Button.tsx').closest('.file-node');
    expect(buttonNode).toBeInTheDocument();
    const buttonBadge = within(buttonNode as HTMLElement).getByTestId('thread-count');
    expect(buttonBadge).toHaveTextContent('(2)');

    // helpers.ts has 1 thread
    const helpersNode = screen.getByText('helpers.ts').closest('.file-node');
    const helpersBadge = within(helpersNode as HTMLElement).getByTestId('thread-count');
    expect(helpersBadge).toHaveTextContent('(1)');

    // Input.tsx has no threads - no badge
    const inputNode = screen.getByText('Input.tsx').closest('.file-node');
    expect(within(inputNode as HTMLElement).queryByTestId('thread-count')).not.toBeInTheDocument();
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

    // Click on the file name text
    fireEvent.click(screen.getByText('Button.tsx'));
    expect(onSelectFile).toHaveBeenCalledWith('src/components/Button.tsx');
  });

  it('highlights currently selected file via antd Tree selectedKeys', () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile="src/components/Button.tsx"
        onSelectFile={() => {}}
      />
    );

    // antd Tree marks selected nodes with ant-tree-treenode-selected class
    const buttonText = screen.getByText('Button.tsx');
    const treeNode = buttonText.closest('.ant-tree-treenode');
    expect(treeNode).toHaveClass('ant-tree-treenode-selected');
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

    const inputText = screen.getByText('Input.tsx');
    const treeNode = inputText.closest('.ant-tree-treenode');
    expect(treeNode).not.toHaveClass('ant-tree-treenode-selected');
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

  it('supports keyboard navigation with Enter key on files', () => {
    const onSelectFile = vi.fn();
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={onSelectFile}
      />
    );

    // Find the file node and trigger keyboard event on it
    const buttonText = screen.getByText('Button.tsx');
    const fileNode = buttonText.closest('.file-node');
    fireEvent.keyDown(fileNode!, { key: 'Enter' });
    expect(onSelectFile).toHaveBeenCalledWith('src/components/Button.tsx');
  });

  it('expands and collapses folders', async () => {
    render(
      <FileNavigator
        files={mockFiles}
        threads={[]}
        selectedFile={null}
        onSelectFile={() => {}}
      />
    );

    // Initially all folders should be expanded (showing files)
    expect(screen.getByText('Button.tsx')).toBeInTheDocument();

    // Find the components folder's switcher (expand/collapse icon)
    const componentsText = screen.getByText('components');
    const componentsTreeNode = componentsText.closest('.ant-tree-treenode');
    const switcherIcon = componentsTreeNode?.querySelector('.ant-tree-switcher');
    
    // Click to collapse
    fireEvent.click(switcherIcon!);

    // Files inside components should be hidden after collapse
    await waitFor(() => {
      expect(screen.queryByText('Button.tsx')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Input.tsx')).not.toBeInTheDocument();

    // The folder node should now have collapsed state
    expect(componentsTreeNode).toHaveClass('ant-tree-treenode-switcher-close');

    // Click again to expand - need to re-query since DOM has changed
    const expandedComponentsText = screen.getByText('components');
    const expandSwitcher = expandedComponentsText.closest('.ant-tree-treenode')?.querySelector('.ant-tree-switcher');
    fireEvent.click(expandSwitcher!);
    
    // After expand, the node should have expanded state (aria-expanded="true")
    // Note: Due to virtual scrolling in jsdom, child nodes may not render immediately
    // We verify the expanded state via the class instead of child visibility
    // Re-query inside waitFor to get the updated DOM node with new classes
    await waitFor(() => {
      const freshNode = screen.getByText('components').closest('.ant-tree-treenode');
      expect(freshNode).toHaveClass('ant-tree-treenode-switcher-open');
    });
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
    const componentsText = screen.getByText('components');
    const componentsTreeNode = componentsText.closest('.ant-tree-treenode');
    const switcherIcon = componentsTreeNode?.querySelector('.ant-tree-switcher');
    fireEvent.click(switcherIcon!);

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

  describe('antd Tree features', () => {
    it('uses antd Tree component', () => {
      const { container } = render(
        <FileNavigator
          files={mockFiles}
          threads={[]}
          selectedFile={null}
          onSelectFile={() => {}}
        />
      );

      // Should have antd tree class
      expect(container.querySelector('.ant-tree')).toBeInTheDocument();
    });

    it('shows tree lines (showLine enabled)', () => {
      const { container } = render(
        <FileNavigator
          files={mockFiles}
          threads={[]}
          selectedFile={null}
          onSelectFile={() => {}}
        />
      );

      // showLine adds ant-tree-show-line class
      expect(container.querySelector('.ant-tree-show-line')).toBeInTheDocument();
    });

    it('does not call onSelectFile when clicking on folders', () => {
      const onSelectFile = vi.fn();
      render(
        <FileNavigator
          files={mockFiles}
          threads={[]}
          selectedFile={null}
          onSelectFile={onSelectFile}
        />
      );

      // Click on a folder name
      fireEvent.click(screen.getByText('components'));
      expect(onSelectFile).not.toHaveBeenCalled();
    });
  });

  describe('file/folder icons', () => {
    it('shows folder icons for directories', () => {
      const { container } = render(
        <FileNavigator
          files={mockFiles}
          threads={[]}
          selectedFile={null}
          onSelectFile={() => {}}
        />
      );

      // Folders should have folder icons
      const folderNodes = container.querySelectorAll('.folder-node');
      expect(folderNodes.length).toBeGreaterThan(0);
      
      // Each folder should contain a folder icon
      folderNodes.forEach((node) => {
        const icon = node.querySelector('.codicon-folder');
        expect(icon).toBeInTheDocument();
      });
    });

    it('shows file icons for files based on extension', () => {
      const { container } = render(
        <FileNavigator
          files={mockFiles}
          threads={[]}
          selectedFile={null}
          onSelectFile={() => {}}
        />
      );

      // TypeScript files should have file-code icons
      const buttonNode = screen.getByText('Button.tsx').closest('.file-node');
      expect(buttonNode?.querySelector('.codicon-file-code')).toBeInTheDocument();

      // Markdown files should have markdown icons
      const readmeNode = screen.getByText('README.md').closest('.file-node');
      expect(readmeNode?.querySelector('.codicon-markdown')).toBeInTheDocument();
    });

    it('shows different icon types for different file extensions', () => {
      const files = [
        'src/index.ts',
        'package.json',
        'README.md',
      ];

      const { container } = render(
        <FileNavigator
          files={files}
          threads={[]}
          selectedFile={null}
          onSelectFile={() => {}}
        />
      );

      // TypeScript file should have file-code icon
      const tsNode = screen.getByText('index.ts').closest('.file-node');
      expect(tsNode?.querySelector('.codicon-file-code')).toBeInTheDocument();

      // JSON file should have file-text icon
      const jsonNode = screen.getByText('package.json').closest('.file-node');
      expect(jsonNode?.querySelector('.codicon-file-text')).toBeInTheDocument();

      // Markdown file should have markdown icon
      const mdNode = screen.getByText('README.md').closest('.file-node');
      expect(mdNode?.querySelector('.codicon-markdown')).toBeInTheDocument();
    });
  });
});
