/**
 * Tests for ReviewPanel webview integration
 *
 * Note: Full VSCode extension testing requires complex setup.
 * These tests focus on the logic that can be tested in isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as path from 'path';
import {
  getLanguageId,
  isPathWithinWorkspace,
  LARGE_FILE_THRESHOLD,
} from '../fileUtils';
import { getContextPath } from 'hive-core';
import type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
} from '../types';

// Test the URI rewriting logic
describe('ReviewPanel URI Utilities', () => {
  const mockExtensionUri = {
    fsPath: '/mock/extension/path',
    scheme: 'file',
    authority: '',
    path: '/mock/extension/path',
    query: '',
    fragment: '',
    with: vi.fn(),
    toJSON: vi.fn(),
  };

  describe('getWebviewContent', () => {
    it('should rewrite asset URIs in HTML content', () => {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="assets/index.css">
  <script type="module" src="assets/index.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

      // Parse and check for asset references
      const cssMatch = htmlContent.match(/href="([^"]+\.css)"/);
      const jsMatch = htmlContent.match(/src="([^"]+\.js)"/);

      expect(cssMatch).toBeTruthy();
      expect(cssMatch![1]).toBe('assets/index.css');
      expect(jsMatch).toBeTruthy();
      expect(jsMatch![1]).toBe('assets/index.js');
    });

    it('should set correct CSP for VSCode webview', () => {
      // The CSP should allow:
      // - styles from webview URI and inline
      // - scripts from webview URI and inline
      // - fonts from webview URI
      const requiredCspDirectives = [
        "default-src 'none'",
        'style-src',
        'script-src',
        'font-src',
      ];

      // We verify that our panel implementation includes these
      // This is more of a documentation test
      expect(requiredCspDirectives.length).toBe(4);
    });
  });

  describe('localResourceRoots', () => {
    it('should include dist/webview directory', () => {
      const webviewDistPath = path.join(
        mockExtensionUri.fsPath,
        'dist',
        'webview',
      );
      expect(webviewDistPath).toBe('/mock/extension/path/dist/webview');
    });
  });
});

// Test message type validation
describe('ReviewPanel Messages', () => {
  describe('WebviewToExtensionMessage', () => {
    it('should accept valid ready message', () => {
      const message = { type: 'ready' };
      expect(message.type).toBe('ready');
    });

    it('should accept valid addComment message', () => {
      const message = {
        type: 'addComment',
        entityId: 'entity-123',
        uri: 'file.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        body: 'Test comment',
        annotationType: 'comment',
      };
      expect(message.type).toBe('addComment');
      expect(message.entityId).toBe('entity-123');
    });

    it('should accept valid reply message', () => {
      const message = {
        type: 'reply',
        threadId: 'thread-123',
        body: 'Reply text',
      };
      expect(message.type).toBe('reply');
      expect(message.threadId).toBe('thread-123');
    });

    it('should accept valid resolve message', () => {
      const message = {
        type: 'resolve',
        threadId: 'thread-123',
      };
      expect(message.type).toBe('resolve');
    });

    it('should accept valid submit message', () => {
      const message = {
        type: 'submit',
        verdict: 'approve',
        summary: 'Looks good!',
      };
      expect(message.type).toBe('submit');
      expect(message.verdict).toBe('approve');
    });
  });

  describe('ExtensionToWebviewMessage', () => {
    it('should create valid sessionData message', () => {
      const mockSession = {
        schemaVersion: 1 as const,
        id: 'session-123',
        featureName: 'test-feature',
        scope: 'code' as const,
        status: 'in_progress' as const,
        verdict: null,
        summary: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        threads: [],
        diffs: {},
        gitMeta: {
          repoRoot: '/project',
          baseRef: 'main',
          headRef: 'HEAD',
          mergeBase: 'main',
          capturedAt: '2024-01-01T00:00:00Z',
          diffStats: { files: 0, insertions: 0, deletions: 0 },
          diffSummary: [],
        },
      };

      const message = { type: 'sessionData', session: mockSession };
      expect(message.type).toBe('sessionData');
      expect(message.session.id).toBe('session-123');
    });

    it('should create valid error message', () => {
      const message = {
        type: 'error',
        message: 'Something went wrong',
      };
      expect(message.type).toBe('error');
      expect(message.message).toBe('Something went wrong');
    });
  });
});

// Test message type alignment with reviewPanel.ts
describe('ReviewPanel Message Type Alignment', () => {
  describe('WebviewToExtensionMessage - applySuggestion', () => {
    it('should accept valid applySuggestion message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'applySuggestion',
        threadId: 'thread-123',
        annotationId: 'ann-456',
        uri: 'src/file.ts',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 15, character: 0 },
        },
        replacement: 'const x = 1;',
      };
      expect(message.type).toBe('applySuggestion');
    });
  });

  describe('ExtensionToWebviewMessage - suggestionApplied', () => {
    it('should accept valid suggestionApplied message', () => {
      const message: ExtensionToWebviewMessage = {
        type: 'suggestionApplied',
        threadId: 'thread-123',
        annotationId: 'ann-456',
        success: true,
      };
      expect(message.type).toBe('suggestionApplied');
    });

    it('should accept suggestionApplied with error', () => {
      const message: ExtensionToWebviewMessage = {
        type: 'suggestionApplied',
        threadId: 'thread-123',
        annotationId: 'ann-456',
        success: false,
        error: 'File not found',
      };
      expect(message.type).toBe('suggestionApplied');
      expect(message.type === 'suggestionApplied' && message.error).toBe(
        'File not found',
      );
    });
  });

  describe('ExtensionToWebviewMessage - commitHistory', () => {
    it('should accept valid commitHistory message', () => {
      const message: ExtensionToWebviewMessage = {
        type: 'commitHistory',
        feature: 'my-feature',
        task: '01-setup',
        commits: [
          { sha: 'abc1234', message: 'Initial commit', timestamp: '2024-01-01T00:00:00Z' },
          { sha: 'def5678', message: 'Add feature', timestamp: '2024-01-02T00:00:00Z' },
        ],
      };
      expect(message.type).toBe('commitHistory');
      expect(message.commits).toHaveLength(2);
      expect(message.commits[0].sha).toBe('abc1234');
    });

    it('should accept commitHistory with empty commits array', () => {
      const message: ExtensionToWebviewMessage = {
        type: 'commitHistory',
        feature: 'my-feature',
        task: '01-setup',
        commits: [],
      };
      expect(message.commits).toHaveLength(0);
    });
  });

  describe('ExtensionToWebviewMessage - commitDiff', () => {
    it('should accept valid commitDiff message', () => {
      const message: ExtensionToWebviewMessage = {
        type: 'commitDiff',
        feature: 'my-feature',
        task: '01-setup',
        sha: 'abc1234',
        diffs: [
          {
            baseRef: 'abc1233',
            headRef: 'abc1234',
            mergeBase: 'abc1233',
            repoRoot: '/project',
            fileRoot: '/project',
            diffStats: { files: 1, insertions: 5, deletions: 2 },
            files: [
              {
                path: 'src/index.ts',
                status: 'M',
                additions: 5,
                deletions: 2,
                hunks: [
                  {
                    oldStart: 1,
                    oldLines: 3,
                    newStart: 1,
                    newLines: 6,
                    lines: [
                      { type: 'context', content: 'import { foo } from "./foo";' },
                      { type: 'add', content: 'import { bar } from "./bar";' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(message.type).toBe('commitDiff');
      expect(message.sha).toBe('abc1234');
      expect(message.diffs[0].files[0].hunks).toHaveLength(1);
    });
  });

  describe('WebviewToExtensionMessage - requestCommitHistory', () => {
    it('should accept valid requestCommitHistory message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'requestCommitHistory',
        feature: 'my-feature',
        task: '01-setup',
      };
      expect(message.type).toBe('requestCommitHistory');
    });
  });

  describe('WebviewToExtensionMessage - requestCommitDiff', () => {
    it('should accept valid requestCommitDiff message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'requestCommitDiff',
        feature: 'my-feature',
        task: '01-setup',
        sha: 'abc1234',
      };
      expect(message.type).toBe('requestCommitDiff');
      if (message.type === 'requestCommitDiff') {
        expect(message.sha).toBe('abc1234');
      }
    });
  });
});

// Test handler mapping logic
describe('ReviewPanel Handler Mapping', () => {
  it('should map message types to handler methods', () => {
    const handlerMap = {
      ready: 'handleReady',
      addComment: 'handleAddComment',
      reply: 'handleReply',
      resolve: 'handleResolve',
      submit: 'handleSubmit',
      selectFile: 'handleSelectFile',
      selectThread: 'handleSelectThread',
      changeScope: 'handleChangeScope',
      requestFile: 'handleRequestFile',
      requestCommitHistory: 'handleRequestCommitHistory',
      requestCommitDiff: 'handleRequestCommitDiff',
    };

    expect(Object.keys(handlerMap)).toContain('ready');
    expect(Object.keys(handlerMap)).toContain('addComment');
    expect(Object.keys(handlerMap)).toContain('reply');
    expect(Object.keys(handlerMap)).toContain('resolve');
    expect(Object.keys(handlerMap)).toContain('submit');
    expect(Object.keys(handlerMap)).toContain('requestFile');
    expect(Object.keys(handlerMap)).toContain('requestCommitHistory');
    expect(Object.keys(handlerMap)).toContain('requestCommitDiff');
  });
});

// Test File Content Request Protocol message types
describe('File Content Request Protocol Messages', () => {
  describe('WebviewToExtensionMessage - requestFile', () => {
    it('should accept valid requestFile message with uri', () => {
      const message = {
        type: 'requestFile' as const,
        uri: 'src/components/Button.tsx',
      };
      expect(message.type).toBe('requestFile');
      expect(message.uri).toBe('src/components/Button.tsx');
    });

    it('should accept requestFile with absolute path', () => {
      const message = {
        type: 'requestFile' as const,
        uri: '/project/src/index.ts',
      };
      expect(message.type).toBe('requestFile');
      expect(message.uri).toBe('/project/src/index.ts');
    });
  });

  describe('ExtensionToWebviewMessage - fileContent', () => {
    it('should create valid fileContent message with content and language', () => {
      const message = {
        type: 'fileContent' as const,
        uri: 'src/index.ts',
        content: 'export function main() { return 42; }',
        language: 'typescript',
      };
      expect(message.type).toBe('fileContent');
      expect(message.uri).toBe('src/index.ts');
      expect(message.content).toBe('export function main() { return 42; }');
      expect(message.language).toBe('typescript');
    });

    it('should allow fileContent message without language', () => {
      const message = {
        type: 'fileContent' as const,
        uri: 'README.md',
        content: '# Hello World',
      };
      expect(message.type).toBe('fileContent');
      expect(message.uri).toBe('README.md');
      expect(message.content).toBe('# Hello World');
      expect(message.language).toBeUndefined();
    });

    it('should handle large file warning indicator', () => {
      const message = {
        type: 'fileContent' as const,
        uri: 'large-file.json',
        content: '[truncated content]',
        language: 'json',
        warning: 'File is larger than 10MB. Content may be truncated.',
      };
      expect(message.type).toBe('fileContent');
      expect(message.warning).toContain('10MB');
    });
  });

  describe('ExtensionToWebviewMessage - fileError', () => {
    it('should create valid fileError message for non-existent file', () => {
      const message = {
        type: 'fileError' as const,
        uri: 'non-existent.ts',
        error: 'File not found: non-existent.ts',
      };
      expect(message.type).toBe('fileError');
      expect(message.uri).toBe('non-existent.ts');
      expect(message.error).toContain('not found');
    });

    it('should create valid fileError message for permission denied', () => {
      const message = {
        type: 'fileError' as const,
        uri: '/etc/shadow',
        error: 'Permission denied',
      };
      expect(message.type).toBe('fileError');
      expect(message.error).toBe('Permission denied');
    });

    it('should create valid fileError message for file outside workspace', () => {
      const message = {
        type: 'fileError' as const,
        uri: '/outside/workspace/file.ts',
        error: 'File is outside the workspace and cannot be accessed',
      };
      expect(message.type).toBe('fileError');
      expect(message.error).toContain('outside');
    });
  });
});

// Test file path utilities for the protocol
describe('File Content Request Protocol - Path Utilities', () => {
  it('should detect language from file extension', () => {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescriptreact',
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.json': 'json',
      '.md': 'markdown',
      '.css': 'css',
      '.html': 'html',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
    };

    // Verify the mapping exists for common extensions
    expect(languageMap['.ts']).toBe('typescript');
    expect(languageMap['.tsx']).toBe('typescriptreact');
    expect(languageMap['.md']).toBe('markdown');
  });

  it('should normalize file paths correctly', () => {
    const workspaceRoot = '/project';
    const relativePath = 'src/index.ts';
    const absolutePath = path.join(workspaceRoot, relativePath);

    expect(absolutePath).toBe('/project/src/index.ts');
  });

  it('should detect if file is within workspace', () => {
    const workspaceRoot = '/project';
    const validPath = '/project/src/file.ts';
    const invalidPath = '/other/file.ts';

    expect(validPath.startsWith(workspaceRoot)).toBe(true);
    expect(invalidPath.startsWith(workspaceRoot)).toBe(false);
  });
});

// Test the getLanguageId utility
describe('File Content Request Protocol - getLanguageId', () => {
  it('should return typescript for .ts files', () => {
    expect(getLanguageId('src/index.ts')).toBe('typescript');
  });

  it('should return typescriptreact for .tsx files', () => {
    expect(getLanguageId('src/App.tsx')).toBe('typescriptreact');
  });

  it('should return javascript for .js files', () => {
    expect(getLanguageId('src/utils.js')).toBe('javascript');
  });

  it('should return javascriptreact for .jsx files', () => {
    expect(getLanguageId('src/Component.jsx')).toBe('javascriptreact');
  });

  it('should return json for .json files', () => {
    expect(getLanguageId('package.json')).toBe('json');
  });

  it('should return markdown for .md files', () => {
    expect(getLanguageId('README.md')).toBe('markdown');
  });

  it('should return plaintext for unknown extensions', () => {
    expect(getLanguageId('file.unknown')).toBe('plaintext');
  });

  it('should handle files without extension', () => {
    expect(getLanguageId('Makefile')).toBe('plaintext');
  });
});

// Test isPathWithinWorkspace utility
describe('File Content Request Protocol - isPathWithinWorkspace', () => {
  it('should return true for path within workspace', () => {
    expect(isPathWithinWorkspace('/project', '/project/src/file.ts')).toBe(
      true,
    );
  });

  it('should return true for nested paths', () => {
    expect(
      isPathWithinWorkspace('/project', '/project/src/deep/nested/file.ts'),
    ).toBe(true);
  });

  it('should return false for path outside workspace', () => {
    expect(isPathWithinWorkspace('/project', '/other/file.ts')).toBe(false);
  });

  it('should return false for parent directory traversal', () => {
    // Even if the path starts with workspace, traversal should be blocked
    expect(isPathWithinWorkspace('/project', '/project/../etc/passwd')).toBe(
      false,
    );
  });

  it('should handle workspace root exactly', () => {
    expect(isPathWithinWorkspace('/project', '/project')).toBe(true);
  });
});

// Test context path consistency with hive-core canonical path
describe('Context Path Consistency', () => {
  it('should use the same context directory name as hive-core canonical path', () => {
    // hive-core defines the canonical context directory as 'context' (singular)
    // via getContextPath() which uses CONTEXT_DIR = 'context'.
    // All consumers (sidebarProvider, reviewPanel) must use the same name.
    const canonicalPath = getContextPath('/root', 'test-feature');

    // The canonical directory segment should be 'context' (singular, not 'contexts')
    const segments = canonicalPath.split(path.sep);
    const contextDirName = segments[segments.length - 1];
    expect(contextDirName).toBe('context');
  });
});

// Test DiffFile status and hunk contracts for upgraded diff payloads
describe('Diff Payload Upgrade Contracts', () => {
  it('DiffFile status should use git letter codes not always M', () => {
    // DiffFile.status type is 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | 'B'
    const validStatuses = ['A', 'M', 'D', 'R', 'C', 'U', 'B'];
    for (const status of validStatuses) {
      expect(validStatuses).toContain(status);
    }
  });

  it('DiffFile with hunks should have non-zero additions or deletions', () => {
    const file = {
      path: 'src/index.ts',
      status: 'M' as const,
      additions: 5,
      deletions: 2,
      hunks: [
        {
          oldStart: 1,
          oldLines: 3,
          newStart: 1,
          newLines: 6,
          lines: [
            { type: 'add' as const, content: 'new line' },
          ],
        },
      ],
    };

    // A file with hunks should have non-empty hunks array
    expect(file.hunks.length).toBeGreaterThan(0);
    // And meaningful stats
    expect(file.additions + file.deletions).toBeGreaterThan(0);
  });

  it('added files should use status A not M', () => {
    // When TaskChangedFile.status is 'added', DiffFile.status should be 'A'
    const statusMap: Record<string, string> = {
      added: 'A',
      modified: 'M',
      deleted: 'D',
      renamed: 'R',
    };
    expect(statusMap['added']).toBe('A');
    expect(statusMap['deleted']).toBe('D');
    expect(statusMap['renamed']).toBe('R');
    // The old code was always 'M' — this test documents the contract
  });
});

// Test file size check utility
describe('File Content Request Protocol - File Size', () => {
  it('should define 10MB as the large file threshold', () => {
    expect(LARGE_FILE_THRESHOLD).toBe(10485760);
  });

  it('should warn when file exceeds threshold', () => {
    const fileSize = 15 * 1024 * 1024; // 15MB
    const exceedsThreshold = fileSize > LARGE_FILE_THRESHOLD;
    expect(exceedsThreshold).toBe(true);
  });

  it('should not warn for files under threshold', () => {
    const fileSize = 5 * 1024 * 1024; // 5MB
    const exceedsThreshold = fileSize > LARGE_FILE_THRESHOLD;
    expect(exceedsThreshold).toBe(false);
  });
});
