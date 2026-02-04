/**
 * Tests for primitives layer components
 * 
 * These tests verify that our primitive components correctly wrap antd components
 * while providing our own API surface. The primitives layer is the ONLY antd import boundary.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HiveThemeProvider } from '../theme/Provider';
import {
  Button,
  Card,
  Flex,
  Space,
  Tree,
  Segmented,
  Tabs,
  Collapse,
  RadioGroup,
  TextArea,
  Alert,
  Layout,
  Typography,
  VirtualList,
} from '../primitives';
import type {
  ButtonProps,
  CardProps,
  FlexProps,
  SpaceProps,
  TreeProps,
  TreeDataNode,
  SegmentedProps,
  TabsProps,
  CollapseProps,
  RadioGroupProps,
  TextAreaProps,
  AlertProps,
  LayoutProps,
  TypographyProps,
  VirtualListProps,
} from '../primitives';

/**
 * Helper to render components within HiveThemeProvider
 */
function renderWithTheme(ui: React.ReactElement) {
  return render(<HiveThemeProvider>{ui}</HiveThemeProvider>);
}

describe('Primitives Layer', () => {
  describe('Button', () => {
    it('renders children', () => {
      renderWithTheme(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', () => {
      const onClick = vi.fn();
      renderWithTheme(<Button onClick={onClick}>Click</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports type prop', () => {
      renderWithTheme(<Button type="primary">Primary</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports loading state', () => {
      renderWithTheme(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports disabled state', () => {
      renderWithTheme(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('supports size prop', () => {
      renderWithTheme(<Button size="small">Small</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders children', () => {
      renderWithTheme(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders title', () => {
      renderWithTheme(<Card title="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('supports size prop', () => {
      renderWithTheme(<Card size="small">Small card</Card>);
      expect(screen.getByText('Small card')).toBeInTheDocument();
    });

    it('supports hoverable prop', () => {
      renderWithTheme(<Card hoverable>Hoverable card</Card>);
      expect(screen.getByText('Hoverable card')).toBeInTheDocument();
    });

    it('applies className', () => {
      const { container } = renderWithTheme(<Card className="custom-card">Content</Card>);
      expect(container.querySelector('.custom-card')).toBeInTheDocument();
    });
  });

  describe('Flex', () => {
    it('renders children', () => {
      renderWithTheme(
        <Flex>
          <span>Child 1</span>
          <span>Child 2</span>
        </Flex>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('supports vertical prop', () => {
      const { container } = renderWithTheme(
        <Flex vertical>
          <span>Item</span>
        </Flex>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('supports gap prop with semantic value', () => {
      const { container } = renderWithTheme(
        <Flex gap="small">
          <span>Item</span>
        </Flex>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('supports gap prop with number', () => {
      const { container } = renderWithTheme(
        <Flex gap={16}>
          <span>Item</span>
        </Flex>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('supports wrap prop with boolean true', () => {
      const { container } = renderWithTheme(
        <Flex wrap>
          <span>Item</span>
        </Flex>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('supports align prop', () => {
      const { container } = renderWithTheme(
        <Flex align="center">
          <span>Item</span>
        </Flex>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('supports justify prop', () => {
      const { container } = renderWithTheme(
        <Flex justify="space-between">
          <span>Item</span>
        </Flex>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Space', () => {
    it('renders children', () => {
      renderWithTheme(
        <Space>
          <span>Item 1</span>
          <span>Item 2</span>
        </Space>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('supports orientation prop (vertical)', () => {
      const { container } = renderWithTheme(
        <Space orientation="vertical">
          <span>Item</span>
        </Space>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('supports size prop', () => {
      const { container } = renderWithTheme(
        <Space size="large">
          <span>Item</span>
        </Space>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Tree', () => {
    const treeData: TreeDataNode[] = [
      {
        key: '0-0',
        title: 'Parent',
        children: [
          { key: '0-0-0', title: 'Child 1' },
          { key: '0-0-1', title: 'Child 2' },
        ],
      },
    ];

    it('renders tree data', () => {
      renderWithTheme(<Tree treeData={treeData} />);
      expect(screen.getByText('Parent')).toBeInTheDocument();
    });

    it('handles selection', () => {
      const onSelect = vi.fn();
      renderWithTheme(<Tree treeData={treeData} onSelect={onSelect} />);
      fireEvent.click(screen.getByText('Parent'));
      expect(onSelect).toHaveBeenCalled();
    });

    it('supports virtual scrolling', () => {
      renderWithTheme(<Tree treeData={treeData} virtual height={300} />);
      expect(screen.getByText('Parent')).toBeInTheDocument();
    });

    it('supports showLine prop', () => {
      renderWithTheme(<Tree treeData={treeData} showLine />);
      expect(screen.getByText('Parent')).toBeInTheDocument();
    });
  });

  describe('Segmented', () => {
    const options = [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
    ];

    it('renders options', () => {
      renderWithTheme(<Segmented options={options} />);
      expect(screen.getByText('Daily')).toBeInTheDocument();
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });

    it('handles value change', () => {
      const onChange = vi.fn();
      renderWithTheme(<Segmented options={options} onChange={onChange} />);
      fireEvent.click(screen.getByText('Weekly'));
      expect(onChange).toHaveBeenCalledWith('weekly');
    });

    it('supports controlled value', () => {
      renderWithTheme(<Segmented options={options} value="weekly" />);
      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    const items = [
      { key: '1', label: 'Tab 1', children: <div>Content 1</div> },
      { key: '2', label: 'Tab 2', children: <div>Content 2</div> },
    ];

    it('renders tabs', () => {
      renderWithTheme(<Tabs items={items} />);
      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('renders active tab content', () => {
      renderWithTheme(<Tabs items={items} defaultActiveKey="1" />);
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('handles tab change', () => {
      const onChange = vi.fn();
      renderWithTheme(<Tabs items={items} onChange={onChange} />);
      fireEvent.click(screen.getByText('Tab 2'));
      expect(onChange).toHaveBeenCalledWith('2');
    });
  });

  describe('Collapse', () => {
    const items = [
      { key: '1', label: 'Panel 1', children: <div>Panel 1 content</div> },
      { key: '2', label: 'Panel 2', children: <div>Panel 2 content</div> },
    ];

    it('renders collapse panels', () => {
      renderWithTheme(<Collapse items={items} />);
      expect(screen.getByText('Panel 1')).toBeInTheDocument();
      expect(screen.getByText('Panel 2')).toBeInTheDocument();
    });

    it('toggles panel content on click', async () => {
      renderWithTheme(<Collapse items={items} />);
      fireEvent.click(screen.getByText('Panel 1'));
      expect(screen.getByText('Panel 1 content')).toBeInTheDocument();
    });
  });

  describe('RadioGroup', () => {
    const options = [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
      { label: 'Option C', value: 'c' },
    ];

    it('renders options', () => {
      renderWithTheme(<RadioGroup options={options} />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('handles value change', () => {
      const onChange = vi.fn();
      renderWithTheme(<RadioGroup options={options} onChange={onChange} />);
      fireEvent.click(screen.getByText('Option B'));
      expect(onChange).toHaveBeenCalled();
    });

    it('supports button style', () => {
      renderWithTheme(<RadioGroup options={options} optionType="button" />);
      expect(screen.getByText('Option A')).toBeInTheDocument();
    });
  });

  describe('TextArea', () => {
    it('renders textarea', () => {
      renderWithTheme(<TextArea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('handles value change', () => {
      const onChange = vi.fn();
      renderWithTheme(<TextArea onChange={onChange} />);
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });
      expect(onChange).toHaveBeenCalled();
    });

    it('supports controlled value', () => {
      renderWithTheme(<TextArea value="Initial value" />);
      expect(screen.getByDisplayValue('Initial value')).toBeInTheDocument();
    });

    it('supports autoSize', () => {
      renderWithTheme(<TextArea autoSize={{ minRows: 2, maxRows: 6 }} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports showCount', () => {
      renderWithTheme(<TextArea showCount maxLength={100} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Alert', () => {
    it('renders alert message', () => {
      renderWithTheme(<Alert message="Alert message" />);
      expect(screen.getByText('Alert message')).toBeInTheDocument();
    });

    it('supports different types', () => {
      renderWithTheme(<Alert message="Info" type="info" />);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('renders description', () => {
      renderWithTheme(<Alert message="Title" description="Description text" />);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('supports action', () => {
      renderWithTheme(<Alert message="Alert" action={<button>Action</button>} />);
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders Layout wrapper', () => {
      const { container } = renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders Layout.Header', () => {
      renderWithTheme(
        <Layout>
          <Layout.Header>Header content</Layout.Header>
        </Layout>
      );
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('renders Layout.Content', () => {
      renderWithTheme(
        <Layout>
          <Layout.Content>Main content</Layout.Content>
        </Layout>
      );
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('renders Layout.Sider', () => {
      renderWithTheme(
        <Layout>
          <Layout.Sider>Sidebar</Layout.Sider>
        </Layout>
      );
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
    });

    it('renders Layout.Footer', () => {
      renderWithTheme(
        <Layout>
          <Layout.Footer>Footer content</Layout.Footer>
        </Layout>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('renders Title', () => {
      renderWithTheme(<Typography.Title>Heading</Typography.Title>);
      expect(screen.getByText('Heading')).toBeInTheDocument();
    });

    it('renders Text', () => {
      renderWithTheme(<Typography.Text>Some text</Typography.Text>);
      expect(screen.getByText('Some text')).toBeInTheDocument();
    });

    it('renders Paragraph', () => {
      renderWithTheme(<Typography.Paragraph>Paragraph text</Typography.Paragraph>);
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
    });

    it('supports Text strong', () => {
      renderWithTheme(<Typography.Text strong>Strong text</Typography.Text>);
      expect(screen.getByText('Strong text')).toBeInTheDocument();
    });

    it('supports Text type (secondary)', () => {
      renderWithTheme(<Typography.Text type="secondary">Secondary text</Typography.Text>);
      expect(screen.getByText('Secondary text')).toBeInTheDocument();
    });

    it('supports Paragraph ellipsis', () => {
      renderWithTheme(
        <Typography.Paragraph ellipsis={{ rows: 2 }}>
          Long text content that might be truncated
        </Typography.Paragraph>
      );
      expect(screen.getByText('Long text content that might be truncated')).toBeInTheDocument();
    });
  });

  describe('VirtualList', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
    }));

    it('renders virtual list items', () => {
      renderWithTheme(
        <VirtualList
          data={data.slice(0, 10)}
          height={200}
          itemHeight={32}
          itemKey="id"
        >
          {(item) => <div>{item.name}</div>}
        </VirtualList>
      );
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });

    it('supports itemKey as function', () => {
      renderWithTheme(
        <VirtualList
          data={data.slice(0, 10)}
          height={200}
          itemHeight={32}
          itemKey={(item) => item.id}
        >
          {(item) => <div>{item.name}</div>}
        </VirtualList>
      );
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });
  });
});

describe('Primitives types export', () => {
  it('exports all component types', () => {
    // This test ensures type exports are available
    // Type checking happens at compile time, this just ensures imports work
    const buttonProps: Partial<ButtonProps> = { type: 'primary' };
    const cardProps: Partial<CardProps> = { title: 'Card' };
    const flexProps: Partial<FlexProps> = { vertical: true };
    const spaceProps: Partial<SpaceProps> = { size: 'small' };
    const treeProps: Partial<TreeProps> = { treeData: [] };
    const segmentedProps: Partial<SegmentedProps> = { options: [] };
    const tabsProps: Partial<TabsProps> = { items: [] };
    const collapseProps: Partial<CollapseProps> = { items: [] };
    const radioGroupProps: Partial<RadioGroupProps> = { options: [] };
    const textAreaProps: Partial<TextAreaProps> = { placeholder: 'test' };
    const alertProps: Partial<AlertProps> = { message: 'test' };
    const layoutProps: Partial<LayoutProps> = {};
    const typographyProps: Partial<TypographyProps> = {};
    const virtualListProps: Partial<VirtualListProps<{ id: string }>> = {
      data: [],
      height: 100,
      itemHeight: 32,
      itemKey: 'id',
    };

    expect(buttonProps).toBeDefined();
    expect(cardProps).toBeDefined();
    expect(flexProps).toBeDefined();
    expect(spaceProps).toBeDefined();
    expect(treeProps).toBeDefined();
    expect(segmentedProps).toBeDefined();
    expect(tabsProps).toBeDefined();
    expect(collapseProps).toBeDefined();
    expect(radioGroupProps).toBeDefined();
    expect(textAreaProps).toBeDefined();
    expect(alertProps).toBeDefined();
    expect(layoutProps).toBeDefined();
    expect(typographyProps).toBeDefined();
    expect(virtualListProps).toBeDefined();
  });

  it('exports TreeDataNode type', () => {
    const node: TreeDataNode = {
      key: 'test',
      title: 'Test Node',
      children: [],
    };
    expect(node.key).toBe('test');
  });
});
