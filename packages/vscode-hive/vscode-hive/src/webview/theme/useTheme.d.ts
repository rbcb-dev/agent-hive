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
export type ThemeMode = 'light' | 'dark';
export declare const ThemeContext: import("react").Context<ThemeMode | "__THEME_NOT_PROVIDED__">;
/**
 * Hook to access current theme mode from HiveThemeProvider context.
 *
 * @throws Error if called outside of HiveThemeProvider
 * @returns Current theme mode ('light' | 'dark')
 */
export declare function useTheme(): ThemeMode;
