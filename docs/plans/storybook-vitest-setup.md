# Storybook 10 + Vitest Complete Setup for React 19

> **For Claude:** Use hive_skill:executing-plans to implement this plan task-by-task.

**Goal:** Fix Storybook 10 story discovery issue and add Vitest for component testing, both properly configured for React 19 + Vite.

**Architecture:**
- Fix Storybook by using `.storybook/preview.ts` (not `.tsx`) to avoid JSX issues in preview
- Add Vitest with `@vitest/ui` for visual test runner (complements Storybook)
- Configure both to share Vite config
- Use single `npm run test` for Vitest, `npm run storybook` for visual component browser

**Tech Stack:** React 19.2.4, Storybook 10.2.3, Vitest latest, Vite 7.3.1, TypeScript 5.6.2

---

## Critical Issues to Fix

1. **Storybook story discovery failing** - `.storybook/preview.tsx` causes JSX parsing issues in story loader
2. **Missing Vitest setup** - No testing framework configured
3. **DX gap** - No visual test UI, unclear testing strategy

---

## Task 1: Fix Storybook Preview Configuration

**Root Cause:** Storybook's TypeScript loader can't parse JSX in `.tsx` files when loading preview. Solution: use `.ts` with plain JavaScript decorators instead of JSX.

**Files:**
- Delete: `.storybook/preview.tsx`
- Create: `.storybook/preview.ts`

**Implementation:**

Replace `.storybook/preview.tsx` with new `.storybook/preview.ts`:

```typescript
import type { Preview } from '@storybook/react';
import React from 'react';
import ReactDOM from 'react-dom';

// Import your styles
import '../src/webview/styles.css';

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        sidePanel: {
          name: 'VS Code Side Panel',
          styles: { width: '350px', height: '600px' },
        },
        panelNarrow: {
          name: 'VS Code Panel (Narrow)',
          styles: { width: '500px', height: '400px' },
        },
        panelWide: {
          name: 'VS Code Panel (Wide)',
          styles: { width: '800px', height: '400px' },
        },
        fullEditor: {
          name: 'VS Code Full Editor',
          styles: { width: '1200px', height: '800px' },
        },
      },
    },
    backgrounds: {
      default: 'vscode-dark',
      values: [
        { name: 'vscode-dark', value: '#1e1e1e' },
        { name: 'vscode-light', value: '#ffffff' },
        { name: 'vscode-high-contrast', value: '#000000' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story: any) => {
      const container = document.createElement('div');
      container.style.fontFamily = 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';
      container.style.fontSize = 'var(--vscode-font-size, 13px)';
      container.style.color = 'var(--vscode-foreground, #cccccc)';
      container.style.backgroundColor = 'var(--vscode-editor-background, #1e1e1e)';
      container.style.padding = '16px';
      container.style.minHeight = '100vh';
      
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(React.StrictMode, null, React.createElement(Story)));
      
      return container;
    },
  ],
};

export default preview;
```

**Expected Outcome:**
- Storybook starts without JSX parsing errors
- Stories appear in sidebar
- Components render in preview

---

## Task 2: Add Vitest Configuration

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add scripts + dependencies)

**Step 1: Install dependencies**

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 happy-dom @testing-library/react @testing-library/dom @testing-library/user-event
```

**Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: [],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.storybook/',
        '**/*.stories.tsx',
        'dist/',
      ],
    },
  },
  
  resolve: {
    alias: {
      'hive-core': resolve(__dirname, '../../hive-core/src'),
    },
  },
});
```

**Step 3: Update package.json scripts**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

**Expected Outcome:**
- `npm run test` starts Vitest watcher
- `npm run test:ui` opens visual UI at :51204
- Tests can be written and run

---

## Task 3: Create Example Component Test

**Files:**
- Create: `src/webview/__tests__/App.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { App } from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
```

**Expected Outcome:**
- Test file is discovered and runs
- `npm run test:run` shows 1 passing test

---

## Summary

After these tasks:

✅ **Storybook** working with story discovery
✅ **Vitest** configured with visual UI
✅ **Both** share Vite configuration
✅ **React 19** properly initialized in both test environments
✅ **Improved DX** - clear separation of concerns (Storybook = UI, Vitest = logic)

**To start:**
```bash
npm run storybook        # Visual component browser
npm run test:ui         # Visual test runner
npm run test:run        # CI mode - run tests once
```

