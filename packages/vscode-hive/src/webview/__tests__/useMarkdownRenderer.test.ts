/**
 * Tests for useMarkdownRenderer hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer';

// Mock the shiki-bundle module (which useCodeHighlighter imports from)
const mockHighlighter = {
  codeToHtml: vi.fn((code: string, opts: { lang: string; theme: string }) => {
    // Return HTML with shiki-like structure for code blocks
    return `<pre class="shiki"><code class="language-${opts.lang}">${code}</code></pre>`;
  }),
  codeToTokens: vi.fn((code: string) => ({
    tokens: code.split('\n').map((line) => [{ content: line, color: '#000' }]),
  })),
};

vi.mock('../lib/shiki-bundle', () => ({
  getHighlighter: vi.fn(() => Promise.resolve(mockHighlighter)),
  normalizeLanguage: vi.fn((lang: string) => lang.toLowerCase()),
  SUPPORTED_LANGUAGES: ['typescript', 'javascript', 'tsx', 'jsx', 'json', 'markdown', 'html', 'css', 'yaml', 'shell', 'python', 'rust', 'go'],
  THEME_MAP: { light: 'github-light', dark: 'github-dark' },
  isLanguageSupported: vi.fn(() => true),
  resetHighlighter: vi.fn(),
}));

describe('useMarkdownRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighlighter.codeToHtml.mockImplementation((code: string, opts: { lang: string }) => {
      return `<pre class="shiki"><code class="language-${opts.lang}">${code}</code></pre>`;
    });
  });

  describe('basic functionality', () => {
    it('renders simple markdown to HTML', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '# Hello World',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).toContain('<h1');
      expect(result.current.html).toContain('Hello World');
    });

    it('renders bold text', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: 'This is **bold** text.',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).toContain('<strong>bold</strong>');
    });

    it('returns empty string for empty markdown', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).toBe('');
    });
  });

  describe('code block highlighting', () => {
    it('highlights code blocks when highlightCode is true', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```typescript\nconst x = 1;\n```',
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should contain shiki-highlighted code
      expect(result.current.html).toContain('shiki');
      expect(result.current.html).toContain('const x = 1;');
    });

    it('highlights code blocks by default', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```javascript\nlet y = 2;\n```',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Highlighting is on by default
      expect(result.current.html).toContain('shiki');
    });

    it('does not highlight when highlightCode is false', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```typescript\nconst x = 1;\n```',
          highlightCode: false,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to marked's default code block rendering
      expect(result.current.html).toContain('<pre>');
      expect(result.current.html).toContain('const x = 1;');
      expect(mockHighlighter.codeToHtml).not.toHaveBeenCalled();
    });

    it('handles code blocks without language specifier', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```\nsome code\n```',
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still render, just without specific language highlighting
      expect(result.current.html).toContain('some code');
    });
  });

  describe('theme support', () => {
    it('uses dark theme by default', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```typescript\nconst x = 1;\n```',
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ theme: 'github-dark' })
      );
    });

    it('uses light theme when specified', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```typescript\nconst x = 1;\n```',
          highlightCode: true,
          theme: 'light',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ theme: 'github-light' })
      );
    });
  });

  describe('XSS sanitization', () => {
    it('sanitizes script tags', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '<script>alert("xss")</script>',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).not.toContain('<script>');
    });

    it('sanitizes event handlers', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '<img onerror="alert(\'xss\')" src="invalid">',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).not.toContain('onerror');
    });

    it('sanitizes javascript URLs', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '[click](javascript:alert("xss"))',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).not.toContain('javascript:');
    });

    it('sanitizes after highlighting preserves code content', async () => {
      // Simulate highlighted code with HTML that might look like XSS
      mockHighlighter.codeToHtml.mockImplementationOnce(() => {
        return '<pre class="shiki"><code><span style="color:#000">const x = "&lt;script&gt;";</span></code></pre>';
      });

      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '```javascript\nconst x = "<script>";\n```',
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should preserve the escaped code content
      expect(result.current.html).toContain('&lt;script&gt;');
    });
  });

  describe('complex markdown', () => {
    it('handles mixed content with code blocks', async () => {
      const markdown = `# Title

Some text **bold**.

\`\`\`typescript
const x: number = 1;
\`\`\`

More text.`;

      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown,
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).toContain('<h1');
      expect(result.current.html).toContain('<strong>bold</strong>');
      expect(result.current.html).toContain('shiki');
      expect(result.current.html).toContain('More text');
    });

    it('handles multiple code blocks', async () => {
      const markdown = `\`\`\`javascript
let a = 1;
\`\`\`

\`\`\`python
x = 2
\`\`\``;

      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown,
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should call codeToHtml twice
      expect(mockHighlighter.codeToHtml).toHaveBeenCalledTimes(2);
    });

    it('handles inline code without highlighting', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: 'Use `const` for constants.',
          highlightCode: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Inline code should be wrapped in <code> but not highlighted via shiki
      expect(result.current.html).toContain('<code>const</code>');
      expect(mockHighlighter.codeToHtml).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('starts with isLoading true', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '# Hello',
        })
      );

      // Initial state should have isLoading true
      expect(result.current.isLoading).toBe(true);
      
      // Wait for async rendering to complete to avoid act() warnings
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('sets isLoading to false after processing', async () => {
      const { result } = renderHook(() =>
        useMarkdownRenderer({
          markdown: '# Hello',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('re-rendering on changes', () => {
    it('re-renders when markdown changes', async () => {
      const { result, rerender } = renderHook(
        ({ markdown }) => useMarkdownRenderer({ markdown }),
        { initialProps: { markdown: '# First' } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.html).toContain('First');

      rerender({ markdown: '# Second' });

      await waitFor(() => {
        expect(result.current.html).toContain('Second');
      });
    });

    it('re-renders when theme changes', async () => {
      type Props = { markdown: string; theme: 'light' | 'dark'; highlightCode: boolean };
      const { result, rerender } = renderHook<ReturnType<typeof useMarkdownRenderer>, Props>(
        ({ markdown, theme, highlightCode }) => useMarkdownRenderer({ markdown, theme, highlightCode }),
        { initialProps: { markdown: '```ts\nx\n```', theme: 'dark', highlightCode: true } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const callCountDark = mockHighlighter.codeToHtml.mock.calls.length;

      rerender({ markdown: '```ts\nx\n```', theme: 'light', highlightCode: true });

      await waitFor(() => {
        expect(mockHighlighter.codeToHtml.mock.calls.length).toBeGreaterThan(callCountDark);
      });
    });
  });
});
