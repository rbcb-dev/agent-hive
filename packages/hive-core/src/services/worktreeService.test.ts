import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
import { WorktreeService } from './worktreeService';
import type { TaskChangedFile } from '../types';

const TEST_DIR = '/tmp/hive-worktree-service-test-' + process.pid;
const PROJECT_ROOT = TEST_DIR;
const HIVE_DIR = path.join(TEST_DIR, '.hive');
const FEATURE_NAME = 'test-feature';
const STEP_NAME = '01-test-task';

async function cleanup() {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    /* intentional */
  }
}

async function setupGitRepoWithWorktree(): Promise<WorktreeService> {
  // Create project root and init git
  await fs.mkdir(PROJECT_ROOT, { recursive: true });
  const git = simpleGit(PROJECT_ROOT);
  await git.init();
  await git.addConfig('user.email', 'test@test.com');
  await git.addConfig('user.name', 'Test User');

  // Create initial file and commit
  await fs.writeFile(path.join(PROJECT_ROOT, 'README.md'), '# Test\n');
  await git.add('.');
  await git.commit('initial commit');

  // Create .hive directories
  await fs.mkdir(HIVE_DIR, { recursive: true });

  // Create the worktree
  const service = new WorktreeService({
    baseDir: PROJECT_ROOT,
    hiveDir: HIVE_DIR,
  });

  // Create a task status directory
  const taskStatusDir = path.join(
    HIVE_DIR,
    'features',
    FEATURE_NAME,
    'tasks',
    STEP_NAME,
  );
  await fs.mkdir(taskStatusDir, { recursive: true });
  await fs.writeFile(
    path.join(taskStatusDir, 'status.json'),
    JSON.stringify({
      status: 'in_progress',
      origin: 'plan',
      baseCommit: (await git.revparse(['HEAD'])).trim(),
    }),
  );

  // Create the worktree
  await service.create(FEATURE_NAME, STEP_NAME);

  return service;
}

describe('WorktreeService.getDetailedDiff', () => {
  let service: WorktreeService;

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('returns empty array when no changes exist', async () => {
    service = await setupGitRepoWithWorktree();
    const result = await service.getDetailedDiff(FEATURE_NAME, STEP_NAME);

    expect(result).toEqual([]);
  });

  it('detects added files with insertions count', async () => {
    service = await setupGitRepoWithWorktree();

    // Add a new file in the worktree
    const worktreePath = path.join(
      HIVE_DIR,
      '.worktrees',
      FEATURE_NAME,
      STEP_NAME,
    );
    await fs.writeFile(
      path.join(worktreePath, 'newfile.ts'),
      'const x = 1;\nconst y = 2;\n',
    );
    const worktreeGit = simpleGit(worktreePath);
    await worktreeGit.add('.');
    await worktreeGit.commit('add new file');

    const result = await service.getDetailedDiff(FEATURE_NAME, STEP_NAME);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('newfile.ts');
    expect(result[0].status).toBe('added');
    expect(result[0].insertions).toBe(2);
    expect(result[0].deletions).toBe(0);
  });

  it('detects modified files with insertions and deletions', async () => {
    service = await setupGitRepoWithWorktree();

    const worktreePath = path.join(
      HIVE_DIR,
      '.worktrees',
      FEATURE_NAME,
      STEP_NAME,
    );
    // Modify existing file
    await fs.writeFile(
      path.join(worktreePath, 'README.md'),
      '# Updated Test\n\nNew content.\n',
    );
    const worktreeGit = simpleGit(worktreePath);
    await worktreeGit.add('.');
    await worktreeGit.commit('modify readme');

    const result = await service.getDetailedDiff(FEATURE_NAME, STEP_NAME);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('README.md');
    expect(result[0].status).toBe('modified');
    expect(result[0].insertions).toBeGreaterThan(0);
    expect(result[0].deletions).toBeGreaterThan(0);
  });

  it('detects deleted files', async () => {
    service = await setupGitRepoWithWorktree();

    const worktreePath = path.join(
      HIVE_DIR,
      '.worktrees',
      FEATURE_NAME,
      STEP_NAME,
    );
    // Delete existing file
    await fs.unlink(path.join(worktreePath, 'README.md'));
    const worktreeGit = simpleGit(worktreePath);
    await worktreeGit.add('.');
    await worktreeGit.commit('delete readme');

    const result = await service.getDetailedDiff(FEATURE_NAME, STEP_NAME);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('README.md');
    expect(result[0].status).toBe('deleted');
    expect(result[0].deletions).toBeGreaterThan(0);
  });

  it('handles multiple file changes', async () => {
    service = await setupGitRepoWithWorktree();

    const worktreePath = path.join(
      HIVE_DIR,
      '.worktrees',
      FEATURE_NAME,
      STEP_NAME,
    );
    // Add new file
    await fs.writeFile(path.join(worktreePath, 'new.ts'), 'export {};\n');
    // Modify existing
    await fs.writeFile(path.join(worktreePath, 'README.md'), '# Changed\n');
    const worktreeGit = simpleGit(worktreePath);
    await worktreeGit.add('.');
    await worktreeGit.commit('multiple changes');

    const result = await service.getDetailedDiff(FEATURE_NAME, STEP_NAME);

    expect(result.length).toBeGreaterThanOrEqual(2);
    const paths = result.map((f) => f.path).sort();
    expect(paths).toContain('README.md');
    expect(paths).toContain('new.ts');
  });

  it('uses baseCommit from status.json when no base provided', async () => {
    service = await setupGitRepoWithWorktree();

    const worktreePath = path.join(
      HIVE_DIR,
      '.worktrees',
      FEATURE_NAME,
      STEP_NAME,
    );
    await fs.writeFile(path.join(worktreePath, 'file.ts'), 'const a = 1;\n');
    const worktreeGit = simpleGit(worktreePath);
    await worktreeGit.add('.');
    await worktreeGit.commit('add file');

    // Should use baseCommit from status.json
    const result = await service.getDetailedDiff(FEATURE_NAME, STEP_NAME);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('file.ts');
  });

  it('accepts explicit baseCommit override', async () => {
    service = await setupGitRepoWithWorktree();

    const worktreePath = path.join(
      HIVE_DIR,
      '.worktrees',
      FEATURE_NAME,
      STEP_NAME,
    );
    const worktreeGit = simpleGit(worktreePath);

    // First change
    await fs.writeFile(path.join(worktreePath, 'first.ts'), 'const a = 1;\n');
    await worktreeGit.add('.');
    await worktreeGit.commit('first');
    const midCommit = (await worktreeGit.revparse(['HEAD'])).trim();

    // Second change
    await fs.writeFile(path.join(worktreePath, 'second.ts'), 'const b = 2;\n');
    await worktreeGit.add('.');
    await worktreeGit.commit('second');

    // Get diff from midpoint — should only show second.ts
    const result = await service.getDetailedDiff(
      FEATURE_NAME,
      STEP_NAME,
      midCommit,
    );

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('second.ts');
    expect(result[0].status).toBe('added');
  });
});
