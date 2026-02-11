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
import React from 'react';
import type { FeatureInfo, DiffPayload } from 'hive-core';
export interface HiveWorkspaceState {
    features: FeatureInfo[];
    activeFeature: string | null;
    activeTask: string | null;
    activeFile: string | null;
    activeView: 'plan' | 'context' | 'task' | 'diff' | 'code';
    fileChanges: Map<string, DiffPayload[]>;
    isLoading: boolean;
}
export type HiveWorkspaceAction = {
    type: 'SELECT_FEATURE';
    name: string;
} | {
    type: 'SELECT_TASK';
    folder: string;
} | {
    type: 'SELECT_FILE';
    path: string;
} | {
    type: 'SELECT_VIEW';
    view: HiveWorkspaceState['activeView'];
} | {
    type: 'SET_FEATURES';
    features: FeatureInfo[];
} | {
    type: 'SET_FILE_CHANGES';
    fileChanges: Map<string, DiffPayload[]>;
} | {
    type: 'SET_LOADING';
    isLoading: boolean;
};
export interface HiveWorkspaceActions {
    selectFeature: (name: string) => void;
    selectTask: (folder: string) => void;
    selectFile: (path: string) => void;
    selectView: (view: HiveWorkspaceState['activeView']) => void;
    refreshFeatures: () => void;
}
export declare function workspaceReducer(state: HiveWorkspaceState, action: HiveWorkspaceAction): HiveWorkspaceState;
interface HiveWorkspaceContextValue {
    state: HiveWorkspaceState;
    actions: HiveWorkspaceActions;
    dispatch: React.Dispatch<HiveWorkspaceAction>;
}
export declare const DEFAULT_WORKSPACE_STATE: HiveWorkspaceState;
export interface HiveWorkspaceProviderProps {
    children: React.ReactNode;
    initialState?: HiveWorkspaceState;
    onRefreshFeatures?: () => void;
}
export declare function HiveWorkspaceProvider({ children, initialState, onRefreshFeatures, }: HiveWorkspaceProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useHiveWorkspace(): HiveWorkspaceContextValue;
export {};
