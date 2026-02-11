import type { StoryObj } from '@storybook/react-vite';
import { Typography } from './Typography';
declare const meta: {
    title: string;
    component: typeof Typography;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        className: {
            control: "text";
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default typography with Title, Text, and Paragraph sub-components.
 */
export declare const Default: Story;
/**
 * All heading levels (1-5).
 */
export declare const HeadingLevels: Story;
/**
 * Text variants showing different type colors.
 */
export declare const TextTypes: Story;
/**
 * Text decorations: bold, italic, underline, strikethrough, mark, code, keyboard.
 */
export declare const TextDecorations: Story;
/**
 * Link sub-component.
 */
export declare const Links: Story;
/**
 * Paragraph with ellipsis.
 */
export declare const EllipsisParagraph: Story;
/**
 * Play test: verifies all sub-components render correctly.
 */
export declare const CompositionTest: Story;
/**
 * Accessibility check: verifies heading levels and semantic structure.
 */
export declare const AccessibilityCheck: Story;
