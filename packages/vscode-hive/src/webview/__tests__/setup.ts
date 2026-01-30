/**
 * Test setup for webview tests
 */

import '@testing-library/jest-dom';

// Reset modules between tests to reset vscodeApi singleton
beforeEach(() => {
  // Reset the vscodeApi module's internal state
  // This is handled by vitest's module isolation
});
