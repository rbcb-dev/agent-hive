import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { PlanService, FeatureService } from 'hive-core';
import type { CommentsJson } from 'hive-core';

/**
 * Tests for hive_plan_approve bug fix and comment count hint accuracy.
 *
 * Bug: The tool-level approve check in index.ts used `comments.length > 0`
 * which blocks approval even when all comments are resolved.
 * Fix: Filter by `resolved !== true` before counting.
 *
 * Also validates that FeatureService.getInfo() commentCount counts only unresolved.
 */

const TEST_DIR = '/tmp/hive-plan-approve-test-' + process.pid;
const PROJECT_ROOT = TEST_DIR;

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

function setupFeature(featureName: string): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.mkdirSync(featurePath, { recursive: true });
  fs.mkdirSync(path.join(featurePath, 'context'), { recursive: true });
  fs.mkdirSync(path.join(featurePath, 'tasks'), { recursive: true });

  fs.writeFileSync(
    path.join(featurePath, 'feature.json'),
    JSON.stringify({
      name: featureName,
      status: 'planning',
      createdAt: new Date().toISOString(),
    }),
  );
}

function writePlan(featureName: string, content: string): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(path.join(featurePath, 'plan.md'), content);
}

function writeComments(featureName: string, data: CommentsJson): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(
    path.join(featurePath, 'comments.json'),
    JSON.stringify(data, null, 2),
  );
}

/**
 * Simulates the tool-level approve logic from index.ts.
 * This is the exact pattern used in hive_plan_approve's execute function.
 */
function simulateToolApprove(
  planService: PlanService,
  feature: string,
): string {
  const comments = planService.getComments(feature);
  const unresolvedComments = comments.filter((c) => c.resolved !== true);
  if (unresolvedComments.length > 0) {
    return `Error: Cannot approve - ${unresolvedComments.length} unresolved comment(s). Address them first.`;
  }
  planService.approve(feature);
  return 'Plan approved. Run hive_tasks_sync to generate tasks.';
}

describe('hive_plan_approve tool-level unresolved comment filtering', () => {
  let planService: PlanService;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    planService = new PlanService(PROJECT_ROOT);
  });

  afterEach(() => {
    cleanup();
  });

  test('succeeds when 2 comments exist and both are resolved', () => {
    const feature = 'approve-resolved';
    setupFeature(feature);
    writePlan(feature, '# Plan');

    writeComments(feature, {
      threads: [
        {
          id: 'c1',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          body: 'First comment',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: true,
        },
        {
          id: 'c2',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 0 },
          },
          body: 'Second comment',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: true,
        },
      ],
    });

    const result = simulateToolApprove(planService, feature);

    expect(result).toBe(
      'Plan approved. Run hive_tasks_sync to generate tasks.',
    );
    expect(planService.isApproved(feature)).toBe(true);
  });

  test('returns error with count 1 when 2 comments exist and only 1 is resolved', () => {
    const feature = 'approve-partial';
    setupFeature(feature);
    writePlan(feature, '# Plan');

    writeComments(feature, {
      threads: [
        {
          id: 'c1',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          body: 'Resolved comment',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: true,
        },
        {
          id: 'c2',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 0 },
          },
          body: 'Unresolved comment',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
        },
      ],
    });

    const result = simulateToolApprove(planService, feature);

    expect(result).toBe(
      'Error: Cannot approve - 1 unresolved comment(s). Address them first.',
    );
    expect(planService.isApproved(feature)).toBe(false);
  });

  test('returns error when all comments are unresolved', () => {
    const feature = 'approve-none-resolved';
    setupFeature(feature);
    writePlan(feature, '# Plan');

    writeComments(feature, {
      threads: [
        {
          id: 'c1',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          body: 'First unresolved',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'c2',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 0 },
          },
          body: 'Second unresolved',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
        },
      ],
    });

    const result = simulateToolApprove(planService, feature);

    expect(result).toBe(
      'Error: Cannot approve - 2 unresolved comment(s). Address them first.',
    );
  });

  test('succeeds when no comments exist', () => {
    const feature = 'approve-no-comments';
    setupFeature(feature);
    writePlan(feature, '# Plan');

    const result = simulateToolApprove(planService, feature);

    expect(result).toBe(
      'Plan approved. Run hive_tasks_sync to generate tasks.',
    );
    expect(planService.isApproved(feature)).toBe(true);
  });
});

describe('FeatureService.getInfo() commentCount counts only unresolved', () => {
  let featureService: FeatureService;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    featureService = new FeatureService(PROJECT_ROOT);
  });

  afterEach(() => {
    cleanup();
  });

  test('commentCount is 0 when all comments are resolved', () => {
    setupFeature('all-resolved');
    writePlan('all-resolved', '# Plan');
    writeComments('all-resolved', {
      threads: [
        {
          id: 'c1',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          body: 'Resolved 1',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: true,
        },
        {
          id: 'c2',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 0 },
          },
          body: 'Resolved 2',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: true,
        },
      ],
    });

    const info = featureService.getInfo('all-resolved');

    expect(info).not.toBeNull();
    expect(info!.commentCount).toBe(0);
  });

  test('commentCount counts only unresolved comments', () => {
    setupFeature('mixed-resolved');
    writePlan('mixed-resolved', '# Plan');
    writeComments('mixed-resolved', {
      threads: [
        {
          id: 'c1',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          body: 'Resolved',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: true,
        },
        {
          id: 'c2',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 0 },
          },
          body: 'Unresolved',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'c3',
          range: {
            start: { line: 4, character: 0 },
            end: { line: 4, character: 0 },
          },
          body: 'Explicitly unresolved',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
          resolved: false,
        },
      ],
    });

    const info = featureService.getInfo('mixed-resolved');

    expect(info).not.toBeNull();
    expect(info!.commentCount).toBe(2);
  });

  test('commentCount counts all when none are resolved', () => {
    setupFeature('none-resolved');
    writePlan('none-resolved', '# Plan');
    writeComments('none-resolved', {
      threads: [
        {
          id: 'c1',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          body: 'Unresolved 1',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'c2',
          range: {
            start: { line: 2, character: 0 },
            end: { line: 2, character: 0 },
          },
          body: 'Unresolved 2',
          author: 'human',
          timestamp: '2025-01-01T00:00:00.000Z',
        },
      ],
    });

    const info = featureService.getInfo('none-resolved');

    expect(info).not.toBeNull();
    expect(info!.commentCount).toBe(2);
  });
});
