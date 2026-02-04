/**
 * Button - Ant Design Button wrapper
 * 
 * Provides a button component with primary, default, dashed, text, and link types.
 */

import { Button as AntdButton } from 'antd';
import type { ButtonProps as AntdButtonProps } from 'antd';
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
  /** Button content */
  children: ReactNode;
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
}

export function Button({
  type = 'default',
  size,
  loading,
  disabled,
  onClick,
  children,
  className,
  style,
  icon,
  block,
  danger,
  htmlType,
}: ButtonProps): React.ReactElement {
  return (
    <AntdButton
      type={type}
      size={size}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={style}
      icon={icon}
      block={block}
      danger={danger}
      htmlType={htmlType}
    >
      {children}
    </AntdButton>
  );
}
