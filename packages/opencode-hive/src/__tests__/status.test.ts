import { describe, test, expect } from 'bun:test';
import type {
  ReviewSession,
  ReviewIndex,
  ReviewThread,
  ThreadStatus,
} from 'hive-core';
import { buildReviewStatus } from '../utils/status.js';

/**
 * Tests for review state in hive_status output.
 *
 * The hive_status tool should include a `review` section summarizing
 * the active review session and thread counts for the feature.
 */

function makeThread(id: string, status: ThreadStatus = 'open'): ReviewThread {
  return {
    id,
    entityId: 'test-entity',
    uri: 'test.ts',
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
    status,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    annotations: [],
  };
}

function makeGitMeta() {
  return {
    repoRoot: '/test',
    baseRef: 'main',
    headRef: 'HEAD',
    mergeBase: 'main',
    capturedAt: '2026-01-01T00:00:00Z',
    diffStats: { files: 0, insertions: 0, deletions: 0 },
    diffSummary: [],
  };
}

describe('hive_status review section', () => {
  test('with active session having 3 threads (2 open, 1 resolved) → unresolvedThreads: 2, totalThreads: 3', () => {
    const sessions: ReviewIndex['sessions'] = [
      {
        id: 'session-1',
        scope: 'feature',
        status: 'in_progress',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const activeSession: ReviewSession = {
      schemaVersion: 1,
      id: 'session-1',
      featureName: 'test-feature',
      scope: 'feature',
      status: 'in_progress',
      verdict: null,
      summary: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      threads: [
        makeThread('thread-1', 'open'),
        makeThread('thread-2', 'open'),
        makeThread('thread-3', 'resolved'),
      ],
      diffs: {},
      gitMeta: makeGitMeta(),
    };

    const result = buildReviewStatus(sessions, activeSession);

    expect(result.activeSessionId).toBe('session-1');
    expect(result.unresolvedThreads).toBe(2);
    expect(result.totalThreads).toBe(3);
    expect(result.latestVerdict).toBeNull();
    expect(result.latestStatus).toBe('in_progress');
  });

  test('with no sessions → review.activeSessionId: null, counts at 0', () => {
    const sessions: ReviewIndex['sessions'] = [];

    const result = buildReviewStatus(sessions, null);

    expect(result.activeSessionId).toBeNull();
    expect(result.unresolvedThreads).toBe(0);
    expect(result.totalThreads).toBe(0);
    expect(result.latestVerdict).toBeNull();
    expect(result.latestStatus).toBeNull();
  });

  test('with submitted session (no active) → shows latest verdict/status', () => {
    const sessions: ReviewIndex['sessions'] = [
      {
        id: 'session-1',
        scope: 'feature',
        status: 'approved',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const result = buildReviewStatus(sessions, null);

    expect(result.activeSessionId).toBeNull();
    expect(result.unresolvedThreads).toBe(0);
    expect(result.totalThreads).toBe(0);
    expect(result.latestVerdict).toBeNull();
    expect(result.latestStatus).toBe('approved');
  });

  test('with active session having outdated threads → only open threads count as unresolved', () => {
    const sessions: ReviewIndex['sessions'] = [
      {
        id: 'session-2',
        scope: 'feature',
        status: 'in_progress',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const activeSession: ReviewSession = {
      schemaVersion: 1,
      id: 'session-2',
      featureName: 'test-feature',
      scope: 'feature',
      status: 'in_progress',
      verdict: null,
      summary: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      threads: [
        makeThread('thread-1', 'open'),
        makeThread('thread-2', 'outdated'),
        makeThread('thread-3', 'resolved'),
        makeThread('thread-4', 'open'),
      ],
      diffs: {},
      gitMeta: makeGitMeta(),
    };

    const result = buildReviewStatus(sessions, activeSession);

    expect(result.activeSessionId).toBe('session-2');
    expect(result.unresolvedThreads).toBe(2);
    expect(result.totalThreads).toBe(4);
    expect(result.latestStatus).toBe('in_progress');
  });

  test('with submitted session showing verdict and threads → returns session verdict', () => {
    const sessions: ReviewIndex['sessions'] = [
      {
        id: 'session-3',
        scope: 'feature',
        status: 'changes_requested',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const submittedSession: ReviewSession = {
      schemaVersion: 1,
      id: 'session-3',
      featureName: 'test-feature',
      scope: 'feature',
      status: 'changes_requested',
      verdict: 'request_changes',
      summary: 'Needs improvements',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      threads: [
        makeThread('thread-1', 'open'),
        makeThread('thread-2', 'resolved'),
      ],
      diffs: {},
      gitMeta: makeGitMeta(),
    };

    const result = buildReviewStatus(sessions, submittedSession);

    // No active in_progress session
    expect(result.activeSessionId).toBeNull();
    expect(result.unresolvedThreads).toBe(1);
    expect(result.totalThreads).toBe(2);
    expect(result.latestVerdict).toBe('request_changes');
    expect(result.latestStatus).toBe('changes_requested');
  });
});
