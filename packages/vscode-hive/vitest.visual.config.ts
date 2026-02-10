import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      viewport: {
        width: 1280,
        height: 720,
      },
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            threshold: 0.2,
          },
          resolveScreenshotPath: ({ arg, ext }) => {
            // Use story-id naming convention: <kind>-<component>--<story>.png
            // The arg is expected to be passed as the screenshot name in the test
            return resolve(
              __dirname,
              '__image_snapshots__',
              `${arg}${ext}`,
            );
          },
        },
      },
    },
    include: ['src/webview/__tests__/storybook-visual.spec.ts'],
    globals: true,
    setupFiles: ['./src/webview/__tests__/storybook-visual-setup.ts'],
    testTimeout: 60000, // Browser rendering is slower than jsdom
  },
  resolve: {
    alias: {
      'hive-core': resolve(__dirname, '../hive-core/src'),
      '@vscode/codicons/dist/codicon.css': resolve(
        __dirname,
        'src/webview/__tests__/__mocks__/codicon.css',
      ),
    },
  },
});
