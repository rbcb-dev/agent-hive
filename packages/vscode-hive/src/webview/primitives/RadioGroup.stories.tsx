import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { RadioGroup } from './RadioGroup';
import type { RadioOption } from './RadioGroup';

const meta = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Radio options',
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
      description: 'Disabled state for all options',
    },
    optionType: {
      control: 'select',
      options: ['default', 'button'],
      description: 'Option display type',
    },
    buttonStyle: {
      control: 'select',
      options: ['outline', 'solid'],
      description: 'Button style (when optionType="button")',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Size variant',
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultOptions: RadioOption[] = [
  { label: 'Approve', value: 'approve' },
  { label: 'Request Changes', value: 'request-changes' },
  { label: 'Comment', value: 'comment' },
];

/**
 * Default radio group with standard radio buttons.
 */
export const Default: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'approve',
    onChange: fn(),
  },
};

/**
 * Button style radio group.
 */
export const ButtonStyle: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'approve',
    optionType: 'button',
    onChange: fn(),
  },
};

/**
 * Solid button style radio group.
 */
export const SolidButtons: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'approve',
    optionType: 'button',
    buttonStyle: 'solid',
    onChange: fn(),
  },
};

/**
 * Disabled radio group.
 */
export const Disabled: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'approve',
    disabled: true,
  },
};

/**
 * Radio group with a disabled option.
 */
export const WithDisabledOption: Story = {
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
 * Play test: verifies radio selection triggers onChange.
 */
export const SelectionInteraction: Story = {
  args: {
    options: defaultOptions,
    defaultValue: 'approve',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click a different option
    const requestChanges = canvas.getByLabelText('Request Changes');
    await userEvent.click(requestChanges);

    await expect(args.onChange).toHaveBeenCalled();
  },
};

/**
 * Accessibility check: verifies radiogroup ARIA roles.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    options: defaultOptions,
    defaultValue: 'approve',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify radiogroup role
    const radiogroup = canvas.getByRole('radiogroup');
    await expect(radiogroup).toBeInTheDocument();

    // Verify individual radio buttons
    const radios = canvas.getAllByRole('radio');
    await expect(radios).toHaveLength(3);

    // Verify the default is checked
    const approveRadio = canvas.getByRole('radio', { name: 'Approve' });
    await expect(approveRadio).toBeChecked();
  },
};
