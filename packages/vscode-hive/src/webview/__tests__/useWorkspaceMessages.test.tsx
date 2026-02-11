/**
 * Tests for useWorkspaceMessages hook
 *
 * Verifies:
 * - Sends requestFeatures on mount
 * - Handles featuresData response
 * - Sends requestFeatureDiffs when feature selected
 * - Handles featureDiffs response
 * - Sends requestTaskDiff when task selected
 * - Handles taskDiff response
 * - Type union includes all variants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

import {
  HiveWorkspaceProvider,
  useHiveWorkspace,
} from '../providers/HiveWorkspaceProvider';
import type { HiveWorkspaceState } from '../providers/HiveWorkspaceProvider';
import { useWorkspaceMessages } from '../hooks/useWorkspaceMessages';
import type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
} from '../types';
import type { FeatureInfo, DiffPayload } from 'hive-core';

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
    ],
    hasPlan: true,
    commentCount: 0,
  },
];

const mockDiffPayload: DiffPayload = {
  baseRef: 'abc123',
  headRef: 'def456',
  mergeBase: 'abc123',
  repoRoot: '/repo',
  fileRoot: '/repo',
  diffStats: { files: 1, insertions: 10, deletions: 2 },
  files: [
    {
      path: 'src/index.ts',
      status: 'M',
      additions: 10,
      deletions: 2,
      hunks: [],
    },
  ],
};

const DEFAULT_STATE: HiveWorkspaceState = {
  features: [],
  activeFeature: null,
  activeTask: null,
  activeFile: null,
  activeView: 'plan',
  fileChanges: new Map(),
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

describe('useWorkspaceMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends requestFeatures on mount', () => {
    renderHook(() => useWorkspaceMessages(), {
      wrapper: createWrapper(),
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'requestFeatures' });
  });

  it('handles featuresData response', () => {
    const { result } = renderHook(
      () => {
        useWorkspaceMessages();
        return useHiveWorkspace();
      },
      { wrapper: createWrapper() },
    );

    // Get the message handler registered via addMessageListener
    expect(capturedHandler).toBeDefined();

    // Simulate receiving a featuresData message
    act(() => {
      capturedHandler!({
        type: 'featuresData',
        features: mockFeatures,
      });
    });

    expect(result.current.state.features).toEqual(mockFeatures);
  });

  it('sends requestFeatureDiffs when feature selected', () => {
    const { result } = renderHook(
      () => {
        useWorkspaceMessages();
        return useHiveWorkspace();
      },
      {
        wrapper: createWrapper({
          features: mockFeatures,
        }),
      },
    );

    // Clear initial requestFeatures call
    mockPostMessage.mockClear();

    // Select a feature
    act(() => {
      result.current.actions.selectFeature('feature-one');
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'requestFeatureDiffs',
      feature: 'feature-one',
    });
  });

  it('handles featureDiffs response', () => {
    const { result } = renderHook(
      () => {
        useWorkspaceMessages();
        return useHiveWorkspace();
      },
      {
        wrapper: createWrapper({
          activeFeature: 'feature-one',
        }),
      },
    );

    expect(capturedHandler).toBeDefined();

    const diffs: Record<string, DiffPayload[]> = {
      'task-a': [mockDiffPayload],
    };

    act(() => {
      capturedHandler!({
        type: 'featureDiffs',
        feature: 'feature-one',
        diffs,
      });
    });

    expect(result.current.state.fileChanges).toEqual(new Map([['task-a', [mockDiffPayload]]]));
  });

  it('sends requestTaskDiff when task selected', () => {
    const { result } = renderHook(
      () => {
        useWorkspaceMessages();
        return useHiveWorkspace();
      },
      {
        wrapper: createWrapper({
          features: mockFeatures,
          activeFeature: 'feature-one',
        }),
      },
    );

    mockPostMessage.mockClear();

    act(() => {
      result.current.actions.selectTask('task-a');
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'requestTaskDiff',
      feature: 'feature-one',
      task: 'task-a',
    });
  });

  it('handles taskDiff response', () => {
    const { result } = renderHook(
      () => {
        useWorkspaceMessages();
        return useHiveWorkspace();
      },
      {
        wrapper: createWrapper({
          activeFeature: 'feature-one',
          activeTask: 'task-a',
        }),
      },
    );

    expect(capturedHandler).toBeDefined();

    act(() => {
      capturedHandler!({
        type: 'taskDiff',
        feature: 'feature-one',
        task: 'task-a',
        diffs: [mockDiffPayload],
      });
    });

    expect(result.current.state.fileChanges).toEqual(
      new Map([['task-a', [mockDiffPayload]]]),
    );
  });

  it('type union includes all workspace message variants', () => {
    // Verify compile-time type checking for all workspace message variants
    // If any of these are missing from the union, TypeScript will error at compile time
    const webviewMessages: WebviewToExtensionMessage[] = [
      { type: 'requestFeatures' },
      { type: 'requestFeatureDiffs', feature: 'f' },
      { type: 'requestTaskDiff', feature: 'f', task: 't' },
      { type: 'requestPlanContent', feature: 'f' },
      { type: 'requestContextContent', feature: 'f', name: 'n' },
      // Existing types still work
      { type: 'ready' },
    ];

    const extensionMessages: ExtensionToWebviewMessage[] = [
      { type: 'featuresData', features: [] },
      { type: 'featureDiffs', feature: 'f', diffs: {} },
      { type: 'taskDiff', feature: 'f', task: 't', diffs: [] },
      { type: 'planContent', feature: 'f', content: '', comments: [] },
      { type: 'contextContent', feature: 'f', name: 'n', content: '' },
      // Existing types still work
      { type: 'error', message: 'err' },
    ];

    expect(webviewMessages).toHaveLength(6);
    expect(extensionMessages).toHaveLength(6);
  });
});
