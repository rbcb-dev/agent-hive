/**
 * Tests for shared/diffUtils.ts — unified diff parsing and status mapping.
 */

import { describe, it, expect } from 'vitest';
import { parseDiffContent, mapFileStatus, mergeDetailedWithParsed } from '../../shared/diffUtils';
import type { TaskChangedFile, DiffFile } from 'hive-core';

describe('diffUtils', () => {
  describe('mapFileStatus', () => {
    it('maps added to A', () => {
      expect(mapFileStatus('added')).toBe('A');
    });

    it('maps modified to M', () => {
      expect(mapFileStatus('modified')).toBe('M');
    });

    it('maps deleted to D', () => {
      expect(mapFileStatus('deleted')).toBe('D');
    });

    it('maps renamed to R', () => {
      expect(mapFileStatus('renamed')).toBe('R');
    });
  });

  describe('parseDiffContent', () => {
    it('returns empty array for empty diff', () => {
      expect(parseDiffContent('')).toEqual([]);
      expect(parseDiffContent('   ')).toEqual([]);
    });

    it('parses a single modified file with one hunk', () => {
      const diff = `diff --git a/src/index.ts b/src/index.ts
index abc1234..def5678 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import { foo } from './foo';
+import { bar } from './bar';
 
 export function main() {
`;

      const files = parseDiffContent(diff);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('src/index.ts');
      expect(files[0].status).toBe('M');
      expect(files[0].additions).toBe(1);
      expect(files[0].deletions).toBe(0);
      expect(files[0].hunks).toHaveLength(1);
      expect(files[0].hunks[0].oldStart).toBe(1);
      expect(files[0].hunks[0].oldLines).toBe(3);
      expect(files[0].hunks[0].newStart).toBe(1);
      expect(files[0].hunks[0].newLines).toBe(4);
    });

    it('detects added file status from new file mode', () => {
      const diff = `diff --git a/src/new.ts b/src/new.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/new.ts
@@ -0,0 +1,3 @@
+export const x = 1;
+export const y = 2;
+export const z = 3;
`;

      const files = parseDiffContent(diff);
      expect(files).toHaveLength(1);
      expect(files[0].status).toBe('A');
      expect(files[0].additions).toBe(3);
      expect(files[0].deletions).toBe(0);
    });

    it('detects deleted file status', () => {
      const diff = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const x = 1;
-export const y = 2;
`;

      const files = parseDiffContent(diff);
      expect(files).toHaveLength(1);
      expect(files[0].status).toBe('D');
      expect(files[0].additions).toBe(0);
      expect(files[0].deletions).toBe(2);
    });

    it('parses multiple files in a single diff', () => {
      const diff = `diff --git a/src/a.ts b/src/a.ts
index abc..def 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,2 +1,3 @@
 line1
+added
 line2
diff --git a/src/b.ts b/src/b.ts
new file mode 100644
--- /dev/null
+++ b/src/b.ts
@@ -0,0 +1,1 @@
+new file content
`;

      const files = parseDiffContent(diff);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('src/a.ts');
      expect(files[0].status).toBe('M');
      expect(files[1].path).toBe('src/b.ts');
      expect(files[1].status).toBe('A');
    });

    it('parses multiple hunks in a single file', () => {
      const diff = `diff --git a/src/big.ts b/src/big.ts
index abc..def 100644
--- a/src/big.ts
+++ b/src/big.ts
@@ -1,3 +1,4 @@
 line1
+added-top
 line2
 line3
@@ -10,3 +11,4 @@
 line10
+added-bottom
 line11
 line12
`;

      const files = parseDiffContent(diff);
      expect(files).toHaveLength(1);
      expect(files[0].hunks).toHaveLength(2);
      expect(files[0].hunks[0].oldStart).toBe(1);
      expect(files[0].hunks[1].oldStart).toBe(10);
      expect(files[0].additions).toBe(2);
    });

    it('counts additions and deletions correctly with mixed changes', () => {
      const diff = `diff --git a/src/mix.ts b/src/mix.ts
index abc..def 100644
--- a/src/mix.ts
+++ b/src/mix.ts
@@ -1,4 +1,4 @@
 unchanged
-old line
+new line
 unchanged
-removed
+replaced
`;

      const files = parseDiffContent(diff);
      expect(files[0].additions).toBe(2);
      expect(files[0].deletions).toBe(2);
    });

    it('includes context lines in hunk output', () => {
      const diff = `diff --git a/src/ctx.ts b/src/ctx.ts
index abc..def 100644
--- a/src/ctx.ts
+++ b/src/ctx.ts
@@ -1,3 +1,4 @@
 before
+added
 after
 more
`;

      const files = parseDiffContent(diff);
      const hunk = files[0].hunks[0];
      expect(hunk.lines).toEqual([
        { type: 'context', content: 'before' },
        { type: 'add', content: 'added' },
        { type: 'context', content: 'after' },
        { type: 'context', content: 'more' },
      ]);
    });
  });

  describe('mergeDetailedWithParsed', () => {
    it('returns empty array when both inputs are empty', () => {
      expect(mergeDetailedWithParsed([], [])).toEqual([]);
    });

    it('uses detailed file status mapped through mapFileStatus', () => {
      const detailed: TaskChangedFile[] = [
        { path: 'src/new.ts', status: 'added', insertions: 3, deletions: 0 },
      ];
      const parsed: DiffFile[] = [
        {
          path: 'src/new.ts',
          status: 'A',
          additions: 3,
          deletions: 0,
          hunks: [{ oldStart: 0, oldLines: 0, newStart: 1, newLines: 3, lines: [
            { type: 'add', content: 'line1' },
            { type: 'add', content: 'line2' },
            { type: 'add', content: 'line3' },
          ]}],
        },
      ];

      const result = mergeDetailedWithParsed(detailed, parsed);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('A');
      expect(result[0].path).toBe('src/new.ts');
    });

    it('uses detailed stats (insertions/deletions) over parsed counts', () => {
      const detailed: TaskChangedFile[] = [
        { path: 'src/file.ts', status: 'modified', insertions: 10, deletions: 5 },
      ];
      const parsed: DiffFile[] = [
        {
          path: 'src/file.ts',
          status: 'M',
          additions: 8, // different from detailed
          deletions: 4, // different from detailed
          hunks: [{ oldStart: 1, oldLines: 5, newStart: 1, newLines: 10, lines: [] }],
        },
      ];

      const result = mergeDetailedWithParsed(detailed, parsed);
      expect(result[0].additions).toBe(10); // from detailed
      expect(result[0].deletions).toBe(5);  // from detailed
    });

    it('attaches hunks from parsed to matching detailed file', () => {
      const hunks = [
        { oldStart: 1, oldLines: 3, newStart: 1, newLines: 4, lines: [
          { type: 'context' as const, content: 'unchanged' },
          { type: 'add' as const, content: 'new' },
        ]},
      ];
      const detailed: TaskChangedFile[] = [
        { path: 'src/index.ts', status: 'modified', insertions: 1, deletions: 0 },
      ];
      const parsed: DiffFile[] = [
        { path: 'src/index.ts', status: 'M', additions: 1, deletions: 0, hunks },
      ];

      const result = mergeDetailedWithParsed(detailed, parsed);
      expect(result[0].hunks).toEqual(hunks);
    });

    it('produces file with empty hunks when no parsed match exists', () => {
      const detailed: TaskChangedFile[] = [
        { path: 'src/orphan.ts', status: 'modified', insertions: 1, deletions: 0 },
      ];
      const parsed: DiffFile[] = []; // no match

      const result = mergeDetailedWithParsed(detailed, parsed);
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('src/orphan.ts');
      expect(result[0].status).toBe('M');
      expect(result[0].hunks).toEqual([]);
    });

    it('handles multiple files with mixed matches', () => {
      const detailed: TaskChangedFile[] = [
        { path: 'a.ts', status: 'added', insertions: 2, deletions: 0 },
        { path: 'b.ts', status: 'deleted', insertions: 0, deletions: 3 },
        { path: 'c.ts', status: 'modified', insertions: 1, deletions: 1 },
      ];
      const parsed: DiffFile[] = [
        { path: 'a.ts', status: 'A', additions: 2, deletions: 0, hunks: [
          { oldStart: 0, oldLines: 0, newStart: 1, newLines: 2, lines: [
            { type: 'add', content: 'x' }, { type: 'add', content: 'y' },
          ]},
        ]},
        // b.ts not in parsed (maybe binary or no content)
        { path: 'c.ts', status: 'M', additions: 1, deletions: 1, hunks: [
          { oldStart: 1, oldLines: 2, newStart: 1, newLines: 2, lines: [
            { type: 'remove', content: 'old' }, { type: 'add', content: 'new' },
          ]},
        ]},
      ];

      const result = mergeDetailedWithParsed(detailed, parsed);
      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('A');
      expect(result[0].hunks).toHaveLength(1);
      expect(result[1].status).toBe('D');
      expect(result[1].hunks).toEqual([]); // no parsed match for b.ts
      expect(result[2].status).toBe('M');
      expect(result[2].hunks).toHaveLength(1);
    });

    it('handles renamed files with oldPath', () => {
      const detailed: TaskChangedFile[] = [
        { path: 'src/newName.ts', status: 'renamed', insertions: 0, deletions: 0, oldPath: 'src/oldName.ts' },
      ];
      const parsed: DiffFile[] = [
        { path: 'src/newName.ts', status: 'R', additions: 0, deletions: 0, hunks: [] },
      ];

      const result = mergeDetailedWithParsed(detailed, parsed);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('R');
      expect(result[0].path).toBe('src/newName.ts');
    });
  });
});
