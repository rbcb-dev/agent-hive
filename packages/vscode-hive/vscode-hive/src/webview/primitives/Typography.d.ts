/**
 * Typography - Ant Design Typography wrapper
 *
 * Text rendering components with styling variants.
 */
import type { ReactNode } from 'react';
export interface TypographyProps {
    /** Typography children */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
}
export interface TitleProps {
    /** Heading level (1-5) */
    level?: 1 | 2 | 3 | 4 | 5;
    /** Title children */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Text type for color */
    type?: 'secondary' | 'success' | 'warning' | 'danger';
    /** Editable configuration */
    editable?: boolean;
    /** Copyable configuration */
    copyable?: boolean;
    /** Text decoration */
    mark?: boolean;
    underline?: boolean;
    delete?: boolean;
    disabled?: boolean;
}
export interface TextProps {
    /** Text children */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Text type for color */
    type?: 'secondary' | 'success' | 'warning' | 'danger';
    /** Strong (bold) text */
    strong?: boolean;
    /** Italic text */
    italic?: boolean;
    /** Underline text */
    underline?: boolean;
    /** Strikethrough text */
    delete?: boolean;
    /** Marked (highlight) text */
    mark?: boolean;
    /** Code style text */
    code?: boolean;
    /** Keyboard style text */
    keyboard?: boolean;
    /** Disabled style */
    disabled?: boolean;
    /** Copyable configuration */
    copyable?: boolean;
    /** Editable configuration */
    editable?: boolean;
    /** Ellipsis configuration */
    ellipsis?: boolean | {
        rows?: number;
        expandable?: boolean;
        suffix?: string;
    };
}
export interface ParagraphProps {
    /** Paragraph children */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Text type for color */
    type?: 'secondary' | 'success' | 'warning' | 'danger';
    /** Strong (bold) text */
    strong?: boolean;
    /** Italic text */
    italic?: boolean;
    /** Underline text */
    underline?: boolean;
    /** Strikethrough text */
    delete?: boolean;
    /** Marked (highlight) text */
    mark?: boolean;
    /** Disabled style */
    disabled?: boolean;
    /** Copyable configuration */
    copyable?: boolean;
    /** Editable configuration */
    editable?: boolean;
    /** Ellipsis configuration */
    ellipsis?: boolean | {
        rows?: number;
        expandable?: boolean;
        suffix?: string;
    };
}
export interface LinkProps {
    /** Link href */
    href?: string;
    /** Link target */
    target?: '_blank' | '_self' | '_parent' | '_top';
    /** Link children */
    children?: ReactNode;
    /** Additional CSS class */
    className?: string;
    /** Inline styles */
    style?: React.CSSProperties;
    /** Text type for color */
    type?: 'secondary' | 'success' | 'warning' | 'danger';
    /** Underline style */
    underline?: boolean;
    /** Disabled style */
    disabled?: boolean;
}
declare function Typography({ children, className, style, }: TypographyProps): React.ReactElement;
declare namespace Typography {
    var Title: import("react").ForwardRefExoticComponent<import("antd/es/typography/Title").TitleProps & import("react").RefAttributes<HTMLElement>>;
    var Text: import("react").ForwardRefExoticComponent<import("antd/es/typography/Text").TextProps & import("react").RefAttributes<HTMLSpanElement>>;
    var Paragraph: import("react").ForwardRefExoticComponent<import("antd/es/typography/Paragraph").ParagraphProps & import("react").RefAttributes<HTMLElement>>;
    var Link: import("react").ForwardRefExoticComponent<import("antd/es/typography/Link").LinkProps & import("react").RefAttributes<HTMLElement>>;
}
export { Typography };
