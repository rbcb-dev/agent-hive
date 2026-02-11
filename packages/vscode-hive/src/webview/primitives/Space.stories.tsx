import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Space } from './Space';
import { Button } from './Button';

const meta = {
  title: 'Primitives/Space',
  component: Space,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Space orientation - vertical or horizontal layout',
    },
    size: {
      control: 'select',
      options: ['small', 'middle', 'large'],
      description: 'Gap size between items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'baseline'],
      description: 'Align items',
    },
    wrap: {
      control: 'boolean',
      description: 'Allow items to wrap',
    },
  },
} satisfies Meta<typeof Space>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default horizontal space with buttons.
 */
export const Default: Story = {
  args: {
    size: 'middle',
    children: (
      <>
        <Button type="primary">Save</Button>
        <Button type="default">Cancel</Button>
        <Button type="dashed">Draft</Button>
      </>
    ),
  },
};

/**
 * Vertical space orientation.
 */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    size: 'middle',
    children: (
      <>
        <Button type="primary" block>Step 1</Button>
        <Button type="default" block>Step 2</Button>
        <Button type="dashed" block>Step 3</Button>
      </>
    ),
  },
};

/**
 * Large gap between items.
 */
export const LargeGap: Story = {
  args: {
    size: 'large',
    children: (
      <>
        <Button type="primary">Item A</Button>
        <Button type="default">Item B</Button>
        <Button type="dashed">Item C</Button>
      </>
    ),
  },
};

/**
 * Space.Compact for grouped buttons.
 */
export const CompactGroup: StoryObj<typeof Space> = {
  render: () => (
    <Space.Compact>
      <Button type="default">Left</Button>
      <Button type="default">Center</Button>
      <Button type="default">Right</Button>
    </Space.Compact>
  ),
};

/**
 * Wrapping space with many items.
 */
export const Wrapping: Story = {
  args: {
    wrap: true,
    size: 'small',
    children: (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <Button key={i} type="default">Tag {i + 1}</Button>
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
 * Play test: verifies children render in space container.
 */
export const RenderingTest: Story = {
  args: {
    size: 'middle',
    children: (
      <>
        <Button type="primary">First</Button>
        <Button type="default">Second</Button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const buttons = canvas.getAllByRole('button');
    await expect(buttons).toHaveLength(2);
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
    size: 'middle',
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
