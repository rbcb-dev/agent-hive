import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { MarkdownViewer } from './MarkdownViewer';

const meta = {
  title: 'Components/MarkdownViewer',
  component: MarkdownViewer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: 400 }}>
        <Story />
      </div>
    ),
  ],
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
    highlightCode: {
      control: 'boolean',
      description: 'Whether to enable code block syntax highlighting',
    },
    maxHeight: {
      control: 'text',
      description:
        'Maximum height for the viewer (enables scrolling). Can be number (px) or CSS string.',
    },
    // Note: theme is no longer a prop - it comes from HiveThemeProvider context.
    // Use the Storybook toolbar theme switcher to toggle between light and dark themes.
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
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Welcome to the Documentation',
    );

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
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'XSS Test Document',
    );

    // Verify normal content renders
    await expect(
      canvas.getByText(/This paragraph should render normally/),
    ).toBeInTheDocument();

    // Check that script tags are sanitized by inspecting the rendered HTML
    const renderedContainer = canvasElement.querySelector('.markdown-rendered');
    if (renderedContainer) {
      const html = renderedContainer.innerHTML;

      // Script tag content should be stripped
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('</script>');

      // Event handlers should not have dangerous attributes (img without onerror handler)
      // The img tag should not have the onerror= attribute
      const hasUnsafeEventHandler = /on\w+\s*=/.test(html);
      expect(hasUnsafeEventHandler).toBe(false);

      // JavaScript URLs should be replaced or removed
      expect(html).not.toContain('javascript:');
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

// Syntax highlighting demo content
const syntaxHighlightingMarkdown = `# Code Block Highlighting Demo

This demonstrates Shiki syntax highlighting for fenced code blocks.

## TypeScript Example

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

const user: User = await fetchUser('123');
console.log(user.name);
\`\`\`

## JavaScript Example

\`\`\`javascript
const greeting = 'Hello, World!';
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(greeting, doubled);
\`\`\`

## JSON Configuration

\`\`\`json
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
\`\`\`

## Shell Commands

\`\`\`shell
npm install
npm run build
npm run test
\`\`\`

## Inline code like \`const x = 1\` is not highlighted.
`;

/**
 * Demonstrates syntax highlighting for code blocks using Shiki.
 * Code blocks with language specifiers are highlighted with appropriate colors.
 *
 * Note: Theme is obtained from HiveThemeProvider context. Use Storybook toolbar
 * to switch between light/dark themes.
 */
export const SyntaxHighlighting: Story = {
  args: {
    content: syntaxHighlightingMarkdown,
    filePath: 'docs/syntax-demo.md',
    highlightCode: true,
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for rendering to complete (check for heading)
    await expect(
      canvas.findByRole('heading', { level: 1 }),
    ).resolves.toHaveTextContent('Code Block Highlighting Demo');

    // Verify that code blocks are rendered (Shiki adds pre.shiki elements)
    const container = canvasElement.querySelector('.markdown-rendered');
    await expect(container?.innerHTML).toContain('shiki');

    // Verify TypeScript code is present
    await expect(
      canvas.findByText(/interface User/),
    ).resolves.toBeInTheDocument();
  },
};

/**
 * Light theme syntax highlighting.
 *
 * Note: Theme is obtained from HiveThemeProvider context. Use Storybook toolbar
 * to switch between light/dark themes.
 */
export const SyntaxHighlightingLight: Story = {
  args: {
    content: syntaxHighlightingMarkdown,
    filePath: 'docs/syntax-demo.md',
    highlightCode: true,
    onLineClick: fn(),
  },
  parameters: {
    backgrounds: { default: 'vscode-light' },
    // Hint to Storybook decorators that this should use light theme
    theme: 'light',
  },
};

/**
 * With syntax highlighting disabled - falls back to plain code blocks
 */
export const NoSyntaxHighlighting: Story = {
  args: {
    content: syntaxHighlightingMarkdown,
    filePath: 'docs/no-highlight.md',
    highlightCode: false,
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for rendering to complete
    await expect(
      canvas.findByRole('heading', { level: 1 }),
    ).resolves.toHaveTextContent('Code Block Highlighting Demo');

    // Verify code is still rendered (but without shiki classes)
    await expect(
      canvas.findByText(/interface User/),
    ).resolves.toBeInTheDocument();
  },
};

// =============================================================================
// Highlighted Code Block Stories
// =============================================================================

// Content specifically for demonstrating syntax-highlighted code blocks
const highlightedCodeMarkdown = `# Syntax-Highlighted Code Examples

This document showcases code blocks with Shiki syntax highlighting.

## TypeScript with Type Annotations

\`\`\`typescript
interface Person {
  name: string;
  age: number;
  email?: string;
}

async function fetchPerson(id: string): Promise<Person> {
  const response = await fetch(\`/api/person/\${id}\`);
  if (!response.ok) {
    throw new Error('Failed to fetch person');
  }
  return response.json();
}
\`\`\`

## React Component (TSX)

\`\`\`tsx
import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue);

  return (
    <div className="counter">
      <span aria-label="Current count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
\`\`\`

## Shell Script

\`\`\`bash
#!/bin/bash

# Deploy script with error handling
set -e

echo "Starting deployment..."
npm run build

if [ -d "dist" ]; then
    npm run deploy
    echo "Deployment successful!"
else
    echo "Build failed - no dist directory"
    exit 1
fi
\`\`\`

The code blocks above demonstrate proper syntax coloring for keywords, strings, types, and functions.
`;

/**
 * Demonstrates syntax-highlighted code blocks within markdown.
 *
 * Uses Shiki for accurate TextMate-based highlighting with:
 * - TypeScript type annotations and keywords
 * - TSX/JSX components with JSX syntax
 * - Shell scripts with variables and control flow
 *
 * The highlighting matches VS Code's theme colors.
 *
 * Note: Theme is obtained from HiveThemeProvider context. Use Storybook toolbar
 * to switch between light/dark themes.
 */
export const WithHighlightedCode: Story = {
  args: {
    content: highlightedCodeMarkdown,
    filePath: 'docs/highlighted-code-demo.md',
    highlightCode: true,
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for rendering
    await expect(
      canvas.findByRole('heading', { level: 1 }),
    ).resolves.toHaveTextContent('Syntax-Highlighted Code Examples');

    // Verify code blocks with highlighting are present
    const container = canvasElement.querySelector('.markdown-rendered');
    await expect(container?.innerHTML).toContain('shiki');

    // Verify TypeScript code is rendered
    await expect(
      canvas.findByText(/interface Person/),
    ).resolves.toBeInTheDocument();
  },
};

// =============================================================================
// Complex Document Stories
// =============================================================================

// Comprehensive markdown document with all element types
const complexDocumentMarkdown = `# Complex Document Example

A comprehensive markdown document demonstrating all supported elements.

## Table of Contents

1. [Headings](#headings)
2. [Lists](#lists)
3. [Tables](#tables)
4. [Code Blocks](#code-blocks)
5. [Formatting](#formatting)

---

## Headings

### Third Level Heading

#### Fourth Level Heading

##### Fifth Level Heading

## Lists

### Unordered List

- First item
- Second item with **bold** and *italic* text
  - Nested item one
  - Nested item two
    - Deeply nested
- Third item with \`inline code\`

### Ordered List

1. First numbered item
2. Second numbered item
   1. Nested numbered
   2. Another nested
3. Third numbered item

### Task List

- [x] Completed task
- [x] Another completed task
- [ ] Pending task
- [ ] Another pending task

## Tables

| Feature | Status | Priority | Assigned |
|---------|--------|----------|----------|
| Auth | ✅ Done | High | Alice |
| Dashboard | 🚧 WIP | Medium | Bob |
| Reports | ⏳ Pending | Low | Carol |
| Settings | 📋 Planned | Low | - |

### Complex Table with Alignment

| Left | Center | Right |
|:-----|:------:|------:|
| L1 | C1 | R1 |
| L2 | C2 | R2 |
| L3 | C3 | R3 |

## Code Blocks

### Inline Code

Use \`const\` for constants, \`let\` for variables, and \`function\` for declarations.

### TypeScript

\`\`\`typescript
interface Config {
  theme: 'light' | 'dark';
  language: string;
  features: string[];
}

const config: Config = {
  theme: 'dark',
  language: 'en',
  features: ['syntax-highlighting', 'line-numbers']
};
\`\`\`

### JSON Configuration

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true
  }
}
\`\`\`

## Formatting

### Text Styles

- **Bold text** for emphasis
- *Italic text* for subtle emphasis  
- ***Bold and italic*** combined
- ~~Strikethrough~~ for deleted content
- \`inline code\` for code snippets

### Blockquotes

> This is a blockquote. It can contain **formatted** text.
>
> Multiple paragraphs are supported.
>
> > Nested blockquotes work too.

### Links and Images

Visit the [documentation](https://example.com/docs) for more info.

External link: [GitHub](https://github.com)

---

## Summary

This document demonstrates the rendering capabilities of the MarkdownViewer component, including proper handling of:

1. Multiple heading levels
2. Various list types
3. Complex tables
4. Syntax-highlighted code blocks
5. Rich text formatting
6. Blockquotes and horizontal rules
`;

/**
 * Complex document with headings, lists, tables, and code blocks.
 *
 * Demonstrates the full rendering capability including:
 * - Multiple heading levels (h1-h5)
 * - Unordered, ordered, and task lists with nesting
 * - Tables with alignment and emoji
 * - Fenced code blocks with syntax highlighting
 * - Text formatting (bold, italic, strikethrough, inline code)
 * - Blockquotes with nesting
 * - Horizontal rules
 * - Links
 */
export const ComplexDocument: Story = {
  args: {
    content: complexDocumentMarkdown,
    filePath: 'docs/complete-example.md',
    highlightCode: true,
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify heading renders
    await expect(
      canvas.findByRole('heading', { level: 1 }),
    ).resolves.toHaveTextContent('Complex Document Example');

    // Verify table is rendered
    await expect(canvas.findByText('Feature')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Status')).resolves.toBeInTheDocument();

    // Verify code block is present
    await expect(
      canvas.findByText(/interface Config/),
    ).resolves.toBeInTheDocument();

    // Verify task list items
    await expect(
      canvas.findByText('Completed task'),
    ).resolves.toBeInTheDocument();
  },
};

// =============================================================================
// Copy-to-Clipboard Story
// =============================================================================

// Code block copy button demo content
const copyButtonDemoMarkdown = `# Copy-to-Clipboard Demo

This demonstrates the copy button feature for code blocks.

## Single-line Code

\`\`\`javascript
const greeting = 'Hello, World!';
\`\`\`

## Multi-line Code

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

## Inline Code (no copy button)

This is some \`inline code\` that should NOT have a copy button.

Use \`const\` for constants and \`let\` for variables.
`;

/**
 * Demonstrates copy-to-clipboard buttons on code blocks.
 * Hover over code blocks to see the copy button appear.
 * Click to copy code to clipboard - shows "Copied!" feedback for 2 seconds.
 * Inline code (in backticks) does NOT have a copy button.
 */
export const CopyToClipboard: Story = {
  args: {
    content: copyButtonDemoMarkdown,
    filePath: 'docs/copy-demo.md',
    highlightCode: true,
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for rendering to complete
    await expect(
      canvas.findByRole('heading', { level: 1 }),
    ).resolves.toHaveTextContent('Copy-to-Clipboard Demo');

    // Verify code blocks are rendered
    const container = canvasElement.querySelector('.markdown-rendered');
    await expect(container?.innerHTML).toContain('shiki');

    // Should have 2 copy buttons (for 2 fenced code blocks)
    const copyButtons = await canvas.findAllByRole('button', {
      name: /copy code/i,
    });
    await expect(copyButtons).toHaveLength(2);

    // Verify the buttons have correct initial text
    await expect(copyButtons[0]).toHaveTextContent('Copy');

    // Click the first copy button
    await userEvent.click(copyButtons[0]);

    // Should show "Copied!" feedback
    await expect(copyButtons[0]).toHaveTextContent('Copied!');
    await expect(
      canvas.findByText('Pending task'),
    ).resolves.toBeInTheDocument();
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for MarkdownViewer.
 *
 * Verifies:
 * - Headings are accessible via role queries
 * - Mode toggle buttons (Rendered/Raw) are accessible
 * - Content text is visible for screen readers
 * - Keyboard Tab navigates between interactive elements
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    content: sampleMarkdown,
    filePath: 'docs/a11y-check.md',
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify heading is accessible via role
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Welcome to the Documentation',
    );

    // Verify mode toggle buttons are accessible
    const renderedButton = canvas.getByRole('button', { name: /rendered/i });
    const rawButton = canvas.getByRole('button', { name: /raw/i });
    await expect(renderedButton).toBeInTheDocument();
    await expect(rawButton).toBeInTheDocument();

    // Verify content text is visible
    await expect(canvas.getByText(/comprehensive/i)).toBeInTheDocument();

    // Tab navigation should move focus through interactive elements
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(document.body);
  },
};

// =============================================================================
// Scrolling Stories
// =============================================================================

// Long content for scrolling demo
const longScrollingMarkdown = `# Long Document for Scrolling Demo

This document demonstrates scrolling behavior with the maxHeight prop.

## Section 1: Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

## Section 2: Code Examples

\`\`\`typescript
interface ScrollableContent {
  id: string;
  title: string;
  content: string;
  sections: Section[];
}

function processContent(data: ScrollableContent): void {
  console.log('Processing:', data.title);
  data.sections.forEach(section => {
    console.log('Section:', section.name);
  });
}
\`\`\`

## Section 3: More Content

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.

### Subsection 3.1

- Item one with some longer text to demonstrate line wrapping
- Item two with additional details
- Item three with even more content

### Subsection 3.2

| Column A | Column B | Column C |
|----------|----------|----------|
| Row 1    | Data     | Value    |
| Row 2    | Data     | Value    |
| Row 3    | Data     | Value    |

## Section 4: Blockquotes

> This is a blockquote that spans multiple lines to demonstrate how longer content is handled within the scrollable container.
>
> Second paragraph in the blockquote.

## Section 5: Final Section

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.

## Section 6: Even More Content

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores.

## Section 7: Conclusion

This concludes the long document demonstration. The content should be scrollable when maxHeight is applied.
`;

/**
 * Demonstrates scrolling with maxHeight prop.
 * The content exceeds the container height, enabling vertical scrolling.
 */
export const WithMaxHeight: Story = {
  args: {
    content: longScrollingMarkdown,
    filePath: 'docs/long-document.md',
    maxHeight: 300,
    highlightCode: true,
    onLineClick: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify heading renders
    await expect(
      canvas.findByRole('heading', { level: 1 }),
    ).resolves.toHaveTextContent('Long Document for Scrolling Demo');

    // Verify the container has scrollable styles
    const viewer = canvasElement.querySelector('.markdown-viewer');
    expect(viewer).toHaveStyle({ maxHeight: '300px', overflow: 'auto' });

    // Verify content is scrollable (scrollHeight > clientHeight)
    if (viewer) {
      expect(viewer.scrollHeight).toBeGreaterThan(viewer.clientHeight);
    }
  },
};

/**
 * Demonstrates scrolling with string-based maxHeight (viewport units).
 */
export const WithMaxHeightViewportUnits: Story = {
  args: {
    content: longScrollingMarkdown,
    filePath: 'docs/viewport-scroll.md',
    maxHeight: '50vh',
    highlightCode: true,
    onLineClick: fn(),
  },
};

/**
 * Without maxHeight - content expands naturally (no scrolling).
 */
export const WithoutMaxHeight: Story = {
  args: {
    content: longScrollingMarkdown,
    filePath: 'docs/no-scroll.md',
    highlightCode: true,
    onLineClick: fn(),
  },
  parameters: {
    // Override the decorator to show full height behavior
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ height: 'auto' }}>
        <Story />
      </div>
    ),
  ],
};
