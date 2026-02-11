/**
 * Compile-time tests for shared message protocol types.
 *
 * Verifies that both sides (extension + webview) can use the canonical
 * WebviewToExtensionMessage and ExtensionToWebviewMessage union types
 * from the shared module.
 */

import { describe, it, expect } from 'vitest';
import type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
} from '../messages.js';
import type {
  ReviewSession,
  ReviewConfig,
  Range,
  FeatureInfo,
  DiffPayload,
  PlanComment,
} from 'hive-core';

// -- Compile-time assignability checks --
// These functions are never called; they exist only to trigger type errors
// if the shared types drift from what each side expects.

function _extensionSideSend(post: (msg: ExtensionToWebviewMessage) => void) {
  const session = {} as ReviewSession;
  const config = {} as ReviewConfig;

  // Extension must be able to send all response messages
  post({ type: 'sessionData', session, config });
  post({ type: 'sessionUpdate', session });
  post({ type: 'configUpdate', config });
  post({ type: 'error', message: 'something went wrong' });
  post({
    type: 'scopeChanged',
    scope: 'plan',
    scopeContent: { uri: 'plan.md', content: '# Plan', language: 'markdown' },
  });
  post({
    type: 'fileContent',
    uri: 'src/index.ts',
    content: 'export {}',
    language: 'typescript',
  });
  post({ type: 'fileError', uri: 'missing.ts', error: 'not found' });
  post({
    type: 'suggestionApplied',
    threadId: 't1',
    annotationId: 'a1',
    success: true,
  });
  post({
    type: 'featuresData',
    features: [] as FeatureInfo[],
  });
  post({
    type: 'featureDiffs',
    feature: 'feat',
    diffs: {} as Record<string, DiffPayload[]>,
  });
  post({
    type: 'taskDiff',
    feature: 'feat',
    task: 'task-1',
    diffs: [] as DiffPayload[],
  });
  post({
    type: 'planContent',
    feature: 'feat',
    content: '# Plan',
    comments: [] as PlanComment[],
  });
  post({
    type: 'contextContent',
    feature: 'feat',
    name: 'decisions',
    content: '# Decisions',
  });
}

function _webviewSideSend(post: (msg: WebviewToExtensionMessage) => void) {
  const range: Range = {
    start: { line: 0, character: 0 },
    end: { line: 1, character: 0 },
  };

  // Webview must be able to send all request messages
  post({ type: 'ready' });
  post({
    type: 'addComment',
    entityId: 'e1',
    uri: 'src/file.ts',
    range,
    body: 'comment body',
    annotationType: 'comment',
  });
  post({ type: 'reply', threadId: 't1', body: 'reply body' });
  post({ type: 'resolve', threadId: 't1' });
  post({
    type: 'applySuggestion',
    threadId: 't1',
    annotationId: 'a1',
    uri: 'src/file.ts',
    range,
    replacement: 'const x = 1;',
  });
  post({ type: 'submit', verdict: 'approve', summary: 'LGTM' });
  post({ type: 'selectFile', path: 'src/index.ts' });
  post({ type: 'selectThread', threadId: 't1' });
  post({ type: 'changeScope', scope: 'code' });
  post({ type: 'requestFile', uri: 'src/index.ts' });
  post({ type: 'requestFeatures' });
  post({ type: 'requestFeatureDiffs', feature: 'feat' });
  post({ type: 'requestTaskDiff', feature: 'feat', task: 'task-1' });
  post({ type: 'requestPlanContent', feature: 'feat' });
  post({
    type: 'requestContextContent',
    feature: 'feat',
    name: 'decisions',
  });
}

// -- Runtime tests (thin; the real value is the compile-time checks above) --

describe('shared message protocol types', () => {
  it('WebviewToExtensionMessage covers all webview→extension message types', () => {
    // If this file compiles, the types are assignable.
    // Runtime assertion to satisfy the test runner:
    const messageTypes: WebviewToExtensionMessage['type'][] = [
      'ready',
      'addComment',
      'reply',
      'resolve',
      'applySuggestion',
      'submit',
      'selectFile',
      'selectThread',
      'changeScope',
      'requestFile',
      'requestFeatures',
      'requestFeatureDiffs',
      'requestTaskDiff',
      'requestPlanContent',
      'requestContextContent',
    ];
    expect(messageTypes).toHaveLength(15);
  });

  it('ExtensionToWebviewMessage covers all extension→webview message types', () => {
    const messageTypes: ExtensionToWebviewMessage['type'][] = [
      'sessionData',
      'sessionUpdate',
      'configUpdate',
      'error',
      'scopeChanged',
      'fileContent',
      'fileError',
      'suggestionApplied',
      'featuresData',
      'featureDiffs',
      'taskDiff',
      'planContent',
      'contextContent',
    ];
    expect(messageTypes).toHaveLength(13);
  });

  it('types are importable from shared/messages', () => {
    // The import at the top of this file proves that.
    // This test documents the intent.
    expect(true).toBe(true);
  });
});
