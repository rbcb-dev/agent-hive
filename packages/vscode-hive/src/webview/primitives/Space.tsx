/**
 * Space - Ant Design Space wrapper
 * 
 * Provides spacing between inline elements with size and direction controls.
 * Note: Uses 'orientation' prop (non-deprecated) instead of 'direction'.
 */

import { Space as AntdSpace } from 'antd';
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

// Also export Space.Compact for button groups
const Compact = AntdSpace.Compact;

export function Space({
  orientation,
  size,
  align,
  wrap,
  children,
  className,
  style,
}: SpaceProps): React.ReactElement {
  // Use 'orientation' prop (non-deprecated in antd v6)
  return (
    <AntdSpace
      orientation={orientation}
      size={size}
      align={align}
      wrap={wrap}
      className={className}
      style={style}
    >
      {children}
    </AntdSpace>
  );
}

// Attach Compact as a static property
Space.Compact = Compact;
