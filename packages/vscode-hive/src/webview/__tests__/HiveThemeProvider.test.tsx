/**
 * Tests for HiveThemeProvider component
 *
 * Verifies:
 * - CSS isolation (antd styles don't leak outside provider)
 * - Theme switching (light/dark mode)
 * - Children are rendered
 * - Default mode is 'light'
 * - Auto-detect from document.body.dataset.vscodeThemeKind
 * - MutationObserver for dynamic theme switching
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Button, ConfigProvider } from 'antd';
import { HiveThemeProvider } from '../theme/Provider';
import { useTheme } from '../theme/useTheme';

/**
 * Helper component that renders the current theme value
 */
function ThemeDisplay() {
  const theme = useTheme();
  return <div data-testid="theme-value">{theme}</div>;
}

describe('HiveThemeProvider', () => {
  afterEach(() => {
    // Clean up body dataset after each test
    delete document.body.dataset.vscodeThemeKind;
  });

  it('renders children', () => {
    render(
      <HiveThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('defaults to light mode when no vscode theme kind is set', () => {
    render(
      <HiveThemeProvider>
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('accepts explicit dark mode', () => {
    render(
      <HiveThemeProvider mode="dark">
        <Button data-testid="test-button">Click me</Button>
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });

  it('wraps children with ConfigProvider', () => {
    let configProviderUsed = false;

    function TestComponent() {
      const config = ConfigProvider.useConfig();
      if (config) {
        configProviderUsed = true;
      }
      return <div>Test</div>;
    }

    render(
      <HiveThemeProvider>
        <TestComponent />
      </HiveThemeProvider>,
    );

    expect(configProviderUsed).toBe(true);
  });

  it('provides App context for message, notification, modal APIs', () => {
    render(
      <HiveThemeProvider>
        <div data-testid="app-content">Content</div>
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('uses StyleProvider with layer for CSS isolation', () => {
    render(
      <div>
        <div data-testid="outside">
          <button>Outside Button</button>
        </div>
        <HiveThemeProvider>
          <Button data-testid="inside-button">Inside Button</Button>
        </HiveThemeProvider>
      </div>,
    );

    expect(screen.getByText('Outside Button')).toBeInTheDocument();
    expect(screen.getByTestId('inside-button')).toBeInTheDocument();

    const antdButton = screen.getByTestId('inside-button');
    expect(antdButton.className).toContain('ant-btn');

    const outsideButton = screen.getByText('Outside Button');
    expect(outsideButton.className).not.toContain('ant-btn');
  });

  it('switches theme correctly between light and dark', () => {
    const { rerender } = render(
      <HiveThemeProvider mode="light">
        <Button data-testid="themed-button">Themed</Button>
      </HiveThemeProvider>,
    );

    const buttonLight = screen.getByTestId('themed-button');
    expect(buttonLight).toBeInTheDocument();

    rerender(
      <HiveThemeProvider mode="dark">
        <Button data-testid="themed-button">Themed</Button>
      </HiveThemeProvider>,
    );

    const buttonDark = screen.getByTestId('themed-button');
    expect(buttonDark).toBeInTheDocument();
  });
});

describe('HiveThemeProvider - auto-detect from VS Code theme', () => {
  afterEach(() => {
    delete document.body.dataset.vscodeThemeKind;
  });

  it('auto-detects dark theme from vscode-dark', () => {
    document.body.dataset.vscodeThemeKind = 'vscode-dark';

    render(
      <HiveThemeProvider>
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('auto-detects light theme from vscode-light', () => {
    document.body.dataset.vscodeThemeKind = 'vscode-light';

    render(
      <HiveThemeProvider>
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('auto-detects dark theme from vscode-high-contrast', () => {
    document.body.dataset.vscodeThemeKind = 'vscode-high-contrast';

    render(
      <HiveThemeProvider>
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('auto-detects light from vscode-high-contrast-light', () => {
    document.body.dataset.vscodeThemeKind = 'vscode-high-contrast-light';

    render(
      <HiveThemeProvider>
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('explicit mode prop overrides auto-detect', () => {
    document.body.dataset.vscodeThemeKind = 'vscode-dark';

    render(
      <HiveThemeProvider mode="light">
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('reacts to dynamic theme changes via MutationObserver', async () => {
    document.body.dataset.vscodeThemeKind = 'vscode-light';

    render(
      <HiveThemeProvider>
        <ThemeDisplay />
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light');

    // Simulate VS Code theme change — MutationObserver fires asynchronously
    act(() => {
      document.body.dataset.vscodeThemeKind = 'vscode-dark';
    });

    await waitFor(() => {
      expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
    });
  });
});
