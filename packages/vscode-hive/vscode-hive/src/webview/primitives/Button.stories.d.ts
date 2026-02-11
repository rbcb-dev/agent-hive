import type { StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
declare const meta: {
    title: string;
    component: typeof Button;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        type: {
            control: "select";
            options: string[];
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
        loading: {
            control: "boolean";
            description: string;
        };
        disabled: {
            control: "boolean";
            description: string;
        };
        onClick: {
            action: string;
            description: string;
        };
        children: {
            control: "text";
            description: string;
        };
        block: {
            control: "boolean";
            description: string;
        };
        danger: {
            control: "boolean";
            description: string;
        };
        htmlType: {
            control: "select";
            options: string[];
            description: string;
        };
        'aria-label': {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default button with primary styling.
 */
export declare const Default: Story;
/**
 * All button type variants shown side by side.
 */
export declare const AllTypes: Story;
/**
 * All button sizes.
 */
export declare const AllSizes: Story;
/**
 * Button in loading state with spinner.
 */
export declare const Loading: Story;
/**
 * Danger button variant.
 */
export declare const Danger: Story;
/**
 * Play test: verifies click handler fires.
 */
export declare const ClickInteraction: Story;
/**
 * Accessibility check: verifies button role and label.
 */
export declare const AccessibilityCheck: Story;
