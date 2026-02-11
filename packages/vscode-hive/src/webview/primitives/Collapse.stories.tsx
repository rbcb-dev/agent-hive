import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { Collapse } from './Collapse';
import type { CollapseItem } from './Collapse';

const meta = {
  title: 'Primitives/Collapse',
  component: Collapse,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Collapse items configuration',
    },
    activeKey: {
      control: 'text',
      description: 'Current active key(s) (controlled)',
    },
    defaultActiveKey: {
      control: 'text',
      description: 'Default active key(s) (uncontrolled)',
    },
    onChange: {
      action: 'onChange',
      description: 'Change handler',
    },
    accordion: {
      control: 'boolean',
      description: 'Only one panel open at a time',
    },
    bordered: {
      control: 'boolean',
      description: 'Show border around collapse',
    },
    ghost: {
      control: 'boolean',
      description: 'Ghost mode - transparent background, no border',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Size variant',
    },
    destroyOnHidden: {
      control: 'boolean',
      description: 'Destroy content when collapsed',
    },
  },
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultItems: CollapseItem[] = [
  {
    key: '1',
    label: 'Plan Overview',
    children: 'This section describes the implementation plan for the feature.',
  },
  {
    key: '2',
    label: 'Task List',
    children:
      'Tasks are generated from the approved plan and executed in order.',
  },
  {
    key: '3',
    label: 'Context Files',
    children:
      'Context files store persistent notes, decisions, and reference material.',
  },
];

/**
 * Default collapse with multiple panels.
 */
export const Default: Story = {
  args: {
    items: defaultItems,
    defaultActiveKey: ['1'],
  },
};

/**
 * Accordion mode - only one panel open at a time.
 */
export const Accordion: Story = {
  args: {
    items: defaultItems,
    accordion: true,
    defaultActiveKey: '1',
  },
};

/**
 * Ghost mode with transparent background.
 */
export const Ghost: Story = {
  args: {
    items: defaultItems,
    ghost: true,
    defaultActiveKey: ['1'],
  },
};

/**
 * Small size variant.
 */
export const SmallSize: Story = {
  args: {
    items: defaultItems,
    size: 'small',
    defaultActiveKey: ['1'],
  },
};

/**
 * Play test: verifies panel toggle interaction.
 */
export const PanelToggle: Story = {
  args: {
    items: defaultItems,
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click to expand the first panel
    const firstPanelHeader = canvas.getByText('Plan Overview');
    await userEvent.click(firstPanelHeader);

    await expect(args.onChange).toHaveBeenCalled();
  },
};

/**
 * Accessibility check: verifies collapse structure.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    items: defaultItems,
    defaultActiveKey: ['1'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify panels are present
    await expect(canvas.getByText('Plan Overview')).toBeInTheDocument();
    await expect(canvas.getByText('Task List')).toBeInTheDocument();
    await expect(canvas.getByText('Context Files')).toBeInTheDocument();
  },
};
