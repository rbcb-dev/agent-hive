/**
 * Storybook stories for HivePanel — Unified App Layout with Sidebar
 *
 * Demonstrates the master-detail layout with sidebar navigation
 * and content area driven by activeView.
 * Covers: default/empty, plan view, diff view, full navigation flow, sidebar toggle.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';
import React from 'react';
import type { FeatureInfo, DiffPayload } from 'hive-core';

import {
  HiveWorkspaceProvider,
  type HiveWorkspaceState,
} from '../providers/HiveWorkspaceProvider';
import { HivePanel } from './HivePanel';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockFeatures: FeatureInfo[] = [
  {
    name: 'auth-system',
    status: 'executing',
    tasks: [
      {
        folder: '01-db-setup',
        name: 'db-setup',
        status: 'done',
        origin: 'plan',
      },
      {
        folder: '02-jwt-impl',
        name: 'jwt-impl',
        status: 'in_progress',
        origin: 'plan',
      },
      {
        folder: '03-tests',
        name: 'tests',
        status: 'pending',
        origin: 'plan',
      },
    ],
    hasPlan: true,
    commentCount: 3,
  },
  {
    name: 'dashboard-ui',
    status: 'planning',
    tasks: [],
    hasPlan: true,
    commentCount: 0,
  },
  {
    name: 'old-feature',
    status: 'completed',
    tasks: [
      {
        folder: '01-only',
        name: 'only',
        status: 'done',
        origin: 'plan',
      },
    ],
    hasPlan: true,
    commentCount: 1,
  },
];

function makeDiffPayload(
  files: Array<{
    path: string;
    status: 'A' | 'M' | 'D' | 'R' | 'C';
    additions?: number;
    deletions?: number;
  }>,
): DiffPayload {
  return {
    baseRef: 'main',
    headRef: 'feature-branch',
    mergeBase: 'abc123',
    repoRoot: '/repo',
    fileRoot: '/repo',
    diffStats: {
      files: files.length,
      insertions: files.reduce((s, f) => s + (f.additions ?? 0), 0),
      deletions: files.reduce((s, f) => s + (f.deletions ?? 0), 0),
    },
    files: files.map((f) => ({
      path: f.path,
      status: f.status,
      additions: f.additions ?? 0,
      deletions: f.deletions ?? 0,
      hunks: [],
    })),
  };
}

const fileChanges = new Map<string, DiffPayload[]>();
fileChanges.set('01-db-setup', [
  makeDiffPayload([
    { path: 'src/db/schema.ts', status: 'A', additions: 45 },
    { path: 'src/db/connection.ts', status: 'A', additions: 30 },
    { path: 'package.json', status: 'M', additions: 3, deletions: 1 },
  ]),
]);
fileChanges.set('02-jwt-impl', [
  makeDiffPayload([
    { path: 'src/auth/jwt.ts', status: 'A', additions: 80 },
    { path: 'src/auth/middleware.ts', status: 'A', additions: 40 },
  ]),
]);

function createState(
  overrides?: Partial<HiveWorkspaceState>,
): HiveWorkspaceState {
  return {
    features: mockFeatures,
    activeFeature: 'auth-system',
    activeTask: null,
    activeFile: null,
    activeView: 'plan',
    fileChanges,
    planContent: null,
    planComments: [],
    contextContent: null,
    isLoading: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof HivePanel> = {
  title: 'Components/HivePanel',
  component: HivePanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const state = (context.args as any).initialState ?? createState();
      return (
        <HiveWorkspaceProvider
          initialState={state}
          onRefreshFeatures={fn()}
        >
          <div style={{ height: '100vh' }}>
            <Story />
          </div>
        </HiveWorkspaceProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof HivePanel>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default — empty state with no features.
 * Shows "Select a feature to get started" in content area.
 */
export const Default: Story = {
  args: {
    initialState: createState({
      features: [],
      activeFeature: null,
      fileChanges: new Map(),
    }),
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/select a feature/i)).toBeInTheDocument();
    await expect(canvas.getByText('No features found')).toBeInTheDocument();
  },
};

/**
 * Plan view — plan.md rendered in content area.
 * Feature selected with plan view active.
 */
export const WithPlanView: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Sidebar visible with feature navigator
    await expect(canvas.getByText('In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('auth-system')).toBeInTheDocument();

    // Content area visible with plan view
    await expect(canvas.getByTestId('hive-panel-content')).toBeInTheDocument();

    // Plan text shows in content
    await expect(
      canvas.getByText(/Plan view for auth-system/),
    ).toBeInTheDocument();
  },
};

/**
 * Diff view — diff viewer showing task changes.
 * A file is selected, showing the diff/code view.
 */
export const WithDiffView: Story = {
  args: {
    initialState: createState({
      activeFile: 'src/auth/jwt.ts',
      activeView: 'diff',
    }),
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Content area with diff view
    await expect(canvas.getByTestId('hive-panel-content')).toBeInTheDocument();

    // File path visible in content
    await expect(
      canvas.getByText('src/auth/jwt.ts'),
    ).toBeInTheDocument();
  },
};

/**
 * Full navigation flow — play() test.
 * Feature → task → file → diff renders.
 */
export const FullNavigationFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially showing plan view for auth-system
    await expect(
      canvas.getByText(/Plan view for auth-system/),
    ).toBeInTheDocument();

    // Click a task node to switch to task view
    const taskNode = canvas.getByTestId('task-node-02-jwt-impl');
    await userEvent.click(taskNode);

    // Task view should show the task heading
    await expect(canvas.getByText('02-jwt-impl')).toBeInTheDocument();

    // Click on a changed file to switch to diff view
    const fileEntry = canvas.getByTestId('changed-file-src/auth/jwt.ts');
    await userEvent.click(fileEntry);

    // File path should appear in content area
    await expect(
      canvas.getByText('src/auth/jwt.ts'),
    ).toBeInTheDocument();
  },
};

/**
 * Sidebar collapse — play() test.
 * Verifies the sidebar panel is present and its width can be observed.
 *
 * Note: The HivePanel uses antd Layout.Sider with a fixed width, not a
 * collapsible toggle. This test verifies the sidebar and content coexist.
 */
export const SidebarCollapse: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Sidebar is present
    const sidebar = canvas.getByTestId('hive-panel-sidebar');
    await expect(sidebar).toBeInTheDocument();

    // Content area is present alongside sidebar
    const content = canvas.getByTestId('hive-panel-content');
    await expect(content).toBeInTheDocument();

    // Both exist simultaneously (master-detail layout)
    await expect(sidebar.parentElement).toBe(content.parentElement?.parentElement);
  },
};

// ---------------------------------------------------------------------------
// Original variant stories
// ---------------------------------------------------------------------------

/**
 * Default: plan view with sidebar showing features and changed files.
 */
export const PlanView: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Sidebar visible with feature navigator
    await expect(canvas.getByText('In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('auth-system')).toBeInTheDocument();

    // Content area visible with plan view
    await expect(
      canvas.getByTestId('hive-panel-content'),
    ).toBeInTheDocument();
  },
};

/**
 * Task view: task selected with task-specific details.
 */
export const TaskView: Story = {
  args: {
    initialState: createState({
      activeTask: '02-jwt-impl',
      activeView: 'task',
    }),
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = canvas.getByTestId('hive-panel-content');
    const heading = within(content).getByRole('heading', { level: 3 });
    await expect(heading).toHaveTextContent('02-jwt-impl');
  },
};

/**
 * No feature selected: welcome state.
 */
export const EmptyState: Story = {
  args: {
    initialState: createState({
      features: [],
      activeFeature: null,
      fileChanges: new Map(),
    }),
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/select a feature/i)).toBeInTheDocument();
  },
};

/**
 * Context view: context content displayed.
 */
export const ContextView: Story = {
  args: {
    initialState: createState({
      activeView: 'context',
    }),
  } as any,
};
