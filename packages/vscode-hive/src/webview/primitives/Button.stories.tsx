import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['primary', 'default', 'dashed', 'text', 'link'],
      description: 'Button type - determines visual style',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state - shows spinner and disables button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    onClick: {
      action: 'onClick',
      description: 'Click handler',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
    block: {
      control: 'boolean',
      description: 'Make button full width',
    },
    danger: {
      control: 'boolean',
      description: 'Danger button styling',
    },
    htmlType: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type',
    },
    'aria-label': {
      control: 'text',
      description: 'Aria label for accessibility',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default button with primary styling.
 */
export const Default: Story = {
  args: {
    children: 'Click me',
    type: 'primary',
    onClick: fn(),
  },
};

/**
 * All button type variants shown side by side.
 */
export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button type="primary">Primary</Button>
      <Button type="default">Default</Button>
      <Button type="dashed">Dashed</Button>
      <Button type="text">Text</Button>
      <Button type="link">Link</Button>
    </div>
  ),
};

/**
 * All button sizes.
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button type="primary" size="small">
        Small
      </Button>
      <Button type="primary" size="middle">
        Middle
      </Button>
      <Button type="primary" size="large">
        Large
      </Button>
    </div>
  ),
};

/**
 * Button in loading state with spinner.
 */
export const Loading: Story = {
  args: {
    children: 'Submitting...',
    type: 'primary',
    loading: true,
  },
};

/**
 * Danger button variant.
 */
export const Danger: Story = {
  args: {
    children: 'Delete',
    type: 'primary',
    danger: true,
    onClick: fn(),
  },
};

/**
 * Play test: verifies click handler fires.
 */
export const ClickInteraction: Story = {
  args: {
    children: 'Click test',
    type: 'primary',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByRole('button', { name: 'Click test' });
    await userEvent.click(button);

    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/**
 * Accessibility check: verifies button role and label.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    children: 'Accessible button',
    type: 'primary',
    'aria-label': 'Perform action',
    onClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const button = canvas.getByRole('button', { name: 'Perform action' });
    await expect(button).toBeInTheDocument();
    await expect(button).toBeEnabled();
  },
};
