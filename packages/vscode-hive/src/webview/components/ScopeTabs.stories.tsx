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
      options: ['feature', 'task', 'context'],
      description: 'The currently active tab',
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
 * Default state with the feature tab active
 */
export const Default: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'feature',
    onScopeChange: fn(),
  },
};

/**
 * With task tab active
 */
export const TaskActive: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'task',
    onScopeChange: fn(),
  },
};

/**
 * Tabs without icons
 */
export const WithoutIcons: Story = {
  args: {
    scopes: [
      { id: 'plan', label: 'Plan' },
      { id: 'code', label: 'Code' },
      { id: 'review', label: 'Review' },
    ],
    activeScope: 'plan',
    onScopeChange: fn(),
  },
};

/**
 * Interactive test - clicking a tab triggers onScopeChange
 */
export const ClickToSwitch: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'feature',
    onScopeChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the task tab and click it
    const taskTab = canvas.getByRole('tab', { name: /Task/i });
    await userEvent.click(taskTab);

    // Verify the callback was called with the correct scope
    await expect(args.onScopeChange).toHaveBeenCalledWith('task');
  },
};

/**
 * Test that clicking the active tab doesn't trigger a change
 */
export const ClickActiveTabs: Story = {
  args: {
    scopes: defaultScopes,
    activeScope: 'feature',
    onScopeChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the active (feature) tab and click it
    const featureTab = canvas.getByRole('tab', { name: /Feature/i });
    await userEvent.click(featureTab);

    // Verify the callback was NOT called (clicking active tab does nothing)
    await expect(args.onScopeChange).not.toHaveBeenCalled();
  },
};
