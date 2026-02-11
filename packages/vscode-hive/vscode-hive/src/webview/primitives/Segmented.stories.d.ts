import type { StoryObj } from '@storybook/react-vite';
import { Segmented } from './Segmented';
declare const meta: {
    title: string;
    component: typeof Segmented;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        options: {
            control: "object";
            description: string;
        };
        value: {
            control: "text";
            description: string;
        };
        defaultValue: {
            control: "text";
            description: string;
        };
        onChange: {
            action: string;
            description: string;
        };
        disabled: {
            control: "boolean";
            description: string;
        };
        block: {
            control: "boolean";
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default segmented with string options.
 */
export declare const Default: Story;
/**
 * Segmented with object options (label/value).
 */
export declare const WithObjectOptions: Story;
/**
 * Block (full width) segmented.
 */
export declare const Block: Story;
/**
 * Disabled segmented control.
 */
export declare const Disabled: Story;
/**
 * Segmented with a disabled individual option.
 */
export declare const DisabledOption: Story;
/**
 * Play test: verifies selection change fires callback.
 */
export declare const SelectionInteraction: Story;
/**
 * Accessibility check: verifies ARIA roles.
 */
export declare const AccessibilityCheck: Story;
