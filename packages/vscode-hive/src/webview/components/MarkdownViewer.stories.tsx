import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { MarkdownViewer } from './MarkdownViewer';

const meta = {
  title: 'Components/MarkdownViewer',
  component: MarkdownViewer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'Markdown content to display',
    },
    filePath: {
      control: 'text',
      description: 'File path for header display',
    },
    onLineClick: {
      action: 'lineClicked',
      description: 'Callback when a line is clicked in raw view',
    },
  },
} satisfies Meta<typeof MarkdownViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample markdown content for stories
const sampleMarkdown = `# Welcome to the Documentation

This is a **comprehensive** markdown example with various elements.

## Features

- Bullet point one
- Bullet point two
- Bullet point three

## Code Example

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
\`\`\`

## Table

| Feature | Status | Notes |
|---------|--------|-------|
| Auth    | Done   | Using JWT |
| API     | WIP    | REST endpoints |
| UI      | Todo   | React components |

## Links and Images

Visit [our website](https://example.com) for more info.

> This is a blockquote with some important information.

---

*Italic text* and **bold text** can be combined for ***emphasis***.
`;

/**
 * Empty state shown when no content is provided
 */
export const Empty: Story = {
  args: {
    content: null,
  },
};

/**
 * Default state with markdown content displayed in rendered mode
 */
export const WithContent: Story = {
  args: {
    content: sampleMarkdown,
    onLineClick: fn(),
  },
};

/**
 * With file path displayed in the header
 */
export const WithFilePath: Story = {
  args: {
    content: sampleMarkdown,
    filePath: 'docs/README.md',
    onLineClick: fn(),
  },
};

/**
 * Raw mode showing markdown source with line numbers.
 * Use play function to switch to raw mode.
 */
export const RawMode: Story = {
  args: {
    content: sampleMarkdown,
    filePath: 'docs/example.md',
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click the Raw button to switch to raw mode
    const rawButton = canvas.getByRole('button', { name: /raw/i });
    await userEvent.click(rawButton);
    
    // Verify we're in raw mode by checking for line numbers
    await expect(canvas.getByText('1')).toBeInTheDocument();
    await expect(canvas.getByTestId('line-1')).toBeInTheDocument();
  },
};

/**
 * Rendered mode (default) showing parsed markdown as HTML
 */
export const RenderedMode: Story = {
  args: {
    content: sampleMarkdown,
    filePath: 'docs/example.md',
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify rendered mode is active by checking for rendered heading
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to the Documentation');
    
    // Verify rendered button is active
    const renderedButton = canvas.getByRole('button', { name: /rendered/i });
    await expect(renderedButton).toHaveClass('active');
  },
};

/**
 * Interactive test - toggle between raw and rendered modes
 */
export const ModeToggleInteraction: Story = {
  args: {
    content: sampleMarkdown,
    filePath: 'docs/toggle-test.md',
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Start in rendered mode
    const renderedButton = canvas.getByRole('button', { name: /rendered/i });
    const rawButton = canvas.getByRole('button', { name: /raw/i });
    
    // Verify initial state (rendered mode)
    await expect(renderedButton).toHaveClass('active');
    await expect(rawButton).not.toHaveClass('active');
    await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Switch to raw mode
    await userEvent.click(rawButton);
    
    // Verify raw mode is now active
    await expect(rawButton).toHaveClass('active');
    await expect(renderedButton).not.toHaveClass('active');
    await expect(canvas.getByTestId('line-1')).toBeInTheDocument();
    
    // Switch back to rendered mode
    await userEvent.click(renderedButton);
    
    // Verify rendered mode is active again
    await expect(renderedButton).toHaveClass('active');
    await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument();
  },
};

// XSS test content with malicious payloads
const xssContent = `# XSS Test Document

This document tests that malicious content is sanitized.

## Script Injection Test

<script>alert("XSS attack via script tag")</script>

## Event Handler Test

<img src="invalid" onerror="alert('XSS via onerror')">

## JavaScript URL Test

[Click me](javascript:alert('XSS via href'))

## Normal Content After Malicious Content

This paragraph should render normally after the malicious content above has been sanitized.

The viewer should strip:
- Script tags
- Event handlers (onclick, onerror, etc.)
- JavaScript URLs
`;

/**
 * XSS sanitization test - verifies malicious content is stripped
 */
export const XssSanitization: Story = {
  args: {
    content: xssContent,
    filePath: 'security/xss-test.md',
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify heading renders (component works)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('XSS Test Document');
    
    // Verify normal content renders
    await expect(canvas.getByText(/This paragraph should render normally/)).toBeInTheDocument();
    
    // Check that script tags are sanitized by inspecting the rendered HTML
    const renderedContainer = canvasElement.querySelector('.markdown-rendered');
    if (renderedContainer) {
      // Script tag content should be stripped
      await expect(renderedContainer.innerHTML).not.toContain('<script>');
      await expect(renderedContainer.innerHTML).not.toContain('</script>');
      
      // Event handlers should be stripped
      await expect(renderedContainer.innerHTML).not.toContain('onerror');
      await expect(renderedContainer.innerHTML).not.toContain('onclick');
      
      // JavaScript URLs should be replaced
      await expect(renderedContainer.innerHTML).not.toContain('javascript:');
    }
  },
};

/**
 * Test onLineClick callback in raw mode
 */
export const OnLineClickCallback: Story = {
  args: {
    content: `# Line Click Test

Line 2 content
Line 3 content
Line 4 content

This is line 7.`,
    filePath: 'test/line-click.md',
    onLineClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Switch to raw mode to enable line clicking
    const rawButton = canvas.getByRole('button', { name: /raw/i });
    await userEvent.click(rawButton);
    
    // Click on line 1
    const line1 = canvas.getByTestId('line-1');
    await userEvent.click(line1);
    await expect(args.onLineClick).toHaveBeenCalledWith(1);
    
    // Click on line 3
    const line3 = canvas.getByTestId('line-3');
    await userEvent.click(line3);
    await expect(args.onLineClick).toHaveBeenCalledWith(3);
    
    // Click on line 7
    const line7 = canvas.getByTestId('line-7');
    await userEvent.click(line7);
    await expect(args.onLineClick).toHaveBeenCalledWith(7);
  },
};

/**
 * Complex markdown with tables, code blocks, and nested lists
 */
export const ComplexMarkdown: Story = {
  args: {
    content: `# Complex Markdown Example

## Nested Lists

1. First item
   - Nested bullet
   - Another nested bullet
     1. Deeply nested numbered
     2. Another deeply nested
2. Second item
3. Third item

## Task List (GFM)

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Code Blocks with Different Languages

### JavaScript

\`\`\`javascript
const greeting = 'Hello, World!';
console.log(greeting);
\`\`\`

### Python

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`

### Inline Code

Use \`const\` for constants and \`let\` for variables.

## Horizontal Rule

---

## Blockquote with Multiple Paragraphs

> First paragraph of the blockquote.
>
> Second paragraph with **bold** and *italic* text.
>
> > Nested blockquote for emphasis.

## Mixed Formatting

This paragraph has **bold**, *italic*, ***bold italic***, ~~strikethrough~~, and \`inline code\`.
`,
    filePath: 'docs/complex-example.md',
    onLineClick: fn(),
  },
};

/**
 * Minimal content - single line
 */
export const MinimalContent: Story = {
  args: {
    content: 'Just a simple line of text.',
    onLineClick: fn(),
  },
};
