import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { VirtualList } from './VirtualList';

interface ListItem {
  id: number;
  title: string;
  description: string;
}

const generateItems = (count: number): ListItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));

const meta = {
  title: 'Primitives/VirtualList',
  component: VirtualList<ListItem>,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    height: {
      control: 'number',
      description: 'Container height',
    },
    itemHeight: {
      control: 'number',
      description: 'Individual item height',
    },
    fullHeight: {
      control: 'boolean',
      description: 'Full height mode',
    },
  },
} satisfies Meta<typeof VirtualList<ListItem>>;

export default meta;
type Story = StoryObj<typeof meta>;

const itemStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  flexDirection: 'column',
};

/**
 * Default virtual list with 100 items.
 */
export const Default: Story = {
  args: {
    data: generateItems(100),
    height: 300,
    itemHeight: 50,
    itemKey: 'id' as keyof ListItem,
    children: (item: ListItem) => (
      <div style={itemStyle}>
        <strong>{item.title}</strong>
        <span style={{ fontSize: 12, color: '#888' }}>{item.description}</span>
      </div>
    ),
  },
};

/**
 * Small list with fewer items.
 */
export const SmallList: Story = {
  args: {
    data: generateItems(10),
    height: 300,
    itemHeight: 50,
    itemKey: 'id' as keyof ListItem,
    children: (item: ListItem) => (
      <div style={itemStyle}>
        <strong>{item.title}</strong>
        <span style={{ fontSize: 12, color: '#888' }}>{item.description}</span>
      </div>
    ),
  },
};

/**
 * Large dataset with 1000 items (demonstrates virtualization performance).
 */
export const LargeDataset: Story = {
  args: {
    data: generateItems(1000),
    height: 400,
    itemHeight: 40,
    itemKey: 'id' as keyof ListItem,
    children: (item: ListItem) => (
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        {item.title} — {item.description}
      </div>
    ),
  },
};

/**
 * Custom render function with richer item layout.
 */
export const CustomRender: Story = {
  args: {
    data: generateItems(50),
    height: 350,
    itemHeight: 60,
    itemKey: 'id' as keyof ListItem,
    children: (item: ListItem, index: number) => (
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#1677ff',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{item.description}</div>
        </div>
      </div>
    ),
  },
};

/**
 * Play test: verifies list renders items.
 */
export const RenderingTest: Story = {
  args: {
    data: generateItems(20),
    height: 200,
    itemHeight: 40,
    itemKey: 'id' as keyof ListItem,
    children: (item: ListItem) => (
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        {item.title}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify at least the first item renders
    await expect(canvas.getByText('Item 1')).toBeInTheDocument();
    await expect(canvas.getByText('Item 2')).toBeInTheDocument();
  },
};

/**
 * Accessibility check: verifies list is accessible.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    data: generateItems(10),
    height: 200,
    itemHeight: 40,
    itemKey: 'id' as keyof ListItem,
    children: (item: ListItem) => (
      <div
        role="listitem"
        style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}
      >
        {item.title}
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify items render
    await expect(canvas.getByText('Item 1')).toBeInTheDocument();
  },
};
