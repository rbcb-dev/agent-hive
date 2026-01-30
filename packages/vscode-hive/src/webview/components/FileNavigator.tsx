/**
 * FileNavigator component - Tree view of files with thread count badges
 * 
 * Displays a hierarchical folder structure with files from the review scope.
 * Shows thread count badges per file and supports click-to-load inline viewing.
 * 
 * @deprecated FileTree.tsx - Use FileNavigator instead
 */

import React, { useMemo, useState, useCallback } from 'react';
import type { ReviewThread } from 'hive-core';

export interface FileNavigatorProps {
  /** List of file paths in the review scope */
  files: string[];
  /** All review threads (used to compute per-file counts) */
  threads: ReviewThread[];
  /** Currently selected file path, or null */
  selectedFile: string | null;
  /** Callback when a file is selected - receives full file path */
  onSelectFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  threadCount: number;
}

/**
 * Build a tree structure from a flat list of file paths
 */
function buildTree(files: string[], threadCounts: Map<string, number>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const filePath of files) {
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const partPath = parts.slice(0, i + 1).join('/');

      let existing = currentLevel.find((node) => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: partPath,
          isFolder: !isFile,
          children: [],
          threadCount: isFile ? (threadCounts.get(partPath) || 0) : 0,
        };
        currentLevel.push(existing);
      }

      if (!isFile) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };

  return sortNodes(root);
}

/**
 * Count threads per file path
 */
function countThreadsPerFile(threads: ReviewThread[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const thread of threads) {
    if (thread.uri) {
      counts.set(thread.uri, (counts.get(thread.uri) || 0) + 1);
    }
  }
  return counts;
}

interface FolderNodeProps {
  node: TreeNode;
  selectedFile: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
}

function FolderNode({
  node,
  selectedFile,
  expandedFolders,
  onToggleFolder,
  onSelectFile,
}: FolderNodeProps): React.ReactElement {
  const isExpanded = expandedFolders.has(node.path);

  const handleToggle = useCallback(() => {
    onToggleFolder(node.path);
  }, [node.path, onToggleFolder]);

  return (
    <div className="tree-folder">
      <div
        data-testid="folder-node"
        className={`tree-node folder-node ${isExpanded ? 'expanded' : 'collapsed'}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
      >
        <span className="folder-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="folder-name">{node.name}</span>
      </div>
      {isExpanded && (
        <div className="tree-children">
          {node.children.map((child) =>
            child.isFolder ? (
              <FolderNode
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ) : (
              <FileNode
                key={child.path}
                node={child}
                isSelected={selectedFile === child.path}
                onSelectFile={onSelectFile}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

interface FileNodeProps {
  node: TreeNode;
  isSelected: boolean;
  onSelectFile: (path: string) => void;
}

function FileNode({ node, isSelected, onSelectFile }: FileNodeProps): React.ReactElement {
  const handleClick = useCallback(() => {
    onSelectFile(node.path);
  }, [node.path, onSelectFile]);

  return (
    <div
      data-testid="file-item"
      className={`tree-node file-node ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <span className="file-icon">📄</span>
      <span className="file-name">{node.name}</span>
      {node.threadCount > 0 && (
        <span data-testid="thread-count" className="thread-count-badge">
          {node.threadCount}
        </span>
      )}
    </div>
  );
}

/**
 * Get all folder paths from tree nodes (for initial expansion)
 */
function getAllFolderPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];
  const traverse = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (node.isFolder) {
        paths.push(node.path);
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return paths;
}

export function FileNavigator({
  files,
  threads,
  selectedFile,
  onSelectFile,
}: FileNavigatorProps): React.ReactElement {
  // Compute thread counts per file
  const threadCounts = useMemo(() => countThreadsPerFile(threads), [threads]);

  // Build tree structure
  const tree = useMemo(() => buildTree(files, threadCounts), [files, threadCounts]);

  // Track which files we've seen to detect new folders
  const prevFilesRef = React.useRef<string[]>([]);

  // Track expanded folders - initialize with all folders expanded
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    prevFilesRef.current = files;
    return new Set(getAllFolderPaths(tree));
  });

  // Only add new folder paths when new files are actually added
  React.useEffect(() => {
    const prevFiles = new Set(prevFilesRef.current);
    const newFiles = files.filter((f) => !prevFiles.has(f));
    
    if (newFiles.length > 0) {
      // Build tree for just the new files to find new folders
      const newTree = buildTree(newFiles, new Map());
      const newFolderPaths = getAllFolderPaths(newTree);
      
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        for (const p of newFolderPaths) {
          next.add(p);
        }
        return next;
      });
    }
    
    prevFilesRef.current = files;
  }, [files]);

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (files.length === 0) {
    return (
      <div className="file-navigator file-navigator-empty">
        <p>No files in review scope</p>
      </div>
    );
  }

  return (
    <div className="file-navigator">
      {tree.map((node) =>
        node.isFolder ? (
          <FolderNode
            key={node.path}
            node={node}
            selectedFile={selectedFile}
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
            onSelectFile={onSelectFile}
          />
        ) : (
          <FileNode
            key={node.path}
            node={node}
            isSelected={selectedFile === node.path}
            onSelectFile={onSelectFile}
          />
        )
      )}
    </div>
  );
}
