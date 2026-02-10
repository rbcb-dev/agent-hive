import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');

const config: StorybookConfig = {
  stories: [
    '../src/webview/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {
      // Use Storybook's built-in Vite config instead of custom viteFinal
      // This prevents discovery issues with story files
    },
  },

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    'storybook/viewport',
  ],

  docs: {
    autodocs: 'tag', // Auto-generate docs from stories
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },

  viteFinal: async (config) => {
    // Minimal Vite customization - let Storybook handle most config
    return {
      ...config,
      // Only set critical options that fix known issues
      root: packageRoot,
      
      server: {
        ...config.server,
        watch: {
          ...config.server?.watch,
          usePolling: true,
          interval: 1000,
          ignored: ['**/node_modules/**', '**/.git/**'],
        },
      },

      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          'hive-core': resolve(__dirname, '../../hive-core/src'),
        },
      },

      build: {
        ...config.build,
        // Increase chunk size warning limit for Storybook builds
        // Storybook's iframe.js (~1.1MB) and axe.js (~580KB) are expected to be large
        chunkSizeWarningLimit: 1200,
      },

      // Don't mess with optimizeDeps - let Storybook handle it
      // Pre-bundling is fine for Storybook, it's development mode
    };
  },
};

export default config;
