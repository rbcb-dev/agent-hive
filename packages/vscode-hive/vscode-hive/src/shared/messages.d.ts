/**
 * Shared message protocol types for extension ↔ webview communication.
 *
 * This is the single source of truth. Both `reviewPanel.ts` (extension side)
 * and `webview/types.ts` (webview side) re-export from here.
 */
import type { ReviewSession, ReviewConfig, Range, FeatureInfo, DiffPayload, PlanComment } from 'hive-core';
/**
 * Messages sent from webview to extension
 */
export type WebviewToExtensionMessage = {
    type: 'ready';
} | {
    type: 'addComment';
    threadId?: string;
    entityId: string;
    uri?: string;
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    body: string;
    annotationType: string;
} | {
    type: 'reply';
    threadId: string;
    body: string;
} | {
    type: 'resolve';
    threadId: string;
} | {
    type: 'applySuggestion';
    threadId: string;
    annotationId: string;
    uri: string;
    range: Range;
    replacement: string;
} | {
    type: 'submit';
    verdict: string;
    summary: string;
} | {
    type: 'selectFile';
    path: string;
} | {
    type: 'selectThread';
    threadId: string;
} | {
    type: 'changeScope';
    scope: string;
} | {
    type: 'requestFile';
    uri: string;
} | {
    type: 'requestFeatures';
} | {
    type: 'requestFeatureDiffs';
    feature: string;
} | {
    type: 'requestTaskDiff';
    feature: string;
    task: string;
} | {
    type: 'requestPlanContent';
    feature: string;
} | {
    type: 'requestContextContent';
    feature: string;
    name: string;
};
/**
 * Messages sent from extension to webview
 */
export type ExtensionToWebviewMessage = {
    type: 'sessionData';
    session: ReviewSession;
    config: ReviewConfig;
} | {
    type: 'sessionUpdate';
    session: ReviewSession;
} | {
    type: 'configUpdate';
    config: ReviewConfig;
} | {
    type: 'error';
    message: string;
} | {
    type: 'scopeChanged';
    scope: string;
    scopeContent?: {
        uri: string;
        content: string;
        language: string;
    };
} | {
    type: 'fileContent';
    uri: string;
    content: string;
    language?: string;
    warning?: string;
} | {
    type: 'fileError';
    uri: string;
    error: string;
} | {
    type: 'suggestionApplied';
    threadId: string;
    annotationId: string;
    success: boolean;
    error?: string;
} | {
    type: 'featuresData';
    features: FeatureInfo[];
} | {
    type: 'featureDiffs';
    feature: string;
    diffs: Record<string, DiffPayload[]>;
} | {
    type: 'taskDiff';
    feature: string;
    task: string;
    diffs: DiffPayload[];
} | {
    type: 'planContent';
    feature: string;
    content: string;
    comments: PlanComment[];
} | {
    type: 'contextContent';
    feature: string;
    name: string;
    content: string;
};
