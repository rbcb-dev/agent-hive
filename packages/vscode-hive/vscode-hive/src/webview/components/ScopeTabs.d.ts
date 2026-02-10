/**
 * ScopeTabs component - Tab navigation for review scopes
 *
 * Uses antd Segmented component for modern, accessible tab-like switching.
 * Provides keyboard navigation (arrow keys) and animated selection indicator.
 */
import React from 'react';
export interface ScopeTabItem {
    id: string;
    label: string;
    icon?: string;
}
export interface ScopeTabsProps {
    scopes: ScopeTabItem[];
    activeScope: string;
    onScopeChange: (scope: string) => void;
}
export declare function ScopeTabs({ scopes, activeScope, onScopeChange, }: ScopeTabsProps): React.ReactElement;
