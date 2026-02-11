/**
 * FeatureSidebar — Compound component for feature navigation and changed files
 *
 * Follows the compound component pattern (like Layout.*):
 * - FeatureSidebar — root container with internal context
 * - FeatureSidebar.Navigator — feature tree with status groups
 * - FeatureSidebar.ChangedFiles — context-dependent file tree
 *
 * Consumes HiveWorkspaceProvider context — does NOT accept data as props.
 *
 * @example
 * ```tsx
 * <HiveWorkspaceProvider>
 *   <FeatureSidebar>
 *     <FeatureSidebar.Navigator />
 *     <FeatureSidebar.ChangedFiles />
 *   </FeatureSidebar>
 * </HiveWorkspaceProvider>
 * ```
 */

import React, { useMemo } from 'react';
import { FeatureSidebarContext } from './FeatureSidebarContext';
import type { FeatureSidebarContextValue } from './FeatureSidebarContext';
import { Navigator } from './Navigator';
import { ChangedFiles } from './ChangedFiles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FeatureSidebarProps {
  /** Child sub-components (Navigator, ChangedFiles) */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

function FeatureSidebarRoot({
  children,
  className,
  style,
}: FeatureSidebarProps): React.ReactElement {
  const contextValue = useMemo<FeatureSidebarContextValue>(
    () => ({ isMounted: true }),
    [],
  );

  return (
    <FeatureSidebarContext.Provider value={contextValue}>
      <div
        className={`feature-sidebar ${className ?? ''}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          ...style,
        }}
      >
        {children}
      </div>
    </FeatureSidebarContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Compound component assembly
// ---------------------------------------------------------------------------

/**
 * FeatureSidebar compound component with static sub-components.
 *
 * Sub-components:
 * - `FeatureSidebar.Navigator` — feature tree (status groups → features → plan/context/tasks)
 * - `FeatureSidebar.ChangedFiles` — context-dependent file tree with diff status indicators
 */
export const FeatureSidebar = Object.assign(FeatureSidebarRoot, {
  Navigator,
  ChangedFiles,
});

// Re-export types for consumers
export type { ChangedFileEntry, DiffStatus } from './types';
export { aggregateChangedFiles, STATUS_COLORS, STATUS_LABELS } from './types';
