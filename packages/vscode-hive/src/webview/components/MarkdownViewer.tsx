/**
 * MarkdownViewer component - Display markdown with raw/rendered toggle
 * 
 * Supports:
 * - Rendered markdown preview with syntax-highlighted code blocks (via Shiki)
 * - Raw markdown with line numbers for thread anchoring
 * - Toggle between views while preserving anchoring
 * - XSS sanitization for security
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer';

/**
 * Copy text to clipboard with fallback for older webview contexts
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older webview contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};

export interface MarkdownViewerProps {
  /** Markdown content to display */
  content: string | null;
  /** File path for header display */
  filePath?: string;
  /** Callback when a line is clicked in raw view (for thread anchoring) */
  onLineClick?: (lineNumber: number) => void;
  /** Theme for syntax highlighting (default: 'dark') */
  theme?: 'light' | 'dark';
  /** Whether to enable code block highlighting (default: true) */
  highlightCode?: boolean;
}

type ViewMode = 'raw' | 'rendered';

/**
 * Raw line component with line number and click handler for anchoring
 */
function RawLine({ 
  lineNumber, 
  content, 
  onClick 
}: { 
  lineNumber: number; 
  content: string;
  onClick?: (lineNumber: number) => void;
}): React.ReactElement {
  const handleClick = useCallback(() => {
    onClick?.(lineNumber);
  }, [lineNumber, onClick]);

  return (
    <div 
      className="raw-line" 
      data-testid={`line-${lineNumber}`}
      onClick={handleClick}
    >
      <span className="line-number">{lineNumber}</span>
      <span className="line-content">{content}</span>
    </div>
  );
}

/**
 * Raw view showing markdown source with line numbers
 */
function RawView({ 
  content, 
  onLineClick 
}: { 
  content: string;
  onLineClick?: (lineNumber: number) => void;
}): React.ReactElement {
  const lines = content.split('\n');

  return (
    <div className="markdown-raw">
      {lines.map((line, index) => (
        <RawLine 
          key={index}
          lineNumber={index + 1}
          content={line}
          onClick={onLineClick}
        />
      ))}
    </div>
  );
}

/**
 * Rendered view showing parsed markdown as HTML with syntax-highlighted code blocks
 */
function RenderedView({ 
  content,
  theme = 'dark',
  highlightCode = true,
}: { 
  content: string;
  theme?: 'light' | 'dark';
  highlightCode?: boolean;
}): React.ReactElement {
  const { html, isLoading } = useMarkdownRenderer({
    markdown: content,
    theme,
    highlightCode,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject copy buttons into code blocks after HTML is rendered
  useEffect(() => {
    if (isLoading || !containerRef.current) return;

    const container = containerRef.current;
    // Find all <pre> elements (fenced code blocks) - these contain <code> elements
    const preElements = container.querySelectorAll('pre');

    preElements.forEach((pre) => {
      // Skip if already has a copy button
      if (pre.querySelector('.markdown-copy-button')) return;

      // Make pre position relative for button positioning
      pre.style.position = 'relative';

      // Get the code content (from the <code> element inside <pre>)
      const codeElement = pre.querySelector('code');
      const codeContent = codeElement?.textContent || pre.textContent || '';

      // Create copy button
      const button = document.createElement('button');
      button.className = 'markdown-copy-button copy-button';
      button.type = 'button';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.textContent = 'Copy';

      // Handle click
      button.addEventListener('click', async () => {
        const success = await copyToClipboard(codeContent);
        if (success) {
          button.textContent = 'Copied!';
          button.classList.add('copy-button-copied');
          setTimeout(() => {
            button.textContent = 'Copy';
            button.classList.remove('copy-button-copied');
          }, 2000);
        }
      });

      pre.appendChild(button);
    });

    // Cleanup function to remove buttons when component unmounts or html changes
    return () => {
      const buttons = container.querySelectorAll('.markdown-copy-button');
      buttons.forEach((btn) => btn.remove());
    };
  }, [html, isLoading]);

  if (isLoading) {
    return (
      <div 
        className="markdown-rendered markdown-rendered-loading"
        aria-busy="true"
        aria-label="Loading markdown"
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="markdown-rendered"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * View toggle button group
 */
function ViewToggle({ 
  mode, 
  onChange 
}: { 
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}): React.ReactElement {
  return (
    <div className="view-toggle" role="group" aria-label="View mode">
      <button
        type="button"
        className={`toggle-button ${mode === 'raw' ? 'active' : ''}`}
        onClick={() => onChange('raw')}
        aria-pressed={mode === 'raw'}
      >
        Raw
      </button>
      <button
        type="button"
        className={`toggle-button ${mode === 'rendered' ? 'active' : ''}`}
        onClick={() => onChange('rendered')}
        aria-pressed={mode === 'rendered'}
      >
        Rendered
      </button>
    </div>
  );
}

export function MarkdownViewer({ 
  content, 
  filePath,
  onLineClick,
  theme = 'dark',
  highlightCode = true,
}: MarkdownViewerProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  // Empty state
  if (!content) {
    return (
      <div className="markdown-viewer markdown-viewer-empty">
        <p>Select a file to view markdown</p>
      </div>
    );
  }

  return (
    <div className="markdown-viewer">
      <div className="markdown-header">
        {filePath && <span className="file-path">{filePath}</span>}
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>
      <div className="markdown-content">
        {viewMode === 'rendered' ? (
          <RenderedView content={content} theme={theme} highlightCode={highlightCode} />
        ) : (
          <RawView content={content} onLineClick={onLineClick} />
        )}
      </div>
    </div>
  );
}
