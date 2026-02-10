/**
 * ThreadPanel component - Single thread with comments and reply input
 * Uses the shared ThreadView component with full mode.
 */
import React from 'react';
import type { ReviewThread } from 'hive-core';
export interface ThreadPanelProps {
    thread: ReviewThread | null;
    onReply: (threadId: string, body: string) => void;
    onResolve: (threadId: string) => void;
}
export declare function ThreadPanel({ thread, onReply, onResolve, }: ThreadPanelProps): React.ReactElement;
