/**
 * Test utilities with HiveThemeProvider wrapper
 *
 * Use renderWithTheme (exported as render) for all component tests that use antd components.
 * This ensures proper theming context and CSS isolation.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { HiveThemeProvider } from '../theme/Provider';

/**
 * Wrapper component that provides HiveThemeProvider context
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <HiveThemeProvider mode="light">{children}</HiveThemeProvider>;
}

/**
 * Render with HiveThemeProvider wrapper for antd component tests
 *
 * @param ui - React element to render
 * @param options - Additional render options
 * @returns Render result with all testing-library queries
 */
export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Export renderWithTheme as render for convenience
export { renderWithTheme as render };
