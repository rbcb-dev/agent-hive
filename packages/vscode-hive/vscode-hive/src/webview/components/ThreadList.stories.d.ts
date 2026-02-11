import type { StoryObj } from '@storybook/react-vite';
import { ThreadList } from './ThreadList';
declare const meta: {
    title: string;
    component: typeof ThreadList;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        selectedThread: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state when there are no threads
 */
export declare const Empty: Story;
/**
 * Thread list with multiple threads
 */
export declare const WithThreads: Story;
/**
 * Mix of open, resolved, and outdated threads
 */
export declare const WithMixedStatus: Story;
/**
 * Thread list with one item selected
 */
export declare const WithSelection: Story;
/**
 * Interactive test - selecting a thread fires the callback
 */
export declare const SelectThread: Story;
/**
 * Status indicators are visible and correctly colored
 */
export declare const StatusIndicators: Story;
/**
 * Keyboard navigation - Enter key selects thread
 */
export declare const KeyboardNavigation: Story;
/**
 * Accessibility check for ThreadList.
 *
 * Verifies:
 * - Thread items are visible and readable
 * - Status indicators are rendered as text
 * - Thread items are clickable
 * - Keyboard Tab can focus interactive elements
 *
 * @tags a11y
 */
export declare const AccessibilityCheck: Story;
/**
 * Large list using VirtualList (>50 items) for performance
 */
export declare const LargeList: Story;
/**
 * Large list with selection
 */
export declare const LargeListWithSelection: Story;
