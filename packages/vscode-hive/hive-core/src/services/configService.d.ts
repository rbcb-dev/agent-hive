import { HiveConfig, ReviewConfig, ReviewNotificationsConfig } from '../types.js';
import type { SandboxConfig } from './dockerSandboxService.js';
/**
 * ConfigService manages user config at ~/.config/opencode/agent_hive.json
 *
 * This is USER config (not project-scoped):
 * - VSCode extension reads/writes this
 * - OpenCode plugin reads this to enable features
 * - Agent does NOT have tools to access this
 */
export declare class ConfigService {
    private configPath;
    constructor();
    /**
     * Get config path
     */
    getPath(): string;
    /**
     * Get the full config, merged with defaults.
     */
    get(): HiveConfig;
    /**
     * Update config (partial merge).
     */
    set(updates: Partial<HiveConfig>): HiveConfig;
    /**
     * Check if config file exists.
     */
    exists(): boolean;
    /**
     * Initialize config with defaults if it doesn't exist.
     */
    init(): HiveConfig;
    /**
     * Get agent-specific model config
     */
    getAgentConfig(agent: 'hive-master' | 'architect-planner' | 'swarm-orchestrator' | 'scout-researcher' | 'forager-worker' | 'hygienic-reviewer'): {
        model?: string;
        temperature?: number;
        skills?: string[];
        autoLoadSkills?: string[];
        variant?: string;
    };
    /**
     * Check if OMO-Slim delegation is enabled via user config.
     */
    isOmoSlimEnabled(): boolean;
    /**
     * Get list of globally disabled skills.
     */
    getDisabledSkills(): string[];
    /**
     * Get list of globally disabled MCPs.
     */
    getDisabledMcps(): string[];
    /**
     * Get sandbox configuration for worker isolation.
     * Returns { mode: 'none' | 'docker', image?: string, persistent?: boolean }
     */
    getSandboxConfig(): SandboxConfig;
    /**
     * Get review panel configuration, merged with defaults.
     */
    getReviewConfig(): Required<ReviewConfig> & {
        notifications: Required<ReviewNotificationsConfig>;
    };
}
