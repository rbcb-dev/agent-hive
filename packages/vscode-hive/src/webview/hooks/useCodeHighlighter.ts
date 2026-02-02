/**
 * useCodeHighlighter hook - Extracts Shiki highlighting logic for reusability
 * Provides async syntax highlighting with loading state and error handling.
 */

import { useState, useEffect } from 'react';
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki/bundle/web';

// Supported languages - subset for smaller bundle
const SUPPORTED_LANGUAGES: BundledLanguage[] = [
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
];

// Theme mapping to VS Code themes
const THEME_MAP = {
  light: 'github-light',
  dark: 'github-dark',
} as const;

// Singleton highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME_MAP.light, THEME_MAP.dark],
      langs: SUPPORTED_LANGUAGES,
    });
  }
  return highlighterPromise;
}

function normalizeLanguage(lang: string): BundledLanguage {
  const normalized = lang.toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(normalized as BundledLanguage)) {
    return normalized as BundledLanguage;
  }
  // Fallback mappings
  const mappings: Record<string, BundledLanguage> = {
    ts: 'typescript',
    js: 'javascript',
    md: 'markdown',
    yml: 'yaml',
    sh: 'shell',
    bash: 'shell',
  };
  return mappings[normalized] || 'javascript'; // Default to JS as plaintext fallback
}

export interface CodeToken {
  content: string;
  color?: string;
}

export interface UseCodeHighlighterOptions {
  code: string;
  language: string;
  theme?: 'light' | 'dark';
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
export function useCodeHighlighter({
  code,
  language,
  theme = 'dark',
}: UseCodeHighlighterOptions): UseCodeHighlighterResult {
  const [tokens, setTokens] = useState<CodeToken[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Handle empty code case
    if (!code) {
      setTokens([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function highlight() {
      try {
        const highlighter = await getHighlighter();
        if (cancelled) return;

        const normalizedLang = normalizeLanguage(language);
        const shikiTheme = THEME_MAP[theme];

        // Get tokens from Shiki
        const result = highlighter.codeToTokens(code, {
          lang: normalizedLang,
          theme: shikiTheme,
        });

        if (cancelled) return;

        // Transform tokens to our format
        const lineTokens = result.tokens.map((lineTokens) =>
          lineTokens.map((token) => ({
            content: token.content,
            color: token.color,
          }))
        );

        setTokens(lineTokens);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        // Fallback: return unhighlighted tokens
        const lines = code.split('\n');
        setTokens(lines.map((line) => [{ content: line }]));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);

  return { tokens, isLoading, error };
}

// Export utilities for use in CodeViewer
export { SUPPORTED_LANGUAGES, THEME_MAP, normalizeLanguage, getHighlighter };
