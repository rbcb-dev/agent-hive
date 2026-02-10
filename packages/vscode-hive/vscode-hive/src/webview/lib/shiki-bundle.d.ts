/**
 * Shiki Fine-Grained Bundle Configuration
 *
 * This file configures the Shiki syntax highlighter with only the languages
 * and themes we actually use, using dynamic imports for code splitting.
 *
 * To add a new language:
 * 1. Add a dynamic import to the LANGUAGE_IMPORTS array
 * 2. Add the language name to SUPPORTED_LANGUAGES
 *
 * To add a new theme:
 * 1. Add a dynamic import to the THEME_IMPORTS array
 */
import { type HighlighterCore } from 'shiki/core';
/**
 * Supported language identifiers - used for validation and type safety.
 * Keep in sync with LANGUAGE_IMPORTS above.
 */
export declare const SUPPORTED_LANGUAGES: readonly ["typescript", "javascript", "tsx", "jsx", "json", "markdown", "html", "css", "yaml", "shell", "shellscript", "bash", "sh", "python", "rust", "go"];
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
/**
 * Theme mapping for light/dark mode
 */
export declare const THEME_MAP: {
    readonly light: "github-light";
    readonly dark: "github-dark";
};
export type ThemeMode = keyof typeof THEME_MAP;
export type ThemeName = (typeof THEME_MAP)[ThemeMode];
/**
 * Language alias mappings for common shorthand identifiers.
 * Maps aliases to their canonical SUPPORTED_LANGUAGES name.
 */
export declare const LANGUAGE_ALIASES: Record<string, SupportedLanguage>;
/**
 * Normalize a language identifier to a supported language.
 * Falls back to 'typescript' for unknown languages.
 */
export declare function normalizeLanguage(lang: string): SupportedLanguage;
/**
 * Check if a language is supported
 */
export declare function isLanguageSupported(lang: string): boolean;
/**
 * Get or create the singleton highlighter instance.
 * Uses lazy initialization - only loads when first accessed.
 */
export declare function getHighlighter(): Promise<HighlighterCore>;
/**
 * Reset the highlighter instance (useful for testing)
 */
export declare function resetHighlighter(): void;
