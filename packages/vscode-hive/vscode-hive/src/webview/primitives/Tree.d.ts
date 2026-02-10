/**
 * Tree - Ant Design Tree wrapper
 *
 * Provides a tree component with virtual scrolling, selection, and expansion.
 */
import type { TreeDataNode as AntdTreeDataNode } from 'antd';
import type { ReactNode, Key } from 'react';
export type TreeDataNode = AntdTreeDataNode;
export interface TreeProps {
    /** Tree data structure */
    treeData: TreeDataNode[];
    /** Selected keys (controlled) */
    selectedKeys?: Key[];
    /** Expanded keys (controlled) */
    expandedKeys?: Key[];
    /** Default expanded keys */
    defaultExpandedKeys?: Key[];
    /** Selection handler */
    onSelect?: (keys: Key[], info: {
        node: TreeDataNode;
    }) => void;
    /** Expansion handler */
    onExpand?: (keys: Key[]) => void;
    /** Show connecting lines */
    showLine?: boolean | {
        showLeafIcon: boolean;
    };
    /** Enable virtual scrolling (default true for large trees) */
    virtual?: boolean;
    /** List height for virtual scrolling */
    height?: number;
    /** Custom title render function */
    titleRender?: (node: TreeDataNode) => ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Show icons */
    showIcon?: boolean;
    /** Enable checkbox selection */
    checkable?: boolean;
    /** Checked keys (when checkable) */
    checkedKeys?: Key[];
    /** Check handler (when checkable) */
    onCheck?: (keys: Key[]) => void;
}
export declare function Tree({ treeData, selectedKeys, expandedKeys, defaultExpandedKeys, onSelect, onExpand, showLine, virtual, height, titleRender, className, style, showIcon, checkable, checkedKeys, onCheck, }: TreeProps): React.ReactElement;
