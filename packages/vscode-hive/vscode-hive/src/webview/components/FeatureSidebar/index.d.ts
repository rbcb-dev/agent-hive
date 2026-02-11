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
import React from 'react';
import { Navigator } from './Navigator';
import { ChangedFiles } from './ChangedFiles';
export interface FeatureSidebarProps {
    /** Child sub-components (Navigator, ChangedFiles) */
    children: React.ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
declare function FeatureSidebarRoot({ children, className, style, }: FeatureSidebarProps): React.ReactElement;
/**
 * FeatureSidebar compound component with static sub-components.
 *
 * Sub-components:
 * - `FeatureSidebar.Navigator` — feature tree (status groups → features → plan/context/tasks)
 * - `FeatureSidebar.ChangedFiles` — context-dependent file tree with diff status indicators
 */
export declare const FeatureSidebar: typeof FeatureSidebarRoot & {
    Navigator: typeof Navigator;
    ChangedFiles: typeof ChangedFiles;
};
export type { ChangedFileEntry, DiffStatus } from './types';
export { aggregateChangedFiles, STATUS_COLORS, STATUS_LABELS } from './types';
