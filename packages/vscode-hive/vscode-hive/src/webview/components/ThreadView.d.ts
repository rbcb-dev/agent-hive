/**
 * ThreadView component - Shared thread display with annotations, reply input, and resolve functionality.
 * Used by both InlineThread (compact mode) and ThreadPanel (full mode).
 */
import React from 'react';
import type { ReviewThread } from 'hive-core';
export interface ThreadViewProps {
    /** The thread to display */
    thread: ReviewThread;
    /** Called when user submits a reply */
    onReply: (body: string) => void;
    /** Called when user resolves the thread */
    onResolve: () => void;
    /** Compact mode for inline display (fewer rows, smaller spacing) */
    compact?: boolean;
}
export declare function ThreadView({ thread, onReply, onResolve, compact, }: ThreadViewProps): React.ReactElement;
