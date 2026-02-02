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

    // Click the task tab
    const taskTab = canvas.getByRole('tab', { name: /Task/i });
    await userEvent.click(taskTab);

    // Verify callback fired with correct scope ID
    await expect(args.onScopeChange).toHaveBeenCalledWith('task');
    await expect(args.onScopeChange).toHaveBeenCalledTimes(1);

    // Click the context tab
    const contextTab = canvas.getByRole('tab', { name: /Context/i });
    await userEvent.click(contextTab);

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

    // Click the already-active feature tab
    const featureTab = canvas.getByRole('tab', { name: /Feature/i });
    await userEvent.click(featureTab);

    // Verify callback was NOT called
    await expect(args.onScopeChange).not.toHaveBeenCalled();
  },
};

/**
 * Accessibility test: Verify ARIA attributes are correct.
 * Uses play function to validate accessible markup.
 */
export const AccessibilityValidation: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'task',
    onScopeChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check the tablist role exists
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toBeInTheDocument();

    // Check all tabs have correct role
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs).toHaveLength(3);

    // Check active tab has aria-selected="true"
    const activeTab = canvas.getByRole('tab', { name: /Task/i });
    await expect(activeTab).toHaveAttribute('aria-selected', 'true');

    // Check inactive tabs have aria-selected="false"
    const inactiveTab = canvas.getByRole('tab', { name: /Feature/i });
    await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
  },
};
