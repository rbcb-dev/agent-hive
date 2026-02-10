import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const rootDir = resolve(__dirname, '..', '..', '..', '..');
const rootPkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
const nxConfig = JSON.parse(readFileSync(resolve(rootDir, 'nx.json'), 'utf-8'));

describe('NX pipeline scripts for Storybook', () => {
  describe('root package.json scripts', () => {
    it('has nx:build-storybook script', () => {
      expect(rootPkg.scripts['nx:build-storybook']).toBeDefined();
      expect(rootPkg.scripts['nx:build-storybook']).toContain('build-storybook');
      expect(rootPkg.scripts['nx:build-storybook']).toContain('NX_TUI=false');
    });

    it('has nx:test-storybook script', () => {
      expect(rootPkg.scripts['nx:test-storybook']).toBeDefined();
      expect(rootPkg.scripts['nx:test-storybook']).toContain('test-storybook');
      expect(rootPkg.scripts['nx:test-storybook']).toContain('NX_TUI=false');
    });

    it('preserves existing nx scripts', () => {
      // Verify none of the pre-existing scripts were removed
      expect(rootPkg.scripts['nx:build']).toBeDefined();
      expect(rootPkg.scripts['nx:test']).toBeDefined();
      expect(rootPkg.scripts['nx:lint']).toBeDefined();
      expect(rootPkg.scripts['nx:graph']).toBeDefined();
      expect(rootPkg.scripts['nx:affected:build']).toBeDefined();
      expect(rootPkg.scripts['nx:affected:test']).toBeDefined();
      expect(rootPkg.scripts['nx:affected:lint']).toBeDefined();
      expect(rootPkg.scripts['format:check']).toBeDefined();
      expect(rootPkg.scripts['format:write']).toBeDefined();
      expect(rootPkg.scripts['build']).toBeDefined();
      expect(rootPkg.scripts['dev']).toBeDefined();
      expect(rootPkg.scripts['release:check']).toBeDefined();
    });
  });

  describe('nx.json targetDefaults', () => {
    it('has build-storybook target with caching enabled', () => {
      expect(nxConfig.targetDefaults['build-storybook']).toBeDefined();
      expect(nxConfig.targetDefaults['build-storybook'].cache).toBe(true);
    });

    it('has build-storybook with correct outputs', () => {
      const target = nxConfig.targetDefaults['build-storybook'];
      expect(target.outputs).toContain('{projectRoot}/storybook-static');
    });

    it('has build-storybook with inputs including storybook files', () => {
      const target = nxConfig.targetDefaults['build-storybook'];
      expect(target.inputs).toBeDefined();
      // Should include default inputs for source files
      expect(target.inputs).toContain('default');
      // Should include storybook config files
      const hasStorybookInput = target.inputs.some(
        (input: string) =>
          typeof input === 'string' && input.includes('.storybook')
      );
      expect(hasStorybookInput).toBe(true);
    });

    it('build-storybook is NOT in the build pipeline dependsOn', () => {
      // Storybook targets should be opt-in, not part of default build
      const buildTarget = nxConfig.targetDefaults['build'];
      const dependsOn = buildTarget.dependsOn || [];
      expect(dependsOn).not.toContain('build-storybook');
    });

    it('preserves existing targetDefaults for build, test, lint', () => {
      // Build target preserved
      expect(nxConfig.targetDefaults['build']).toBeDefined();
      expect(nxConfig.targetDefaults['build'].cache).toBe(true);
      expect(nxConfig.targetDefaults['build'].dependsOn).toContain('^build');

      // Test target preserved
      expect(nxConfig.targetDefaults['test']).toBeDefined();
      expect(nxConfig.targetDefaults['test'].cache).toBe(true);

      // Lint target preserved
      expect(nxConfig.targetDefaults['lint']).toBeDefined();
      expect(nxConfig.targetDefaults['lint'].cache).toBe(true);
    });
  });
});
