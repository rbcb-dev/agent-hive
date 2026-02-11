/**
 * FeatureSidebar types
 *
 * Types used internally by the FeatureSidebar compound component.
 */
import type { DiffPayload } from 'hive-core';
/**
 * Diff status codes for file changes.
 * A=Added, M=Modified, D=Deleted, R=Renamed, C=Copied
 */
export type DiffStatus = 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | 'B';
/**
 * Status color mapping
 */
export declare const STATUS_COLORS: Record<DiffStatus, string>;
/**
 * Status labels for display
 */
export declare const STATUS_LABELS: Record<DiffStatus, string>;
/**
 * A resolved changed file entry for display.
 */
export interface ChangedFileEntry {
    /** File path (new path for renames) */
    path: string;
    /** Old path (only for renames) */
    oldPath?: string;
    /** Diff status */
    status: DiffStatus;
    /** Lines added */
    additions: number;
    /** Lines deleted */
    deletions: number;
    /** Task folder this diff came from */
    taskFolder: string;
}
/**
 * Aggregates DiffPayloads across tasks for feature-level display.
 *
 * When the same file appears in multiple tasks, the latest task's diff wins
 * (determined by task order — later keys in the Map are considered later).
 *
 * @param fileChanges Map of taskFolder → DiffPayload[]
 * @param activeTask If set, only show files from this task
 * @returns Sorted list of ChangedFileEntry
 */
export declare function aggregateChangedFiles(fileChanges: Map<string, DiffPayload[]>, activeTask: string | null): ChangedFileEntry[];
