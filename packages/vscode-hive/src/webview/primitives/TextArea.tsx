/**
 * TextArea - Ant Design Input.TextArea wrapper
 * 
 * Multi-line text input with autosize and character count support.
 */

import { Input } from 'antd';
import type { TextAreaProps as AntdTextAreaProps } from 'antd/es/input';
import type { ChangeEvent, KeyboardEvent } from 'react';

export interface TextAreaProps {
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-resize configuration */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  /** Show character count */
  showCount?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Number of visible rows (when not using autoSize) */
  rows?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Press enter handler */
  onPressEnter?: () => void;
  /** Key down handler */
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Input element id */
  id?: string;
  /** Aria describedby for accessibility */
  'aria-describedby'?: string;
}

export function TextArea({
  value,
  defaultValue,
  onChange,
  placeholder,
  autoSize,
  showCount,
  maxLength,
  disabled,
  readOnly,
  rows,
  className,
  style,
  onFocus,
  onBlur,
  onPressEnter,
  onKeyDown,
  id,
  'aria-describedby': ariaDescribedby,
}: TextAreaProps): React.ReactElement {
  return (
    <Input.TextArea
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={placeholder}
      autoSize={autoSize}
      showCount={showCount}
      maxLength={maxLength}
      disabled={disabled}
      readOnly={readOnly}
      rows={rows}
      className={className}
      style={style}
      onFocus={onFocus}
      onBlur={onBlur}
      onPressEnter={onPressEnter}
      onKeyDown={onKeyDown}
      id={id}
      aria-describedby={ariaDescribedby}
    />
  );
}
