/**
 * Tests for useReviewSession hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReviewSession } from '../useReviewSession';
import type { ReviewSession, ReviewThread } from 'hive-core';

// Mock vscodeApi
vi.mock('../../vscodeApi', () => ({
  postMessage: vi.fn(),
  addMessageListener: vi.fn(() => vi.fn()),
  notifyReady: vi.fn(),
}));

const mockSession: ReviewSession = {
  schemaVersion: 1,
  id: 'test-session',
  featureName: 'test-feature',
  scope: 'feature',
  status: 'in_progress',
  verdict: null,
  summary: null,
  gitMeta: {
    repoRoot: '/repo',
    baseRef: 'main',
    headRef: 'feature',
    mergeBase: 'abc123',
    capturedAt: '2024-01-01T00:00:00Z',
    diffStats: { files: 0, insertions: 0, deletions: 0 },
    diffSummary: [],
  },
  diffs: {},
  threads: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockThread: ReviewThread = {
  id: 'thread-1',
  entityId: 'entity-1',
  uri: 'src/test.ts',
  range: { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } },
  annotations: [
    {
      id: 'ann-1',
      type: 'comment',
      body: 'Test comment',
      author: { type: 'human', name: 'Test User' },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  status: 'open',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useReviewSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null session', () => {
    const { result } = renderHook(() => useReviewSession());

    expect(result.current.session).toBeNull();
    expect(result.current.activeScope).toBe('feature');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.selectedThread).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('sets up message listener on mount', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    renderHook(() => useReviewSession());

    expect(addMessageListener).toHaveBeenCalled();
  });

  it('notifies extension on mount', async () => {
    const { notifyReady } = await import('../../vscodeApi');
    renderHook(() => useReviewSession());

    expect(notifyReady).toHaveBeenCalled();
  });

  it('cleans up message listener on unmount', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const cleanup = vi.fn();
    vi.mocked(addMessageListener).mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useReviewSession());
    unmount();

    expect(cleanup).toHaveBeenCalled();
  });

  it('handles sessionData message', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    const handler = vi.mocked(addMessageListener).mock.calls[0][0];

    act(() => {
      handler({ type: 'sessionData', session: mockSession });
    });

    expect(result.current.session).toEqual(mockSession);
  });

  it('handles sessionUpdate message', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    const updatedSession = { ...mockSession, status: 'approved' as const };

    act(() => {
      handler({ type: 'sessionUpdate', session: updatedSession });
    });

    expect(result.current.session?.status).toBe('approved');
  });

  it('handles scopeChanged message', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    const scopeContent = {
      uri: 'plan.md',
      content: '# Plan',
      language: 'markdown',
    };

    act(() => {
      handler({ type: 'scopeChanged', scope: 'plan', scopeContent });
    });

    expect(result.current.activeScope).toBe('plan');
    expect(result.current.scopeContent).toEqual(scopeContent);
  });

  it('changes scope and notifies extension', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    act(() => {
      result.current.handleScopeChange('code');
    });

    expect(result.current.activeScope).toBe('code');
    expect(postMessage).toHaveBeenCalledWith({
      type: 'changeScope',
      scope: 'code',
    });
  });

  it('selects file and notifies extension', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    act(() => {
      result.current.handleSelectFile('src/app.ts');
    });

    expect(result.current.selectedFile).toBe('src/app.ts');
    expect(postMessage).toHaveBeenCalledWith({
      type: 'selectFile',
      path: 'src/app.ts',
    });
  });

  it('selects thread and notifies extension', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    act(() => {
      result.current.handleSelectThread('thread-123');
    });

    expect(result.current.selectedThread).toBe('thread-123');
    expect(postMessage).toHaveBeenCalledWith({
      type: 'selectThread',
      threadId: 'thread-123',
    });
  });

  it('handles reply to existing thread', async () => {
    const { postMessage, addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    // Set up session with a thread
    const sessionWithThread = { ...mockSession, threads: [mockThread] };
    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    act(() => {
      handler({ type: 'sessionData', session: sessionWithThread });
    });

    act(() => {
      result.current.handleReply('thread-1', 'My reply');
    });

    expect(postMessage).toHaveBeenCalledWith({
      type: 'reply',
      threadId: 'thread-1',
      body: 'My reply',
    });
  });

  it('handles adding comment to new thread', async () => {
    const { postMessage, addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    // Set up session without the target thread
    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    act(() => {
      handler({ type: 'sessionData', session: mockSession });
      handler({
        type: 'scopeChanged',
        scope: 'plan',
        scopeContent: { uri: 'plan.md', content: '', language: 'markdown' },
      });
    });

    act(() => {
      result.current.handleReply('new-thread-id', 'New comment');
    });

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addComment',
        entityId: 'new-thread-id',
        body: 'New comment',
        annotationType: 'comment',
      }),
    );
  });

  it('resolves thread', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    act(() => {
      result.current.handleResolve('thread-123');
    });

    expect(postMessage).toHaveBeenCalledWith({
      type: 'resolve',
      threadId: 'thread-123',
    });
  });

  it('submits review and sets submitting state', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.handleSubmit('approve', 'Looks good!');
    });

    expect(result.current.isSubmitting).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({
      type: 'submit',
      verdict: 'approve',
      summary: 'Looks good!',
    });
  });

  it('adds new comment to session threads', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    act(() => {
      handler({ type: 'sessionData', session: mockSession });
      handler({
        type: 'scopeChanged',
        scope: 'plan',
        scopeContent: { uri: 'plan.md', content: '', language: 'markdown' },
      });
    });

    act(() => {
      result.current.handleAddComment();
    });

    // Should add a new thread to the session
    expect(result.current.session?.threads.length).toBe(1);
    expect(result.current.selectedThread).toBeDefined();
  });

  it('provides thread summaries', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    const sessionWithThread = { ...mockSession, threads: [mockThread] };
    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    act(() => {
      handler({ type: 'sessionData', session: sessionWithThread });
    });

    expect(result.current.threadSummaries).toHaveLength(1);
    expect(result.current.threadSummaries[0]).toEqual({
      id: 'thread-1',
      uri: 'src/test.ts',
      firstLine: 'Test comment',
      status: 'open',
      commentCount: 1,
      lastUpdated: '2024-01-01T00:00:00Z',
    });
  });

  it('provides file paths from diffs', async () => {
    const { addMessageListener } = await import('../../vscodeApi');
    const { result } = renderHook(() => useReviewSession());

    const sessionWithDiffs: ReviewSession = {
      ...mockSession,
      diffs: {
        default: {
          baseRef: 'main',
          headRef: 'feature',
          mergeBase: 'abc123',
          repoRoot: '/repo',
          fileRoot: '/repo',
          diffStats: { files: 2, insertions: 30, deletions: 5 },
          files: [
            {
              path: 'src/app.ts',
              status: 'M',
              hunks: [],
              additions: 10,
              deletions: 5,
            },
            {
              path: 'src/utils.ts',
              status: 'A',
              hunks: [],
              additions: 20,
              deletions: 0,
            },
          ],
        },
      },
    };

    const handler = vi.mocked(addMessageListener).mock.calls[0][0];
    act(() => {
      handler({ type: 'sessionData', session: sessionWithDiffs });
    });

    expect(result.current.filePaths).toEqual(['src/app.ts', 'src/utils.ts']);
  });
});
