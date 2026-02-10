import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/webview/__tests__/storybook.spec.ts'],
    globals: true,
    setupFiles: ['./src/webview/__tests__/storybook-setup.ts'],
    testTimeout: 30000, // Stories with play functions and image snapshots need more time
    deps: {
      optimizer: {
        web: {
          include: ['shiki'],
        },
      },
    },
    // Mock CSS imports to avoid resolution errors in tests
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
  resolve: {
    alias: {
      'hive-core': resolve(__dirname, '../hive-core/src'),
      // Mock @vscode/codicons CSS import for tests
      '@vscode/codicons/dist/codicon.css': resolve(__dirname, 'src/webview/__tests__/__mocks__/codicon.css'),
    },
  },
  optimizeDeps: {
    include: ['shiki'],
  },
});
