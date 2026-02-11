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
} from '../providers/HiveWorkspaceProvider';
import type { HiveWorkspaceState } from '../providers/HiveWorkspaceProvider';
import type { FeatureInfo } from 'hive-core';

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
};

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
    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

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
