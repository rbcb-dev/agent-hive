import type { StoryObj } from '@storybook/react-vite';
import { Layout } from './Layout';
declare const meta: {
    title: string;
    component: typeof Layout;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        hasSider: {
            control: "boolean";
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Basic layout with Header, Content, and Footer.
 */
export declare const Default: Story;
/**
 * Layout with sidebar using Sider sub-component.
 */
export declare const WithSider: Story;
/**
 * Layout with sider on the right side.
 */
export declare const SiderRight: Story;
/**
 * Content-only layout (no header/footer).
 */
export declare const ContentOnly: Story;
/**
 * Play test: verifies all sub-components render.
 */
export declare const CompositionTest: Story;
/**
 * Accessibility check: verifies semantic structure.
 */
export declare const AccessibilityCheck: Story;
