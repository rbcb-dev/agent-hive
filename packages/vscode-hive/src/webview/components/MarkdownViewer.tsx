/**
 * MarkdownViewer component - Display markdown with raw/rendered toggle
 * 
 * Supports:
 * - Rendered markdown preview with syntax-highlighted code blocks (via Shiki)
 * - Raw markdown with line numbers for thread anchoring
 * - Toggle between views while preserving anchoring
 * - XSS sanitization for security
 */

import React, { useState, useCallback } from 'react';
import { useMarkdownRenderer } from '../hooks/useMarkdownRenderer';

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
