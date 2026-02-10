/**
 * useTheme hook - Access current theme mode from HiveThemeProvider context
 *
 * This hook provides components with access to the current theme mode (light/dark).
 * Components MUST be wrapped in HiveThemeProvider to use this hook.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const theme = useTheme(); // 'light' | 'dark'
 *   return <div data-theme={theme}>...</div>;
 * }
 * ```
 */

import { useContext, createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

/**
 * Context for theme mode propagation.
 * Uses a sentinel value to detect when used outside provider.
 */
const THEME_CONTEXT_DEFAULT = '__THEME_NOT_PROVIDED__' as const;

export const ThemeContext = createContext<
  ThemeMode | typeof THEME_CONTEXT_DEFAULT
>(THEME_CONTEXT_DEFAULT);

/**
 * Hook to access current theme mode from HiveThemeProvider context.
 *
 * @throws Error if called outside of HiveThemeProvider
 * @returns Current theme mode ('light' | 'dark')
 */
export function useTheme(): ThemeMode {
  const theme = useContext(ThemeContext);

  if (theme === THEME_CONTEXT_DEFAULT) {
    throw new Error(
      'useTheme must be used within a HiveThemeProvider. ' +
        'Wrap your component tree with <HiveThemeProvider> to use theme-aware components.',
    );
  }

  return theme;
}
