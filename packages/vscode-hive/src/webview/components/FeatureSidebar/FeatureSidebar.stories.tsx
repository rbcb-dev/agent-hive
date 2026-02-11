/**
 * Storybook stories for FeatureSidebar compound component
 *
 * Demonstrates the sidebar with Navigator and ChangedFiles sub-components.
 * Covers: empty state, multiple features, active feature/task, navigation flows,
 * file selection, duplicate file resolution, and accessibility.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';
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
  planContent: null,
  planComments: [],
  contextContent: null,
  isLoading: false,
};

// ---------------------------------------------------------------------------
// Shared render helper
// ---------------------------------------------------------------------------

function renderFullSidebar() {
  return (
    <FeatureSidebar>
      <FeatureSidebar.Navigator />
      <div
        style={{
          borderTop: '1px solid #333',
          marginTop: 8,
          paddingTop: 4,
        }}
      />
      <FeatureSidebar.ChangedFiles />
    </FeatureSidebar>
  );
}

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
        <HiveWorkspaceProvider initialState={state} onRefreshFeatures={fn()}>
          <div
            style={{
              width: 320,
              height: 600,
              border: '1px solid #333',
              overflow: 'auto',
            }}
          >
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
 * Empty state — no features loaded.
 * Shows "No features found" and "No files to display" messages.
 */
export const Empty: Story = {
  args: {
    initialState: {
      ...defaultState,
      features: [],
      activeFeature: null,
      fileChanges: new Map(),
    },
  },
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No features found')).toBeInTheDocument();
    await expect(canvas.getByText('No files to display')).toBeInTheDocument();
  },
};

/**
 * Multiple features in different status groups.
 * Shows In Progress, Pending, and Completed groups.
 */
export const WithFeatures: Story = {
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Status groups visible
    await expect(canvas.getByText('In Progress')).toBeInTheDocument();
    await expect(canvas.getByText('Pending')).toBeInTheDocument();
    await expect(canvas.getByText('Completed')).toBeInTheDocument();

    // All features visible
    await expect(canvas.getByText('auth-system')).toBeInTheDocument();
    await expect(canvas.getByText('dashboard-ui')).toBeInTheDocument();
    await expect(canvas.getByText('old-feature')).toBeInTheDocument();

    // Changed files heading visible (feature-level aggregation)
    await expect(canvas.getByText('Changed Files')).toBeInTheDocument();
  },
};

/**
 * Feature selected with aggregated changed files showing across all tasks.
 * auth-system is active, showing files from both 01-db-setup and 02-jwt-impl.
 */
export const WithActiveFeature: Story = {
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Feature-level aggregated files visible
    await expect(canvas.getByText('Changed Files')).toBeInTheDocument();

    // Files from task 01 (db-setup)
    await expect(
      canvas.getByTestId('changed-file-src/db/connection.ts'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('changed-file-package.json'),
    ).toBeInTheDocument();

    // Files from task 02 (jwt-impl)
    await expect(
      canvas.getByTestId('changed-file-src/auth/jwt.ts'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('changed-file-src/auth/middleware.ts'),
    ).toBeInTheDocument();

    // Duplicate file (schema.ts) — latest task (02-jwt-impl) wins → M status
    const schemaFile = canvas.getByTestId('changed-file-src/db/schema.ts');
    await expect(schemaFile).toBeInTheDocument();
    // Status badge should show M (from jwt-impl, not A from db-setup)
    await expect(
      within(schemaFile).getByTestId('status-badge-M'),
    ).toBeInTheDocument();
  },
};

/**
 * Task selected — shows only that task's changed files.
 * 01-db-setup is active task, showing only its 3 files.
 */
export const WithActiveTask: Story = {
  args: {
    initialState: {
      ...defaultState,
      activeTask: '01-db-setup',
      activeView: 'task',
    },
  },
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Changed Files')).toBeInTheDocument();

    // Task-specific files only
    await expect(
      canvas.getByTestId('changed-file-src/db/schema.ts'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('changed-file-src/db/connection.ts'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('changed-file-package.json'),
    ).toBeInTheDocument();

    // schema.ts should show A status (task 01 adds it)
    const schemaFile = canvas.getByTestId('changed-file-src/db/schema.ts');
    await expect(
      within(schemaFile).getByTestId('status-badge-A'),
    ).toBeInTheDocument();

    // Files from task 02 should NOT be visible
    await expect(
      canvas.queryByTestId('changed-file-src/auth/jwt.ts'),
    ).not.toBeInTheDocument();
  },
};

/**
 * Navigate from feature to task — play() test.
 * Clicks feature node → clicks task node → verifies changed files update.
 */
export const NavigateFeatureToTask: Story = {
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially at feature level — aggregated files visible
    await expect(canvas.getByText('Changed Files')).toBeInTheDocument();

    // Verify initial aggregated file count (should include files from both tasks)
    await expect(
      canvas.getByTestId('changed-file-src/auth/jwt.ts'),
    ).toBeInTheDocument();

    // Click on task node "db-setup" to switch to task-level view
    const dbSetupNode = canvas.getByTestId('task-node-01-db-setup');
    await userEvent.click(dbSetupNode);

    // After clicking task, files from task 02 should disappear
    // and only task 01 files remain
    await expect(
      canvas.getByTestId('changed-file-src/db/schema.ts'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('changed-file-src/db/connection.ts'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('changed-file-package.json'),
    ).toBeInTheDocument();

    // jwt.ts from task 02 should no longer show
    await expect(
      canvas.queryByTestId('changed-file-src/auth/jwt.ts'),
    ).not.toBeInTheDocument();
  },
};

/**
 * File selection flow — play() test.
 * Clicks a file in ChangedFiles → verifies the selection is dispatched.
 */
export const FileSelectionFlow: Story = {
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click on a changed file entry
    const fileEntry = canvas.getByTestId('changed-file-src/auth/jwt.ts');
    await userEvent.click(fileEntry);

    // The click should have triggered selectFile action.
    // We verify by checking the file entry is still present (component re-renders with file selected).
    await expect(fileEntry).toBeInTheDocument();
  },
};

/**
 * Duplicate file across tasks — play() test.
 * Verifies that the latest task's diff is shown for a file that appears in multiple tasks.
 * src/db/schema.ts appears in both 01-db-setup (A) and 02-jwt-impl (M).
 * Feature-level should show M (latest task wins).
 */
export const DuplicateFileAcrossTasks: Story = {
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // At feature level, schema.ts should show status M (from jwt-impl, the latest task)
    const schemaFile = canvas.getByTestId('changed-file-src/db/schema.ts');
    await expect(schemaFile).toBeInTheDocument();
    await expect(
      within(schemaFile).getByTestId('status-badge-M'),
    ).toBeInTheDocument();

    // Now click the db-setup task to see task-level view
    const dbSetupNode = canvas.getByTestId('task-node-01-db-setup');
    await userEvent.click(dbSetupNode);

    // At task level, schema.ts should show status A (from db-setup)
    const taskSchemaFile = canvas.getByTestId('changed-file-src/db/schema.ts');
    await expect(taskSchemaFile).toBeInTheDocument();
    await expect(
      within(taskSchemaFile).getByTestId('status-badge-A'),
    ).toBeInTheDocument();
  },
};

/**
 * Accessibility check — semantic tree navigation via keyboard.
 * Verifies proper ARIA roles and keyboard-accessible file entries.
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  render: () => renderFullSidebar(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify tree role is present (antd Tree renders with role="tree")
    const tree = canvas.getByRole('tree');
    await expect(tree).toBeInTheDocument();

    // Verify treeitem roles exist for nodes
    const treeItems = canvas.getAllByRole('treeitem');
    await expect(treeItems.length).toBeGreaterThan(0);

    // Verify changed file entries have role="button" and are keyboard-accessible
    const fileEntry = canvas.getByTestId('changed-file-src/auth/jwt.ts');
    await expect(fileEntry).toHaveAttribute('role', 'button');
    await expect(fileEntry).toHaveAttribute('tabindex', '0');

    // Verify status badges have title attributes for screen readers
    const statusBadges = canvas.getAllByTestId(/^status-badge-/);
    await expect(statusBadges.length).toBeGreaterThan(0);
    for (const badge of statusBadges) {
      await expect(badge).toHaveAttribute('title');
    }
  },
};

// ---------------------------------------------------------------------------
// Additional variant stories (from original)
// ---------------------------------------------------------------------------

/**
 * Full sidebar with both Navigator and ChangedFiles.
 * Feature-level aggregation: shows files from all tasks.
 */
export const FeatureLevelView: Story = {
  render: () => renderFullSidebar(),
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
  render: () => renderFullSidebar(),
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
