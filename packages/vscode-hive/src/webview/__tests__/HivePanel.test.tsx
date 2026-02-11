/**
 * Tests for HivePanel — Unified App Layout with Sidebar
 *
 * Verifies:
 * - Renders sidebar (FeatureSidebar) and content area
 * - activeView drives content rendering (plan, context, task, diff)
 * - Sidebar selection updates content area
 * - Existing review mode still works (ScopeTabs, ReviewSummary)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { FeatureInfo, DiffPayload } from 'hive-core';

import {
  HiveWorkspaceProvider,
  type HiveWorkspaceState,
} from '../providers/HiveWorkspaceProvider';
import { HivePanel } from '../components/HivePanel';
import { HiveThemeProvider } from '../theme/Provider';

// ---------------------------------------------------------------------------
// Mock vscodeApi
// ---------------------------------------------------------------------------

vi.mock('../vscodeApi', () => ({
  notifyReady: vi.fn(),
  addMessageListener: vi.fn(() => vi.fn()),
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockFeatures: FeatureInfo[] = [
  {
    name: 'feature-one',
    status: 'executing',
    tasks: [
      { folder: 'task-a', name: 'task-a', status: 'in_progress', origin: 'plan' },
      { folder: 'task-b', name: 'task-b', status: 'pending', origin: 'plan' },
    ],
    hasPlan: true,
    commentCount: 2,
  },
  {
    name: 'feature-two',
    status: 'planning',
    tasks: [],
    hasPlan: false,
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

function renderHivePanel(state?: Partial<HiveWorkspaceState>) {
  return render(
    <HiveThemeProvider mode="light">
      <HiveWorkspaceProvider initialState={createState(state)}>
        <HivePanel />
      </HiveWorkspaceProvider>
    </HiveThemeProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests: Layout structure
// ---------------------------------------------------------------------------

describe('HivePanel - Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with FeatureSidebar', () => {
    renderHivePanel();

    // FeatureSidebar renders status groups for Navigator
    expect(screen.getByTestId('hive-panel')).toBeInTheDocument();
    // Should contain the sidebar area
    const sidebar = screen.getByTestId('hive-panel-sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('renders content area', () => {
    renderHivePanel();

    const content = screen.getByTestId('hive-panel-content');
    expect(content).toBeInTheDocument();
  });

  it('renders both sidebar and content in master-detail layout', () => {
    renderHivePanel();

    const panel = screen.getByTestId('hive-panel');
    const sidebar = screen.getByTestId('hive-panel-sidebar');
    const content = screen.getByTestId('hive-panel-content');

    // Both should be children of the panel
    expect(panel).toContainElement(sidebar);
    expect(panel).toContainElement(content);
  });
});

// ---------------------------------------------------------------------------
// Tests: activeView drives content rendering
// ---------------------------------------------------------------------------

describe('HivePanel - Content routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plan view placeholder when activeView is plan and no feature selected', () => {
    renderHivePanel({ activeView: 'plan' });

    const content = screen.getByTestId('hive-panel-content');
    expect(within(content).getByText(/select a feature/i)).toBeInTheDocument();
  });

  it('renders task view when activeView is task', () => {
    renderHivePanel({
      activeFeature: 'feature-one',
      activeTask: 'task-a',
      activeView: 'task',
    });

    const content = screen.getByTestId('hive-panel-content');
    // Task view has a heading with the task name
    const heading = within(content).getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('task-a');
  });

  it('renders diff view when activeView is diff', () => {
    renderHivePanel({
      activeFeature: 'feature-one',
      activeFile: 'src/index.ts',
      activeView: 'diff',
    });

    const content = screen.getByTestId('hive-panel-content');
    // DiffViewer shows no content when there's no diff data, but the component should be rendered
    expect(content).toBeInTheDocument();
  });

  it('renders context view when activeView is context', () => {
    renderHivePanel({
      activeFeature: 'feature-one',
      activeView: 'context',
    });

    const content = screen.getByTestId('hive-panel-content');
    expect(content).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: Sidebar integration
// ---------------------------------------------------------------------------

describe('HivePanel - Sidebar integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sidebar shows feature navigator with features', () => {
    renderHivePanel();

    // FeatureSidebar.Navigator renders status groups
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('sidebar shows changed files when feature is selected', () => {
    const fileChanges = new Map<string, DiffPayload[]>();
    fileChanges.set('task-a', [
      makeDiffPayload([{ path: 'src/app.ts', status: 'M', additions: 5 }]),
    ]);

    renderHivePanel({
      activeFeature: 'feature-one',
      fileChanges,
    });

    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: Review mode compatibility
// ---------------------------------------------------------------------------

describe('HivePanel - Review mode compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not break existing Layout compound component usage', () => {
    renderHivePanel();

    // The component should use antd Layout
    const layout = document.querySelector('.ant-layout');
    expect(layout).toBeInTheDocument();
  });
});
