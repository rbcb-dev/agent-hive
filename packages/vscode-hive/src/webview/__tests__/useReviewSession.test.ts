/**
 * Tests for useReviewSession hook
 *
 * Verifies:
 * - isSubmitting resets to false when sessionUpdate received with terminal status
 * - isSubmitting stays true when sessionUpdate received with in_progress status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import type {
  ExtensionToWebviewMessage,
} from '../types';
import type { ReviewSession } from 'hive-core';

// Mock vscodeApi
const mockPostMessage = vi.fn();
let capturedHandler: ((msg: ExtensionToWebviewMessage) => void) | null = null;

vi.mock('../vscodeApi', () => ({
  postMessage: (...args: unknown[]) => mockPostMessage(...args),
  addMessageListener: (
    handler: (msg: ExtensionToWebviewMessage) => void,
  ): (() => void) => {
    capturedHandler = handler;
    return vi.fn();
  },
  notifyReady: vi.fn(),
}));

function makeSession(overrides: Partial<ReviewSession> = {}): ReviewSession {
  return {
    schemaVersion: 1,
    id: 'session-1',
    featureName: 'test-feature',
    scope: 'feature',
    status: 'in_progress',
    verdict: null,
    summary: null,
    threads: [],
    diffs: {},
    gitMeta: {
      repoRoot: '/repo',
      baseRef: 'abc123',
      headRef: 'def456',
      mergeBase: 'abc123',
      capturedAt: '2026-01-01T00:00:00Z',
      diffStats: { files: 0, insertions: 0, deletions: 0 },
      diffSummary: [],
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useReviewSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandler = null;
  });

  // Lazy import to allow mock registration before module load
  async function importHook() {
    const mod = await import('../hooks/useReviewSession');
    return mod.useReviewSession;
  }

  it('resets isSubmitting to false when sessionUpdate received with approved status', async () => {
    const useReviewSession = await importHook();
    const { result } = renderHook(() => useReviewSession());

    expect(capturedHandler).toBeDefined();

    // Step 1: Provide initial session so handleSubmit works
    act(() => {
      capturedHandler!({
        type: 'sessionData',
        session: makeSession(),
        config: {},
      });
    });
    expect(result.current.session).not.toBeNull();

    // Step 2: Submit a review — sets isSubmitting to true
    act(() => {
      result.current.handleSubmit('approve', 'LGTM');
    });
    expect(result.current.isSubmitting).toBe(true);

    // Step 3: Receive sessionUpdate with terminal status 'approved'
    act(() => {
      capturedHandler!({
        type: 'sessionUpdate',
        session: makeSession({ status: 'approved' }),
      });
    });

    // isSubmitting should be reset to false
    expect(result.current.isSubmitting).toBe(false);
  });

  it('resets isSubmitting to false when sessionUpdate received with changes_requested status', async () => {
    const useReviewSession = await importHook();
    const { result } = renderHook(() => useReviewSession());

    expect(capturedHandler).toBeDefined();

    // Provide initial session
    act(() => {
      capturedHandler!({
        type: 'sessionData',
        session: makeSession(),
        config: {},
      });
    });

    // Submit
    act(() => {
      result.current.handleSubmit('request_changes', 'Needs work');
    });
    expect(result.current.isSubmitting).toBe(true);

    // Receive sessionUpdate with terminal status
    act(() => {
      capturedHandler!({
        type: 'sessionUpdate',
        session: makeSession({ status: 'changes_requested' }),
      });
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('keeps isSubmitting true when sessionUpdate received with in_progress status', async () => {
    const useReviewSession = await importHook();
    const { result } = renderHook(() => useReviewSession());

    expect(capturedHandler).toBeDefined();

    // Provide initial session
    act(() => {
      capturedHandler!({
        type: 'sessionData',
        session: makeSession(),
        config: {},
      });
    });

    // Submit
    act(() => {
      result.current.handleSubmit('approve', 'LGTM');
    });
    expect(result.current.isSubmitting).toBe(true);

    // Receive sessionUpdate that is still in_progress (e.g., intermediate state)
    act(() => {
      capturedHandler!({
        type: 'sessionUpdate',
        session: makeSession({ status: 'in_progress' }),
      });
    });

    // isSubmitting should remain true — submission hasn't completed
    expect(result.current.isSubmitting).toBe(true);
  });
});
