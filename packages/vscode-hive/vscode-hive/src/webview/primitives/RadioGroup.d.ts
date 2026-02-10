/**
 * RadioGroup - Ant Design Radio.Group wrapper
 *
 * Provides a group of radio buttons for single selection.
 */
import type { RadioChangeEvent } from 'antd';
import type { ReactNode } from 'react';
export interface RadioOption {
    /** Display label */
    label: ReactNode;
    /** Value when selected */
    value: string | number;
    /** Disable this option */
    disabled?: boolean;
}
export interface RadioGroupProps {
    /** Radio options */
    options: RadioOption[];
    /** Current value (controlled) */
    value?: string | number;
    /** Default value (uncontrolled) */
    defaultValue?: string | number;
    /** Change handler */
    onChange?: (e: RadioChangeEvent) => void;
    /** Disabled state for all options */
    disabled?: boolean;
    /** Option display type */
    optionType?: 'default' | 'button';
    /** Button style (when optionType="button") */
    buttonStyle?: 'outline' | 'solid';
    /** Size variant */
    size?: 'small' | 'middle' | 'large';
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
export declare function RadioGroup({ options, value, defaultValue, onChange, disabled, optionType, buttonStyle, size, className, style, }: RadioGroupProps): React.ReactElement;
export type { RadioChangeEvent } from 'antd';
