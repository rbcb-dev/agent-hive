import type { StoryObj } from '@storybook/react-vite';
import { TextArea } from './TextArea';
declare const meta: {
    title: string;
    component: typeof TextArea;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
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
        placeholder: {
            control: "text";
            description: string;
        };
        autoSize: {
            control: "boolean";
            description: string;
        };
        showCount: {
            control: "boolean";
            description: string;
        };
        maxLength: {
            control: "number";
            description: string;
        };
        disabled: {
            control: "boolean";
            description: string;
        };
        readOnly: {
            control: "boolean";
            description: string;
        };
        rows: {
            control: "number";
            description: string;
        };
        id: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default textarea with placeholder.
 */
export declare const Default: Story;
/**
 * Auto-sizing textarea.
 */
export declare const AutoSize: Story;
/**
 * Textarea with character count and max length.
 */
export declare const WithCharacterCount: Story;
/**
 * Disabled textarea.
 */
export declare const Disabled: Story;
/**
 * Read-only textarea.
 */
export declare const ReadOnly: Story;
/**
 * Play test: verifies typing triggers onChange.
 */
export declare const TypingInteraction: Story;
/**
 * Accessibility check: verifies textarea is accessible.
 */
export declare const AccessibilityCheck: Story;
