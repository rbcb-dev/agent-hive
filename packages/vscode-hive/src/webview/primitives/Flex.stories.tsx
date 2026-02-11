import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Flex } from './Flex';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Flex',
  component: Flex,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    vertical: {
      control: 'boolean',
      description: 'Stack items vertically (flex-direction: column)',
    },
    gap: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Gap between items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Alignment along the cross axis',
    },
    justify: {
      control: 'select',
      options: [
        'start',
        'center',
        'end',
        'space-between',
        'space-around',
        'space-evenly',
      ],
      description: 'Alignment along the main axis',
    },
    wrap: {
      control: 'boolean',
      description: 'Allow items to wrap to multiple lines',
    },
  },
} satisfies Meta<typeof Flex>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal flex layout with gap.
 */
export const Default: Story = {
  args: {
    gap: 'middle',
    children: (
      <>
        <Button type="primary">Button 1</Button>
        <Button type="default">Button 2</Button>
        <Button type="dashed">Button 3</Button>
      </>
    ),
  },
};

/**
 * Vertical flex layout.
 */
export const Vertical: Story = {
  args: {
    vertical: true,
    gap: 'middle',
    children: (
      <>
        <Button type="primary">Top</Button>
        <Button type="default">Middle</Button>
        <Button type="dashed">Bottom</Button>
      </>
    ),
  },
};

/**
 * Justify content space-between.
 */
export const SpaceBetween: Story = {
  args: {
    justify: 'space-between',
    gap: 'middle',
    children: (
      <>
        <Button type="primary">Left</Button>
        <Button type="default">Right</Button>
      </>
    ),
  },
};

/**
 * Centered content with align and justify.
 */
export const Centered: Story = {
  args: {
    justify: 'center',
    align: 'center',
    gap: 'large',
    children: (
      <>
        <Button type="primary">A</Button>
        <Button type="default">B</Button>
        <Button type="dashed">C</Button>
      </>
    ),
  },
};

/**
 * Wrapping flex layout.
 */
export const Wrapping: Story = {
  args: {
    wrap: true,
    gap: 'small',
    children: (
      <>
        {Array.from({ length: 10 }, (_, i) => (
          <Button key={i} type="default">
            Item {i + 1}
          </Button>
        ))}
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 300 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Play test: verifies children render within flex container.
 */
export const RenderingTest: Story = {
  args: {
    gap: 'middle',
    children: (
      <>
        <span data-testid="item-1">First</span>
        <span data-testid="item-2">Second</span>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('First')).toBeInTheDocument();
    await expect(canvas.getByText('Second')).toBeInTheDocument();
  },
};

/**
 * Accessibility check: verifies content is accessible.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    gap: 'middle',
    children: (
      <>
        <Button type="primary">Action 1</Button>
        <Button type="default">Action 2</Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const buttons = canvas.getAllByRole('button');
    await expect(buttons).toHaveLength(2);
  },
};
