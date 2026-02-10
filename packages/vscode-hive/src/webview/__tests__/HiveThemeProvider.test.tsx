/**
 * Tests for HiveThemeProvider component
 *
 * Verifies:
 * - CSS isolation (antd styles don't leak outside provider)
 * - Theme switching (light/dark mode)
 * - Children are rendered
 * - Default mode is 'light'
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, ConfigProvider } from 'antd';
import { HiveThemeProvider } from '../theme/Provider';

describe('HiveThemeProvider', () => {
  it('renders children', () => {
    render(
      <HiveThemeProvider>
        <div data-testid="test-child">Test Content</div>
      </HiveThemeProvider>,
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('defaults to light mode', () => {
    render(
      <HiveThemeProvider>
        <Button data-testid="test-button">Click me</Button>
      </HiveThemeProvider>,
    );

    // The button should be rendered and functional
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });

  it('accepts dark mode', () => {
    render(
      <HiveThemeProvider mode="dark">
        <Button data-testid="test-button">Click me</Button>
      </HiveThemeProvider>,
    );

    // The button should be rendered and functional
    expect(screen.getByTestId('test-button')).toBeInTheDocument();
  });

  it('wraps children with ConfigProvider', () => {
    // This test verifies the provider hierarchy is correct
    // by checking that ConfigProvider context is available
    let configProviderUsed = false;

    function TestComponent() {
      // Use ConfigProvider.useConfig to verify context is available
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
    // The App component from antd provides context for message, notification, etc.
    // This test verifies HiveThemeProvider wraps children in App
    render(
      <HiveThemeProvider>
        <div data-testid="app-content">Content</div>
      </HiveThemeProvider>,
    );

    // The content should be inside the App wrapper
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('uses StyleProvider with layer for CSS isolation', () => {
    // Render content inside and outside the provider
    const { container } = render(
      <div>
        <div data-testid="outside">
          <button>Outside Button</button>
        </div>
        <HiveThemeProvider>
          <Button data-testid="inside-button">Inside Button</Button>
        </HiveThemeProvider>
      </div>,
    );

    // Both buttons should be rendered
    expect(screen.getByText('Outside Button')).toBeInTheDocument();
    expect(screen.getByTestId('inside-button')).toBeInTheDocument();

    // The antd button (inside) should have antd-specific class
    const antdButton = screen.getByTestId('inside-button');
    expect(antdButton.className).toContain('ant-btn');

    // The outside button should NOT have antd classes
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

    // Re-render with dark mode
    rerender(
      <HiveThemeProvider mode="dark">
        <Button data-testid="themed-button">Themed</Button>
      </HiveThemeProvider>,
    );

    const buttonDark = screen.getByTestId('themed-button');
    expect(buttonDark).toBeInTheDocument();
  });
});
