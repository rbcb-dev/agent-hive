import type { StoryObj } from '@storybook/react-vite';
import { RadioGroup } from './RadioGroup';
declare const meta: {
    title: string;
    component: typeof RadioGroup;
    parameters: {
        layout: string;
    };
    tags: string[];
    argTypes: {
        options: {
            control: "object";
            description: string;
        };
        value: {
            control: "text";
            description: string;
        };
        defaultValue: {
            control: "text";
            description: string;
        };
        onChange: {
            action: string;
            description: string;
        };
        disabled: {
            control: "boolean";
            description: string;
        };
        optionType: {
            control: "select";
            options: string[];
            description: string;
        };
        buttonStyle: {
            control: "select";
            options: string[];
            description: string;
        };
        size: {
            control: "select";
            options: string[];
            description: string;
        };
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default radio group with standard radio buttons.
 */
export declare const Default: Story;
/**
 * Button style radio group.
 */
export declare const ButtonStyle: Story;
/**
 * Solid button style radio group.
 */
export declare const SolidButtons: Story;
/**
 * Disabled radio group.
 */
export declare const Disabled: Story;
/**
 * Radio group with a disabled option.
 */
export declare const WithDisabledOption: Story;
/**
 * Play test: verifies radio selection triggers onChange.
 */
export declare const SelectionInteraction: Story;
/**
 * Accessibility check: verifies radiogroup ARIA roles.
 */
export declare const AccessibilityCheck: Story;
