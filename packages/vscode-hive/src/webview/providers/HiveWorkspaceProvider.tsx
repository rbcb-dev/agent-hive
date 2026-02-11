/**
 * HiveWorkspaceProvider — Shared workspace state context
 *
 * Manages the shared state needed by both sidebar and content area:
 * - Active feature, task, file selection
 * - View mode (plan, context, task, diff, code)
 * - File changes per task
 * - Loading state
 *
 * Uses useReducer for predictable state transitions.
 * Does NOT directly communicate with the extension host (that's Task 4's job).
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { FeatureInfo, DiffPayload } from 'hive-core';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface HiveWorkspaceState {
  features: FeatureInfo[];
  activeFeature: string | null;
  activeTask: string | null;
  activeFile: string | null;
  activeView: 'plan' | 'context' | 'task' | 'diff' | 'code';
  fileChanges: Map<string, DiffPayload[]>;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type HiveWorkspaceAction =
  | { type: 'SELECT_FEATURE'; name: string }
  | { type: 'SELECT_TASK'; folder: string }
  | { type: 'SELECT_FILE'; path: string }
  | { type: 'SELECT_VIEW'; view: HiveWorkspaceState['activeView'] }
  | { type: 'SET_FEATURES'; features: FeatureInfo[] }
  | { type: 'SET_FILE_CHANGES'; fileChanges: Map<string, DiffPayload[]> }
  | { type: 'SET_LOADING'; isLoading: boolean };

export interface HiveWorkspaceActions {
  selectFeature: (name: string) => void;
  selectTask: (folder: string) => void;
  selectFile: (path: string) => void;
  selectView: (view: HiveWorkspaceState['activeView']) => void;
  refreshFeatures: () => void;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function workspaceReducer(
  state: HiveWorkspaceState,
  action: HiveWorkspaceAction,
): HiveWorkspaceState {
  switch (action.type) {
    case 'SELECT_FEATURE':
      return {
        ...state,
        activeFeature: action.name,
        activeTask: null,
        activeFile: null,
        activeView: 'plan',
      };
    case 'SELECT_TASK':
      return {
        ...state,
        activeTask: action.folder,
        activeFile: null,
        activeView: 'task',
      };
    case 'SELECT_FILE':
      return {
        ...state,
        activeFile: action.path,
        activeView: 'diff',
      };
    case 'SELECT_VIEW':
      return {
        ...state,
        activeView: action.view,
      };
    case 'SET_FEATURES':
      return {
        ...state,
        features: action.features,
      };
    case 'SET_FILE_CHANGES':
      return {
        ...state,
        fileChanges: action.fileChanges,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface HiveWorkspaceContextValue {
  state: HiveWorkspaceState;
  actions: HiveWorkspaceActions;
  dispatch: React.Dispatch<HiveWorkspaceAction>;
}

const HiveWorkspaceContext = createContext<HiveWorkspaceContextValue | null>(
  null,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const DEFAULT_WORKSPACE_STATE: HiveWorkspaceState = {
  features: [],
  activeFeature: null,
  activeTask: null,
  activeFile: null,
  activeView: 'plan',
  fileChanges: new Map(),
  isLoading: false,
};

export interface HiveWorkspaceProviderProps {
  children: React.ReactNode;
  initialState?: HiveWorkspaceState;
  onRefreshFeatures?: () => void;
}

export function HiveWorkspaceProvider({
  children,
  initialState = DEFAULT_WORKSPACE_STATE,
  onRefreshFeatures,
}: HiveWorkspaceProviderProps) {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);

  const selectFeature = useCallback(
    (name: string) => dispatch({ type: 'SELECT_FEATURE', name }),
    [],
  );

  const selectTask = useCallback(
    (folder: string) => dispatch({ type: 'SELECT_TASK', folder }),
    [],
  );

  const selectFile = useCallback(
    (path: string) => dispatch({ type: 'SELECT_FILE', path }),
    [],
  );

  const selectView = useCallback(
    (view: HiveWorkspaceState['activeView']) =>
      dispatch({ type: 'SELECT_VIEW', view }),
    [],
  );

  const refreshFeatures = useCallback(() => {
    onRefreshFeatures?.();
  }, [onRefreshFeatures]);

  const actions: HiveWorkspaceActions = {
    selectFeature,
    selectTask,
    selectFile,
    selectView,
    refreshFeatures,
  };

  return (
    <HiveWorkspaceContext.Provider value={{ state, actions, dispatch }}>
      {children}
    </HiveWorkspaceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHiveWorkspace(): HiveWorkspaceContextValue {
  const context = useContext(HiveWorkspaceContext);
  if (!context) {
    throw new Error(
      'useHiveWorkspace must be used within a HiveWorkspaceProvider',
    );
  }
  return context;
}
