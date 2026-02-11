/**
 * Mock data factories for Storybook stories
 *
 * These factories create type-safe mock data for testing components
 * that depend on hive-core types like ReviewThread, DiffFile, etc.
 */

import type {
  ReviewThread,
  ReviewAnnotation,
  DiffFile,
  DiffHunk,
  ThreadStatus,
  AnnotationType,
  Range,
} from 'hive-core';

// Counter for generating unique IDs
let idCounter = 0;

/**
 * Generate a unique ID with optional prefix
 */
function uniqueId(prefix = 'mock'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Get current ISO timestamp
 */
function now(): string {
  return new Date().toISOString();
}

// =============================================================================
// ReviewThread Factory
// =============================================================================

export interface CreateMockReviewThreadOptions {
  id?: string;
  entityId?: string;
  uri?: string | null;
  range?: Range;
  status?: ThreadStatus;
  createdAt?: string;
  updatedAt?: string;
  annotations?: ReviewAnnotation[];
}

/**
 * Create a mock ReviewThread with sensible defaults
 *
 * @example
 * const thread = createMockReviewThread();
 * const resolved = createMockReviewThread({ status: 'resolved' });
 */
export function createMockReviewThread(
  options: CreateMockReviewThreadOptions = {},
): ReviewThread {
  const timestamp = now();

  return {
    id: options.id ?? uniqueId('thread'),
    entityId: options.entityId ?? uniqueId('entity'),
    uri: options.uri !== undefined ? options.uri : null,
    range: options.range ?? {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
    status: options.status ?? 'open',
    createdAt: options.createdAt ?? timestamp,
    updatedAt: options.updatedAt ?? timestamp,
    annotations: options.annotations ?? [],
  };
}

// =============================================================================
// ReviewAnnotation Factory
// =============================================================================

export interface CreateMockAnnotationOptions {
  id?: string;
  type?: AnnotationType;
  body?: string;
  author?: ReviewAnnotation['author'];
  createdAt?: string;
  updatedAt?: string;
  suggestion?: { replacement: string };
  meta?: ReviewAnnotation['meta'];
}

/**
 * Create a mock ReviewAnnotation with sensible defaults
 *
 * @example
 * const comment = createMockAnnotation();
 * const suggestion = createMockAnnotation({
 *   type: 'suggestion',
 *   suggestion: { replacement: 'const x = 1;' }
 * });
 * const llmComment = createMockAnnotation({
 *   author: { type: 'llm', name: 'Claude', agentId: 'claude-1' }
 * });
 */
export function createMockAnnotation(
  options: CreateMockAnnotationOptions = {},
): ReviewAnnotation {
  const timestamp = now();

  return {
    id: options.id ?? uniqueId('annotation'),
    type: options.type ?? 'comment',
    body: options.body ?? 'This is a mock annotation body.',
    author: options.author ?? { type: 'human', name: 'Reviewer' },
    createdAt: options.createdAt ?? timestamp,
    updatedAt: options.updatedAt ?? timestamp,
    suggestion: options.suggestion,
    meta: options.meta,
  };
}

// =============================================================================
// DiffFile Factory
// =============================================================================

export interface CreateMockDiffFileOptions {
  path?: string;
  status?: DiffFile['status'];
  additions?: number;
  deletions?: number;
  isBinary?: boolean;
  hunks?: DiffHunk[];
}

/**
 * Create a sample diff hunk with realistic content
 */
function createSampleHunk(startLine: number = 1): DiffHunk {
  return {
    oldStart: startLine,
    oldLines: 5,
    newStart: startLine,
    newLines: 6,
    lines: [
      { type: 'context', content: 'import React from "react";' },
      { type: 'context', content: '' },
      { type: 'remove', content: 'function OldComponent() {' },
      { type: 'add', content: 'function NewComponent() {' },
      { type: 'add', content: '  const [state, setState] = useState(0);' },
      { type: 'context', content: '  return <div>Hello</div>;' },
      { type: 'context', content: '}' },
    ],
  };
}

/**
 * Create a mock DiffFile with sample hunks
 *
 * @example
 * const file = createMockDiffFile();
 * const added = createMockDiffFile({ path: 'src/new.ts', status: 'A' });
 * const binary = createMockDiffFile({ path: 'image.png', isBinary: true });
 */
export function createMockDiffFile(
  options: CreateMockDiffFileOptions = {},
): DiffFile {
  const hunks = options.hunks ?? [createSampleHunk()];

  // Calculate additions/deletions from hunks if not provided
  let additions = options.additions ?? 0;
  let deletions = options.deletions ?? 0;

  if (options.additions === undefined || options.deletions === undefined) {
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') additions++;
        if (line.type === 'remove') deletions++;
      }
    }
  }

  return {
    path: options.path ?? 'src/components/Example.tsx',
    status: options.status ?? 'M',
    additions,
    deletions,
    isBinary: options.isBinary,
    hunks: options.isBinary ? [] : hunks,
  };
}
