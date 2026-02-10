# Agent Guidelines for agent-hive

## Overview

**agent-hive** is a context-driven development system for AI coding assistants. It implements a plan-first workflow: Plan → Approve → Execute.

## Build & Test Commands

```bash
# Build all packages via NX (resolves dependency graph, runs lint + format checks, caches results)
# Includes full Storybook pipeline for vscode-hive: vite:build → build-storybook → test-storybook → test-storybook-visual
bun run build

# Legacy sequential build (for CI / upstream compat — no NX, no Storybook pipeline)
bun run build:legacy
bun run build:ci              # Alias for build:legacy

# Development mode (all packages via NX)
bun run dev

# Run all tests via NX
bun run test

# Only build/test projects affected by your changes (faster for incremental work)
bun run build:affected
bun run test:affected
bun run storybook:affected    # Build + test Storybook (functional + visual) for affected projects only

# Release preparation
bun run release:check         # Install, legacy build, and test all packages
bun run release:prepare       # Prepare release
```

**`bun run build` (NX) vs `bun run build:legacy` (CI)**: `bun run build` uses NX to resolve the dependency graph, run lint + format checks first, include the Storybook pipeline (build → test with image snapshots → visual snapshot verification), and cache results. `bun run build:legacy` runs each package sequentially via `--filter` without NX — this is what CI uses and matches upstream `main`. Prefer `bun run build` for local development; `build:legacy` is for CI workflows and release checks.

Worktree dependency note: worktrees are isolated checkouts and do not share the root `node_modules`. If you run tests or builds inside a worktree, run `bun install` there first (or run tests from the repo root that already has dependencies installed).

### NX Commands

```bash
# NX-orchestrated builds and tests (respects dependency graph + caching)
# IMPORTANT: Always use `bun run nx:*` scripts — they include non-interactive flags
bun run nx:build                          # Build all projects via NX (runs lint + format:check first)
bun run nx:test                           # Test all projects via NX
bun run nx:lint                           # Lint all projects
bun run format:check                      # Check formatting (Prettier)
bun run format:write                      # Fix formatting across all packages
bun run nx:typecheck                      # Typecheck all projects

# Storybook (part of vscode-hive build pipeline)
bun run nx:build-storybook                # Build Storybook for all projects that have it
bun run nx:test-storybook                 # Run Storybook tests via Vitest portable stories
bun run nx:test-storybook-visual          # Run visual snapshot tests via Vitest browser mode (Playwright)

# Single project (use env vars prefix)
NX_TUI=false NX_DAEMON=false NX_NO_CLOUD=true bunx nx run hive-core:build
NX_TUI=false NX_DAEMON=false NX_NO_CLOUD=true bunx nx run hive-core:test

# Dependency graph (non-interactive)
bun run nx:graph                          # Export graph to graph.json (non-interactive)
bunx nx show projects                     # List all detected projects

# Cache
bunx nx reset                             # Clear NX cache (.nx/)
```

**⚠️ Non-interactive NX usage (for agents/CI):**

All `bun run nx:*` and `bun run format:*` root scripts already include `NX_TUI=false NX_DAEMON=false NX_NO_CLOUD=true`. When running `bunx nx` directly (e.g., for single-project commands), always prefix with these env vars:

```bash
NX_TUI=false NX_DAEMON=false NX_NO_CLOUD=true bunx nx run hive-core:build
```

**NX integration notes:**

- NX uses existing `package.json` scripts (via `includedScripts`) — it does NOT replace bun/esbuild/vite builds
- `tsconfig.base.json` provides path aliases for cross-package imports (no project references / composite)
- NX caches `build`, `test`, `lint`, `format:check`, `build-storybook`, `test-storybook`, and `test-storybook-visual` targets; cache outputs are in `{projectRoot}/dist`, `{projectRoot}/coverage`, `{projectRoot}/storybook-static`, and `{projectRoot}/__image_snapshots__`
- Build targets have `dependsOn: ["^build", "lint", "format:check"]` — NX runs lint + format checks before building
- For vscode-hive, `build` depends on `vite:build`, `build-storybook`, `test-storybook`, and `test-storybook-visual` — the full Storybook pipeline (functional + visual) runs as part of the build
- `format:check` is cacheable; `format:write` is NOT cacheable (it modifies files)
- ESLint is configured with warnings-only rules (`@nx/enforce-module-boundaries`)
- `.nxignore` excludes `docs/`, `scripts/`, `.github/`, `.hive/` from NX project graph analysis

### Storybook Testing Pipeline

Storybook testing uses **Vitest portable stories** (not `@storybook/test-runner`):

- **Configuration**: `packages/vscode-hive/vitest.storybook.config.ts` (separate from component tests in `vitest.webview.config.ts`)
- **Pattern**: `composeStories()` + `Story.run()` via `@storybook/react-vite` portable stories API
- **Image snapshots**: `vitest-image-snapshot` generates baseline PNGs in `packages/vscode-hive/__image_snapshots__/`; diff outputs (`__diff_output__/`) are gitignored
- **NX pipeline**: `build-storybook` (`@nx/storybook:build`) → `test-storybook` (`@nx/vitest:test`) → `test-storybook-visual` (`@nx/vitest:test`) — chained via `dependsOn`
- **File convention**: Storybook tests use `.spec.ts` extension to avoid collision with component tests (`.test.ts`)

#### Visual Snapshot Testing

Visual regression tests run in **Vitest browser mode** with Playwright (chromium):

- **Configuration**: `packages/vscode-hive/vitest.visual.config.ts` (separate from functional tests)
- **Test file**: `packages/vscode-hive/src/webview/__tests__/storybook-visual.spec.ts`
- **NX target**: `test-storybook-visual` — depends on `build-storybook`, runs as part of `build`
- **Baselines**: PNG files in `packages/vscode-hive/__image_snapshots__/` (committed to git)
- **Updating baselines**: Run with `--update` flag to regenerate:
  ```bash
  NX_TUI=false NX_DAEMON=false NX_NO_CLOUD=true bunx nx run vscode-hive:test-storybook-visual --update
  ```
- **Root script**: `bun run nx:test-storybook-visual` runs visual tests for all projects
- **Affected only**: `bun run storybook:affected` includes visual tests alongside functional tests

### Upstream Merge Strategy

This repo adds NX configuration alongside (not replacing) existing build infrastructure:

- **Root scripts**: Grouped with `//upstream` comments (legacy/CI-compat first) and `//nx` comments (NX-powered after) in `package.json`
- **CI workflows** (`ci.yml`, `release.yml`): Use direct per-package builds, NOT NX — they remain unchanged
- **NX-only files**: `nx.json`, `tsconfig.base.json`, `project.json` files, `.nxignore` — these don't exist in upstream `main`, so zero merge conflict
- **Conflict surface**: Only `package.json` scripts + `devDependencies` + `.gitignore` entries; minimized by grouping NX additions at the end
- **`release:check`**: Uses `build:legacy` to validate CI-compatible builds

### Package-Specific Commands

```bash
# From packages/hive-core/
bun run build             # Build hive-core
bun run test              # Run hive-core tests

# From packages/opencode-hive/
bun run build             # Build opencode-hive plugin
bun run dev               # Watch mode

# From packages/vscode-hive/
bun run build             # Build VS Code extension (vite:build webview + esbuild extension + vsce package)
```

## Code Style

### General

- **TypeScript ES2022** with ESM modules
- **Semicolons**: Yes, use semicolons
- **Quotes**: Single quotes for strings
- **Imports**: Use `.js` extension for local imports (ESM requirement)
- **Type imports**: Separate with `import type { X }` syntax
- **Naming**:
  - `camelCase` for variables, functions
  - `PascalCase` for types, interfaces, classes
  - Descriptive function names (`readFeatureJson`, `ensureFeatureDir`)

### TypeScript Patterns

```typescript
// Explicit type annotations
interface FeatureInfo {
  name: string;
  path: string;
  status: 'active' | 'completed';
}

// Classes for services
export class FeatureService {
  constructor(private readonly rootDir: string) {}

  async createFeature(name: string): Promise<FeatureInfo> {
    // ...
  }
}

// Async/await over raw promises
async function loadConfig(): Promise<Config> {
  const data = await fs.readFile(path, 'utf-8');
  return JSON.parse(data);
}
```

### File Organization

```
packages/
├── hive-core/           # Shared logic (services, types, utils)
│   └── src/
│       ├── services/    # FeatureService, TaskService, PlanService, etc.
│       ├── utils/       # paths.ts, detection.ts
│       └── types.ts     # Shared type definitions
├── opencode-hive/       # OpenCode plugin
│   └── src/
│       ├── agents/      # scout, swarm, hive, architect, forager, hygienic
│       ├── mcp/         # websearch, grep-app, context7, ast-grep
│       ├── tools/       # Hive tool implementations
│       ├── hooks/       # Event hooks
│       └── skills/      # Skill definitions
└── vscode-hive/         # VS Code extension
```

### Tests

- Component/unit test files use `.test.ts` suffix
- Storybook test files use `.spec.ts` suffix (to keep Vitest configs separate)
- Place tests next to source files or in `__tests__/` directories
- Use descriptive test names

## Commit Messages

Use **Conventional Commits**:

```
feat: add parallel task execution
fix: handle missing worktree gracefully
docs: update skill documentation
chore: upgrade dependencies
refactor: extract worktree logic to service
test: add feature service unit tests
perf: cache resolved paths
```

Breaking changes use `!`:

```
feat!: change plan format to support subtasks
```

## Architecture Principles

### Core Philosophy

1. **Context Persists** - Write to `.hive/` files; memory is ephemeral
2. **Plan → Approve → Execute** - No code without approved plan
3. **Human Shapes, Agent Builds** - Humans decide direction, agents implement
4. **Good Enough Wins** - Ship working code, iterate later
5. **Batched Parallelism** - Delegate independent tasks to workers
6. **Tests Define Done** - TDD subtasks: test → implement → verify
7. **Iron Laws + Hard Gates** - Non-negotiable constraints per agent

### Agent Roles

| Agent         | Role                                                        |
| ------------- | ----------------------------------------------------------- |
| Hive (Hybrid) | Plans AND orchestrates; phase-aware                         |
| Architect     | Plans features, interviews, writes plans. NEVER executes    |
| Swarm         | Orchestrates execution. Delegates, spawns workers, verifies |
| Scout         | Researches codebase + external docs/data                    |
| Forager       | Executes tasks directly in isolated worktrees               |
| Hygienic      | Reviews plan/code quality. OKAY/REJECT verdict              |

### Data Model

Features stored in `.hive/features/<name>/`:

```
.hive/features/my-feature/
├── feature.json       # Feature metadata
├── plan.md            # Implementation plan
├── tasks.json         # Generated tasks
└── contexts/          # Persistent context files
    ├── research.md
    └── decisions.md
```

## Development Workflow

### Adding a New Tool

1. Create tool in `packages/opencode-hive/src/tools/`
2. Register in tool index
3. Add to agent system prompt if needed
4. Test with actual agent invocation

### Adding a New Skill

1. Create directory in `packages/opencode-hive/skills/<name>/`
2. Add `SKILL.md` with skill instructions
3. Register in skill loader
4. Document triggers in skill description

### Adding a Service

1. Create in `packages/hive-core/src/services/`
2. Export from `services/index.ts`
3. Add types to `types.ts`
4. Write unit tests

## Important Patterns

### File System Operations

Use the utility functions from hive-core:

```typescript
import { readJson, writeJson, fileExists, ensureDir } from './utils/fs.js';

// Not: fs.readFileSync + JSON.parse
const data = await readJson<Config>(path);

// Not: fs.mkdirSync
await ensureDir(dirPath);
```

### Error Handling

```typescript
// Prefer explicit error handling
try {
  const feature = await featureService.load(name);
  return { success: true, feature };
} catch (error) {
  return {
    error: `Failed to load feature: ${error.message}`,
    hint: 'Check that the feature exists',
  };
}
```

### Path Resolution

```typescript
import { getHiveDir, getFeatureDir } from './utils/paths.js';

// Use path utilities, not string concatenation
const hivePath = getHiveDir(rootDir);
const featurePath = getFeatureDir(rootDir, featureName);
```

## Monorepo Structure

This is a **bun workspaces** monorepo:

```json
{
  "workspaces": ["packages/*"]
}
```

- Dependencies are hoisted to root `node_modules/`
- Each package has its own `package.json`
- Run package scripts from the package directory (for example, `packages/vscode-hive/` → `bun run build`)

## Hive - Feature Development System

Plan-first development: Write plan → User reviews → Approve → Execute tasks

### Tools (15 total)

| Domain    | Tools                                                             |
| --------- | ----------------------------------------------------------------- |
| Feature   | hive_feature_create, hive_feature_complete                        |
| Plan      | hive_plan_write, hive_plan_read, hive_plan_approve                |
| Task      | hive_tasks_sync, hive_task_create, hive_task_update               |
| Worktree  | hive_worktree_create, hive_worktree_commit, hive_worktree_discard |
| Merge     | hive_merge                                                        |
| Context   | hive_context_write                                                |
| AGENTS.md | hive_agents_md                                                    |
| Status    | hive_status                                                       |

### Workflow

1. `hive_feature_create(name)` - Create feature
2. `hive_plan_write(content)` - Write plan.md
3. User adds comments in VSCode → `hive_plan_read` to see them
4. Revise plan → User approves
5. `hive_tasks_sync()` - Generate tasks from plan
6. `hive_worktree_create(task)` → work in worktree → `hive_worktree_commit(task, summary)`
7. `hive_merge(task)` - Merge task branch into main (when ready)

**Important:** `hive_worktree_commit` commits changes to task branch but does NOT merge.
Use `hive_merge` to explicitly integrate changes. Worktrees persist until manually removed.

### Sandbox Configuration

**Docker sandbox** provides isolated test environments for workers:

- **Config location**: `~/.config/opencode/agent_hive.json`
- **Fields**:
  - `sandbox: 'none' | 'docker'` — Isolation mode (default: 'none')
  - `dockerImage?: string` — Custom Docker image (optional, auto-detects if omitted)
- **Auto-detection**: Detects runtime from project files:
  - `package.json` → `node:22-slim`
  - `requirements.txt` / `pyproject.toml` → `python:3.12-slim`
  - `go.mod` → `golang:1.22-slim`
  - `Cargo.toml` → `rust:1.77-slim`
  - `Dockerfile` → builds from project Dockerfile
  - Fallback → `ubuntu:24.04`
- **Escape hatch**: Prefix commands with `HOST:` to bypass sandbox and run directly on host

**Example config**:

```json
{
  "sandbox": "docker",
  "dockerImage": "node:22-slim"
}
```

Workers are unaware of sandboxing — bash commands are transparently intercepted and wrapped with `docker run`.
