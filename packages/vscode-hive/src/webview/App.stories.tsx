/**
 * App.stories.tsx - Storybook stories for the main App container component
 *
 * The App component orchestrates the entire Hive Review UI, managing:
 * - Scope navigation (Feature, Task, Context, Plan, Code)
 * - File selection and navigation
 * - Thread management and display
 * - Review submission
 *
 * State Management:
 * - Session data comes from VSCode extension via postMessage
 * - Internal state tracks active scope, selected file/thread, loading states
 * - File content is cached with TTL for performance
 *
 * Note: VSCode postMessage API is abstracted in vscodeApi.ts with automatic
 * fallback to a console mock when running outside VSCode context.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent, waitFor } from 'storybook/test';

import { App } from './App';
import type { ReviewSession } from 'hive-core';
import type { ExtensionToWebviewMessage } from './types';
import {
  createMockReviewThread,
  createMockAnnotation,
  createMockDiffFile,
} from './__stories__/mocks';

// =============================================================================
// Mock Session Data Factory
// =============================================================================

/**
 * Create a mock ReviewSession for stories
 */
function createMockSession(
  overrides: Partial<ReviewSession> = {},
): ReviewSession {
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: 'session-123',
    featureName: 'example-feature',
    scope: 'feature',
    status: 'in_progress',
    verdict: null,
    summary: null,
    createdAt: now,
    updatedAt: now,
    threads: [],
    diffs: {},
    gitMeta: {
      baseRef: 'main',
      headRef: 'feature/example',
      mergeBase: 'abc123',
      repoRoot: '/workspace',
      capturedAt: now,
      diffStats: { files: 0, insertions: 0, deletions: 0 },
      diffSummary: [],
    },
    ...overrides,
  };
}

/**
 * Create a session with active review content
 */
function createActiveReviewSession(): ReviewSession {
  const thread1 = createMockReviewThread({
    id: 'thread-1',
    uri: 'src/components/Button.tsx',
    status: 'open',
    annotations: [
      createMockAnnotation({
        body: 'Consider adding a loading state to this button component.',
        author: { type: 'llm', name: 'Claude', agentId: 'claude-reviewer' },
      }),
    ],
  });

  const thread2 = createMockReviewThread({
    id: 'thread-2',
    uri: 'src/utils/helpers.ts',
    status: 'resolved',
    annotations: [
      createMockAnnotation({
        body: 'This function could be simplified using Array.reduce()',
        author: { type: 'human', name: 'Reviewer' },
      }),
      createMockAnnotation({
        body: 'Good point, fixed!',
        author: { type: 'human', name: 'Author' },
      }),
    ],
  });

  const buttonFile = createMockDiffFile({
    path: 'src/components/Button.tsx',
    status: 'M',
    hunks: [
      {
        oldStart: 1,
        oldLines: 8,
        newStart: 1,
        newLines: 12,
        lines: [
          { type: 'context', content: "import React from 'react';" },
          { type: 'context', content: '' },
          { type: 'remove', content: 'export function Button({ children }) {' },
          { type: 'add', content: 'interface ButtonProps {' },
          { type: 'add', content: '  children: React.ReactNode;' },
          { type: 'add', content: '  disabled?: boolean;' },
          { type: 'add', content: '}' },
          { type: 'add', content: '' },
          {
            type: 'add',
            content:
              'export function Button({ children, disabled }: ButtonProps) {',
          },
          { type: 'context', content: '  return (' },
          { type: 'remove', content: '    <button className="btn">' },
          {
            type: 'add',
            content: '    <button className="btn" disabled={disabled}>',
          },
          { type: 'context', content: '      {children}' },
          { type: 'context', content: '    </button>' },
          { type: 'context', content: '  );' },
          { type: 'context', content: '}' },
        ],
      },
    ],
  });

  const helperFile = createMockDiffFile({
    path: 'src/utils/helpers.ts',
    status: 'A',
    hunks: [
      {
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: 5,
        lines: [
          {
            type: 'add',
            content: 'export function sum(numbers: number[]): number {',
          },
          {
            type: 'add',
            content: '  return numbers.reduce((acc, n) => acc + n, 0);',
          },
          { type: 'add', content: '}' },
        ],
      },
    ],
  });

  return createMockSession({
    threads: [thread1, thread2],
    diffs: {
      code: {
        baseRef: 'main',
        headRef: 'feature/example',
        mergeBase: 'abc123',
        repoRoot: '/workspace',
        fileRoot: '/workspace',
        diffStats: { files: 2, insertions: 8, deletions: 2 },
        files: [buttonFile, helperFile],
      },
    },
    gitMeta: {
      baseRef: 'main',
      headRef: 'feature/example',
      mergeBase: 'abc123',
      repoRoot: '/workspace',
      capturedAt: new Date().toISOString(),
      diffStats: { files: 2, insertions: 8, deletions: 2 },
      diffSummary: [
        {
          path: 'src/components/Button.tsx',
          status: 'M',
          additions: 6,
          deletions: 2,
        },
        {
          path: 'src/utils/helpers.ts',
          status: 'A',
          additions: 3,
          deletions: 0,
        },
      ],
    },
  });
}

// =============================================================================
// Message Simulation Utilities
// =============================================================================

/**
 * Simulate an extension-to-webview message
 * Dispatches to window as a MessageEvent (same as VSCode does)
 */
function sendMessage(message: ExtensionToWebviewMessage): void {
  window.dispatchEvent(new MessageEvent('message', { data: message }));
}

// =============================================================================
// Storybook Meta
// =============================================================================

const meta = {
  title: 'App/App',
  component: App,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# App Component

The main container component for the Hive Review UI. It orchestrates all sub-components
and manages the application state.

## State Flow

1. **Initialization**: App calls \`notifyReady()\` on mount
2. **Data Loading**: Extension sends \`sessionData\` message
3. **User Interaction**: User navigates, comments, resolves threads
4. **Submission**: User submits review verdict

## Key Features

- **Scope Navigation**: Switch between Feature, Task, Context, Plan, and Code views
- **File Browser**: Navigate changed files in the diff
- **Thread Management**: View, reply to, and resolve review threads
- **Markdown Support**: Renders markdown files with syntax highlighting

## VSCode Integration

The component communicates with the VSCode extension via the abstracted
\`vscodeApi\` module. In Storybook, this automatically falls back to a
console mock, allowing stories to run without VSCode.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // App has no direct props — it is self-contained and receives data
    // via postMessage. These entries document the implicit interface for
    // Storybook users browsing the docs.
  },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

/**
 * Loading state - before any session data is received
 *
 * The app renders with empty state, waiting for the extension
 * to send session data via postMessage.
 */
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Initial loading state before the extension sends session data.
The app shows empty panels and waits for data.
        `,
      },
    },
  },
};

/**
 * Default state with an empty review session
 *
 * Demonstrates the app after receiving a minimal session
 * with no threads or file changes.
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Default state after receiving session data with no active threads
or file changes. Shows the basic UI structure.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate extension sending session data
    sendMessage({
      type: 'sessionData',
      session: createMockSession(),
    });

    const canvas = within(canvasElement);

    // Wait for the session data to be reflected
    await waitFor(() => {
      // Verify the scope tabs are rendered
      const featureTab = canvas.getByRole('tab', { name: /Feature/i });
      expect(featureTab).toBeInTheDocument();
    });
  },
};

/**
 * Active review with threads and file changes
 *
 * Shows a realistic review session with:
 * - Multiple changed files
 * - Open and resolved threads
 * - AI and human annotations
 */
export const WithActiveReview: Story = {
  parameters: {
    docs: {
      description: {
        story: `
A realistic review scenario with multiple files, threads from both
human reviewers and AI, and various thread statuses.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate extension sending active session
    sendMessage({
      type: 'sessionData',
      session: createActiveReviewSession(),
    });

    const canvas = within(canvasElement);

    // Wait for files to appear
    await waitFor(() => {
      // The file navigator should show the files
      const filesHeading = canvas.getByRole('heading', { name: /Files/i });
      expect(filesHeading).toBeInTheDocument();
    });

    // Wait for threads to appear
    await waitFor(() => {
      const threadsHeading = canvas.getByRole('heading', { name: /Threads/i });
      expect(threadsHeading).toBeInTheDocument();
    });
  },
};

/**
 * Integration story - demonstrates navigation flow
 *
 * Shows how users can:
 * 1. Switch between scope tabs
 * 2. Select files
 * 3. View threads
 */
export const NavigationFlow: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the complete navigation flow through the app:
switching scopes, selecting files, and viewing threads.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send active session
    sendMessage({
      type: 'sessionData',
      session: createActiveReviewSession(),
    });

    const canvas = within(canvasElement);

    // Wait for initial render
    await waitFor(() => {
      expect(canvas.getByRole('tab', { name: /Feature/i })).toBeInTheDocument();
    });

    // Click the Code tab to switch views
    const codeTab = canvas.getByRole('tab', { name: /Code/i });
    await userEvent.click(codeTab);

    // After clicking Code, we expect to see the diff/code view area
    // Note: The actual file selection depends on the component state
    await waitFor(() => {
      // The Code tab should now be active
      expect(codeTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

/**
 * Scope content display - non-code scopes
 *
 * Shows how the app displays content for Feature, Task, Plan scopes
 * using either MarkdownViewer or CodeViewer depending on content type.
 */
export const WithScopeContent: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates how the app displays scope-specific content
(plan.md, feature details, etc.) in the main content area.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send session
    sendMessage({
      type: 'sessionData',
      session: createMockSession(),
    });

    const canvas = within(canvasElement);

    // Wait for render
    await waitFor(() => {
      expect(canvas.getByRole('tab', { name: /Feature/i })).toBeInTheDocument();
    });

    // Simulate the extension sending scope content
    sendMessage({
      type: 'scopeChanged',
      scope: 'plan',
      scopeContent: {
        uri: 'plan.md',
        content:
          '# Implementation Plan\n\n## Tasks\n\n1. Setup infrastructure\n2. Implement core logic\n3. Add tests',
        language: 'markdown',
      },
    });

    // Click Plan tab to see content
    const planTab = canvas.getByRole('tab', { name: /Plan/i });
    await userEvent.click(planTab);

    // The plan content should be rendered
    // Note: Actual content visibility depends on implementation
    await waitFor(() => {
      expect(planTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for the App component.
 *
 * Verifies:
 * - Scope tabs are rendered with accessible role="tab" attributes
 * - Tab navigation works between scope tabs
 * - Session data is reflected in the UI after receiving a message
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  play: async ({ canvasElement }) => {
    // Wait for component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate extension sending session data
    sendMessage({
      type: 'sessionData',
      session: createActiveReviewSession(),
    });

    const canvas = within(canvasElement);

    // Wait for scope tabs to render
    await waitFor(() => {
      expect(canvas.getByRole('tab', { name: /Feature/i })).toBeInTheDocument();
    });

    // Verify all scope tabs are accessible via role
    await expect(
      canvas.getByRole('tab', { name: /Feature/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('tab', { name: /Code/i }),
    ).toBeInTheDocument();

    // Verify tab keyboard navigation by clicking a tab
    const codeTab = canvas.getByRole('tab', { name: /Code/i });
    await userEvent.click(codeTab);
    await waitFor(() => {
      expect(codeTab).toHaveAttribute('aria-selected', 'true');
    });

    // Tab navigation should move focus through interactive elements
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(document.body);
  },
};
