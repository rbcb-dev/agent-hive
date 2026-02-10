/**
 * Segmented - Ant Design Segmented wrapper
 *
 * Modern tab-like switcher component (NOT deprecated).
 * Use this instead of Tabs for simple option switching.
 */

import { Segmented as AntdSegmented } from 'antd';
import type { SegmentedProps as AntdSegmentedProps } from 'antd';
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

export function Segmented({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  block,
  size,
  className,
  style,
}: SegmentedProps): React.ReactElement {
  return (
    <AntdSegmented
      options={options}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      block={block}
      size={size}
      className={className}
      style={style}
    />
  );
}
