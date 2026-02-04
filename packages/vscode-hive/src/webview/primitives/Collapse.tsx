/**
 * Collapse - Ant Design Collapse wrapper
 * 
 * Accordion/collapsible panel component using items-based API.
 */

import { Collapse as AntdCollapse } from 'antd';
import type { ReactNode } from 'react';

export interface CollapseItem {
  /** Unique key */
  key: string;
  /** Panel header label */
  label: ReactNode;
  /** Panel content */
  children?: ReactNode;
  /** Extra element in header */
  extra?: ReactNode;
  /** Show arrow icon */
  showArrow?: boolean;
  /** Force render content even when collapsed */
  forceRender?: boolean;
}

export interface CollapseProps {
  /** Collapse items configuration */
  items: CollapseItem[];
  /** Current active key(s) (controlled) */
  activeKey?: string | number | (string | number)[];
  /** Default active key(s) (uncontrolled) */
  defaultActiveKey?: string | number | (string | number)[];
  /** Change handler */
  onChange?: (key: string | string[]) => void;
  /** Only one panel open at a time */
  accordion?: boolean;
  /** Show border around collapse */
  bordered?: boolean;
  /** Ghost mode - transparent background, no border */
  ghost?: boolean;
  /** Size variant */
  size?: 'small' | 'middle' | 'large';
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Destroy content when collapsed (replaces destroyInactivePanel) */
  destroyOnHidden?: boolean;
}

export function Collapse({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  accordion,
  bordered,
  ghost,
  size,
  className,
  style,
  destroyOnHidden,
}: CollapseProps): React.ReactElement {
  return (
    <AntdCollapse
      items={items}
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey}
      onChange={onChange}
      accordion={accordion}
      bordered={bordered}
      ghost={ghost}
      size={size}
      className={className}
      style={style}
      destroyOnHidden={destroyOnHidden}
    />
  );
}
