import type { StoryObj } from '@storybook/react-vite';
import { SuggestionPreview } from './SuggestionPreview';
declare const meta: {
    title: string;
    component: typeof SuggestionPreview;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        isApplied: {
            control: "boolean";
            description: string;
        };
        isApplying: {
            control: "boolean";
            description: string;
        };
        hasConflict: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default state showing a suggestion with apply button
 */
export declare const Default: Story;
/**
 * Suggestion with a replacement that shows the before/after diff
 */
export declare const WithReplacement: Story;
/**
 * Suggestion that has already been applied - shows "Applied" badge
 */
export declare const Applied: Story;
/**
 * Suggestion that is currently being applied - button shows "Applying..."
 */
export declare const Applying: Story;
/**
 * Suggestion with a conflict warning - apply button is disabled
 */
export declare const WithConflict: Story;
/**
 * Multi-line code replacement suggestion
 */
export declare const MultiLineReplacement: Story;
/**
 * Test that clicking Apply button triggers onApply callback with annotation ID
 */
export declare const ClickApply: Story;
/**
 * Test that Apply button is disabled when applying
 */
export declare const ApplyButtonDisabledWhileApplying: Story;
/**
 * Test that Apply button is disabled when there's a conflict
 */
export declare const ApplyButtonDisabledWithConflict: Story;
/**
 * Verify diff display shows old and new code in split view by default
 */
export declare const DiffDisplayVerification: Story;
/**
 * Test toggling between split and unified diff views
 */
export declare const ToggleDiffView: Story;
/**
 * Suggestion with markdown formatting in the body
 */
export declare const WithMarkdownBody: Story;
