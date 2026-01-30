import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/webview/**/*.test.ts', 'src/webview/**/*.test.tsx'],
    globals: true,
    setupFiles: ['./src/webview/__tests__/setup.ts'],
    deps: {
      // Include shiki in optimization so it can be properly resolved
      optimizer: {
        web: {
          include: ['shiki'],
        },
      },
    },
  },
  resolve: {
    alias: {
      'hive-core': resolve(__dirname, '../hive-core/src'),
    },
  },
  // Ensure shiki can be properly resolved
  optimizeDeps: {
    include: ['shiki'],
  },
});
