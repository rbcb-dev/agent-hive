/**
 * Webview hooks - Reusable React hooks for the webview
 */

export {
  useCodeHighlighter,
  type UseCodeHighlighterOptions,
  type UseCodeHighlighterResult,
  type CodeToken,
  // Export utilities for advanced use cases
  SUPPORTED_LANGUAGES,
  THEME_MAP,
  normalizeLanguage,
  getHighlighter,
} from './useCodeHighlighter';

export {
  useMarkdownRenderer,
  type UseMarkdownRendererOptions,
  type UseMarkdownRendererResult,
} from './useMarkdownRenderer';

export {
  useFileContentCache,
  type FileContent,
  type UseFileContentCacheResult,
} from './useFileContentCache';

export {
  useReviewSession,
  type ScopeContent,
  type SuggestionResult,
  type UseReviewSessionResult,
} from './useReviewSession';

export { useWorkspaceMessages } from './useWorkspaceMessages';

export {
  useWorkspaceContent,
  type UseWorkspaceContentResult,
} from './useWorkspaceContent';
