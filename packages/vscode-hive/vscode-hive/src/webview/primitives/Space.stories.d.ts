import type { StoryObj } from '@storybook/react-vite';
import { Space } from './Space';
declare const meta: {
    title: string;
    component: typeof Space;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        orientation: {
            control: "select";
            options: string[];
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
        align: {
            control: "select";
            options: string[];
            description: string;
        };
        wrap: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default horizontal space with buttons.
 */
export declare const Default: Story;
/**
 * Vertical space orientation.
 */
export declare const Vertical: Story;
/**
 * Large gap between items.
 */
export declare const LargeGap: Story;
/**
 * Space.Compact for grouped buttons.
 */
export declare const CompactGroup: StoryObj<typeof Space>;
/**
 * Wrapping space with many items.
 */
export declare const Wrapping: Story;
/**
 * Play test: verifies children render in space container.
 */
export declare const RenderingTest: Story;
/**
 * Accessibility check: verifies content is accessible.
 */
export declare const AccessibilityCheck: Story;
