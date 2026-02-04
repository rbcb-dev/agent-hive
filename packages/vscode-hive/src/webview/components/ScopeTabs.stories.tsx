import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { ScopeTabs } from './ScopeTabs';

const meta = {
  title: 'Components/ScopeTabs',
  component: ScopeTabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    activeScope: {
      control: 'select',
      options: ['feature', 'task', 'context', 'plan', 'code'],
      description: 'The currently active tab',
    },
    onScopeChange: {
      action: 'onScopeChange',
      description: 'Callback fired when a tab is selected',
    },
  },
} satisfies Meta<typeof ScopeTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultScopes = [
  { id: 'feature', label: 'Feature', icon: '📋' },
  { id: 'task', label: 'Task', icon: '✅' },
  { id: 'context', label: 'Context', icon: '📁' },
];

/**
 * Default state with the feature tab active.
 * Shows basic tab rendering with icons.
 */
export const Default: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'feature',
    onScopeChange: fn(),
  },
};

/**
 * With a different tab selected to show active state styling.
 * Demonstrates the active tab visual indicator.
 */
export const WithSelection: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'task',
    onScopeChange: fn(),
  },
};

/**
 * Multiple scopes with different configurations.
 * Shows tabs can work with varying numbers of items and without icons.
 */
export const MultipleScopes: Story = {
  args: {
    scopes: [
      { id: 'plan', label: 'Plan' },
      { id: 'code', label: 'Code' },
      { id: 'review', label: 'Review' },
      { id: 'tests', label: 'Tests' },
      { id: 'docs', label: 'Docs' },
    ],
    activeScope: 'code',
    onScopeChange: fn(),
  },
};

/**
 * Tabs without icons, showing plain label rendering.
 * Verifies the component handles the no-icon case correctly.
 */
export const WithoutIcons: Story = {
  args: {
    scopes: [
      { id: 'feature', label: 'Feature' },
      { id: 'task', label: 'Task' },
      { id: 'context', label: 'Context' },
    ],
    activeScope: 'feature',
    onScopeChange: fn(),
  },
};

/**
 * Interactive test: Tab switching triggers onScopeChange callback.
 * 
 * Play function verifies:
 * 1. Clicking an inactive tab fires the callback
 * 2. Callback receives the correct scope ID
 * 3. Multiple tab switches work correctly
 */
export const TabSwitchingInteraction: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'feature',
    onScopeChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click the task option (antd Segmented uses radio buttons internally)
    const taskOption = canvas.getByText('Task');
    await userEvent.click(taskOption);

    // Verify callback fired with correct scope ID
    await expect(args.onScopeChange).toHaveBeenCalledWith('task');
    await expect(args.onScopeChange).toHaveBeenCalledTimes(1);

    // Click the context option
    const contextOption = canvas.getByText('Context');
    await userEvent.click(contextOption);

    // Verify callback fired again with different scope
    await expect(args.onScopeChange).toHaveBeenCalledWith('context');
    await expect(args.onScopeChange).toHaveBeenCalledTimes(2);
  },
};

/**
 * Test that clicking the already-active tab does NOT trigger the callback.
 * This verifies the component avoids unnecessary state updates.
 */
export const ActiveTabNoCallback: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'feature',
    onScopeChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click the already-active feature option
    const featureOption = canvas.getByText('Feature');
    await userEvent.click(featureOption);

    // Verify callback was NOT called
    await expect(args.onScopeChange).not.toHaveBeenCalled();
  },
};

/**
 * Accessibility test: Verify ARIA attributes are correct.
 * Uses play function to validate accessible markup.
 * 
 * Note: antd Segmented uses radiogroup/radio roles (not tablist/tab),
 * which provides proper keyboard navigation and selection semantics.
 */
export const AccessibilityValidation: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'task',
    onScopeChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // antd Segmented uses radiogroup role for accessibility
    const radiogroup = canvas.getByRole('radiogroup');
    await expect(radiogroup).toBeInTheDocument();

    // Check all options have correct radio role
    const radios = canvas.getAllByRole('radio');
    await expect(radios).toHaveLength(3);

    // Check active option is checked
    const activeOption = canvas.getByRole('radio', { name: /Task/i });
    await expect(activeOption).toBeChecked();

    // Check inactive options are not checked
    const inactiveOption = canvas.getByRole('radio', { name: /Feature/i });
    await expect(inactiveOption).not.toBeChecked();
  },
};
