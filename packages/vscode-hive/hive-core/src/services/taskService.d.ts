import { LockOptions } from '../utils/paths.js';
import { TaskStatus, TaskStatusType, TasksSyncResult, TaskInfo, Subtask, SubtaskType, WorkerSession } from '../types.js';
/** Current schema version for TaskStatus */
export declare const TASK_STATUS_SCHEMA_VERSION = 1;
/** Fields that can be updated by background workers without clobbering completion-owned fields */
export interface BackgroundPatchFields {
    idempotencyKey?: string;
    workerSession?: Partial<WorkerSession>;
}
/** Fields owned by the completion flow (not to be touched by background patches) */
export interface CompletionFields {
    status?: TaskStatusType;
    summary?: string;
    completedAt?: string;
}
export declare class TaskService {
    private projectRoot;
    constructor(projectRoot: string);
    sync(featureName: string): TasksSyncResult;
    /**
     * Create a manual task with auto-incrementing index.
     * Folder format: "01-task-name", "02-task-name", etc.
     * Index ensures alphabetical sort = chronological order.
     */
    create(featureName: string, name: string, order?: number): string;
    private createFromPlan;
    buildSpecContent(params: {
        featureName: string;
        task: {
            folder: string;
            name: string;
            order: number;
            description?: string;
        };
        dependsOn: string[];
        allTasks: Array<{
            folder: string;
            name: string;
            order: number;
        }>;
        planContent?: string | null;
        contextFiles?: Array<{
            name: string;
            content: string;
        }>;
        completedTasks?: Array<{
            name: string;
            summary: string;
        }>;
    }): string;
    private extractPlanSection;
    /**
     * Resolve dependency numbers to folder names.
     * - If dependsOnNumbers is null (not specified), apply implicit sequential default (N-1 for N > 1).
     * - If dependsOnNumbers is [] (explicit "none"), return empty array.
     * - Otherwise, map numbers to corresponding task folders.
     */
    private resolveDependencies;
    /**
     * Validate the dependency graph for errors before creating tasks.
     * Throws descriptive errors pointing the operator to fix plan.md.
     *
     * Checks for:
     * - Unknown task numbers in dependencies
     * - Self-dependencies
     * - Cycles (using DFS topological sort)
     */
    private validateDependencyGraph;
    /**
     * Detect cycles in the dependency graph using DFS.
     * Throws a descriptive error if a cycle is found.
     */
    private detectCycles;
    writeSpec(featureName: string, taskFolder: string, content: string): string;
    /**
     * Update task status with locked atomic write.
     * Uses file locking to prevent race conditions between concurrent updates.
     *
     * @param featureName - Feature name
     * @param taskFolder - Task folder name
     * @param updates - Fields to update (status, summary, baseCommit)
     * @param lockOptions - Optional lock configuration
     * @returns Updated TaskStatus
     */
    update(featureName: string, taskFolder: string, updates: Partial<Pick<TaskStatus, 'status' | 'summary' | 'baseCommit' | 'commits' | 'changedFiles' | 'blocker'>>, lockOptions?: LockOptions): TaskStatus;
    /**
     * Patch only background-owned fields without clobbering completion-owned fields.
     * Safe for concurrent use by background workers.
     *
     * Uses deep merge for workerSession to allow partial updates like:
     * - patchBackgroundFields(..., { workerSession: { lastHeartbeatAt: '...' } })
     *   will update only lastHeartbeatAt, preserving other workerSession fields.
     *
     * @param featureName - Feature name
     * @param taskFolder - Task folder name
     * @param patch - Background-owned fields to update
     * @param lockOptions - Optional lock configuration
     * @returns Updated TaskStatus
     */
    patchBackgroundFields(featureName: string, taskFolder: string, patch: BackgroundPatchFields, lockOptions?: LockOptions): TaskStatus;
    /**
     * Get raw TaskStatus including all fields (for internal use or debugging).
     */
    getRawStatus(featureName: string, taskFolder: string): TaskStatus | null;
    get(featureName: string, taskFolder: string): TaskInfo | null;
    list(featureName: string): TaskInfo[];
    writeReport(featureName: string, taskFolder: string, report: string): string;
    private listFolders;
    private deleteTask;
    private getNextOrder;
    private parseTasksFromPlan;
    createSubtask(featureName: string, taskFolder: string, name: string, type?: SubtaskType): Subtask;
    updateSubtask(featureName: string, taskFolder: string, subtaskId: string, status: TaskStatusType): Subtask;
    listSubtasks(featureName: string, taskFolder: string): Subtask[];
    deleteSubtask(featureName: string, taskFolder: string, subtaskId: string): void;
    getSubtask(featureName: string, taskFolder: string, subtaskId: string): Subtask | null;
    writeSubtaskSpec(featureName: string, taskFolder: string, subtaskId: string, content: string): string;
    writeSubtaskReport(featureName: string, taskFolder: string, subtaskId: string, content: string): string;
    readSubtaskSpec(featureName: string, taskFolder: string, subtaskId: string): string | null;
    readSubtaskReport(featureName: string, taskFolder: string, subtaskId: string): string | null;
    private listSubtaskFolders;
    private findSubtaskFolder;
    private slugify;
}
