/**
 * ChangedFiles — File tree sub-component of FeatureSidebar
 *
 * Shows changed files with diff status indicators (A/M/D/R/C).
 * - Feature-level: aggregates files from ALL tasks, latest task wins for duplicates
 * - Task-level: shows only that task's files
 *
 * Consumes state from HiveWorkspaceProvider — no data props needed.
 */
import React from 'react';
export declare function ChangedFiles(): React.ReactElement;
