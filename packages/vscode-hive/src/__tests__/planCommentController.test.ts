/**
 * Tests for PlanCommentController serialization and file watcher behavior.
 *
 * Focuses on:
 * - Range-based serialization round-trip (save → load → same Range values)
 * - Backward compatibility with line-only format
 * - File watcher includes onDidCreate
 * - 0-based line contract for storage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import {
  __watcherCallbacks,
  __commentThreadCalls,
  __reset,
  Range as MockRange,
  Uri as MockUri,
} from './__mocks__/vscode.js';

// --- fs mocks ---
const mockExistsSync = vi.fn().mockReturnValue(false);
const mockReadFileSync = vi.fn().mockReturnValue('{}');
const mockWriteFileSync = vi.fn();
const mockMkdirSync = vi.fn();
const mockStatSync = vi.fn().mockReturnValue({ mtime: new Date('2026-01-01') });

vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  statSync: (...args: unknown[]) => mockStatSync(...args),
}));

import { PlanCommentController } from '../providers/planCommentController.js';

const WORKSPACE_ROOT = '/test/workspace';
const FEATURE_NAME = 'my-feature';
const PLAN_URI_PATH = path.join(
  WORKSPACE_ROOT,
  '.hive',
  'features',
  FEATURE_NAME,
  'plan.md',
);

describe('PlanCommentController', () => {
  let controller: PlanCommentController;

  beforeEach(() => {
    vi.clearAllMocks();
    __reset();

    // Default: comments.json does not exist
    mockExistsSync.mockReturnValue(false);

    controller = new PlanCommentController(WORKSPACE_ROOT);
  });

  afterEach(() => {
    controller.dispose();
  });

  describe('file watcher registration', () => {
    it('registers onDidCreate alongside onDidChange and onDidDelete', () => {
      // The constructor should register all three watcher events
      expect(__watcherCallbacks.onCreate).not.toBeNull();
      expect(__watcherCallbacks.onChange).not.toBeNull();
      expect(__watcherCallbacks.onDelete).not.toBeNull();
    });
  });

  describe('serialization with Range', () => {
    it('saves comments with range (start/end) instead of single line number', () => {
      const planUri = MockUri.file(PLAN_URI_PATH);

      const storedData = {
        threads: [
          {
            id: 'thread-1',
            range: {
              start: { line: 5, character: 0 },
              end: { line: 7, character: 10 },
            },
            body: 'Review this section',
            author: 'human',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(storedData));

      // Load → populates internal threads map
      (controller as any).loadComments(planUri);

      // Save → serializes back
      (controller as any).saveComments(planUri);

      // Check what was written
      expect(mockWriteFileSync).toHaveBeenCalled();
      const writeCall = mockWriteFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);

      // Should have range, NOT line
      expect(savedData.threads[0]).toHaveProperty('range');
      expect(savedData.threads[0]).not.toHaveProperty('line');
      expect(savedData.threads[0].range).toEqual({
        start: { line: 5, character: 0 },
        end: { line: 7, character: 10 },
      });
    });

    it('round-trips Range through save→load→save cycle', () => {
      const planUri = MockUri.file(PLAN_URI_PATH);

      const originalRange = {
        start: { line: 10, character: 3 },
        end: { line: 12, character: 20 },
      };

      const storedData = {
        threads: [
          {
            id: 'rt-1',
            range: originalRange,
            body: 'Test comment',
            author: 'human',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(storedData));

      // Load → populates internal state
      (controller as any).loadComments(planUri);

      // Save → serializes back
      (controller as any).saveComments(planUri);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writeCall = mockWriteFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);

      // Range should survive the round trip exactly
      expect(savedData.threads[0].range).toEqual(originalRange);
    });

    it('uses 0-based lines in storage (VS Code native)', () => {
      const planUri = MockUri.file(PLAN_URI_PATH);

      // Store a comment on what a user sees as "line 1" = 0-based line 0
      const storedData = {
        threads: [
          {
            id: 'zero-1',
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            },
            body: 'First line comment',
            author: 'human',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(storedData));

      (controller as any).loadComments(planUri);

      // Verify the vscode.CommentThread was created with 0-based range
      expect(__commentThreadCalls).toHaveLength(1);
      const range = __commentThreadCalls[0].range;
      expect(range.startLine).toBe(0);
      expect(range.startCharacter).toBe(0);
      expect(range.endLine).toBe(0);
      expect(range.endCharacter).toBe(0);
    });
  });

  describe('backward compatibility', () => {
    it('migrates old line-only format to range format on load', () => {
      const planUri = MockUri.file(PLAN_URI_PATH);

      // Old format: has `line` but no `range`
      const legacyData = {
        threads: [
          {
            id: 'legacy-1',
            line: 5,
            body: 'Old format comment',
            author: 'human',
            timestamp: '2026-01-01T00:00:00.000Z',
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(legacyData));

      (controller as any).loadComments(planUri);

      // Thread should be created with range derived from old line number
      expect(__commentThreadCalls).toHaveLength(1);
      const range = __commentThreadCalls[0].range;
      expect(range.startLine).toBe(5);
      expect(range.endLine).toBe(5);

      // Now save and verify it's stored as range
      (controller as any).saveComments(planUri);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writeCall = mockWriteFileSync.mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);

      expect(savedData.threads[0]).toHaveProperty('range');
      expect(savedData.threads[0]).not.toHaveProperty('line');
      expect(savedData.threads[0].range.start.line).toBe(5);
    });

    it('migrates legacy format with string[] replies', () => {
      const planUri = MockUri.file(PLAN_URI_PATH);

      const legacyData = {
        threads: [
          {
            id: 'legacy-2',
            line: 3,
            body: 'Old comment',
            replies: ['reply 1', 'reply 2'],
          },
        ],
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(legacyData));
      mockStatSync.mockReturnValue({ mtime: new Date('2026-01-01') });

      (controller as any).loadComments(planUri);

      // Should create thread with 3 comments (1 body + 2 replies)
      expect(__commentThreadCalls).toHaveLength(1);
      const threadComments = __commentThreadCalls[0].comments;
      expect(threadComments).toHaveLength(3);

      // And the range should be migrated from line=3
      const range = __commentThreadCalls[0].range;
      expect(range.startLine).toBe(3);
      expect(range.endLine).toBe(3);
    });
  });
});
