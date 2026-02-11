import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within } from 'storybook/test';

import { Alert } from './Alert';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Alert title (replaces deprecated message)',
    },
    description: {
      control: 'text',
      description: 'Alert description (content below title)',
    },
    type: {
      control: 'select',
      options: ['success', 'info', 'warning', 'error'],
      description: 'Alert type - determines styling',
    },
    showIcon: {
      control: 'boolean',
      description: 'Show icon',
    },
    closable: {
      control: 'boolean',
      description: 'Closable alert',
    },
    onClose: {
      action: 'onClose',
      description: 'Close handler',
    },
    banner: {
      control: 'boolean',
      description: 'Display as banner (full width, no border)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default alert with an info message.
 */
export const Default: Story = {
  args: {
    message: 'This is an informational alert',
    type: 'info',
    showIcon: true,
  },
};

/**
 * Success alert type with description.
 */
export const Success: Story = {
  args: {
    message: 'Operation completed',
    description: 'Your changes have been saved successfully.',
    type: 'success',
    showIcon: true,
  },
};

/**
 * Warning alert type.
 */
export const Warning: Story = {
  args: {
    message: 'Proceed with caution',
    description: 'This action cannot be undone.',
    type: 'warning',
    showIcon: true,
  },
};

/**
 * Error alert type.
 */
export const Error: Story = {
  args: {
    message: 'Something went wrong',
    description: 'Please try again later.',
    type: 'error',
    showIcon: true,
  },
};

/**
 * Closable alert with onClose callback.
 */
export const Closable: Story = {
  args: {
    message: 'This alert can be dismissed',
    type: 'info',
    showIcon: true,
    closable: true,
    onClose: fn(),
  },
};

/**
 * Alert with an action button.
 */
export const WithAction: Story = {
  args: {
    message: 'New version available',
    description: 'A new version of the extension is available.',
    type: 'info',
    showIcon: true,
    action: (
      <Button type="primary" size="small">
        Update
      </Button>
    ),
  },
};

/**
 * Play test: verifies alert renders with correct content.
 */
export const RenderingTest: Story = {
  args: {
    message: 'Test alert message',
    description: 'Test description content',
    type: 'info',
    showIcon: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify alert role is present
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();

    // Verify the description text renders
    await expect(
      canvas.getByText('Test description content'),
    ).toBeInTheDocument();
  },
};

/**
 * Accessibility check: verifies proper ARIA roles.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    message: 'Accessible alert',
    description: 'This alert should have proper ARIA attributes.',
    type: 'warning',
    showIcon: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();
  },
};
