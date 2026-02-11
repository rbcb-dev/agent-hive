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
export declare function useWorkspaceMessages(): void;
