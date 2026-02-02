import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    '../src/webview/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // viewport, actions, controls are built into Storybook 10 core
    'storybook/viewport',
  ],

  docs: {
    defaultName: 'Documentation',
  },

  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          'hive-core': resolve(__dirname, '../../hive-core/src'),
        },
      },
      server: {
        watch: {
          // Use polling instead of file watchers to avoid ENOSPC errors
          // in environments with limited inotify capacity
          usePolling: true,
          interval: 2000,
          binaryInterval: 2000,
          ignored: ['**/node_modules/**', '**/.git/**'],
        },
        middlewareMode: false,
      },
      build: {
        target: 'esnext',
      },
    };
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
