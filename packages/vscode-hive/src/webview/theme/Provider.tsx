/**
 * HiveThemeProvider - Ant Design theme wrapper with CSS isolation
 * 
 * This component provides:
 * - CSS isolation via StyleProvider with @layer (prevents style leakage)
 * - Centralized theming with design tokens
 * - Dark/light mode switching
 * - App wrapper for message/notification/modal APIs
 * - ThemeContext for child components to access current theme mode
 * 
 * Usage:
 * ```tsx
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
import type { ReactNode } from 'react';
import { ThemeContext } from './useTheme';

export interface HiveThemeProviderProps {
  /**
   * Theme mode - 'light' or 'dark'
   * @default 'light'
   */
  mode?: 'light' | 'dark';
  /**
   * Children to render inside the provider
   */
  children: ReactNode;
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
 * @param props - Provider props
 * @returns Wrapped children with theme context
 */
export function HiveThemeProvider({ 
  mode = 'light', 
  children 
}: HiveThemeProviderProps): React.ReactElement {
  return (
    <ThemeContext.Provider value={mode}>
      <StyleProvider layer>
        <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
          <App>{children}</App>
        </ConfigProvider>
      </StyleProvider>
    </ThemeContext.Provider>
  );
}
