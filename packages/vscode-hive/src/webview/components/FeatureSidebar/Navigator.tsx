/**
 * Navigator — Feature tree sub-component of FeatureSidebar
 *
 * Shows features organized by status groups (In Progress > Pending > Completed).
 * Under each feature: Plan, Context, Tasks hierarchy.
 *
 * Consumes state from HiveWorkspaceProvider — no data props needed.
 */

import React, { useMemo, useCallback, useState } from 'react';
import type { Key } from 'react';
import type { FeatureInfo } from 'hive-core';
import { Tree, Typography } from '../../primitives';
import type { TreeDataNode } from '../../primitives';
import { useHiveWorkspace } from '../../providers/HiveWorkspaceProvider';
import { useFeatureSidebar } from './FeatureSidebarContext';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Status icons (codicon names matching native sidebar)
// ---------------------------------------------------------------------------

const STATUS_ICONS: Record<string, string> = {
  pending: 'circle-outline',
  in_progress: 'sync',
  done: 'pass',
  cancelled: 'circle-slash',
  blocked: 'debug-pause',
  failed: 'error',
  partial: 'warning',
  planning: 'edit',
  approved: 'check',
  executing: 'run-all',
  completed: 'pass-filled',
};

// ---------------------------------------------------------------------------
// Status group ordering
// ---------------------------------------------------------------------------

interface StatusGroup {
  label: string;
  status: 'in_progress' | 'pending' | 'completed';
  features: FeatureInfo[];
}

function groupFeaturesByStatus(features: FeatureInfo[]): StatusGroup[] {
  const inProgress: FeatureInfo[] = [];
  const pending: FeatureInfo[] = [];
  const completed: FeatureInfo[] = [];

  for (const f of features) {
    if (f.status === 'executing') {
      inProgress.push(f);
    } else if (f.status === 'planning' || f.status === 'approved') {
      pending.push(f);
    } else if (f.status === 'completed') {
      completed.push(f);
    }
  }

  const groups: StatusGroup[] = [];
  if (inProgress.length > 0) {
    groups.push({
      label: 'In Progress',
      status: 'in_progress',
      features: inProgress,
    });
  }
  if (pending.length > 0) {
    groups.push({ label: 'Pending', status: 'pending', features: pending });
  }
  if (completed.length > 0) {
    groups.push({
      label: 'Completed',
      status: 'completed',
      features: completed,
    });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Tree data construction
// ---------------------------------------------------------------------------

function buildNavigatorTree(
  groups: StatusGroup[],
): TreeDataNode[] {
  return groups.map((group) => ({
    key: `group-${group.status}`,
    title: group.label,
    children: group.features.map((feature) => ({
      key: `feature-${feature.name}`,
      title: feature.name,
      children: buildFeatureChildren(feature),
    })),
  }));
}

function buildFeatureChildren(feature: FeatureInfo): TreeDataNode[] {
  const children: TreeDataNode[] = [];

  // Plan node
  if (feature.hasPlan) {
    children.push({
      key: `feature-${feature.name}-plan`,
      title: 'Plan',
      isLeaf: true,
    });
  }

  // Context folder
  children.push({
    key: `feature-${feature.name}-context`,
    title: 'Context',
    isLeaf: true,
  });

  // Tasks group
  if (feature.tasks.length > 0) {
    const doneCount = feature.tasks.filter((t) => t.status === 'done').length;
    children.push({
      key: `feature-${feature.name}-tasks`,
      title: 'Tasks',
      children: feature.tasks.map((task) => ({
        key: `task-${feature.name}-${task.folder}`,
        title: task.name,
        isLeaf: true,
      })),
    });
  }

  return children;
}

// ---------------------------------------------------------------------------
// Title render
// ---------------------------------------------------------------------------

function getTaskProgress(feature: FeatureInfo): string {
  const done = feature.tasks.filter((t) => t.status === 'done').length;
  return `${done}/${feature.tasks.length}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Navigator(): React.ReactElement {
  // Validate compound component context
  useFeatureSidebar();

  const { state, actions } = useHiveWorkspace();
  const { features, activeFeature, activeTask } = state;

  const groups = useMemo(() => groupFeaturesByStatus(features), [features]);
  const treeData = useMemo(() => buildNavigatorTree(groups), [groups]);

  // All group and feature nodes expanded by default
  const initialExpandedKeys = useMemo(() => {
    const keys: string[] = [];
    for (const group of groups) {
      keys.push(`group-${group.status}`);
      for (const feature of group.features) {
        keys.push(`feature-${feature.name}`);
      }
    }
    return keys;
  }, [groups]);

  const [expandedKeys, setExpandedKeys] = useState<Key[]>(initialExpandedKeys);

  const handleExpand = useCallback((keys: Key[]) => {
    setExpandedKeys(keys);
  }, []);

  const handleSelect = useCallback(
    (keys: Key[]) => {
      const key = keys[0] as string;
      if (!key) return;

      // Feature node: feature-<name>
      if (key.startsWith('feature-') && !key.includes('-plan') && !key.includes('-context') && !key.includes('-tasks')) {
        const name = key.replace('feature-', '');
        actions.selectFeature(name);
        return;
      }

      // Plan node
      if (key.endsWith('-plan')) {
        const name = key.replace('feature-', '').replace('-plan', '');
        actions.selectFeature(name);
        actions.selectView('plan');
        return;
      }

      // Context node
      if (key.endsWith('-context')) {
        const name = key.replace('feature-', '').replace('-context', '');
        actions.selectFeature(name);
        actions.selectView('context');
        return;
      }

      // Task node: task-<featureName>-<taskFolder>
      if (key.startsWith('task-')) {
        const rest = key.replace('task-', '');
        const dashIdx = rest.indexOf('-');
        if (dashIdx !== -1) {
          const taskFolder = rest.substring(dashIdx + 1);
          actions.selectTask(taskFolder);
        }
        return;
      }
    },
    [actions],
  );

  // Custom title render
  const renderTitle = useCallback(
    (node: TreeDataNode): React.ReactNode => {
      const key = String(node.key);

      // Status group node
      if (key.startsWith('group-')) {
        return (
          <span data-testid="status-group">
            <Text strong>{node.title as string}</Text>
          </span>
        );
      }

      // Feature node
      if (
        key.startsWith('feature-') &&
        !key.includes('-plan') &&
        !key.includes('-context') &&
        !key.includes('-tasks')
      ) {
        const name = key.replace('feature-', '');
        const feature = features.find((f) => f.name === name);
        if (!feature) {
          return <Text>{node.title as string}</Text>;
        }

        return (
          <span data-testid={`feature-node-${name}`}>
            <span
              className={`codicon codicon-${STATUS_ICONS[feature.status] ?? 'package'}`}
              aria-hidden="true"
            />
            <Text style={{ marginLeft: 4 }}>{feature.name}</Text>
            <Text
              type="secondary"
              style={{ marginLeft: 8, fontSize: 11 }}
            >
              {getTaskProgress(feature)}
            </Text>
          </span>
        );
      }

      // Plan node
      if (key.endsWith('-plan')) {
        const featureName = key.replace('feature-', '').replace('-plan', '');
        const feature = features.find((f) => f.name === featureName);
        return (
          <span>
            <span className="codicon codicon-book" aria-hidden="true" />
            <Text style={{ marginLeft: 4 }}>Plan</Text>
            {feature && feature.commentCount > 0 && (
              <Text
                type="secondary"
                style={{ marginLeft: 8, fontSize: 11 }}
              >
                ({feature.commentCount})
              </Text>
            )}
          </span>
        );
      }

      // Context node
      if (key.endsWith('-context')) {
        return (
          <span>
            <span className="codicon codicon-folder" aria-hidden="true" />
            <Text style={{ marginLeft: 4 }}>Context</Text>
          </span>
        );
      }

      // Tasks group node
      if (key.endsWith('-tasks')) {
        return (
          <span>
            <span className="codicon codicon-checklist" aria-hidden="true" />
            <Text style={{ marginLeft: 4 }}>Tasks</Text>
          </span>
        );
      }

      // Individual task node
      if (key.startsWith('task-')) {
        const rest = key.replace('task-', '');
        const dashIdx = rest.indexOf('-');
        const featureName = rest.substring(0, dashIdx);
        const taskFolder = rest.substring(dashIdx + 1);
        const feature = features.find((f) => f.name === featureName);
        const task = feature?.tasks.find((t) => t.folder === taskFolder);
        const taskStatus = task?.status ?? 'pending';

        return (
          <span data-testid={`task-node-${taskFolder}`}>
            <span
              className={`codicon codicon-${STATUS_ICONS[taskStatus] ?? 'circle-outline'}`}
              aria-hidden="true"
            />
            <Text style={{ marginLeft: 4 }}>{node.title as string}</Text>
          </span>
        );
      }

      return <Text>{node.title as string}</Text>;
    },
    [features],
  );

  // Compute selected keys
  const selectedKeys = useMemo(() => {
    if (activeTask) {
      // Find which feature this task belongs to
      for (const f of features) {
        if (f.tasks.some((t) => t.folder === activeTask)) {
          return [`task-${f.name}-${activeTask}`];
        }
      }
    }
    if (activeFeature) {
      return [`feature-${activeFeature}`];
    }
    return [];
  }, [activeFeature, activeTask, features]);

  if (features.length === 0) {
    return (
      <div className="feature-sidebar-navigator feature-sidebar-navigator-empty">
        <Text type="secondary">No features found</Text>
      </div>
    );
  }

  return (
    <div className="feature-sidebar-navigator">
      <Tree
        treeData={treeData}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        showLine={{ showLeafIcon: false }}
        showIcon={false}
        titleRender={renderTitle}
      />
    </div>
  );
}
