/**
 * useMarkdownRenderer hook - Renders markdown with syntax-highlighted code blocks
 * Uses marked for markdown parsing and Shiki for code highlighting.
 */
export interface UseMarkdownRendererOptions {
    markdown: string;
    highlightCode?: boolean;
    theme?: 'light' | 'dark';
}
export interface UseMarkdownRendererResult {
    html: string;
    isLoading: boolean;
}
/**
 * Hook for rendering markdown with optional syntax highlighting for code blocks.
 * Uses Shiki for code highlighting and sanitizes output to prevent XSS.
 *
 * @param options - Configuration for rendering
 * @returns Rendered HTML and loading state
 */
export declare function useMarkdownRenderer({ markdown, highlightCode, theme, }: UseMarkdownRendererOptions): UseMarkdownRendererResult;
