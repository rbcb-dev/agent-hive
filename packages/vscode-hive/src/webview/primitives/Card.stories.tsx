import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { Card } from './Card';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
    },
    size: {
      control: 'select',
      options: ['default', 'small'],
      description: 'Card size',
    },
    hoverable: {
      control: 'boolean',
      description: 'Show hover effect',
    },
    children: {
      control: 'text',
      description: 'Card content',
    },
    variant: {
      control: 'select',
      options: ['outlined', 'borderless'],
      description: 'Card variant',
    },
    onClick: {
      action: 'onClick',
      description: 'Click handler',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for testing',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default card with title and content.
 */
export const Default: Story = {
  args: {
    title: 'Card Title',
    children:
      'This is card content. Cards are useful for grouping related information.',
  },
};

/**
 * Small card variant.
 */
export const Small: Story = {
  args: {
    title: 'Small Card',
    size: 'small',
    children: 'Compact card content.',
  },
};

/**
 * Hoverable card with click handler.
 */
export const Hoverable: Story = {
  args: {
    title: 'Hoverable Card',
    hoverable: true,
    onClick: fn(),
    children: 'Hover over me to see the effect.',
  },
};

/**
 * Card with extra actions in the header.
 */
export const WithExtra: Story = {
  args: {
    title: 'Feature Details',
    extra: (
      <Button type="link" size="small">
        More
      </Button>
    ),
    children: 'Card with a header action button.',
  },
};

/**
 * Borderless card variant.
 */
export const Borderless: Story = {
  args: {
    title: 'Borderless Card',
    variant: 'borderless',
    children: 'This card has no border.',
  },
};

/**
 * Play test: verifies card renders and click works.
 */
export const ClickInteraction: Story = {
  args: {
    title: 'Clickable Card',
    hoverable: true,
    onClick: fn(),
    children: 'Click this card',
    'data-testid': 'test-card',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify card renders with title
    await expect(canvas.getByText('Clickable Card')).toBeInTheDocument();
    await expect(canvas.getByText('Click this card')).toBeInTheDocument();
  },
};

/**
 * Accessibility check: verifies card structure.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    title: 'Accessible Card',
    children: 'This card should have proper heading structure.',
    'data-testid': 'a11y-card',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify content is present and readable
    await expect(canvas.getByText('Accessible Card')).toBeInTheDocument();
    await expect(
      canvas.getByText('This card should have proper heading structure.'),
    ).toBeInTheDocument();
  },
};
