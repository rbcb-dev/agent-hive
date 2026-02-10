/**
 * Card - Ant Design Card wrapper
 *
 * Provides a card container with title, actions, and various styling options.
 */
import type { ReactNode } from 'react';
export interface CardProps {
    /** Card title */
    title?: ReactNode;
    /** Card size */
    size?: 'default' | 'small';
    /** Show hover effect */
    hoverable?: boolean;
    /** Card content */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Card extra actions in header */
    extra?: ReactNode;
    /** Card variant (replaces bordered in v6) */
    variant?: 'outlined' | 'borderless';
    /** Click handler */
    onClick?: () => void;
    /** Test ID for testing */
    'data-testid'?: string;
}
export declare function Card({ title, size, hoverable, children, className, style, extra, variant, onClick, 'data-testid': dataTestId, }: CardProps): React.ReactElement;
