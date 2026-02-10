/**
 * Tests for ScopeTabs component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { ScopeTabs } from '../components/ScopeTabs';

describe('ScopeTabs', () => {
  const defaultScopes = [
    { id: 'feature', label: 'Feature' },
    { id: 'task', label: 'Task' },
    { id: 'context', label: 'Context' },
    { id: 'plan', label: 'Plan' },
    { id: 'code', label: 'Code' },
  ];

  it('renders all scope tabs', () => {
    render(
      <ScopeTabs
        scopes={defaultScopes}
        activeScope="feature"
        onScopeChange={() => {}}
      />,
    );

    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(
      <ScopeTabs
        scopes={defaultScopes}
        activeScope="plan"
        onScopeChange={() => {}}
      />,
    );

    // The antd Segmented component uses ant-segmented-item-selected class for active items
    const planTab = screen.getByText('Plan').closest('.ant-segmented-item');
    expect(planTab).toHaveClass('ant-segmented-item-selected');
  });

  it('calls onScopeChange when tab is clicked', () => {
    const onScopeChange = vi.fn();
    render(
      <ScopeTabs
        scopes={defaultScopes}
        activeScope="feature"
        onScopeChange={onScopeChange}
      />,
    );

    fireEvent.click(screen.getByText('Code'));
    expect(onScopeChange).toHaveBeenCalledWith('code');
  });

  it('does not call onScopeChange when active tab is clicked', () => {
    const onScopeChange = vi.fn();
    render(
      <ScopeTabs
        scopes={defaultScopes}
        activeScope="feature"
        onScopeChange={onScopeChange}
      />,
    );

    fireEvent.click(screen.getByText('Feature'));
    expect(onScopeChange).not.toHaveBeenCalled();
  });
});
