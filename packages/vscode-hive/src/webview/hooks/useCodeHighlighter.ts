/**
 * useCodeHighlighter hook - Extracts Shiki highlighting logic for reusability
 * Provides async syntax highlighting with loading state and error handling.
 * 
 * Uses fine-grained Shiki bundle from lib/shiki-bundle.ts for smaller bundle size.
 * To add new languages/themes, update shiki-bundle.ts.
 */

import { useState, useEffect } from 'react';
import {
  getHighlighter,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  THEME_MAP,
  type SupportedLanguage,
  type ThemeMode,
} from '../lib/shiki-bundle';

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
export {
  SUPPORTED_LANGUAGES,
  THEME_MAP,
  normalizeLanguage,
  getHighlighter,
  isLanguageSupported,
  resetHighlighter,
  type SupportedLanguage,
  type ThemeMode,
} from '../lib/shiki-bundle';
