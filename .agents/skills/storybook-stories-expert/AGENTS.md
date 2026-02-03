---
# Storybook Stories Expert - Agent Guidance
version: "8.0.0"
author: storybook-community
date: "2025-01-30"
---

# Storybook Stories Expert - Agent Guidance

Comprehensive reference for AI agents creating, testing, and reviewing Storybook stories with modern best practices.

## Abstract

This document provides detailed guidance for agents working with Storybook 8.x. It covers story creation, testing strategies, configuration, and quality assurance for component-driven development. Use this when building stories with interactions, tests, and accessibility features.

## Table of Contents

1. [Core Agent Responsibilities](#core-agent-responsibilities)
2. [Story Creation Workflow](#story-creation-workflow)
3. [Testing & Interaction Implementation](#testing--interaction-implementation)
4. [Configuration & Setup](#configuration--setup)
5. [Quality Assurance Checklist](#quality-assurance-checklist)
6. [Common Scenarios & Solutions](#common-scenarios--solutions)
7. [Integration with Build & CI](#integration-with-build--ci)

---

## Core Agent Responsibilities

### When This Skill Is Loaded

This skill activates when agents work on:
- Creating new `*.stories.ts` or `*.stories.tsx` files
- Adding interaction tests (`play` functions)
- Configuring story arguments and controls
- Writing accessibility tests for components
- Setting up visual regression testing
- Reviewing story quality and completeness
- Documenting components via Autodocs
- Debugging story rendering or testing issues

### Agent Capabilities by Type

#### **SCOUT-RESEARCHER** (Read-Only Investigation)
- Analyze existing story patterns in codebase
- Map story naming conventions and hierarchy
- Identify component props and TypeScript types
- Understand current Storybook configuration
- Research component interaction patterns
- Document accessibility requirements

**Key queries for scout:**
```
Find all *.stories.ts files and analyze:
  - Story title naming patterns
  - Common ArgType structures
  - Play function patterns
  - Accessibility testing patterns
  - Current test coverage gaps
```

#### **FORAGER-WORKER** (Story Implementation)
- Create new story files following templates
- Implement play() functions with tests
- Configure argTypes and controls
- Add accessibility testing
- Write documentation strings
- Set up loaders for async data

**Key deliverables:**
- Complete story file with 3+ story variants
- Play functions with proper assertions
- ArgTypes with descriptions
- TypeScript types (`StoryObj`)
- Tags for autodocs and testing

#### **ARCHITECT-PLANNER** (Strategy & Design)
- Plan story hierarchy and organization
- Design testing strategy (what to test)
- Identify edge cases for story variants
- Plan accessibility coverage
- Design documentation structure
- Review component API for completeness

**Planning outputs:**
- Story outline with all variants needed
- Test matrix (what stories need play functions)
- Accessibility checklist per component
- Documentation plan

#### **HYGIENIC-REVIEWER** (Quality Validation)
- Verify story follows naming conventions
- Check play functions use correct patterns
- Validate accessibility tags present
- Ensure TypeScript types correct
- Verify test coverage adequate
- Check documentation completeness

**Review checklist:**
- ✅ Title format: `Category/ComponentName`
- ✅ Args match component props
- ✅ ArgTypes have controls & descriptions
- ✅ Play functions use `userEvent` & `within()`
- ✅ Assertions present in play functions
- ✅ Actions defined for all callbacks
- ✅ Accessibility considerations addressed
- ✅ No hardcoded test data

---

## Story Creation Workflow

### Phase 1: Analysis (Scout or Architect)

Before writing any stories, understand:

1. **Component Props**
   ```typescript
   // Read the component's TypeScript interface
   interface ButtonProps {
     variant?: 'primary' | 'secondary' | 'danger';
     size?: 'small' | 'medium' | 'large';
     disabled?: boolean;
     onClick?: () => void;
     children: React.ReactNode;
   }
   ```

2. **Component Behavior**
   - What does it render?
   - What callbacks does it support?
   - How does it respond to user interaction?
   - Are there edge cases or special states?

3. **Existing Story Patterns**
   ```bash
   # Scout should analyze similar components
   grep -r "satisfies Meta" src/**/*.stories.ts
   grep -r "play: async" src/**/*.stories.ts
   ```

### Phase 2: Story Outline (Architect or Worker)

Create mental/documented outline of story variants:

**Minimal Story Set (Level 1):**
- Default/Primary - Normal state
- Disabled - Disabled state
- Error - Error state (if applicable)

**Complete Story Set (Level 2):**
- Primary - Main use case
- Secondary - Alternative variant
- Disabled - Disabled state
- Loading - Loading state (if async)
- Error - Error state
- Empty - Empty state (if applicable)

**Comprehensive Story Set (Level 3):**
- All above variants
- Edge cases (very long text, unicode, etc.)
- Responsive variants (mobile, tablet, desktop)
- Theme variants (light, dark)
- Interactive variants (with play functions)
- Accessibility variants (keyboard nav, screen reader)

### Phase 3: Implementation (Forager-Worker)

#### 3.1 Create Base Story File

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';
import { ComponentProps } from './Component.types';

/**
 * Brief description of the component
 * 
 * Supports multiple variants:
 * - Primary variant for main use case
 * - Secondary variant for alternatives
 * - Disabled state for interaction prevention
 */
const meta = {
  title: 'Components/Category/ComponentName',
  component: Component,
  
  // Enable auto-generated documentation
  tags: ['autodocs'],
  
  // Type-safe setup
  parameters: {
    layout: 'centered',
  },
  
  // Define all prop controls
  argTypes: {
    // ... see section 3.2
  },
  
  // Default args for all stories
  args: {
    // ... see section 3.3
  },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories defined below...
```

#### 3.2 Define ArgTypes

ArgTypes control what appears in the Storybook controls panel:

```typescript
argTypes: {
  // String with fixed options
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'danger'],
    description: 'Visual style of the button',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'primary' },
    },
  },
  
  // Boolean flag
  disabled: {
    control: 'boolean',
    description: 'Disable user interaction',
    table: {
      type: { summary: 'boolean' },
      defaultValue: { summary: 'false' },
    },
  },
  
  // Numeric value
  size: {
    control: { type: 'number', min: 8, max: 32, step: 1 },
    description: 'Font size in pixels',
  },
  
  // Free text input
  label: {
    control: 'text',
    description: 'Button label text',
  },
  
  // Callback (tracked as action)
  onClick: {
    action: 'clicked',
    description: 'Handler when button is clicked',
    table: {
      category: 'Events',
    },
  },
  
  // Enum with radio buttons
  alignment: {
    control: 'radio',
    options: ['left', 'center', 'right'],
  },
  
  // Complex object (use sparingly)
  config: {
    control: 'object',
    description: 'Advanced configuration',
  },
}
```

#### 3.3 Define Default Args

```typescript
args: {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  label: 'Click me',
  onClick: undefined, // Will be overridden by stories
}
```

#### 3.4 Create Story Variants

**Story 1: Primary/Default**
```typescript
export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary Button',
  },
};
```

**Story 2: With Interaction Test**
```typescript
import { expect, within, userEvent } from '@storybook/test';
import { fn } from '@storybook/test';

export const WithClick: Story = {
  args: {
    label: 'Click me',
    onClick: fn(), // Trackable action
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /click me/i });
    
    // Verify initial state
    await expect(button).toBeInTheDocument();
    await expect(button).not.toBeDisabled();
    
    // Simulate user interaction
    await userEvent.click(button);
    
    // Verify callback was called
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
```

**Story 3: Disabled State**
```typescript
export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled Button',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Verify disabled
    await expect(button).toBeDisabled();
    
    // Verify click doesn't fire
    await userEvent.click(button);
    // (onClick should not have been called)
  },
};
```

**Story 4: Accessibility Testing**
```typescript
export const Keyboard: Story = {
  args: {
    label: 'Keyboard accessible',
  },
  tags: ['a11y'],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Focus button
    button.focus();
    await expect(button).toHaveFocus();
    
    // Trigger with keyboard
    await userEvent.keyboard('{Enter}');
    
    // Verify action
    await expect(args.onClick).toHaveBeenCalled();
    
    // Test space bar too
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
```

**Story 5: Edge Cases**
```typescript
export const LongText: Story = {
  args: {
    label: 'This is a very long button label that might wrap or overflow depending on container width',
  },
  parameters: {
    layout: 'padded',
  },
};

export const Unicode: Story = {
  args: {
    label: '🚀 Rocket Button 🌟',
  },
};
```

---

## Testing & Interaction Implementation

### Best Practice: Play Function Structure

**Template:**
```typescript
play: async ({ canvasElement, args, loaded }) => {
  const canvas = within(canvasElement);
  
  // Step 1: Setup - Find elements and verify initial state
  const element = canvas.getByRole('button', { name: /label/i });
  await expect(element).toBeInTheDocument();
  
  // Step 2: Interact - Simulate user action
  await userEvent.click(element);
  // or
  await userEvent.hover(element);
  // or
  await userEvent.type(input, 'text');
  
  // Step 3: Assert - Verify expected outcome
  await expect(element).toHaveAttribute('aria-expanded', 'true');
  // or
  await expect(args.onClick).toHaveBeenCalled();
  
  // Step 4: Cleanup - Optional additional interactions
  await userEvent.click(element); // Close/toggle back
  await expect(element).toHaveAttribute('aria-expanded', 'false');
}
```

### Querying Elements Properly

**Always use `within()`:**
```typescript
// ✅ CORRECT - Scoped to story
const canvas = within(canvasElement);
const button = canvas.getByRole('button');

// ❌ WRONG - Global scope, hard to debug
const button = document.querySelector('button');
```

**Query priority (use in this order):**
```typescript
// 1. Most preferred: Semantic role query
canvas.getByRole('button', { name: /submit/i })

// 2. Form labels
canvas.getByLabelText('Email')

// 3. Visible text
canvas.getByText('Submit')

// 4. Last resort: Test ID
canvas.getByTestId('submit-button')

// Existence checks
canvas.queryByRole('button')  // Might not exist
canvas.findByRole('button')   // Async - waits for element
```

### User Interaction Patterns

**Text Input:**
```typescript
const input = canvas.getByLabelText('Email');
await userEvent.type(input, 'test@example.com');
await expect(input).toHaveValue('test@example.com');
```

**Click/Button:**
```typescript
const button = canvas.getByRole('button');
await userEvent.click(button);
await expect(args.onClick).toHaveBeenCalled();
```

**Hover/Focus:**
```typescript
const element = canvas.getByRole('button');
await userEvent.hover(element);
await expect(element).toHaveClass('hovered');
await userEvent.unhover(element);
```

**Keyboard:**
```typescript
const input = canvas.getByRole('textbox');
input.focus();
await userEvent.keyboard('{Enter}');
// or individual keys
await userEvent.keyboard('{Shift}');
```

**Select/Dropdown:**
```typescript
const select = canvas.getByRole('combobox');
await userEvent.click(select);
const option = canvas.getByText('Option 1');
await userEvent.click(option);
await expect(select).toHaveValue('option-1');
```

**Tab Navigation:**
```typescript
const firstButton = canvas.getByRole('button', { name: /first/i });
const secondButton = canvas.getByRole('button', { name: /second/i });

await userEvent.tab();
await expect(firstButton).toHaveFocus();

await userEvent.tab();
await expect(secondButton).toHaveFocus();
```

### Async & Waiting Patterns

**Wait for element to appear:**
```typescript
import { waitFor } from '@storybook/test';

export const WithAsyncLoad: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Element doesn't exist yet
    // waitFor polls until condition is met or timeout
    await waitFor(() => {
      expect(canvas.getByText('Loaded')).toBeInTheDocument();
    });
  },
};
```

**With animation/transition delays:**
```typescript
export const WithAnimation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Click to trigger animation
    await userEvent.click(button);
    
    // Wait for animation to complete
    await waitFor(
      () => {
        expect(canvas.getByText('Success')).toBeVisible();
      },
      { timeout: 2000 } // Animation takes up to 2 seconds
    );
  },
};
```

**Using loaders for data setup:**
```typescript
export const WithData: Story = {
  loaders: [
    async () => ({
      items: await fetchItems(),
      user: await fetchUser(),
    }),
  ],
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    
    // Access loaded data
    const firstItem = loaded.items[0];
    
    // Wait for component to render data
    await waitFor(() => {
      expect(canvas.getByText(firstItem.name)).toBeInTheDocument();
    });
  },
};
```

### Testing Callbacks/Actions

**Using `fn()` for tracking:**
```typescript
import { fn } from '@storybook/test';

export const TrackingActions: Story = {
  args: {
    onClick: fn().mockName('button-click'),
    onHover: fn().mockName('button-hover'),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    // Test click
    await userEvent.click(button);
    expect(args.onClick).toHaveBeenCalledTimes(1);
    
    // Test hover
    await userEvent.hover(button);
    expect(args.onHover).toHaveBeenCalled();
    expect(args.onClick).toHaveBeenCalledTimes(1); // Still 1
  },
};
```

**Verifying callback parameters:**
```typescript
export const CallbackParams: Story = {
  args: {
    onSelect: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByRole('option', { name: /item 1/i });
    
    await userEvent.click(item);
    
    // Verify what was passed to callback
    expect(args.onSelect).toHaveBeenCalledWith({
      id: '1',
      name: 'Item 1',
    });
  },
};
```

---

## Configuration & Setup

### Storybook Installation & Setup

**New Storybook project:**
```bash
npx storybook@latest init
# Includes essential addons by default
```

**Add to existing project:**
```bash
npm install -D @storybook/react @storybook/addon-essentials
npx storybook@latest init
```

### Essential Addons

**Add to `main.ts`:**
```typescript
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.{ts,tsx}'],
  
  addons: [
    // Essential addons (always include)
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions', // For play() functions
    
    // Testing & Quality (recommended)
    '@storybook/addon-a11y',      // Accessibility
    '@storybook/addon-coverage',   // Coverage reports
    
    // Optional but useful
    '@storybook/addon-viewport',   // Responsive testing
    '@storybook/addon-backgrounds', // Background testing
  ],
};
```

### Global Configuration

**Set up `preview.ts`:**
```typescript
import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

const preview: Preview = {
  parameters: {
    // Default viewport for all stories
    viewport: {
      defaultViewport: 'desktop',
      viewports: INITIAL_VIEWPORTS,
    },
    
    // Default layout
    layout: 'padded',
    
    // Control settings
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    
    // A11y configuration
    a11y: {
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
  
  // Global decorators (applied to all stories)
  decorators: [
    // Example: Theme provider
    (Story) => <div style={{ fontFamily: 'Arial' }}><Story /></div>,
  ],
};

export default preview;
```

### TypeScript Setup

**Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "types": ["@storybook/react/types"]
  }
}
```

---

## Quality Assurance Checklist

### Pre-Commit Verification

Before committing story files, verify:

**Story Structure:**
- [ ] Story file named `*.stories.ts` or `*.stories.tsx`
- [ ] Exports default meta object with `satisfies Meta`
- [ ] Type definition: `type Story = StoryObj<typeof meta>`
- [ ] At least 3 story variants exported
- [ ] Stories use meaningful, descriptive names (PascalCase)

**Meta Configuration:**
- [ ] `title` follows pattern: `Category/ComponentName`
- [ ] `component` imported correctly
- [ ] `tags: ['autodocs']` present for documentation
- [ ] `argTypes` defined for all props
- [ ] Description text provided for complex props

**Story Variants:**
- [ ] Primary variant for main use case
- [ ] Secondary variant for alternative
- [ ] Disabled/Error state if applicable
- [ ] At least one variant with `play()` function
- [ ] At least one variant with proper interaction testing

**Play Function Quality:**
- [ ] Uses `within(canvasElement)` for element queries
- [ ] Uses `userEvent` not `fireEvent`
- [ ] Includes multiple `await expect()` assertions
- [ ] Tests realistic user flows
- [ ] No race conditions (uses `waitFor` for async)
- [ ] Properly handles actions with `fn()`

**Accessibility:**
- [ ] Interactive elements have proper ARIA roles
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] `a11y` tag present for components needing accessibility testing
- [ ] No form inputs without labels

**Documentation:**
- [ ] Component description provided
- [ ] Props have descriptions in argTypes
- [ ] Default values documented
- [ ] Edge cases shown (unicode, long text, etc.)
- [ ] No hardcoded test data (use args)

**Testing:**
- [ ] Story renders without errors
- [ ] Play functions execute without warnings
- [ ] Args properly passed to component
- [ ] Actions fire correctly
- [ ] Responsive testing verified (mobile/tablet/desktop)

### Quick Validation Commands

```bash
# Check for story files
find src -name "*.stories.ts" -o -name "*.stories.tsx"

# Verify Storybook builds
npm run build:storybook

# Run interaction tests
npm run test:storybook

# Run accessibility audits
npm run test:accessibility

# Check coverage
npm run test:coverage
```

---

## Common Scenarios & Solutions

### Scenario 1: Story Won't Render

**Symptoms:** "Component is not a valid element" or blank canvas

**Solutions:**
1. Verify component is imported correctly
2. Check component export is default or named correctly
3. Verify `component: ComponentName` in meta
4. Check for TypeScript errors: `npm run type-check`

```typescript
// ❌ Wrong
import Component from './Component';  // Unnamed import
import { Component } from './Component';  // Named import but not exported as default

// ✅ Correct
import { Component } from './Component';  // If named export
import Component from './Component';  // If default export
```

### Scenario 2: Play Function Never Executes

**Symptoms:** Play function in code but no interactions happen

**Solutions:**
1. Verify story exports correctly
2. Check browser console for errors
3. Ensure `@storybook/addon-interactions` in addons
4. Use `waitFor()` for async elements

```typescript
// ❌ Won't run
export const MyStory = {
  play: async () => { /* ... */ }
};

// ✅ Correct
export const MyStory: Story = {
  play: async ({ canvasElement }) => { /* ... */ }
};
```

### Scenario 3: Elements Can't Be Found

**Symptoms:** "Unable to find an element with role..."

**Solutions:**
1. Always use `within(canvasElement)`
2. Check element actually renders (debug with `canvas.debug()`)
3. Use correct role name
4. Add test IDs as fallback

```typescript
// ❌ Wrong
const button = canvasElement.querySelector('button');

// ✅ Correct
const canvas = within(canvasElement);
const button = canvas.getByRole('button', { name: /label/i });

// Debug
canvas.debug(); // Print DOM tree
```

### Scenario 4: Async State Not Working

**Symptoms:** Assertions fail because element not rendered yet

**Solutions:**
1. Use `waitFor()` with timeout
2. Use `findBy` instead of `getBy`
3. Increase timeout if needed

```typescript
// ❌ Fails due to timing
const element = canvas.getByText('Loaded');

// ✅ Waits for element
await waitFor(() => {
  expect(canvas.getByText('Loaded')).toBeInTheDocument();
});

// ✅ Alternative with findBy
const element = await canvas.findByText('Loaded', {}, { timeout: 3000 });
```

### Scenario 5: Actions Not Tracked

**Symptoms:** Actions panel empty even with onClick

**Solutions:**
1. Use `fn()` for actions
2. Mock all callbacks that should be tracked
3. Use `mockName()` for clarity

```typescript
// ❌ Not tracked
args: {
  onClick: undefined  // No mock
}

// ✅ Tracked
import { fn } from '@storybook/test';

args: {
  onClick: fn().mockName('click-handler')
}
```

### Scenario 6: Controls Not Showing

**Symptoms:** No controls panel for props

**Solutions:**
1. Define `argTypes` for each prop
2. Specify correct `control` type
3. Check spelling of prop names

```typescript
// ❌ No controls
argTypes: {}

// ✅ With controls
argTypes: {
  variant: {
    control: 'select',
    options: ['primary', 'secondary'],
  },
}
```

### Scenario 7: TypeScript Errors in Stories

**Symptoms:** "Type '{}' is missing the following properties..."

**Solutions:**
1. Use `satisfies Meta<typeof Component>`
2. Use `StoryObj<typeof meta>` for type
3. Ensure args match component props

```typescript
// ❌ Type error
const meta = {
  component: Button,
  argTypes: { /* ... */ }
};

// ✅ Type safe
const meta = {
  component: Button,
  argTypes: { /* ... */ }
} satisfies Meta<typeof Button>;
```

---

## Integration with Build & CI

### Local Development

**Start Storybook:**
```bash
npm run storybook
# Runs on http://localhost:6006
```

**Build static Storybook:**
```bash
npm run build:storybook
# Outputs to ./storybook-static
```

### CI/CD Integration

**Add to GitHub Actions:**
```yaml
name: Storybook Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Run story interaction tests
      - run: npm run test:storybook
      
      # Check accessibility
      - run: npm run test:a11y
      
      # Generate coverage
      - run: npm run test:coverage
      
      # Build Storybook
      - run: npm run build:storybook
      
      # Optional: Deploy to Chromatic for visual testing
      - uses: chromatic-com/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### Package.json Scripts

**Add to `package.json`:**
```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build:storybook": "storybook build",
    "test:storybook": "test-storybook",
    "test:storybook:watch": "test-storybook --watch",
    "test:a11y": "npm run build:storybook && pa11y-ci",
    "test:coverage": "test-storybook --coverage"
  }
}
```

### Deployment

**Deploy to Netlify:**
```toml
[build]
command = "npm run build:storybook"
publish = "storybook-static"
```

**Deploy to Vercel:**
```json
{
  "buildCommand": "npm run build:storybook",
  "outputDirectory": "storybook-static"
}
```

---

## Summary for Agents

**When implementing stories:**

1. **Analyze** the component (scout)
2. **Plan** story variants and test strategy (architect)
3. **Create** story file with proper structure (forager)
4. **Test** each variant with play functions
5. **Review** for quality and completeness (reviewer)
6. **Verify** all tests pass locally
7. **Commit** with clear message

**Story file template checklist:**
```
✅ Import Meta, StoryObj, fn, userEvent, expect, within
✅ Define meta with title, component, tags, argTypes
✅ Export default meta with satisfies validation
✅ Define type Story = StoryObj<typeof meta>
✅ Create Primary story (basic rendering)
✅ Create interaction story (with play function)
✅ Create edge case story (empty, error, etc.)
✅ All argTypes match component props
✅ All play functions test realistic flows
✅ All callbacks tracked with fn()
✅ TypeScript compiles without errors
✅ Storybook builds successfully
```

**Quality goals:**
- Zero TypeScript errors
- 100% of interactive components have play functions
- All user-facing text searchable and testable
- Accessibility tags present for WCAG compliance
- Documentation auto-generated from stories
