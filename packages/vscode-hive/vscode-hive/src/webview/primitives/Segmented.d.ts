/**
 * Segmented - Ant Design Segmented wrapper
 *
 * Modern tab-like switcher component (NOT deprecated).
 * Use this instead of Tabs for simple option switching.
 */
import type { ReactNode } from 'react';
export interface SegmentedOption {
    /** Display label */
    label: ReactNode;
    /** Value when selected */
    value: string | number;
    /** Icon to show before label */
    icon?: ReactNode;
    /** Disable this option */
    disabled?: boolean;
}
export interface SegmentedProps {
    /** Options to display */
    options: (string | number | SegmentedOption)[];
    /** Current value (controlled) */
    value?: string | number;
    /** Default value (uncontrolled) */
    defaultValue?: string | number;
    /** Change handler */
    onChange?: (value: string | number) => void;
    /** Disabled state */
    disabled?: boolean;
    /** Make full width */
    block?: boolean;
    /** Size variant */
    size?: 'small' | 'middle' | 'large';
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
export declare function Segmented({ options, value, defaultValue, onChange, disabled, block, size, className, style, }: SegmentedProps): React.ReactElement;
