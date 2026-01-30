/**
 * Tests for MarkdownViewer component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownViewer } from '../components/MarkdownViewer';

describe('MarkdownViewer', () => {
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

    it('shows rendered view by default', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // In rendered view, we expect a heading element
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
    });

    it('renders markdown syntax in rendered mode (bold)', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      // Bold text should be rendered as <strong>
      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('toggles to raw view when Raw button clicked', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      
      const rawButton = screen.getByRole('button', { name: /raw/i });
      fireEvent.click(rawButton);
      
      // In raw view, we should see the markdown syntax characters
      expect(screen.getByText(/# Hello World/)).toBeInTheDocument();
      expect(screen.getByText(/\*\*bold\*\*/)).toBeInTheDocument();
    });

    it('toggles back to rendered view', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      
      // Switch to raw
      fireEvent.click(screen.getByRole('button', { name: /raw/i }));
      
      // Switch back to rendered
      fireEvent.click(screen.getByRole('button', { name: /rendered/i }));
      
      // Should see rendered content again
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
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
    it('renders list items', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
    });

    it('does not execute scripts in markdown', () => {
      const maliciousContent = `# XSS Test
<script>alert("xss")</script>
<img onerror="alert('xss')" src="invalid">
`;
      render(<MarkdownViewer content={maliciousContent} />);
      
      // Script tags should not be in the DOM or should be escaped
      const container = document.querySelector('.markdown-rendered');
      expect(container?.innerHTML).not.toContain('<script>');
      expect(container?.innerHTML).not.toContain('onerror');
    });

    it('applies VS Code markdown styles container class', () => {
      render(<MarkdownViewer content={mockMarkdownContent} />);
      expect(document.querySelector('.markdown-viewer')).toBeInTheDocument();
      expect(document.querySelector('.markdown-rendered')).toBeInTheDocument();
    });
  });

  describe('complex markdown handling', () => {
    it('handles tables without breaking', () => {
      const tableContent = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      render(<MarkdownViewer content={tableContent} />);
      // Should render without crashing
      expect(screen.getByText('Header 1')).toBeInTheDocument();
    });

    it('handles code blocks without breaking', () => {
      const codeContent = `\`\`\`javascript
function test() {
  return "hello";
}
\`\`\``;
      render(<MarkdownViewer content={codeContent} />);
      // Should render without crashing
      expect(screen.getByText(/function test/)).toBeInTheDocument();
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
});
