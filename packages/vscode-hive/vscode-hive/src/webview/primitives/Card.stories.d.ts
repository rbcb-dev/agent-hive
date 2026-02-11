import type { StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
declare const meta: {
    title: string;
    component: typeof Card;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        title: {
            control: "text";
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
        hoverable: {
            control: "boolean";
            description: string;
        };
        children: {
            control: "text";
            description: string;
        };
        variant: {
            control: "select";
            options: string[];
            description: string;
        };
        onClick: {
            action: string;
            description: string;
        };
        'data-testid': {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default card with title and content.
 */
export declare const Default: Story;
/**
 * Small card variant.
 */
export declare const Small: Story;
/**
 * Hoverable card with click handler.
 */
export declare const Hoverable: Story;
/**
 * Card with extra actions in the header.
 */
export declare const WithExtra: Story;
/**
 * Borderless card variant.
 */
export declare const Borderless: Story;
/**
 * Play test: verifies card renders and click works.
 */
export declare const ClickInteraction: Story;
/**
 * Accessibility check: verifies card structure.
 */
export declare const AccessibilityCheck: Story;
