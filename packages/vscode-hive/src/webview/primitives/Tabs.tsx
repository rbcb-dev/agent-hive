/**
 * Tabs - Ant Design Tabs wrapper
 *
 * Tab navigation using the items-based API (NOT deprecated TabPane).
 */

import { Tabs as AntdTabs } from 'antd';
import type { ReactNode } from 'react';

export interface TabItem {
  /** Unique key */
  key: string;
  /** Tab label */
  label: ReactNode;
  /** Tab panel content */
  children?: ReactNode;
  /** Disable this tab */
  disabled?: boolean;
  /** Icon to show before label */
  icon?: ReactNode;
  /** Close icon for editable tabs */
  closable?: boolean;
}

export interface TabsProps {
  /** Tab items configuration */
  items: TabItem[];
  /** Current active key (controlled) */
  activeKey?: string;
  /** Default active key (uncontrolled) */
  defaultActiveKey?: string;
  /** Tab change handler */
  onChange?: (activeKey: string) => void;
  /** Tab placement (uses semantic 'start'/'end' for RTL support) */
  tabPlacement?: 'top' | 'start' | 'bottom' | 'end';
  /** Tab type */
  type?: 'line' | 'card' | 'editable-card';
  /** Size variant */
  size?: 'small' | 'middle' | 'large';
  /** Center tabs */
  centered?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Destroy inactive panels (replaces deprecated destroyInactiveTabPane) */
  destroyOnHidden?: boolean;
}

export function Tabs({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  tabPlacement,
  type,
  size,
  centered,
  className,
  style,
  destroyOnHidden,
}: TabsProps): React.ReactElement {
  return (
    <AntdTabs
      items={items}
      activeKey={activeKey}
      defaultActiveKey={defaultActiveKey}
      onChange={onChange}
      tabPlacement={tabPlacement}
      type={type}
      size={size}
      centered={centered}
      className={className}
      style={style}
      destroyOnHidden={destroyOnHidden}
    />
  );
}
