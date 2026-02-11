import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { Tabs } from './Tabs';
import type { TabItem } from './Tabs';

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Tab items configuration',
    },
    activeKey: {
      control: 'text',
      description: 'Current active key (controlled)',
    },
    defaultActiveKey: {
      control: 'text',
      description: 'Default active key (uncontrolled)',
    },
    onChange: {
      action: 'onChange',
      description: 'Tab change handler',
    },
    tabPlacement: {
      control: 'select',
      options: ['top', 'start', 'bottom', 'end'],
      description: 'Tab placement',
    },
    type: {
      control: 'select',
      options: ['line', 'card', 'editable-card'],
      description: 'Tab type',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Size variant',
    },
    centered: {
      control: 'boolean',
      description: 'Center tabs',
    },
    destroyOnHidden: {
      control: 'boolean',
      description: 'Destroy inactive panels',
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems: TabItem[] = [
  { key: 'plan', label: 'Plan', children: 'Plan content goes here.' },
  { key: 'tasks', label: 'Tasks', children: 'Task list content.' },
  { key: 'context', label: 'Context', children: 'Context files and notes.' },
];

/**
 * Default line-style tabs.
 */
export const Default: Story = {
  args: {
    items: defaultItems,
    defaultActiveKey: 'plan',
    onChange: fn(),
  },
};

/**
 * Card-style tabs.
 */
export const CardStyle: Story = {
  args: {
    items: defaultItems,
    defaultActiveKey: 'plan',
    type: 'card',
    onChange: fn(),
  },
};

/**
 * Centered tabs.
 */
export const Centered: Story = {
  args: {
    items: defaultItems,
    defaultActiveKey: 'plan',
    centered: true,
    onChange: fn(),
  },
};

/**
 * Small size tabs.
 */
export const SmallSize: Story = {
  args: {
    items: defaultItems,
    defaultActiveKey: 'plan',
    size: 'small',
    onChange: fn(),
  },
};

/**
 * Tabs with a disabled tab item.
 */
export const WithDisabledTab: Story = {
  args: {
    items: [
      { key: 'active', label: 'Active', children: 'Active content.' },
      { key: 'disabled', label: 'Disabled', disabled: true, children: 'Disabled content.' },
      { key: 'other', label: 'Other', children: 'Other content.' },
    ],
    defaultActiveKey: 'active',
    onChange: fn(),
  },
};

/**
 * Play test: verifies tab switching triggers onChange.
 */
export const TabSwitchInteraction: Story = {
  args: {
    items: defaultItems,
    defaultActiveKey: 'plan',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click the Tasks tab
    const tasksTab = canvas.getByRole('tab', { name: 'Tasks' });
    await userEvent.click(tasksTab);

    await expect(args.onChange).toHaveBeenCalledWith('tasks');
  },
};

/**
 * Accessibility check: verifies tab ARIA roles.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    items: defaultItems,
    defaultActiveKey: 'plan',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify tablist role
    const tablist = canvas.getByRole('tablist');
    await expect(tablist).toBeInTheDocument();

    // Verify tab roles
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs).toHaveLength(3);

    // Verify active tab
    const activeTab = canvas.getByRole('tab', { name: 'Plan', selected: true });
    await expect(activeTab).toBeInTheDocument();

    // Verify tabpanel
    const tabpanel = canvas.getByRole('tabpanel');
    await expect(tabpanel).toBeInTheDocument();
  },
};
