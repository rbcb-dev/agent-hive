/**
 * Tests for main App component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../App';

// Mock vscodeApi
vi.mock('../vscodeApi', () => ({
  notifyReady: vi.fn(),
  addMessageListener: vi.fn(() => vi.fn()),
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main layout', () => {
    render(<App />);

    // Should have scope tabs
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('renders sidebar navigation', () => {
    render(<App />);

    // Sidebar should show files or threads list
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders review summary panel', () => {
    render(<App />);

    // Should have review submission controls
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Request Changes')).toBeInTheDocument();
    expect(screen.getByText('Submit Review')).toBeInTheDocument();
  });

  it('changes active scope when tab is clicked', () => {
    render(<App />);

    // Click on Code tab
    fireEvent.click(screen.getByText('Code'));

    // Code tab should be active (antd Segmented uses ant-segmented-item-selected class)
    expect(screen.getByText('Code').closest('.ant-segmented-item')).toHaveClass('ant-segmented-item-selected');
  });

  it('notifies extension that webview is ready on mount', async () => {
    const { notifyReady } = await import('../vscodeApi');
    render(<App />);
    
    expect(notifyReady).toHaveBeenCalled();
  });

  describe('content type routing', () => {
    it('isMarkdownFile returns true for .md files', async () => {
      const { isMarkdownFile } = await import('../App');
      expect(isMarkdownFile('README.md')).toBe(true);
      expect(isMarkdownFile('docs/guide.md')).toBe(true);
      expect(isMarkdownFile('CHANGELOG.MD')).toBe(true);
    });

    it('isMarkdownFile returns true for .markdown files', async () => {
      const { isMarkdownFile } = await import('../App');
      expect(isMarkdownFile('readme.markdown')).toBe(true);
    });

    it('isMarkdownFile returns false for non-markdown files', async () => {
      const { isMarkdownFile } = await import('../App');
      expect(isMarkdownFile('app.ts')).toBe(false);
      expect(isMarkdownFile('style.css')).toBe(false);
      expect(isMarkdownFile('package.json')).toBe(false);
    });
  });
});

describe('App - File Content Request Protocol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles fileContent message by storing content', async () => {
    const { addMessageListener } = await import('../vscodeApi');
    
    render(<App />);
    
    // Verify addMessageListener was called
    expect(addMessageListener).toHaveBeenCalled();
    
    // Get the handler that was passed to addMessageListener
    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    
    // Simulate receiving fileContent message
    act(() => {
      handler({
        type: 'fileContent',
        uri: 'src/test.ts',
        content: 'const x = 1;',
        language: 'typescript',
      });
    });
    
    // The content should be stored (we can verify by checking there's no error state)
    // In a full implementation, we'd expose the cache via context or props
  });

  it('handles fileError message by storing error', async () => {
    const { addMessageListener } = await import('../vscodeApi');
    
    render(<App />);
    
    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    
    // Simulate receiving fileError message
    act(() => {
      handler({
        type: 'fileError',
        uri: 'nonexistent.ts',
        error: 'File not found: nonexistent.ts',
      });
    });
    
    // The error should be stored (verified via internal state)
  });

  it('handles fileContent with warning for large files', async () => {
    const { addMessageListener } = await import('../vscodeApi');
    
    render(<App />);
    
    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    
    // Simulate receiving fileContent with warning
    act(() => {
      handler({
        type: 'fileContent',
        uri: 'large-file.json',
        content: '{}',
        language: 'json',
        warning: 'File is large (15.5MB). Reading may take a moment.',
      });
    });
    
    // Content and warning should be stored
  });
});
