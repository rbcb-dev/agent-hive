import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { Tree } from './Tree';
import type { TreeDataNode } from './Tree';

const meta = {
  title: 'Primitives/Tree',
  component: Tree,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    treeData: {
      control: 'object',
      description: 'Tree data structure',
    },
    selectedKeys: {
      control: 'object',
      description: 'Selected keys (controlled)',
    },
    expandedKeys: {
      control: 'object',
      description: 'Expanded keys (controlled)',
    },
    defaultExpandedKeys: {
      control: 'object',
      description: 'Default expanded keys',
    },
    onSelect: {
      action: 'onSelect',
      description: 'Selection handler',
    },
    onExpand: {
      action: 'onExpand',
      description: 'Expansion handler',
    },
    showLine: {
      control: 'boolean',
      description: 'Show connecting lines',
    },
    virtual: {
      control: 'boolean',
      description: 'Enable virtual scrolling',
    },
    height: {
      control: 'number',
      description: 'List height for virtual scrolling',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show icons',
    },
    checkable: {
      control: 'boolean',
      description: 'Enable checkbox selection',
    },
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultTreeData: TreeDataNode[] = [
  {
    key: 'feature-1',
    title: 'Feature: Auth System',
    children: [
      {
        key: 'plan-1',
        title: 'Plan',
        isLeaf: true,
      },
      {
        key: 'tasks-1',
        title: 'Tasks',
        children: [
          { key: 'task-1-1', title: 'Setup database', isLeaf: true },
          { key: 'task-1-2', title: 'Implement login', isLeaf: true },
          { key: 'task-1-3', title: 'Add JWT tokens', isLeaf: true },
        ],
      },
      {
        key: 'context-1',
        title: 'Context',
        children: [
          { key: 'ctx-1-1', title: 'research.md', isLeaf: true },
          { key: 'ctx-1-2', title: 'decisions.md', isLeaf: true },
        ],
      },
    ],
  },
  {
    key: 'feature-2',
    title: 'Feature: Dashboard',
    children: [
      { key: 'plan-2', title: 'Plan', isLeaf: true },
      {
        key: 'tasks-2',
        title: 'Tasks',
        children: [
          { key: 'task-2-1', title: 'Create layout', isLeaf: true },
          { key: 'task-2-2', title: 'Add charts', isLeaf: true },
        ],
      },
    ],
  },
];

/**
 * Default tree with expanded first node.
 */
export const Default: Story = {
  args: {
    treeData: defaultTreeData,
    defaultExpandedKeys: ['feature-1', 'tasks-1'],
    onSelect: fn(),
    onExpand: fn(),
  },
};

/**
 * Tree with connecting lines.
 */
export const WithLines: Story = {
  args: {
    treeData: defaultTreeData,
    showLine: true,
    defaultExpandedKeys: ['feature-1', 'tasks-1'],
    onSelect: fn(),
    onExpand: fn(),
  },
};

/**
 * Checkable tree with checkboxes.
 */
export const Checkable: Story = {
  args: {
    treeData: defaultTreeData,
    checkable: true,
    defaultExpandedKeys: ['feature-1', 'tasks-1'],
    onSelect: fn(),
    onExpand: fn(),
    onCheck: fn(),
  },
};

/**
 * Virtual scrolling tree (for large datasets).
 */
export const VirtualScrolling: Story = {
  args: {
    treeData: Array.from({ length: 50 }, (_, i) => ({
      key: `node-${i}`,
      title: `Node ${i + 1}`,
      children: Array.from({ length: 5 }, (_, j) => ({
        key: `node-${i}-${j}`,
        title: `Child ${j + 1}`,
        isLeaf: true,
      })),
    })),
    virtual: true,
    height: 300,
    defaultExpandedKeys: ['node-0'],
    onSelect: fn(),
    onExpand: fn(),
  },
};

/**
 * Play test: verifies tree node selection.
 */
export const SelectionInteraction: Story = {
  args: {
    treeData: defaultTreeData,
    defaultExpandedKeys: ['feature-1', 'tasks-1'],
    onSelect: fn(),
    onExpand: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click a tree node
    const node = canvas.getByText('Setup database');
    await userEvent.click(node);

    await expect(args.onSelect).toHaveBeenCalled();
  },
};

/**
 * Accessibility check: verifies tree ARIA roles.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    treeData: defaultTreeData,
    defaultExpandedKeys: ['feature-1'],
    onSelect: fn(),
    onExpand: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify tree role
    const tree = canvas.getByRole('tree');
    await expect(tree).toBeInTheDocument();

    // Verify treeitem roles
    const treeItems = canvas.getAllByRole('treeitem');
    await expect(treeItems.length).toBeGreaterThan(0);
  },
};
