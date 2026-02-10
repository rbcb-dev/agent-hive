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
import type { ReactNode } from 'react';
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
export declare function HiveThemeProvider({ mode, children, }: HiveThemeProviderProps): React.ReactElement;
