import type { StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';
declare const meta: {
    title: string;
    component: typeof Tabs;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        items: {
            control: "object";
            description: string;
        };
        activeKey: {
            control: "text";
            description: string;
        };
        defaultActiveKey: {
            control: "text";
            description: string;
        };
        onChange: {
            action: string;
            description: string;
        };
        tabPlacement: {
            control: "select";
            options: string[];
            description: string;
        };
        type: {
            control: "select";
            options: string[];
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
        centered: {
            control: "boolean";
            description: string;
        };
        destroyOnHidden: {
            control: "boolean";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default line-style tabs.
 */
export declare const Default: Story;
/**
 * Card-style tabs.
 */
export declare const CardStyle: Story;
/**
 * Centered tabs.
 */
export declare const Centered: Story;
/**
 * Small size tabs.
 */
export declare const SmallSize: Story;
/**
 * Tabs with a disabled tab item.
 */
export declare const WithDisabledTab: Story;
/**
 * Play test: verifies tab switching triggers onChange.
 */
export declare const TabSwitchInteraction: Story;
/**
 * Accessibility check: verifies tab ARIA roles.
 */
export declare const AccessibilityCheck: Story;
