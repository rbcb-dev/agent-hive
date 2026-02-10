/**
 * InlineThread component - Displays a thread inline below a code line
 * with annotations, reply input, and resolve functionality.
 * Uses the shared ThreadView component with compact mode.
 */
import React from 'react';
import type { ReviewThread } from 'hive-core';
export interface InlineThreadProps {
    /** The thread to display */
    thread: ReviewThread;
    /** Called when user submits a reply */
    onReply: (threadId: string, body: string) => void;
    /** Called when user resolves the thread */
    onResolve: (threadId: string) => void;
    /** Called when user closes the inline thread view */
    onClose: () => void;
}
export declare function InlineThread({ thread, onReply, onResolve, onClose, }: InlineThreadProps): React.ReactElement;
