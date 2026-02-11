import type { StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';
declare const meta: {
    title: string;
    component: typeof Alert;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        message: {
            control: "text";
            description: string;
        };
        description: {
            control: "text";
            description: string;
        };
        type: {
            control: "select";
            options: string[];
            description: string;
        };
        showIcon: {
            control: "boolean";
            description: string;
        };
        closable: {
            control: "boolean";
            description: string;
        };
        onClose: {
            action: string;
            description: string;
        };
        banner: {
            control: "boolean";
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default alert with an info message.
 */
export declare const Default: Story;
/**
 * Success alert type with description.
 */
export declare const Success: Story;
/**
 * Warning alert type.
 */
export declare const Warning: Story;
/**
 * Error alert type.
 */
export declare const Error: Story;
/**
 * Closable alert with onClose callback.
 */
export declare const Closable: Story;
/**
 * Alert with an action button.
 */
export declare const WithAction: Story;
/**
 * Play test: verifies alert renders with correct content.
 */
export declare const RenderingTest: Story;
/**
 * Accessibility check: verifies proper ARIA roles.
 */
export declare const AccessibilityCheck: Story;
