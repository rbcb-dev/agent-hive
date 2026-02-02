/**
 * Tests for MarkdownViewer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownViewer } from '../components/MarkdownViewer';

// Mock shiki with a proper highlighter implementation for faster tests
const mockHighlighter = {
  codeToHtml: vi.fn((code: string, opts: { lang: string }) => {
    return `<pre class="shiki"><code class="language-${opts.lang}">${code}</code></pre>`;
  }),
  codeToTokens: vi.fn((code: string) => ({
    tokens: code.split('\n').map((line) => [{ content: line, color: '#000' }]),
  })),
};

vi.mock('shiki/bundle/web', () => ({
  createHighlighter: vi.fn(() => Promise.resolve(mockHighlighter)),
}));

describe('MarkdownViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighlighter.codeToHtml.mockImplementation((code: string, opts: { lang: string }) => {
      return `<pre class="shiki"><code class="language-${opts.lang}">${code}</code></pre>`;
    });
  });

  const mockMarkdownContent = `# Hello World

This is a **bold** paragraph.

## Code Example

\`\`\`typescript
const x = 1;
\`\`\`

- List item 1
- List item 2
`;

  describe('when no content is provided', () => {
    it('renders empty state', () => {
      render(<MarkdownViewer content={null} />);
      expect(screen.getByText(/select a file/i)).toBeInTheDocument();
    });
  });

  describe('when content is provided', () => {
    it('renders file path in header', () => {
      render(<MarkdownViewer content={mockMarkdownContent} filePath="docs/README.md" />);
      expect(screen.getByText('docs/README.md')).toBeInTheDocument();
    });

    it('renders view toggle buttons', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      expect(screen.getByRole('button', { name: /raw/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rendered/i })).toBeInTheDocument();
    });

    it('shows rendered view by default', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
      });
    });

    it('renders markdown syntax in rendered mode (bold)', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        // Bold text should be rendered as <strong>
        expect(screen.getByText('bold')).toBeInTheDocument();
      });
    });

    it('toggles to raw view when Raw button clicked', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      
      const rawButton = screen.getByRole('button', { name: /raw/i });
      fireEvent.click(rawButton);
      
      // In raw view, we should see the markdown syntax characters
      expect(screen.getByText(/# Hello World/)).toBeInTheDocument();
      expect(screen.getByText(/\*\*bold\*\*/)).toBeInTheDocument();
    });

    it('toggles back to rendered view', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      
      // Switch to raw
      fireEvent.click(screen.getByRole('button', { name: /raw/i }));
      
      // Switch back to rendered
      fireEvent.click(screen.getByRole('button', { name: /rendered/i }));
      
      // Wait for async rendering to complete
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
      });
    });

    it('highlights active view button', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      
      // Rendered should be active by default
      const renderedButton = screen.getByRole('button', { name: /rendered/i });
      expect(renderedButton).toHaveClass('active');
      
      // Raw should not be active
      const rawButton = screen.getByRole('button', { name: /raw/i });
      expect(rawButton).not.toHaveClass('active');
      
      // Click raw
      fireEvent.click(rawButton);
      
      // Now raw should be active
      expect(rawButton).toHaveClass('active');
      expect(renderedButton).not.toHaveClass('active');
    });
  });

  describe('raw view', () => {
    it('shows line numbers', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      fireEvent.click(screen.getByRole('button', { name: /raw/i }));
      
      // Should have line numbers (content has multiple lines)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('preserves content for thread anchoring', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      fireEvent.click(screen.getByRole('button', { name: /raw/i }));
      
      // Each line should have a data attribute for anchoring
      const line1 = screen.getByTestId('line-1');
      expect(line1).toBeInTheDocument();
    });
  });

  describe('rendered view', () => {
    it('renders list items', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        expect(screen.getByText('List item 1')).toBeInTheDocument();
        expect(screen.getByText('List item 2')).toBeInTheDocument();
      });
    });

    it('does not execute scripts in markdown', async () => {
      const maliciousContent = `# XSS Test
<script>alert("xss")</script>
<img onerror="alert('xss')" src="invalid">
`;
      render(<MarkdownViewer content={maliciousContent} />);
      
      // Wait for async rendering to complete
      await waitFor(() => {
        const container = document.querySelector('.markdown-rendered');
        expect(container?.innerHTML).not.toContain('<script>');
        expect(container?.innerHTML).not.toContain('onerror');
      });
    });

    it('applies VS Code markdown styles container class', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      expect(document.querySelector('.markdown-viewer')).toBeInTheDocument();
      expect(document.querySelector('.markdown-rendered')).toBeInTheDocument();
    });
  });

  describe('complex markdown handling', () => {
    it('handles tables without breaking', async () => {
      const tableContent = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      render(<MarkdownViewer content={tableContent} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        expect(screen.getByText('Header 1')).toBeInTheDocument();
      });
    });

    it('handles code blocks without breaking', async () => {
      const codeContent = `\`\`\`javascript
function test() {
  return "hello";
}
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        expect(screen.getByText(/function test/)).toBeInTheDocument();
      });
    });
  });

  describe('thread anchoring support', () => {
    it('calls onLineClick when a raw line is clicked', () => {
      const handleLineClick = vi.fn();
      render(
        <MarkdownViewer 
          content={mockMarkdownContent} 
          onLineClick={handleLineClick}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: /raw/i }));
      
      const line1 = screen.getByTestId('line-1');
      fireEvent.click(line1);
      
      expect(handleLineClick).toHaveBeenCalledWith(1);
    });
  });

  describe('syntax highlighting', () => {
    it('highlights code blocks by default', async () => {
      const codeContent = `\`\`\`typescript
const x: number = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        const container = document.querySelector('.markdown-rendered');
        expect(container?.innerHTML).toContain('shiki');
      });
    });

    it('can disable code highlighting', async () => {
      const codeContent = `\`\`\`typescript
const x: number = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} highlightCode={false} />);
      // Wait for async rendering to complete
      await waitFor(() => {
        const container = document.querySelector('.markdown-rendered');
        expect(container?.innerHTML).toContain('const x: number = 1;');
        // When highlighting is disabled, we should not have called codeToHtml
        expect(mockHighlighter.codeToHtml).not.toHaveBeenCalled();
      });
    });

    it('shows loading state initially', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // Should show loading initially (before async completes)
      expect(document.querySelector('.markdown-rendered-loading')).toBeInTheDocument();
    });
  });
});
