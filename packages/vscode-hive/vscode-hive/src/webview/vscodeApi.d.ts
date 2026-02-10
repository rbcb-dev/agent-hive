/**
 * VSCode API wrapper for webview communication
 */
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from './types';
interface VsCodeApi {
    postMessage(message: WebviewToExtensionMessage): void;
    getState<T>(): T | undefined;
    setState<T>(state: T): void;
}
/**
 * Get the VSCode API instance (singleton)
 */
export declare function getVsCodeApi(): VsCodeApi;
/**
 * Post a message to the extension
 */
export declare function postMessage(message: WebviewToExtensionMessage): void;
/**
 * Get saved state from VSCode
 */
export declare function getState<T>(): T | undefined;
/**
 * Save state to VSCode
 */
export declare function setState<T>(state: T): void;
/**
 * Add a message listener for extension messages
 */
export declare function addMessageListener(handler: (message: ExtensionToWebviewMessage) => void): () => void;
/**
 * Notify extension that webview is ready
 */
export declare function notifyReady(): void;
export {};
