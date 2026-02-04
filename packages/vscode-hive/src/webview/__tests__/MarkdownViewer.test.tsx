/**
 * Tests for MarkdownViewer component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from './test-utils';
import { MarkdownViewer } from '../components/MarkdownViewer';

// Mock the shiki-bundle module (which useCodeHighlighter imports from)
const mockHighlighter = {
  codeToHtml: vi.fn((code: string, opts: { lang: string }) => {
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
    it('renders file path in header', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} filePath="docs/README.md" />);
      expect(screen.getByText('docs/README.md')).toBeInTheDocument();
      // Wait for async rendering to complete to avoid act() warnings
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('renders view toggle buttons', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      expect(screen.getByRole('button', { name: /raw/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rendered/i })).toBeInTheDocument();
      // Wait for async rendering to complete to avoid act() warnings
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
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

    it('applies VS Code markdown styles container class', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      expect(document.querySelector('.markdown-viewer')).toBeInTheDocument();
      expect(document.querySelector('.markdown-rendered')).toBeInTheDocument();
      // Wait for async rendering to complete to avoid act() warnings
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
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

    it('renders code blocks with theme-aware container class', async () => {
      const codeContent = `\`\`\`typescript
const x = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} theme="light" />);
      // Wait for async rendering to complete
      await waitFor(() => {
        const container = document.querySelector('.markdown-rendered');
        expect(container).toHaveClass('theme-light');
      });
    });

    it('applies dark theme class when theme is dark', async () => {
      const codeContent = `\`\`\`typescript
const x = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} theme="dark" />);
      // Wait for async rendering to complete
      await waitFor(() => {
        const container = document.querySelector('.markdown-rendered');
        expect(container).toHaveClass('theme-dark');
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

    it('shows loading state initially', async () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // Should show loading initially (before async completes)
      expect(document.querySelector('.markdown-rendered-loading')).toBeInTheDocument();
      // Wait for async rendering to complete to avoid act() warnings
      await waitFor(() => {
        expect(document.querySelector('.markdown-rendered-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('copy to clipboard for code blocks', () => {
    beforeEach(() => {
      // Mock navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      });
    });

    it('shows copy button on code blocks', async () => {
      const codeContent = `\`\`\`typescript
const x = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      
      // Wait for the copy button to appear (added by useEffect after html renders)
      const copyButton = await screen.findByRole('button', { name: /copy code/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('copies code to clipboard when copy button is clicked', async () => {
      const codeContent = `\`\`\`typescript
const x = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      
      // Wait for the copy button to appear (added by useEffect after html renders)
      const copyButton = await screen.findByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);
      
      // Should have called clipboard.writeText with the code content
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
      });
    });

    it('shows copied feedback after clicking copy', async () => {
      const codeContent = `\`\`\`typescript
const x = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      
      // Wait for the copy button to appear (added by useEffect after html renders)
      const copyButton = await screen.findByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);
      
      // Should show copied state
      await waitFor(() => {
        expect(copyButton).toHaveTextContent('Copied!');
      });
    });

    it('does NOT show copy button on inline code', async () => {
      const inlineCodeContent = `This is some \`inline code\` in a paragraph.`;
      render(<MarkdownViewer content={inlineCodeContent} />);
      
      // Wait for rendering to complete
      await waitFor(() => {
        expect(screen.getByText(/inline code/)).toBeInTheDocument();
      });
      
      // Should NOT have any copy buttons for inline code
      expect(screen.queryByRole('button', { name: /copy code/i })).not.toBeInTheDocument();
    });

    it('shows copy buttons for multiple code blocks', async () => {
      const multiCodeContent = `\`\`\`javascript
const a = 1;
\`\`\`

\`\`\`python
x = 2
\`\`\``;
      render(<MarkdownViewer content={multiCodeContent} />);
      
      // Wait for copy buttons to appear (added by useEffect after html renders)
      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button', { name: /copy code/i });
        expect(copyButtons).toHaveLength(2);
      });
    });

    it('copies multi-line code correctly', async () => {
      const multiLineCode = `\`\`\`typescript
function hello() {
  console.log("world");
}
\`\`\``;
      render(<MarkdownViewer content={multiLineCode} />);
      
      // Wait for the copy button to appear (added by useEffect after html renders)
      const copyButton = await screen.findByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);
      
      // Should have called clipboard.writeText with multi-line content
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'function hello() {\n  console.log("world");\n}'
        );
      });
    });

    it('handles clipboard API failure with fallback', async () => {
      // Mock clipboard failure
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard not available')),
        },
        writable: true,
        configurable: true,
      });

      // Mock document.execCommand as fallback
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const codeContent = `\`\`\`typescript
const x = 1;
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      
      // Wait for the copy button to appear (added by useEffect after html renders)
      const copyButton = await screen.findByRole('button', { name: /copy code/i });
      fireEvent.click(copyButton);
      
      // Should have called the fallback after clipboard fails
      await waitFor(() => {
        expect(execCommandMock).toHaveBeenCalledWith('copy');
      });
    });
  });
});
