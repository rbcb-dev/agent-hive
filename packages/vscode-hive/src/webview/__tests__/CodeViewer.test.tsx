/**
 * Tests for CodeViewer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CodeViewer } from '../components/CodeViewer';

// Mock shiki with a proper highlighter implementation
const mockHighlighter = {
  codeToTokens: vi.fn((code: string) => ({
    tokens: code.split('\n').map((line) => [{ content: line, color: '#000' }]),
  })),
};

vi.mock('shiki/bundle/web', () => ({
  createHighlighter: vi.fn(() => Promise.resolve(mockHighlighter)),
}));

describe('CodeViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighlighter.codeToTokens.mockImplementation((code: string) => ({
      tokens: code.split('\n').map((line) => [{ content: line, color: '#000' }]),
    }));
  });

  describe('basic rendering', () => {
    it('renders code with line numbers', async () => {
      render(
        <CodeViewer
          code={'const x = 1;\nconst y = 2;'}
          language="typescript"
        />
      );

      // Wait for async highlighting to complete
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('renders empty state when no code provided', () => {
      render(
        <CodeViewer
          code=""
          language="typescript"
        />
      );

      expect(screen.getByText(/no code to display/i)).toBeInTheDocument();
    });

    it('renders with code-viewer class', async () => {
      render(
        <CodeViewer
          code="const x = 1;"
          language="typescript"
        />
      );

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveClass('code-viewer');
      });
    });
  });

  describe('language support', () => {
    it('accepts typescript language', async () => {
      render(
        <CodeViewer
          code="const x: number = 1;"
          language="typescript"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('accepts javascript language', async () => {
      render(
        <CodeViewer
          code="const x = 1;"
          language="javascript"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('accepts json language', async () => {
      render(
        <CodeViewer
          code='{"key": "value"}'
          language="json"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('accepts markdown language', async () => {
      render(
        <CodeViewer
          code="# Heading"
          language="markdown"
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('code-viewer')).toBeInTheDocument();
      });
    });

    it('falls back to plaintext for unknown language', async () => {
      render(
        <CodeViewer
          code="some text"
          language="unknown-lang"
        />
      );

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
        />
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
        />
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
        />
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
        />
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
    it('renders with dark theme by default', async () => {
      render(
        <CodeViewer
          code="const x = 1;"
          language="typescript"
        />
      );

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveAttribute('data-theme', 'dark');
      });
    });

    it('renders with light theme when specified', async () => {
      render(
        <CodeViewer
          code="const x = 1;"
          language="typescript"
          theme="light"
        />
      );

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveAttribute('data-theme', 'light');
      });
    });
  });

  describe('accessibility', () => {
    it('has proper role and aria-label', async () => {
      render(
        <CodeViewer
          code="const x = 1;"
          language="typescript"
        />
      );

      await waitFor(() => {
        const viewer = screen.getByTestId('code-viewer');
        expect(viewer).toHaveAttribute('role', 'region');
        expect(viewer).toHaveAttribute('aria-label', 'Code viewer');
      });
    });

    it('marks lines as presentation role', async () => {
      render(
        <CodeViewer
          code={'line 1\nline 2'}
          language="typescript"
        />
      );

      await waitFor(() => {
        const lines = screen.getAllByRole('presentation');
        expect(lines.length).toBe(2);
      });
    });
  });
});
