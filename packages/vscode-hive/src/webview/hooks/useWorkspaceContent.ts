/**
 * useWorkspaceContent hook — Manages plan/context content requests
 *
 * Sends content requests when activeView changes to 'plan' or 'context',
 * and returns planContent/planComments/contextContent from the workspace
 * provider state (populated by useWorkspaceMessages).
 *
 * Depends on HiveWorkspaceProvider context being available.
 */

import { useEffect, useRef } from 'react';
import { postMessage } from '../vscodeApi';
import { useHiveWorkspace } from '../providers/HiveWorkspaceProvider';
import type { PlanComment } from 'hive-core';

export interface UseWorkspaceContentResult {
  planContent: string | null;
  planComments: PlanComment[];
  contextContent: string | null;
}

export function useWorkspaceContent(): UseWorkspaceContentResult {
  const { state } = useHiveWorkspace();
  const {
    activeView,
    activeFeature,
    planContent,
    planComments,
    contextContent,
  } = state;

  const prevViewRef = useRef<string | null>(null);
  const prevFeatureRef = useRef<string | null>(null);

  // Request content when activeView or activeFeature changes
  useEffect(() => {
    if (!activeFeature) return;

    const viewChanged = activeView !== prevViewRef.current;
    const featureChanged = activeFeature !== prevFeatureRef.current;

    if (viewChanged || featureChanged) {
      if (activeView === 'plan') {
        postMessage({ type: 'requestPlanContent', feature: activeFeature });
      } else if (activeView === 'context') {
        postMessage({
          type: 'requestContextContent',
          feature: activeFeature,
          name: 'default',
        });
      }
    }

    prevViewRef.current = activeView;
    prevFeatureRef.current = activeFeature;
  }, [activeView, activeFeature]);

  return { planContent, planComments, contextContent };
}
