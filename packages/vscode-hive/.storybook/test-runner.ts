import type { TestRunnerConfig } from '@storybook/test-runner';
import { waitForPageReady, getStoryContext } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

const customSnapshotsDir = `${process.cwd()}/__snapshots__`;

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
  },

  async preVisit(page) {
    // Set a consistent viewport size for snapshots
    await page.setViewportSize({ width: 800, height: 600 });
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
      customSnapshotIdentifier: context.id,
      // Allow a small threshold for differences (1% by default)
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    });
  },
};

export default config;
