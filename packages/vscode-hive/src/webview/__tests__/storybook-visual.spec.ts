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
const SKIP_IN_VISUAL = new Set<string>([
  // DiffViewer thread stories embed InlineThread sub-components which
  // cause the same timeout issues as standalone InlineThread/ThreadPanel.
  // They pass with --update (baseline capture) but timeout on verify runs.
  // Tested functionally in storybook.spec.ts (jsdom) instead.
  'components-diffviewer--with-threads',
  'components-diffviewer--add-thread',
  'components-diffviewer--resolve-thread',
]);

// Import story modules — runtime components (same as storybook.spec.ts)
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
import * as CommitHistoryStories from '../components/CommitHistory.stories';
import * as PlanReviewStories from '../components/PlanReview.stories';
import * as AppStories from '../App.stories';
// Import story modules — sidebar + integrated layout
import * as FeatureSidebarStories from '../components/FeatureSidebar/FeatureSidebar.stories';
import * as HivePanelStories from '../components/HivePanel.stories';
import * as HiveWorkspaceProviderStories from '../providers/HiveWorkspaceProvider.stories';
// Import story modules — primitives
import * as AlertStories from '../primitives/Alert.stories';
import * as ButtonStories from '../primitives/Button.stories';
import * as CardStories from '../primitives/Card.stories';
import * as CollapseStories from '../primitives/Collapse.stories';
import * as FlexStories from '../primitives/Flex.stories';
import * as LayoutStories from '../primitives/Layout.stories';
import * as RadioGroupStories from '../primitives/RadioGroup.stories';
import * as SegmentedStories from '../primitives/Segmented.stories';
import * as SpaceStories from '../primitives/Space.stories';
import * as TabsStories from '../primitives/Tabs.stories';
import * as TextAreaStories from '../primitives/TextArea.stories';
import * as TreeStories from '../primitives/Tree.stories';
import * as TypographyStories from '../primitives/Typography.stories';
import * as VirtualListStories from '../primitives/VirtualList.stories';

// Compose stories from each module — applies all annotations (story, meta, project)
const storyModules = {
  // Runtime components
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
  CommitHistory: composeStories(CommitHistoryStories),
  PlanReview: composeStories(PlanReviewStories),
  App: composeStories(AppStories),
  // Sidebar + integrated layout
  FeatureSidebar: composeStories(FeatureSidebarStories),
  HivePanel: composeStories(HivePanelStories),
  HiveWorkspaceProvider: composeStories(HiveWorkspaceProviderStories),
  // Primitives
  Alert: composeStories(AlertStories),
  Button: composeStories(ButtonStories),
  Card: composeStories(CardStories),
  Collapse: composeStories(CollapseStories),
  Flex: composeStories(FlexStories),
  Layout: composeStories(LayoutStories),
  RadioGroup: composeStories(RadioGroupStories),
  Segmented: composeStories(SegmentedStories),
  Space: composeStories(SpaceStories),
  Tabs: composeStories(TabsStories),
  TextArea: composeStories(TextAreaStories),
  Tree: composeStories(TreeStories),
  Typography: composeStories(TypographyStories),
  VirtualList: composeStories(VirtualListStories),
};

/**
 * Convert a component name and story name into a kebab-case screenshot ID.
 * Maps module keys to their Storybook title prefix:
 *   "App" → "app"
 *   "ScopeTabs" → "components-scopetabs"
 *   "Alert" → "primitives-alert"
 *   "HiveWorkspaceProvider" → "providers-hiveworkspaceprovider"
 */
const PRIMITIVE_NAMES = new Set([
  'Alert', 'Button', 'Card', 'Collapse', 'Flex', 'Layout',
  'RadioGroup', 'Segmented', 'Space', 'Tabs', 'TextArea',
  'Tree', 'Typography', 'VirtualList',
]);
const PROVIDER_NAMES = new Set(['HiveWorkspaceProvider']);

function toScreenshotId(componentName: string, storyName: string): string {
  let kind: string;
  if (componentName === 'App') {
    kind = 'app';
  } else if (PRIMITIVE_NAMES.has(componentName)) {
    kind = `primitives-${componentName.toLowerCase()}`;
  } else if (PROVIDER_NAMES.has(componentName)) {
    kind = `providers-${componentName.toLowerCase()}`;
  } else {
    kind = `components-${componentName.toLowerCase()}`;
  }
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
