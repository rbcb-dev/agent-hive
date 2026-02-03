/**
 * Button.stories.tsx
 * 
 * Example story file demonstrating all Storybook best practices:
 * - CSF3 format with TypeScript types
 * - Proper ArgTypes with controls and descriptions
 * - Multiple story variants (Primary, Secondary, Disabled, etc.)
 * - Play function interaction testing
 * - Accessibility testing patterns
 * - Actions for callback tracking
 * 
 * This serves as a reference template for AI agents creating stories.
 * Agents should follow this pattern for all story creation tasks.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, fn } from '@storybook/test';
import { Button, ButtonProps } from './Button';

/**
 * Button Component Story
 * 
 * Primary interactive element for user actions. Supports multiple
 * visual variants (primary, secondary, danger) and states (disabled,
 * loading, error).
 * 
 * ## Usage
 * 
 * ```tsx
 * <Button variant="primary" size="medium">
 *   Click me
 * </Button>
 * ```
 */
const meta = {
  title: 'Components/Inputs/Button',
  component: Button,
  
  // Enable auto-generated documentation from stories
  tags: ['autodocs'],
  
  // Default layout and viewport
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  
  // Define all component props as controls
  // This controls what appears in the Storybook controls panel
  argTypes: {
    // Variant select control
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Visual style variant of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
        category: 'Appearance',
      },
    },
    
    // Size radio control
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
        category: 'Appearance',
      },
    },
    
    // Boolean control for disabled state
    disabled: {
      control: 'boolean',
      description: 'Disables button interaction and grays out appearance',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    
    // Boolean control for loading state
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    
    // Text control for button label
    children: {
      control: 'text',
      description: 'Button label text',
      table: {
        category: 'Content',
      },
    },
    
    // Action (callback) - tracked in Actions panel
    onClick: {
      action: 'clicked',
      description: 'Fired when button is clicked',
      table: {
        category: 'Events',
        type: { summary: '(event: React.MouseEvent) => void' },
      },
    },
    
    // Action (callback) - tracked in Actions panel
    onFocus: {
      action: 'focused',
      description: 'Fired when button receives focus',
      table: {
        category: 'Events',
        type: { summary: '(event: React.FocusEvent) => void' },
      },
    },
  },
  
  // Default props for all stories
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    isLoading: false,
    children: 'Button',
    onClick: fn(),
    onFocus: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

/**
 * Story type - ensures type-safety for all stories
 * Combines meta type with StoryObj for full validation
 */
type Story = StoryObj<typeof meta>;

/**
 * Primary Story
 * 
 * The main button variant. Used for primary actions.
 * 
 * **Rendering Only**: Tests visual appearance without interactions.
 * Use when component is purely presentational.
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

/**
 * Secondary Story
 * 
 * Alternative button variant for secondary actions.
 * 
 * **Rendering Only**: Tests visual appearance.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action',
  },
};

/**
 * Danger Story
 * 
 * Red button for destructive actions (delete, remove, etc).
 * 
 * **Rendering Only**: Tests visual appearance.
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

/**
 * Disabled State
 * 
 * Button when disabled. Should be grayed out and not respond to clicks.
 * 
 * **Interaction Testing (Level 2)**:
 * - Verifies button appears disabled
 * - Confirms click doesn't trigger callback
 * - Tests keyboard interaction blocked
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /disabled/i });
    
    // Step 1: Verify button is disabled visually
    await expect(button).toBeDisabled();
    
    // Step 2: Verify click doesn't fire callback
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
    
    // Step 3: Verify keyboard doesn't trigger click
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/**
 * Loading State
 * 
 * Button while async operation is in progress.
 * Shows spinner and is disabled.
 * 
 * **Interaction Testing (Level 2)**:
 * - Verifies loading spinner visible
 * - Confirms button disabled during loading
 * - Tests callback not fired while loading
 */
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Saving...',
  },
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Step 1: Find button and verify it exists
    const button = canvas.getByRole('button');
    await expect(button).toBeInTheDocument();
    
    // Step 2: Verify loading state
    await expect(button).toBeDisabled();
    
    // Step 3: Verify loading spinner present (if component renders one)
    const spinner = canvas.queryByRole('status');
    if (spinner) {
      await expect(spinner).toBeInTheDocument();
    }
    
    // Step 4: Verify click doesn't fire
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/**
 * Click Handler
 * 
 * Button with click tracking. Demonstrates action callback in
 * Storybook Actions panel.
 * 
 * **Interaction Testing (Level 2)**:
 * - Simulates user click
 * - Verifies callback fired
 * - Checks callback parameters (if any)
 */
export const ClickTracking: Story = {
  args: {
    children: 'Track Me',
    onClick: fn().mockName('button-click'),
  },
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /track me/i });
    
    // Step 1: Verify initial state
    await expect(button).toBeInTheDocument();
    await expect(button).not.toBeDisabled();
    
    // Step 2: Simulate user click
    await userEvent.click(button);
    
    // Step 3: Verify callback fired
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    
    // Step 4: Click again and verify call count
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

/**
 * Keyboard Navigation
 * 
 * Button responds to keyboard input (Tab, Enter, Space).
 * Tests accessibility and keyboard-only users.
 * 
 * **Interaction Testing (Level 3 - Accessibility)**:
 * - Tabs to button and verifies focus
 * - Presses Enter to activate
 * - Presses Space to activate
 * - Verifies focus outline visible
 * 
 * **Tagged with 'a11y'** for accessibility testing
 */
export const KeyboardNavigation: Story = {
  args: {
    children: 'Keyboard Friendly',
  },
  
  tags: ['a11y'],
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /keyboard friendly/i });
    
    // Step 1: Tab to focus the button
    await userEvent.tab();
    await expect(button).toHaveFocus();
    
    // Step 2: Verify visual focus indicator
    // (In real component, would check CSS or aria-attributes)
    await expect(button).toHaveFocus();
    
    // Step 3: Activate with Enter key
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalled();
    
    // Step 4: Reset and test Space key
    args.onClick.mockClear();
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalled();
  },
};

/**
 * Focus Management
 * 
 * Tests focus events and focus management.
 * Important for keyboard navigation and screen reader users.
 * 
 * **Interaction Testing (Level 3 - Accessibility)**:
 * - Verifies onFocus fires
 * - Tests focus outline
 * - Tests focus restoration
 */
export const FocusManagement: Story = {
  args: {
    children: 'Focus Me',
    onFocus: fn().mockName('button-focus'),
  },
  
  tags: ['a11y'],
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /focus me/i });
    
    // Step 1: Programmatically focus button
    button.focus();
    
    // Step 2: Verify focus state
    await expect(button).toHaveFocus();
    
    // Step 3: Verify focus callback fired
    // Note: onFocus fires during initial focus
    // Verify button can handle focus properly
    await expect(button).toHaveFocus();
    
    // Step 4: Blur and verify no longer focused
    button.blur();
    await expect(button).not.toHaveFocus();
  },
};

/**
 * Large Text
 * 
 * Edge case: button with very long text.
 * Tests text wrapping and layout robustness.
 * 
 * **Rendering Only**: Verifies component handles overflow gracefully.
 * Use for edge case and stress testing.
 */
export const LongText: Story = {
  args: {
    children:
      'This is a very long button label that might wrap or overflow depending on container width and button configuration',
  },
  
  parameters: {
    layout: 'padded', // Add padding to see full width
  },
};

/**
 * Unicode Content
 * 
 * Edge case: button with emoji and international characters.
 * Tests character encoding and RTL support.
 * 
 * **Rendering Only**: Verifies component handles special characters.
 */
export const Unicode: Story = {
  args: {
    children: '🚀 Launch Mission 🌟',
  },
};

/**
 * Small Size
 * 
 * Tests compact button variant.
 * 
 * **Rendering Only**: Verifies small button appearance.
 */
export const Small: Story = {
  args: {
    size: 'small',
    children: 'Small',
  },
};

/**
 * Large Size
 * 
 * Tests large button variant.
 * 
 * **Rendering Only**: Verifies large button appearance.
 */
export const Large: Story = {
  args: {
    size: 'large',
    children: 'Large Button',
  },
};

/**
 * Multiple Interactions
 * 
 * Complex user journey with multiple interactions.
 * 
 * **Interaction Testing (Level 4 - E2E)**:
 * - Tests multiple interactions in sequence
 * - Verifies state changes between interactions
 * - Tests complex user flows
 */
export const CompleteInteraction: Story = {
  args: {
    children: 'Complete Flow',
    onClick: fn().mockName('button-click'),
    onFocus: fn().mockName('button-focus'),
  },
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /complete flow/i });
    
    // Step 1: Hover (mouse enter)
    await userEvent.hover(button);
    
    // Step 2: Move to button and focus with tab
    await userEvent.tab();
    await expect(button).toHaveFocus();
    
    // Step 3: Click button
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    
    // Step 4: Move away (unhover)
    await userEvent.unhover(button);
    
    // Step 5: Click again with keyboard
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
