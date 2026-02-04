/**
 * FileNavigator component - Tree view of files with thread count badges
 * 
 * Displays a hierarchical folder structure with files from the review scope.
 * Shows thread count badges per file and supports click-to-load inline viewing.
 * 
 * Uses antd Tree with virtual scrolling for large file trees.
 */

import React, { useMemo, useState, useCallback } from 'react';
import type { ReviewThread } from 'hive-core';
import type { Key } from 'react';
import { Tree, Typography } from '../primitives';
import type { TreeDataNode } from '../primitives';
import { FileIcon } from './FileIcon';

const { Text } = Typography;

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

interface ExtendedTreeNode extends TreeDataNode {
  /** Thread count for file nodes */
  threadCount?: number;
  /** Whether this node is a file (leaf) or folder */
  isFile?: boolean;
  /** Full file path (same as key) */
  path?: string;
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

/**
 * Build a tree structure from a flat list of file paths for antd Tree
 */
function buildTreeData(files: string[], threadCounts: Map<string, number>): ExtendedTreeNode[] {
  const root: ExtendedTreeNode = { key: 'root', title: '', children: [] };

  for (const filePath of files) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const key = parts.slice(0, i + 1).join('/');

      let child = current.children?.find((c) => c.key === key) as ExtendedTreeNode | undefined;

      if (!child) {
        child = {
          key,
          title: part,
          isLeaf: isFile,
          isFile,
          path: key,
          threadCount: isFile ? threadCounts.get(filePath) : undefined,
          children: isFile ? undefined : [],
        };
        current.children = current.children || [];
        current.children.push(child);
      }
      current = child;
    }
  }

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: ExtendedTreeNode[]): ExtendedTreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isFile !== b.isFile) {
          return a.isFile ? 1 : -1;
        }
        return String(a.title).localeCompare(String(b.title));
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children as ExtendedTreeNode[]) : undefined,
      }));
  };

  return sortNodes((root.children as ExtendedTreeNode[]) || []);
}

/**
 * Get all folder paths from tree nodes (for initial expansion)
 */
function getAllFolderPaths(nodes: ExtendedTreeNode[]): string[] {
  const paths: string[] = [];
  const traverse = (nodeList: ExtendedTreeNode[]) => {
    for (const node of nodeList) {
      if (!node.isFile && node.children) {
        paths.push(node.key as string);
        traverse(node.children as ExtendedTreeNode[]);
      }
    }
  };
  traverse(nodes);
  return paths;
}

/**
 * Find a node in the tree by key
 */
function findNode(nodes: ExtendedTreeNode[], key: string): ExtendedTreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children) {
      const found = findNode(node.children as ExtendedTreeNode[], key);
      if (found) return found;
    }
  }
  return undefined;
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
  const treeData = useMemo(() => buildTreeData(files, threadCounts), [files, threadCounts]);

  // Track which files we've seen to detect new folders
  const prevFilesRef = React.useRef<string[]>([]);

  // Track expanded folders - initialize with all folders expanded
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(() => {
    prevFilesRef.current = files;
    return getAllFolderPaths(treeData);
  });

  // Only add new folder paths when new files are actually added
  React.useEffect(() => {
    const prevFiles = new Set(prevFilesRef.current);
    const newFiles = files.filter((f) => !prevFiles.has(f));

    if (newFiles.length > 0) {
      // Build tree for just the new files to find new folders
      const newTree = buildTreeData(newFiles, new Map());
      const newFolderPaths = getAllFolderPaths(newTree);

      setExpandedKeys((prev) => {
        const next = new Set(prev.map(String));
        for (const p of newFolderPaths) {
          next.add(p);
        }
        return Array.from(next);
      });
    }

    prevFilesRef.current = files;
  }, [files]);

  // Handle selection - only trigger callback for files
  const handleSelect = useCallback(
    (keys: Key[]) => {
      const key = keys[0] as string;
      if (!key) return;

      const node = findNode(treeData, key);
      if (node?.isFile) {
        onSelectFile(key);
      }
    },
    [treeData, onSelectFile]
  );

  // Handle expansion
  const handleExpand = useCallback((keys: Key[]) => {
    setExpandedKeys(keys);
  }, []);

  // Custom title render with thread count badges and file icons
  const renderTitle = useCallback(
    (node: ExtendedTreeNode): React.ReactNode => {
      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && node.isFile && node.path) {
          e.stopPropagation();
          onSelectFile(node.path);
        }
      };

      // Get the filename from the path (last segment)
      const filename = String(node.title);

      return (
        <span
          className={node.isFile ? 'file-node' : 'folder-node'}
          data-testid={node.isFile ? 'file-item' : 'folder-node'}
          onKeyDown={handleKeyDown}
          tabIndex={node.isFile ? 0 : -1}
          role={node.isFile ? 'button' : undefined}
        >
          <FileIcon filename={filename} isDirectory={!node.isFile} />
          <Text style={{ marginLeft: 4 }}>{node.title as string}</Text>
          {node.threadCount && node.threadCount > 0 && (
            <Text
              type="secondary"
              className="thread-badge"
              data-testid="thread-count"
              style={{ marginLeft: 8, fontSize: 11 }}
            >
              ({node.threadCount})
            </Text>
          )}
        </span>
      );
    },
    [onSelectFile]
  );

  // Empty state
  if (files.length === 0) {
    return (
      <div className="file-navigator file-navigator-empty">
        <p>No files in review scope</p>
      </div>
    );
  }

  return (
    <div className="file-navigator">
      <Tree
        treeData={treeData}
        selectedKeys={selectedFile ? [selectedFile] : []}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        showLine={{ showLeafIcon: false }}
        virtual
        height={300}
        titleRender={renderTitle}
      />
    </div>
  );
}
