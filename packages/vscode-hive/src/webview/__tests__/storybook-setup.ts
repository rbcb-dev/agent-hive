/**
 * Vitest setup for portable Storybook tests.
 *
 * Configures project annotations (decorators, parameters, etc.)
 * from .storybook/preview.tsx so that portable stories behave
 * identically to how they render in the Storybook UI.
 *
 * Also provides DOM polyfills required by antd components in jsdom.
 */
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import '@testing-library/jest-dom';
import * as previewAnnotations from '../../../.storybook/preview';

// --- DOM polyfills (required by antd/rc-component in jsdom) ---

// Mock ResizeObserver (required by antd components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia (required by some antd components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock document.execCommand (used by clipboard copy in CodeViewer/MarkdownViewer)
if (!document.execCommand) {
  document.execCommand = () => false;
}

// --- Storybook project annotations ---

const annotations = setProjectAnnotations([previewAnnotations]);

// Run Storybook's beforeAll hook (initializes addon state, etc.)
beforeAll(annotations.beforeAll);
