/**
 * Utilities for parsing unified diff output into structured DiffFile/DiffHunk types.
 *
 * Used by reviewPanel.ts to upgrade diff payloads from hard-coded stubs
 * to real hunks, file statuses, and per-file stats.
 */

import type { DiffFile, DiffHunk, DiffHunkLine, TaskChangedFile } from 'hive-core';

/**
 * Map TaskChangedFile.status (word form) to DiffFile.status (git letter code).
 */
export function mapFileStatus(status: TaskChangedFile['status']): DiffFile['status'] {
  switch (status) {
    case 'added':
      return 'A';
    case 'modified':
      return 'M';
    case 'deleted':
      return 'D';
    case 'renamed':
      return 'R';
    default:
      return 'M';
  }
}

/**
 * Merge detailed file stats (from getDetailedDiff / --numstat) with parsed hunks
 * (from parseDiffContent). The detailed source provides authoritative status and
 * insertion/deletion counts, while parsed provides the structured hunk data.
 *
 * For each detailed file, find the matching parsed file by path and attach its hunks.
 * Files without a parsed match get empty hunks.
 */
export function mergeDetailedWithParsed(
  detailedFiles: TaskChangedFile[],
  parsedFiles: DiffFile[],
): DiffFile[] {
  // Build a lookup by path for O(1) matching
  const parsedByPath = new Map<string, DiffFile>();
  for (const pf of parsedFiles) {
    parsedByPath.set(pf.path, pf);
  }

  return detailedFiles.map((df) => {
    const parsed = parsedByPath.get(df.path);
    return {
      path: df.path,
      status: mapFileStatus(df.status),
      additions: df.insertions,
      deletions: df.deletions,
      hunks: parsed?.hunks ?? [],
    };
  });
}

/**
 * Parse unified diff content into an array of DiffFile objects.
 *
 * Handles standard `git diff` output with `diff --git a/... b/...` headers,
 * `--- a/...` / `+++ b/...` file indicators, and `@@` hunk headers.
 */
export function parseDiffContent(diffContent: string): DiffFile[] {
  if (!diffContent.trim()) {
    return [];
  }

  const files: DiffFile[] = [];
  // Split on "diff --git" boundaries
  const fileSections = diffContent.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const lines = section.split('\n');

    // First line: "a/path b/path"
    const headerLine = lines[0];
    const pathMatch = headerLine.match(/^a\/(.+?)\s+b\/(.+)/);
    if (!pathMatch) continue;

    const oldPath = pathMatch[1];
    const newPath = pathMatch[2];

    // Determine file status from diff metadata
    let status: DiffFile['status'] = 'M';
    let isBinary = false;

    for (const line of lines.slice(1)) {
      if (line.startsWith('new file mode')) {
        status = 'A';
      } else if (line.startsWith('deleted file mode')) {
        status = 'D';
      } else if (line.startsWith('rename from') || line.startsWith('similarity index')) {
        status = 'R';
      } else if (line.startsWith('Binary files')) {
        isBinary = true;
      }
      // Stop scanning metadata when we hit the --- line or a hunk header
      if (line.startsWith('--- ') || line.startsWith('@@')) break;
    }

    // Parse hunks
    const hunks = parseHunks(lines);

    // Count additions/deletions from hunks
    let additions = 0;
    let deletions = 0;
    for (const hunk of hunks) {
      for (const hunkLine of hunk.lines) {
        if (hunkLine.type === 'add') additions++;
        else if (hunkLine.type === 'remove') deletions++;
      }
    }

    const file: DiffFile = {
      path: newPath || oldPath,
      status,
      additions,
      deletions,
      hunks,
    };

    if (isBinary) {
      file.isBinary = true;
    }

    files.push(file);
  }

  return files;
}

/**
 * Parse `@@` hunk sections from a file's diff lines.
 */
function parseHunks(lines: string[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    // Match hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    const hunkMatch = line.match(
      /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/,
    );

    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      currentHunk = {
        oldStart: parseInt(hunkMatch[1], 10),
        oldLines: hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1,
        newStart: parseInt(hunkMatch[3], 10),
        newLines: hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1,
        lines: [],
      };
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('+')) {
      currentHunk.lines.push({ type: 'add', content: line.slice(1) });
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({ type: 'remove', content: line.slice(1) });
    } else if (line.startsWith(' ')) {
      currentHunk.lines.push({ type: 'context', content: line.slice(1) });
    }
    // Ignore lines starting with '\' (no newline at end of file markers)
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}
