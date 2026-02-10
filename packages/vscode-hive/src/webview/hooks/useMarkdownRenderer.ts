/**
 * useMarkdownRenderer hook - Renders markdown with syntax-highlighted code blocks
 * Uses marked for markdown parsing and Shiki for code highlighting.
 */

import { useState, useEffect, useCallback } from 'react';
import { marked, type Tokens } from 'marked';
import {
  getHighlighter,
  THEME_MAP,
  normalizeLanguage,
} from './useCodeHighlighter';

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
 * Sanitize HTML to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(
    /href\s*=\s*["']javascript:[^"']*["']/gi,
    'href="#"',
  );

  return sanitized;
}

/**
 * Hook for rendering markdown with optional syntax highlighting for code blocks.
 * Uses Shiki for code highlighting and sanitizes output to prevent XSS.
 *
 * @param options - Configuration for rendering
 * @returns Rendered HTML and loading state
 */
export function useMarkdownRenderer({
  markdown,
  highlightCode = true,
  theme = 'dark',
}: UseMarkdownRendererOptions): UseMarkdownRendererResult {
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle empty markdown case
    if (!markdown) {
      setHtml('');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function renderMarkdown() {
      try {
        if (highlightCode) {
          // Get highlighter for code blocks
          const highlighter = await getHighlighter();
          if (cancelled) return;

          const shikiTheme = THEME_MAP[theme];

          // Create custom renderer that uses Shiki for code blocks
          const renderer = new marked.Renderer();

          renderer.code = function ({ text, lang }: Tokens.Code): string {
            // Only highlight fenced code blocks with language
            if (lang) {
              const normalizedLang = normalizeLanguage(lang);
              try {
                return highlighter.codeToHtml(text, {
                  lang: normalizedLang,
                  theme: shikiTheme,
                });
              } catch {
                // Fall back to plain code block on error
                const escaped = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
              }
            }

            // No language specified - use plain code block
            const escaped = text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            return `<pre><code>${escaped}</code></pre>`;
          };

          // Configure marked
          marked.setOptions({
            gfm: true,
            breaks: true,
          });

          // Parse markdown with custom renderer
          const rawHtml = await marked.parse(markdown, {
            renderer,
            async: true,
          });
          if (cancelled) return;

          // Sanitize output to prevent XSS
          const sanitizedHtml = sanitizeHtml(rawHtml);
          setHtml(sanitizedHtml);
        } else {
          // No code highlighting - use standard marked
          marked.setOptions({
            gfm: true,
            breaks: true,
          });

          const rawHtml = await marked.parse(markdown, { async: true });
          if (cancelled) return;

          // Sanitize output to prevent XSS
          const sanitizedHtml = sanitizeHtml(rawHtml);
          setHtml(sanitizedHtml);
        }
      } catch (error) {
        if (cancelled) return;

        // On error, fall back to basic markdown parsing without highlighting
        try {
          marked.setOptions({
            gfm: true,
            breaks: true,
          });
          const rawHtml = await marked.parse(markdown, { async: true });
          const sanitizedHtml = sanitizeHtml(rawHtml);
          setHtml(sanitizedHtml);
        } catch {
          // Complete failure - set empty
          setHtml('');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    renderMarkdown();

    return () => {
      cancelled = true;
    };
  }, [markdown, highlightCode, theme]);

  return { html, isLoading };
}
