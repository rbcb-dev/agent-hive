/**
 * Storybook stories for HivePanel — Unified App Layout with Sidebar
 *
 * Demonstrates the master-detail layout with sidebar navigation
 * and content area driven by activeView.
 * Covers: default/empty, plan view, diff view, full navigation flow, sidebar toggle.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HivePanel } from './HivePanel';
declare const meta: Meta<typeof HivePanel>;
export default meta;
type Story = StoryObj<typeof HivePanel>;
/**
 * Default — empty state with no features.
 * Shows "Select a feature to get started" in content area.
 */
export declare const Default: Story;
/**
 * Plan view — plan.md rendered in content area.
 * Feature selected with plan view active.
 */
export declare const WithPlanView: Story;
/**
 * Diff view — diff viewer showing task changes.
 * A file is selected, showing the diff/code view.
 */
export declare const WithDiffView: Story;
/**
 * Full navigation flow — play() test.
 * Feature → task → file → diff renders.
 */
export declare const FullNavigationFlow: Story;
/**
 * Sidebar collapse — play() test.
 * Verifies the sidebar panel is present and its width can be observed.
 *
 * Note: The HivePanel uses antd Layout.Sider with a fixed width, not a
 * collapsible toggle. This test verifies the sidebar and content coexist.
 */
export declare const SidebarCollapse: Story;
/**
 * Default: plan view with sidebar showing features and changed files.
 */
export declare const PlanView: Story;
/**
 * Task view: task selected with task-specific details.
 */
export declare const TaskView: Story;
/**
 * No feature selected: welcome state.
 */
export declare const EmptyState: Story;
/**
 * Context view: context content displayed.
 */
export declare const ContextView: Story;
