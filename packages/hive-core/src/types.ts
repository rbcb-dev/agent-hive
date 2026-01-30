export type FeatureStatusType = 'planning' | 'approved' | 'executing' | 'completed';

export interface FeatureJson {
  name: string;
  status: FeatureStatusType;
  ticket?: string;
  sessionId?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

export type TaskStatusType = 'pending' | 'in_progress' | 'done' | 'cancelled' | 'blocked' | 'failed' | 'partial';
export type TaskOrigin = 'plan' | 'manual';
export type SubtaskType = 'test' | 'implement' | 'review' | 'verify' | 'research' | 'debug' | 'custom';

export interface Subtask {
  id: string;
  name: string;
  folder: string;
  status: TaskStatusType;
  type?: SubtaskType;
  createdAt?: string;
  completedAt?: string;
}

export interface SubtaskStatus {
  status: TaskStatusType;
  type?: SubtaskType;
  createdAt: string;
  completedAt?: string;
}

/** Worker session information for background task execution */
export interface WorkerSession {
  /** Background task ID from OMO-Slim */
  taskId?: string;
  /** Unique session identifier */
  sessionId: string;
  /** Worker instance identifier */
  workerId?: string;
  /** Agent type handling this task */
  agent?: string;
  /** Execution mode: inline (same session) or delegate (background) */
  mode?: 'inline' | 'delegate';
  /** ISO timestamp of last heartbeat */
  lastHeartbeatAt?: string;
  /** Current attempt number (1-based) */
  attempt?: number;
  /** Number of messages exchanged in session */
  messageCount?: number;
}

export interface TaskStatus {
  /** Schema version for forward compatibility (default: 1) */
  schemaVersion?: number;
  status: TaskStatusType;
  origin: TaskOrigin;
  planTitle?: string;
  summary?: string;
  startedAt?: string;
  completedAt?: string;
  baseCommit?: string;
  subtasks?: Subtask[];
  /** Idempotency key for safe retries */
  idempotencyKey?: string;
  /** Worker session info for background execution */
  workerSession?: WorkerSession;
}

export interface PlanComment {
  id: string;
  line: number;
  body: string;
  author: string;
  timestamp: string;
}

export interface CommentsJson {
  threads: PlanComment[];
}

export interface PlanReadResult {
  content: string;
  status: FeatureStatusType;
  comments: PlanComment[];
}

export interface TasksSyncResult {
  created: string[];
  removed: string[];
  kept: string[];
  manual: string[];
}

export interface TaskInfo {
  folder: string;
  name: string;
  status: TaskStatusType;
  origin: TaskOrigin;
  planTitle?: string;
  summary?: string;
}

export interface FeatureInfo {
  name: string;
  status: FeatureStatusType;
  tasks: TaskInfo[];
  hasPlan: boolean;
  commentCount: number;
}

export interface ContextFile {
  name: string;
  content: string;
  updatedAt: string;
}

export interface SessionInfo {
  sessionId: string;
  taskFolder?: string;
  startedAt: string;
  lastActiveAt: string;
  messageCount?: number;
}

export interface SessionsJson {
  master?: string;
  sessions: SessionInfo[];
}

export interface TaskSpec {
  taskFolder: string;
  featureName: string;
  planSection: string;
  context: string;
  priorTasks: Array<{ folder: string; summary?: string }>;
}

/** Notification configuration for review panel */
export interface ReviewNotificationsConfig {
  /** How to display LLM questions: inline in panel, toast notification, or both */
  llmQuestions?: 'inline' | 'toast' | 'both';
  /** Whether to show notifications for new comments */
  newComments?: boolean;
  /** Whether to show notifications when review is complete */
  reviewComplete?: boolean;
}

/** Review panel configuration */
export interface ReviewConfig {
  /** Notification settings for review events */
  notifications?: ReviewNotificationsConfig;
  /** Whether to auto-delegate reviews to hygienic-reviewer agent (default: true) */
  autoDelegate?: boolean;
  /** Maximum number of concurrent reviewer agents (default: 1) */
  parallelReviewers?: number;
}

/** Default review notification configuration */
export const DEFAULT_REVIEW_NOTIFICATIONS: Required<ReviewNotificationsConfig> = {
  llmQuestions: 'both',
  newComments: true,
  reviewComplete: true,
};

/** Default review configuration */
export const DEFAULT_REVIEW_CONFIG: Required<ReviewConfig> = {
  notifications: DEFAULT_REVIEW_NOTIFICATIONS,
  autoDelegate: true,
  parallelReviewers: 1,
};

/** Agent model/temperature configuration */
export interface AgentModelConfig {
  /** Model to use - format: "provider/model-id" (e.g., 'anthropic/claude-sonnet-4-20250514') */
  model?: string;
  /** Temperature for generation (0-2) */
  temperature?: number;
  /** Skills to enable for this agent */
  skills?: string[];
  /** Skills to auto-load for this agent */
  autoLoadSkills?: string[];
  /** Variant key for model reasoning/effort level (e.g., 'low', 'medium', 'high', 'max') */
  variant?: string;
}

export interface HiveConfig {
  /** Schema reference for config file */
  $schema?: string;
  /** Enable hive tools for specific features */
  enableToolsFor?: string[];
  /** Globally disable specific skills (won't appear in hive_skill tool) */
  disableSkills?: string[];
  /** Globally disable specific MCP servers. Available: websearch, context7, grep_app, ast_grep */
  disableMcps?: string[];
  /** Enable OMO-Slim delegation (optional integration) */
  omoSlimEnabled?: boolean;
  /** Choose between unified or dedicated agent modes */
  agentMode?: 'unified' | 'dedicated';
  /**
   * Delegate mode for background task execution:
   * - 'hive': Use hive_background_task tools
   * - 'task': Use OpenCode's built-in task() tool (default)
   */
  delegateMode?: 'hive' | 'task';
  /** Review panel configuration */
  review?: ReviewConfig;
  /** Agent configuration */
  agents?: {
    /** Hive Master (hybrid planner + orchestrator) */
    'hive-master'?: AgentModelConfig;
    /** Architect Planner (planning-only) */
    'architect-planner'?: AgentModelConfig;
    /** Swarm Orchestrator */
    'swarm-orchestrator'?: AgentModelConfig;
    /** Scout Researcher */
    'scout-researcher'?: AgentModelConfig;
    /** Forager Worker */
    'forager-worker'?: AgentModelConfig;
    /** Hygienic Reviewer */
    'hygienic-reviewer'?: AgentModelConfig;
  };
}

/** Default models for Hive agents */
export const DEFAULT_AGENT_MODELS = {
  'hive-master': 'github-copilot/claude-opus-4.5',
  'architect-planner': 'github-copilot/gpt-5.2-codex',
  'swarm-orchestrator': 'github-copilot/claude-opus-4.5',
  'scout-researcher': 'zai-coding-plan/glm-4.7',
  'forager-worker': 'github-copilot/gpt-5.2-codex',
  'hygienic-reviewer': 'github-copilot/gpt-5.2-codex',
} as const;

export const DEFAULT_HIVE_CONFIG: HiveConfig = {
  $schema: 'https://raw.githubusercontent.com/tctinh/agent-hive/main/packages/opencode-hive/schema/agent_hive.schema.json',
  enableToolsFor: [],
  disableSkills: [],
  disableMcps: [],
  agentMode: 'unified',
  delegateMode: 'task',
  review: DEFAULT_REVIEW_CONFIG,
  agents: {
    'hive-master': {
      model: DEFAULT_AGENT_MODELS['hive-master'],
      temperature: 0.5,
      skills: [
        'brainstorming',
        'writing-plans',
        'dispatching-parallel-agents',
        'executing-plans',
      ],
      autoLoadSkills: ['parallel-exploration'],
    },
    'architect-planner': {
      model: DEFAULT_AGENT_MODELS['architect-planner'],
      temperature: 0.7,
      skills: ['brainstorming', 'writing-plans'],
      autoLoadSkills: ['parallel-exploration'],
    },
    'swarm-orchestrator': {
      model: DEFAULT_AGENT_MODELS['swarm-orchestrator'],
      temperature: 0.5,
      skills: ['dispatching-parallel-agents', 'executing-plans'],
      autoLoadSkills: [],
    },
    'scout-researcher': {
      model: DEFAULT_AGENT_MODELS['scout-researcher'],
      temperature: 0.5,
      skills: [],
      autoLoadSkills: ['parallel-exploration'],
    },
    'forager-worker': {
      model: DEFAULT_AGENT_MODELS['forager-worker'],
      temperature: 0.3,
      autoLoadSkills: ['test-driven-development', 'verification-before-completion'],
    },
    'hygienic-reviewer': {
      model: DEFAULT_AGENT_MODELS['hygienic-reviewer'],
      temperature: 0.3,
      skills: ['systematic-debugging', 'code-reviewer'],
      autoLoadSkills: [],
    },
  },
};

// ============================================================================
// Review Types
// ============================================================================

export type ReviewScope = 'feature' | 'task' | 'context' | 'plan' | 'code';
export type ReviewStatus = 'in_progress' | 'approved' | 'changes_requested' | 'commented';
export type ReviewVerdict = 'approve' | 'request_changes' | 'comment';
export type ThreadStatus = 'open' | 'resolved' | 'outdated';
export type AnnotationType = 'comment' | 'suggestion' | 'task' | 'question' | 'approval';

export interface Position {
  line: number;      // 0-based
  character: number; // 0-based UTF-16
}

export interface Range {
  start: Position;   // inclusive
  end: Position;     // exclusive
}

export interface GitMeta {
  repoRoot: string;
  baseRef: string;
  headRef: string;
  mergeBase: string;
  capturedAt: string;
  diffStats: { files: number; insertions: number; deletions: number };
  diffSummary: Array<{ path: string; status: string; additions: number; deletions: number }>;
}

export interface ReviewAnnotation {
  id: string;
  type: AnnotationType;
  body: string;
  author: { type: 'human' | 'llm'; name: string; agentId?: string };
  createdAt: string;
  updatedAt: string;
  suggestion?: { replacement: string };
  meta?: { deletedLine?: boolean; applied?: boolean; appliedAt?: string };
}

export interface ReviewThread {
  id: string;
  entityId: string;
  uri: string | null;
  range: Range;
  status: ThreadStatus;
  createdAt: string;
  updatedAt: string;
  annotations: ReviewAnnotation[];
}

export interface DiffHunkLine {
  type: 'context' | 'add' | 'remove';
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffHunkLine[];
  meta?: { duplicates?: boolean; overlap?: boolean };
}

export interface DiffFile {
  path: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C' | 'U' | 'B';
  additions: number;
  deletions: number;
  isBinary?: boolean;
  hunks: DiffHunk[];
}

export interface DiffPayload {
  baseRef: string;
  headRef: string;
  mergeBase: string;
  repoRoot: string;
  fileRoot: string;
  diffStats: { files: number; insertions: number; deletions: number };
  files: DiffFile[];
}

export interface ReviewSession {
  schemaVersion: 1;
  id: string;
  featureName: string;
  scope: ReviewScope;
  status: ReviewStatus;
  verdict: ReviewVerdict | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  threads: ReviewThread[];
  diffs: Record<string, DiffPayload>;
  gitMeta: GitMeta;
}

export interface ReviewIndex {
  schemaVersion: 1;
  activeSessionId: string | null;
  sessions: Array<{ id: string; scope: ReviewScope; status: ReviewStatus; updatedAt: string }>;
}
