/**
 * Button - Ant Design Button wrapper
 *
 * Provides a button component with primary, default, dashed, text, and link types.
 */
import type { ReactNode } from 'react';
export interface ButtonProps {
    /** Button type - determines visual style */
    type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
    /** Button size */
    size?: 'small' | 'middle' | 'large';
    /** Loading state - shows spinner and disables button */
    loading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Button content (optional for icon-only buttons) */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Icon element */
    icon?: ReactNode;
    /** Make button full width */
    block?: boolean;
    /** Danger button styling */
    danger?: boolean;
    /** HTML button type */
    htmlType?: 'button' | 'submit' | 'reset';
    /** Aria label for accessibility */
    'aria-label'?: string;
}
export declare function Button({ type, size, loading, disabled, onClick, children, className, style, icon, block, danger, htmlType, 'aria-label': ariaLabel, }: ButtonProps): React.ReactElement;
