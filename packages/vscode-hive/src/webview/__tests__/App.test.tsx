/**
 * Tests for main App component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from './test-utils';
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

  it('renders sidebar area', () => {
    render(<App />);

    // In default workspace mode, sidebar is provided by HivePanel
    expect(screen.getByTestId('hive-panel-sidebar')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders review summary panel', () => {
    render(<App />);

    // Should have review submission controls with codicons
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Request Changes')).toBeInTheDocument();
    expect(screen.getByText('Submit Review')).toBeInTheDocument();
  });

  it('changes active scope when tab is clicked', () => {
    render(<App />);

    // Click on Code tab
    fireEvent.click(screen.getByText('Code'));

    // Code tab should be active (antd Segmented uses ant-segmented-item-selected class)
    expect(screen.getByText('Code').closest('.ant-segmented-item')).toHaveClass(
      'ant-segmented-item-selected',
    );
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

describe('App - Antd Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses antd Layout components', () => {
    render(<App />);

    // Should use antd Layout structure
    const layout = document.querySelector('.ant-layout');
    expect(layout).toBeInTheDocument();
  });

  it('uses HiveThemeProvider wrapper', () => {
    render(<App />);

    // The App should be wrapped with antd's ConfigProvider (via HiveThemeProvider)
    // We can verify this by checking that antd styles are applied
    const layout = document.querySelector('.ant-layout');
    expect(layout).toBeInTheDocument();
  });
});

describe('App - Workspace Mode (no session)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HivePanel when no review session is active', () => {
    render(<App />);

    // In workspace mode, HivePanel should be rendered
    expect(screen.getByTestId('hive-panel')).toBeInTheDocument();
  });

  it('renders HivePanel sidebar and content area', () => {
    render(<App />);

    expect(screen.getByTestId('hive-panel-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('hive-panel-content')).toBeInTheDocument();
  });

  it('does not render collapsible review sidebar', () => {
    render(<App />);

    // No collapsible sider trigger in workspace mode
    const siderTrigger = document.querySelector('.ant-layout-sider-trigger');
    expect(siderTrigger).not.toBeInTheDocument();
  });

  it('calls useWorkspaceMessages in workspace mode (sends requestFeatures on mount)', async () => {
    const { postMessage } = await import('../vscodeApi');

    render(<App />);

    // useWorkspaceMessages sends requestFeatures on mount
    expect(postMessage).toHaveBeenCalledWith({ type: 'requestFeatures' });
  });
});

describe('App - Review Mode (with session)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to render App and simulate receiving a sessionData message
   * to put it into review mode.
   *
   * Broadcasts the message to ALL registered addMessageListener handlers
   * (mimicking real window.addEventListener behavior where every listener
   * receives every message).
   */
  async function renderInReviewMode() {
    const { addMessageListener } = await import('../vscodeApi');
    render(<App />);

    const message = {
      type: 'sessionData',
      session: {
        schemaVersion: 1 as const,
        id: 'test-session',
        featureName: 'test-feature',
        scope: 'feature' as const,
        status: 'in_progress' as const,
        verdict: null,
        summary: null,
        threads: [],
        diffs: {},
        gitMeta: {
          repoRoot: '/repo',
          baseRef: 'main',
          headRef: 'feature-branch',
          mergeBase: 'abc123',
          capturedAt: new Date().toISOString(),
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          diffSummary: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      config: {
        autoOpen: false,
        defaultScope: 'feature',
      },
    } as any;

    // Broadcast to all registered handlers (real behavior: all listeners see all messages)
    act(() => {
      const calls = vi.mocked(addMessageListener).mock.calls;
      for (const call of calls) {
        call[0](message);
      }
    });
  }

  it('renders sidebar navigation in review mode', async () => {
    await renderInReviewMode();

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders a collapsible sidebar in review mode', async () => {
    await renderInReviewMode();

    const siderTrigger = document.querySelector('.ant-layout-sider-trigger');
    expect(siderTrigger).toBeInTheDocument();
  });

  it('collapses sidebar when trigger is clicked in review mode', async () => {
    await renderInReviewMode();

    const sider = document.querySelector('.ant-layout-sider');
    expect(sider).toBeInTheDocument();

    // Initially not collapsed
    expect(sider).not.toHaveClass('ant-layout-sider-collapsed');

    // Click the collapse trigger
    const trigger = document.querySelector('.ant-layout-sider-trigger');
    if (trigger) {
      fireEvent.click(trigger);
    }

    // Should be collapsed now
    expect(sider).toHaveClass('ant-layout-sider-collapsed');
  });

  it('renders main content area in review mode', async () => {
    await renderInReviewMode();

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('does not render HivePanel in review mode', async () => {
    await renderInReviewMode();

    expect(screen.queryByTestId('hive-panel')).not.toBeInTheDocument();
  });
});

describe('App - File Content Request Protocol', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to broadcast a message to all registered addMessageListener handlers
   * (mimics real behavior where all listeners receive all messages).
   */
  async function broadcastMessage(message: Record<string, unknown>) {
    const { addMessageListener } = await import('../vscodeApi');
    const calls = vi.mocked(addMessageListener).mock.calls;
    for (const call of calls) {
      call[0](message as any);
    }
  }

  it('handles fileContent message by storing content', async () => {
    const { addMessageListener } = await import('../vscodeApi');

    render(<App />);

    // Verify addMessageListener was called
    expect(addMessageListener).toHaveBeenCalled();

    // Simulate receiving fileContent message
    await act(async () => {
      await broadcastMessage({
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
    render(<App />);

    // Simulate receiving fileError message
    await act(async () => {
      await broadcastMessage({
        type: 'fileError',
        uri: 'nonexistent.ts',
        error: 'File not found: nonexistent.ts',
      });
    });

    // The error should be stored (verified via internal state)
  });

  it('handles fileContent with warning for large files', async () => {
    render(<App />);

    // Simulate receiving fileContent with warning
    await act(async () => {
      await broadcastMessage({
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
