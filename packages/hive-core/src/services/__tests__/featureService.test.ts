import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { FeatureService } from '../featureService';
import type { FeatureJson, CommentsJson, TaskStatus } from '../../types';

const TEST_DIR = '/tmp/hive-core-featureservice-test-' + process.pid;
const PROJECT_ROOT = TEST_DIR;

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

function setupFeatureRaw(
  featureName: string,
  overrides: Partial<FeatureJson> = {},
): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.mkdirSync(featurePath, { recursive: true });
  fs.mkdirSync(path.join(featurePath, 'context'), { recursive: true });
  fs.mkdirSync(path.join(featurePath, 'tasks'), { recursive: true });

  const feature: FeatureJson = {
    name: featureName,
    status: 'planning',
    createdAt: new Date().toISOString(),
    ...overrides,
  };

  fs.writeFileSync(
    path.join(featurePath, 'feature.json'),
    JSON.stringify(feature, null, 2),
  );
}

function setupTask(
  featureName: string,
  taskFolder: string,
  status: Partial<TaskStatus> = {},
): void {
  const taskPath = path.join(
    TEST_DIR,
    '.hive',
    'features',
    featureName,
    'tasks',
    taskFolder,
  );
  fs.mkdirSync(taskPath, { recursive: true });

  const taskStatus: TaskStatus = {
    status: 'pending',
    origin: 'plan',
    planTitle: 'Test Task',
    ...status,
  };

  fs.writeFileSync(
    path.join(taskPath, 'status.json'),
    JSON.stringify(taskStatus, null, 2),
  );
}

function writeComments(featureName: string, data: CommentsJson): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(
    path.join(featurePath, 'comments.json'),
    JSON.stringify(data, null, 2),
  );
}

function writePlan(featureName: string, content: string): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(path.join(featurePath, 'plan.md'), content);
}

describe('FeatureService', () => {
  let service: FeatureService;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    service = new FeatureService(PROJECT_ROOT);
  });

  afterEach(() => {
    cleanup();
  });

  describe('create()', () => {
    it('writes feature.json with correct fields', () => {
      const result = service.create('my-feature');

      expect(result.name).toBe('my-feature');
      expect(result.status).toBe('planning');
      expect(result.createdAt).toBeTruthy();
      expect(result.ticket).toBeUndefined();

      // Verify persisted to disk
      const featureJsonPath = path.join(
        TEST_DIR,
        '.hive',
        'features',
        'my-feature',
        'feature.json',
      );
      expect(fs.existsSync(featureJsonPath)).toBe(true);
      const persisted = JSON.parse(fs.readFileSync(featureJsonPath, 'utf-8'));
      expect(persisted.name).toBe('my-feature');
      expect(persisted.status).toBe('planning');
    });

    it('includes ticket when provided', () => {
      const result = service.create('ticketed-feature', 'PROJ-123');

      expect(result.ticket).toBe('PROJ-123');
    });

    it('creates context and tasks directories', () => {
      service.create('my-feature');

      const contextDir = path.join(
        TEST_DIR,
        '.hive',
        'features',
        'my-feature',
        'context',
      );
      const tasksDir = path.join(
        TEST_DIR,
        '.hive',
        'features',
        'my-feature',
        'tasks',
      );
      expect(fs.existsSync(contextDir)).toBe(true);
      expect(fs.existsSync(tasksDir)).toBe(true);
    });

    it('throws when feature already exists', () => {
      service.create('existing-feature');

      expect(() => service.create('existing-feature')).toThrow(
        /already exists/,
      );
    });
  });

  describe('get()', () => {
    it('reads and parses feature.json', () => {
      setupFeatureRaw('test-get', { status: 'executing', ticket: 'TIX-1' });

      const result = service.get('test-get');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('test-get');
      expect(result!.status).toBe('executing');
      expect(result!.ticket).toBe('TIX-1');
    });

    it('returns null for non-existent feature', () => {
      const result = service.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list()', () => {
    it('lists all feature directories', () => {
      setupFeatureRaw('alpha');
      setupFeatureRaw('beta');

      const result = service.list();

      expect(result).toContain('alpha');
      expect(result).toContain('beta');
      expect(result.length).toBe(2);
    });

    it('returns empty array when no features exist', () => {
      const result = service.list();

      expect(result).toEqual([]);
    });
  });

  describe('getActive()', () => {
    it('returns first non-completed feature', () => {
      setupFeatureRaw('completed-feature', { status: 'completed' });
      setupFeatureRaw('active-feature', { status: 'executing' });

      const result = service.getActive();

      expect(result).not.toBeNull();
      expect(result!.status).not.toBe('completed');
    });

    it('returns null when all features are completed', () => {
      setupFeatureRaw('done1', { status: 'completed' });
      setupFeatureRaw('done2', { status: 'completed' });

      const result = service.getActive();

      expect(result).toBeNull();
    });

    it('returns null when no features exist', () => {
      const result = service.getActive();

      expect(result).toBeNull();
    });
  });

  describe('updateStatus()', () => {
    it('transitions planning → approved', () => {
      setupFeatureRaw('status-test', { status: 'planning' });

      const result = service.updateStatus('status-test', 'approved');

      expect(result.status).toBe('approved');
      expect(result.approvedAt).toBeTruthy();
    });

    it('transitions approved → executing', () => {
      setupFeatureRaw('status-test', { status: 'approved' });

      const result = service.updateStatus('status-test', 'executing');

      expect(result.status).toBe('executing');
    });

    it('transitions executing → completed', () => {
      setupFeatureRaw('status-test', { status: 'executing' });

      const result = service.updateStatus('status-test', 'completed');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeTruthy();
    });

    it('does not overwrite existing approvedAt timestamp', () => {
      const originalTs = '2025-01-01T00:00:00.000Z';
      setupFeatureRaw('status-test', {
        status: 'approved',
        approvedAt: originalTs,
      });

      const result = service.updateStatus('status-test', 'approved');

      expect(result.approvedAt).toBe(originalTs);
    });

    it('throws for non-existent feature', () => {
      expect(() => service.updateStatus('nonexistent', 'approved')).toThrow(
        /not found/,
      );
    });

    it('persists status change to disk', () => {
      setupFeatureRaw('persist-test', { status: 'planning' });

      service.updateStatus('persist-test', 'executing');

      const featureJsonPath = path.join(
        TEST_DIR,
        '.hive',
        'features',
        'persist-test',
        'feature.json',
      );
      const persisted = JSON.parse(fs.readFileSync(featureJsonPath, 'utf-8'));
      expect(persisted.status).toBe('executing');
    });
  });

  describe('getInfo()', () => {
    it('returns feature info with task list and plan status', () => {
      setupFeatureRaw('info-test', { status: 'executing' });
      writePlan('info-test', '# Plan\n\nSome plan content');
      setupTask('info-test', '01-first-task', {
        status: 'done',
        planTitle: 'First Task',
      });
      setupTask('info-test', '02-second-task', {
        status: 'pending',
        planTitle: 'Second Task',
      });

      const result = service.getInfo('info-test');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('info-test');
      expect(result!.status).toBe('executing');
      expect(result!.hasPlan).toBe(true);
      expect(result!.tasks).toHaveLength(2);
      expect(result!.tasks[0].folder).toBe('01-first-task');
      expect(result!.tasks[0].status).toBe('done');
      expect(result!.tasks[1].folder).toBe('02-second-task');
      expect(result!.tasks[1].status).toBe('pending');
    });

    it('returns commentCount from comments.json', () => {
      setupFeatureRaw('comments-test', { status: 'planning' });
      writePlan('comments-test', '# Plan');
      writeComments('comments-test', {
        threads: [
          {
            id: 'c1',
            range: { start: { line: 1, character: 0 }, end: { line: 1, character: 0 } },
            body: 'Comment 1',
            author: 'human',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'c2',
            range: { start: { line: 3, character: 0 }, end: { line: 3, character: 0 } },
            body: 'Comment 2',
            author: 'agent',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });

      const result = service.getInfo('comments-test');

      expect(result).not.toBeNull();
      expect(result!.commentCount).toBe(2);
    });

    it('returns commentCount 0 when no comments.json exists', () => {
      setupFeatureRaw('no-comments', { status: 'planning' });
      writePlan('no-comments', '# Plan');

      const result = service.getInfo('no-comments');

      expect(result).not.toBeNull();
      expect(result!.commentCount).toBe(0);
    });

    it('returns hasPlan false when no plan.md exists', () => {
      setupFeatureRaw('no-plan', { status: 'planning' });

      const result = service.getInfo('no-plan');

      expect(result).not.toBeNull();
      expect(result!.hasPlan).toBe(false);
    });

    it('returns null for non-existent feature', () => {
      const result = service.getInfo('nonexistent');

      expect(result).toBeNull();
    });

    it('returns empty tasks when no tasks exist', () => {
      setupFeatureRaw('no-tasks', { status: 'planning' });

      const result = service.getInfo('no-tasks');

      expect(result).not.toBeNull();
      expect(result!.tasks).toEqual([]);
    });
  });

  describe('complete()', () => {
    it('sets status to completed', () => {
      setupFeatureRaw('complete-test', { status: 'executing' });

      const result = service.complete('complete-test');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeTruthy();
    });

    it('throws when already completed', () => {
      setupFeatureRaw('complete-test', { status: 'completed' });

      expect(() => service.complete('complete-test')).toThrow(
        /already completed/,
      );
    });

    it('throws for non-existent feature', () => {
      expect(() => service.complete('nonexistent')).toThrow(/not found/);
    });
  });

  describe('setSession() / getSession()', () => {
    it('stores and retrieves session ID', () => {
      setupFeatureRaw('session-test');

      service.setSession('session-test', 'sess-abc-123');
      const result = service.getSession('session-test');

      expect(result).toBe('sess-abc-123');
    });

    it('persists session to disk', () => {
      setupFeatureRaw('session-persist');

      service.setSession('session-persist', 'sess-xyz');

      const featureJsonPath = path.join(
        TEST_DIR,
        '.hive',
        'features',
        'session-persist',
        'feature.json',
      );
      const persisted = JSON.parse(fs.readFileSync(featureJsonPath, 'utf-8'));
      expect(persisted.sessionId).toBe('sess-xyz');
    });

    it('returns undefined when no session set', () => {
      setupFeatureRaw('no-session');

      const result = service.getSession('no-session');

      expect(result).toBeUndefined();
    });

    it('throws for non-existent feature', () => {
      expect(() => service.setSession('nonexistent', 'sess-123')).toThrow(
        /not found/,
      );
    });
  });
});
