import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { FeatureService, PlanService } from 'hive-core';
import type { FeatureJson } from 'hive-core';

const TEST_ROOT_BASE = '/tmp/hive-e2e-plan-review';

/** Small delay to ensure Date.now()-based IDs are unique across rapid calls */
const tick = () => new Promise<void>((r) => setTimeout(r, 2));

describe('e2e: plan comment → revision → approval flow', () => {
  let testRoot: string;
  let featureService: FeatureService;
  let planService: PlanService;

  beforeEach(() => {
    fs.rmSync(TEST_ROOT_BASE, { recursive: true, force: true });
    fs.mkdirSync(TEST_ROOT_BASE, { recursive: true });
    testRoot = fs.mkdtempSync(path.join(TEST_ROOT_BASE, 'project-'));

    featureService = new FeatureService(testRoot);
    planService = new PlanService(testRoot);
  });

  afterEach(() => {
    fs.rmSync(TEST_ROOT_BASE, { recursive: true, force: true });
  });

  it('full flow: create → plan → comment → blocked approve → resolve → approve', async () => {
    // 1. featureService.create() → feature exists
    const feature = featureService.create('review-test');
    expect(feature.name).toBe('review-test');
    expect(feature.status).toBe('planning');

    const loaded = featureService.get('review-test');
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('review-test');

    // 2. planService.write() → plan.md created, comments.json cleared
    const planContent = `# Review Test Feature

## Overview

This is a test plan for the review flow.

## Tasks

### 1. First Task
Implement the thing.
`;
    planService.write('review-test', planContent);

    const planResult = planService.read('review-test');
    expect(planResult).not.toBeNull();
    expect(planResult!.content).toBe(planContent);
    expect(planResult!.status).toBe('planning');
    expect(planResult!.comments).toEqual([]);

    // 3. planService.addComment() → 2 comments added
    const comment1 = planService.addComment('review-test', {
      line: 5,
      body: 'Can we add more detail about the overview?',
      author: 'human',
    });
    expect(comment1.id).toBeDefined();
    expect(comment1.line).toBe(5);
    expect(comment1.body).toBe('Can we add more detail about the overview?');
    expect(comment1.author).toBe('human');
    expect(comment1.timestamp).toBeDefined();

    await tick(); // ensure unique IDs
    const comment2 = planService.addComment('review-test', {
      line: 9,
      body: 'This task needs acceptance criteria.',
      author: 'human',
    });
    expect(comment2.id).toBeDefined();
    expect(comment2.line).toBe(9);

    // 4. planService.read() → returns plan + 2 comments
    const readAfterComments = planService.read('review-test');
    expect(readAfterComments).not.toBeNull();
    expect(readAfterComments!.comments).toHaveLength(2);
    expect(readAfterComments!.comments[0].body).toBe(
      'Can we add more detail about the overview?',
    );
    expect(readAfterComments!.comments[1].body).toBe(
      'This task needs acceptance criteria.',
    );

    // 5. planService.approve() → BLOCKED (unresolved comments)
    expect(() => planService.approve('review-test')).toThrow(
      'Cannot approve plan: 2 unresolved comment(s) remain',
    );

    // Verify feature status is still planning (not approved)
    const featureAfterBlockedApprove = featureService.get('review-test');
    expect(featureAfterBlockedApprove!.status).toBe('planning');

    // 6. planService.resolveComment() for both → resolved
    planService.resolveComment('review-test', comment1.id);
    planService.resolveComment('review-test', comment2.id);

    // Verify comments are marked resolved
    const readAfterResolve = planService.read('review-test');
    expect(readAfterResolve!.comments).toHaveLength(2);
    expect(readAfterResolve!.comments[0].resolved).toBe(true);
    expect(readAfterResolve!.comments[1].resolved).toBe(true);

    // 7. planService.approve() → SUCCESS
    planService.approve('review-test');

    // 8. featureService.get() → status = 'approved'
    const featureAfterApprove = featureService.get(
      'review-test',
    ) as FeatureJson;
    expect(featureAfterApprove).not.toBeNull();
    expect(featureAfterApprove.status).toBe('approved');
    expect(featureAfterApprove.approvedAt).toBeDefined();
  });

  it('write clears previous comments and revokes approval', () => {
    featureService.create('revision-test');

    // Write initial plan and add a comment
    planService.write('revision-test', '# Initial Plan\n');
    planService.addComment('revision-test', {
      line: 1,
      body: 'Needs revision',
      author: 'human',
    });

    // Resolve and approve
    const comments = planService.getComments('revision-test');
    planService.resolveComment('revision-test', comments[0].id);
    planService.approve('revision-test');

    // Verify approved
    expect(featureService.get('revision-test')!.status).toBe('approved');

    // Revise plan (simulating agent addressing comments)
    planService.write('revision-test', '# Revised Plan\n\nMore detail here.\n');

    // Comments should be cleared
    const readAfterRevise = planService.read('revision-test');
    expect(readAfterRevise!.comments).toEqual([]);
    expect(readAfterRevise!.content).toBe(
      '# Revised Plan\n\nMore detail here.\n',
    );

    // Approval should be revoked
    expect(readAfterRevise!.status).toBe('planning');
    expect(featureService.get('revision-test')!.status).toBe('planning');

    // Can now approve fresh (no unresolved comments)
    planService.approve('revision-test');
    expect(featureService.get('revision-test')!.status).toBe('approved');
  });

  it('resolving non-existent comment throws', () => {
    featureService.create('error-test');
    planService.write('error-test', '# Test\n');

    expect(() =>
      planService.resolveComment('error-test', 'nonexistent-id'),
    ).toThrow("Comment 'nonexistent-id' not found");
  });

  it('approving without a plan throws', () => {
    featureService.create('no-plan-test');

    expect(() => planService.approve('no-plan-test')).toThrow(
      "No plan.md found for feature 'no-plan-test'",
    );
  });

  it('partial resolution still blocks approval', async () => {
    featureService.create('partial-resolve-test');
    planService.write('partial-resolve-test', '# Test Plan\n');

    const c1 = planService.addComment('partial-resolve-test', {
      line: 1,
      body: 'Comment A',
      author: 'human',
    });
    await tick(); // ensure unique IDs
    planService.addComment('partial-resolve-test', {
      line: 1,
      body: 'Comment B',
      author: 'human',
    });

    // Resolve only one
    planService.resolveComment('partial-resolve-test', c1.id);

    // Approval should still be blocked
    expect(() => planService.approve('partial-resolve-test')).toThrow(
      'Cannot approve plan: 1 unresolved comment(s) remain',
    );
  });

  it('getInfo reflects comment count accurately', async () => {
    featureService.create('info-test');
    planService.write('info-test', '# Info Test\n');

    // Initially no comments
    let info = featureService.getInfo('info-test');
    expect(info).not.toBeNull();
    expect(info!.commentCount).toBe(0);

    // Add comments
    planService.addComment('info-test', {
      line: 1,
      body: 'First',
      author: 'human',
    });
    await tick(); // ensure unique IDs
    planService.addComment('info-test', {
      line: 1,
      body: 'Second',
      author: 'human',
    });

    info = featureService.getInfo('info-test');
    expect(info!.commentCount).toBe(2);

    // After rewrite, comments are cleared
    planService.write('info-test', '# Revised Info Test\n');
    info = featureService.getInfo('info-test');
    expect(info!.commentCount).toBe(0);
  });

  it('reply flow preserves comment structure', () => {
    featureService.create('reply-test');
    planService.write('reply-test', '# Reply Test\n');

    const comment = planService.addComment('reply-test', {
      line: 1,
      body: 'What about edge cases?',
      author: 'human',
    });

    // Add a reply
    const reply = planService.addReply('reply-test', comment.id, {
      body: 'Good point, I will add error handling.',
      author: 'agent',
    });
    expect(reply.id).toBeDefined();
    expect(reply.body).toBe('Good point, I will add error handling.');
    expect(reply.author).toBe('agent');
    expect(reply.timestamp).toBeDefined();

    // Read back and verify reply is present
    const readResult = planService.read('reply-test');
    expect(readResult!.comments).toHaveLength(1);
    expect(readResult!.comments[0].replies).toHaveLength(1);
    expect(readResult!.comments[0].replies![0].body).toBe(
      'Good point, I will add error handling.',
    );

    // Comment with reply is still unresolved, blocking approval
    expect(() => planService.approve('reply-test')).toThrow(
      'Cannot approve plan: 1 unresolved comment(s) remain',
    );

    // Resolve and approve
    planService.resolveComment('reply-test', comment.id);
    planService.approve('reply-test');
    expect(featureService.get('reply-test')!.status).toBe('approved');
  });
});
