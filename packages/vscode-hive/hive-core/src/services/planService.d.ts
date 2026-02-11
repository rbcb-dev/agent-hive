import { PlanComment, PlanReadResult } from '../types.js';
export declare class PlanService {
    private projectRoot;
    constructor(projectRoot: string);
    write(featureName: string, content: string): string;
    read(featureName: string): PlanReadResult | null;
    approve(featureName: string): void;
    isApproved(featureName: string): boolean;
    revokeApproval(featureName: string): void;
    getComments(featureName: string): PlanComment[];
    /**
     * Migrate a comment from old format to the current schema.
     * Old format may lack author, timestamp, or have replies as string[].
     */
    private migrateComment;
    private getFileMtime;
    addComment(featureName: string, comment: Omit<PlanComment, 'id' | 'timestamp'>): PlanComment;
    clearComments(featureName: string): void;
}
