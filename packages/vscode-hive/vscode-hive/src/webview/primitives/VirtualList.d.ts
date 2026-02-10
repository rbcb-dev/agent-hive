/**
 * VirtualList - @rc-component/virtual-list wrapper
 *
 * High-performance virtual scrolling list for large datasets.
 */
import type { ReactNode } from 'react';
export interface VirtualListProps<T> {
    /** Data array to render */
    data: T[];
    /** Container height */
    height: number;
    /** Individual item height */
    itemHeight: number;
    /** Key extractor - property name or function */
    itemKey: keyof T | ((item: T) => string | number);
    /** Render function for each item */
    children: (item: T, index: number, props?: object) => ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Full height mode */
    fullHeight?: boolean;
    /** Scroll event handler */
    onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}
export declare function VirtualList<T>({ data, height, itemHeight, itemKey, children, className, style, fullHeight, onScroll, }: VirtualListProps<T>): React.ReactElement;
