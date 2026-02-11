import type { StoryObj } from '@storybook/react-vite';
import { Collapse } from './Collapse';
declare const meta: {
    title: string;
    component: typeof Collapse;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        items: {
            control: "object";
            description: string;
        };
        activeKey: {
            control: "text";
            description: string;
        };
        defaultActiveKey: {
            control: "text";
            description: string;
        };
        onChange: {
            action: string;
            description: string;
        };
        accordion: {
            control: "boolean";
            description: string;
        };
        bordered: {
            control: "boolean";
            description: string;
        };
        ghost: {
            control: "boolean";
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
        destroyOnHidden: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default collapse with multiple panels.
 */
export declare const Default: Story;
/**
 * Accordion mode - only one panel open at a time.
 */
export declare const Accordion: Story;
/**
 * Ghost mode with transparent background.
 */
export declare const Ghost: Story;
/**
 * Small size variant.
 */
export declare const SmallSize: Story;
/**
 * Play test: verifies panel toggle interaction.
 */
export declare const PanelToggle: Story;
/**
 * Accessibility check: verifies collapse structure.
 */
export declare const AccessibilityCheck: Story;
