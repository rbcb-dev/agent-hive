/**
 * Primitives Layer - The ONLY antd import boundary
 * 
 * This module re-exports all primitive components that wrap antd components.
 * All other application components should import from this module,
 * NOT directly from 'antd'.
 * 
 * Benefits:
 * - Single point of antd imports → easy future migration
 * - Controlled API surface → only expose what we need
 * - Type safety with our own interfaces
 * - No antd-specific concepts leak to components
 * 
 * @example
 * // Good - import from primitives
 * import { Button, Flex, Card } from '../primitives';
 * 
 * // Bad - direct antd import in components
 * import { Button } from 'antd'; // ❌ Don't do this in components/
 */

// Components
export { Button } from './Button';
export { Card } from './Card';
export { Flex } from './Flex';
export { Space } from './Space';
export { Tree } from './Tree';
export { Segmented } from './Segmented';
export { Tabs } from './Tabs';
export { Collapse } from './Collapse';
export { RadioGroup } from './RadioGroup';
export { TextArea } from './TextArea';
export { Alert } from './Alert';
export { Layout } from './Layout';
export { Typography } from './Typography';
export { VirtualList } from './VirtualList';

// Types
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { FlexProps } from './Flex';
export type { SpaceProps } from './Space';
export type { TreeProps, TreeDataNode } from './Tree';
export type { SegmentedProps, SegmentedOption } from './Segmented';
export type { TabsProps, TabItem } from './Tabs';
export type { CollapseProps, CollapseItem } from './Collapse';
export type { RadioGroupProps, RadioOption, RadioChangeEvent } from './RadioGroup';
export type { TextAreaProps } from './TextArea';
export type { AlertProps } from './Alert';
export type {
  LayoutProps,
  HeaderProps,
  ContentProps,
  FooterProps,
  SiderProps,
} from './Layout';
export type {
  TypographyProps,
  TitleProps,
  TextProps,
  ParagraphProps,
  LinkProps,
} from './Typography';
export type { VirtualListProps } from './VirtualList';
