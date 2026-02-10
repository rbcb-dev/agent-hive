/**
 * Tests for CodeViewer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from './test-utils';
import { render as rawRender } from '@testing-library/react';
import { CodeViewer } from '../components/CodeViewer';
import { HiveThemeProvider } from '../theme/Provider';
import type { ReviewThread } from 'hive-core';

// Mock the shiki-bundle module (used by useCodeHighlighter)
const mockHighlighter = {
  codeToTokens: vi.fn((code: string) => ({
    tokens: code.split('\n').map((line) => [{ content: line, color: '#000' }]),
  })),
};

vi.mock('../lib/shiki-bundle', () => ({
  getHighlighter: vi.fn(() => Promise.resolve(mockHighlighter)),
  normalizeLanguage: vi.fn((lang: string) => lang.toLowerCase()),
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

describe('CodeViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighlighter.codeToTokens.mockImplementation((code: string) => ({
      tokens: code
        .split('\n')
        .map((line) => [{ content: line, color: '#000' }]),
    }));
  });

  describe('basic rendering', () => {
    it('renders code with line numbers', async () => {
      render(
        <CodeViewer
          code={'const x = 1;\nconst y = 2;'}
          language="typescript"
        />,
      );

      // Wait for async highlighting to complete
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('renders empty state when no code provided', () => {
      render(<CodeViewer code="" language="typescript" />);

      expect(screen.getByText(/no code to display/i)).toBeInTheDocument();
    });

    it('renders with code-viewer class', async () => {
      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveClass('code-viewer');
      });
    });
  });

  describe('language support', () => {
    it('accepts typescript language', async () => {
      render(<CodeViewer code="const x: number = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('accepts javascript language', async () => {
      render(<CodeViewer code="const x = 1;" language="javascript" />);

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('accepts json language', async () => {
      render(<CodeViewer code='{"key": "value"}' language="json" />);

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('accepts markdown language', async () => {
      render(<CodeViewer code="# Heading" language="markdown" />);

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('falls back to plaintext for unknown language', async () => {
      render(<CodeViewer code="some text" language="unknown-lang" />);

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });
  });

  describe('line number options', () => {
    it('shows line numbers starting from specified number', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2'}
          language="typescript"
          startLine={10}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument();
      });
    });

    it('can hide line numbers when showLineNumbers is false', async () => {
      render(
        <CodeViewer
          code={'const x = 1;\nconst y = 2;'}
          language="typescript"
          showLineNumbers={false}
        />,
      );

      await waitFor(() => {
        // Line numbers should not be visible
        const lineNumbers = screen.queryAllByText(/^[0-9]+$/);
        expect(lineNumbers.length).toBe(0);
      });
    });
  });

  describe('line highlighting', () => {
    it('highlights specified lines', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          highlightLines={[2]}
        />,
      );

      await waitFor(() => {
        const lines = screen.getAllByRole('presentation');
        expect(lines.length).toBe(3);
        // Line 2 (index 1) should have highlight class
        expect(lines[1]).toHaveClass('line-highlighted');
      });
    });

    it('supports add/remove line types for diff display', async () => {
      render(
        <CodeViewer
          code={'unchanged\nadded\nremoved'}
          language="typescript"
          lineTypes={{ 2: 'add', 3: 'remove' }}
        />,
      );

      await waitFor(() => {
        const lines = screen.getAllByRole('presentation');
        expect(lines.length).toBe(3);
        expect(lines[1]).toHaveClass('line-add');
        expect(lines[2]).toHaveClass('line-remove');
      });
    });
  });

  describe('theme support', () => {
    it('renders with light theme from context by default', async () => {
      // test-utils wrapper uses light mode by default
      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveAttribute('data-theme', 'light');
      });
    });

    it('renders with dark theme when provider is in dark mode', async () => {
      // Use rawRender to provide custom wrapper with dark mode
      rawRender(
        <HiveThemeProvider mode="dark">
          <CodeViewer code="const x = 1;" language="typescript" />
        </HiveThemeProvider>,
      );

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveAttribute('data-theme', 'dark');
      });
    });

    it('throws error when used outside HiveThemeProvider', async () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Render without wrapper - should throw
      expect(() => {
        rawRender(<CodeViewer code="const x = 1;" language="typescript" />);
      }).toThrow(/useTheme must be used within a HiveThemeProvider/);

      consoleSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('has proper role and aria-label', async () => {
      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveAttribute('role', 'region');
        expect(viewer).toHaveAttribute('aria-label', 'Code viewer');
      });
    });

    it('marks lines as presentation role', async () => {
      render(<CodeViewer code={'line 1\nline 2'} language="typescript" />);

      await waitFor(() => {
        const lines = screen.getAllByRole('presentation');
        expect(lines.length).toBe(2);
      });
    });
  });

  describe('thread gutter markers', () => {
    const mockThread: ReviewThread = {
      id: 'thread-1',
      entityId: 'entity-1',
      uri: 'src/example.ts',
      range: {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 10 },
      },
      status: 'open',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      annotations: [
        {
          id: 'ann-1',
          type: 'comment',
          body: 'Test comment',
          author: { type: 'human', name: 'Alice' },
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    };

    it('renders thread marker icon on line with thread', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[mockThread]}
        />,
      );

      await waitFor(() => {
        const marker = screen.getByTestId('thread-marker-1');
        expect(marker).toBeInTheDocument();
      });
    });

    it('shows correct thread count for lines with multiple threads', async () => {
      const thread1: ReviewThread = {
        ...mockThread,
        id: 'thread-1',
      };
      const thread2: ReviewThread = {
        ...mockThread,
        id: 'thread-2',
      };

      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[thread1, thread2]}
        />,
      );

      await waitFor(() => {
        // Should show badge with count "2" for stacked threads
        const marker = screen.getByTestId('thread-marker-1');
        expect(marker).toHaveTextContent('2');
      });
    });

    it('calls onThreadClick when marker is clicked', async () => {
      const handleThreadClick = vi.fn();

      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[mockThread]}
          onThreadClick={handleThreadClick}
        />,
      );

      await waitFor(() => {
        const marker = screen.getByTestId('thread-marker-1');
        fireEvent.click(marker);
      });

      expect(handleThreadClick).toHaveBeenCalledWith([mockThread], 2); // line 2 (1-indexed)
    });

    it('does not render markers when threads is empty', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[]}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId(/thread-marker/)).not.toBeInTheDocument();
      });
    });

    it('shows open thread marker with different style than resolved', async () => {
      const resolvedThread: ReviewThread = {
        ...mockThread,
        status: 'resolved',
      };

      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[resolvedThread]}
        />,
      );

      await waitFor(() => {
        const marker = screen.getByTestId('thread-marker-1');
        expect(marker).toHaveClass('thread-marker-resolved');
      });
    });

    it('expands inline thread when marker is clicked', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[mockThread]}
          onThreadClick={vi.fn()}
        />,
      );

      await waitFor(() => {
        const marker = screen.getByTestId('thread-marker-1');
        fireEvent.click(marker);
      });

      // Should show expanded inline thread panel
      await waitFor(() => {
        expect(screen.getByTestId('inline-thread')).toBeInTheDocument();
      });
    });

    it('supports multiple threads on different lines', async () => {
      const thread1: ReviewThread = {
        ...mockThread,
        id: 'thread-1',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
      };
      const thread2: ReviewThread = {
        ...mockThread,
        id: 'thread-2',
        range: {
          start: { line: 2, character: 0 },
          end: { line: 2, character: 10 },
        },
      };

      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[thread1, thread2]}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('thread-marker-0')).toBeInTheDocument();
        expect(screen.getByTestId('thread-marker-2')).toBeInTheDocument();
      });
    });

    it('passes reply and resolve handlers to inline thread', async () => {
      const handleReply = vi.fn();
      const handleResolve = vi.fn();

      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[mockThread]}
          onThreadClick={vi.fn()}
          onThreadReply={handleReply}
          onThreadResolve={handleResolve}
        />,
      );

      await waitFor(() => {
        const marker = screen.getByTestId('thread-marker-1');
        fireEvent.click(marker);
      });

      await waitFor(() => {
        expect(screen.getByTestId('inline-thread')).toBeInTheDocument();
      });

      // Reply and resolve buttons should be present
      const replyButton = screen.getByRole('button', { name: /^reply$/i });
      const resolveButton = screen.getByRole('button', { name: /resolve/i });
      expect(replyButton).toBeInTheDocument();
      expect(resolveButton).toBeInTheDocument();
    });

    it('closes inline thread when close button is clicked', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[mockThread]}
          onThreadClick={vi.fn()}
        />,
      );

      // Open the thread
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('thread-marker-1'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('inline-thread')).toBeInTheDocument();
      });

      // Close the thread
      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('inline-thread')).not.toBeInTheDocument();
      });
    });

    it('has accessible thread marker button', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2\nline 3'}
          language="typescript"
          threads={[mockThread]}
        />,
      );

      await waitFor(() => {
        const marker = screen.getByTestId('thread-marker-1');
        expect(marker).toHaveAttribute('aria-label');
        expect(marker.getAttribute('aria-label')).toContain('thread');
      });
    });
  });

  describe('copy to clipboard', () => {
    beforeEach(() => {
      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
    });

    it('renders copy button in the code viewer', async () => {
      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });
    });

    it('copies code to clipboard when copy button is clicked', async () => {
      const testCode = 'const x = 1;\nconst y = 2;';
      render(<CodeViewer code={testCode} language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('copy-button'));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testCode);
      });
    });

    it('shows "Copied!" feedback after successful copy', async () => {
      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('copy-button'));

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toHaveTextContent('Copied!');
      });
    });

    it('has proper attributes for accessibility', async () => {
      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });

      const copyButton = screen.getByTestId('copy-button');
      expect(copyButton).toHaveAttribute(
        'aria-label',
        'Copy code to clipboard',
      );
      expect(copyButton).toHaveAttribute('type', 'button');
    });

    it('does not render copy button when code is empty', () => {
      render(<CodeViewer code="" language="typescript" />);

      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument();
    });

    it('handles clipboard API failure with fallback', async () => {
      // Mock clipboard failure
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
        },
      });

      // Mock document.execCommand as fallback
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      render(<CodeViewer code="const x = 1;" language="typescript" />);

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('copy-button'));

      // Should have called the fallback after clipboard fails
      await waitFor(() => {
        expect(execCommandMock).toHaveBeenCalledWith('copy');
      });
    });
  });
});
