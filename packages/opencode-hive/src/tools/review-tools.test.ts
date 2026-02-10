/**
 * Tests for review tools.
 *
 * TDD approach: Write tests first, then implement to make them pass.
 */
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createReviewTools } from './review-tools.js';
import { ReviewService, DEFAULT_REVIEW_CONFIG } from 'hive-core';
import type {
  ReviewSession,
  ReviewThread,
  ReviewAnnotation,
  ReviewIndex,
  ReviewConfig,
} from 'hive-core';

describe('Review Tools', () => {
  let tempDir: string;
  let reviewService: ReviewService;
  let tools: ReturnType<typeof createReviewTools>;
  let resolveFeature: (explicit?: string) => string | null;
  let reviewConfig: ReviewConfig;

  beforeEach(() => {
    // Create temp directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-tools-test-'));

    // Create .hive/features structure
    const hiveDir = path.join(tempDir, '.hive', 'features', 'test-feature');
    fs.mkdirSync(hiveDir, { recursive: true });

    // Create feature.json
    fs.writeFileSync(
      path.join(hiveDir, 'feature.json'),
      JSON.stringify({
        name: 'test-feature',
        status: 'executing',
        createdAt: new Date().toISOString(),
      }),
    );

    reviewService = new ReviewService(tempDir);
    resolveFeature = (explicit?: string) => explicit || 'test-feature';
    reviewConfig = { ...DEFAULT_REVIEW_CONFIG };
    tools = createReviewTools(reviewService, resolveFeature, reviewConfig);
  });

  afterEach(() => {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('hive_review_start', () => {
    it('creates a new review session with default scope', async () => {
      const result = await tools.hive_review_start.execute({
        feature: 'test-feature',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBeDefined();
      expect(parsed.featureName).toBe('test-feature');
      expect(parsed.scope).toBe('feature');
      expect(parsed.status).toBe('in_progress');
    });

    it('creates a review session with custom scope and refs', async () => {
      const result = await tools.hive_review_start.execute({
        feature: 'test-feature',
        scope: 'task',
        baseRef: 'main',
        headRef: 'feature-branch',
      });
      const parsed = JSON.parse(result);

      expect(parsed.scope).toBe('task');
      expect(parsed.gitMeta.baseRef).toBe('main');
      expect(parsed.gitMeta.headRef).toBe('feature-branch');
    });

    it('returns error when feature not found', async () => {
      const noFeatureResolve = () => null;
      const toolsNoFeature = createReviewTools(
        reviewService,
        noFeatureResolve,
        reviewConfig,
      );

      const result = await toolsNoFeature.hive_review_start.execute({});

      expect(result).toContain('Error');
      expect(result).toContain('No feature specified');
    });

    it('creates a review session with specified reviewer agent', async () => {
      const result = await tools.hive_review_start.execute({
        feature: 'test-feature',
        reviewer: 'hygienic-reviewer',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBeDefined();
      expect(parsed.reviewers).toBeDefined();
      expect(parsed.reviewers).toContain('hygienic-reviewer');
    });

    it('tracks multiple reviewers in session', async () => {
      // Set limit to 2 for this test
      reviewConfig.parallelReviewers = 2;
      const multiTools = createReviewTools(
        reviewService,
        resolveFeature,
        reviewConfig,
      );

      // First reviewer
      const result1 = await multiTools.hive_review_start.execute({
        feature: 'test-feature',
        reviewer: 'hygienic-reviewer',
      });
      const parsed1 = JSON.parse(result1);

      // Add another reviewer to same session
      const result2 = await multiTools.hive_review_start.execute({
        feature: 'test-feature',
        sessionId: parsed1.id,
        reviewer: 'scout-researcher',
      });
      const parsed2 = JSON.parse(result2);

      expect(parsed2.reviewers).toContain('hygienic-reviewer');
      expect(parsed2.reviewers).toContain('scout-researcher');
    });

    it('enforces parallelReviewers limit', async () => {
      // Set limit to 1
      reviewConfig.parallelReviewers = 1;
      const limitedTools = createReviewTools(
        reviewService,
        resolveFeature,
        reviewConfig,
      );

      // First reviewer
      const result1 = await limitedTools.hive_review_start.execute({
        feature: 'test-feature',
        reviewer: 'hygienic-reviewer',
      });
      expect(result1).not.toContain('Error');

      // Second reviewer should fail
      const parsed1 = JSON.parse(result1);
      const result2 = await limitedTools.hive_review_start.execute({
        feature: 'test-feature',
        sessionId: parsed1.id,
        reviewer: 'scout-researcher',
      });

      expect(result2).toContain('Error');
      expect(result2).toContain('parallel reviewers');
    });

    it('allows multiple reviewers when parallelReviewers > 1', async () => {
      // Set limit to 3
      reviewConfig.parallelReviewers = 3;
      const multiTools = createReviewTools(
        reviewService,
        resolveFeature,
        reviewConfig,
      );

      // First reviewer
      const result1 = await multiTools.hive_review_start.execute({
        feature: 'test-feature',
        reviewer: 'hygienic-reviewer',
      });
      const parsed1 = JSON.parse(result1);

      // Second reviewer should succeed
      const result2 = await multiTools.hive_review_start.execute({
        feature: 'test-feature',
        sessionId: parsed1.id,
        reviewer: 'scout-researcher',
      });

      expect(result2).not.toContain('Error');
      const parsed2 = JSON.parse(result2);
      expect(parsed2.reviewers).toHaveLength(2);
    });
  });

  describe('hive_review_list', () => {
    it('returns empty list when no sessions exist', async () => {
      const result = await tools.hive_review_list.execute({
        feature: 'test-feature',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual([]);
    });

    it('returns list of sessions for feature', async () => {
      // Create two sessions
      await reviewService.startSession('test-feature', 'feature');
      await reviewService.startSession('test-feature', 'task');

      const result = await tools.hive_review_list.execute({
        feature: 'test-feature',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].scope).toBe('feature');
      expect(parsed[1].scope).toBe('task');
    });
  });

  describe('hive_review_get', () => {
    it('retrieves a session by ID', async () => {
      const session = await reviewService.startSession(
        'test-feature',
        'feature',
      );

      const result = await tools.hive_review_get.execute({
        sessionId: session.id,
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe(session.id);
      expect(parsed.featureName).toBe('test-feature');
    });

    it('returns error when session not found', async () => {
      const result = await tools.hive_review_get.execute({
        sessionId: 'nonexistent',
      });

      expect(result).toContain('Error');
      expect(result).toContain('not found');
    });
  });

  describe('hive_review_add_comment', () => {
    let session: ReviewSession;

    beforeEach(async () => {
      session = await reviewService.startSession('test-feature', 'feature');
    });

    it('adds a comment thread to a session', async () => {
      const result = await tools.hive_review_add_comment.execute({
        sessionId: session.id,
        entityId: 'test-feature',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 50 },
        },
        type: 'comment',
        body: 'This looks good!',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBeDefined();
      expect(parsed.entityId).toBe('test-feature');
      expect(parsed.status).toBe('open');
      expect(parsed.annotations).toHaveLength(1);
      expect(parsed.annotations[0].body).toBe('This looks good!');
      expect(parsed.annotations[0].type).toBe('comment');
    });

    it('adds a comment with uri for code scope', async () => {
      const result = await tools.hive_review_add_comment.execute({
        sessionId: session.id,
        entityId: 'test-feature',
        uri: 'file:///src/index.ts',
        range: {
          start: { line: 5, character: 0 },
          end: { line: 5, character: 20 },
        },
        type: 'question',
        body: 'Why is this function async?',
      });
      const parsed = JSON.parse(result);

      expect(parsed.uri).toBe('file:///src/index.ts');
      expect(parsed.annotations[0].type).toBe('question');
    });

    it('uses active session when sessionId not provided', async () => {
      const result = await tools.hive_review_add_comment.execute({
        entityId: 'test-feature',
        range: {
          start: { line: 1, character: 0 },
          end: { line: 1, character: 10 },
        },
        type: 'comment',
        body: 'Test comment',
      });
      const parsed = JSON.parse(result);

      expect(parsed.entityId).toBe('test-feature');
    });

    it('includes agentId in author when provided', async () => {
      const result = await tools.hive_review_add_comment.execute({
        sessionId: session.id,
        entityId: 'test-feature',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 50 },
        },
        type: 'comment',
        body: 'This looks good!',
        agentId: 'hygienic-reviewer',
      });
      const parsed = JSON.parse(result);

      expect(parsed.annotations[0].author.agentId).toBe('hygienic-reviewer');
    });
  });

  describe('hive_review_suggest', () => {
    let session: ReviewSession;

    beforeEach(async () => {
      session = await reviewService.startSession('test-feature', 'feature');
    });

    it('adds a suggestion thread with replacement', async () => {
      const result = await tools.hive_review_suggest.execute({
        sessionId: session.id,
        entityId: 'test-feature',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 50 },
        },
        body: 'Consider using async/await',
        replacement: 'const result = await fetchData();',
      });
      const parsed = JSON.parse(result);

      expect(parsed.annotations[0].type).toBe('suggestion');
      expect(parsed.annotations[0].suggestion).toBeDefined();
      expect(parsed.annotations[0].suggestion.replacement).toBe(
        'const result = await fetchData();',
      );
    });

    it('includes agentId in author for suggestions', async () => {
      const result = await tools.hive_review_suggest.execute({
        sessionId: session.id,
        entityId: 'test-feature',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 50 },
        },
        body: 'Consider using async/await',
        replacement: 'const result = await fetchData();',
        agentId: 'hygienic-reviewer',
      });
      const parsed = JSON.parse(result);

      expect(parsed.annotations[0].author.agentId).toBe('hygienic-reviewer');
    });
  });

  describe('hive_review_reply', () => {
    let session: ReviewSession;
    let thread: ReviewThread;

    beforeEach(async () => {
      session = await reviewService.startSession('test-feature', 'feature');
      thread = await reviewService.addThread(
        session.id,
        'test-feature',
        null,
        { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } },
        {
          type: 'comment',
          body: 'Initial comment',
          author: { type: 'llm', name: 'Claude' },
        },
      );
    });

    it('adds a reply to an existing thread', async () => {
      const result = await tools.hive_review_reply.execute({
        threadId: thread.id,
        body: 'Thanks for the feedback!',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBeDefined();
      expect(parsed.body).toBe('Thanks for the feedback!');
      expect(parsed.type).toBe('comment');
    });

    it('returns error when thread not found', async () => {
      const result = await tools.hive_review_reply.execute({
        threadId: 'nonexistent',
        body: 'Reply',
      });

      expect(result).toContain('Error');
      expect(result).toContain('not found');
    });

    it('includes agentId in reply author when provided', async () => {
      const result = await tools.hive_review_reply.execute({
        threadId: thread.id,
        body: 'Thanks for the feedback!',
        agentId: 'hygienic-reviewer',
      });
      const parsed = JSON.parse(result);

      expect(parsed.author.agentId).toBe('hygienic-reviewer');
    });
  });

  describe('hive_review_resolve', () => {
    let session: ReviewSession;
    let thread: ReviewThread;

    beforeEach(async () => {
      session = await reviewService.startSession('test-feature', 'feature');
      thread = await reviewService.addThread(
        session.id,
        'test-feature',
        null,
        { start: { line: 1, character: 0 }, end: { line: 1, character: 10 } },
        {
          type: 'comment',
          body: 'Fix this',
          author: { type: 'human', name: 'user' },
        },
      );
    });

    it('resolves an open thread', async () => {
      const result = await tools.hive_review_resolve.execute({
        threadId: thread.id,
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe(thread.id);
      expect(parsed.status).toBe('resolved');
    });

    it('returns error when thread not found', async () => {
      const result = await tools.hive_review_resolve.execute({
        threadId: 'nonexistent',
      });

      expect(result).toContain('Error');
      expect(result).toContain('not found');
    });
  });

  describe('hive_review_submit', () => {
    let session: ReviewSession;

    beforeEach(async () => {
      session = await reviewService.startSession('test-feature', 'feature');
    });

    it('submits a review with approve verdict', async () => {
      const result = await tools.hive_review_submit.execute({
        sessionId: session.id,
        verdict: 'approve',
        summary: 'LGTM! Great work.',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe(session.id);
      expect(parsed.verdict).toBe('approve');
      expect(parsed.status).toBe('approved');
      expect(parsed.summary).toBe('LGTM! Great work.');
    });

    it('submits a review with request_changes verdict', async () => {
      const result = await tools.hive_review_submit.execute({
        sessionId: session.id,
        verdict: 'request_changes',
        summary: 'Please address the comments.',
      });
      const parsed = JSON.parse(result);

      expect(parsed.verdict).toBe('request_changes');
      expect(parsed.status).toBe('changes_requested');
    });

    it('submits a review with comment verdict', async () => {
      const result = await tools.hive_review_submit.execute({
        sessionId: session.id,
        verdict: 'comment',
        summary: 'Just some thoughts.',
      });
      const parsed = JSON.parse(result);

      expect(parsed.verdict).toBe('comment');
      expect(parsed.status).toBe('commented');
    });

    it('uses active session when sessionId not provided', async () => {
      const result = await tools.hive_review_submit.execute({
        verdict: 'approve',
        summary: 'Approved!',
      });
      const parsed = JSON.parse(result);

      expect(parsed.verdict).toBe('approve');
    });

    it('returns error when session not found', async () => {
      const noFeatureResolve = () => null;
      const toolsNoFeature = createReviewTools(
        reviewService,
        noFeatureResolve,
        reviewConfig,
      );

      const result = await toolsNoFeature.hive_review_submit.execute({
        sessionId: 'nonexistent',
        verdict: 'approve',
        summary: 'LGTM',
      });

      expect(result).toContain('Error');
    });
  });
});
