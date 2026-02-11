import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { ReviewService, PlanService } from 'hive-core';
import type { ReviewConfig, ReviewSession, ReviewThread } from 'hive-core';
import { DEFAULT_REVIEW_CONFIG } from 'hive-core';
import { createReviewTools } from '../tools/review-tools.js';

/**
 * Tests for new review tools added in task 14.
 *
 * Tests cover:
 * - hive_review_unresolve: Unresolve a resolved thread
 * - hive_review_delete_thread: Delete a thread from a session
 * - hive_review_edit: Edit an annotation's body
 * - hive_review_mark_applied: Mark a suggestion annotation as applied
 * - hive_plan_comment_resolve: Resolve a plan comment via agent tool
 * - hive_plan_comment_reply: Reply to a plan comment via agent tool
 * - Config wiring: reviewConfig is passed through to createReviewTools
 */

const TEST_DIR = '/tmp/hive-review-tools-test-' + process.pid;

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
  fs.mkdirSync(path.join(featurePath, 'reviews'), { recursive: true });

  fs.writeFileSync(
    path.join(featurePath, 'feature.json'),
    JSON.stringify({
      name: featureName,
      status: 'active',
      createdAt: new Date().toISOString(),
    }),
  );
}

function writePlan(featureName: string, content: string): void {
  const featurePath = path.join(TEST_DIR, '.hive', 'features', featureName);
  fs.writeFileSync(path.join(featurePath, 'plan.md'), content);
}

describe('review tools: hive_review_unresolve', () => {
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    reviewService = new ReviewService(TEST_DIR);
    const resolveFeature = () => 'test-feature';
    tools = createReviewTools(reviewService, resolveFeature);
    setupFeature('test-feature');
  });

  afterEach(() => {
    cleanup();
  });

  test('unresolves a resolved thread and returns thread with open status', async () => {
    // Arrange: create session + thread, then resolve it
    const session = await reviewService.startSession('test-feature', 'feature');
    const thread = await reviewService.addThread(
      session.id,
      'test-entity',
      null,
      { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      {
        type: 'comment',
        body: 'Test comment',
        author: { type: 'human', name: 'Tester' },
      },
    );
    await reviewService.resolveThread(thread.id);

    // Act
    const result = await tools.hive_review_unresolve.execute(
      { threadId: thread.id },
      {} as any,
    );

    // Assert
    const parsed = JSON.parse(result as string);
    expect(parsed.status).toBe('open');
    expect(parsed.id).toBe(thread.id);
  });

  test('returns error for non-existent threadId', async () => {
    const result = await tools.hive_review_unresolve.execute(
      { threadId: 'nonexistent' },
      {} as any,
    );

    expect(result).toContain('Error:');
  });
});

describe('review tools: hive_review_delete_thread', () => {
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    reviewService = new ReviewService(TEST_DIR);
    const resolveFeature = () => 'test-feature';
    tools = createReviewTools(reviewService, resolveFeature);
    setupFeature('test-feature');
  });

  afterEach(() => {
    cleanup();
  });

  test('deletes thread from session', async () => {
    const session = await reviewService.startSession('test-feature', 'feature');
    const thread = await reviewService.addThread(
      session.id,
      'test-entity',
      null,
      { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      {
        type: 'comment',
        body: 'To delete',
        author: { type: 'human', name: 'Tester' },
      },
    );

    const result = await tools.hive_review_delete_thread.execute(
      { sessionId: session.id, threadId: thread.id },
      {} as any,
    );

    expect(result).toContain('deleted');

    // Verify thread is actually gone
    const updatedSession = await reviewService.getSession(session.id);
    expect(updatedSession!.threads.length).toBe(0);
  });

  test('returns error for non-existent session', async () => {
    const result = await tools.hive_review_delete_thread.execute(
      { sessionId: 'nonexistent', threadId: 'thread-1' },
      {} as any,
    );

    expect(result).toContain('Error:');
  });
});

describe('review tools: hive_review_edit', () => {
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    reviewService = new ReviewService(TEST_DIR);
    const resolveFeature = () => 'test-feature';
    tools = createReviewTools(reviewService, resolveFeature);
    setupFeature('test-feature');
  });

  afterEach(() => {
    cleanup();
  });

  test('edits annotation body', async () => {
    const session = await reviewService.startSession('test-feature', 'feature');
    const thread = await reviewService.addThread(
      session.id,
      'test-entity',
      null,
      { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      {
        type: 'comment',
        body: 'Original body',
        author: { type: 'human', name: 'Tester' },
      },
    );
    const annotationId = thread.annotations[0].id;

    const result = await tools.hive_review_edit.execute(
      { threadId: thread.id, annotationId, body: 'Updated body' },
      {} as any,
    );

    const parsed = JSON.parse(result as string);
    expect(parsed.body).toBe('Updated body');
    expect(parsed.id).toBe(annotationId);
  });

  test('returns error for non-existent annotation', async () => {
    const session = await reviewService.startSession('test-feature', 'feature');
    const thread = await reviewService.addThread(
      session.id,
      'test-entity',
      null,
      { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      {
        type: 'comment',
        body: 'body',
        author: { type: 'human', name: 'Tester' },
      },
    );

    const result = await tools.hive_review_edit.execute(
      { threadId: thread.id, annotationId: 'nonexistent', body: 'new' },
      {} as any,
    );

    expect(result).toContain('Error:');
  });
});

describe('review tools: hive_review_mark_applied', () => {
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    reviewService = new ReviewService(TEST_DIR);
    const resolveFeature = () => 'test-feature';
    tools = createReviewTools(reviewService, resolveFeature);
    setupFeature('test-feature');
  });

  afterEach(() => {
    cleanup();
  });

  test('marks suggestion as applied', async () => {
    const session = await reviewService.startSession('test-feature', 'feature');
    const thread = await reviewService.addThread(
      session.id,
      'test-entity',
      'file.ts',
      { start: { line: 0, character: 0 }, end: { line: 5, character: 0 } },
      {
        type: 'suggestion',
        body: 'Replace this',
        author: { type: 'llm', name: 'Agent' },
        suggestion: { replacement: 'new code' },
      },
    );
    const annotationId = thread.annotations[0].id;

    const result = await tools.hive_review_mark_applied.execute(
      { threadId: thread.id, annotationId },
      {} as any,
    );

    const parsed = JSON.parse(result as string);
    expect(parsed.meta.applied).toBe(true);
    expect(parsed.meta.appliedAt).toBeDefined();
  });

  test('returns error for non-suggestion annotation', async () => {
    const session = await reviewService.startSession('test-feature', 'feature');
    const thread = await reviewService.addThread(
      session.id,
      'test-entity',
      null,
      { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      {
        type: 'comment',
        body: 'Not a suggestion',
        author: { type: 'human', name: 'Tester' },
      },
    );
    const annotationId = thread.annotations[0].id;

    const result = await tools.hive_review_mark_applied.execute(
      { threadId: thread.id, annotationId },
      {} as any,
    );

    expect(result).toContain('Error:');
  });
});

describe('review tools: hive_plan_comment_resolve', () => {
  let planService: PlanService;
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    reviewService = new ReviewService(TEST_DIR);
    planService = new PlanService(TEST_DIR);
    const resolveFeature = (explicit?: string) => explicit || 'test-feature';
    tools = createReviewTools(
      reviewService,
      resolveFeature,
      DEFAULT_REVIEW_CONFIG,
      planService,
    );
    setupFeature('test-feature');
    writePlan('test-feature', '# Test Plan\n\nSome content');
  });

  afterEach(() => {
    cleanup();
  });

  test('resolves an unresolved plan comment', async () => {
    // Add a comment
    const comment = planService.addComment('test-feature', {
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      body: 'Please fix this',
      author: 'human',
    });

    const result = await tools.hive_plan_comment_resolve.execute(
      { feature: 'test-feature', commentId: comment.id },
      {} as any,
    );

    expect(result).toContain('resolved');

    // Verify comment is resolved
    const comments = planService.getComments('test-feature');
    expect(comments[0].resolved).toBe(true);
  });

  test('returns error for non-existent commentId', async () => {
    const result = await tools.hive_plan_comment_resolve.execute(
      { feature: 'test-feature', commentId: 'nonexistent' },
      {} as any,
    );

    expect(result).toContain('Error:');
  });
});

describe('review tools: hive_plan_comment_reply', () => {
  let planService: PlanService;
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;

  beforeEach(() => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    reviewService = new ReviewService(TEST_DIR);
    planService = new PlanService(TEST_DIR);
    const resolveFeature = (explicit?: string) => explicit || 'test-feature';
    tools = createReviewTools(
      reviewService,
      resolveFeature,
      DEFAULT_REVIEW_CONFIG,
      planService,
    );
    setupFeature('test-feature');
    writePlan('test-feature', '# Test Plan\n\nSome content');
  });

  afterEach(() => {
    cleanup();
  });

  test('replies to a plan comment', async () => {
    const comment = planService.addComment('test-feature', {
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      body: 'What about X?',
      author: 'human',
    });

    const result = await tools.hive_plan_comment_reply.execute(
      {
        feature: 'test-feature',
        commentId: comment.id,
        body: 'Good point, addressed.',
      },
      {} as any,
    );

    const parsed = JSON.parse(result as string);
    expect(parsed.body).toBe('Good point, addressed.');
    expect(parsed.author).toBe('agent');

    // Verify reply persisted
    const comments = planService.getComments('test-feature');
    expect(comments[0].replies).toHaveLength(1);
    expect(comments[0].replies![0].body).toBe('Good point, addressed.');
  });

  test('returns error for non-existent commentId', async () => {
    const result = await tools.hive_plan_comment_reply.execute(
      { feature: 'test-feature', commentId: 'nonexistent', body: 'reply' },
      {} as any,
    );

    expect(result).toContain('Error:');
  });
});

describe('review tools: config wiring', () => {
  test('createReviewTools accepts and uses reviewConfig parameter', () => {
    cleanup();
    fs.mkdirSync(TEST_DIR, { recursive: true });
    const reviewService = new ReviewService(TEST_DIR);
    const resolveFeature = () => 'test-feature';
    const customConfig: ReviewConfig = {
      ...DEFAULT_REVIEW_CONFIG,
      parallelReviewers: 5,
    };

    // This should not throw — confirms config parameter is accepted
    const tools = createReviewTools(
      reviewService,
      resolveFeature,
      customConfig,
    );
    expect(tools.hive_review_start).toBeDefined();
    expect(tools.hive_review_unresolve).toBeDefined();
    expect(tools.hive_review_delete_thread).toBeDefined();
    expect(tools.hive_review_edit).toBeDefined();
    expect(tools.hive_review_mark_applied).toBeDefined();
    expect(tools.hive_plan_comment_resolve).toBeDefined();
    expect(tools.hive_plan_comment_reply).toBeDefined();

    cleanup();
  });
});
