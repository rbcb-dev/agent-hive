import type { StoryObj } from '@storybook/react-vite';
import { MarkdownViewer } from './MarkdownViewer';
declare const meta: {
    title: string;
    component: typeof MarkdownViewer;
    parameters: {
        layout: string;
    };
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, {
        content: string | null;
        filePath?: string;
        onLineClick?: (lineNumber: number) => void;
        highlightCode?: boolean;
        maxHeight?: number | string;
    }>) => import("react/jsx-runtime").JSX.Element)[];
    tags: string[];
    argTypes: {
        content: {
            control: "text";
            description: string;
        };
        filePath: {
            control: "text";
            description: string;
        };
        onLineClick: {
            action: string;
            description: string;
        };
        highlightCode: {
            control: "boolean";
            description: string;
        };
        maxHeight: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state shown when no content is provided
 */
export declare const Empty: Story;
/**
 * Default state with markdown content displayed in rendered mode
 */
export declare const WithContent: Story;
/**
 * With file path displayed in the header
 */
export declare const WithFilePath: Story;
/**
 * Raw mode showing markdown source with line numbers.
 * Use play function to switch to raw mode.
 */
export declare const RawMode: Story;
/**
 * Rendered mode (default) showing parsed markdown as HTML
 */
export declare const RenderedMode: Story;
/**
 * Interactive test - toggle between raw and rendered modes
 */
export declare const ModeToggleInteraction: Story;
/**
 * XSS sanitization test - verifies malicious content is stripped
 */
export declare const XssSanitization: Story;
/**
 * Test onLineClick callback in raw mode
 */
export declare const OnLineClickCallback: Story;
/**
 * Complex markdown with tables, code blocks, and nested lists
 */
export declare const ComplexMarkdown: Story;
/**
 * Minimal content - single line
 */
export declare const MinimalContent: Story;
/**
 * Demonstrates syntax highlighting for code blocks using Shiki.
 * Code blocks with language specifiers are highlighted with appropriate colors.
 *
 * Note: Theme is obtained from HiveThemeProvider context. Use Storybook toolbar
 * to switch between light/dark themes.
 */
export declare const SyntaxHighlighting: Story;
/**
 * Light theme syntax highlighting.
 *
 * Note: Theme is obtained from HiveThemeProvider context. Use Storybook toolbar
 * to switch between light/dark themes.
 */
export declare const SyntaxHighlightingLight: Story;
/**
 * With syntax highlighting disabled - falls back to plain code blocks
 */
export declare const NoSyntaxHighlighting: Story;
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
export declare const WithHighlightedCode: Story;
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
export declare const ComplexDocument: Story;
/**
 * Demonstrates copy-to-clipboard buttons on code blocks.
 * Hover over code blocks to see the copy button appear.
 * Click to copy code to clipboard - shows "Copied!" feedback for 2 seconds.
 * Inline code (in backticks) does NOT have a copy button.
 */
export declare const CopyToClipboard: Story;
/**
 * Demonstrates scrolling with maxHeight prop.
 * The content exceeds the container height, enabling vertical scrolling.
 */
export declare const WithMaxHeight: Story;
/**
 * Demonstrates scrolling with string-based maxHeight (viewport units).
 */
export declare const WithMaxHeightViewportUnits: Story;
/**
 * Without maxHeight - content expands naturally (no scrolling).
 */
export declare const WithoutMaxHeight: Story;
