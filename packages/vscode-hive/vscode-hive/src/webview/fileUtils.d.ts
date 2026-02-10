/**
 * File utilities for the File Content Request Protocol
 *
 * Note: This file is used in browser (webview) context, so we avoid Node.js
 * built-ins like `path` module. All path operations use browser-safe implementations.
 */
/**
 * Large file threshold in bytes (10MB)
 */
export declare const LARGE_FILE_THRESHOLD: number;
/**
 * Get the VS Code language identifier for a file path
 * @param filePath - The file path or name
 * @returns The language identifier (e.g., 'typescript', 'javascript')
 */
export declare function getLanguageId(filePath: string): string;
/**
 * Check if a file path is within the workspace root
 * This prevents reading files outside the workspace (security measure)
 *
 * Note: This is a browser-safe implementation that handles common cases.
 * For full security, the extension host should do additional validation.
 *
 * @param workspaceRoot - The workspace root directory
 * @param filePath - The file path to check (must be absolute)
 * @returns true if the file is within the workspace
 */
export declare function isPathWithinWorkspace(workspaceRoot: string, filePath: string): boolean;
/**
 * Check if a file size exceeds the large file threshold
 * @param sizeInBytes - File size in bytes
 * @returns true if the file is considered large
 */
export declare function isLargeFile(sizeInBytes: number): boolean;
/**
 * Get a human-readable file size string
 * @param sizeInBytes - File size in bytes
 * @returns Human-readable size string (e.g., "10.5 MB")
 */
export declare function formatFileSize(sizeInBytes: number): string;
