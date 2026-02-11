/**
 * FeatureSidebar types
 *
 * Types used internally by the FeatureSidebar compound component.
 */

import type { DiffFile, DiffPayload } from 'hive-core';

/**
 * Diff status codes for file changes.
 * A=Added, M=Modified, D=Deleted, R=Renamed, C=Copied
 */
export type DiffStatus = 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | 'B';

/**
 * Status color mapping
 */
export const STATUS_COLORS: Record<DiffStatus, string> = {
  A: '#3fb950', // green — added
  M: '#58a6ff', // blue — modified
  D: '#f85149', // red — deleted
  R: '#d29922', // orange — renamed
  C: '#a371f7', // purple — copied
  U: '#8b949e', // gray — unmerged
  B: '#8b949e', // gray — binary
};

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<DiffStatus, string> = {
  A: 'Added',
  M: 'Modified',
  D: 'Deleted',
  R: 'Renamed',
  C: 'Copied',
  U: 'Unmerged',
  B: 'Binary',
};

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
export function aggregateChangedFiles(
  fileChanges: Map<string, DiffPayload[]>,
  activeTask: string | null,
): ChangedFileEntry[] {
  if (activeTask) {
    // Task-level: show only that task's files
    const payloads = fileChanges.get(activeTask) ?? [];
    return flattenPayloads(payloads, activeTask);
  }

  // Feature-level: collect all, latest task wins for duplicates
  const byPath = new Map<string, ChangedFileEntry>();

  for (const [taskFolder, payloads] of fileChanges) {
    const entries = flattenPayloads(payloads, taskFolder);
    for (const entry of entries) {
      // Later tasks overwrite earlier ones (Map iteration order is insertion order)
      byPath.set(entry.path, entry);
    }
  }

  // Sort alphabetically by path
  return Array.from(byPath.values()).sort((a, b) =>
    a.path.localeCompare(b.path),
  );
}

/**
 * Flatten DiffPayload[] into ChangedFileEntry[]
 */
function flattenPayloads(
  payloads: DiffPayload[],
  taskFolder: string,
): ChangedFileEntry[] {
  const entries: ChangedFileEntry[] = [];

  for (const payload of payloads) {
    for (const file of payload.files) {
      entries.push({
        path: file.path,
        oldPath: (file as DiffFile & { oldPath?: string }).oldPath,
        status: file.status as DiffStatus,
        additions: file.additions,
        deletions: file.deletions,
        taskFolder,
      });
    }
  }

  // Sort alphabetically
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}
