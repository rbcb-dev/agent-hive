import type { StoryObj } from '@storybook/react-vite';
import { CodeViewer } from './CodeViewer';
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
 * - Dark/light theme support (via HiveThemeProvider context)
 * - Thread markers in gutter for code review
 * - Inline thread expansion with reply/resolve
 *
 * ## Breaking Change
 * Theme is now obtained from HiveThemeProvider context. Use the Storybook toolbar
 * theme switcher to toggle between light and dark themes.
 */
declare const meta: {
    title: string;
    component: typeof CodeViewer;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        language: {
            control: "select";
            options: string[];
            description: string;
        };
        showLineNumbers: {
            control: "boolean";
            description: string;
        };
        startLine: {
            control: "number";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state when no code is provided
 */
export declare const Empty: Story;
/**
 * Basic code display with TypeScript syntax highlighting
 */
export declare const WithCode: Story;
/**
 * Code with line numbers visible (default behavior)
 */
export declare const WithLineNumbers: Story;
/**
 * Code without line numbers
 */
export declare const WithoutLineNumbers: Story;
/**
 * Code starting from a specific line number (useful for file excerpts)
 */
export declare const CustomStartLine: Story;
/**
 * Lines can be highlighted to draw attention to specific code
 */
export declare const Highlighting: Story;
/**
 * Diff-style line types for showing code changes
 */
export declare const DiffLineTypes: Story;
/**
 * Dark theme - uses HiveThemeProvider context.
 * Use the Storybook toolbar theme switcher to toggle between light and dark themes.
 *
 * Note: Theme is no longer a component prop. It's obtained from HiveThemeProvider context.
 */
export declare const DarkTheme: Story;
/**
 * Light theme - uses HiveThemeProvider context.
 * Use the Storybook toolbar theme switcher to toggle between light and dark themes.
 *
 * Note: Theme is no longer a component prop. It's obtained from HiveThemeProvider context.
 */
export declare const LightTheme: Story;
/**
 * JavaScript syntax highlighting
 */
export declare const JavaScript: Story;
/**
 * JSON syntax highlighting
 */
export declare const JSON: Story;
/**
 * Markdown syntax highlighting
 */
export declare const Markdown: Story;
/**
 * HTML syntax highlighting
 */
export declare const HTML: Story;
/**
 * CSS syntax highlighting
 */
export declare const CSS: Story;
/**
 * YAML syntax highlighting
 */
export declare const YAML: Story;
/**
 * Shell/Bash syntax highlighting
 */
export declare const Shell: Story;
/**
 * Unknown languages fall back to JavaScript highlighting
 */
export declare const UnknownLanguage: Story;
/**
 * Code with review thread markers in the gutter
 */
export declare const WithThreads: Story;
/**
 * Multiple threads on different lines
 */
export declare const MultipleThreads: Story;
/**
 * Multiple threads on the same line (stacked)
 */
export declare const StackedThreads: Story;
/**
 * Resolved thread has different marker styling
 */
export declare const ResolvedThread: Story;
/**
 * Click a thread marker to expand the inline thread panel
 */
export declare const ClickThreadMarker: Story;
/**
 * Accessibility: Verify proper ARIA attributes are present
 */
export declare const AccessibilityCheck: Story;
/**
 * Copy button appears on hover in the top-right corner.
 * Click to copy code to clipboard - shows "Copied!" feedback for 2 seconds.
 */
export declare const CopyToClipboard: Story;
/**
 * Very long code with many lines
 */
export declare const LongCode: Story;
/**
 * Code with very long lines
 */
export declare const LongLines: Story;
/**
 * Single line of code
 */
export declare const SingleLine: Story;
/**
 * Code with special characters and escapes
 */
export declare const SpecialCharacters: Story;
/**
 * Demonstrates the copy-to-clipboard functionality.
 * Hover over the code block to reveal the copy button in the top-right corner.
 * Click to copy the entire code content to clipboard - shows "Copied!" feedback.
 */
export declare const WithCopyButton: Story;
/**
 * Comprehensive showcase of all 10 supported languages.
 * Each language is shown with appropriate syntax highlighting.
 *
 * Supported languages:
 * - TypeScript (ts)
 * - JavaScript (js)
 * - TSX
 * - JSX
 * - JSON
 * - Markdown (md)
 * - HTML
 * - CSS
 * - YAML (yml)
 * - Shell (sh, bash)
 */
export declare const AllLanguages: Story;
