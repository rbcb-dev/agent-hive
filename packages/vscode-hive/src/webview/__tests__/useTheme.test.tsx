/**
 * Tests for useTheme hook
 * 
 * Verifies:
 * - Returns theme mode from context
 * - Throws helpful error when called outside provider
 * - Works correctly with light and dark themes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import React from 'react';

// Import will exist after implementation
import { useTheme, ThemeContext } from '../theme/useTheme';
import { HiveThemeProvider } from '../theme/Provider';

describe('useTheme', () => {
  it('returns light theme when provider mode is light', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <HiveThemeProvider mode="light">{children}</HiveThemeProvider>
      ),
    });

    expect(result.current).toBe('light');
  });

  it('returns dark theme when provider mode is dark', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <HiveThemeProvider mode="dark">{children}</HiveThemeProvider>
      ),
    });

    expect(result.current).toBe('dark');
  });

  it('defaults to light theme when provider has no mode specified', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <HiveThemeProvider>{children}</HiveThemeProvider>
      ),
    });

    expect(result.current).toBe('light');
  });

  it('throws helpful error when called outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow(/useTheme must be used within a HiveThemeProvider/);

    consoleSpy.mockRestore();
  });

  it('updates when provider theme changes', () => {
    function TestComponent() {
      const theme = useTheme();
      return <div data-testid="theme-value">{theme}</div>;
    }

    const { rerender } = render(
      <HiveThemeProvider mode="light">
        <TestComponent />
      </HiveThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    rerender(
      <HiveThemeProvider mode="dark">
        <TestComponent />
      </HiveThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });
});

describe('ThemeContext', () => {
  it('is exported and can be used directly if needed', () => {
    expect(ThemeContext).toBeDefined();
    expect(ThemeContext.Provider).toBeDefined();
  });
});
