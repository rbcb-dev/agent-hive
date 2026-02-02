import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { FileNavigator } from './FileNavigator';
import { createMockReviewThread, createMockAnnotation } from '../__stories__/mocks';

const meta = {
  title: 'Components/FileNavigator',
  component: FileNavigator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    files: {
      description: 'List of file paths to display in tree view',
    },
    threads: {
      description: 'Review threads used to compute comment count badges per file',
    },
    selectedFile: {
      description: 'Currently selected file path',
      control: 'text',
    },
  },
} satisfies Meta<typeof FileNavigator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample file paths for stories
const sampleFiles = [
  'src/components/Button.tsx',
  'src/components/Input.tsx',
  'src/components/Modal.tsx',
  'src/hooks/useForm.ts',
  'src/utils/helpers.ts',
  'src/utils/validation.ts',
  'src/index.ts',
  'package.json',
  'README.md',
];

// Create sample threads for files
const createThreadsForFile = (uri: string, count: number) => {
  return Array.from({ length: count }, (_, i) =>
    createMockReviewThread({
      id: `thread-${uri}-${i}`,
      uri,
      annotations: [
        createMockAnnotation({
          id: `ann-${uri}-${i}`,
          body: `Comment ${i + 1} on ${uri}`,
        }),
      ],
    })
  );
};

/**
 * Empty state - no files in the review scope
 */
export const Empty: Story = {
  args: {
    files: [],
    threads: [],
    selectedFile: null,
    onSelectFile: fn(),
  },
};

/**
 * Basic file tree with nested folder structure
 */
export const WithFiles: Story = {
  args: {
    files: sampleFiles,
    threads: [],
    selectedFile: null,
    onSelectFile: fn(),
  },
};

/**
 * File tree with a file selected (highlighted)
 */
export const WithSelection: Story = {
  args: {
    files: sampleFiles,
    threads: [],
    selectedFile: 'src/components/Button.tsx',
    onSelectFile: fn(),
  },
};

/**
 * Files showing thread count badges (comment indicators)
 */
export const WithCommentCounts: Story = {
  args: {
    files: sampleFiles,
    threads: [
      // Button.tsx has 3 threads
      ...createThreadsForFile('src/components/Button.tsx', 3),
      // Modal.tsx has 1 thread
      ...createThreadsForFile('src/components/Modal.tsx', 1),
      // helpers.ts has 5 threads
      ...createThreadsForFile('src/utils/helpers.ts', 5),
    ],
    selectedFile: null,
    onSelectFile: fn(),
  },
};

/**
 * Combined: selected file with comment counts
 */
export const WithSelectionAndComments: Story = {
  args: {
    files: sampleFiles,
    threads: [
      ...createThreadsForFile('src/components/Button.tsx', 2),
      ...createThreadsForFile('src/utils/helpers.ts', 3),
    ],
    selectedFile: 'src/components/Button.tsx',
    onSelectFile: fn(),
  },
};

/**
 * Deep nested folder structure
 */
export const DeepNesting: Story = {
  args: {
    files: [
      'src/features/auth/components/LoginForm.tsx',
      'src/features/auth/components/RegisterForm.tsx',
      'src/features/auth/hooks/useAuth.ts',
      'src/features/auth/utils/validators.ts',
      'src/features/dashboard/components/Widget.tsx',
      'src/features/dashboard/hooks/useDashboard.ts',
      'src/shared/components/Button.tsx',
      'src/shared/utils/format.ts',
    ],
    threads: [],
    selectedFile: null,
    onSelectFile: fn(),
  },
};

/**
 * Interactive test - clicking a file triggers onSelectFile callback
 */
export const FileSelectionInteraction: Story = {
  args: {
    files: sampleFiles,
    threads: [],
    selectedFile: null,
    onSelectFile: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click on Button.tsx file
    const buttonFile = canvas.getByText('Button.tsx');
    await userEvent.click(buttonFile);

    // Verify callback was called with full path
    await expect(args.onSelectFile).toHaveBeenCalledWith('src/components/Button.tsx');
  },
};

/**
 * Interactive test - folder collapse and expand
 */
export const FolderToggleInteraction: Story = {
  args: {
    files: sampleFiles,
    threads: [],
    selectedFile: null,
    onSelectFile: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially files should be visible (folders expanded by default)
    await expect(canvas.getByText('Button.tsx')).toBeVisible();

    // Find the 'components' folder and click to collapse
    const componentsFolderNode = canvas.getByText('components').closest('[data-testid="folder-node"]');
    await expect(componentsFolderNode).toBeInTheDocument();
    await userEvent.click(componentsFolderNode!);

    // Files inside should be hidden
    await expect(canvas.queryByText('Button.tsx')).not.toBeInTheDocument();

    // Click again to expand
    await userEvent.click(componentsFolderNode!);

    // Files should be visible again
    await expect(canvas.getByText('Button.tsx')).toBeVisible();
  },
};

/**
 * Interactive test - verify comment badges display correctly
 */
export const CommentBadgeInteraction: Story = {
  args: {
    files: sampleFiles,
    threads: [
      ...createThreadsForFile('src/components/Button.tsx', 3),
      ...createThreadsForFile('src/utils/helpers.ts', 2),
    ],
    selectedFile: null,
    onSelectFile: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find Button.tsx and verify its badge shows 3
    const buttonItem = canvas.getByText('Button.tsx').closest('[data-testid="file-item"]');
    const buttonBadge = buttonItem?.querySelector('[data-testid="thread-count"]');
    await expect(buttonBadge).toHaveTextContent('3');

    // Find helpers.ts and verify its badge shows 2
    const helpersItem = canvas.getByText('helpers.ts').closest('[data-testid="file-item"]');
    const helpersBadge = helpersItem?.querySelector('[data-testid="thread-count"]');
    await expect(helpersBadge).toHaveTextContent('2');

    // Input.tsx should have no badge (0 threads)
    const inputItem = canvas.getByText('Input.tsx').closest('[data-testid="file-item"]');
    const inputBadge = inputItem?.querySelector('[data-testid="thread-count"]');
    await expect(inputBadge).toBeNull();
  },
};
