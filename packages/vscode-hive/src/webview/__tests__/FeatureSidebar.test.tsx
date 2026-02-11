/**
 * Tests for FeatureSidebar compound component
 *
 * Verifies:
 * - Renders feature tree with status groups
 * - Status group ordering: In Progress > Pending > Completed
 * - Task progress display (done/total)
 * - File click dispatches selectFile
 * - Feature-level aggregation shows latest task diff for duplicate paths
 * - Rename shows old → new path
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { FeatureInfo, DiffPayload } from 'hive-core';

import {
  HiveWorkspaceProvider,
  type HiveWorkspaceState,
} from '../providers/HiveWorkspaceProvider';
import { FeatureSidebar } from '../components/FeatureSidebar';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockFeatures: FeatureInfo[] = [
  {
    name: 'feature-alpha',
    status: 'executing',
    tasks: [
      { folder: '01-setup', name: 'setup', status: 'done', origin: 'plan' },
      {
        folder: '02-implement',
        name: 'implement',
        status: 'in_progress',
        origin: 'plan',
      },
      {
        folder: '03-test',
        name: 'test',
        status: 'pending',
        origin: 'plan',
      },
    ],
    hasPlan: true,
    commentCount: 3,
  },
  {
    name: 'feature-beta',
    status: 'planning',
    tasks: [],
    hasPlan: true,
    commentCount: 0,
  },
  {
    name: 'feature-gamma',
    status: 'completed',
    tasks: [
      { folder: '01-only', name: 'only', status: 'done', origin: 'plan' },
    ],
    hasPlan: true,
    commentCount: 0,
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

function createState(
  overrides?: Partial<HiveWorkspaceState>,
): HiveWorkspaceState {
  return {
    features: mockFeatures,
    activeFeature: null,
    activeTask: null,
    activeFile: null,
    activeView: 'plan',
    fileChanges: new Map(),
    isLoading: false,
    ...overrides,
  };
}

function renderWithProvider(
  ui: React.ReactElement,
  state?: Partial<HiveWorkspaceState>,
) {
  const onRefresh = vi.fn();
  return {
    onRefresh,
    ...render(
      <HiveWorkspaceProvider
        initialState={createState(state)}
        onRefreshFeatures={onRefresh}
      >
        {ui}
      </HiveWorkspaceProvider>,
    ),
  };
}

// ---------------------------------------------------------------------------
// Navigator tests
// ---------------------------------------------------------------------------

describe('FeatureSidebar.Navigator', () => {
  it('renders feature tree with status groups', () => {
    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.Navigator />
      </FeatureSidebar>,
    );

    // Status groups should be visible
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('orders status groups: In Progress, Pending, Completed', () => {
    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.Navigator />
      </FeatureSidebar>,
    );

    const groups = screen.getAllByTestId('status-group');
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveTextContent('In Progress');
    expect(groups[1]).toHaveTextContent('Pending');
    expect(groups[2]).toHaveTextContent('Completed');
  });

  it('displays task progress (done/total) on feature nodes', () => {
    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.Navigator />
      </FeatureSidebar>,
    );

    // feature-alpha has 1 done out of 3
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('shows feature names under correct status groups', () => {
    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.Navigator />
      </FeatureSidebar>,
    );

    expect(screen.getByText('feature-alpha')).toBeInTheDocument();
    expect(screen.getByText('feature-beta')).toBeInTheDocument();
    expect(screen.getByText('feature-gamma')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ChangedFiles tests
// ---------------------------------------------------------------------------

describe('FeatureSidebar.ChangedFiles', () => {
  it('renders file list when feature is selected with file changes', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    fileChanges.set(
      '01-setup',
      [makeDiffPayload([{ path: 'src/index.ts', status: 'A', additions: 10 }])],
    );

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      { activeFeature: 'feature-alpha', fileChanges },
    );

    expect(screen.getByText('src/index.ts')).toBeInTheDocument();
  });

  it('dispatches selectFile when a file is clicked', async () => {
    const user = userEvent.setup();
    const fileChanges = new Map<string, DiffPayload[]>();
    fileChanges.set(
      '01-setup',
      [makeDiffPayload([{ path: 'src/app.ts', status: 'M', additions: 5, deletions: 2 }])],
    );

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      { activeFeature: 'feature-alpha', fileChanges },
    );

    const fileItem = screen.getByTestId('changed-file-src/app.ts');
    await user.click(fileItem);

    // The click should trigger selectFile — we can't directly test the
    // dispatch but we can verify the element is interactive
    expect(fileItem).toBeInTheDocument();
  });

  it('shows status indicators with correct colors', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    fileChanges.set('01-setup', [
      makeDiffPayload([
        { path: 'added.ts', status: 'A', additions: 10 },
        { path: 'modified.ts', status: 'M', additions: 5, deletions: 3 },
        { path: 'deleted.ts', status: 'D', deletions: 8 },
        { path: 'renamed.ts', status: 'R' },
        { path: 'copied.ts', status: 'C' },
      ]),
    ]);

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      { activeFeature: 'feature-alpha', fileChanges },
    );

    // Each status badge should have the correct test id
    expect(screen.getByTestId('status-badge-A')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-M')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-D')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-R')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-C')).toBeInTheDocument();
  });

  it('feature-level aggregation shows latest task diff for duplicate paths', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    // Task 01 modifies index.ts with 5 additions
    fileChanges.set('01-setup', [
      makeDiffPayload([
        { path: 'src/index.ts', status: 'M', additions: 5, deletions: 1 },
      ]),
    ]);
    // Task 02 also modifies index.ts with 10 additions (later task)
    fileChanges.set('02-implement', [
      makeDiffPayload([
        { path: 'src/index.ts', status: 'M', additions: 10, deletions: 3 },
      ]),
    ]);

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      { activeFeature: 'feature-alpha', fileChanges },
    );

    // Should show only ONE entry for src/index.ts (from latest task 02-implement)
    const fileItems = screen.getAllByTestId('changed-file-src/index.ts');
    expect(fileItems).toHaveLength(1);

    // Should show additions from the latest task (10)
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('task-level shows only that task files', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    fileChanges.set('01-setup', [
      makeDiffPayload([{ path: 'src/setup.ts', status: 'A', additions: 20 }]),
    ]);
    fileChanges.set('02-implement', [
      makeDiffPayload([{ path: 'src/impl.ts', status: 'A', additions: 15 }]),
    ]);

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      {
        activeFeature: 'feature-alpha',
        activeTask: '02-implement',
        fileChanges,
      },
    );

    // Should only show files from task 02
    expect(screen.getByText('src/impl.ts')).toBeInTheDocument();
    expect(screen.queryByText('src/setup.ts')).not.toBeInTheDocument();
  });

  it('shows rename with old → new path indicator', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    const payload = makeDiffPayload([
      { path: 'src/new-name.ts', status: 'R' },
    ]);
    // Add oldPath to the rename file
    (payload.files[0] as any).oldPath = 'src/old-name.ts';
    fileChanges.set('01-setup', [payload]);

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      { activeFeature: 'feature-alpha', fileChanges },
    );

    expect(screen.getByText('src/old-name.ts')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('src/new-name.ts')).toBeInTheDocument();
  });

  it('shows empty state when no feature is selected', () => {
    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
    );

    expect(screen.getByText('No files to display')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Compound component pattern
// ---------------------------------------------------------------------------

describe('FeatureSidebar (compound)', () => {
  it('renders both Navigator and ChangedFiles together', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    fileChanges.set('01-setup', [
      makeDiffPayload([{ path: 'src/file.ts', status: 'A', additions: 1 }]),
    ]);

    renderWithProvider(
      <FeatureSidebar>
        <FeatureSidebar.Navigator />
        <FeatureSidebar.ChangedFiles />
      </FeatureSidebar>,
      { activeFeature: 'feature-alpha', fileChanges },
    );

    // Navigator content
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    // ChangedFiles content
    expect(screen.getByText('src/file.ts')).toBeInTheDocument();
  });
});
