/**
 * ScopeTabs component - Tab navigation for review scopes
 *
 * Uses antd Segmented component for modern, accessible tab-like switching.
 * Provides keyboard navigation (arrow keys) and animated selection indicator.
 */

import React from 'react';
import { Segmented } from '../primitives';
import type { SegmentedOption } from '../primitives';

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

export function ScopeTabs({
  scopes,
  activeScope,
  onScopeChange,
}: ScopeTabsProps): React.ReactElement {
  // Convert scopes to Segmented options format
  const options: SegmentedOption[] = scopes.map((scope) => ({
    label: scope.icon ? (
      <span>
        <span aria-hidden="true">{scope.icon} </span>
        {scope.label}
      </span>
    ) : (
      scope.label
    ),
    value: scope.id,
  }));

  const handleChange = (value: string | number) => {
    const newValue = String(value);
    // Only fire callback if value actually changed (matches original behavior)
    if (newValue !== activeScope) {
      onScopeChange(newValue);
    }
  };

  return (
    <div className="scope-tabs">
      <Segmented
        options={options}
        value={activeScope}
        onChange={handleChange}
      />
    </div>
  );
}
