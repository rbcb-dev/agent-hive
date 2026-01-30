/**
 * Tests for main App component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    // Code tab should be active (have active class)
    expect(screen.getByText('Code').closest('button')).toHaveClass('active');
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
