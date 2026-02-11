import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { Segmented } from './Segmented';

const meta = {
  title: 'Primitives/Segmented',
  component: Segmented,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Options to display',
    },
    value: {
      control: 'text',
      description: 'Current value (controlled)',
    },
    defaultValue: {
      control: 'text',
      description: 'Default value (uncontrolled)',
    },
    onChange: {
      action: 'onChange',
      description: 'Change handler',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    block: {
      control: 'boolean',
      description: 'Make full width',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Size variant',
    },
  },
} satisfies Meta<typeof Segmented>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default segmented with string options.
 */
export const Default: Story = {
  args: {
    options: ['Daily', 'Weekly', 'Monthly'],
    defaultValue: 'Daily',
    onChange: fn(),
  },
};

/**
 * Segmented with object options (label/value).
 */
export const WithObjectOptions: Story = {
  args: {
    options: [
      { label: 'Unified', value: 'unified' },
      { label: 'Split', value: 'split' },
      { label: 'Side by Side', value: 'side-by-side' },
    ],
    defaultValue: 'unified',
    onChange: fn(),
  },
};

/**
 * Block (full width) segmented.
 */
export const Block: Story = {
  args: {
    options: ['Feature', 'Task', 'Context'],
    defaultValue: 'Feature',
    block: true,
    onChange: fn(),
  },
};

/**
 * Disabled segmented control.
 */
export const Disabled: Story = {
  args: {
    options: ['A', 'B', 'C'],
    defaultValue: 'A',
    disabled: true,
  },
};

/**
 * Segmented with a disabled individual option.
 */
export const DisabledOption: Story = {
  args: {
    options: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B (disabled)', value: 'b', disabled: true },
      { label: 'Option C', value: 'c' },
    ],
    defaultValue: 'a',
    onChange: fn(),
  },
};

/**
 * Play test: verifies selection change fires callback.
 */
export const SelectionInteraction: Story = {
  args: {
    options: ['Plan', 'Code', 'Review'],
    defaultValue: 'Plan',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click a different segment
    const codeOption = canvas.getByText('Code');
    await userEvent.click(codeOption);

    await expect(args.onChange).toHaveBeenCalledWith('Code');
  },
};

/**
 * Accessibility check: verifies ARIA roles.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    options: ['A', 'B', 'C'],
    defaultValue: 'A',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // antd Segmented uses radiogroup role
    const radiogroup = canvas.getByRole('radiogroup');
    await expect(radiogroup).toBeInTheDocument();

    const radios = canvas.getAllByRole('radio');
    await expect(radios).toHaveLength(3);
  },
};
