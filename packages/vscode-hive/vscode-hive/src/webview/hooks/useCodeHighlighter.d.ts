/**
 * useCodeHighlighter hook - Extracts Shiki highlighting logic for reusability
 * Provides async syntax highlighting with loading state and error handling.
 *
 * Uses fine-grained Shiki bundle from lib/shiki-bundle.ts for smaller bundle size.
 * To add new languages/themes, update shiki-bundle.ts.
 */
import { type ThemeMode } from '../lib/shiki-bundle';
export interface CodeToken {
    content: string;
    color?: string;
}
export interface UseCodeHighlighterOptions {
    code: string;
    language: string;
    theme?: ThemeMode;
}
export interface UseCodeHighlighterResult {
    tokens: CodeToken[][];
    isLoading: boolean;
    error: Error | null;
}
/**
 * Hook for syntax highlighting code using Shiki.
 * Maintains a singleton highlighter instance for performance.
 *
 * @param options - Configuration for highlighting
 * @returns Highlighted tokens, loading state, and any error
 */
export declare function useCodeHighlighter({ code, language, theme, }: UseCodeHighlighterOptions): UseCodeHighlighterResult;
export { SUPPORTED_LANGUAGES, THEME_MAP, normalizeLanguage, getHighlighter, isLanguageSupported, resetHighlighter, type SupportedLanguage, type ThemeMode, } from '../lib/shiki-bundle';
