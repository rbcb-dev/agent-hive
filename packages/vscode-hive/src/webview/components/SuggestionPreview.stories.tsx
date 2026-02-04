import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, within, userEvent } from 'storybook/test';

import { SuggestionPreview } from './SuggestionPreview';
import { createMockAnnotation } from '../__stories__/mocks';
import type { Range } from 'hive-core';

const meta = {
  title: 'Components/SuggestionPreview',
  component: SuggestionPreview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isApplied: {
      control: 'boolean',
      description: 'Whether the suggestion has been applied',
    },
    isApplying: {
      control: 'boolean',
      description: 'Whether the suggestion is currently being applied',
    },
    hasConflict: {
      control: 'boolean',
      description: 'Whether there is a conflict with the current file state',
    },
  },
} satisfies Meta<typeof SuggestionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const defaultRange: Range = {
  start: { line: 10, character: 0 },
  end: { line: 10, character: 20 },
};

const defaultAnnotation = createMockAnnotation({
  id: 'suggestion-1',
  type: 'suggestion',
  body: 'Consider using a more descriptive variable name for clarity.',
  suggestion: { replacement: 'const userDisplayName = user.name;' },
  author: { type: 'llm', name: 'Claude', agentId: 'claude-reviewer' },
});

const defaultOldCode = 'const x = user.name;';
const defaultUri = 'src/components/UserProfile.tsx';

/**
 * Default state showing a suggestion with apply button
 */
export const Default: Story = {
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: false,
  },
};

/**
 * Suggestion with a replacement that shows the before/after diff
 */
export const WithReplacement: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-replace',
      type: 'suggestion',
      body: 'Use template literals for better readability.',
      suggestion: { replacement: 'const greeting = `Hello, ${name}!`;' },
      author: { type: 'human', name: 'Senior Dev' },
    }),
    oldCode: "const greeting = 'Hello, ' + name + '!';",
    uri: 'src/utils/greetings.ts',
    range: {
      start: { line: 5, character: 0 },
      end: { line: 5, character: 35 },
    },
    onApply: fn(),
    isApplied: false,
  },
};

/**
 * Suggestion that has already been applied - shows "Applied" badge
 */
export const Applied: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-applied',
      type: 'suggestion',
      body: 'This suggestion was applied successfully.',
      suggestion: { replacement: 'const result = await fetchData();' },
    }),
    oldCode: 'const result = fetchData();',
    uri: 'src/api/client.ts',
    range: {
      start: { line: 42, character: 0 },
      end: { line: 42, character: 28 },
    },
    onApply: fn(),
    isApplied: true,
  },
};

/**
 * Suggestion that is currently being applied - button shows "Applying..."
 */
export const Applying: Story = {
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: true,
    hasConflict: false,
  },
};

/**
 * Suggestion with a conflict warning - apply button is disabled
 */
export const WithConflict: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-conflict',
      type: 'suggestion',
      body: 'Replace deprecated API usage.',
      suggestion: { replacement: 'import { useQuery } from "@tanstack/react-query";' },
    }),
    oldCode: 'import { useQuery } from "react-query";',
    uri: 'src/hooks/useData.ts',
    range: {
      start: { line: 1, character: 0 },
      end: { line: 1, character: 40 },
    },
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: true,
  },
};

/**
 * Multi-line code replacement suggestion
 */
export const MultiLineReplacement: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-multiline',
      type: 'suggestion',
      body: 'Consider extracting this into a separate function for reusability.',
      suggestion: {
        replacement: `const processItems = (items) => {
  return items
    .filter(item => item.active)
    .map(item => item.value);
};`,
      },
    }),
    oldCode: 'const result = items.filter(i => i.active).map(i => i.value);',
    uri: 'src/utils/processing.ts',
    range: {
      start: { line: 15, character: 0 },
      end: { line: 15, character: 60 },
    },
    onApply: fn(),
    isApplied: false,
  },
};

/**
 * Test that clicking Apply button triggers onApply callback with annotation ID
 */
export const ClickApply: Story = {
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click the Apply button
    const applyButton = canvas.getByRole('button', { name: /Apply/i });
    await userEvent.click(applyButton);

    // Verify the callback was called with the annotation ID
    await expect(args.onApply).toHaveBeenCalledWith('suggestion-1');
  },
};

/**
 * Test that Apply button is disabled when applying
 */
export const ApplyButtonDisabledWhileApplying: Story = {
  args: {
    annotation: defaultAnnotation,
    oldCode: defaultOldCode,
    uri: defaultUri,
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: true,
    hasConflict: false,
  },
   play: async ({ canvasElement, args }) => {
     const canvas = within(canvasElement);

     // Find the Apply button - when applying, button text is "Applying..."
     const applyButton = canvas.getByRole('button', { name: /Apply|Applying/ });

     // Verify the button is disabled
     await expect(applyButton).toBeDisabled();

     // Try clicking anyway
     await userEvent.click(applyButton);

     // Verify callback was NOT called
     await expect(args.onApply).not.toHaveBeenCalled();
   },
};

/**
 * Test that Apply button is disabled when there's a conflict
 */
export const ApplyButtonDisabledWithConflict: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-conflict-test',
      type: 'suggestion',
      body: 'Test conflict scenario.',
      suggestion: { replacement: 'new code' },
    }),
    oldCode: 'old code',
    uri: 'src/test.ts',
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
    isApplying: false,
    hasConflict: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find the Apply button
    const applyButton = canvas.getByRole('button', { name: /Apply/i });

    // Verify the button is disabled
    await expect(applyButton).toBeDisabled();

    // Verify conflict warning is shown
    const conflictWarning = canvas.getByRole('alert');
    await expect(conflictWarning).toBeInTheDocument();

    // Try clicking anyway
    await userEvent.click(applyButton);

    // Verify callback was NOT called
    await expect(args.onApply).not.toHaveBeenCalled();
  },
};

/**
 * Verify diff display shows old and new code in split view by default
 */
export const DiffDisplayVerification: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-diff-verify',
      type: 'suggestion',
      body: 'Verify diff rendering.',
      suggestion: { replacement: 'const newValue = 42;' },
    }),
    oldCode: 'const oldValue = 0;',
    uri: 'src/values.ts',
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify split view labels are present (default mode)
    await expect(canvas.getByText('Before:')).toBeInTheDocument();
    await expect(canvas.getByText('After:')).toBeInTheDocument();

    // Verify old code is displayed
    await expect(canvas.getByText('const oldValue = 0;')).toBeInTheDocument();

    // Verify new code is displayed
    await expect(canvas.getByText('const newValue = 42;')).toBeInTheDocument();
  },
};

/**
 * Test toggling between split and unified diff views
 */
export const ToggleDiffView: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-toggle-diff',
      type: 'suggestion',
      body: 'Toggle between split and unified diff views.',
      suggestion: { replacement: 'const updated = "new";' },
    }),
    oldCode: 'const original = "old";',
    uri: 'src/toggle.ts',
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially in split view
    await expect(canvas.getByText('Before:')).toBeInTheDocument();
    await expect(canvas.getByText('After:')).toBeInTheDocument();

    // Click on Unified to switch to unified diff view
    const unifiedButton = canvas.getByText('Unified');
    await userEvent.click(unifiedButton);

    // Split view labels should be gone
    await expect(canvas.queryByText('Before:')).not.toBeInTheDocument();
    await expect(canvas.queryByText('After:')).not.toBeInTheDocument();

    // Switch back to split view
    const splitButton = canvas.getByText('Split');
    await userEvent.click(splitButton);

    // Split view labels should be back
    await expect(canvas.getByText('Before:')).toBeInTheDocument();
    await expect(canvas.getByText('After:')).toBeInTheDocument();
  },
};

/**
 * Suggestion with markdown formatting in the body
 */
export const WithMarkdownBody: Story = {
  args: {
    annotation: createMockAnnotation({
      id: 'suggestion-markdown',
      type: 'suggestion',
      body: 'Consider using **async/await** instead of `.then()` chains.\n\n```typescript\nawait fetchData();\n```\n\nSee [MDN docs](https://mdn.io) for more info.',
      suggestion: { replacement: 'const data = await fetchData();' },
    }),
    oldCode: 'fetchData().then(data => setData(data));',
    uri: 'src/api/fetch.ts',
    range: defaultRange,
    onApply: fn(),
    isApplied: false,
  },
};
