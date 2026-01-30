/**
 * MarkdownViewer component - Display markdown with raw/rendered toggle
 * 
 * Supports:
 * - Rendered markdown preview with sanitized output
 * - Raw markdown with line numbers for thread anchoring
 * - Toggle between views while preserving anchoring
 */

import React, { useState, useMemo, useCallback } from 'react';
import { marked } from 'marked';

export interface MarkdownViewerProps {
  /** Markdown content to display */
  content: string | null;
  /** File path for header display */
  filePath?: string;
  /** Callback when a line is clicked in raw view (for thread anchoring) */
  onLineClick?: (lineNumber: number) => void;
}

type ViewMode = 'raw' | 'rendered';

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  
  return sanitized;
}

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
 * Rendered view showing parsed markdown as HTML
 */
function RenderedView({ content }: { content: string }): React.ReactElement {
  const renderedHtml = useMemo(() => {
    // Configure marked for safety
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
    });

    // Parse markdown and sanitize output
    const rawHtml = marked.parse(content, { async: false }) as string;
    return sanitizeHtml(rawHtml);
  }, [content]);

  return (
    <div 
      className="markdown-rendered"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
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
          <RenderedView content={content} />
        ) : (
          <RawView content={content} onLineClick={onLineClick} />
        )}
      </div>
    </div>
  );
}
