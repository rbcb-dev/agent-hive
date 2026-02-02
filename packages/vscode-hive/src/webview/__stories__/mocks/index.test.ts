/**
 * Tests for mock data factories
 */

import { describe, it, expect } from 'vitest';
import {
  createMockReviewThread,
  createMockDiffFile,
  createMockAnnotation,
  createMockFileTreeItem,
} from './index';
import type {
  ReviewThread,
  DiffFile,
  ReviewAnnotation,
} from 'hive-core';
import type { FileTreeItem } from '../../types';

describe('createMockReviewThread', () => {
  it('creates a default ReviewThread with sensible defaults', () => {
    const thread = createMockReviewThread();

    expect(thread.id).toBeDefined();
    expect(thread.entityId).toBeDefined();
    expect(thread.status).toBe('open');
    expect(thread.range).toEqual({
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    });
    expect(thread.annotations).toEqual([]);
    expect(thread.createdAt).toBeDefined();
    expect(thread.updatedAt).toBeDefined();
  });

  it('allows overriding status', () => {
    const thread = createMockReviewThread({ status: 'resolved' });
    expect(thread.status).toBe('resolved');
  });

  it('allows overriding all properties', () => {
    const thread = createMockReviewThread({
      id: 'custom-id',
      entityId: 'custom-entity',
      uri: 'src/test.ts',
      status: 'outdated',
      range: {
        start: { line: 10, character: 5 },
        end: { line: 15, character: 20 },
      },
    });

    expect(thread.id).toBe('custom-id');
    expect(thread.entityId).toBe('custom-entity');
    expect(thread.uri).toBe('src/test.ts');
    expect(thread.status).toBe('outdated');
    expect(thread.range.start.line).toBe(10);
    expect(thread.range.end.line).toBe(15);
  });

  it('generates unique IDs for different calls', () => {
    const thread1 = createMockReviewThread();
    const thread2 = createMockReviewThread();
    expect(thread1.id).not.toBe(thread2.id);
    expect(thread1.entityId).not.toBe(thread2.entityId);
  });

  it('returns type-safe ReviewThread', () => {
    const thread: ReviewThread = createMockReviewThread();
    expect(thread).toBeDefined();
  });
});

describe('createMockDiffFile', () => {
  it('creates a default DiffFile with sample hunks', () => {
    const file = createMockDiffFile();

    expect(file.path).toBeDefined();
    expect(file.status).toBe('M');
    expect(file.additions).toBeGreaterThanOrEqual(0);
    expect(file.deletions).toBeGreaterThanOrEqual(0);
    expect(file.hunks).toBeInstanceOf(Array);
    expect(file.hunks.length).toBeGreaterThan(0);
  });

  it('includes hunks with lines', () => {
    const file = createMockDiffFile();
    const hunk = file.hunks[0];

    expect(hunk.oldStart).toBeDefined();
    expect(hunk.oldLines).toBeDefined();
    expect(hunk.newStart).toBeDefined();
    expect(hunk.newLines).toBeDefined();
    expect(hunk.lines).toBeInstanceOf(Array);
    expect(hunk.lines.length).toBeGreaterThan(0);
  });

  it('allows overriding path and status', () => {
    const file = createMockDiffFile({
      path: 'src/custom/file.ts',
      status: 'A',
    });

    expect(file.path).toBe('src/custom/file.ts');
    expect(file.status).toBe('A');
  });

  it('allows creating binary file', () => {
    const file = createMockDiffFile({
      path: 'assets/image.png',
      isBinary: true,
    });

    expect(file.isBinary).toBe(true);
  });

  it('returns type-safe DiffFile', () => {
    const file: DiffFile = createMockDiffFile();
    expect(file).toBeDefined();
  });
});

describe('createMockAnnotation', () => {
  it('creates a default comment annotation', () => {
    const annotation = createMockAnnotation();

    expect(annotation.id).toBeDefined();
    expect(annotation.type).toBe('comment');
    expect(annotation.body).toBeDefined();
    expect(annotation.author).toBeDefined();
    expect(annotation.author.type).toBe('human');
    expect(annotation.createdAt).toBeDefined();
    expect(annotation.updatedAt).toBeDefined();
  });

  it('allows creating LLM annotation', () => {
    const annotation = createMockAnnotation({
      author: { type: 'llm', name: 'Claude', agentId: 'claude-1' },
    });

    expect(annotation.author.type).toBe('llm');
    expect(annotation.author.name).toBe('Claude');
    expect(annotation.author.agentId).toBe('claude-1');
  });

  it('allows creating suggestion annotation', () => {
    const annotation = createMockAnnotation({
      type: 'suggestion',
      suggestion: { replacement: 'const x = 1;' },
    });

    expect(annotation.type).toBe('suggestion');
    expect(annotation.suggestion?.replacement).toBe('const x = 1;');
  });

  it('allows creating question annotation', () => {
    const annotation = createMockAnnotation({
      type: 'question',
      body: 'Why is this pattern used?',
    });

    expect(annotation.type).toBe('question');
    expect(annotation.body).toBe('Why is this pattern used?');
  });

  it('allows creating task annotation', () => {
    const annotation = createMockAnnotation({
      type: 'task',
      body: 'Fix this before merge',
    });

    expect(annotation.type).toBe('task');
  });

  it('allows creating approval annotation', () => {
    const annotation = createMockAnnotation({
      type: 'approval',
      body: 'LGTM',
    });

    expect(annotation.type).toBe('approval');
  });

  it('generates unique IDs for different calls', () => {
    const ann1 = createMockAnnotation();
    const ann2 = createMockAnnotation();
    expect(ann1.id).not.toBe(ann2.id);
  });

  it('returns type-safe ReviewAnnotation', () => {
    const annotation: ReviewAnnotation = createMockAnnotation();
    expect(annotation).toBeDefined();
  });
});

describe('createMockFileTreeItem', () => {
  it('creates a default FileTreeItem', () => {
    const item = createMockFileTreeItem();

    expect(item.path).toBeDefined();
    expect(item.name).toBeDefined();
    expect(item.status).toBe('M');
    expect(item.commentCount).toBe(0);
    expect(item.additions).toBeGreaterThanOrEqual(0);
    expect(item.deletions).toBeGreaterThanOrEqual(0);
  });

  it('extracts name from path', () => {
    const item = createMockFileTreeItem({
      path: 'src/components/Button.tsx',
    });

    expect(item.path).toBe('src/components/Button.tsx');
    expect(item.name).toBe('Button.tsx');
  });

  it('allows overriding all properties', () => {
    const item = createMockFileTreeItem({
      path: 'src/test.ts',
      status: 'A',
      commentCount: 5,
      additions: 100,
      deletions: 50,
    });

    expect(item.status).toBe('A');
    expect(item.commentCount).toBe(5);
    expect(item.additions).toBe(100);
    expect(item.deletions).toBe(50);
  });

  it('supports all file statuses', () => {
    const statuses: FileTreeItem['status'][] = ['A', 'M', 'D', 'R', 'C', 'U', 'B'];
    
    for (const status of statuses) {
      const item = createMockFileTreeItem({ status });
      expect(item.status).toBe(status);
    }
  });

  it('returns type-safe FileTreeItem', () => {
    const item: FileTreeItem = createMockFileTreeItem();
    expect(item).toBeDefined();
  });
});
