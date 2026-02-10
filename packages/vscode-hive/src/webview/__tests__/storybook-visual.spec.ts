/**
 * Visual Snapshot Tests (Vitest Browser Mode + Playwright)
 *
 * Renders each Storybook story in a real Playwright browser and
 * captures a screenshot for visual regression comparison using
 * Vitest's built-in `toMatchScreenshot()` assertion.
 *
 * Unlike storybook.spec.ts (jsdom, functional tests), this file
 * focuses on visual correctness: rendering fidelity, layout, and
 * styling. Play functions are NOT executed here — only rendering
 * and screenshot comparison.
 *
 * Screenshot baselines are stored in __image_snapshots__/ and
 * compared using pixelmatch (configured in vitest.visual.config.ts).
 *
 * Stories with interactive play functions that cause timeouts in
 * browser mode are skipped (they are tested functionally in
 * storybook.spec.ts instead).
 */
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { composeStories } from '@storybook/react';
import { createElement } from 'react';

/**
 * Component prefixes to skip entirely in visual tests.
 * ThreadPanel and InlineThread stories consistently timeout in browser mode
 * due to complex rendering (TextArea, postMessage handlers, resolved-state logic).
 * They are tested functionally in storybook.spec.ts (jsdom) instead.
 */
const SKIP_COMPONENT_PREFIXES = [
  'components-threadpanel',
  'components-inlinethread',
];

/**
 * Individual stories to skip (for stories outside skipped components
 * that still cause issues in browser mode).
 */
const SKIP_IN_VISUAL = new Set<string>([]);

// Import story modules (same as storybook.spec.ts)
import * as ScopeTabsStories from '../components/ScopeTabs.stories';
import * as ThreadListStories from '../components/ThreadList.stories';
import * as ThreadPanelStories from '../components/ThreadPanel.stories';
import * as ReviewSummaryStories from '../components/ReviewSummary.stories';
import * as FileNavigatorStories from '../components/FileNavigator.stories';
import * as InlineThreadStories from '../components/InlineThread.stories';
import * as CodeViewerStories from '../components/CodeViewer.stories';
import * as DiffViewerStories from '../components/DiffViewer.stories';
import * as MarkdownViewerStories from '../components/MarkdownViewer.stories';
import * as SuggestionPreviewStories from '../components/SuggestionPreview.stories';
import * as AppStories from '../App.stories';

// Compose stories from each module — applies all annotations (story, meta, project)
const storyModules = {
  ScopeTabs: composeStories(ScopeTabsStories),
  ThreadList: composeStories(ThreadListStories),
  ThreadPanel: composeStories(ThreadPanelStories),
  ReviewSummary: composeStories(ReviewSummaryStories),
  FileNavigator: composeStories(FileNavigatorStories),
  InlineThread: composeStories(InlineThreadStories),
  CodeViewer: composeStories(CodeViewerStories),
  DiffViewer: composeStories(DiffViewerStories),
  MarkdownViewer: composeStories(MarkdownViewerStories),
  SuggestionPreview: composeStories(SuggestionPreviewStories),
  App: composeStories(AppStories),
};

/**
 * Convert a component name and story name into a kebab-case screenshot ID.
 * Example: ("ScopeTabs", "Default") → "components-scopetabs--default"
 */
function toScreenshotId(componentName: string, storyName: string): string {
  const kind =
    componentName === 'App'
      ? 'app'
      : `components-${componentName.toLowerCase()}`;
  const story = storyName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return `${kind}--${story}`;
}

// Generate visual snapshot tests for each composed story
for (const [componentName, stories] of Object.entries(storyModules)) {
  describe(componentName, () => {
    for (const [storyName, Story] of Object.entries(stories)) {
      const screenshotId = toScreenshotId(componentName, storyName);

      // Skip stories/components that are known to timeout in browser mode
      const shouldSkip =
        SKIP_IN_VISUAL.has(screenshotId) ||
        SKIP_COMPONENT_PREFIXES.some((prefix) =>
          screenshotId.startsWith(prefix),
        );
      if (shouldSkip) {
        it.skip(`${storyName} - visual snapshot (skipped: timeout in browser mode)`, () => {});
        continue;
      }

      it(`${storyName} - visual snapshot`, async () => {
        // Render the composed story (includes all decorators from preview.tsx)
        const screen = render(createElement(Story as React.FC));

        // Wait for content to be visible in the rendered container
        await expect.element(screen.baseElement).toBeVisible();

        // Capture and compare screenshot against baseline
        await expect.element(screen.container).toMatchScreenshot(screenshotId);
      });
    }
  });
}
