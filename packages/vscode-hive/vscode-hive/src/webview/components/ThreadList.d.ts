/**
 * ThreadList component - List of review threads with status
 * Uses Flex + Card layout with VirtualList for large lists (>50 items)
 */
import React from 'react';
import type { ThreadSummary } from '../types';
export interface ThreadListProps {
    threads: ThreadSummary[];
    selectedThread: string | null;
    onSelectThread: (threadId: string) => void;
}
export declare function ThreadList({ threads, selectedThread, onSelectThread, }: ThreadListProps): React.ReactElement;
