import type { StoryObj } from '@storybook/react-vite';
import { InlineThread } from './InlineThread';
declare const meta: {
    title: string;
    component: typeof InlineThread;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
    tags: string[];
    argTypes: {
        thread: {
            description: string;
        };
        onReply: {
            description: string;
        };
        onResolve: {
            description: string;
        };
        onClose: {
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default inline thread with a single annotation
 */
export declare const Default: Story;
/**
 * Thread with multiple replies showing a conversation
 */
export declare const WithReplies: Story;
/**
 * Resolved thread - resolve button is hidden
 */
export declare const Resolved: Story;
/**
 * Thread with a code suggestion
 */
export declare const WithSuggestion: Story;
/**
 * Interactive test - clicking close button
 */
export declare const CloseInteraction: Story;
/**
 * Interactive test - resolve button functionality
 */
export declare const ResolveInteraction: Story;
/**
 * Interactive test - reply flow (type text, click reply)
 */
export declare const ReplyInteraction: Story;
/**
 * Accessibility check for InlineThread.
 *
 * Verifies:
 * - Annotation text is visible for screen readers
 * - Close and Resolve buttons are accessible via role queries
 * - Reply input is focusable and has a placeholder
 * - Keyboard Tab navigates between interactive elements
 *
 * @tags a11y
 */
export declare const AccessibilityCheck: Story;
/**
 * Interactive test - reply button is disabled when input is empty
 */
export declare const ReplyButtonDisabled: Story;
