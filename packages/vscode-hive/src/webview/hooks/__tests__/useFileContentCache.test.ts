/**
 * Tests for useFileContentCache hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileContentCache } from '../useFileContentCache';

// Mock vscodeApi
vi.mock('../../vscodeApi', () => ({
  postMessage: vi.fn(),
}));

describe('useFileContentCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for uncached content', () => {
    const { result } = renderHook(() => useFileContentCache());

    const content = result.current.getContent('src/test.ts');
    expect(content).toBeNull();
  });

  it('stores and retrieves content', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.setContent('src/test.ts', 'const x = 1;', 'typescript');
    });

    const cached = result.current.getContent('src/test.ts');
    expect(cached).toEqual({
      content: 'const x = 1;',
      language: 'typescript',
      warning: undefined,
    });
  });

  it('stores content with warning', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.setContent('large.json', '{}', 'json', 'File is large');
    });

    const cached = result.current.getContent('large.json');
    expect(cached).toEqual({
      content: '{}',
      language: 'json',
      warning: 'File is large',
    });
  });

  it('reports loading state when requesting content', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useFileContentCache());

    expect(result.current.isLoading('src/test.ts')).toBe(false);

    act(() => {
      result.current.requestContent('src/test.ts');
    });

    expect(result.current.isLoading('src/test.ts')).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: 'requestFile', uri: 'src/test.ts' });
  });

  it('clears loading state when content is set', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.requestContent('src/test.ts');
    });
    expect(result.current.isLoading('src/test.ts')).toBe(true);

    act(() => {
      result.current.setContent('src/test.ts', 'content', 'typescript');
    });
    expect(result.current.isLoading('src/test.ts')).toBe(false);
  });

  it('does not request already loading content', async () => {
    const { postMessage } = await import('../../vscodeApi');
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.requestContent('src/test.ts');
    });
    act(() => {
      result.current.requestContent('src/test.ts');
    });

    // Should only be called once
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('stores and retrieves errors', () => {
    const { result } = renderHook(() => useFileContentCache());

    expect(result.current.getError('nonexistent.ts')).toBeUndefined();

    act(() => {
      result.current.setError('nonexistent.ts', 'File not found');
    });

    expect(result.current.getError('nonexistent.ts')).toBe('File not found');
  });

  it('clears error when content is set', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.setError('src/test.ts', 'Some error');
    });
    expect(result.current.getError('src/test.ts')).toBe('Some error');

    act(() => {
      result.current.setContent('src/test.ts', 'content', 'typescript');
    });
    expect(result.current.getError('src/test.ts')).toBeUndefined();
  });

  it('clears loading state when error is set', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.requestContent('src/test.ts');
    });
    expect(result.current.isLoading('src/test.ts')).toBe(true);

    act(() => {
      result.current.setError('src/test.ts', 'Some error');
    });
    expect(result.current.isLoading('src/test.ts')).toBe(false);
  });

  it('expires cache entries after TTL (5 minutes)', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.setContent('src/test.ts', 'old content', 'typescript');
    });

    expect(result.current.getContent('src/test.ts')).not.toBeNull();

    // Advance time past the 5 minute TTL
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    });

    // Should return null for expired content
    expect(result.current.getContent('src/test.ts')).toBeNull();
  });

  it('clears specific cache entry', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.setContent('file1.ts', 'content1', 'typescript');
      result.current.setContent('file2.ts', 'content2', 'typescript');
    });

    expect(result.current.getContent('file1.ts')).not.toBeNull();
    expect(result.current.getContent('file2.ts')).not.toBeNull();

    act(() => {
      result.current.clearCache('file1.ts');
    });

    expect(result.current.getContent('file1.ts')).toBeNull();
    expect(result.current.getContent('file2.ts')).not.toBeNull();
  });

  it('clears all cache entries', () => {
    const { result } = renderHook(() => useFileContentCache());

    act(() => {
      result.current.setContent('file1.ts', 'content1', 'typescript');
      result.current.setContent('file2.ts', 'content2', 'typescript');
      result.current.setError('file3.ts', 'Error');
    });

    act(() => {
      result.current.clearCache();
    });

    expect(result.current.getContent('file1.ts')).toBeNull();
    expect(result.current.getContent('file2.ts')).toBeNull();
    expect(result.current.getError('file3.ts')).toBeUndefined();
  });
});
