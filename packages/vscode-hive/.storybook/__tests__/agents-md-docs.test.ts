import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(__dirname, '..', '..', '..', '..');
const agentsMd = readFileSync(resolve(rootDir, 'AGENTS.md'), 'utf-8');

describe('AGENTS.md NX documentation', () => {
  describe('Storybook scripts', () => {
    it('documents nx:build-storybook script', () => {
      expect(agentsMd).toContain('nx:build-storybook');
    });

    it('documents nx:test-storybook script', () => {
      expect(agentsMd).toContain('nx:test-storybook');
    });
  });

  describe('Build clarification', () => {
    it('explains difference between bun run build and bun run nx:build', () => {
      // Should explain that bun run build is sequential/non-NX
      // and bun run nx:build is NX-orchestrated with dependency graph
      expect(agentsMd).toContain('bun run build');
      expect(agentsMd).toContain('bun run nx:build');
      // Should clarify the distinction explicitly
      expect(agentsMd).toMatch(
        /sequential|non-NX|without NX|direct.*sequential/i
      );
    });
  });

  describe('vscode-hive build pipeline', () => {
    it('documents that vscode-hive build includes vite webview build', () => {
      // Should mention that vscode-hive build now includes vite/webview build
      expect(agentsMd).toMatch(/vite.*build|webview.*build|vite:build/i);
    });
  });
});
