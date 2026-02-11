import type { StoryObj } from '@storybook/react-vite';
import { Flex } from './Flex';
declare const meta: {
    title: string;
    component: typeof Flex;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        vertical: {
            control: "boolean";
            description: string;
        };
        gap: {
            control: "select";
            options: string[];
            description: string;
        };
        align: {
            control: "select";
            options: string[];
            description: string;
        };
        justify: {
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
 * Default horizontal flex layout with gap.
 */
export declare const Default: Story;
/**
 * Vertical flex layout.
 */
export declare const Vertical: Story;
/**
 * Justify content space-between.
 */
export declare const SpaceBetween: Story;
/**
 * Centered content with align and justify.
 */
export declare const Centered: Story;
/**
 * Wrapping flex layout.
 */
export declare const Wrapping: Story;
/**
 * Play test: verifies children render within flex container.
 */
export declare const RenderingTest: Story;
/**
 * Accessibility check: verifies content is accessible.
 */
export declare const AccessibilityCheck: Story;
