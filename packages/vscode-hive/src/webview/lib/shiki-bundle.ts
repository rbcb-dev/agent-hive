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

import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// ============================================================================
// LANGUAGE CONFIGURATION
// ============================================================================

/**
 * Language imports using dynamic imports for code splitting.
 * Each import will be loaded on-demand, reducing initial bundle size.
 *
 * To add a new language, add: import('@shikijs/langs/<language>')
 */
const LANGUAGE_IMPORTS = [
  import('@shikijs/langs/typescript'),
  import('@shikijs/langs/javascript'),
  import('@shikijs/langs/tsx'),
  import('@shikijs/langs/jsx'),
  import('@shikijs/langs/json'),
  import('@shikijs/langs/markdown'),
  import('@shikijs/langs/html'),
  import('@shikijs/langs/css'),
  import('@shikijs/langs/yaml'),
  import('@shikijs/langs/shellscript'), // shell, bash, sh
  import('@shikijs/langs/python'),
  import('@shikijs/langs/rust'),
  import('@shikijs/langs/go'),
];

/**
 * Supported language identifiers - used for validation and type safety.
 * Keep in sync with LANGUAGE_IMPORTS above.
 */
export const SUPPORTED_LANGUAGES = [
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
  'shellscript',
  'bash',
  'sh',
  'python',
  'rust',
  'go',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

/**
 * Theme imports using dynamic imports for code splitting.
 */
const THEME_IMPORTS = [
  import('@shikijs/themes/github-light'),
  import('@shikijs/themes/github-dark'),
];

/**
 * Theme mapping for light/dark mode
 */
export const THEME_MAP = {
  light: 'github-light',
  dark: 'github-dark',
} as const;

export type ThemeMode = keyof typeof THEME_MAP;
export type ThemeName = (typeof THEME_MAP)[ThemeMode];

// ============================================================================
// HIGHLIGHTER FACTORY
// ============================================================================

/**
 * Language alias mappings for common shorthand identifiers.
 * Maps aliases to their canonical SUPPORTED_LANGUAGES name.
 */
export const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  ts: 'typescript',
  js: 'javascript',
  md: 'markdown',
  yml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  py: 'python',
  rs: 'rust',
};

/**
 * Normalize a language identifier to a supported language.
 * Falls back to 'typescript' for unknown languages.
 */
export function normalizeLanguage(lang: string): SupportedLanguage {
  const normalized = lang.toLowerCase();

  // Direct match
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }

  // Alias match
  if (normalized in LANGUAGE_ALIASES) {
    return LANGUAGE_ALIASES[normalized];
  }

  // Fallback to typescript (good for showing code without highlighting)
  return 'typescript';
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): boolean {
  const normalized = lang.toLowerCase();
  return (
    SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage) ||
    normalized in LANGUAGE_ALIASES
  );
}

// Singleton highlighter instance
let highlighterPromise: Promise<HighlighterCore> | null = null;

/**
 * Get or create the singleton highlighter instance.
 * Uses lazy initialization - only loads when first accessed.
 */
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: THEME_IMPORTS,
      langs: LANGUAGE_IMPORTS,
      // Use JavaScript regex engine (smaller than WASM oniguruma)
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

/**
 * Reset the highlighter instance (useful for testing)
 */
export function resetHighlighter(): void {
  highlighterPromise = null;
}
