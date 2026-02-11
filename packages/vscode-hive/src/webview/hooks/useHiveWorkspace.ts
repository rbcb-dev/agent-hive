/**
 * useHiveWorkspace hook — Convenience re-export from providers
 *
 * Provides access to the HiveWorkspaceProvider context:
 * - state: current workspace state (features, activeFeature, activeTask, etc.)
 * - actions: bound action creators (selectFeature, selectTask, selectFile, etc.)
 * - dispatch: raw dispatch for advanced use cases
 */

export { useHiveWorkspace } from '../providers/HiveWorkspaceProvider';
export type {
  HiveWorkspaceState,
  HiveWorkspaceActions,
} from '../providers/HiveWorkspaceProvider';
