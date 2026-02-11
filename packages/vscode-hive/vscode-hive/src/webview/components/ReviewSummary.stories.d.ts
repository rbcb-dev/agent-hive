/**
 * Storybook stories for ReviewSummary component
 *
 * Shows the review submission form with verdict selector and summary input.
 * Stories demonstrate different verdict states and submission states.
 */
import type { StoryObj } from '@storybook/react-vite';
import { ReviewSummary } from './ReviewSummary';
declare const meta: {
    title: string;
    component: typeof ReviewSummary;
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
        isSubmitting: {
            control: "boolean";
            description: string;
        };
        onSubmit: {
            action: string;
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state - no verdict selected, submit disabled
 * Initial state when the component first renders
 */
export declare const Empty: Story;
/**
 * Pending state - submission in progress
 * All inputs disabled, submit button shows "Submitting…"
 */
export declare const Pending: Story;
/**
 * Approved state - Approve verdict selected
 * Shows the green checkmark verdict indicator with "Approve" highlighted
 */
export declare const Approved: Story;
/**
 * Request Changes state - Request Changes verdict selected
 * Shows the red X verdict indicator with "Request Changes" highlighted
 */
export declare const RequestChanges: Story;
/**
 * Comment state - Comment verdict selected
 * Shows the blue comment icon with "Comment" highlighted
 */
export declare const Comment: Story;
/**
 * With Summary - Shows a pre-filled summary textarea
 * Demonstrates how the summary field looks with content
 */
export declare const WithSummary: Story;
/**
 * All Verdicts - Interactive demonstration of switching between verdicts
 * Shows that selecting a new verdict deselects the previous one
 */
export declare const SwitchingVerdicts: Story;
/**
 * Statistics display - Shows thread/comment counts
 * (This story assumes statistics might be added to the component in the future)
 * For now, demonstrates the verdict options which serve as the main "statistics"
 * showing available review outcomes.
 */
export declare const VerdictStatistics: Story;
/**
 * Accessibility check for ReviewSummary.
 *
 * Verifies:
 * - Verdict buttons are discoverable via role queries
 * - Summary textarea has a placeholder for screen readers
 * - Submit button is present and accessible
 * - Keyboard Tab moves through interactive elements
 *
 * @tags a11y
 */
export declare const AccessibilityCheck: Story;
/**
 * Keyboard Submit - Tests Cmd/Ctrl+Enter keyboard shortcut
 * Verifies that pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) triggers submit
 */
export declare const KeyboardSubmit: Story;
