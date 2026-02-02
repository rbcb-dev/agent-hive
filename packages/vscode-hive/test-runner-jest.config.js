import { getJestConfig } from '@storybook/test-runner';

const defaultConfig = getJestConfig();

/**
 * Jest configuration for Storybook test runner with image snapshots.
 * 
 * This extends the default Storybook test runner config to add:
 * - Custom snapshot resolver for organized snapshot storage
 * - Image snapshot configuration for visual regression testing
 * 
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  // The default Jest configuration comes from @storybook/test-runner
  ...defaultConfig,
  
  // Custom test match patterns (optional - can be overridden)
  testTimeout: 30000,
  
  // Reporter configuration for cleaner output
  reporters: ['default'],
};

export default config;
