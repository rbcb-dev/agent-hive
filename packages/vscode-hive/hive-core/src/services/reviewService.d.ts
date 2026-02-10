import type { ReviewSession, ReviewIndex, ReviewScope, ReviewVerdict, ReviewThread, ReviewAnnotation, Range } from '../types.js';
export declare class ReviewService {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Start a new review session for a feature
     */
    startSession(feature: string, scope: ReviewScope, baseRef?: string, headRef?: string): Promise<ReviewSession>;
    /**
     * Get a review session by ID
     */
    getSession(sessionId: string): Promise<ReviewSession | null>;
    /**
     * List all sessions for a feature
     */
    listSessions(feature: string): Promise<ReviewIndex['sessions']>;
    /**
     * Submit a review session with a verdict
     */
    submitSession(sessionId: string, verdict: ReviewVerdict, summary: string): Promise<ReviewSession>;
    /**
     * Add a new thread to a session
     */
    addThread(sessionId: string, entityId: string, uri: string | null, range: Range, annotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewThread>;
    /**
     * Reply to an existing thread
     */
    replyToThread(threadId: string, body: string, agentId?: string): Promise<ReviewAnnotation>;
    /**
     * Resolve a thread
     */
    resolveThread(threadId: string): Promise<ReviewThread>;
    /**
     * Mark a suggestion annotation as applied
     */
    markSuggestionApplied(threadId: string, annotationId: string): Promise<ReviewAnnotation>;
    /**
     * Update an existing review session
     */
    updateSession(session: ReviewSession): Promise<void>;
    private getReviewDir;
    private getIndexPath;
    private getSessionPath;
    private loadIndex;
    private saveIndex;
    private loadSession;
    private saveSession;
    private generateId;
    /**
     * Find a thread by ID across all sessions
     */
    private findThread;
    /**
     * List all features in the project
     */
    private listFeatures;
}
