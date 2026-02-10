import type { StoryObj } from '@storybook/react-vite';
import { FileNavigator } from './FileNavigator';
declare const meta: {
    title: string;
    component: typeof FileNavigator;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        files: {
            description: string;
        };
        threads: {
            description: string;
        };
        selectedFile: {
            description: string;
            control: "text";
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Empty state - no files in the review scope
 */
export declare const Empty: Story;
/**
 * Basic file tree with nested folder structure
 */
export declare const WithFiles: Story;
/**
 * File tree with a file selected (highlighted)
 */
export declare const WithSelection: Story;
/**
 * Files showing thread count badges (comment indicators)
 */
export declare const WithCommentCounts: Story;
/**
 * Combined: selected file with comment counts
 */
export declare const WithSelectionAndComments: Story;
/**
 * Deep nested folder structure
 */
export declare const DeepNesting: Story;
/**
 * Interactive test - clicking a file triggers onSelectFile callback
 */
export declare const FileSelectionInteraction: Story;
/**
 * Interactive test - folder collapse and expand
 */
export declare const FolderToggleInteraction: Story;
/**
 * Interactive test - verify comment badges display correctly
 */
export declare const CommentBadgeInteraction: Story;
/**
 * File icons - shows different icons for different file types
 */
export declare const FileIcons: Story;
