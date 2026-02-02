import type { TestRunnerConfig } from '@storybook/test-runner';
import { waitForPageReady, getStoryContext } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { join } from 'path';

// Store image snapshots in __image_snapshots__ directory
const customSnapshotsDir = join(process.cwd(), '__image_snapshots__');
// Store diff output in the same directory
const customDiffDir = join(process.cwd(), '__image_snapshots__', '__diff_output__');

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },

  async preVisit(page) {
    // Set a consistent viewport size for snapshots
    await page.setViewportSize({ width: 1024, height: 768 });
  },

  async postVisit(page, context) {
    // Get story context to check for snapshot configuration
    const storyContext = await getStoryContext(page, context);

    // Skip snapshot if story has disableSnapshot parameter
    if (storyContext.parameters?.snapshot?.disable) {
      return;
    }

    // Wait for the page to be fully loaded (fonts, images, etc.)
    await waitForPageReady(page);

    // Take a screenshot and compare with baseline
    const image = await page.screenshot();
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir,
      customDiffDir,
      customSnapshotIdentifier: context.id,
      // Allow a small threshold for differences (1% by default)
      // This accounts for minor anti-aliasing differences across platforms
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    });
  },
};

export default config;
