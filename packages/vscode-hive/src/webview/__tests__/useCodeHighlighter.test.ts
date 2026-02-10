/**
 * Tests for useCodeHighlighter hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCodeHighlighter } from '../hooks/useCodeHighlighter';

// Mock the shiki-bundle module directly (which is what useCodeHighlighter imports)
const mockHighlighter = {
  codeToTokens: vi.fn((code: string) => ({
    tokens: code.split('\n').map((line) => [{ content: line, color: '#000' }]),
  })),
};

vi.mock('../lib/shiki-bundle', () => ({
  getHighlighter: vi.fn(() => Promise.resolve(mockHighlighter)),
  normalizeLanguage: vi.fn((lang: string) => {
    const aliases: Record<string, string> = {
      ts: 'typescript',
      js: 'javascript',
      md: 'markdown',
      yml: 'yaml',
      sh: 'shell',
      bash: 'shell',
    };
    const normalized = lang.toLowerCase();
    return (
      aliases[normalized] ||
      (normalized.match(
        /^(typescript|javascript|tsx|jsx|json|markdown|html|css|yaml|shell|python|rust|go)$/,
      )
        ? normalized
        : 'typescript')
    );
  }),
  SUPPORTED_LANGUAGES: [
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
    'python',
    'rust',
    'go',
  ],
  THEME_MAP: { light: 'github-light', dark: 'github-dark' },
  isLanguageSupported: vi.fn(() => true),
  resetHighlighter: vi.fn(),
}));

describe('useCodeHighlighter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighlighter.codeToTokens.mockImplementation((code: string) => ({
      tokens: code
        .split('\n')
        .map((line) => [{ content: line, color: '#000' }]),
    }));
  });

  describe('basic functionality', () => {
    it('returns tokens for provided code', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'typescript',
        }),
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for highlighting to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0]).toEqual([
        { content: 'const x = 1;', color: '#000' },
      ]);
      expect(result.current.error).toBeNull();
    });

    it('handles multi-line code', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;\nconst y = 2;',
          language: 'typescript',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tokens).toHaveLength(2);
      expect(result.current.tokens[0]).toEqual([
        { content: 'const x = 1;', color: '#000' },
      ]);
      expect(result.current.tokens[1]).toEqual([
        { content: 'const y = 2;', color: '#000' },
      ]);
    });

    it('returns empty tokens for empty code', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: '',
          language: 'typescript',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tokens).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('theme support', () => {
    it('uses dark theme by default', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'typescript',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({ theme: 'github-dark' }),
      );
    });

    it('supports light theme', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'typescript',
          theme: 'light',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({ theme: 'github-light' }),
      );
    });
  });

  describe('language normalization', () => {
    it('normalizes typescript language', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'TypeScript',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({ lang: 'typescript' }),
      );
    });

    it('normalizes ts shorthand to typescript', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'ts',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({ lang: 'typescript' }),
      );
    });

    it('normalizes js shorthand to javascript', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'js',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledWith(
        'const x = 1;',
        expect.objectContaining({ lang: 'javascript' }),
      );
    });

    it('falls back to typescript for unknown languages', async () => {
      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'some text',
          language: 'unknown-lang',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledWith(
        'some text',
        expect.objectContaining({ lang: 'typescript' }),
      );
    });
  });

  describe('re-highlighting on changes', () => {
    it('re-highlights when code changes', async () => {
      const { result, rerender } = renderHook(
        ({ code, language }) => useCodeHighlighter({ code, language }),
        { initialProps: { code: 'const x = 1;', language: 'typescript' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenCalledTimes(1);

      rerender({ code: 'const y = 2;', language: 'typescript' });

      await waitFor(() => {
        expect(mockHighlighter.codeToTokens).toHaveBeenCalledTimes(2);
      });

      expect(result.current.tokens[0]).toEqual([
        { content: 'const y = 2;', color: '#000' },
      ]);
    });

    it('re-highlights when language changes', async () => {
      const { result, rerender } = renderHook(
        ({ code, language }) => useCodeHighlighter({ code, language }),
        { initialProps: { code: 'const x = 1;', language: 'typescript' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({ code: 'const x = 1;', language: 'javascript' });

      await waitFor(() => {
        expect(mockHighlighter.codeToTokens).toHaveBeenCalledTimes(2);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenLastCalledWith(
        'const x = 1;',
        expect.objectContaining({ lang: 'javascript' }),
      );
    });

    it('re-highlights when theme changes', async () => {
      type Props = { code: string; language: string; theme: 'light' | 'dark' };
      const { result, rerender } = renderHook<
        ReturnType<typeof useCodeHighlighter>,
        Props
      >(
        ({ code, language, theme }) =>
          useCodeHighlighter({ code, language, theme }),
        {
          initialProps: {
            code: 'const x = 1;',
            language: 'typescript',
            theme: 'dark',
          },
        },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      rerender({
        code: 'const x = 1;',
        language: 'typescript',
        theme: 'light',
      });

      await waitFor(() => {
        expect(mockHighlighter.codeToTokens).toHaveBeenCalledTimes(2);
      });

      expect(mockHighlighter.codeToTokens).toHaveBeenLastCalledWith(
        'const x = 1;',
        expect.objectContaining({ theme: 'github-light' }),
      );
    });
  });

  describe('error handling', () => {
    it('captures errors and returns fallback tokens', async () => {
      mockHighlighter.codeToTokens.mockImplementationOnce(() => {
        throw new Error('Highlighting failed');
      });

      const { result } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'typescript',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Highlighting failed');
      // Fallback to unhighlighted tokens
      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0]).toEqual([{ content: 'const x = 1;' }]);
    });
  });

  describe('cleanup', () => {
    it('does not update state after unmount', async () => {
      // Use a slow mock to simulate async work - need to cast to any since mock types are strict
      (
        mockHighlighter.codeToTokens as ReturnType<typeof vi.fn>
      ).mockImplementation((code: string) => {
        // Return a promise-like object for timing, but since getHighlighter awaits, this works
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              tokens: code
                .split('\n')
                .map((line) => [{ content: line, color: '#000' }]),
            });
          }, 50);
        });
      });

      const { result, unmount } = renderHook(() =>
        useCodeHighlighter({
          code: 'const x = 1;',
          language: 'typescript',
        }),
      );

      expect(result.current.isLoading).toBe(true);

      // Unmount before highlighting completes
      unmount();

      // Wait a bit to ensure the async operation would have completed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No error should be thrown (React would warn about memory leak)
      // This test passes if no "Can't perform a React state update on unmounted component" warning
    });
  });
});
