import type { StoryObj } from '@storybook/react-vite';
import { ThreadPanel } from './ThreadPanel';
declare const meta: {
    title: string;
    component: typeof ThreadPanel;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        thread: {
            description: string;
        };
        onReply: {
            description: string;
            action: string;
        };
        onResolve: {
            description: string;
            action: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state when no thread is selected
 */
export declare const Empty: Story;
/**
 * Thread with a single human comment
 */
export declare const WithThread: Story;
/**
 * Thread with an AI-generated annotation (shows AI badge)
 */
export declare const WithAIAnnotation: Story;
/**
 * Thread with a code suggestion annotation
 */
export declare const WithSuggestion: Story;
/**
 * Resolved thread (no resolve button shown)
 */
export declare const Resolved: Story;
/**
 * Tests the reply flow: type a message and submit with Cmd+Enter
 */
export declare const ReplyWithCmdEnter: Story;
/**
 * Tests the reply flow: type a message and click the Reply button
 */
export declare const ReplyWithButton: Story;
/**
 * Tests the resolve action: clicking the Resolve button
 */
export declare const ResolveAction: Story;
/**
 * Accessibility check for ThreadPanel.
 *
 * Verifies:
 * - Annotation text is visible for screen readers
 * - Reply textarea is accessible via role and label
 * - Reply and Resolve buttons are accessible via role queries
 * - Keyboard Tab navigates between interactive elements
 *
 * @tags a11y
 */
export declare const AccessibilityCheck: Story;
/**
 * Tests that the Reply button is disabled when textarea is empty
 */
export declare const ReplyButtonDisabledWhenEmpty: Story;
