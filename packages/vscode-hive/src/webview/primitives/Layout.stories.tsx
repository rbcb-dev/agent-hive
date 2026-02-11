import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Layout } from './Layout';

const meta = {
  title: 'Primitives/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    hasSider: {
      control: 'boolean',
      description: 'Use flexbox layout with sider',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class',
    },
  },
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

const headerStyle: React.CSSProperties = {
  color: '#fff',
  textAlign: 'center',
  height: 48,
  lineHeight: '48px',
  backgroundColor: '#4096ff',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  minHeight: 200,
  lineHeight: '200px',
  color: '#fff',
  backgroundColor: '#0958d9',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#4096ff',
};

const siderStyle: React.CSSProperties = {
  textAlign: 'center',
  lineHeight: '200px',
  color: '#fff',
  backgroundColor: '#1677ff',
};

/**
 * Basic layout with Header, Content, and Footer.
 */
export const Default: Story = {
  render: () => (
    <Layout>
      <Layout.Header style={headerStyle}>Header</Layout.Header>
      <Layout.Content style={contentStyle}>Content</Layout.Content>
      <Layout.Footer style={footerStyle}>Footer</Layout.Footer>
    </Layout>
  ),
};

/**
 * Layout with sidebar using Sider sub-component.
 */
export const WithSider: Story = {
  render: () => (
    <Layout>
      <Layout.Header style={headerStyle}>Header</Layout.Header>
      <Layout hasSider>
        <Layout.Sider style={siderStyle} width={200}>
          Sider
        </Layout.Sider>
        <Layout.Content style={contentStyle}>Content</Layout.Content>
      </Layout>
      <Layout.Footer style={footerStyle}>Footer</Layout.Footer>
    </Layout>
  ),
};

/**
 * Layout with sider on the right side.
 */
export const SiderRight: Story = {
  render: () => (
    <Layout>
      <Layout.Header style={headerStyle}>Header</Layout.Header>
      <Layout hasSider>
        <Layout.Content style={contentStyle}>Content</Layout.Content>
        <Layout.Sider style={siderStyle} width={200}>
          Right Sider
        </Layout.Sider>
      </Layout>
      <Layout.Footer style={footerStyle}>Footer</Layout.Footer>
    </Layout>
  ),
};

/**
 * Content-only layout (no header/footer).
 */
export const ContentOnly: Story = {
  render: () => (
    <Layout>
      <Layout.Content style={contentStyle}>Main Content</Layout.Content>
    </Layout>
  ),
};

/**
 * Play test: verifies all sub-components render.
 */
export const CompositionTest: Story = {
  render: () => (
    <Layout>
      <Layout.Header style={headerStyle}>Test Header</Layout.Header>
      <Layout hasSider>
        <Layout.Sider style={siderStyle} width={200}>
          Test Sider
        </Layout.Sider>
        <Layout.Content style={contentStyle}>Test Content</Layout.Content>
      </Layout>
      <Layout.Footer style={footerStyle}>Test Footer</Layout.Footer>
    </Layout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Test Header')).toBeInTheDocument();
    await expect(canvas.getByText('Test Sider')).toBeInTheDocument();
    await expect(canvas.getByText('Test Content')).toBeInTheDocument();
    await expect(canvas.getByText('Test Footer')).toBeInTheDocument();
  },
};

/**
 * Accessibility check: verifies semantic structure.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  render: () => (
    <Layout>
      <Layout.Header style={headerStyle}>Header</Layout.Header>
      <Layout.Content style={contentStyle}>Content</Layout.Content>
      <Layout.Footer style={footerStyle}>Footer</Layout.Footer>
    </Layout>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Header')).toBeInTheDocument();
    await expect(canvas.getByText('Content')).toBeInTheDocument();
    await expect(canvas.getByText('Footer')).toBeInTheDocument();
  },
};
