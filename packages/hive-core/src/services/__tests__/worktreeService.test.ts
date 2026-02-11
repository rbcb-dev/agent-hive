import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import simpleGit from 'simple-git';
import { WorktreeService, createWorktreeService } from '../worktreeService';

const TEST_DIR = '/tmp/hive-core-worktreeservice-test-' + process.pid;

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

/**
 * Sets up a fresh git repository with an initial commit and .hive directory structure.
 * Returns the project root path.
 */
async function setupGitRepo(name: string): Promise<string> {
  const repoPath = path.join(TEST_DIR, name);
  fs.mkdirSync(repoPath, { recursive: true });

  const git = simpleGit(repoPath);
  await git.init();
  await git.addConfig('user.email', 'test@test.com');
  await git.addConfig('user.name', 'Test User');

  // Create initial file and commit
  fs.writeFileSync(path.join(repoPath, 'README.md'), '# Test Repo\n');
  await git.add('.');
  await git.commit('initial commit');

  // Create .hive directory structure
  const hiveDir = path.join(repoPath, '.hive');
  fs.mkdirSync(path.join(hiveDir, '.worktrees'), { recursive: true });
  fs.mkdirSync(
    path.join(hiveDir, 'features', 'test-feature', 'tasks', '01-test-step'),
    {
      recursive: true,
    },
  );

  return repoPath;
}

/**
 * Creates a WorktreeService configured for the given repo path.
 */
function createService(repoPath: string): WorktreeService {
  return new WorktreeService({
    baseDir: repoPath,
    hiveDir: path.join(repoPath, '.hive'),
  });
}

/**
 * Writes a status.json for a task inside the .hive directory.
 */
function writeTaskStatus(
  repoPath: string,
  feature: string,
  step: string,
  status: Record<string, unknown>,
): void {
  const taskDir = path.join(
    repoPath,
    '.hive',
    'features',
    feature,
    'tasks',
    step,
  );
  fs.mkdirSync(taskDir, { recursive: true });
  fs.writeFileSync(
    path.join(taskDir, 'status.json'),
    JSON.stringify(status, null, 2),
  );
}

describe('WorktreeService', () => {
  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    cleanup();
  });

  describe('create()', () => {
    it('creates worktree at correct path and returns WorktreeInfo', async () => {
      const repoPath = await setupGitRepo('create-test');
      const service = createService(repoPath);

      const result = await service.create('test-feature', '01-test-step');

      expect(result.path).toBe(
        path.join(
          repoPath,
          '.hive',
          '.worktrees',
          'test-feature',
          '01-test-step',
        ),
      );
      expect(result.branch).toBe('hive/test-feature/01-test-step');
      expect(result.commit).toBeTruthy();
      expect(result.feature).toBe('test-feature');
      expect(result.step).toBe('01-test-step');

      // Verify worktree directory exists on disk
      expect(fs.existsSync(result.path)).toBe(true);
    });

    it('returns existing worktree info without error on duplicate create', async () => {
      const repoPath = await setupGitRepo('create-idempotent');
      const service = createService(repoPath);

      const first = await service.create('test-feature', '01-test-step');
      const second = await service.create('test-feature', '01-test-step');

      expect(second.path).toBe(first.path);
      expect(second.branch).toBe(first.branch);
    });
  });

  describe('get()', () => {
    it('returns WorktreeInfo for existing worktree', async () => {
      const repoPath = await setupGitRepo('get-test');
      const service = createService(repoPath);

      await service.create('test-feature', '01-test-step');

      const result = await service.get('test-feature', '01-test-step');

      expect(result).not.toBeNull();
      expect(result!.branch).toBe('hive/test-feature/01-test-step');
      expect(result!.commit).toBeTruthy();
    });

    it('returns null for non-existent worktree', async () => {
      const repoPath = await setupGitRepo('get-missing');
      const service = createService(repoPath);

      const result = await service.get('test-feature', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('commitChanges()', () => {
    it('commits changes and returns CommitResult with sha', async () => {
      const repoPath = await setupGitRepo('commit-test');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      // Create a file in the worktree
      fs.writeFileSync(
        path.join(worktree.path, 'new-file.ts'),
        'export const x = 1;\n',
      );

      const result = await service.commitChanges(
        'test-feature',
        '01-test-step',
        'test: add new file',
      );

      expect(result.committed).toBe(true);
      expect(result.sha).toBeTruthy();
      expect(result.sha.length).toBeGreaterThan(0);
      expect(result.message).toBe('test: add new file');
    });

    it('returns committed=false with no changes', async () => {
      const repoPath = await setupGitRepo('commit-nochange');
      const service = createService(repoPath);

      await service.create('test-feature', '01-test-step');

      const result = await service.commitChanges(
        'test-feature',
        '01-test-step',
        'empty commit',
      );

      expect(result.committed).toBe(false);
      expect(result.sha).toBeTruthy(); // Should still return current HEAD
    });

    it('uses default commit message when none provided', async () => {
      const repoPath = await setupGitRepo('commit-default-msg');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');
      fs.writeFileSync(path.join(worktree.path, 'file.txt'), 'hello\n');

      const result = await service.commitChanges(
        'test-feature',
        '01-test-step',
      );

      expect(result.committed).toBe(true);
      expect(result.message).toContain('01-test-step');
    });

    it('returns committed=false for non-existent worktree', async () => {
      const repoPath = await setupGitRepo('commit-missing');
      const service = createService(repoPath);

      const result = await service.commitChanges(
        'test-feature',
        'nonexistent',
        'test',
      );

      expect(result.committed).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('getDiff()', () => {
    it('returns DiffResult with file stats for committed changes', async () => {
      const repoPath = await setupGitRepo('diff-test');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      // Store the baseCommit in status.json
      writeTaskStatus(repoPath, 'test-feature', '01-test-step', {
        status: 'in_progress',
        origin: 'plan',
        baseCommit: worktree.commit,
      });

      // Create a file and commit in the worktree
      fs.writeFileSync(
        path.join(worktree.path, 'added.ts'),
        'export const added = true;\n',
      );
      const worktreeGit = simpleGit(worktree.path);
      await worktreeGit.add('.');
      await worktreeGit.commit('add file');

      const result = await service.getDiff('test-feature', '01-test-step');

      expect(result.hasDiff).toBe(true);
      expect(result.diffContent).toBeTruthy();
      expect(result.filesChanged.length).toBeGreaterThan(0);
      expect(result.insertions).toBeGreaterThan(0);
    });

    it('returns empty DiffResult when no changes', async () => {
      const repoPath = await setupGitRepo('diff-empty');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      // Write baseCommit pointing to current HEAD (no changes since then)
      writeTaskStatus(repoPath, 'test-feature', '01-test-step', {
        status: 'in_progress',
        origin: 'plan',
        baseCommit: worktree.commit,
      });

      const result = await service.getDiff('test-feature', '01-test-step');

      expect(result.hasDiff).toBe(false);
      expect(result.filesChanged).toEqual([]);
      expect(result.insertions).toBe(0);
      expect(result.deletions).toBe(0);
    });
  });

  describe('getDetailedDiff()', () => {
    it('returns TaskChangedFile[] with per-file stats', async () => {
      const repoPath = await setupGitRepo('detailed-diff-test');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      // Store baseCommit
      writeTaskStatus(repoPath, 'test-feature', '01-test-step', {
        status: 'in_progress',
        origin: 'plan',
        baseCommit: worktree.commit,
      });

      // Add a new file and modify existing
      fs.writeFileSync(
        path.join(worktree.path, 'new-file.ts'),
        'export const a = 1;\nexport const b = 2;\n',
      );
      fs.writeFileSync(
        path.join(worktree.path, 'README.md'),
        '# Updated README\n\nWith more content.\n',
      );

      const worktreeGit = simpleGit(worktree.path);
      await worktreeGit.add('.');
      await worktreeGit.commit('add and modify files');

      const result = await service.getDetailedDiff(
        'test-feature',
        '01-test-step',
      );

      expect(result.length).toBeGreaterThan(0);

      const newFile = result.find((f) => f.path === 'new-file.ts');
      expect(newFile).toBeDefined();
      expect(newFile!.status).toBe('added');
      expect(newFile!.insertions).toBeGreaterThan(0);

      const modifiedFile = result.find((f) => f.path === 'README.md');
      expect(modifiedFile).toBeDefined();
      expect(modifiedFile!.status).toBe('modified');
    });

    it('returns empty array when no changes', async () => {
      const repoPath = await setupGitRepo('detailed-diff-empty');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      writeTaskStatus(repoPath, 'test-feature', '01-test-step', {
        status: 'in_progress',
        origin: 'plan',
        baseCommit: worktree.commit,
      });

      const result = await service.getDetailedDiff(
        'test-feature',
        '01-test-step',
      );

      expect(result).toEqual([]);
    });

    it('detects deleted files', async () => {
      const repoPath = await setupGitRepo('detailed-diff-delete');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      writeTaskStatus(repoPath, 'test-feature', '01-test-step', {
        status: 'in_progress',
        origin: 'plan',
        baseCommit: worktree.commit,
      });

      // Delete the README
      fs.unlinkSync(path.join(worktree.path, 'README.md'));

      const worktreeGit = simpleGit(worktree.path);
      await worktreeGit.add('.');
      await worktreeGit.commit('delete README');

      const result = await service.getDetailedDiff(
        'test-feature',
        '01-test-step',
      );

      expect(result.length).toBe(1);
      expect(result[0].path).toBe('README.md');
      expect(result[0].status).toBe('deleted');
    });
  });

  describe('merge()', () => {
    it('merges branch and returns sha + filesChanged', async () => {
      const repoPath = await setupGitRepo('merge-test');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      // Make changes in the worktree and commit
      fs.writeFileSync(
        path.join(worktree.path, 'merged-file.ts'),
        'export const merged = true;\n',
      );
      const worktreeGit = simpleGit(worktree.path);
      await worktreeGit.add('.');
      await worktreeGit.commit('add merged file');

      const result = await service.merge('test-feature', '01-test-step');

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(result.sha).toBeTruthy();
      expect(result.filesChanged).toBeDefined();
    });

    it('supports squash merge strategy', async () => {
      const repoPath = await setupGitRepo('merge-squash');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');

      fs.writeFileSync(
        path.join(worktree.path, 'squash-file.ts'),
        'export const squashed = true;\n',
      );
      const worktreeGit = simpleGit(worktree.path);
      await worktreeGit.add('.');
      await worktreeGit.commit('add squash file');

      const result = await service.merge(
        'test-feature',
        '01-test-step',
        'squash',
      );

      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(result.sha).toBeTruthy();
    });

    it('returns error for non-existent branch', async () => {
      const repoPath = await setupGitRepo('merge-missing');
      const service = createService(repoPath);

      const result = await service.merge('test-feature', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.merged).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('remove()', () => {
    it('cleans up worktree directory', async () => {
      const repoPath = await setupGitRepo('remove-test');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');
      expect(fs.existsSync(worktree.path)).toBe(true);

      await service.remove('test-feature', '01-test-step');

      expect(fs.existsSync(worktree.path)).toBe(false);
    });

    it('deletes branch when deleteBranch=true', async () => {
      const repoPath = await setupGitRepo('remove-branch');
      const service = createService(repoPath);

      await service.create('test-feature', '01-test-step');
      await service.remove('test-feature', '01-test-step', true);

      const git = simpleGit(repoPath);
      const branches = await git.branch();
      expect(branches.all).not.toContain('hive/test-feature/01-test-step');
    });

    it('does not throw for already-removed worktree', async () => {
      const repoPath = await setupGitRepo('remove-idempotent');
      const service = createService(repoPath);

      // Remove a worktree that doesn't exist — should not throw
      await expect(
        service.remove('test-feature', 'nonexistent'),
      ).resolves.toBeUndefined();
    });
  });

  describe('list()', () => {
    it('lists all worktrees for a feature', async () => {
      const repoPath = await setupGitRepo('list-test');
      const service = createService(repoPath);

      await service.create('my-feature', '01-first');
      await service.create('my-feature', '02-second');

      const result = await service.list('my-feature');

      expect(result.length).toBe(2);
      expect(result.map((w) => w.step)).toContain('01-first');
      expect(result.map((w) => w.step)).toContain('02-second');
    });

    it('returns empty array when no worktrees exist', async () => {
      const repoPath = await setupGitRepo('list-empty');
      const service = createService(repoPath);

      const result = await service.list('nonexistent-feature');

      expect(result).toEqual([]);
    });
  });

  describe('hasUncommittedChanges()', () => {
    it('returns true when worktree has uncommitted files', async () => {
      const repoPath = await setupGitRepo('uncommitted-test');
      const service = createService(repoPath);

      const worktree = await service.create('test-feature', '01-test-step');
      fs.writeFileSync(path.join(worktree.path, 'dirty.txt'), 'dirty\n');

      const result = await service.hasUncommittedChanges(
        'test-feature',
        '01-test-step',
      );

      expect(result).toBe(true);
    });

    it('returns false when worktree is clean', async () => {
      const repoPath = await setupGitRepo('clean-test');
      const service = createService(repoPath);

      await service.create('test-feature', '01-test-step');

      const result = await service.hasUncommittedChanges(
        'test-feature',
        '01-test-step',
      );

      expect(result).toBe(false);
    });
  });

  describe('createWorktreeService()', () => {
    it('creates service with correct config', () => {
      const service = createWorktreeService('/tmp/test-project');

      // Can't directly inspect private config, but verify it doesn't throw
      expect(service).toBeInstanceOf(WorktreeService);
    });
  });
});
