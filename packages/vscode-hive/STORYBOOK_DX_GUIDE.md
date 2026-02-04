# Storybook Development Experience Guide

## ✅ Zero Configuration Storybook Setup

### Quick Start

```bash
cd packages/vscode-hive
npm run storybook
```

That's it! Storybook will:
1. ✅ Build the webview if sources changed
2. ✅ Build hive-core if dependencies changed
3. ✅ Start Storybook on http://localhost:6006
4. ✅ Watch files for changes
5. ✅ Hot reload on save

### What Was Improved

#### Before
- Had to manually run `npm run build:webview` before `storybook`
- No auto-rebuilding of dependencies
- Confusing error messages if files weren't built
- DX friction when dependencies changed

#### After
- Single `npm run storybook` command does everything
- Smart build detection (only rebuilds when needed)
- Automatic dependency graph handling
- Clear colored console output showing what's being built

## Two Development Modes

### 1. Full Build + Storybook (Default)
```bash
npm run storybook
```

**Use this when:**
- Starting fresh
- You changed code in hive-core
- You changed webview components
- You're not sure if things are built

**What it does:**
1. Checks if webview sources are newer than dist → rebuilds if needed
2. Checks if hive-core sources are newer than dist → rebuilds if needed
3. Starts Storybook with hot reload

**Time:** ~3-5 seconds setup + 2.7s Storybook startup = ~6-8s total

### 2. Fast Storybook Only
```bash
npm run storybook:dev
```

**Use this when:**
- Webview is already built
- Dependencies haven't changed
- You just want to run Storybook
- You're debugging something quickly

**What it does:**
- Skips all build checks
- Starts Storybook immediately

**Time:** ~2.7s Storybook startup only

## Build Scripts Reference

```bash
# Full Storybook with smart rebuilding (RECOMMENDED)
npm run storybook

# Just Storybook, no rebuilding
npm run storybook:dev

# Build webview only
npm run build:webview

# Build extension only  
npm run build

# Build everything
npm run build:webview && npm run build

# Watch files and rebuild webview on changes
npm run watch

# Run tests
npm run test:webview
npm run test:webview:watch

# Full local test suite
npm run test:local
npm run test:local:quick
```

## Under the Hood: Build Detection

The `scripts/build-for-storybook.mjs` script uses **file modification timestamps** to detect when rebuilding is necessary:

### Webview Build Detection
```
Checks: src/webview/App.tsx, src/webview/main.tsx
vs.
Dist: src/webview/__compiled__/
```

If any source file is newer than the dist → rebuilds

### Hive-Core Build Detection
```
Checks: ../../hive-core/src/* (all files)
vs.
Dist: ../../hive-core/dist/index.js
```

If any source file is newer than dist → rebuilds

**Console output shows the decision:**
```
[CHECK] Checking webview sources...
[SKIP] Webview already built

[CHECK] Checking hive-core sources...
[BUILD] Building hive-core dependency...
```

## Workflow Tips

### Scenario 1: Initial Setup
```bash
npm run storybook
# Full build + Storybook (first time is slowest)
```

### Scenario 2: Editing a Story
```bash
# File: src/webview/components/Button.stories.tsx
npm run storybook:dev  # Just Storybook, no rebuild needed
# Edit file and save → auto hot-reload
```

### Scenario 3: Changing a Component
```bash
# File: src/webview/components/Button.tsx
npm run storybook:dev  # Just Storybook
# Edit file → Vite auto-rebuilds webview → hot-reload
```

### Scenario 4: Changing Dependency (hive-core)
```bash
# File: ../../hive-core/src/some-file.ts
npm run storybook  # Full build script (detects hive-core change)
# Or you can be explicit:
npm run build && npm run storybook:dev
```

### Scenario 5: Continuous Development
```bash
# Terminal 1: Watch and rebuild
npm run watch

# Terminal 2: Run Storybook
npm run storybook:dev

# Now when you save files:
# - Terminal 1 rebuilds webview
# - Terminal 2 hot-reloads Storybook
```

## Troubleshooting DX Issues

### Problem: "Build failures" when starting Storybook
**Solution:** The build script is catching these early
```bash
# Check the actual error output
# Usually missing dependencies or TypeScript errors
npm run build:webview  # Rebuild webview only
```

### Problem: Storybook not reloading after changes
**Solution:** Vite should auto-detect changes
```bash
# If not working:
npm run storybook:dev  # Restart without rebuilding
# Still not working? Kill process and restart
```

### Problem: "hive-core not found" error
**Solution:** Make sure hive-core is built
```bash
cd ../../hive-core && npm run build
cd ../vscode-hive && npm run storybook:dev
```

## Build Architecture

```
User runs: npm run storybook
    ↓
scripts/build-for-storybook.mjs
    ├─ Check webview sources vs dist
    │  └─ If needed: npm run build:webview
    │     └─ Vite compiles TSX → JS
    │
    ├─ Check hive-core sources vs dist
    │  └─ If needed: npm run build (in hive-core/)
    │     └─ TypeScript compiles src → dist
    │
    └─ npm run storybook:dev
       └─ Storybook starts on :6006
          ├─ Loads webview from dist/
          ├─ Loads hive-core from dist/
          └─ Watches for file changes → hot reload
```

## Environment Variables

```bash
# Used automatically
CHOKIDAR_USEPOLLING=true      # Force polling (no inotify limits)
VITE_POLL=true                # Vite polling mode

# You shouldn't need to set these manually
# They're included in the storybook:dev script
```

## Performance Notes

| Operation | Time | Notes |
|-----------|------|-------|
| Initial setup | ~6-8s | Builds all, starts Storybook |
| Subsequent runs | ~2.7s | Skip builds if nothing changed |
| File change detection | ~1-2s | Polling mode (reliable) |
| Hot reload | Instant | Vite's dev server |

## Next Steps

- **Write stories:** Create `*.stories.tsx` files
- **Test stories:** `npm run test:storybook`
- **Build Storybook:** `npm run build-storybook`
- **Deploy:** Push `storybook-static/` or use GitHub Pages

## References

- [Vite Dev Server](https://vitejs.dev/guide/ssr.html)
- [Storybook CLI](https://storybook.js.org/docs/react/cli)
- [Node.js File System](https://nodejs.org/api/fs.html)
