import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Typography } from './Typography';

const meta = {
  title: 'Primitives/Typography',
  component: Typography,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class',
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default typography with Title, Text, and Paragraph sub-components.
 */
export const Default: Story = {
  render: () => (
    <Typography>
      <Typography.Title level={2}>Introduction</Typography.Title>
      <Typography.Paragraph>
        This is a paragraph demonstrating the Typography primitive component.
        It wraps Ant Design Typography with a controlled API surface.
      </Typography.Paragraph>
      <Typography.Text>Standard text content.</Typography.Text>
    </Typography>
  ),
};

/**
 * All heading levels (1-5).
 */
export const HeadingLevels: Story = {
  render: () => (
    <Typography>
      <Typography.Title level={1}>Heading Level 1</Typography.Title>
      <Typography.Title level={2}>Heading Level 2</Typography.Title>
      <Typography.Title level={3}>Heading Level 3</Typography.Title>
      <Typography.Title level={4}>Heading Level 4</Typography.Title>
      <Typography.Title level={5}>Heading Level 5</Typography.Title>
    </Typography>
  ),
};

/**
 * Text variants showing different type colors.
 */
export const TextTypes: Story = {
  render: () => (
    <Typography>
      <Typography.Text>Default text</Typography.Text>
      <br />
      <Typography.Text type="secondary">Secondary text</Typography.Text>
      <br />
      <Typography.Text type="success">Success text</Typography.Text>
      <br />
      <Typography.Text type="warning">Warning text</Typography.Text>
      <br />
      <Typography.Text type="danger">Danger text</Typography.Text>
    </Typography>
  ),
};

/**
 * Text decorations: bold, italic, underline, strikethrough, mark, code, keyboard.
 */
export const TextDecorations: Story = {
  render: () => (
    <Typography>
      <Typography.Text strong>Bold text</Typography.Text>
      <br />
      <Typography.Text italic>Italic text</Typography.Text>
      <br />
      <Typography.Text underline>Underlined text</Typography.Text>
      <br />
      <Typography.Text delete>Strikethrough text</Typography.Text>
      <br />
      <Typography.Text mark>Marked text</Typography.Text>
      <br />
      <Typography.Text code>Code text</Typography.Text>
      <br />
      <Typography.Text keyboard>Keyboard text</Typography.Text>
    </Typography>
  ),
};

/**
 * Link sub-component.
 */
export const Links: Story = {
  render: () => (
    <Typography>
      <Typography.Link href="https://example.com" target="_blank">
        External link
      </Typography.Link>
      <br />
      <Typography.Link href="#" type="secondary">
        Secondary link
      </Typography.Link>
      <br />
      <Typography.Link href="#" disabled>
        Disabled link
      </Typography.Link>
    </Typography>
  ),
};

/**
 * Paragraph with ellipsis.
 */
export const EllipsisParagraph: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Typography>
        <Typography.Paragraph ellipsis={{ rows: 2, expandable: true }}>
          This is a very long paragraph that should be truncated after two rows.
          It demonstrates the ellipsis feature of the Typography.Paragraph component.
          When the text exceeds the specified number of rows, it will show an expand button
          that allows the user to see the full content. This is useful for displaying
          previews of long text content.
        </Typography.Paragraph>
      </Typography>
    </div>
  ),
};

/**
 * Play test: verifies all sub-components render correctly.
 */
export const CompositionTest: Story = {
  render: () => (
    <Typography>
      <Typography.Title level={3}>Test Title</Typography.Title>
      <Typography.Paragraph>Test paragraph content.</Typography.Paragraph>
      <Typography.Text strong>Test bold text</Typography.Text>
      <br />
      <Typography.Link href="#">Test link</Typography.Link>
    </Typography>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Test Title')).toBeInTheDocument();
    await expect(canvas.getByText('Test paragraph content.')).toBeInTheDocument();
    await expect(canvas.getByText('Test bold text')).toBeInTheDocument();
    await expect(canvas.getByText('Test link')).toBeInTheDocument();
  },
};

/**
 * Accessibility check: verifies heading levels and semantic structure.
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  render: () => (
    <Typography>
      <Typography.Title level={1}>Main Heading</Typography.Title>
      <Typography.Paragraph>
        Descriptive paragraph content for accessibility testing.
      </Typography.Paragraph>
      <Typography.Link href="https://example.com" target="_blank">
        Accessible link
      </Typography.Link>
    </Typography>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify heading role
    const heading = canvas.getByRole('heading', { level: 1 });
    await expect(heading).toBeInTheDocument();
    await expect(heading).toHaveTextContent('Main Heading');

    // Verify link
    const link = canvas.getByRole('link', { name: 'Accessible link' });
    await expect(link).toBeInTheDocument();
  },
};
