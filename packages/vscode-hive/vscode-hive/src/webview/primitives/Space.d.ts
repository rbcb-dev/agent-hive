/**
 * Space - Ant Design Space wrapper
 *
 * Provides spacing between inline elements with size and direction controls.
 * Note: Uses 'orientation' prop (non-deprecated) instead of 'direction'.
 */
import type { ReactNode } from 'react';
export interface SpaceProps {
    /** Space orientation - vertical or horizontal layout */
    orientation?: 'horizontal' | 'vertical';
    /** Gap size between items */
    size?: 'small' | 'middle' | 'large' | number;
    /** Align items */
    align?: 'start' | 'center' | 'end' | 'baseline';
    /** Allow items to wrap */
    wrap?: boolean;
    /** Space children */
    children: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
export declare function Space({ orientation, size, align, wrap, children, className, style, }: SpaceProps): React.ReactElement;
export declare namespace Space {
    var Compact: import("react").FC<import("antd/es/space/Compact").SpaceCompactProps>;
}
