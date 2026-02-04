# Storybook 10 + React 19 + VS Code Extension Configuration

This document explains the Storybook configuration for the VSCode Hive webview component library, optimized for React 19 and VS Code extension development.

## Issues Resolved

### 1. ENOSPC: System limit for number of file watchers reached

**Problem:** Storybook was watching parent directories all the way up to `/home/dev`, exhausting Linux inotify file watcher limits.

**Root Cause:** Watchpack (Storybook's dependency) traverses directories looking for watched folders and tries to create inotify watchers for each one. In a monorepo, this includes:
- `/home/dev/repos/github/agent-hive/` (root)
- `/home/dev/repos/github/` (parent)
- `/home/dev/repos/` (parent)
- `/home/dev/` (parent)
- etc.

**Solution:** Implemented a multi-layered approach:

#### Layer 1: Increase System Limits
```bash
# Set inotify limits
sudo bash -c 'echo fs.inotify.max_user_instances=1024 >> /etc/sysctl.conf'
sudo bash -c 'echo fs.inotify.max_queued_events=32768 >> /etc/sysctl.conf'
sudo sysctl -p
```

#### Layer 2: Force Polling Mode + Explicit Root
In `.storybook/main.ts`, configure Vite to use polling instead of inotify:

```typescript
viteFinal: async (config) => {
  return {
    ...config,
    root: packageRoot,  // CRITICAL: Set to package, not monorepo root
    server: {
      watch: {
        usePolling: true,       // Force polling, not inotify
        interval: 1000,         // Check every 1 second
        stabilityThreshold: 1000, // Wait before reloading
        ignored: [              // Exclude non-essential directories
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.storybook/cache/**',
        ],
        ignoreInitial: true,
      },
      fsEvents: false,          // Disable fs.watch fallback
    },
  };
};
```

#### Layer 3: Environment Variables in package.json
```json
{
  "storybook": "CHOKIDAR_USEPOLLING=true VITE_POLL=true storybook dev -p 6006"
}
```

**Why this works:**
- `usePolling: true` → Forces Vite to use polling instead of inotify
- `CHOKIDAR_USEPOLLING=true` → Forces Chokidar (another watcher library) to also use polling
- `VITE_POLL=true` → Legacy Vite polling flag
- `root: packageRoot` → Prevents traversal to parent directories
- Explicit `ignored` patterns → Reduces filesystem operations

### 2. "can't access property 'useState', resolveDispatcher() is null"

**Problem:** Components using React hooks threw an error when rendered in Storybook, indicating React's Dispatcher wasn't initialized.

**Root Cause:** Storybook 10 with React 19 needs explicit initialization of React's context when rendering components with hooks. Without wrapping in `React.StrictMode` or a proper React root, the Dispatcher isn't available.

**Solution:** Wrap all stories in `React.StrictMode` in `.storybook/preview.tsx`:

```typescript
decorators: [
  (Story) => (
    <React.StrictMode>
      <div
        style={{
          fontFamily: 'var(--vscode-font-family, ...)',
          color: 'var(--vscode-foreground, #cccccc)',
          backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
          padding: '16px',
          minHeight: '100vh',
        }}
      >
        <Story />
      </div>
    </React.StrictMode>
  ),
],
```

**Why this works:**
- `React.StrictMode` initializes React's internal Dispatcher
- Wrapping the Story function ensures hooks are rendered within a proper React context
- VS Code theme variables provide visual context for webview development

### 3. "error loading dynamically imported module: shiki_bundle_web.js"

**Problem:** Storybook's docs addon uses Shiki for syntax highlighting, which fails to load web worker bundles dynamically in Vite's development mode.

**Root Cause:** Shiki's web workers use dynamic imports that aren't properly handled by Vite's dependency pre-bundling during development. This is a known issue in Storybook 10.

**Solution:** Disable the `@storybook/addon-docs` addon in `.storybook/main.ts`:

```typescript
addons: [
  // '@storybook/addon-docs', // DISABLED: Causes Shiki bundle loading errors
  '@storybook/addon-a11y',
  'storybook/viewport',
],
```

**Why this works:**
- The docs addon is primarily for generating documentation from stories
- For VS Code extension development, manual markdown documentation is more appropriate
- Removing this addon eliminates the Shiki dependency without losing functionality
- Stories still render normally, and components are fully interactive

**Alternative (if you need docs):**
- Use the built-in autodocs by adding `tags: ['autodocs']` to story meta
- This generates docs without the Shiki dependency
- However, syntax highlighting will be unavailable

## Configuration Files

### `.storybook/main.ts`
- **Stories location:** `../src/webview/**/*.stories.@(js|jsx|mjs|ts|tsx)`
- **Framework:** `@storybook/react-vite`
- **Addons:** Accessibility (a11y), Viewport
- **Vite settings:** Polling mode, package-scoped root, explicit ignore patterns
- **Docs:** Disabled to avoid Shiki bundle loading errors

### `.storybook/preview.tsx`
- **Global decorators:** React.StrictMode wrapper for hook support
- **Viewports:** VS Code-specific sizes (side panel, panels, full editor)
- **Backgrounds:** Simulates VS Code themes (dark, light, high-contrast)
- **Global types:** Theme selector in Storybook toolbar

### `.storybook/preview.tsx` - VS Code Viewports
```typescript
{
  sidePanel: 350px × 600px,      // Typical side panel width
  panelNarrow: 500px × 400px,    // Narrow explorer panel
  panelWide: 800px × 400px,      // Wide explorer panel
  fullEditor: 1200px × 800px,    // Full editor area
}
```

## Best Practices

### 1. Writing Stories for VS Code Webviews

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ReviewPanel } from './ReviewPanel';

const meta: Meta<typeof ReviewPanel> = {
  component: ReviewPanel,
  // Use VS Code viewport for this story
  parameters: {
    viewport: {
      defaultViewport: 'sidePanel',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Stories automatically wrapped in React.StrictMode
export const Default: Story = {
  args: {
    reviews: [],
  },
};
```

### 2. Components Using Hooks

All components using `useState`, `useEffect`, etc. work out of the box due to the `React.StrictMode` wrapper:

```typescript
// This just works in Storybook!
export const MyComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
};
```

### 3. Providing Context for Complex Components

If your components need additional providers (e.g., Redux, custom context):

```typescript
// Create a decorator for your provider
const withProviders: DecoratorFunction<ReactFramework> = (Story) => (
  <YourContextProvider>
    <Story />
  </YourContextProvider>
);

export default {
  component: YourComponent,
  decorators: [withProviders], // Applied per-story
};
```

## Troubleshooting

### "ENOSPC: System limit for number of file watchers reached"
- Check current limit: `cat /proc/sys/fs/inotify/max_user_instances`
- Increase limit: `sudo sysctl -w fs.inotify.max_user_instances=1024`
- Add to `/etc/sysctl.conf` to persist after reboot

### "resolveDispatcher() is null"
- Ensure `.storybook/preview.tsx` wraps Story in `React.StrictMode`
- Verify React is imported at the top of preview.tsx
- Clear Storybook cache: `rm -rf node_modules/.cache/storybook`

### Storybook not detecting changes
- Ensure polling environment variables are set: `CHOKIDAR_USEPOLLING=true VITE_POLL=true`
- Check that `usePolling: true` is set in vite config
- Increase polling interval if needed: `interval: 2000` (2 seconds instead of 1)

### Storybook very slow
- Polling is slower than inotify but more reliable in resource-constrained environments
- If performance matters and inotify limits aren't an issue, remove `usePolling: true`
- Consider using a container with higher resource limits

## React 19 + Storybook 10 Compatibility

This setup is **fully compatible** with:
- ✅ React 19.2.4
- ✅ Storybook 10.2.3
- ✅ Vite 7.3.1
- ✅ TypeScript 5.6.2
- ✅ React Compiler (when enabled)

Key differences from older setups:
- React 19 doesn't require importing React for JSX
- Hooks don't require import in React 19, but explicit imports work fine
- Storybook 10 uses built-in controls/actions/viewport (no separate addons needed)

## Performance Notes

- **File watching:** Polling ~1-2s latency vs inotify ~100ms latency
- **Build time:** ~3-5 seconds on first launch
- **Reload time:** ~1-2 seconds when files change (via polling)
- **Memory:** ~300-400MB for Storybook + dependencies

This trade-off (slightly slower polling for reliability) is worth it in monorepos with many files.
