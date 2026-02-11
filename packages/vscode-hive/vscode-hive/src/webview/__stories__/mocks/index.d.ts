/**
 * Mock data factories for Storybook stories
 *
 * These factories create type-safe mock data for testing components
 * that depend on hive-core types like ReviewThread, DiffFile, etc.
 */
import type { ReviewThread, ReviewAnnotation, DiffFile, DiffHunk, ThreadStatus, AnnotationType, Range } from 'hive-core';
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
export declare function createMockReviewThread(options?: CreateMockReviewThreadOptions): ReviewThread;
export interface CreateMockAnnotationOptions {
    id?: string;
    type?: AnnotationType;
    body?: string;
    author?: ReviewAnnotation['author'];
    createdAt?: string;
    updatedAt?: string;
    suggestion?: {
        replacement: string;
    };
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
export declare function createMockAnnotation(options?: CreateMockAnnotationOptions): ReviewAnnotation;
export interface CreateMockDiffFileOptions {
    path?: string;
    status?: DiffFile['status'];
    additions?: number;
    deletions?: number;
    isBinary?: boolean;
    hunks?: DiffHunk[];
}
/**
 * Create a mock DiffFile with sample hunks
 *
 * @example
 * const file = createMockDiffFile();
 * const added = createMockDiffFile({ path: 'src/new.ts', status: 'A' });
 * const binary = createMockDiffFile({ path: 'image.png', isBinary: true });
 */
export declare function createMockDiffFile(options?: CreateMockDiffFileOptions): DiffFile;
