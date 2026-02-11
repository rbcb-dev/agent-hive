import type { StoryObj } from '@storybook/react-vite';
import { DiffViewer } from './DiffViewer';
declare const meta: {
    title: string;
    component: typeof DiffViewer;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        file: {
            control: "object";
            description: string;
        };
        viewType: {
            control: "select";
            options: string[];
            description: string;
        };
        onLineClick: {
            action: string;
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state when no file is selected
 */
export declare const Empty: Story;
/**
 * Binary file that cannot be displayed as diff
 */
export declare const BinaryFile: Story;
/**
 * A single hunk showing a typical code modification
 */
export declare const SingleHunk: Story;
/**
 * Multiple hunks in the same file - common in larger refactors
 */
export declare const MultipleHunks: Story;
/**
 * Only additions (new code being added, like a new import block)
 * Shows green highlighting for all lines
 */
export declare const AdditionsOnly: Story;
/**
 * Only deletions (code being removed, like cleaning up deprecated code)
 * Shows red highlighting for all lines
 */
export declare const DeletionsOnly: Story;
/**
 * Mixed changes with additions, deletions, and context lines
 * Demonstrates the full color coding:
 * - Green background for additions (+)
 * - Red background for deletions (-)
 * - No highlight for context lines
 */
export declare const Mixed: Story;
/**
 * Demonstrates accessible diff viewing with symbols alongside colors.
 *
 * The diff uses:
 * - `+` prefix for additions (green)
 * - `-` prefix for deletions (red)
 * - ` ` prefix for context lines
 *
 * This ensures the diff is understandable even without color perception,
 * meeting WCAG accessibility guidelines.
 */
export declare const AccessibleDiff: Story;
/**
 * Large diff with many hunks to demonstrate scrolling and performance.
 *
 * Real-world refactors often produce diffs with:
 * - Multiple hunks across the file
 * - Many added/removed lines
 * - Need for efficient rendering
 *
 * This story shows 5 hunks with 30 lines each (150 total lines).
 */
export declare const LargeDiff: Story;
/**
 * Verifies that hunks are rendered correctly with file header, stats,
 * and diff content visible.
 */
export declare const HunkRendering: Story;
/**
 * Verifies that clicking a line gutter triggers onLineClick with the
 * correct file path and line number.
 *
 * Note: react-diff-view renders gutter cells as <td> with click handlers.
 * This test clicks a gutter cell and asserts the callback args.
 */
export declare const LineClickInteraction: Story;
/**
 * Accessibility check for DiffViewer.
 *
 * Verifies:
 * - File path and stats are visible for screen readers
 * - Diff content is navigable
 * - Keyboard focus works on interactive elements
 *
 * @tags a11y
 */
export declare const AccessibilityCheck: Story;
