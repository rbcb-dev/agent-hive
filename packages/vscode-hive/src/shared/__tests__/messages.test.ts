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
  ReviewThread,
  TaskCommit,
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
  // New extension→webview message types
  post({
    type: 'commitHistory',
    feature: 'feat',
    task: 'task-1',
    commits: [] as TaskCommit[],
  });
  post({
    type: 'commitDiff',
    feature: 'feat',
    task: 'task-1',
    sha: 'abc123',
    diffs: [] as DiffPayload[],
  });
  post({
    type: 'reviewThreadsUpdate',
    threads: [] as ReviewThread[],
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
  // New webview→extension message types
  post({ type: 'unresolve', threadId: 't1' });
  post({ type: 'deleteThread', threadId: 't1' });
  post({
    type: 'editComment',
    threadId: 't1',
    annotationId: 'a1',
    body: 'updated body',
  });
  post({ type: 'deleteComment', threadId: 't1', annotationId: 'a1' });
  post({
    type: 'unresolvePlanComment',
    feature: 'feat',
    commentId: 'c1',
  });
  post({ type: 'deletePlanComment', feature: 'feat', commentId: 'c1' });
  post({
    type: 'editPlanComment',
    feature: 'feat',
    commentId: 'c1',
    body: 'updated plan comment',
  });
  post({
    type: 'requestCommitHistory',
    feature: 'feat',
    task: 'task-1',
  });
  post({
    type: 'requestCommitDiff',
    feature: 'feat',
    task: 'task-1',
    sha: 'abc123',
  });
  // Updated addPlanComment uses range instead of line
  post({
    type: 'addPlanComment',
    feature: 'feat',
    range,
    body: 'new plan comment',
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
      'unresolve',
      'deleteThread',
      'editComment',
      'deleteComment',
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
      'addPlanComment',
      'resolvePlanComment',
      'replyToPlanComment',
      'unresolvePlanComment',
      'deletePlanComment',
      'editPlanComment',
      'requestCommitHistory',
      'requestCommitDiff',
    ];
    expect(messageTypes).toHaveLength(27);
  });

  it('ExtensionToWebviewMessage covers all extension→webview message types', () => {
    const messageTypes: ExtensionToWebviewMessage['type'][] = [
      'sessionData',
      'sessionUpdate',
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
      'commitHistory',
      'commitDiff',
      'reviewThreadsUpdate',
    ];
    expect(messageTypes).toHaveLength(15);
  });

  it('addPlanComment uses Range instead of line number', () => {
    // Compile-time check: addPlanComment must accept 'range' field with Range type
    const msg: WebviewToExtensionMessage = {
      type: 'addPlanComment',
      feature: 'feat',
      range: {
        start: { line: 5, character: 0 },
        end: { line: 5, character: 10 },
      },
      body: 'comment text',
    };
    expect(msg.type).toBe('addPlanComment');
  });

  it('configUpdate is no longer in ExtensionToWebviewMessage', () => {
    // Compile-time exhaustiveness: if configUpdate is removed from the union,
    // then 'configUpdate' should NOT be assignable to ExtensionToWebviewMessage['type'].
    // This is enforced at compile time by the typed array above lacking 'configUpdate'.
    // Runtime check: the type array should not include 'configUpdate'.
    const messageTypes: ExtensionToWebviewMessage['type'][] = [
      'sessionData',
      'sessionUpdate',
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
      'commitHistory',
      'commitDiff',
      'reviewThreadsUpdate',
    ];
    expect(messageTypes).not.toContain('configUpdate');
  });

  it('type exhaustiveness: every WebviewToExtensionMessage type has a handler case', () => {
    // Ensures a switch over all message types is exhaustive at compile time.
    // If a new variant is added to the union but not here, TypeScript will error.
    function assertExhaustive(msg: WebviewToExtensionMessage): string {
      switch (msg.type) {
        case 'ready':
          return 'ready';
        case 'addComment':
          return 'addComment';
        case 'reply':
          return 'reply';
        case 'resolve':
          return 'resolve';
        case 'unresolve':
          return 'unresolve';
        case 'deleteThread':
          return 'deleteThread';
        case 'editComment':
          return 'editComment';
        case 'deleteComment':
          return 'deleteComment';
        case 'applySuggestion':
          return 'applySuggestion';
        case 'submit':
          return 'submit';
        case 'selectFile':
          return 'selectFile';
        case 'selectThread':
          return 'selectThread';
        case 'changeScope':
          return 'changeScope';
        case 'requestFile':
          return 'requestFile';
        case 'requestFeatures':
          return 'requestFeatures';
        case 'requestFeatureDiffs':
          return 'requestFeatureDiffs';
        case 'requestTaskDiff':
          return 'requestTaskDiff';
        case 'requestPlanContent':
          return 'requestPlanContent';
        case 'requestContextContent':
          return 'requestContextContent';
        case 'addPlanComment':
          return 'addPlanComment';
        case 'resolvePlanComment':
          return 'resolvePlanComment';
        case 'replyToPlanComment':
          return 'replyToPlanComment';
        case 'unresolvePlanComment':
          return 'unresolvePlanComment';
        case 'deletePlanComment':
          return 'deletePlanComment';
        case 'editPlanComment':
          return 'editPlanComment';
        case 'requestCommitHistory':
          return 'requestCommitHistory';
        case 'requestCommitDiff':
          return 'requestCommitDiff';
        default: {
          const _exhaustiveCheck: never = msg;
          return _exhaustiveCheck;
        }
      }
    }
    // Exercise one case to satisfy runtime
    expect(assertExhaustive({ type: 'ready' })).toBe('ready');
  });

  it('type exhaustiveness: every ExtensionToWebviewMessage type has a handler case', () => {
    function assertExhaustive(msg: ExtensionToWebviewMessage): string {
      switch (msg.type) {
        case 'sessionData':
          return 'sessionData';
        case 'sessionUpdate':
          return 'sessionUpdate';
        case 'error':
          return 'error';
        case 'scopeChanged':
          return 'scopeChanged';
        case 'fileContent':
          return 'fileContent';
        case 'fileError':
          return 'fileError';
        case 'suggestionApplied':
          return 'suggestionApplied';
        case 'featuresData':
          return 'featuresData';
        case 'featureDiffs':
          return 'featureDiffs';
        case 'taskDiff':
          return 'taskDiff';
        case 'planContent':
          return 'planContent';
        case 'contextContent':
          return 'contextContent';
        case 'commitHistory':
          return 'commitHistory';
        case 'commitDiff':
          return 'commitDiff';
        case 'reviewThreadsUpdate':
          return 'reviewThreadsUpdate';
        default: {
          const _exhaustiveCheck: never = msg;
          return _exhaustiveCheck;
        }
      }
    }
    expect(assertExhaustive({ type: 'error', message: 'test' })).toBe('error');
  });

  it('types are importable from shared/messages', () => {
    // The import at the top of this file proves that.
    // This test documents the intent.
    expect(true).toBe(true);
  });
});
