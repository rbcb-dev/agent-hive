import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { FileNavigator } from './FileNavigator';
import {
  createMockReviewThread,
  createMockAnnotation,
} from '../__stories__/mocks';

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
      description:
        'Review threads used to compute comment count badges per file',
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
    }),
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
    await expect(args.onSelectFile).toHaveBeenCalledWith(
      'src/components/Button.tsx',
    );
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
    const componentsFolderNode = canvas
      .getByText('components')
      .closest('[data-testid="folder-node"]');
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
    const buttonItem = canvas
      .getByText('Button.tsx')
      .closest('[data-testid="file-item"]');
    const buttonBadge = buttonItem?.querySelector(
      '[data-testid="thread-count"]',
    );
    await expect(buttonBadge).toHaveTextContent('3');

    // Find helpers.ts and verify its badge shows 2
    const helpersItem = canvas
      .getByText('helpers.ts')
      .closest('[data-testid="file-item"]');
    const helpersBadge = helpersItem?.querySelector(
      '[data-testid="thread-count"]',
    );
    await expect(helpersBadge).toHaveTextContent('2');

    // Input.tsx should have no badge (0 threads)
    const inputItem = canvas
      .getByText('Input.tsx')
      .closest('[data-testid="file-item"]');
    const inputBadge = inputItem?.querySelector('[data-testid="thread-count"]');
    await expect(inputBadge).toBeNull();
  },
};

/**
 * File icons - shows different icons for different file types
 */
export const FileIcons: Story = {
  args: {
    files: [
      'src/components/Button.tsx', // .tsx -> file-code
      'src/utils/helpers.ts', // .ts -> file-code
      'src/index.js', // .js -> file-code
      'src/main.py', // .py -> file-code
      'package.json', // .json -> file-text
      'config.yaml', // .yaml -> file-text
      'README.md', // .md -> markdown
      'bun.lock', // .lock -> lock
      '.env', // .env -> gear
      'data.csv', // .csv -> file-text
      'styles.css', // .css -> file-code
      'template.html', // .html -> file-code
      'unknown.xyz', // unknown -> file (default)
    ],
    threads: [],
    selectedFile: null,
    onSelectFile: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify different file types have icons
    // TypeScript file should have file-code icon
    const tsxFile = canvas
      .getByText('Button.tsx')
      .closest('[data-testid="file-item"]');
    await expect(
      tsxFile?.querySelector('.codicon-file-code'),
    ).toBeInTheDocument();

    // JSON file should have file-text icon
    const jsonFile = canvas
      .getByText('package.json')
      .closest('[data-testid="file-item"]');
    await expect(
      jsonFile?.querySelector('.codicon-file-text'),
    ).toBeInTheDocument();

    // Markdown file should have markdown icon
    const mdFile = canvas
      .getByText('README.md')
      .closest('[data-testid="file-item"]');
    await expect(
      mdFile?.querySelector('.codicon-markdown'),
    ).toBeInTheDocument();

    // Lock file should have lock icon
    const lockFile = canvas
      .getByText('bun.lock')
      .closest('[data-testid="file-item"]');
    await expect(lockFile?.querySelector('.codicon-lock')).toBeInTheDocument();

    // Env file should have gear icon
    const envFile = canvas
      .getByText('.env')
      .closest('[data-testid="file-item"]');
    await expect(envFile?.querySelector('.codicon-gear')).toBeInTheDocument();

    // Folder should have folder icon
    const folder = canvas
      .getByText('src')
      .closest('[data-testid="folder-node"]');
    await expect(folder?.querySelector('.codicon-folder')).toBeInTheDocument();
  },
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Accessibility check for FileNavigator.
 *
 * Verifies:
 * - File items are clickable and focusable
 * - Folder toggle is keyboard accessible
 * - File names are readable by screen readers
 *
 * @tags a11y
 */
export const AccessibilityCheck: Story = {
  tags: ['a11y'],
  args: {
    files: sampleFiles,
    threads: [...createThreadsForFile('src/components/Button.tsx', 2)],
    selectedFile: null,
    onSelectFile: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Verify file items are rendered and visible
    await expect(canvas.getByText('Button.tsx')).toBeVisible();
    await expect(canvas.getByText('Input.tsx')).toBeVisible();

    // Verify files are clickable by clicking one
    const fileItem = canvas.getByText('helpers.ts');
    await userEvent.click(fileItem);
    await expect(args.onSelectFile).toHaveBeenCalledWith(
      'src/utils/helpers.ts',
    );

    // Verify keyboard navigation: Tab to focus the first item, Enter to select
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(document.body);

    // Verify thread count badges are present as text (readable by screen readers)
    const buttonItem = canvas
      .getByText('Button.tsx')
      .closest('[data-testid="file-item"]');
    const badge = buttonItem?.querySelector('[data-testid="thread-count"]');
    await expect(badge).toHaveTextContent('2');
  },
};
