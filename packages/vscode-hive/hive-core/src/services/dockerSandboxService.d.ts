export interface SandboxConfig {
    mode: 'none' | 'docker';
    image?: string;
    persistent?: boolean;
}
/**
 * DockerSandboxService handles Level 1 Docker sandboxing for Hive workers.
 * Uses ephemeral containers (docker run --rm) with volume mounts.
 *
 * Level 1: Lightweight docker run (no devcontainer.json, no persistent containers)
 */
export declare class DockerSandboxService {
    /**
     * Detects appropriate Docker image based on project files in worktree.
     *
     * @param worktreePath - Path to the worktree directory
     * @returns Docker image name, or null if Dockerfile exists (user manages their own)
     */
    static detectImage(worktreePath: string): string | null;
    /**
     * Builds docker run command with volume mount and working directory.
     *
     * @param worktreePath - Path to the worktree directory
     * @param command - Command to execute inside container
     * @param image - Docker image to use
     * @returns Complete docker run command string
     */
    static buildRunCommand(worktreePath: string, command: string, image: string): string;
    /**
     * Generates a container name from a worktree path.
     * Extracts feature and task from .hive/.worktrees/<feature>/<task> pattern.
     *
     * @param worktreePath - Path to the worktree directory
     * @returns Container name (e.g., 'hive-my-feature-my-task')
     */
    static containerName(worktreePath: string): string;
    /**
     * Ensures a persistent container exists for the worktree.
     * If container already running, returns its name.
     * Otherwise, creates a new detached container.
     *
     * @param worktreePath - Path to the worktree directory
     * @param image - Docker image to use
     * @returns Container name
     */
    static ensureContainer(worktreePath: string, image: string): string;
    /**
     * Builds a docker exec command for persistent containers.
     *
     * @param containerName - Name of the running container
     * @param command - Command to execute
     * @returns Complete docker exec command string
     */
    static buildExecCommand(containerName: string, command: string): string;
    /**
     * Stops and removes a persistent container for a worktree.
     *
     * @param worktreePath - Path to the worktree directory
     */
    static stopContainer(worktreePath: string): void;
    /**
     * Checks if Docker is available on the system.
     *
     * @returns true if docker is available, false otherwise
     */
    static isDockerAvailable(): boolean;
    /**
     * Wraps a command with Docker container execution based on config.
     *
     * @param worktreePath - Path to the worktree directory
     * @param command - Command to execute
     * @param config - Sandbox configuration
     * @returns Wrapped command (or original if no wrapping needed)
     */
    static wrapCommand(worktreePath: string, command: string, config: SandboxConfig): string;
}
