import type { StoryObj } from '@storybook/react-vite';
import { ScopeTabs } from './ScopeTabs';
declare const meta: {
    title: string;
    component: typeof ScopeTabs;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        activeScope: {
            control: "select";
            options: string[];
            description: string;
        };
        onScopeChange: {
            action: string;
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default state with the feature tab active.
 * Shows basic tab rendering with icons.
 */
export declare const Default: Story;
/**
 * With a different tab selected to show active state styling.
 * Demonstrates the active tab visual indicator.
 */
export declare const WithSelection: Story;
/**
 * Multiple scopes with different configurations.
 * Shows tabs can work with varying numbers of items and without icons.
 */
export declare const MultipleScopes: Story;
/**
 * Tabs without icons, showing plain label rendering.
 * Verifies the component handles the no-icon case correctly.
 */
export declare const WithoutIcons: Story;
/**
 * Interactive test: Tab switching triggers onScopeChange callback.
 *
 * Play function verifies:
 * 1. Clicking an inactive tab fires the callback
 * 2. Callback receives the correct scope ID
 * 3. Multiple tab switches work correctly
 */
export declare const TabSwitchingInteraction: Story;
/**
 * Test that clicking the already-active tab does NOT trigger the callback.
 * This verifies the component avoids unnecessary state updates.
 */
export declare const ActiveTabNoCallback: Story;
/**
 * Accessibility test: Verify ARIA attributes are correct.
 * Uses play function to validate accessible markup.
 *
 * Note: antd Segmented uses radiogroup/radio roles (not tablist/tab),
 * which provides proper keyboard navigation and selection semantics.
 */
export declare const AccessibilityValidation: Story;
