/**
 * Tests for VSCode API wrapper
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVsCodeApi,
  postMessage,
  addMessageListener,
  notifyReady,
} from '../vscodeApi';

// Mock acquireVsCodeApi
const mockPostMessage = vi.fn();
const mockGetState = vi.fn();
const mockSetState = vi.fn();

// Setup mock before module load
(globalThis as Record<string, unknown>).acquireVsCodeApi = vi.fn(() => ({
  postMessage: mockPostMessage,
  getState: mockGetState,
  setState: mockSetState,
}));

describe('vscodeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVsCodeApi', () => {
    it('returns the VSCode API instance', () => {
      const api = getVsCodeApi();
      expect(api).toBeDefined();
      expect(typeof api.postMessage).toBe('function');
      expect(typeof api.getState).toBe('function');
      expect(typeof api.setState).toBe('function');
    });

    it('returns the same instance on subsequent calls', () => {
      const api1 = getVsCodeApi();
      const api2 = getVsCodeApi();
      expect(api1).toBe(api2);
    });
  });

  describe('postMessage', () => {
    it('sends ready message', () => {
      postMessage({ type: 'ready' });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' });
    });

    it('sends addComment message', () => {
      const message = {
        type: 'addComment' as const,
        entityId: 'entity-1',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        body: 'Test comment',
        annotationType: 'comment',
      };
      postMessage(message);
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it('sends reply message', () => {
      const message = {
        type: 'reply' as const,
        threadId: 'thread-1',
        body: 'Test reply',
      };
      postMessage(message);
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it('sends resolve message', () => {
      const message = { type: 'resolve' as const, threadId: 'thread-1' };
      postMessage(message);
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it('sends submit message', () => {
      const message = {
        type: 'submit' as const,
        verdict: 'approve',
        summary: 'LGTM',
      };
      postMessage(message);
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('addMessageListener', () => {
    it('adds event listener and returns cleanup function', () => {
      const handler = vi.fn();
      const removeListener = addMessageListener(handler);
      expect(typeof removeListener).toBe('function');

      // Cleanup
      removeListener();
    });

    it('calls handler when message received', () => {
      const handler = vi.fn();
      addMessageListener(handler);

      // Simulate message from extension
      const event = new MessageEvent('message', {
        data: { type: 'sessionData', session: {} },
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith({
        type: 'sessionData',
        session: {},
      });
    });
  });

  describe('notifyReady', () => {
    it('sends ready message', () => {
      notifyReady();
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' });
    });
  });
});
