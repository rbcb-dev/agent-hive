/**
 * Storybook stories for FeatureSidebar compound component
 *
 * Demonstrates the sidebar with Navigator and ChangedFiles sub-components.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within } from 'storybook/test';
import React from 'react';
import type { FeatureInfo, DiffPayload } from 'hive-core';

import {
  HiveWorkspaceProvider,
  type HiveWorkspaceState,
} from '../../providers/HiveWorkspaceProvider';
import { FeatureSidebar } from './index';

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
    oldPath?: string;
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
      ...(f.oldPath ? { oldPath: f.oldPath } : {}),
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
    {
      path: 'src/db/schema.ts',
      status: 'M',
      additions: 10,
      deletions: 2,
    },
    {
      path: 'src/auth/old-auth.ts',
      status: 'R',
      oldPath: 'src/auth/legacy.ts',
    },
  ]),
]);

const defaultState: HiveWorkspaceState = {
  features: mockFeatures,
  activeFeature: 'auth-system',
  activeTask: null,
  activeFile: null,
  activeView: 'plan',
  fileChanges,
  isLoading: false,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Components/FeatureSidebar',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const state = (context.args as any).initialState ?? defaultState;
      return (
        <HiveWorkspaceProvider
          initialState={state}
          onRefreshFeatures={fn()}
        >
          <div style={{ width: 320, height: 600, border: '1px solid #333', overflow: 'auto' }}>
            <Story />
          </div>
        </HiveWorkspaceProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Full sidebar with both Navigator and ChangedFiles.
 * Feature-level aggregation: shows files from all tasks.
 */
export const FeatureLevelView: Story = {
  render: () => (
    <FeatureSidebar>
      <FeatureSidebar.Navigator />
      <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 4 }} />
      <FeatureSidebar.ChangedFiles />
    </FeatureSidebar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Status groups visible
    await expect(canvas.getByText('In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('Pending')).toBeInTheDocument();
    await expect(canvas.getByText('Completed')).toBeInTheDocument();

    // Feature visible
    await expect(canvas.getByText('auth-system')).toBeInTheDocument();

    // Changed files visible
    await expect(canvas.getByText('Changed Files')).toBeInTheDocument();
  },
};

/**
 * Task-level view: only files from the selected task.
 */
export const TaskLevelView: Story = {
  args: {
    initialState: {
      ...defaultState,
      activeTask: '01-db-setup',
      activeView: 'task',
    },
  },
  render: () => (
    <FeatureSidebar>
      <FeatureSidebar.Navigator />
      <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 4 }} />
      <FeatureSidebar.ChangedFiles />
    </FeatureSidebar>
  ),
};

/**
 * Navigator only — no changed files section.
 */
export const NavigatorOnly: Story = {
  render: () => (
    <FeatureSidebar>
      <FeatureSidebar.Navigator />
    </FeatureSidebar>
  ),
};

/**
 * Empty state — no features loaded.
 */
export const EmptyState: Story = {
  args: {
    initialState: {
      ...defaultState,
      features: [],
      activeFeature: null,
      fileChanges: new Map(),
    },
  },
  render: () => (
    <FeatureSidebar>
      <FeatureSidebar.Navigator />
      <FeatureSidebar.ChangedFiles />
    </FeatureSidebar>
  ),
};

/**
 * With file status indicators showing all diff types.
 */
export const AllDiffStatuses: Story = {
  args: {
    initialState: {
      ...defaultState,
      fileChanges: new Map([
        [
          '01-db-setup',
          [
            makeDiffPayload([
              { path: 'src/added.ts', status: 'A', additions: 50 },
              {
                path: 'src/modified.ts',
                status: 'M',
                additions: 10,
                deletions: 5,
              },
              { path: 'src/deleted.ts', status: 'D', deletions: 30 },
              {
                path: 'src/new-name.ts',
                status: 'R',
                oldPath: 'src/old-name.ts',
              },
              { path: 'src/copied.ts', status: 'C', additions: 20 },
            ]),
          ],
        ],
      ]),
    },
  },
  render: () => (
    <FeatureSidebar>
      <FeatureSidebar.ChangedFiles />
    </FeatureSidebar>
  ),
};
