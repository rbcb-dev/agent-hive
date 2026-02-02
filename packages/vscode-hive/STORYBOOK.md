# Storybook Component Development Guide

This guide covers component development with Storybook in `vscode-hive`.

## Quick Start

```bash
# Start Storybook development server
bun run storybook

# Build static Storybook site
bun run build-storybook

# Run Storybook interaction tests
bun run test-storybook

# Update visual regression snapshots
bun run test-storybook:update
```

## Component Status

All 12 webview components have Storybook stories:

| Component | Stories | Play Functions | Visual Regression | Notes |
|-----------|---------|----------------|-------------------|-------|
| MarkdownViewer | 6 | Yes | Yes | Raw/rendered mode toggle |
| CodeViewer | 5 | Yes | Yes | Syntax highlighting, thread markers |
| DiffViewer | 7 | No | Yes | Diff visualization with hunks |
| ScopeTabs | 3 | Yes | Yes | Tab selection interaction |
| FileNavigator | 5 | Yes | Yes | File tree with expand/collapse |
| FileTree | 4 | Yes | Yes | Flat file list with status |
| ThreadPanel | 5 | Yes | Yes | Reply and resolve interactions |
| ThreadList | 4 | Yes | Yes | Thread selection |
| InlineThread | 5 | Yes | Yes | Inline code comments |
| SuggestionPreview | 5 | Yes | Yes | Code suggestion diffs |
| ReviewSummary | 4 | Yes | Yes | Verdict selection |
| App | 3 | Yes | Yes | Full application container |

## Writing Stories (TDD Flow)

### 1. Create the Story File

Stories live alongside components in `src/webview/__stories__/`:

```typescript
// src/webview/__stories__/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from '../components/MyComponent';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;
```

### 2. Write a Failing Story First

Before implementing, write the story that describes the expected behavior:

```typescript
export const Default: Story = {
  args: {
    title: 'Hello World',
  },
};
```

Run `bun run storybook` — the story should fail or show unexpected UI.

### 3. Implement the Component

Make the story pass by implementing the component behavior.

### 4. Add Play Functions for Interactions

```typescript
import { expect } from '@storybook/test';
import { userEvent, within } from '@storybook/test';

export const WithInteraction: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Simulate user interaction
    const button = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(button);
    
    // Assert callback was called
    await expect(args.onSubmit).toHaveBeenCalled();
  },
};
```

### 5. Verify with Tests

```bash
# Run all story tests
bun run test-storybook

# Update snapshots if intentional visual changes
bun run test-storybook:update
```

## Using Mock Data

Import mock factories from the mocks directory:

```typescript
import {
  createMockReviewThread,
  createMockDiffFile,
  createMockAnnotation,
  createMockFileTreeItem,
} from '../__stories__/mocks';

export const WithThread: Story = {
  args: {
    thread: createMockReviewThread({
      status: 'open',
      annotations: [
        createMockAnnotation({ type: 'comment', body: 'LGTM!' }),
      ],
    }),
  },
};
```

### Available Mock Factories

| Factory | Creates | Options |
|---------|---------|---------|
| `createMockReviewThread()` | ReviewThread | status, uri, annotations |
| `createMockDiffFile()` | DiffFile | path, status, hunks |
| `createMockDiffHunk()` | DiffHunk | lines, oldStart, newStart |
| `createMockAnnotation()` | ReviewAnnotation | type, body, author |
| `createMockFileTreeItem()` | FileTreeItem | path, status, commentCount |
| `createMockThreadSummary()` | ThreadSummary | id, firstLine, status |

## Visual Regression Testing

Stories are automatically tested for visual regressions using `@storybook/test-runner`.

### How It Works

1. Each story renders in a headless browser
2. A screenshot is captured and compared to the baseline
3. Differences above threshold fail the test

### Updating Baselines

When intentional visual changes are made:

```bash
# Update all snapshots
bun run test-storybook:update

# Review changes in git diff
git diff __image_snapshots__/
```

### Snapshot Location

Snapshots are stored in:
```
packages/vscode-hive/__image_snapshots__/
├── components-codeviewer--default.png
├── components-codeviewer--with-threads.png
└── ...
```

### Best Practices

- Only update snapshots for intentional changes
- Review snapshot diffs before committing
- Keep component dimensions consistent (use `parameters.layout`)

## Accessibility Testing

All stories are automatically checked with the a11y addon:

```typescript
export const AccessibleComponent: Story = {
  args: { /* ... */ },
  parameters: {
    a11y: {
      // Disable specific rules if needed (document why)
      config: {
        rules: [
          { id: 'color-contrast', enabled: false }, // Uses VS Code theme
        ],
      },
    },
  },
};
```

View a11y violations in the Storybook sidebar under the "Accessibility" tab.

## Stories vs Unit Tests

Stories and Vitest tests serve different purposes:

| Aspect | Stories | Vitest Tests |
|--------|---------|--------------|
| **Purpose** | Visual documentation, regression | Logic/edge case coverage |
| **Audience** | Developers, designers | Developers |
| **Speed** | Slower (browser) | Fast (JSDOM) |
| **Best for** | UI states, interactions | Complex logic, error cases |

### Keep in Vitest

- Edge cases not worth documenting visually
- Error handling with specific error messages
- Complex prop validation
- Internal helper functions

### Keep in Stories

- All visual states (empty, loading, error, success)
- User interactions (click, type, drag)
- Component composition
- Responsive layouts

## File Structure

```
packages/vscode-hive/
├── .storybook/
│   ├── main.ts           # Storybook config
│   ├── preview.ts        # Global decorators
│   └── manager.ts        # UI customization
├── src/webview/
│   ├── components/       # React components
│   ├── __stories__/      # Story files
│   │   ├── mocks/        # Mock data factories
│   │   ├── App.stories.tsx
│   │   ├── CodeViewer.stories.tsx
│   │   └── ...
│   └── __tests__/        # Vitest unit tests
├── __image_snapshots__/  # Visual regression baselines
└── STORYBOOK.md          # This file
```

## Troubleshooting

### Storybook won't start

```bash
# Clear cache and reinstall
rm -rf node_modules/.cache/storybook
bun install
bun run storybook
```

### Visual tests flaky

- Check for animations (disable in test mode)
- Use fixed viewport sizes
- Mock time-dependent content

### Test-runner timeout

```bash
# Increase timeout in test-runner-jest.config.js
testTimeout: 30000
```

### Missing styles in stories

Ensure styles are imported in `.storybook/preview.ts`:

```typescript
import '../src/webview/styles/index.css';
```
