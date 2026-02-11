/**
 * Storybook stories for HivePanel — Unified App Layout with Sidebar
 *
 * Demonstrates the master-detail layout with sidebar navigation
 * and content area driven by activeView.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within } from 'storybook/test';
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
      { folder: '01-db-setup', name: 'db-setup', status: 'done', origin: 'plan' },
      { folder: '02-jwt-impl', name: 'jwt-impl', status: 'in_progress', origin: 'plan' },
      { folder: '03-tests', name: 'tests', status: 'pending', origin: 'plan' },
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
      { folder: '01-only', name: 'only', status: 'done', origin: 'plan' },
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
 * Default: plan view with sidebar showing features and changed files.
 */
export const PlanView: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Sidebar visible with feature navigator
    await expect(canvas.getByText('In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('auth-system')).toBeInTheDocument();

    // Content area visible with plan view
    await expect(canvas.getByTestId('hive-panel-content')).toBeInTheDocument();
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
 * Diff view: file selected for diff display.
 */
export const DiffView: Story = {
  args: {
    initialState: createState({
      activeFile: 'src/auth/jwt.ts',
      activeView: 'diff',
    }),
  } as any,
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
