import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { CodeViewer } from './CodeViewer';
import { createMockReviewThread, createMockAnnotation } from '../__stories__/mocks';

/**
 * CodeViewer renders code with VS Code-style syntax highlighting and line numbers.
 * 
 * ## Supported Languages
 * 
 * The component supports the following languages via Shiki:
 * - **TypeScript** (typescript, ts)
 * - **JavaScript** (javascript, js)
 * - **TSX** (tsx)
 * - **JSX** (jsx)
 * - **JSON** (json)
 * - **Markdown** (markdown, md)
 * - **HTML** (html)
 * - **CSS** (css)
 * - **YAML** (yaml, yml)
 * - **Shell** (shell, sh, bash)
 * 
 * Unsupported languages fall back to JavaScript highlighting.
 * 
 * ## Features
 * - Syntax highlighting via Shiki (TextMate grammars)
 * - Configurable line numbers (show/hide, custom start)
 * - Line highlighting for emphasis
 * - Diff line types (add/remove/context) for code changes
 * - Dark/light theme support
 * - Thread markers in gutter for code review
 * - Inline thread expansion with reply/resolve
 */
const meta = {
  title: 'Components/CodeViewer',
  component: CodeViewer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    language: {
      control: 'select',
      options: [
        'typescript',
        'javascript',
        'tsx',
        'jsx',
        'json',
        'markdown',
        'html',
        'css',
        'yaml',
        'shell',
      ],
      description: 'Programming language for syntax highlighting',
    },
    theme: {
      control: 'radio',
      options: ['dark', 'light'],
      description: 'Color theme (dark or light)',
    },
    showLineNumbers: {
      control: 'boolean',
      description: 'Whether to show line numbers',
    },
    startLine: {
      control: 'number',
      description: 'Starting line number (default: 1)',
    },
  },
} satisfies Meta<typeof CodeViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Sample code snippets for stories
// =============================================================================

const typescriptCode = `interface User {
  id: string;
  name: string;
  email: string;
}

function createUser(data: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    name: data.name ?? 'Anonymous',
    email: data.email ?? '',
  };
}

export { createUser, type User };`;

const jsonCode = `{
  "name": "agent-hive",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}`;

const markdownCode = `# Welcome to Agent Hive

This is a **context-driven** development system.

## Features

- Plan-first workflow
- Human review checkpoints
- Isolated worktrees

\`\`\`typescript
const hive = new Hive();
\`\`\``;

const multiLanguageCode = {
  typescript: typescriptCode,
  javascript: `const createUser = (data) => ({
  id: crypto.randomUUID(),
  name: data.name ?? 'Anonymous',
  email: data.email ?? '',
});

module.exports = { createUser };`,
  json: jsonCode,
  markdown: markdownCode,
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to the page.</p>
</body>
</html>`,
  css: `/* Button styles */
.button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  background: var(--primary-color);
  color: white;
}

.button:hover {
  background: var(--primary-hover);
}`,
  yaml: `name: CI Pipeline
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test`,
  shell: `#!/bin/bash

# Build and deploy script
echo "Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful!"
  npm run deploy
else
  echo "Build failed!"
  exit 1
fi`,
};

// =============================================================================
// Basic Stories
// =============================================================================

/**
 * Empty state when no code is provided
 */
export const Empty: Story = {
  args: {
    code: '',
    language: 'typescript',
  },
};

/**
 * Basic code display with TypeScript syntax highlighting
 */
export const WithCode: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
  },
};

/**
 * Code with line numbers visible (default behavior)
 */
export const WithLineNumbers: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    showLineNumbers: true,
  },
};

/**
 * Code without line numbers
 */
export const WithoutLineNumbers: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    showLineNumbers: false,
  },
};

/**
 * Code starting from a specific line number (useful for file excerpts)
 */
export const CustomStartLine: Story = {
  args: {
    code: `  const result = await fetchData();
  if (!result.ok) {
    throw new Error('Failed to fetch');
  }
  return result.data;`,
    language: 'typescript',
    startLine: 42,
  },
};

// =============================================================================
// Highlighting Stories
// =============================================================================

/**
 * Lines can be highlighted to draw attention to specific code
 */
export const Highlighting: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    highlightLines: [7, 8, 9, 10, 11],
  },
};

/**
 * Diff-style line types for showing code changes
 */
export const DiffLineTypes: Story = {
  args: {
    code: `import React from 'react';

function OldComponent() {
function NewComponent() {
  const [state, setState] = useState(0);
  return <div>Hello</div>;
}`,
    language: 'tsx',
    lineTypes: {
      3: 'remove',
      4: 'add',
      5: 'add',
    },
  },
};

// =============================================================================
// Theme Stories
// =============================================================================

/**
 * Dark theme (default)
 */
export const DarkTheme: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    theme: 'dark',
  },
};

/**
 * Light theme for bright environments
 */
export const LightTheme: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    theme: 'light',
  },
  parameters: {
    backgrounds: { default: 'vscode-light' },
  },
};

// =============================================================================
// Language Support Stories
// =============================================================================

/**
 * JavaScript syntax highlighting
 */
export const JavaScript: Story = {
  args: {
    code: multiLanguageCode.javascript,
    language: 'javascript',
  },
};

/**
 * JSON syntax highlighting
 */
export const JSON: Story = {
  args: {
    code: multiLanguageCode.json,
    language: 'json',
  },
};

/**
 * Markdown syntax highlighting
 */
export const Markdown: Story = {
  args: {
    code: multiLanguageCode.markdown,
    language: 'markdown',
  },
};

/**
 * HTML syntax highlighting
 */
export const HTML: Story = {
  args: {
    code: multiLanguageCode.html,
    language: 'html',
  },
};

/**
 * CSS syntax highlighting
 */
export const CSS: Story = {
  args: {
    code: multiLanguageCode.css,
    language: 'css',
  },
};

/**
 * YAML syntax highlighting
 */
export const YAML: Story = {
  args: {
    code: multiLanguageCode.yaml,
    language: 'yaml',
  },
};

/**
 * Shell/Bash syntax highlighting
 */
export const Shell: Story = {
  args: {
    code: multiLanguageCode.shell,
    language: 'shell',
  },
};

/**
 * Unknown languages fall back to JavaScript highlighting
 */
export const UnknownLanguage: Story = {
  args: {
    code: 'Some code in an unknown language\nwith multiple lines',
    language: 'unknown-lang',
  },
};

// =============================================================================
// Thread Integration Stories
// =============================================================================

/**
 * Code with review thread markers in the gutter
 */
export const WithThreads: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    threads: [
      createMockReviewThread({
        id: 'thread-1',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        status: 'open',
        annotations: [
          createMockAnnotation({
            body: 'Consider adding validation for the id field.',
            author: { type: 'human', name: 'Reviewer' },
          }),
        ],
      }),
    ],
    onThreadClick: fn(),
    onThreadReply: fn(),
    onThreadResolve: fn(),
  },
};

/**
 * Multiple threads on different lines
 */
export const MultipleThreads: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    threads: [
      createMockReviewThread({
        id: 'thread-1',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        status: 'open',
        annotations: [
          createMockAnnotation({
            body: 'Consider adding JSDoc comments for the interface.',
            author: { type: 'llm', name: 'Claude', agentId: 'claude-1' },
          }),
        ],
      }),
      createMockReviewThread({
        id: 'thread-2',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        status: 'open',
        annotations: [
          createMockAnnotation({
            body: 'This function should handle edge cases.',
            author: { type: 'human', name: 'Alice' },
          }),
        ],
      }),
      createMockReviewThread({
        id: 'thread-3',
        range: { start: { line: 12, character: 0 }, end: { line: 12, character: 10 } },
        status: 'resolved',
        annotations: [
          createMockAnnotation({
            body: 'Fixed the export syntax.',
            author: { type: 'human', name: 'Bob' },
          }),
        ],
      }),
    ],
    onThreadClick: fn(),
    onThreadReply: fn(),
    onThreadResolve: fn(),
  },
};

/**
 * Multiple threads on the same line (stacked)
 */
export const StackedThreads: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    threads: [
      createMockReviewThread({
        id: 'thread-1',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        annotations: [
          createMockAnnotation({ body: 'First comment on this line' }),
        ],
      }),
      createMockReviewThread({
        id: 'thread-2',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        annotations: [
          createMockAnnotation({ body: 'Second comment on this line' }),
        ],
      }),
      createMockReviewThread({
        id: 'thread-3',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        annotations: [
          createMockAnnotation({ body: 'Third comment on this line' }),
        ],
      }),
    ],
    onThreadClick: fn(),
    onThreadReply: fn(),
    onThreadResolve: fn(),
  },
};

/**
 * Resolved thread has different marker styling
 */
export const ResolvedThread: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    threads: [
      createMockReviewThread({
        id: 'resolved-thread',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        status: 'resolved',
        annotations: [
          createMockAnnotation({
            body: 'This issue has been addressed.',
            author: { type: 'human', name: 'Reviewer' },
          }),
        ],
      }),
    ],
    onThreadClick: fn(),
    onThreadReply: fn(),
    onThreadResolve: fn(),
  },
};

// =============================================================================
// Interactive Stories (with play functions)
// =============================================================================

/**
 * Click a thread marker to expand the inline thread panel
 */
export const ClickThreadMarker: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    threads: [
      createMockReviewThread({
        id: 'interactive-thread',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        annotations: [
          createMockAnnotation({
            body: 'Click the marker to see this thread!',
            author: { type: 'human', name: 'Tester' },
          }),
        ],
      }),
    ],
    onThreadClick: fn(),
    onThreadReply: fn(),
    onThreadResolve: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for async highlighting to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Find and click the thread marker
    const marker = await canvas.findByTestId('thread-marker-5');
    await userEvent.click(marker);

    // Verify the callback was called
    await expect(args.onThreadClick).toHaveBeenCalled();

    // The inline thread panel should now be visible
    const inlineThread = await canvas.findByTestId('inline-thread');
    await expect(inlineThread).toBeInTheDocument();
  },
};

/**
 * Accessibility: Verify proper ARIA attributes are present
 */
export const AccessibilityCheck: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
    threads: [
      createMockReviewThread({
        id: 'a11y-thread',
        range: { start: { line: 5, character: 0 }, end: { line: 5, character: 10 } },
        annotations: [
          createMockAnnotation({ body: 'Accessibility test thread' }),
        ],
      }),
    ],
    onThreadClick: fn(),
    onThreadReply: fn(),
    onThreadResolve: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the code viewer has proper role and label
    const viewer = canvas.getByTestId('code-viewer');
    await expect(viewer).toHaveAttribute('role', 'region');
    await expect(viewer).toHaveAttribute('aria-label', 'Code viewer');

    // Verify thread marker has accessible label
    const marker = await canvas.findByTestId('thread-marker-5');
    await expect(marker).toHaveAttribute('aria-label');
    const label = marker.getAttribute('aria-label');
    await expect(label).toContain('thread');
    await expect(label).toContain('line');
  },
};

/**
 * Copy button appears on hover in the top-right corner.
 * Click to copy code to clipboard - shows "Copied!" feedback for 2 seconds.
 */
export const CopyToClipboard: Story = {
  args: {
    code: typescriptCode,
    language: 'typescript',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Copy button should be present
    const copyButton = canvas.getByTestId('copy-button');
    await expect(copyButton).toBeInTheDocument();
    await expect(copyButton).toHaveAttribute('aria-label', 'Copy code to clipboard');
    
    // Click to test the interaction (will show "Copied!")
    await userEvent.click(copyButton);
    await expect(copyButton).toHaveTextContent('Copied!');
  },
};

// =============================================================================
// Edge Cases
// =============================================================================

/**
 * Very long code with many lines
 */
export const LongCode: Story = {
  args: {
    code: Array.from({ length: 100 }, (_, i) => `// Line ${i + 1}`).join('\n'),
    language: 'typescript',
  },
};

/**
 * Code with very long lines
 */
export const LongLines: Story = {
  args: {
    code: `const veryLongVariableName = "This is an extremely long string value that goes on and on and on to test horizontal scrolling behavior in the code viewer component";
const normalLine = "short";
const anotherLongLine = { key1: "value1", key2: "value2", key3: "value3", key4: "value4", key5: "value5", key6: "value6", key7: "value7" };`,
    language: 'typescript',
  },
};

/**
 * Single line of code
 */
export const SingleLine: Story = {
  args: {
    code: 'console.log("Hello, World!");',
    language: 'javascript',
  },
};

/**
 * Code with special characters and escapes
 */
export const SpecialCharacters: Story = {
  args: {
    code: `const regex = /[a-z]+\\d*\\s*/gi;
const template = \`Hello, \${name}!\`;
const escaped = "Line 1\\nLine 2\\tTabbed";
const unicode = "こんにちは 🎉 emoji test";`,
    language: 'typescript',
  },
};
