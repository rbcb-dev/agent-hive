/**
 * Storybook stories for HiveWorkspaceProvider
 *
 * Demonstrates the provider with a simple consumer component
 * that displays and interacts with workspace state.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { HiveWorkspaceProviderProps } from './HiveWorkspaceProvider';
type StoryProps = Omit<HiveWorkspaceProviderProps, 'children'>;
declare const meta: Meta<StoryProps>;
export default meta;
type Story = StoryObj<StoryProps>;
/**
 * Default state: no active feature selected.
 * Click a feature name to select it and observe state changes.
 */
export declare const Default: Story;
/**
 * With a feature pre-selected.
 */
export declare const WithActiveFeature: Story;
/**
 * Loading state active.
 */
export declare const Loading: Story;
