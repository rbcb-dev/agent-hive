/**
 * useFileContentCache hook - Manages file content caching with TTL
 * Provides content storage, loading state tracking, and error handling for file requests.
 */
/** Public content interface (without internal timestamp) */
export interface FileContent {
    content: string;
    language?: string;
    warning?: string;
}
export interface UseFileContentCacheResult {
    /** Get cached content for a file (null if not cached or expired) */
    getContent: (uri: string) => FileContent | null;
    /** Store content for a file */
    setContent: (uri: string, content: string, language?: string, warning?: string) => void;
    /** Check if a file is currently loading */
    isLoading: (uri: string) => boolean;
    /** Request file content from extension */
    requestContent: (uri: string) => void;
    /** Get error for a file */
    getError: (uri: string) => string | undefined;
    /** Store error for a file */
    setError: (uri: string, error: string) => void;
    /** Clear cache entry or all cache */
    clearCache: (uri?: string) => void;
}
/**
 * Hook for managing file content cache with automatic TTL expiration.
 * Used to cache file content requested from the VS Code extension.
 */
export declare function useFileContentCache(): UseFileContentCacheResult;
