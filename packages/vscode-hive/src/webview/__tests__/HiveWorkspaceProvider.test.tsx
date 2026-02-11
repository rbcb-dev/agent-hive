/**
 * Tests for HiveWorkspaceProvider and useHiveWorkspace hook
 *
 * Verifies:
 * - Provider renders children
 * - useHiveWorkspace throws outside provider
 * - selectFeature dispatches state change
 * - selectTask dispatches state change
 * - selectFile dispatches state change
 * - selectView dispatches state change
 * - refreshFeatures calls callback
 * - Derived state updates correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import React from 'react';

import {
  HiveWorkspaceProvider,
  useHiveWorkspace,
  workspaceReducer,
} from '../providers/HiveWorkspaceProvider';
import type {
  HiveWorkspaceState,
  HiveWorkspaceAction,
} from '../providers/HiveWorkspaceProvider';
import type { FeatureInfo, ReviewThread, ReviewSession } from 'hive-core';

const mockFeatures: FeatureInfo[] = [
  {
    name: 'feature-one',
    status: 'executing',
    tasks: [
      {
        folder: 'task-a',
        name: 'task-a',
        status: 'in_progress',
        origin: 'plan',
      },
      {
        folder: 'task-b',
        name: 'task-b',
        status: 'pending',
        origin: 'plan',
      },
    ],
    hasPlan: true,
    commentCount: 2,
  },
  {
    name: 'feature-two',
    status: 'planning',
    tasks: [],
    hasPlan: false,
    commentCount: 0,
  },
];

const mockInitialState: HiveWorkspaceState = {
  features: mockFeatures,
  activeFeature: null,
  activeTask: null,
  activeFile: null,
  activeView: 'plan',
  fileChanges: new Map(),
  planContent: null,
  planComments: [],
  contextContent: null,
  isLoading: false,
  reviewThreads: [],
  activeReviewSession: null,
  commits: [],
  commitDiff: null,
};

function makeThread(overrides: Partial<ReviewThread> = {}): ReviewThread {
  return {
    id: 'thread-1',
    entityId: 'entity-1',
    uri: 'file:///src/index.ts',
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 10 },
    },
    status: 'open',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    annotations: [],
    ...overrides,
  };
}

function makeSession(overrides: Partial<ReviewSession> = {}): ReviewSession {
  return {
    schemaVersion: 1,
    id: 'session-1',
    featureName: 'feature-one',
    scope: 'feature',
    status: 'in_progress',
    verdict: null,
    summary: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    threads: [],
    diffs: {},
    gitMeta: {
      repoRoot: '/repo',
      baseRef: 'main',
      headRef: 'feature',
      mergeBase: 'abc123',
      capturedAt: '2026-01-01T00:00:00Z',
      diffStats: { files: 0, insertions: 0, deletions: 0 },
      diffSummary: [],
    },
    ...overrides,
  };
}

function createWrapper(
  initialState?: Partial<HiveWorkspaceState>,
  onRefresh?: () => void,
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HiveWorkspaceProvider
        initialState={{ ...mockInitialState, ...initialState }}
        onRefreshFeatures={onRefresh}
      >
        {children}
      </HiveWorkspaceProvider>
    );
  };
}

describe('HiveWorkspaceProvider', () => {
  it('renders children', () => {
    render(
      <HiveWorkspaceProvider initialState={mockInitialState}>
        <div data-testid="child">Hello</div>
      </HiveWorkspaceProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('provides initial state to consumers', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.features).toEqual(mockFeatures);
    expect(result.current.state.activeFeature).toBeNull();
    expect(result.current.state.activeTask).toBeNull();
    expect(result.current.state.activeFile).toBeNull();
    expect(result.current.state.activeView).toBe('plan');
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe('useHiveWorkspace', () => {
  it('throws when called outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useHiveWorkspace());
    }).toThrow(/useHiveWorkspace must be used within a HiveWorkspaceProvider/);

    consoleSpy.mockRestore();
  });

  it('selectFeature updates activeFeature and resets activeTask/activeFile', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.actions.selectFeature('feature-one');
    });

    expect(result.current.state.activeFeature).toBe('feature-one');
    expect(result.current.state.activeTask).toBeNull();
    expect(result.current.state.activeFile).toBeNull();
  });

  it('selectTask updates activeTask and resets activeFile', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper({ activeFeature: 'feature-one' }),
    });

    act(() => {
      result.current.actions.selectTask('task-a');
    });

    expect(result.current.state.activeTask).toBe('task-a');
    expect(result.current.state.activeFile).toBeNull();
    expect(result.current.state.activeView).toBe('task');
  });

  it('selectFile updates activeFile and sets view to diff', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper({
        activeFeature: 'feature-one',
        activeTask: 'task-a',
      }),
    });

    act(() => {
      result.current.actions.selectFile('/src/index.ts');
    });

    expect(result.current.state.activeFile).toBe('/src/index.ts');
    expect(result.current.state.activeView).toBe('diff');
  });

  it('selectView updates activeView', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.actions.selectView('context');
    });

    expect(result.current.state.activeView).toBe('context');
  });

  it('refreshFeatures calls onRefreshFeatures callback', () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(undefined, onRefresh),
    });

    act(() => {
      result.current.actions.refreshFeatures();
    });

    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('selectFeature then selectTask then selectFile tracks full navigation', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    // Select a feature
    act(() => {
      result.current.actions.selectFeature('feature-one');
    });
    expect(result.current.state.activeFeature).toBe('feature-one');
    expect(result.current.state.activeView).toBe('plan');

    // Select a task
    act(() => {
      result.current.actions.selectTask('task-a');
    });
    expect(result.current.state.activeTask).toBe('task-a');
    expect(result.current.state.activeView).toBe('task');

    // Select a file
    act(() => {
      result.current.actions.selectFile('/src/index.ts');
    });
    expect(result.current.state.activeFile).toBe('/src/index.ts');
    expect(result.current.state.activeView).toBe('diff');

    // Selecting a new feature resets task and file
    act(() => {
      result.current.actions.selectFeature('feature-two');
    });
    expect(result.current.state.activeFeature).toBe('feature-two');
    expect(result.current.state.activeTask).toBeNull();
    expect(result.current.state.activeFile).toBeNull();
    expect(result.current.state.activeView).toBe('plan');
  });
});

// ---------------------------------------------------------------------------
// Review thread state tests
// ---------------------------------------------------------------------------

describe('workspaceReducer — review thread state', () => {
  it('SET_REVIEW_THREADS replaces reviewThreads array', () => {
    const threads = [
      makeThread({ id: 't-1' }),
      makeThread({ id: 't-2', status: 'resolved' }),
    ];
    const state = workspaceReducer(mockInitialState, {
      type: 'SET_REVIEW_THREADS',
      threads,
    });

    expect(state.reviewThreads).toHaveLength(2);
    expect(state.reviewThreads[0].id).toBe('t-1');
    expect(state.reviewThreads[1].status).toBe('resolved');
  });

  it('SET_REVIEW_SESSION sets activeReviewSession', () => {
    const session = makeSession({ id: 'sess-42' });
    const state = workspaceReducer(mockInitialState, {
      type: 'SET_REVIEW_SESSION',
      session,
    });

    expect(state.activeReviewSession).not.toBeNull();
    expect(state.activeReviewSession!.id).toBe('sess-42');
  });

  it('SET_REVIEW_SESSION with null clears session', () => {
    const withSession: HiveWorkspaceState = {
      ...mockInitialState,
      activeReviewSession: makeSession(),
    };
    const state = workspaceReducer(withSession, {
      type: 'SET_REVIEW_SESSION',
      session: null,
    });

    expect(state.activeReviewSession).toBeNull();
  });

  it('SELECT_FEATURE resets reviewThreads and activeReviewSession', () => {
    const withReviewState: HiveWorkspaceState = {
      ...mockInitialState,
      reviewThreads: [makeThread()],
      activeReviewSession: makeSession(),
    };
    const state = workspaceReducer(withReviewState, {
      type: 'SELECT_FEATURE',
      name: 'other-feature',
    });

    expect(state.reviewThreads).toEqual([]);
    expect(state.activeReviewSession).toBeNull();
  });

  it('provides initial reviewThreads as empty array', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.reviewThreads).toEqual([]);
    expect(result.current.state.activeReviewSession).toBeNull();
  });
});

describe('HiveWorkspaceActions — review thread actions', () => {
  it('exposes all 7 review thread action methods', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.actions.addThread).toBe('function');
    expect(typeof result.current.actions.replyToThread).toBe('function');
    expect(typeof result.current.actions.resolveThread).toBe('function');
    expect(typeof result.current.actions.unresolveThread).toBe('function');
    expect(typeof result.current.actions.deleteThread).toBe('function');
    expect(typeof result.current.actions.editAnnotation).toBe('function');
    expect(typeof result.current.actions.deleteAnnotation).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Commit state tests
// ---------------------------------------------------------------------------

describe('workspaceReducer — commit state', () => {
  it('SET_COMMITS replaces commits array', () => {
    const commits = [
      {
        sha: 'abc1234',
        message: 'feat: add feature',
        timestamp: '2026-01-01T00:00:00Z',
      },
      {
        sha: 'def5678',
        message: 'fix: bug fix',
        timestamp: '2026-01-02T00:00:00Z',
      },
    ];
    const state = workspaceReducer(mockInitialState, {
      type: 'SET_COMMITS',
      commits,
    });

    expect(state.commits).toHaveLength(2);
    expect(state.commits[0].sha).toBe('abc1234');
    expect(state.commits[1].message).toBe('fix: bug fix');
  });

  it('SET_COMMIT_DIFF sets commitDiff payload', () => {
    const diffs = [
      {
        baseRef: 'abc~1',
        headRef: 'abc',
        mergeBase: 'abc~1',
        repoRoot: '/repo',
        fileRoot: '/repo',
        diffStats: { files: 1, insertions: 5, deletions: 2 },
        files: [
          {
            path: 'src/index.ts',
            status: 'M' as const,
            additions: 5,
            deletions: 2,
            hunks: [],
          },
        ],
      },
    ];
    const state = workspaceReducer(mockInitialState, {
      type: 'SET_COMMIT_DIFF',
      diffs,
    });

    expect(state.commitDiff).toHaveLength(1);
    expect(state.commitDiff![0].files[0].path).toBe('src/index.ts');
  });

  it('SET_COMMIT_DIFF with null clears commitDiff', () => {
    const withDiff: HiveWorkspaceState = {
      ...mockInitialState,
      commitDiff: [
        {
          baseRef: 'a',
          headRef: 'b',
          mergeBase: 'a',
          repoRoot: '/repo',
          fileRoot: '/repo',
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          files: [],
        },
      ],
    };
    const state = workspaceReducer(withDiff, {
      type: 'SET_COMMIT_DIFF',
      diffs: null,
    });

    expect(state.commitDiff).toBeNull();
  });

  it('SELECT_FEATURE resets commits and commitDiff', () => {
    const withCommitState: HiveWorkspaceState = {
      ...mockInitialState,
      commits: [
        { sha: 'abc', message: 'test', timestamp: '2026-01-01T00:00:00Z' },
      ],
      commitDiff: [
        {
          baseRef: 'a',
          headRef: 'b',
          mergeBase: 'a',
          repoRoot: '/repo',
          fileRoot: '/repo',
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          files: [],
        },
      ],
    };
    const state = workspaceReducer(withCommitState, {
      type: 'SELECT_FEATURE',
      name: 'other-feature',
    });

    expect(state.commits).toEqual([]);
    expect(state.commitDiff).toBeNull();
  });

  it('SELECT_TASK resets commits and commitDiff', () => {
    const withCommitState: HiveWorkspaceState = {
      ...mockInitialState,
      activeFeature: 'feature-one',
      commits: [
        { sha: 'abc', message: 'test', timestamp: '2026-01-01T00:00:00Z' },
      ],
      commitDiff: [
        {
          baseRef: 'a',
          headRef: 'b',
          mergeBase: 'a',
          repoRoot: '/repo',
          fileRoot: '/repo',
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          files: [],
        },
      ],
    };
    const state = workspaceReducer(withCommitState, {
      type: 'SELECT_TASK',
      folder: 'task-b',
    });

    expect(state.commits).toEqual([]);
    expect(state.commitDiff).toBeNull();
  });

  it('provides initial commits as empty array and commitDiff as null', () => {
    const { result } = renderHook(() => useHiveWorkspace(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.commits).toEqual([]);
    expect(result.current.state.commitDiff).toBeNull();
  });
});
