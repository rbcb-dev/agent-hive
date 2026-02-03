---
name: storybook-stories-expert
description: Comprehensive guide for creating, testing, and managing Storybook stories with best practices. Use when building component documentation, writing stories with tests, actions, and interactions, or reviewing story quality and coverage. Triggers on tasks involving Storybook configuration, story creation, story testing, interaction testing, accessibility testing, or visual regression testing.
license: MIT
metadata:
  author: storybook-community
  version: "8.0.0"
  keywords:
    - storybook
    - component-documentation
    - story-testing
    - interaction-testing
    - accessibility
    - visual-testing
    - component-development
---

# Storybook Stories Expert

Comprehensive guide for creating, testing, and managing Storybook stories with best practices. Based on Storybook 8.x and modern component development patterns.

## When to Apply

Reference these guidelines when:
- Creating new component stories (*.stories.ts/tsx)
- Adding interaction tests to stories (play function)
- Configuring story arguments and controls
- Setting up accessibility testing (a11y addon)
- Implementing visual regression testing
- Documenting components with Autodocs
- Creating story hierarchies and naming conventions
- Testing component behaviors with Storybook testing utilities

## Quick Reference: Story Structure

Every well-formed Storybook story follows this pattern:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta = {
  title: 'Category/ComponentName',
  component: Component,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    // Define control types
  },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { /* default args */ },
};

export const WithInteraction: Story = {
  args: { /* args */ },
  play: async ({ canvasElement }) => {
    // Interaction testing code
  },
};
```

## Core Concepts

### 1. Story Definition & CSF (Component Story Format)

**CSF = Component Story Format**: Named exports = stories, default export = metadata

**Best Practice: CSF3 (Recommended)**
- Use TypeScript with `StoryObj` for type safety
- Use `satisfies Meta<typeof Component>` for compile-time validation
- One story file per component minimum
- Use meaningful story names (PascalCase)

**Story Naming Convention:**
```
title: 'Category/SubCategory/ComponentName'
```

Examples:
- ✅ `title: 'Components/Forms/TextField'`
- ✅ `title: 'Patterns/Cards/ProductCard'`
- ✅ `title: 'Layout/Header'`
- ❌ `title: 'MyComponent'` (too vague)
- ❌ `title: 'components/forms/text-field'` (use PascalCase)

### 2. Args & ArgTypes (Component Props)

**Args**: Values passed to component for specific story variant
**ArgTypes**: Define how each prop appears in controls panel

**Best Practice:**
```typescript
const meta = {
  component: Button,
  argTypes: {
    // Explicit control definitions
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    onClick: {
      action: 'clicked', // Track in Actions panel
    },
  },
} satisfies Meta<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    children: 'Click me',
  },
};
```

**Control Types Priority:**
1. `select` - Finite set of string options (variants, sizes)
2. `radio` - Boolean or small set (layout, direction)
3. `text` - Free-form strings
4. `number` - Numeric values
5. `boolean` - True/false flags
6. `object` - Complex data structures (use sparingly)
7. `array` - Lists of items

### 3. Decorators & Global Setup

**Decorators**: Wrap components for consistent styling, themes, or providers

**Best Practice:**
```typescript
// Global decorators (preview.ts)
export const decorators = [
  (Story) => (
    <ThemeProvider theme={defaultTheme}>
      <Story />
    </ThemeProvider>
  ),
];

// Story-specific decorators
export const FormStory: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};
```

### 4. Parameters (Configuration & Metadata)

**Parameters**: Configure story-specific settings (layout, viewport, docs, etc.)

**Best Practice:**
```typescript
export const Primary: Story = {
  parameters: {
    // Layout options: fullscreen, padded, centered
    layout: 'centered',
    
    // Custom viewport for responsive testing
    viewport: {
      defaultViewport: 'mobile1',
    },
    
    // Doc blocks configuration
    docs: {
      source: {
        type: 'code', // Show generated code
      },
    },
    
    // Custom backgrounds
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#fff' },
        { name: 'dark', value: '#333' },
      ],
    },
  },
};
```

### 5. Interactions & Play Function (Core Testing)

**Play Function**: Simulates user interactions for behavior testing

**CRITICAL: Play Function Best Practices**

✅ **CORRECT:**
```typescript
import { expect, within, userEvent } from '@storybook/test';

export const UserInteraction: Story = {
  args: { label: 'Subscribe' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /subscribe/i });
    
    // Wait briefly for component to settle
    await expect(button).toBeInTheDocument();
    
    // Simulate user interaction
    await userEvent.click(button);
    
    // Assert expected behavior
    await expect(button).toHaveAttribute('disabled');
  },
};
```

❌ **INCORRECT:**
```typescript
export const BadInteraction: Story = {
  play: async ({ canvasElement }) => {
    // Missing canvas wrapper (hard to debug)
    const button = canvasElement.querySelector('button');
    button.click(); // Direct DOM manipulation (wrong)
    // No assertions (doesn't test anything)
  },
};
```

**Play Function Guidelines:**

1. **Always wrap with `within(canvasElement)`** - Scopes queries to story
2. **Use Testing Library queries** - `getByRole`, `getByText`, `queryByTestId`
3. **Use `userEvent` not `fireEvent`** - More realistic user simulation
4. **Always add `await expect()` checks** - Validates expected behavior
5. **Use semantic queries** - Prefer `getByRole` over `getByTestId`
6. **Test user flows** - Multiple interactions in sequence
7. **Add delays for async** - Use `waitFor()` for animations/network

**Advanced Play Patterns:**
```typescript
// Multi-step user journey
export const CompleteFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Step 1: Fill form
    const input = canvas.getByLabelText('Email');
    await userEvent.type(input, 'test@example.com');
    
    // Step 2: Submit
    const submit = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(submit);
    
    // Step 3: Verify success
    await expect(canvas.getByText('Success!')).toBeInTheDocument();
  },
};
```

### 6. Actions (Event Tracking)

**Actions**: Visually track callback invocations in Storybook UI

**Best Practice:**
```typescript
import { fn } from '@storybook/test';

const meta = {
  component: Button,
  args: {
    onClick: fn(), // Create trackable action
  },
} satisfies Meta<typeof Button>;

export const ClickTracking: Story = {
  args: {
    onClick: fn().mockName('button-click'), // Named for clarity
    children: 'Track me',
  },
};
```

**Action-specific patterns:**
```typescript
// Multiple actions
args: {
  onMouseEnter: fn().mockName('mouse-enter'),
  onMouseLeave: fn().mockName('mouse-leave'),
  onClick: fn().mockName('click'),
  onFocus: fn().mockName('focus'),
}

// With testing
play: async ({ args, canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole('button');
  
  await userEvent.hover(button);
  await expect(args.onMouseEnter).toHaveBeenCalled();
  
  await userEvent.unhover(button);
  await expect(args.onMouseLeave).toHaveBeenCalled();
},
```

### 7. Loaders (Pre-test Setup)

**Loaders**: Prepare component context before rendering (data, async setup)

**Best Practice:**
```typescript
export const WithData: Story = {
  loaders: [
    async () => ({
      items: await fetchItems(), // Async data fetching
    }),
  ],
  args: {
    // args receives loader data as props
    items: [], // Placeholder - overridden by loader
  },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    
    // Wait for async data to render
    await waitFor(() => {
      expect(canvas.getByText(loaded.items[0].name)).toBeInTheDocument();
    });
  },
};
```

### 8. Tags & Meta Information

**Tags**: Categorize stories for filtering and CI workflows

**Best Practice:**
```typescript
const meta = {
  tags: [
    'autodocs',        // Generate docs from stories
    'test',            // Mark for testing
    '!exclude-from-ci', // Skip in CI if needed
  ],
} satisfies Meta<typeof Component>;
```

**Standard Tags:**
- `autodocs` - Include in auto-generated documentation
- `test` - Run interaction tests in CI
- `a11y` - Include accessibility audit
- `!chromatic` - Skip visual testing (if using Chromatic)

### 9. Accessibility Testing (a11y)

**Integration with a11y addon:**

```typescript
export const Accessible: Story = {
  parameters: {
    a11y: {
      // Axe configuration
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

**Manual a11y checklist:**
- ✅ All interactive elements have labels
- ✅ Color contrast meets WCAG AA standards
- ✅ Keyboard navigation works
- ✅ ARIA attributes correct
- ✅ No missing alt text on images

### 10. Documentation & Autodocs

**Autodocs**: Auto-generate component documentation from stories

**Enable in component story:**
```typescript
const meta = {
  component: Button,
  tags: ['autodocs'], // Enable auto-docs
  parameters: {
    docs: {
      description: {
        component: 'Primary component for user actions',
      },
      source: {
        type: 'code',
        language: 'typescript',
      },
    },
  },
} satisfies Meta<typeof Button>;
```

**Custom doc blocks:**
```typescript
import { Meta, StoryObj, Description, Canvas, ArgTypes } from '@storybook/blocks';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      page: () => (
        <>
          <Description>
            Custom component description with **markdown** support
          </Description>
          <Canvas of={Primary} />
          <ArgTypes />
        </>
      ),
    },
  },
} satisfies Meta<typeof Button>;
```

## Story Testing Strategy

### Test Coverage Levels

**Level 1 (Rendering) - REQUIRED:**
```typescript
export const Default: Story = {
  args: { label: 'Button' },
  // Visual rendering alone is tested
};
```

**Level 2 (Interaction) - RECOMMENDED:**
```typescript
export const WithInteraction: Story = {
  args: { label: 'Click me' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
  },
};
```

**Level 3 (Accessibility) - BEST:**
```typescript
export const Accessible: Story = {
  args: { label: 'Accessible Button' },
  tags: ['a11y'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Keyboard navigation
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};
```

**Level 4 (E2E) - ADVANCED:**
```typescript
export const CompleteUserJourney: Story = {
  play: async ({ canvasElement, args }) => {
    // Multi-step flow with validations
    // Setup → Interaction → Verification
  },
};
```

### CI Integration for Story Testing

**Configuration (preview.ts):**
```typescript
export const parameters = {
  test: {
    disable: false,
  },
};
```

**Run tests:**
```bash
npm run test:storybook  # Run all play functions
npm run test:storybook -- --watch  # Watch mode
npm run test:storybook -- --coverage  # Coverage report
```

## Configuration Best Practices

### Main Configuration (main.ts)

```typescript
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.{ts,tsx}'],
  
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',      // Accessibility
    '@storybook/addon-coverage',   // Coverage reporting
  ],
  
  framework: '@storybook/react-webpack5',
  
  // Optimization
  core: {
    disableTelemetry: true,
    enableCrashReports: false,
  },
  
  // TypeScript support
  typescript: {
    check: false,
    checkOptions: {},
  },
};

export default config;
```

### Preview Configuration (preview.ts)

```typescript
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    // Default viewport
    viewport: {
      defaultViewport: 'desktop',
    },
    
    // Default layout
    layout: 'padded',
    
    // Control defaults
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  
  // Global decorators for all stories
  decorators: [
    (Story) => <Story />,
  ],
};

export default preview;
```

## Common Patterns & Templates

### 1. Form Component Story
```typescript
export const FormField: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    
    await userEvent.type(input, 'test@example.com');
    await expect(input).toHaveValue('test@example.com');
  },
};
```

### 2. Modal/Dialog Story
```typescript
export const Open: Story = {
  args: { isOpen: true, title: 'Confirm Action' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check modal is visible
    await expect(canvas.getByRole('dialog')).toBeInTheDocument();
    
    // Interact with modal
    const confirm = canvas.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirm);
    
    // Verify close
    await waitFor(() => {
      expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
```

### 3. Async Loading Story
```typescript
export const Loading: Story = {
  loaders: [
    async () => ({
      data: await new Promise(resolve =>
        setTimeout(() => resolve({ items: [1, 2, 3] }), 1000)
      ),
    }),
  ],
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    
    // Initially shows loading
    expect(canvas.getByRole('progressbar')).toBeInTheDocument();
    
    // Eventually shows data
    await waitFor(() => {
      expect(canvas.getByText('Item 1')).toBeInTheDocument();
    });
  },
};
```

### 4. Error State Story
```typescript
export const Error: Story = {
  args: { error: 'Failed to load data' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Show error message
    await expect(canvas.getByText('Failed to load data')).toBeInTheDocument();
    
    // Verify retry button
    const retry = canvas.getByRole('button', { name: /retry/i });
    await userEvent.click(retry);
    
    // Error should clear or retry
    await waitFor(() => {
      expect(canvas.queryByText('Failed to load data')).not.toBeInTheDocument();
    });
  },
};
```

## TypeScript Support

**Strong typing for stories:**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

const meta = {
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Type-safe story
export const Primary: Story = {
  args: {
    variant: 'primary', // ✅ Type-checked
    size: 'medium',
    disabled: false,
  },
};
```

## Performance Optimization

**Tips for faster Storybook:**

1. **Lazy load heavy addons:**
   ```typescript
   addons: [
     '@storybook/addon-interactions',
     // Only load coverage when needed
     process.env.COVERAGE && '@storybook/addon-coverage',
   ].filter(Boolean),
   ```

2. **Limit stories in watch mode:**
   ```bash
   npm run storybook -- --docs
   ```

3. **Use preview-body.html for global CSS:**
   ```html
   <!-- .storybook/preview-body.html -->
   <link rel="stylesheet" href="https://cdn.example.com/styles.css" />
   ```

4. **Cache decorators:**
   ```typescript
   const ThemeDecorator = memo((Story) => (
     <ThemeProvider>
       <Story />
     </ThemeProvider>
   ));
   ```

## Common Mistakes & Solutions

| Mistake | Problem | Solution |
|---------|---------|----------|
| Using `fireEvent` in play | Not realistic user simulation | Use `userEvent` instead |
| Missing `within(canvasElement)` | Hard to debug failed queries | Always scope queries to story |
| No assertions in play | Doesn't actually test | Add `expect()` statements |
| Args not matching component props | Props undefined in component | Ensure args keys match prop names |
| Play runs before render | Timing issues | Use `waitFor()` for async |
| Decorators not applied | Global styling missing | Check preview.ts config |
| Actions not showing | Callback not tracked | Use `fn()` for trackable actions |
| a11y warnings ignored | Accessibility gaps | Configure and fix axe violations |

## Quick Checklist

Before committing a story file:

- ✅ Story title follows `Category/ComponentName` pattern
- ✅ Args match component PropTypes/TypeScript types
- ✅ ArgTypes have appropriate controls and descriptions
- ✅ At least one story with `play()` function for interaction testing
- ✅ Play function uses `userEvent`, `within()`, and `expect()`
- ✅ Actions defined for all callbacks (`onClick`, `onSubmit`, etc.)
- ✅ Accessibility tags added if component is interactive
- ✅ Documentation covers main use cases
- ✅ No hardcoded placeholder data (use args)
- ✅ Story works in multiple viewports (check responsive)

## Resources

- **Official Docs**: https://storybook.js.org/docs
- **API Reference**: https://storybook.js.org/docs/api
- **Testing**: https://storybook.js.org/docs/writing-stories/play-function
- **Accessibility**: https://storybook.js.org/docs/writing-tests/accessibility-testing
- **Best Practices**: https://storybook.js.org/docs/writing-stories/best-practices
