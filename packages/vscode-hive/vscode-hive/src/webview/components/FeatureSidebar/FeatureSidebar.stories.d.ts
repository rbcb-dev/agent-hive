/**
 * Storybook stories for FeatureSidebar compound component
 *
 * Demonstrates the sidebar with Navigator and ChangedFiles sub-components.
 * Covers: empty state, multiple features, active feature/task, navigation flows,
 * file selection, duplicate file resolution, and accessibility.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
declare const meta: Meta;
export default meta;
type Story = StoryObj;
/**
 * Empty state — no features loaded.
 * Shows "No features found" and "No files to display" messages.
 */
export declare const Empty: Story;
/**
 * Multiple features in different status groups.
 * Shows In Progress, Pending, and Completed groups.
 */
export declare const WithFeatures: Story;
/**
 * Feature selected with aggregated changed files showing across all tasks.
 * auth-system is active, showing files from both 01-db-setup and 02-jwt-impl.
 */
export declare const WithActiveFeature: Story;
/**
 * Task selected — shows only that task's changed files.
 * 01-db-setup is active task, showing only its 3 files.
 */
export declare const WithActiveTask: Story;
/**
 * Navigate from feature to task — play() test.
 * Clicks feature node → clicks task node → verifies changed files update.
 */
export declare const NavigateFeatureToTask: Story;
/**
 * File selection flow — play() test.
 * Clicks a file in ChangedFiles → verifies the selection is dispatched.
 */
export declare const FileSelectionFlow: Story;
/**
 * Duplicate file across tasks — play() test.
 * Verifies that the latest task's diff is shown for a file that appears in multiple tasks.
 * src/db/schema.ts appears in both 01-db-setup (A) and 02-jwt-impl (M).
 * Feature-level should show M (latest task wins).
 */
export declare const DuplicateFileAcrossTasks: Story;
/**
 * Accessibility check — semantic tree navigation via keyboard.
 * Verifies proper ARIA roles and keyboard-accessible file entries.
 *
 * @tags a11y
 */
export declare const AccessibilityCheck: Story;
/**
 * Full sidebar with both Navigator and ChangedFiles.
 * Feature-level aggregation: shows files from all tasks.
 */
export declare const FeatureLevelView: Story;
/**
 * Task-level view: only files from the selected task.
 */
export declare const TaskLevelView: Story;
/**
 * Navigator only — no changed files section.
 */
export declare const NavigatorOnly: Story;
/**
 * With file status indicators showing all diff types.
 */
export declare const AllDiffStatuses: Story;
