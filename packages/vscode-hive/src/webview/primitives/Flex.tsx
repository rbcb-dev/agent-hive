/**
 * Flex - Ant Design Flex wrapper
 *
 * Provides a flexible layout container with gap, alignment, and direction controls.
 */

import { Flex as AntdFlex } from 'antd';
import type { ReactNode } from 'react';

export interface FlexProps {
  /** Stack items vertically (flex-direction: column) */
  vertical?: boolean;
  /** Gap between items - semantic values or number (pixels) */
  gap?: 'small' | 'middle' | 'large' | number;
  /** Alignment along the cross axis */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Alignment along the main axis */
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  /** Allow items to wrap to multiple lines */
  wrap?: boolean;
  /** Flex children */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function Flex({
  vertical,
  gap,
  align,
  justify,
  wrap,
  children,
  className,
  style,
}: FlexProps): React.ReactElement {
  return (
    <AntdFlex
      vertical={vertical}
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap ? 'wrap' : undefined}
      className={className}
      style={style}
    >
      {children}
    </AntdFlex>
  );
}
