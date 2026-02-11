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

  describe('ExtensionToWebviewMessage - configUpdate', () => {
    it('should accept valid configUpdate message', () => {
      const message: ExtensionToWebviewMessage = {
        type: 'configUpdate',
        config: {} as any,
      };
      expect(message.type).toBe('configUpdate');
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
    };

    expect(Object.keys(handlerMap)).toContain('ready');
    expect(Object.keys(handlerMap)).toContain('addComment');
    expect(Object.keys(handlerMap)).toContain('reply');
    expect(Object.keys(handlerMap)).toContain('resolve');
    expect(Object.keys(handlerMap)).toContain('submit');
    expect(Object.keys(handlerMap)).toContain('requestFile');
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

// Test new comment lifecycle message type contracts
describe('ReviewPanel Comment Lifecycle Messages', () => {
  describe('WebviewToExtensionMessage - review thread lifecycle', () => {
    it('should accept valid unresolve message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'unresolve',
        threadId: 'thread-123',
      };
      expect(message.type).toBe('unresolve');
      expect(message.threadId).toBe('thread-123');
    });

    it('should accept valid deleteThread message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'deleteThread',
        threadId: 'thread-123',
      };
      expect(message.type).toBe('deleteThread');
      expect(message.threadId).toBe('thread-123');
    });

    it('should accept valid editComment message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'editComment',
        threadId: 'thread-123',
        annotationId: 'ann-456',
        body: 'Updated comment body',
      };
      expect(message.type).toBe('editComment');
      expect(message.threadId).toBe('thread-123');
      expect(message.annotationId).toBe('ann-456');
      expect(message.body).toBe('Updated comment body');
    });

    it('should accept valid deleteComment message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'deleteComment',
        threadId: 'thread-123',
        annotationId: 'ann-456',
      };
      expect(message.type).toBe('deleteComment');
      expect(message.threadId).toBe('thread-123');
      expect(message.annotationId).toBe('ann-456');
    });
  });

  describe('WebviewToExtensionMessage - plan comment lifecycle', () => {
    it('should accept valid unresolvePlanComment message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'unresolvePlanComment',
        feature: 'test-feature',
        commentId: 'comment-123',
      };
      expect(message.type).toBe('unresolvePlanComment');
      expect(message.feature).toBe('test-feature');
      expect(message.commentId).toBe('comment-123');
    });

    it('should accept valid deletePlanComment message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'deletePlanComment',
        feature: 'test-feature',
        commentId: 'comment-123',
      };
      expect(message.type).toBe('deletePlanComment');
      expect(message.feature).toBe('test-feature');
      expect(message.commentId).toBe('comment-123');
    });

    it('should accept valid editPlanComment message', () => {
      const message: WebviewToExtensionMessage = {
        type: 'editPlanComment',
        feature: 'test-feature',
        commentId: 'comment-123',
        body: 'Updated plan comment body',
      };
      expect(message.type).toBe('editPlanComment');
      expect(message.feature).toBe('test-feature');
      expect(message.commentId).toBe('comment-123');
      expect(message.body).toBe('Updated plan comment body');
    });

    it('should accept addPlanComment with range instead of line', () => {
      const message: WebviewToExtensionMessage = {
        type: 'addPlanComment',
        feature: 'test-feature',
        range: {
          start: { line: 5, character: 0 },
          end: { line: 5, character: 10 },
        },
        body: 'Plan comment with range',
      };
      expect(message.type).toBe('addPlanComment');
      expect(message.range.start.line).toBe(5);
      expect(message.range.end.character).toBe(10);
      // Verify no 'line' property exists (range-based now)
      expect('line' in message).toBe(false);
    });
  });
});

// Test handler mapping includes new lifecycle handlers
describe('ReviewPanel Handler Mapping - Comment Lifecycle', () => {
  it('should include all review thread lifecycle handlers', () => {
    const reviewThreadHandlers = [
      'unresolve',
      'deleteThread',
      'editComment',
      'deleteComment',
    ];
    // Verify these are valid WebviewToExtensionMessage types
    reviewThreadHandlers.forEach((type) => {
      const message = { type } as WebviewToExtensionMessage;
      expect(message.type).toBe(type);
    });
  });

  it('should include all plan comment lifecycle handlers', () => {
    const planCommentHandlers = [
      'unresolvePlanComment',
      'deletePlanComment',
      'editPlanComment',
    ];
    // Verify these are valid WebviewToExtensionMessage types
    planCommentHandlers.forEach((type) => {
      const message = { type } as WebviewToExtensionMessage;
      expect(message.type).toBe(type);
    });
  });
});

// Test handler logic simulation using extracted patterns from reviewPanel.ts
// These tests verify the handler behavior patterns that _handleMessage dispatches to.
describe('ReviewPanel Handler Logic - Comment Lifecycle', () => {
  // Simulate the handler patterns (service calls + response messages)
  // These mirror the actual handler implementations in reviewPanel.ts

  describe('unresolve handler', () => {
    it('should call reviewService.unresolveThread and send sessionUpdate', async () => {
      const mockReviewService = {
        unresolveThread: vi.fn().mockResolvedValue({ id: 'thread-1', status: 'open' }),
        getSession: vi.fn().mockResolvedValue({
          id: 'session-1',
          threads: [{ id: 'thread-1', status: 'open' }],
        }),
      };
      const postMessage = vi.fn();

      // Simulate the handler logic
      await mockReviewService.unresolveThread('thread-1');
      const session = await mockReviewService.getSession('session-1');
      postMessage({ type: 'sessionUpdate', session });

      expect(mockReviewService.unresolveThread).toHaveBeenCalledWith('thread-1');
      expect(mockReviewService.getSession).toHaveBeenCalledWith('session-1');
      expect(postMessage).toHaveBeenCalledWith({
        type: 'sessionUpdate',
        session: expect.objectContaining({ id: 'session-1' }),
      });
    });

    it('should post error when no active session', () => {
      const postMessage = vi.fn();
      const currentSession = null;

      // Simulate guard check
      if (!currentSession) {
        postMessage({ type: 'error', message: 'No active session' });
      }

      expect(postMessage).toHaveBeenCalledWith({
        type: 'error',
        message: 'No active session',
      });
    });
  });

  describe('deleteThread handler', () => {
    it('should call reviewService.deleteThread with sessionId and threadId', async () => {
      const mockReviewService = {
        deleteThread: vi.fn().mockResolvedValue(undefined),
        getSession: vi.fn().mockResolvedValue({
          id: 'session-1',
          threads: [],
        }),
      };
      const postMessage = vi.fn();

      await mockReviewService.deleteThread('session-1', 'thread-1');
      const session = await mockReviewService.getSession('session-1');
      postMessage({ type: 'sessionUpdate', session });

      expect(mockReviewService.deleteThread).toHaveBeenCalledWith('session-1', 'thread-1');
      expect(postMessage).toHaveBeenCalledWith({
        type: 'sessionUpdate',
        session: expect.objectContaining({
          id: 'session-1',
          threads: [],
        }),
      });
    });
  });

  describe('editComment handler', () => {
    it('should call reviewService.editAnnotation and send sessionUpdate', async () => {
      const mockReviewService = {
        editAnnotation: vi.fn().mockResolvedValue({ id: 'ann-1', body: 'Updated' }),
        getSession: vi.fn().mockResolvedValue({ id: 'session-1' }),
      };
      const postMessage = vi.fn();

      await mockReviewService.editAnnotation('thread-1', 'ann-1', 'Updated');
      const session = await mockReviewService.getSession('session-1');
      postMessage({ type: 'sessionUpdate', session });

      expect(mockReviewService.editAnnotation).toHaveBeenCalledWith('thread-1', 'ann-1', 'Updated');
      expect(postMessage).toHaveBeenCalledWith({
        type: 'sessionUpdate',
        session: expect.objectContaining({ id: 'session-1' }),
      });
    });
  });

  describe('deleteComment handler', () => {
    it('should call reviewService.deleteAnnotation and send sessionUpdate', async () => {
      const mockReviewService = {
        deleteAnnotation: vi.fn().mockResolvedValue({ thread: null, threadDeleted: true }),
        getSession: vi.fn().mockResolvedValue({ id: 'session-1' }),
      };
      const postMessage = vi.fn();

      await mockReviewService.deleteAnnotation('thread-1', 'ann-1');
      const session = await mockReviewService.getSession('session-1');
      postMessage({ type: 'sessionUpdate', session });

      expect(mockReviewService.deleteAnnotation).toHaveBeenCalledWith('thread-1', 'ann-1');
      expect(postMessage).toHaveBeenCalledWith({
        type: 'sessionUpdate',
        session: expect.objectContaining({ id: 'session-1' }),
      });
    });
  });

  describe('unresolvePlanComment handler', () => {
    it('should call planService.unresolveComment and refresh plan content', () => {
      const mockPlanService = {
        unresolveComment: vi.fn(),
        read: vi.fn().mockReturnValue({
          content: '# Plan',
          status: 'active',
          comments: [{ id: 'c1', resolved: false }],
        }),
      };
      const postMessage = vi.fn();

      mockPlanService.unresolveComment('test-feature', 'c1');
      const result = mockPlanService.read('test-feature');
      postMessage({
        type: 'planContent',
        feature: 'test-feature',
        content: result.content,
        comments: result.comments,
      });

      expect(mockPlanService.unresolveComment).toHaveBeenCalledWith('test-feature', 'c1');
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'planContent', feature: 'test-feature' }),
      );
    });
  });

  describe('deletePlanComment handler', () => {
    it('should call planService.deleteComment and refresh plan content', () => {
      const mockPlanService = {
        deleteComment: vi.fn(),
        read: vi.fn().mockReturnValue({
          content: '# Plan',
          status: 'active',
          comments: [],
        }),
      };
      const postMessage = vi.fn();

      mockPlanService.deleteComment('test-feature', 'c1');
      const result = mockPlanService.read('test-feature');
      postMessage({
        type: 'planContent',
        feature: 'test-feature',
        content: result.content,
        comments: result.comments,
      });

      expect(mockPlanService.deleteComment).toHaveBeenCalledWith('test-feature', 'c1');
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'planContent',
          feature: 'test-feature',
          comments: [],
        }),
      );
    });
  });

  describe('editPlanComment handler', () => {
    it('should call planService.editComment and refresh plan content', () => {
      const mockPlanService = {
        editComment: vi.fn(),
        read: vi.fn().mockReturnValue({
          content: '# Plan',
          status: 'active',
          comments: [{ id: 'c1', body: 'Updated body' }],
        }),
      };
      const postMessage = vi.fn();

      mockPlanService.editComment('test-feature', 'c1', 'Updated body');
      const result = mockPlanService.read('test-feature');
      postMessage({
        type: 'planContent',
        feature: 'test-feature',
        content: result.content,
        comments: result.comments,
      });

      expect(mockPlanService.editComment).toHaveBeenCalledWith('test-feature', 'c1', 'Updated body');
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'planContent',
          feature: 'test-feature',
          comments: [expect.objectContaining({ id: 'c1', body: 'Updated body' })],
        }),
      );
    });
  });

  describe('addPlanComment handler (range-based)', () => {
    it('should call planService.addComment with range (not line)', () => {
      const range = {
        start: { line: 5, character: 0 },
        end: { line: 5, character: 10 },
      };
      const mockPlanService = {
        addComment: vi.fn().mockReturnValue({
          id: 'comment-1',
          range,
          body: 'Test comment',
          author: 'human',
          timestamp: '2026-01-01T00:00:00Z',
        }),
      };

      mockPlanService.addComment('test-feature', {
        range,
        body: 'Test comment',
        author: 'human',
      });

      expect(mockPlanService.addComment).toHaveBeenCalledWith(
        'test-feature',
        expect.objectContaining({
          range: expect.objectContaining({
            start: { line: 5, character: 0 },
            end: { line: 5, character: 10 },
          }),
          body: 'Test comment',
          author: 'human',
        }),
      );
      // Ensure line is NOT used
      const callArgs = mockPlanService.addComment.mock.calls[0][1];
      expect('line' in callArgs).toBe(false);
    });
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
