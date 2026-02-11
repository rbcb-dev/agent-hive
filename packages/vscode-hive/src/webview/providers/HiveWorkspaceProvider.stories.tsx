/**
 * Storybook stories for HiveWorkspaceProvider
 *
 * Demonstrates the provider with a simple consumer component
 * that displays and interacts with workspace state.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';
import React from 'react';

import {
  HiveWorkspaceProvider,
  useHiveWorkspace,
} from './HiveWorkspaceProvider';
import type {
  HiveWorkspaceState,
  HiveWorkspaceProviderProps,
} from './HiveWorkspaceProvider';
import type { FeatureInfo } from 'hive-core';

// ---------------------------------------------------------------------------
// Demo consumer component
// ---------------------------------------------------------------------------

function WorkspaceConsumer() {
  const { state, actions } = useHiveWorkspace();

  return (
    <div style={{ fontFamily: 'monospace', padding: 16 }}>
      <h3>Workspace State</h3>
      <dl>
        <dt>Active Feature</dt>
        <dd data-testid="active-feature">
          {state.activeFeature ?? '(none)'}
        </dd>
        <dt>Active Task</dt>
        <dd data-testid="active-task">{state.activeTask ?? '(none)'}</dd>
        <dt>Active File</dt>
        <dd data-testid="active-file">{state.activeFile ?? '(none)'}</dd>
        <dt>Active View</dt>
        <dd data-testid="active-view">{state.activeView}</dd>
        <dt>Loading</dt>
        <dd data-testid="is-loading">{String(state.isLoading)}</dd>
      </dl>

      <h3>Features ({state.features.length})</h3>
      <ul>
        {state.features.map((f) => (
          <li key={f.name}>
            <button
              data-testid={`select-feature-${f.name}`}
              onClick={() => actions.selectFeature(f.name)}
            >
              {f.name} ({f.status})
            </button>
          </li>
        ))}
      </ul>

      <h3>Actions</h3>
      <button
        data-testid="select-task-btn"
        onClick={() => actions.selectTask('task-a')}
      >
        Select Task A
      </button>
      <button
        data-testid="select-file-btn"
        onClick={() => actions.selectFile('/src/index.ts')}
      >
        Select File
      </button>
      <button
        data-testid="refresh-btn"
        onClick={() => actions.refreshFeatures()}
      >
        Refresh
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const sampleFeatures: FeatureInfo[] = [
  {
    name: 'auth-system',
    status: 'executing',
    tasks: [
      {
        folder: 'task-a',
        name: 'setup-database',
        status: 'done',
        origin: 'plan',
      },
      {
        folder: 'task-b',
        name: 'implement-jwt',
        status: 'in_progress',
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
];

const defaultInitialState: HiveWorkspaceState = {
  features: sampleFeatures,
  activeFeature: null,
  activeTask: null,
  activeFile: null,
  activeView: 'plan',
  fileChanges: new Map(),
  isLoading: false,
};

// ---------------------------------------------------------------------------
// Meta — uses Omit to exclude children (provided by render)
// ---------------------------------------------------------------------------

type StoryProps = Omit<HiveWorkspaceProviderProps, 'children'>;

const meta: Meta<StoryProps> = {
  title: 'Providers/HiveWorkspaceProvider',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    initialState: {
      description: 'Initial workspace state for the provider',
      control: false,
    },
    onRefreshFeatures: {
      action: 'onRefreshFeatures',
      description: 'Callback when refreshFeatures is triggered',
    },
  },
  render: (args) => (
    <HiveWorkspaceProvider {...args}>
      <WorkspaceConsumer />
    </HiveWorkspaceProvider>
  ),
};

export default meta;
type Story = StoryObj<StoryProps>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default state: no active feature selected.
 * Click a feature name to select it and observe state changes.
 */
export const Default: Story = {
  args: {
    initialState: defaultInitialState,
    onRefreshFeatures: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state
    await expect(canvas.getByTestId('active-feature')).toHaveTextContent(
      '(none)',
    );
    await expect(canvas.getByTestId('active-view')).toHaveTextContent('plan');

    // Select a feature
    await userEvent.click(canvas.getByTestId('select-feature-auth-system'));
    await expect(canvas.getByTestId('active-feature')).toHaveTextContent(
      'auth-system',
    );

    // Select a task
    await userEvent.click(canvas.getByTestId('select-task-btn'));
    await expect(canvas.getByTestId('active-task')).toHaveTextContent(
      'task-a',
    );
    await expect(canvas.getByTestId('active-view')).toHaveTextContent('task');

    // Select a file
    await userEvent.click(canvas.getByTestId('select-file-btn'));
    await expect(canvas.getByTestId('active-file')).toHaveTextContent(
      '/src/index.ts',
    );
    await expect(canvas.getByTestId('active-view')).toHaveTextContent('diff');
  },
};

/**
 * With a feature pre-selected.
 */
export const WithActiveFeature: Story = {
  args: {
    initialState: {
      ...defaultInitialState,
      activeFeature: 'auth-system',
    },
    onRefreshFeatures: fn(),
  },
};

/**
 * Loading state active.
 */
export const Loading: Story = {
  args: {
    initialState: {
      ...defaultInitialState,
      isLoading: true,
    },
    onRefreshFeatures: fn(),
  },
};
