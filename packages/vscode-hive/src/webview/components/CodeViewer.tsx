/**
 * CodeViewer component - Renders code with VS Code-style syntax highlighting and line numbers
 * Uses Shiki for accurate TextMate-based highlighting with bundled themes.
 * Supports thread markers in the gutter for inline thread display.
 * 
 * BREAKING CHANGE: theme prop has been removed. Theme is now obtained from
 * HiveThemeProvider context via useTheme() hook. Components using CodeViewer
 * must be wrapped in HiveThemeProvider.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { ReviewThread } from 'hive-core';
import { InlineThread } from './InlineThread';
import { useCodeHighlighter } from '../hooks/useCodeHighlighter';
import { useTheme } from '../theme';

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

export interface CodeViewerProps {
  /** The code to display */
  code: string;
  /** Programming language for syntax highlighting */
  language: string;
  /** Starting line number (default: 1) */
  startLine?: number;
  /** Whether to show line numbers (default: true) */
  showLineNumbers?: boolean;
  /** Lines to highlight (1-indexed) */
  highlightLines?: number[];
  /** Line types for diff display (1-indexed) */
  lineTypes?: Record<number, 'add' | 'remove' | 'context'>;
  /** Optional CSS class name */
  className?: string;
  /** Review threads anchored to lines in this file (0-indexed line numbers in range.start.line) */
  threads?: ReviewThread[];
  /** Called when a thread marker is clicked */
  onThreadClick?: (threads: ReviewThread[], lineNumber: number) => void;
  /** Called when user replies to a thread */
  onThreadReply?: (threadId: string, body: string) => void;
  /** Called when user resolves a thread */
  onThreadResolve?: (threadId: string) => void;
}

interface CodeToken {
  content: string;
  color?: string;
}

interface CodeLine {
  content: string;
  lineNumber: number;
  highlighted: boolean;
  type: 'context' | 'add' | 'remove';
  tokens: CodeToken[];
  /** 0-indexed line index (for matching with threads) */
  lineIndex: number;
}

/** Group threads by their starting line (0-indexed) */
function groupThreadsByLine(threads: ReviewThread[]): Map<number, ReviewThread[]> {
  const map = new Map<number, ReviewThread[]>();
  for (const thread of threads) {
    const line = thread.range.start.line;
    if (!map.has(line)) {
      map.set(line, []);
    }
    map.get(line)!.push(thread);
  }
  return map;
}

export function CodeViewer({
  code,
  language,
  startLine = 1,
  showLineNumbers = true,
  highlightLines = [],
  lineTypes = {},
  className,
  threads = [],
  onThreadClick,
  onThreadReply,
  onThreadResolve,
}: CodeViewerProps): React.ReactElement {
  // Get theme from context (requires HiveThemeProvider wrapper)
  const theme = useTheme();
  
  // Use the extracted hook for syntax highlighting
  const { tokens: highlightedTokens, isLoading } = useCodeHighlighter({ code, language, theme });
  
  // Track which line (0-indexed) has expanded inline thread
  const [expandedThreadLine, setExpandedThreadLine] = useState<number | null>(null);
  // Track copy button state
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse code into lines
  const lines = useMemo(() => code.split('\n'), [code]);

  // Get highlighted set for O(1) lookup
  const highlightSet = useMemo(() => new Set(highlightLines), [highlightLines]);

  // Build line data with metadata
  const codeLines: CodeLine[] = useMemo(() => {
    return lines.map((content, index) => {
      const lineNumber = startLine + index;
      return {
        content,
        lineNumber,
        lineIndex: index,
        highlighted: highlightSet.has(lineNumber),
        type: lineTypes[lineNumber] || 'context',
        tokens: highlightedTokens[index] || [{ content }],
      };
    });
  }, [lines, startLine, highlightSet, lineTypes, highlightedTokens]);

  // Group threads by line for gutter markers
  const threadsByLine = useMemo(() => groupThreadsByLine(threads), [threads]);

  // Handle thread marker click
  const handleThreadMarkerClick = useCallback((lineIndex: number, lineThreads: ReviewThread[]) => {
    // Toggle the inline thread expansion
    if (expandedThreadLine === lineIndex) {
      setExpandedThreadLine(null);
    } else {
      setExpandedThreadLine(lineIndex);
    }
    // Call the external handler if provided
    if (onThreadClick) {
      // lineNumber is 1-indexed for external callback
      onThreadClick(lineThreads, lineIndex + 1);
    }
  }, [expandedThreadLine, onThreadClick]);

  // Handle closing inline thread
  const handleCloseInlineThread = useCallback(() => {
    setExpandedThreadLine(null);
  }, []);

  // Handle reply to thread
  const handleThreadReply = useCallback((threadId: string, body: string) => {
    if (onThreadReply) {
      onThreadReply(threadId, body);
    }
  }, [onThreadReply]);

  // Handle resolve thread
  const handleThreadResolve = useCallback((threadId: string) => {
    if (onThreadResolve) {
      onThreadResolve(threadId);
    }
  }, [onThreadResolve]);

  // Handle copy to clipboard
  const handleCopyClick = useCallback(async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopyState('copied');
      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      // Reset to idle after 2 seconds
      copyTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
      }, 2000);
    }
  }, [code]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Empty state
  if (!code) {
    return (
      <div className="code-viewer code-viewer-empty" data-testid="code-viewer">
        <p>No code to display</p>
      </div>
    );
  }

  const lineNumberWidth = String(startLine + lines.length - 1).length;
  const hasThreads = threads.length > 0;

  return (
    <div
      className={`code-viewer ${className || ''}`}
      data-testid="code-viewer"
      data-theme={theme}
      role="region"
      aria-label="Code viewer"
    >
      <button
        className={`copy-button ${copyState === 'copied' ? 'copy-button-copied' : ''}`}
        data-testid="copy-button"
        onClick={handleCopyClick}
        aria-label="Copy code to clipboard"
        type="button"
      >
        {copyState === 'copied' ? 'Copied!' : 'Copy'}
      </button>
      <div className="code-content">
        {codeLines.map((line) => {
          const lineClasses = [
            'code-line',
            line.highlighted ? 'line-highlighted' : null,
            line.type !== 'context' ? `line-${line.type}` : null,
          ]
            .filter(Boolean)
            .join(' ');

          // Get threads for this line (0-indexed)
          const lineThreads = threadsByLine.get(line.lineIndex);
          const hasLineThreads = lineThreads && lineThreads.length > 0;
          const isExpanded = expandedThreadLine === line.lineIndex;
          
          // Check if any thread on this line is resolved
          const allResolved = lineThreads?.every(t => t.status === 'resolved') ?? false;

          return (
            <React.Fragment key={line.lineNumber}>
              <div className={lineClasses} role="presentation">
                {/* Gutter for thread markers */}
                {hasThreads ? (
                  <span className="line-gutter">
                    {hasLineThreads ? (
                      <button
                        className={`thread-marker ${allResolved ? 'thread-marker-resolved' : 'thread-marker-open'}`}
                        data-testid={`thread-marker-${line.lineIndex}`}
                        onClick={() => handleThreadMarkerClick(line.lineIndex, lineThreads)}
                        aria-label={`${lineThreads.length} thread${lineThreads.length > 1 ? 's' : ''} on line ${line.lineNumber}`}
                        aria-expanded={isExpanded}
                      >
                        {lineThreads.length > 1 ? lineThreads.length : '💬'}
                      </button>
                    ) : null}
                  </span>
                ) : null}
                {showLineNumbers ? (
                  <span
                    className="line-number"
                    style={{ minWidth: `${lineNumberWidth}ch` }}
                  >
                    {line.lineNumber}
                  </span>
                ) : null}
                <span className="line-code">
                  {isLoading ? (
                    line.content || '\u00A0'
                  ) : (
                    line.tokens.map((token, i) => (
                      <span
                        key={i}
                        style={token.color ? { color: token.color } : undefined}
                      >
                        {token.content || '\u00A0'}
                      </span>
                    ))
                  )}
                </span>
              </div>
              {/* Inline thread panel when expanded */}
              {isExpanded && lineThreads ? (
                <div className="inline-thread-container">
                  {lineThreads.map((thread) => (
                    <InlineThread
                      key={thread.id}
                      thread={thread}
                      onReply={handleThreadReply}
                      onResolve={handleThreadResolve}
                      onClose={handleCloseInlineThread}
                    />
                  ))}
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
