/**
 * Type tests for Review types
 *
 * This file verifies that Review types exist and have the correct structure.
 * If this file compiles, the types are correct.
 */
import { describe, it, expect } from 'bun:test';
import type {
  ReviewScope,
  ReviewStatus,
  ReviewVerdict,
  ThreadStatus,
  AnnotationType,
  Position,
  Range,
  GitMeta,
  ReviewAnnotation,
  ReviewThread,
  DiffHunkLine,
  DiffHunk,
  DiffFile,
  DiffPayload,
  ReviewSession,
  ReviewIndex,
} from './types.js';

describe('Review Types', () => {
  describe('Type Aliases', () => {
    it('ReviewScope accepts valid values', () => {
      const scopes: ReviewScope[] = [
        'feature',
        'task',
        'context',
        'plan',
        'code',
      ];
      expect(scopes).toHaveLength(5);
    });

    it('ReviewStatus accepts valid values', () => {
      const statuses: ReviewStatus[] = [
        'in_progress',
        'approved',
        'changes_requested',
        'commented',
      ];
      expect(statuses).toHaveLength(4);
    });

    it('ReviewVerdict accepts valid values', () => {
      const verdicts: ReviewVerdict[] = [
        'approve',
        'request_changes',
        'comment',
      ];
      expect(verdicts).toHaveLength(3);
    });

    it('ThreadStatus accepts valid values', () => {
      const statuses: ThreadStatus[] = ['open', 'resolved', 'outdated'];
      expect(statuses).toHaveLength(3);
    });

    it('AnnotationType accepts valid values', () => {
      const types: AnnotationType[] = [
        'comment',
        'suggestion',
        'task',
        'question',
        'approval',
      ];
      expect(types).toHaveLength(5);
    });
  });

  describe('Position and Range', () => {
    it('Position has line and character', () => {
      const pos: Position = { line: 0, character: 0 };
      expect(pos.line).toBe(0);
      expect(pos.character).toBe(0);
    });

    it('Range has start and end Position', () => {
      const range: Range = {
        start: { line: 0, character: 0 },
        end: { line: 10, character: 5 },
      };
      expect(range.start.line).toBe(0);
      expect(range.end.line).toBe(10);
    });
  });

  describe('GitMeta', () => {
    it('GitMeta has required fields', () => {
      const meta: GitMeta = {
        repoRoot: '/path/to/repo',
        baseRef: 'main',
        headRef: 'feature-branch',
        mergeBase: 'abc123',
        capturedAt: '2024-01-01T00:00:00Z',
        diffStats: { files: 5, insertions: 100, deletions: 50 },
        diffSummary: [
          { path: 'src/file.ts', status: 'M', additions: 10, deletions: 5 },
        ],
      };
      expect(meta.repoRoot).toBe('/path/to/repo');
      expect(meta.diffStats.files).toBe(5);
      expect(meta.diffSummary).toHaveLength(1);
    });
  });

  describe('ReviewAnnotation', () => {
    it('ReviewAnnotation has required fields', () => {
      const annotation: ReviewAnnotation = {
        id: 'ann-1',
        type: 'comment',
        body: 'This looks good',
        author: { type: 'human', name: 'John' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(annotation.id).toBe('ann-1');
      expect(annotation.author.type).toBe('human');
    });

    it('ReviewAnnotation supports optional fields', () => {
      const annotation: ReviewAnnotation = {
        id: 'ann-2',
        type: 'suggestion',
        body: 'Consider this change',
        author: { type: 'llm', name: 'Claude', agentId: 'agent-123' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        suggestion: { replacement: 'new code' },
        meta: { deletedLine: true },
      };
      expect(annotation.suggestion?.replacement).toBe('new code');
      expect(annotation.meta?.deletedLine).toBe(true);
    });
  });

  describe('ReviewThread', () => {
    it('ReviewThread has required fields', () => {
      const thread: ReviewThread = {
        id: 'thread-1',
        entityId: 'feature-1',
        uri: 'file:///src/file.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 50 },
        },
        status: 'open',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        annotations: [],
      };
      expect(thread.id).toBe('thread-1');
      expect(thread.status).toBe('open');
    });

    it('ReviewThread uri can be null', () => {
      const thread: ReviewThread = {
        id: 'thread-2',
        entityId: 'feature-1',
        uri: null,
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
        status: 'resolved',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        annotations: [],
      };
      expect(thread.uri).toBeNull();
    });
  });

  describe('DiffHunk types', () => {
    it('DiffHunkLine has type and content', () => {
      const lines: DiffHunkLine[] = [
        { type: 'context', content: ' unchanged line' },
        { type: 'add', content: '+new line' },
        { type: 'remove', content: '-old line' },
      ];
      expect(lines).toHaveLength(3);
    });

    it('DiffHunk has hunk metadata and lines', () => {
      const hunk: DiffHunk = {
        oldStart: 10,
        oldLines: 5,
        newStart: 10,
        newLines: 7,
        lines: [{ type: 'context', content: ' line' }],
      };
      expect(hunk.oldStart).toBe(10);
      expect(hunk.lines).toHaveLength(1);
    });

    it('DiffHunk supports optional meta', () => {
      const hunk: DiffHunk = {
        oldStart: 1,
        oldLines: 1,
        newStart: 1,
        newLines: 1,
        lines: [],
        meta: { duplicates: true, overlap: false },
      };
      expect(hunk.meta?.duplicates).toBe(true);
    });
  });

  describe('DiffFile', () => {
    it('DiffFile has required fields', () => {
      const file: DiffFile = {
        path: 'src/file.ts',
        status: 'M',
        additions: 10,
        deletions: 5,
        hunks: [],
      };
      expect(file.path).toBe('src/file.ts');
      expect(file.status).toBe('M');
    });

    it('DiffFile status accepts all valid values', () => {
      const statuses: DiffFile['status'][] = [
        'A',
        'M',
        'D',
        'R',
        'C',
        'U',
        'B',
      ];
      expect(statuses).toHaveLength(7);
    });

    it('DiffFile supports optional isBinary', () => {
      const file: DiffFile = {
        path: 'image.png',
        status: 'A',
        additions: 0,
        deletions: 0,
        isBinary: true,
        hunks: [],
      };
      expect(file.isBinary).toBe(true);
    });
  });

  describe('DiffPayload', () => {
    it('DiffPayload has required fields', () => {
      const payload: DiffPayload = {
        baseRef: 'main',
        headRef: 'feature',
        mergeBase: 'abc123',
        repoRoot: '/repo',
        fileRoot: '/repo/src',
        diffStats: { files: 1, insertions: 10, deletions: 5 },
        files: [],
      };
      expect(payload.baseRef).toBe('main');
      expect(payload.files).toHaveLength(0);
    });
  });

  describe('ReviewSession', () => {
    it('ReviewSession has required fields', () => {
      const session: ReviewSession = {
        schemaVersion: 1,
        id: 'session-1',
        featureName: 'my-feature',
        scope: 'feature',
        status: 'in_progress',
        verdict: null,
        summary: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        threads: [],
        diffs: {},
        gitMeta: {
          repoRoot: '/repo',
          baseRef: 'main',
          headRef: 'feature',
          mergeBase: 'abc123',
          capturedAt: '2024-01-01T00:00:00Z',
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          diffSummary: [],
        },
      };
      expect(session.schemaVersion).toBe(1);
      expect(session.verdict).toBeNull();
    });

    it('ReviewSession can have verdict and summary', () => {
      const session: ReviewSession = {
        schemaVersion: 1,
        id: 'session-2',
        featureName: 'my-feature',
        scope: 'task',
        status: 'approved',
        verdict: 'approve',
        summary: 'LGTM!',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        threads: [],
        diffs: {},
        gitMeta: {
          repoRoot: '/repo',
          baseRef: 'main',
          headRef: 'feature',
          mergeBase: 'abc123',
          capturedAt: '2024-01-01T00:00:00Z',
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          diffSummary: [],
        },
      };
      expect(session.verdict).toBe('approve');
      expect(session.summary).toBe('LGTM!');
    });
  });

  describe('ReviewIndex', () => {
    it('ReviewIndex has required fields', () => {
      const index: ReviewIndex = {
        schemaVersion: 1,
        activeSessionId: null,
        sessions: [],
      };
      expect(index.schemaVersion).toBe(1);
      expect(index.activeSessionId).toBeNull();
    });

    it('ReviewIndex can have active session and session list', () => {
      const index: ReviewIndex = {
        schemaVersion: 1,
        activeSessionId: 'session-1',
        sessions: [
          {
            id: 'session-1',
            scope: 'feature',
            status: 'in_progress',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };
      expect(index.activeSessionId).toBe('session-1');
      expect(index.sessions).toHaveLength(1);
    });
  });
});
