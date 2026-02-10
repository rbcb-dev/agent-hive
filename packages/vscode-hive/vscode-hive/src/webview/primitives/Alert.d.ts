/**
 * Alert - Ant Design Alert wrapper
 *
 * Notification component for displaying messages with type variants.
 */
import type { ReactNode } from 'react';
export interface AlertProps {
    /** Alert title (replaces deprecated message) */
    message: ReactNode;
    /** Alert description (content below title) */
    description?: ReactNode;
    /** Alert type - determines styling */
    type?: 'success' | 'info' | 'warning' | 'error';
    /** Show icon */
    showIcon?: boolean;
    /** Closable alert */
    closable?: boolean;
    /** Close handler */
    onClose?: () => void;
    /** Action element (e.g., button) */
    action?: ReactNode;
    /** Display as banner (full width, no border) */
    banner?: boolean;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
export declare function Alert({ message, description, type, showIcon, closable, onClose, action, banner, className, style, }: AlertProps): React.ReactElement;
