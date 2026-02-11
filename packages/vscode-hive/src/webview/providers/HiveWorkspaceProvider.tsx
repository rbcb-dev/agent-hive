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

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';
import type { FeatureInfo, DiffPayload, PlanComment, ReviewThread, ReviewSession, Range, TaskCommit } from 'hive-core';
import { postMessage } from '../vscodeApi';

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
  planContent: string | null;
  planComments: PlanComment[];
  contextContent: string | null;
  isLoading: boolean;
  reviewThreads: ReviewThread[];
  activeReviewSession: ReviewSession | null;
  commits: TaskCommit[];
  commitDiff: DiffPayload[] | null;
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
  | {
      type: 'SET_PLAN_CONTENT';
      content: string;
      comments: PlanComment[];
    }
  | { type: 'SET_CONTEXT_CONTENT'; content: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_REVIEW_THREADS'; threads: ReviewThread[] }
  | { type: 'SET_REVIEW_SESSION'; session: ReviewSession | null }
  | { type: 'SET_COMMITS'; commits: TaskCommit[] }
  | { type: 'SET_COMMIT_DIFF'; diffs: DiffPayload[] | null };

export interface HiveWorkspaceActions {
  selectFeature: (name: string) => void;
  selectTask: (folder: string) => void;
  selectFile: (path: string) => void;
  selectView: (view: HiveWorkspaceState['activeView']) => void;
  refreshFeatures: () => void;
  // Review thread actions
  addThread: (entityId: string, uri: string, range: Range, body: string, type: string) => void;
  replyToThread: (threadId: string, body: string) => void;
  resolveThread: (threadId: string) => void;
  unresolveThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  editAnnotation: (threadId: string, annotationId: string, body: string) => void;
  deleteAnnotation: (threadId: string, annotationId: string) => void;
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
        planContent: null,
        planComments: [],
        contextContent: null,
        reviewThreads: [],
        activeReviewSession: null,
        commits: [],
        commitDiff: null,
      };
    case 'SELECT_TASK':
      return {
        ...state,
        activeTask: action.folder,
        activeFile: null,
        activeView: 'task',
        commits: [],
        commitDiff: null,
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
    case 'SET_PLAN_CONTENT':
      return {
        ...state,
        planContent: action.content,
        planComments: action.comments,
      };
    case 'SET_CONTEXT_CONTENT':
      return {
        ...state,
        contextContent: action.content,
      };
    case 'SET_REVIEW_THREADS':
      return {
        ...state,
        reviewThreads: action.threads,
      };
    case 'SET_REVIEW_SESSION':
      return {
        ...state,
        activeReviewSession: action.session,
      };
    case 'SET_COMMITS':
      return {
        ...state,
        commits: action.commits,
      };
    case 'SET_COMMIT_DIFF':
      return {
        ...state,
        commitDiff: action.diffs,
        ...(action.diffs ? { activeView: 'diff' as const } : {}),
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
  planContent: null,
  planComments: [],
  contextContent: null,
  isLoading: false,
  reviewThreads: [],
  activeReviewSession: null,
  commits: [],
  commitDiff: null,
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

  const addThread = useCallback(
    (entityId: string, uri: string, range: Range, body: string, annotationType: string) => {
      postMessage({ type: 'addComment', entityId, uri, range, body, annotationType });
    },
    [],
  );

  const replyToThread = useCallback(
    (threadId: string, body: string) => {
      postMessage({ type: 'reply', threadId, body });
    },
    [],
  );

  const resolveThread = useCallback(
    (threadId: string) => {
      postMessage({ type: 'resolve', threadId });
    },
    [],
  );

  const unresolveThread = useCallback(
    (threadId: string) => {
      postMessage({ type: 'unresolve', threadId });
    },
    [],
  );

  const deleteThread = useCallback(
    (threadId: string) => {
      postMessage({ type: 'deleteThread', threadId });
    },
    [],
  );

  const editAnnotation = useCallback(
    (threadId: string, annotationId: string, body: string) => {
      postMessage({ type: 'editComment', threadId, annotationId, body });
    },
    [],
  );

  const deleteAnnotation = useCallback(
    (threadId: string, annotationId: string) => {
      postMessage({ type: 'deleteComment', threadId, annotationId });
    },
    [],
  );

  const actions: HiveWorkspaceActions = {
    selectFeature,
    selectTask,
    selectFile,
    selectView,
    refreshFeatures,
    addThread,
    replyToThread,
    resolveThread,
    unresolveThread,
    deleteThread,
    editAnnotation,
    deleteAnnotation,
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
