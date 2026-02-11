/**
 * FeatureSidebarContext — Internal context for the compound component
 *
 * Provides shared state between FeatureSidebar sub-components (Navigator, ChangedFiles).
 * This is the internal compound component context, separate from HiveWorkspaceProvider.
 */

import { createContext, useContext } from 'react';

/**
 * Internal context value for FeatureSidebar sub-components.
 * Currently minimal — sub-components read from HiveWorkspaceProvider directly.
 * This context exists for compound component pattern compliance and future extension.
 */
export interface FeatureSidebarContextValue {
  /** Whether the sidebar is mounted (used for compound component validation) */
  isMounted: boolean;
}

export const FeatureSidebarContext =
  createContext<FeatureSidebarContextValue | null>(null);

/**
 * Hook to access FeatureSidebar context.
 * Throws if used outside a FeatureSidebar component.
 */
export function useFeatureSidebar(): FeatureSidebarContextValue {
  const ctx = useContext(FeatureSidebarContext);
  if (!ctx) {
    throw new Error(
      'FeatureSidebar sub-components must be used within a <FeatureSidebar>',
    );
  }
  return ctx;
}
