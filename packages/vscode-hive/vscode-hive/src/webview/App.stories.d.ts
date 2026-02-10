/**
 * App.stories.tsx - Storybook stories for the main App container component
 *
 * The App component orchestrates the entire Hive Review UI, managing:
 * - Scope navigation (Feature, Task, Context, Plan, Code)
 * - File selection and navigation
 * - Thread management and display
 * - Review submission
 *
 * State Management:
 * - Session data comes from VSCode extension via postMessage
 * - Internal state tracks active scope, selected file/thread, loading states
 * - File content is cached with TTL for performance
 *
 * Note: VSCode postMessage API is abstracted in vscodeApi.ts with automatic
 * fallback to a console mock when running outside VSCode context.
 */
import type { StoryObj } from '@storybook/react-vite';
import { App } from './App';
declare const meta: {
    title: string;
    component: typeof App;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
    };
    tags: string[];
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Loading state - before any session data is received
 *
 * The app renders with empty state, waiting for the extension
 * to send session data via postMessage.
 */
export declare const Loading: Story;
/**
 * Default state with an empty review session
 *
 * Demonstrates the app after receiving a minimal session
 * with no threads or file changes.
 */
export declare const Default: Story;
/**
 * Active review with threads and file changes
 *
 * Shows a realistic review session with:
 * - Multiple changed files
 * - Open and resolved threads
 * - AI and human annotations
 */
export declare const WithActiveReview: Story;
/**
 * Integration story - demonstrates navigation flow
 *
 * Shows how users can:
 * 1. Switch between scope tabs
 * 2. Select files
 * 3. View threads
 */
export declare const NavigationFlow: Story;
/**
 * Scope content display - non-code scopes
 *
 * Shows how the app displays content for Feature, Task, Plan scopes
 * using either MarkdownViewer or CodeViewer depending on content type.
 */
export declare const WithScopeContent: Story;
