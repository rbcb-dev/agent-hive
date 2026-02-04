/**
 * Test setup for webview tests
 */

import '@testing-library/jest-dom';

// Mock ResizeObserver (required by antd components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia (required by some antd components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Reset modules between tests to reset vscodeApi singleton
beforeEach(() => {
  // Reset the vscodeApi module's internal state
  // This is handled by vitest's module isolation
});
