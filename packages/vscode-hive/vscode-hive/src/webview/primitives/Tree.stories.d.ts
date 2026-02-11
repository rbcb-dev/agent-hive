import type { StoryObj } from '@storybook/react-vite';
import { Tree } from './Tree';
declare const meta: {
    title: string;
    component: typeof Tree;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        treeData: {
            control: "object";
            description: string;
        };
        selectedKeys: {
            control: "object";
            description: string;
        };
        expandedKeys: {
            control: "object";
            description: string;
        };
        defaultExpandedKeys: {
            control: "object";
            description: string;
        };
        onSelect: {
            action: string;
            description: string;
        };
        onExpand: {
            action: string;
            description: string;
        };
        showLine: {
            control: "boolean";
            description: string;
        };
        virtual: {
            control: "boolean";
            description: string;
        };
        height: {
            control: "number";
            description: string;
        };
        showIcon: {
            control: "boolean";
            description: string;
        };
        checkable: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default tree with expanded first node.
 */
export declare const Default: Story;
/**
 * Tree with connecting lines.
 */
export declare const WithLines: Story;
/**
 * Checkable tree with checkboxes.
 */
export declare const Checkable: Story;
/**
 * Virtual scrolling tree (for large datasets).
 */
export declare const VirtualScrolling: Story;
/**
 * Play test: verifies tree node selection.
 */
export declare const SelectionInteraction: Story;
/**
 * Accessibility check: verifies tree ARIA roles.
 */
export declare const AccessibilityCheck: Story;
