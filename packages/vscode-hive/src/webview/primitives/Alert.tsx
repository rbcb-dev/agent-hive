/**
 * Alert - Ant Design Alert wrapper
 * 
 * Notification component for displaying messages with type variants.
 */

import { Alert as AntdAlert } from 'antd';
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

export function Alert({
  message,
  description,
  type,
  showIcon,
  closable,
  onClose,
  action,
  banner,
  className,
  style,
}: AlertProps): React.ReactElement {
  // Use 'title' prop internally (non-deprecated) but keep 'message' in our API for now
  // to maintain a familiar interface. In antd v6, message is deprecated in favor of title.
  return (
    <AntdAlert
      title={message}
      description={description}
      type={type}
      showIcon={showIcon}
      closable={closable}
      onClose={onClose}
      action={action}
      banner={banner}
      className={className}
      style={style}
    />
  );
}
