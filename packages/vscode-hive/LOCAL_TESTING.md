# Local Testing Guide for VS Code Extension

This guide covers how to test the Hive VS Code extension locally before distribution.

## Quick Start

```bash
cd packages/vscode-hive

# One-command full test (recommended)
bun run test:local

# Or quick test (skip verification)
bun run test:local:quick
```

## Available Commands

### `bun run test:local` (Recommended)
**Full end-to-end local testing**

Runs all checks in sequence:
1. Cleans previous builds
2. Builds webview (React + CSS)
3. Runs webview unit tests (71 tests)
4. Builds extension binary
5. Packages VSIX extension
6. Verifies all artifacts

**Use when:** About to test in VS Code or prepare for distribution

```bash
bun run test:local
```

**Output example:**
```
✓ 71 webview tests pass
✓ Extension builds successfully
✓ VSIX packaged (286KB)
✓ All 17 verification checks pass
✅ Build verification PASSED - Ready for testing!
```

---

### `bun run test:local:quick`
**Fast test without full verification**

Runs:
1. Webview tests
2. Builds extension and packages VSIX
- Skips comprehensive artifact verification
- ~2 min faster than full test
- Good for iterative development

**Use when:** Iterating on code and need quick feedback

```bash
bun run test:local:quick
```

---

### `bun run test:local:verify`
**Standalone build verification**

Validates the built artifacts without rebuilding:
- Extension JS exists and is >100KB
- Webview HTML/CSS/JS bundles exist
- VSIX package is valid (>100KB)
- Assets are properly referenced
- No empty files
- 17 total checks

**Use when:** Want to verify an existing build without rebuilding

```bash
bun run test:local:verify
```

---

### `bun run test:webview`
**Unit tests only**

Runs React component tests via Vitest with jsdom:
- 71 tests across 9 files
- Covers all webview components
- Tests accessibility, interactions, messaging

**Use when:** Only testing React components (no full build)

```bash
bun run test:webview
```

**Test files:**
- `src/webview/__tests__/App.test.tsx` - Main layout
- `src/webview/__tests__/ThreadPanel.test.tsx` - Thread viewing
- `src/webview/__tests__/DiffViewer.test.tsx` - Code diffs
- `src/webview/__tests__/FileTree.test.tsx` - File navigation
- `src/webview/__tests__/ThreadList.test.tsx` - Thread list
- `src/webview/__tests__/ReviewSummary.test.tsx` - Review submission
- `src/webview/__tests__/ScopeTabs.test.tsx` - Scope navigation
- More in `src/webview/__tests__/`

---

### `bun run test:webview:watch`
**Unit tests in watch mode**

Reruns tests automatically when files change:

```bash
bun run test:webview:watch
```

**Use when:** Developing components and want live test feedback

---

### `bun run build:webview`
**Build only the webview**

Compiles React components, CSS, and bundles assets:
- Output: `dist/webview/`
- Includes `index.html`, `assets/index.js`, `assets/index.css`

```bash
bun run build:webview
```

---

### `bun run build`
**Build complete extension**

Bundles:
1. Extension (`dist/extension.js`)
2. Webview (if not already built)
3. Packages VSIX (`vscode-hive.vsix`)

```bash
bun run build
```

---

### `bun run clean`
**Remove build artifacts**

Deletes:
- `dist/` directory
- `vscode-hive.vsix` file

```bash
bun run clean
```

Useful for clean builds or freeing space.

---

## Installation After Testing

After `test:local` or `test:local:quick` completes successfully:

### On Linux/Mac (from development machine)
```bash
code --install-extension packages/vscode-hive/vscode-hive.vsix
```

### On Windows (via WSL to Windows VS Code)
```bash
# From WSL
code --install-extension /path/to/packages/vscode-hive/vscode-hive.vsix
```

Or install manually:
1. Open VS Code
2. Extensions panel (Cmd/Ctrl+Shift+X)
3. Click "Install from VSIX"
4. Select `packages/vscode-hive/vscode-hive.vsix`

---

## Quick Test Checklist

After running `test:local`, verify:

```bash
# 1. Reload VS Code window (Cmd+R or Cmd+Shift+P → reload)

# 2. Check Hive sidebar appears
# - Should show "Features" view
# - Click Hive icon in Activity Bar

# 3. Create a test feature (Command Palette → "Hive: New Feature")

# 4. Open Review panel
# - Sidebar → Right-click feature → "Open Review"
# - Or Command Palette → "Hive: Open Review"

# 5. Check webview loads
# - Panel should show review UI
# - No 403 errors in console (Help → Toggle Developer Tools)

# 6. Test interactions
# - Click scope tabs (Feature/Task/Context/Plan/Code)
# - Select a file from the list
# - No console errors
```

---

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
# Reinstall dependencies
bun install
bun run test:local
```

### Build verification fails
```bash
# Check specific issue
bun run test:local:verify

# Common fixes:
bun run clean
bun run build:webview
bun run build
bun run test:local:verify
```

### VSIX not created
```bash
# Check esbuild/vsce are installed
bun install

# Try manual build
bun run build
ls -lh vscode-hive.vsix  # Should exist and >100KB
```

### Webview shows blank/404 in extension
```bash
# 1. Verify webview files exist
ls -R dist/webview/

# 2. Rebuild webview
bun run clean
bun run build:webview
bun run build

# 3. Reinstall extension
code --install-extension --force packages/vscode-hive/vscode-hive.vsix
```

### "Extension failed to activate"
Check Extension Host log:
1. Command Palette → "Developer: Toggle Developer Tools"
2. Click "Extension Host" tab
3. Look for error messages
4. Common causes:
   - Old extension installed (uninstall first)
   - Wrong VS Code version (needs 1.100+)
   - Missing dependencies

---

## Environment Details

| Tool | Version | Purpose |
|------|---------|---------|
| bun | 1.3+ | Package manager & test runner |
| Vitest | 1.6 | Unit test runner with jsdom |
| React | 18.3 | Webview framework |
| Vite | 5.4 | Webview bundler |
| esbuild | 0.27 | Extension bundler |
| vsce | 3.7 | VSIX packager |
| VS Code | 1.100+ | Target platform |

---

## Performance Expectations

| Command | Time | Notes |
|---------|------|-------|
| `test:webview` | 2-3s | Unit tests only |
| `build:webview` | 1-2s | Vite bundler |
| `build` | 30-60s | esbuild + vsce |
| `test:local:quick` | 2-3 min | Tests + build + package |
| `test:local` | 2-3 min | + verification checks |

Times may vary based on system performance and first-run overhead.

---

## CI/CD Integration

For automated testing:

```yaml
# Example GitHub Actions
- name: Test Extension
  run: cd packages/vscode-hive && bun run test:local

- name: Upload Artifact
  if: success()
  uses: actions/upload-artifact@v3
  with:
    name: vscode-hive-extension
    path: packages/vscode-hive/vscode-hive.vsix
```

---

## Development Workflow

### During feature development:
```bash
# Watch mode for quick feedback
bun run test:webview:watch
```

### Before committing:
```bash
# Full verification
bun run test:local
```

### Before distribution:
```bash
# Same as above, then:
git tag v1.0.x
git push --tags
# Use vscode-hive.vsix for release
```

---

## Notes

- Tests use **jsdom** environment for browser APIs
- **All 71 tests must pass** before building extension
- **Verification checks 17 build artifacts** for completeness
- VSIX includes all source (for transparency) but not node_modules
- Build outputs are git-ignored (`dist/`, `*.vsix`)

See `package.json` for complete script definitions.
