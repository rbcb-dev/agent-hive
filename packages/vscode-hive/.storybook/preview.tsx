import type { Preview } from '@storybook/react-vite';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

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

  // Global decorators
  decorators: [
    // Decorator to wrap stories in VS Code-like styling context
    (Story) => (
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
    ),
  ],

  // Global args that can be overridden per-story
  globalTypes: {
    theme: {
      description: 'VS Code color theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark (Default)' },
          { value: 'light', title: 'Light' },
          { value: 'high-contrast', title: 'High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
