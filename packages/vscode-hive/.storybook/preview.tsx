import type { Preview } from '@storybook/react-vite';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

// CRITICAL: Ensure React is properly initialized for Storybook 10 + React 19
// This prevents "resolveDispatcher() is null" errors
import React from 'react';

import { HiveThemeProvider } from '../src/webview/theme/Provider';
import '../src/webview/styles.css';

// VS Code webview-specific viewports
const vscodeViewports = {
  sidePanel: {
    name: 'VS Code Side Panel',
    styles: {
      width: '350px',
      height: '600px',
    },
  },
  panelNarrow: {
    name: 'VS Code Panel (Narrow)',
    styles: {
      width: '500px',
      height: '400px',
    },
  },
  panelWide: {
    name: 'VS Code Panel (Wide)',
    styles: {
      width: '800px',
      height: '400px',
    },
  },
  fullEditor: {
    name: 'VS Code Full Editor',
    styles: {
      width: '1200px',
      height: '800px',
    },
  },
};

const preview: Preview = {
  parameters: {
    // Configure viewport addon with VS Code-relevant sizes
    viewport: {
      options: {
        ...MINIMAL_VIEWPORTS,
        ...vscodeViewports,
      },
    },

    // Configure docs addon
    docs: {
      toc: true,
    },

    // Configure backgrounds to simulate VS Code themes
    backgrounds: {
      default: 'vscode-dark',
      values: [
        {
          name: 'vscode-dark',
          value: '#1e1e1e',
        },
        {
          name: 'vscode-light',
          value: '#ffffff',
        },
        {
          name: 'vscode-high-contrast',
          value: '#000000',
        },
      ],
    },

    // Configure controls (built-in)
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  // Global decorators - CRITICAL: Wrap in StrictMode for React 19 hook support
  decorators: [
    // Wrap all stories in HiveThemeProvider for antd styling with CSS isolation
    (Story, context) => {
      // Map global theme to HiveThemeProvider mode
      const themeMode = context.globals.theme === 'light' ? 'light' : 'dark';
      
      return (
        <React.StrictMode>
          <HiveThemeProvider mode={themeMode}>
            <div
              style={{
                fontFamily: 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                fontSize: 'var(--vscode-font-size, 13px)',
                color: 'var(--vscode-foreground, #cccccc)',
                backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
                padding: '16px',
                minHeight: '100vh',
              }}
            >
              <Story />
            </div>
          </HiveThemeProvider>
        </React.StrictMode>
      );
    },
  ],

  // Global theme control in toolbar
  globalTypes: {
    theme: {
      description: 'Theme mode',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Default theme
  initialGlobals: {
    theme: 'light',
  },
};

export default preview;
