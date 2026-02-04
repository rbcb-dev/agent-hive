import React from 'react';
import type { ReactElement } from 'react';
import { HiveThemeProvider } from '../src/webview/theme/Provider';

/**
 * Wrapper decorator for stories that use React hooks
 * Ensures React Dispatcher is properly initialized for Storybook 10 + React 19
 */
export function useHooksWrapper(Story: () => ReactElement): ReactElement {
  return <Story />;
}

/**
 * Wrapper to provide global React context
 * Use when you need to wrap all stories in a provider
 */
export function withReactProvider(Story: () => ReactElement): ReactElement {
  return (
    <React.StrictMode>
      <Story />
    </React.StrictMode>
  );
}

/**
 * Decorator that wraps stories with HiveThemeProvider
 * This is already applied globally in preview.tsx, but can be used
 * for story-specific theme overrides
 */
export function withHiveTheme(mode: 'light' | 'dark' = 'light') {
  return function Wrapper(Story: () => ReactElement): ReactElement {
    return (
      <HiveThemeProvider mode={mode}>
        <Story />
      </HiveThemeProvider>
    );
  };
}
