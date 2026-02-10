/**
 * VSCode API wrapper for webview communication
 */

import type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
} from './types';

// Declare the VSCode API type
declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

interface VsCodeApi {
  postMessage(message: WebviewToExtensionMessage): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
}

let vscodeApi: VsCodeApi | null = null;

/**
 * Get the VSCode API instance (singleton)
 */
export function getVsCodeApi(): VsCodeApi {
  if (!vscodeApi) {
    // In actual VSCode webview, acquireVsCodeApi is injected
    if (typeof acquireVsCodeApi !== 'undefined') {
      vscodeApi = acquireVsCodeApi() as VsCodeApi;
    } else {
      // Mock for development/testing outside VSCode
      console.warn('VSCode API not available - using mock');
      vscodeApi = {
        postMessage: (message) => console.log('postMessage:', message),
        getState: () => undefined,
        setState: () => {},
      };
    }
  }
  return vscodeApi;
}

/**
 * Post a message to the extension
 */
export function postMessage(message: WebviewToExtensionMessage): void {
  getVsCodeApi().postMessage(message);
}

/**
 * Get saved state from VSCode
 */
export function getState<T>(): T | undefined {
  return getVsCodeApi().getState<T>();
}

/**
 * Save state to VSCode
 */
export function setState<T>(state: T): void {
  getVsCodeApi().setState(state);
}

/**
 * Add a message listener for extension messages
 */
export function addMessageListener(
  handler: (message: ExtensionToWebviewMessage) => void,
): () => void {
  const listener = (event: MessageEvent<ExtensionToWebviewMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

/**
 * Notify extension that webview is ready
 */
export function notifyReady(): void {
  postMessage({ type: 'ready' });
}
