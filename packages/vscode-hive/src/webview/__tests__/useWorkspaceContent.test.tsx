/**
 * Tests for useWorkspaceContent hook
 *
 * Verifies:
 * - Sends requestPlanContent when activeView changes to 'plan'
 * - Sends requestContextContent when activeView changes to 'context'
 * - Returns planContent/planComments/contextContent from provider state
 * - Returns null content when provider state has no content
 * - Does not send requests when no feature is active
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import {
  HiveWorkspaceProvider,
  useHiveWorkspace,
} from '../providers/HiveWorkspaceProvider';
import type { HiveWorkspaceState } from '../providers/HiveWorkspaceProvider';
import { useWorkspaceContent } from '../hooks/useWorkspaceContent';
import type { PlanComment } from 'hive-core';

// Mock vscodeApi
const mockPostMessage = vi.fn();

vi.mock('../vscodeApi', () => ({
  postMessage: (...args: unknown[]) => mockPostMessage(...args),
  addMessageListener: vi.fn(() => vi.fn()),
  notifyReady: vi.fn(),
}));

const DEFAULT_STATE: HiveWorkspaceState = {
  features: [],
  activeFeature: null,
  activeTask: null,
  activeFile: null,
  activeView: 'plan',
  fileChanges: new Map(),
  planContent: null,
  planComments: [],
  contextContent: null,
  isLoading: false,
};

function createWrapper(initialState?: Partial<HiveWorkspaceState>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HiveWorkspaceProvider
        initialState={{ ...DEFAULT_STATE, ...initialState }}
      >
        {children}
      </HiveWorkspaceProvider>
    );
  };
}

describe('useWorkspaceContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends requestPlanContent when activeView is plan and feature is active', () => {
    renderHook(() => useWorkspaceContent(), {
      wrapper: createWrapper({
        activeFeature: 'my-feature',
        activeView: 'plan',
      }),
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'requestPlanContent',
      feature: 'my-feature',
    });
  });

  it('does not send requestPlanContent when no feature is active', () => {
    renderHook(() => useWorkspaceContent(), {
      wrapper: createWrapper({
        activeFeature: null,
        activeView: 'plan',
      }),
    });

    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'requestPlanContent' }),
    );
  });

  it('sends requestContextContent when activeView is context', () => {
    renderHook(() => useWorkspaceContent(), {
      wrapper: createWrapper({
        activeFeature: 'my-feature',
        activeView: 'context',
      }),
    });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'requestContextContent',
        feature: 'my-feature',
      }),
    );
  });

  it('returns planContent from provider state', () => {
    const mockComments: PlanComment[] = [
      {
        id: 'c1',
        range: {
          start: { line: 4, character: 0 },
          end: { line: 4, character: 0 },
        },
        body: 'Looks good',
        author: 'human',
        timestamp: '2026-01-01T00:00:00Z',
      },
    ];

    const { result } = renderHook(() => useWorkspaceContent(), {
      wrapper: createWrapper({
        activeFeature: 'my-feature',
        activeView: 'plan',
        planContent: '# My Plan\n\nSome content',
        planComments: mockComments,
      }),
    });

    expect(result.current.planContent).toBe('# My Plan\n\nSome content');
    expect(result.current.planComments).toEqual(mockComments);
  });

  it('returns contextContent from provider state', () => {
    const { result } = renderHook(() => useWorkspaceContent(), {
      wrapper: createWrapper({
        activeFeature: 'my-feature',
        activeView: 'context',
        contextContent: '# Research Notes\n\nFindings here',
      }),
    });

    expect(result.current.contextContent).toBe(
      '# Research Notes\n\nFindings here',
    );
  });

  it('returns null content when provider state has no content', () => {
    const { result } = renderHook(() => useWorkspaceContent(), {
      wrapper: createWrapper({
        activeFeature: 'my-feature',
        activeView: 'plan',
      }),
    });

    expect(result.current.planContent).toBeNull();
    expect(result.current.planComments).toEqual([]);
    expect(result.current.contextContent).toBeNull();
  });

  it('reflects provider state changes via dispatch', () => {
    const { result } = renderHook(
      () => {
        const content = useWorkspaceContent();
        const workspace = useHiveWorkspace();
        return { content, dispatch: workspace.dispatch };
      },
      {
        wrapper: createWrapper({
          activeFeature: 'my-feature',
          activeView: 'plan',
        }),
      },
    );

    // Initially null
    expect(result.current.content.planContent).toBeNull();

    // Dispatch plan content (simulating what useWorkspaceMessages does)
    act(() => {
      result.current.dispatch({
        type: 'SET_PLAN_CONTENT',
        content: '# Updated Plan',
        comments: [],
      });
    });

    expect(result.current.content.planContent).toBe('# Updated Plan');
  });
});
