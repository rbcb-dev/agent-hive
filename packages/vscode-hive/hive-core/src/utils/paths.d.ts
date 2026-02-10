export declare function normalizePath(filePath: string): string;
export declare function getHivePath(projectRoot: string): string;
export declare function getFeaturesPath(projectRoot: string): string;
export declare function getFeaturePath(projectRoot: string, featureName: string): string;
export declare function getPlanPath(projectRoot: string, featureName: string): string;
export declare function getCommentsPath(projectRoot: string, featureName: string): string;
export declare function getFeatureJsonPath(projectRoot: string, featureName: string): string;
export declare function getContextPath(projectRoot: string, featureName: string): string;
export declare function getTasksPath(projectRoot: string, featureName: string): string;
export declare function getTaskPath(projectRoot: string, featureName: string, taskFolder: string): string;
export declare function getTaskStatusPath(projectRoot: string, featureName: string, taskFolder: string): string;
export declare function getTaskReportPath(projectRoot: string, featureName: string, taskFolder: string): string;
export declare function getTaskSpecPath(projectRoot: string, featureName: string, taskFolder: string): string;
export declare function getApprovedPath(projectRoot: string, featureName: string): string;
export declare function getSubtasksPath(projectRoot: string, featureName: string, taskFolder: string): string;
export declare function getSubtaskPath(projectRoot: string, featureName: string, taskFolder: string, subtaskFolder: string): string;
export declare function getSubtaskStatusPath(projectRoot: string, featureName: string, taskFolder: string, subtaskFolder: string): string;
export declare function getSubtaskSpecPath(projectRoot: string, featureName: string, taskFolder: string, subtaskFolder: string): string;
export declare function getSubtaskReportPath(projectRoot: string, featureName: string, taskFolder: string, subtaskFolder: string): string;
export declare function ensureDir(dirPath: string): void;
export declare function fileExists(filePath: string): boolean;
export declare function readJson<T>(filePath: string): T | null;
export declare function writeJson<T>(filePath: string, data: T): void;
/** Lock acquisition options */
export interface LockOptions {
    /** Maximum time to wait for lock acquisition (ms). Default: 5000 */
    timeout?: number;
    /** Time between lock acquisition attempts (ms). Default: 50 */
    retryInterval?: number;
    /** Time after which a stale lock is broken (ms). Default: 30000 */
    staleLockTTL?: number;
}
/**
 * Get the lock file path for a given file
 */
export declare function getLockPath(filePath: string): string;
/**
 * Acquire an exclusive lock on a file.
 * Uses exclusive file creation (O_EXCL) for atomic lock acquisition.
 *
 * @param filePath - Path to the file to lock
 * @param options - Lock acquisition options
 * @returns A release function to call when done
 * @throws Error if lock cannot be acquired within timeout
 */
export declare function acquireLock(filePath: string, options?: LockOptions): Promise<() => void>;
/**
 * Synchronous version of acquireLock for simpler use cases
 */
export declare function acquireLockSync(filePath: string, options?: LockOptions): () => void;
/**
 * Write a file atomically using write-to-temp-then-rename pattern.
 * This ensures no partial writes are visible to readers.
 *
 * @param filePath - Destination file path
 * @param content - Content to write
 */
export declare function writeAtomic(filePath: string, content: string): void;
/**
 * Write JSON atomically
 */
export declare function writeJsonAtomic<T>(filePath: string, data: T): void;
/**
 * Write JSON with exclusive lock (async version).
 * Ensures only one process writes at a time and writes are atomic.
 *
 * @param filePath - Path to JSON file
 * @param data - Data to write
 * @param options - Lock options
 */
export declare function writeJsonLocked<T>(filePath: string, data: T, options?: LockOptions): Promise<void>;
/**
 * Synchronous version of writeJsonLocked
 */
export declare function writeJsonLockedSync<T>(filePath: string, data: T, options?: LockOptions): void;
/**
 * Deep merge utility that explicitly handles nested objects.
 * - Arrays are replaced, not merged
 * - Undefined values in patch are ignored (don't delete existing keys)
 * - Null values explicitly set to null
 */
export declare function deepMerge<T extends Record<string, unknown>>(target: T, patch: Partial<T>): T;
/**
 * Read-modify-write JSON with lock protection.
 * Reads current content, applies patch via deep merge, writes atomically.
 *
 * @param filePath - Path to JSON file
 * @param patch - Partial update to merge
 * @param options - Lock options
 * @returns The merged result
 */
export declare function patchJsonLocked<T extends object>(filePath: string, patch: Partial<T>, options?: LockOptions): Promise<T>;
/**
 * Synchronous version of patchJsonLocked
 */
export declare function patchJsonLockedSync<T extends object>(filePath: string, patch: Partial<T>, options?: LockOptions): T;
export declare function readText(filePath: string): string | null;
export declare function writeText(filePath: string, content: string): void;
