import type { StoryObj } from '@storybook/react-vite';
interface ListItem {
    id: number;
    title: string;
    description: string;
}
declare const meta: {
    title: string;
    component: ({ data, height, itemHeight, itemKey, children, className, style, fullHeight, onScroll, }: import("./VirtualList").VirtualListProps<ListItem>) => React.ReactElement;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        height: {
            control: "number";
            description: string;
        };
        itemHeight: {
            control: "number";
            description: string;
        };
        fullHeight: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default virtual list with 100 items.
 */
export declare const Default: Story;
/**
 * Small list with fewer items.
 */
export declare const SmallList: Story;
/**
 * Large dataset with 1000 items (demonstrates virtualization performance).
 */
export declare const LargeDataset: Story;
/**
 * Custom render function with richer item layout.
 */
export declare const CustomRender: Story;
/**
 * Play test: verifies list renders items.
 */
export declare const RenderingTest: Story;
/**
 * Accessibility check: verifies list is accessible.
 */
export declare const AccessibilityCheck: Story;
