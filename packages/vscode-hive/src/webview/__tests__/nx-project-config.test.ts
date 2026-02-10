import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../../..');

interface ProjectJson {
  name: string;
  includedScripts: string[];
  projectType: string;
  targets: Record<string, unknown>;
}

interface PackageJson {
  nx?: {
    includedScripts?: string[];
  };
}

function readProjectJson(): ProjectJson {
  const raw = readFileSync(resolve(projectRoot, 'project.json'), 'utf-8');
  return JSON.parse(raw);
}

function readPackageJson(): PackageJson {
  const raw = readFileSync(resolve(projectRoot, 'package.json'), 'utf-8');
  return JSON.parse(raw);
}

describe('NX project configuration', () => {
  describe('includedScripts', () => {
    it('does not include test:webview (redundant with explicit test target)', () => {
      const project = readProjectJson();
      expect(project.includedScripts).not.toContain('test:webview');
    });

    it('preserves build in includedScripts', () => {
      const project = readProjectJson();
      expect(project.includedScripts).toContain('build');
    });

    it('preserves format:check in includedScripts', () => {
      const project = readProjectJson();
      expect(project.includedScripts).toContain('format:check');
    });

    it('preserves format:write in includedScripts', () => {
      const project = readProjectJson();
      expect(project.includedScripts).toContain('format:write');
    });

    it('package.json nx.includedScripts matches project.json', () => {
      const project = readProjectJson();
      const pkg = readPackageJson();
      expect(pkg.nx?.includedScripts).toEqual(project.includedScripts);
    });
  });

  describe('test target', () => {
    it('has explicit test target with @nx/vitest:test executor', () => {
      const project = readProjectJson();
      const testTarget = project.targets.test as Record<string, unknown>;
      expect(testTarget).toBeDefined();
      expect(testTarget.executor).toBe('@nx/vitest:test');
    });
  });

  describe('projectType', () => {
    it('is set to application (VS Code extension is an app, not a library)', () => {
      const project = readProjectJson();
      expect(project.projectType).toBe('application');
    });
  });
});
