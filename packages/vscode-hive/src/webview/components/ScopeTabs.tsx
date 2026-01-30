/**
 * ScopeTabs component - Tab navigation for review scopes
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

export function ScopeTabs({ scopes, activeScope, onScopeChange }: ScopeTabsProps): React.ReactElement {
  const handleClick = (scopeId: string) => {
    if (scopeId !== activeScope) {
      onScopeChange(scopeId);
    }
  };

  return (
    <div className="scope-tabs" role="tablist" aria-label="Review scope">
      {scopes.map((scope) => (
        <button
          key={scope.id}
          className={`scope-tab ${scope.id === activeScope ? 'active' : ''}`}
          onClick={() => handleClick(scope.id)}
          role="tab"
          aria-selected={scope.id === activeScope}
          aria-controls={`scope-panel-${scope.id}`}
          id={`scope-tab-${scope.id}`}
        >
          {scope.icon && <span className="scope-tab-icon" aria-hidden="true">{scope.icon}</span>}
          {scope.label}
        </button>
      ))}
    </div>
  );
}
