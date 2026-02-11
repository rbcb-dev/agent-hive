/**
 * useWorkspaceMessages hook — Bridges extension messaging to HiveWorkspaceProvider
 *
 * Handles sending/receiving workspace data messages between the webview and extension:
 * - Requests features list on mount
 * - Requests feature diffs when a feature is selected
 * - Requests task diff when a task is selected
 * - Dispatches state updates when responses arrive
 *
 * Depends on HiveWorkspaceProvider context being available.
 */

import { useEffect, useRef } from 'react';
import { addMessageListener, postMessage } from '../vscodeApi';
import { useHiveWorkspace } from '../providers/HiveWorkspaceProvider';
import type { ExtensionToWebviewMessage } from '../types';
import type { DiffPayload } from 'hive-core';

export function useWorkspaceMessages(): void {
  const { state, dispatch } = useHiveWorkspace();
  const prevFeatureRef = useRef<string | null>(null);
  const prevTaskRef = useRef<string | null>(null);

  // Request features on mount
  useEffect(() => {
    postMessage({ type: 'requestFeatures' });
  }, []);

  // Listen for extension messages and dispatch state updates
  useEffect(() => {
    const removeListener = addMessageListener(
      (message: ExtensionToWebviewMessage) => {
        switch (message.type) {
          case 'featuresData':
            dispatch({ type: 'SET_FEATURES', features: message.features });
            break;
          case 'featureDiffs': {
            const fileChanges = new Map<string, DiffPayload[]>(
              Object.entries(message.diffs),
            );
            dispatch({ type: 'SET_FILE_CHANGES', fileChanges });
            break;
          }
          case 'taskDiff':
            dispatch({
              type: 'SET_FILE_CHANGES',
              fileChanges: new Map([[message.task, message.diffs]]),
            });
            break;
          case 'planContent':
            dispatch({
              type: 'SET_PLAN_CONTENT',
              content: message.content,
              comments: message.comments,
            });
            break;
          case 'contextContent':
            dispatch({
              type: 'SET_CONTEXT_CONTENT',
              content: message.content,
            });
            break;
          case 'reviewThreadsUpdate':
            dispatch({
              type: 'SET_REVIEW_THREADS',
              threads: message.threads,
            });
            break;
          case 'sessionUpdate':
            dispatch({
              type: 'SET_REVIEW_SESSION',
              session: message.session,
            });
            break;
          case 'commitHistory':
            dispatch({
              type: 'SET_COMMITS',
              commits: message.commits,
            });
            break;
          case 'commitDiff':
            dispatch({
              type: 'SET_COMMIT_DIFF',
              diffs: message.diffs,
            });
            break;
        }
      },
    );

    return removeListener;
  }, [dispatch]);

  // Request feature diffs when activeFeature changes
  useEffect(() => {
    if (state.activeFeature && state.activeFeature !== prevFeatureRef.current) {
      postMessage({
        type: 'requestFeatureDiffs',
        feature: state.activeFeature,
      });
    }
    prevFeatureRef.current = state.activeFeature;
  }, [state.activeFeature]);

  // Request task diff and commit history when activeTask changes
  useEffect(() => {
    if (
      state.activeTask &&
      state.activeFeature &&
      state.activeTask !== prevTaskRef.current
    ) {
      postMessage({
        type: 'requestTaskDiff',
        feature: state.activeFeature,
        task: state.activeTask,
      });
      postMessage({
        type: 'requestCommitHistory',
        feature: state.activeFeature,
        task: state.activeTask,
      });
    }
    prevTaskRef.current = state.activeTask;
  }, [state.activeTask, state.activeFeature]);
}
