import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/webview/**/*.test.ts', 'src/webview/**/*.test.tsx', 'src/shared/**/*.test.ts', 'src/__tests__/**/*.test.ts'],
    globals: true,
    setupFiles: ['./src/webview/__tests__/setup.ts'],
    testTimeout: 15000, // Increase timeout for antd component first-render overhead
    deps: {
      // Include shiki in optimization so it can be properly resolved
      optimizer: {
        web: {
          include: ['shiki'],
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.storybook/',
        '**/*.stories.tsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        'dist/',
        'scripts/',
      ],
      reportsDirectory: './coverage',
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
      // Mock vscode module for extension-side unit tests
      vscode: resolve(__dirname, 'src/__tests__/__mocks__/vscode.ts'),
    },
  },
  // Ensure shiki can be properly resolved
  optimizeDeps: {
    include: ['shiki'],
  },
});
