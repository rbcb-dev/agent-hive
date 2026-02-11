import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { TextArea } from './TextArea';

const meta = {
  title: 'Primitives/TextArea',
  component: TextArea,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
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
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    autoSize: {
      control: 'boolean',
      description: 'Auto-resize configuration',
    },
    showCount: {
      control: 'boolean',
      description: 'Show character count',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    readOnly: {
      control: 'boolean',
      description: 'Read-only state',
    },
    rows: {
      control: 'number',
      description: 'Number of visible rows',
    },
    id: {
      control: 'text',
      description: 'Input element id',
    },
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default textarea with placeholder.
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter your review summary...',
    rows: 4,
    onChange: fn(),
  },
};

/**
 * Auto-sizing textarea.
 */
export const AutoSize: Story = {
  args: {
    placeholder: 'This textarea grows as you type...',
    autoSize: { minRows: 2, maxRows: 6 },
    onChange: fn(),
  },
};

/**
 * Textarea with character count and max length.
 */
export const WithCharacterCount: Story = {
  args: {
    placeholder: 'Limited to 200 characters',
    maxLength: 200,
    showCount: true,
    rows: 4,
    onChange: fn(),
  },
};

/**
 * Disabled textarea.
 */
export const Disabled: Story = {
  args: {
    defaultValue: 'This textarea is disabled and cannot be edited.',
    disabled: true,
    rows: 3,
  },
};

/**
 * Read-only textarea.
 */
export const ReadOnly: Story = {
  args: {
    defaultValue: 'This is read-only content that cannot be modified.',
    readOnly: true,
    rows: 3,
  },
};

/**
 * Play test: verifies typing triggers onChange.
 */
export const TypingInteraction: Story = {
  args: {
    placeholder: 'Type here...',
    rows: 3,
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const textarea = canvas.getByRole('textbox');
    await userEvent.type(textarea, 'Hello world');

    await expect(args.onChange).toHaveBeenCalled();
    await expect(textarea).toHaveValue('Hello world');
  },
};

/**
 * Accessibility check: verifies textarea is accessible.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    placeholder: 'Accessible textarea',
    rows: 3,
    id: 'review-summary',
    'aria-describedby': 'summary-help',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const textarea = canvas.getByRole('textbox');
    await expect(textarea).toBeInTheDocument();
    await expect(textarea).toHaveAttribute('id', 'review-summary');
  },
};
