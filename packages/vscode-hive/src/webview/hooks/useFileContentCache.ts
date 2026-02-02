/**
 * useFileContentCache hook - Manages file content caching with TTL
 * Provides content storage, loading state tracking, and error handling for file requests.
 */

import { useState, useCallback } from 'react';
import { postMessage } from '../vscodeApi';

/** Cached file content with metadata */
interface CachedContent {
  content: string;
  language?: string;
  warning?: string;
  timestamp: number;
}

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

/** Cache TTL: 5 minutes */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Hook for managing file content cache with automatic TTL expiration.
 * Used to cache file content requested from the VS Code extension.
 */
export function useFileContentCache(): UseFileContentCacheResult {
  const [cache, setCache] = useState<Map<string, CachedContent>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const getContent = useCallback((uri: string): FileContent | null => {
    const cached = cache.get(uri);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp >= CACHE_TTL) {
      return null;
    }
    
    return {
      content: cached.content,
      language: cached.language,
      warning: cached.warning,
    };
  }, [cache]);

  const setContent = useCallback((
    uri: string, 
    content: string, 
    language?: string, 
    warning?: string
  ) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(uri, {
        content,
        language,
        warning,
        timestamp: Date.now(),
      });
      return newCache;
    });
    
    // Clear error when content is set
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(uri);
      return newErrors;
    });
    
    // Clear loading state
    setLoading(prev => {
      const newLoading = new Set(prev);
      newLoading.delete(uri);
      return newLoading;
    });
  }, []);

  const isLoading = useCallback((uri: string): boolean => {
    return loading.has(uri);
  }, [loading]);

  const requestContent = useCallback((uri: string) => {
    // Don't request if already loading
    if (loading.has(uri)) {
      return;
    }
    
    // Mark as loading
    setLoading(prev => {
      const newLoading = new Set(prev);
      newLoading.add(uri);
      return newLoading;
    });
    
    // Send request to extension
    postMessage({ type: 'requestFile', uri });
  }, [loading]);

  const getError = useCallback((uri: string): string | undefined => {
    return errors.get(uri);
  }, [errors]);

  const setError = useCallback((uri: string, error: string) => {
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.set(uri, error);
      return newErrors;
    });
    
    // Clear loading state when error is set
    setLoading(prev => {
      const newLoading = new Set(prev);
      newLoading.delete(uri);
      return newLoading;
    });
  }, []);

  const clearCache = useCallback((uri?: string) => {
    if (uri) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(uri);
        return newCache;
      });
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(uri);
        return newErrors;
      });
    } else {
      setCache(new Map());
      setErrors(new Map());
    }
  }, []);

  return {
    getContent,
    setContent,
    isLoading,
    requestContent,
    getError,
    setError,
    clearCache,
  };
}
