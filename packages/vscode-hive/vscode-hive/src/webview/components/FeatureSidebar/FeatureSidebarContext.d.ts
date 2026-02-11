/**
 * FeatureSidebarContext — Internal context for the compound component
 *
 * Provides shared state between FeatureSidebar sub-components (Navigator, ChangedFiles).
 * This is the internal compound component context, separate from HiveWorkspaceProvider.
 */
/**
 * Internal context value for FeatureSidebar sub-components.
 * Currently minimal — sub-components read from HiveWorkspaceProvider directly.
 * This context exists for compound component pattern compliance and future extension.
 */
export interface FeatureSidebarContextValue {
    /** Whether the sidebar is mounted (used for compound component validation) */
    isMounted: boolean;
}
export declare const FeatureSidebarContext: import("react").Context<FeatureSidebarContextValue>;
/**
 * Hook to access FeatureSidebar context.
 * Throws if used outside a FeatureSidebar component.
 */
export declare function useFeatureSidebar(): FeatureSidebarContextValue;
