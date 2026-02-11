/**
 * HiveThemeProvider - Ant Design theme wrapper with CSS isolation
 *
 * This component provides:
 * - CSS isolation via StyleProvider with @layer (prevents style leakage)
 * - Centralized theming with design tokens
 * - Dark/light mode switching
 * - Auto-detection from VS Code's data-vscode-theme-kind attribute
 * - Dynamic theme updates via MutationObserver
 * - App wrapper for message/notification/modal APIs
 * - ThemeContext for child components to access current theme mode
 *
 * Usage:
 * ```tsx
 * // Auto-detect from VS Code theme (recommended)
 * <HiveThemeProvider>
 *   <YourApp />
 * </HiveThemeProvider>
 *
 * // Explicit override
 * <HiveThemeProvider mode="dark">
 *   <YourApp />
 * </HiveThemeProvider>
 * ```
 *
 * Components can access the theme via useTheme():
 * ```tsx
 * const theme = useTheme(); // 'light' | 'dark'
 * ```
 *
 * IMPORTANT: This is the ONLY file that should import ConfigProvider/StyleProvider.
 * All other components should just use antd components directly.
 */

import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, App, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ThemeMode } from './useTheme';
import { ThemeContext } from './useTheme';

export interface HiveThemeProviderProps {
  /**
   * Theme mode - 'light' or 'dark'.
   * When omitted, auto-detects from document.body.dataset.vscodeThemeKind
   * and observes changes via MutationObserver.
   */
  mode?: 'light' | 'dark';
  /**
   * Children to render inside the provider
   */
  children: ReactNode;
}

/**
 * Detect theme mode from VS Code's data-vscode-theme-kind body attribute.
 *
 * Mapping:
 * - 'vscode-dark' → 'dark'
 * - 'vscode-high-contrast' → 'dark'
 * - 'vscode-light' → 'light'
 * - 'vscode-high-contrast-light' → 'light'
 * - undefined / unknown → 'light' (fallback)
 */
function detectVscodeTheme(): ThemeMode {
  const themeKind = document.body.dataset.vscodeThemeKind;
  if (themeKind === 'vscode-dark' || themeKind === 'vscode-high-contrast') {
    return 'dark';
  }
  return 'light';
}

/**
 * Light theme configuration
 * Uses Ant Design's default blue primary color with standard border radius
 */
const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
};

/**
 * Dark theme configuration
 * Uses Ant Design's dark algorithm for automatic color adjustments
 */
const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
};

/**
 * HiveThemeProvider wraps children with Ant Design's theme context
 *
 * The provider hierarchy is:
 * 1. ThemeContext.Provider - Theme mode for components using useTheme()
 * 2. StyleProvider (layer) - CSS isolation using @layer
 * 3. ConfigProvider - Theme configuration
 * 4. App - Message/notification/modal context
 *
 * When no `mode` prop is provided, the provider auto-detects the theme
 * from `document.body.dataset.vscodeThemeKind` and watches for changes
 * via MutationObserver to stay in sync with VS Code theme switches.
 *
 * @param props - Provider props
 * @returns Wrapped children with theme context
 */
export function HiveThemeProvider({
  mode,
  children,
}: HiveThemeProviderProps): React.ReactElement {
  const [detectedMode, setDetectedMode] =
    useState<ThemeMode>(detectVscodeTheme);

  useEffect(() => {
    // If explicit mode is provided, skip observation
    if (mode !== undefined) return;

    // Sync initial state (in case body attribute changed between render and effect)
    setDetectedMode(detectVscodeTheme());

    // Watch for VS Code theme changes via MutationObserver
    const observer = new MutationObserver(() => {
      setDetectedMode(detectVscodeTheme());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-vscode-theme-kind'],
    });

    return () => observer.disconnect();
  }, [mode]);

  const resolvedMode = mode ?? detectedMode;

  return (
    <ThemeContext.Provider value={resolvedMode}>
      <StyleProvider layer>
        <ConfigProvider
          theme={resolvedMode === 'dark' ? darkTheme : lightTheme}
        >
          <App>{children}</App>
        </ConfigProvider>
      </StyleProvider>
    </ThemeContext.Provider>
  );
}
