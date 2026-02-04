/**
 * Layout - Ant Design Layout wrapper
 * 
 * Application layout structure with Header, Content, Footer, and Sider.
 */

import { Layout as AntdLayout } from 'antd';
import type { ReactNode } from 'react';

// Re-export sub-components
const { Header, Content, Footer, Sider } = AntdLayout;

export interface LayoutProps {
  /** Layout children */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Use flexbox layout */
  hasSider?: boolean;
}

export interface HeaderProps {
  /** Header children */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export interface ContentProps {
  /** Content children */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export interface FooterProps {
  /** Footer children */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export interface SiderProps {
  /** Sider children */
  children?: ReactNode;
  /** Width in pixels or percentage */
  width?: number | string;
  /** Collapsed width */
  collapsedWidth?: number;
  /** Collapsed state (controlled) */
  collapsed?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Enable collapse functionality */
  collapsible?: boolean;
  /** Collapse handler */
  onCollapse?: (collapsed: boolean) => void;
  /** Reverse collapse direction */
  reverseArrow?: boolean;
  /** Sider theme */
  theme?: 'light' | 'dark';
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Breakpoint for responsive collapse */
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Breakpoint collapse handler */
  onBreakpoint?: (broken: boolean) => void;
}

function Layout({
  children,
  className,
  style,
  hasSider,
}: LayoutProps): React.ReactElement {
  return (
    <AntdLayout className={className} style={style} hasSider={hasSider}>
      {children}
    </AntdLayout>
  );
}

// Attach sub-components as static properties
Layout.Header = Header;
Layout.Content = Content;
Layout.Footer = Footer;
Layout.Sider = Sider;

export { Layout };
