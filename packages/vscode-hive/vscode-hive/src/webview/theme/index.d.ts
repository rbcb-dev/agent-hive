/**
 * Theme module exports
 *
 * This module provides the theme infrastructure for the Hive Review UI.
 * Components should use useTheme() to access the current theme mode.
 */
export { HiveThemeProvider } from './Provider';
export type { HiveThemeProviderProps } from './Provider';
export { useTheme, ThemeContext } from './useTheme';
export type { ThemeMode } from './useTheme';
