/**
 * Vitest setup for visual snapshot Storybook tests (browser mode).
 *
 * Configures project annotations (decorators, parameters, etc.)
 * from .storybook/preview.tsx so that portable stories behave
 * identically to how they render in the Storybook UI.
 *
 * Unlike storybook-setup.ts, no jsdom polyfills are needed here
 * because tests run in a real Playwright browser.
 */
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as previewAnnotations from '../../../.storybook/preview';

// --- Storybook project annotations ---

const annotations = setProjectAnnotations([previewAnnotations]);

// Run Storybook's beforeAll hook (initializes addon state, etc.)
beforeAll(annotations.beforeAll);
