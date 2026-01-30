import * as path from 'path';
import * as crypto from 'crypto';
import {
  ensureDir,
  readJson,
  writeJson,
  fileExists,
  getFeaturePath,
} from '../utils/paths.js';
import type {
  ReviewSession,
  ReviewIndex,
  ReviewScope,
  ReviewStatus,
  ReviewVerdict,
  ReviewThread,
  ReviewAnnotation,
  Range,
  AnnotationType,
  GitMeta,
} from '../types.js';

const REVIEWS_DIR = 'reviews';
const INDEX_FILE = 'index.json';

export class ReviewService {
  constructor(private projectRoot: string) {}

  /**
   * Start a new review session for a feature
   */
  async startSession(
    feature: string,
    scope: ReviewScope,
    baseRef?: string,
    headRef?: string
  ): Promise<ReviewSession> {
    const reviewDir = this.getReviewDir(feature);
    ensureDir(reviewDir);

    const id = this.generateId();
    const now = new Date().toISOString();

    const gitMeta: GitMeta = {
      repoRoot: this.projectRoot,
      baseRef: baseRef || 'main',
      headRef: headRef || 'HEAD',
      mergeBase: baseRef || 'main',
      capturedAt: now,
      diffStats: { files: 0, insertions: 0, deletions: 0 },
      diffSummary: [],
    };

    const session: ReviewSession = {
      schemaVersion: 1,
      id,
      featureName: feature,
      scope,
      status: 'in_progress',
      verdict: null,
      summary: null,
      createdAt: now,
      updatedAt: now,
      threads: [],
      diffs: {},
      gitMeta,
    };

    await this.saveSession(session);

    // Update index
    const index = await this.loadIndex(feature);
    index.activeSessionId = id;
    index.sessions.push({
      id,
      scope,
      status: 'in_progress',
      updatedAt: now,
    });
    await this.saveIndex(feature, index);

    return session;
  }

  /**
   * Get a review session by ID
   */
  async getSession(sessionId: string): Promise<ReviewSession | null> {
    // Search all features for the session
    const featuresPath = path.join(this.projectRoot, '.hive', 'features');
    if (!fileExists(featuresPath)) return null;

    const features = await this.listFeatures();
    for (const feature of features) {
      const sessionPath = this.getSessionPath(feature, sessionId);
      if (fileExists(sessionPath)) {
        return this.loadSession(sessionId, feature);
      }
    }

    return null;
  }

  /**
   * List all sessions for a feature
   */
  async listSessions(feature: string): Promise<ReviewIndex['sessions']> {
    const index = await this.loadIndex(feature);
    return index.sessions;
  }

  /**
   * Submit a review session with a verdict
   */
  async submitSession(
    sessionId: string,
    verdict: ReviewVerdict,
    summary: string
  ): Promise<ReviewSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const now = new Date().toISOString();

    // Map verdict to status
    let status: ReviewStatus;
    switch (verdict) {
      case 'approve':
        status = 'approved';
        break;
      case 'request_changes':
        status = 'changes_requested';
        break;
      case 'comment':
        status = 'commented';
        break;
    }

    session.status = status;
    session.verdict = verdict;
    session.summary = summary;
    session.updatedAt = now;

    await this.saveSession(session);

    // Update index
    const index = await this.loadIndex(session.featureName);
    const indexEntry = index.sessions.find(s => s.id === sessionId);
    if (indexEntry) {
      indexEntry.status = status;
      indexEntry.updatedAt = now;
    }
    await this.saveIndex(session.featureName, index);

    return session;
  }

  /**
   * Add a new thread to a session
   */
  async addThread(
    sessionId: string,
    entityId: string,
    uri: string | null,
    range: Range,
    annotation: Omit<ReviewAnnotation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReviewThread> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const now = new Date().toISOString();
    const threadId = this.generateId();
    const annotationId = this.generateId();

    const fullAnnotation: ReviewAnnotation = {
      ...annotation,
      id: annotationId,
      createdAt: now,
      updatedAt: now,
    };

    const thread: ReviewThread = {
      id: threadId,
      entityId,
      uri,
      range,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      annotations: [fullAnnotation],
    };

    session.threads.push(thread);
    session.updatedAt = now;

    await this.saveSession(session);

    return thread;
  }

  /**
   * Reply to an existing thread
   */
  async replyToThread(threadId: string, body: string, agentId?: string): Promise<ReviewAnnotation> {
    const { session, thread } = await this.findThread(threadId);

    const now = new Date().toISOString();
    const annotationId = this.generateId();

    const annotation: ReviewAnnotation = {
      id: annotationId,
      type: 'comment',
      body,
      author: { type: agentId ? 'llm' : 'human', name: agentId ? 'Agent' : 'user', agentId },
      createdAt: now,
      updatedAt: now,
    };

    thread.annotations.push(annotation);
    thread.updatedAt = now;
    session.updatedAt = now;

    await this.saveSession(session);

    return annotation;
  }

  /**
   * Resolve a thread
   */
  async resolveThread(threadId: string): Promise<ReviewThread> {
    const { session, thread } = await this.findThread(threadId);

    const now = new Date().toISOString();
    thread.status = 'resolved';
    thread.updatedAt = now;
    session.updatedAt = now;

    await this.saveSession(session);

    return thread;
  }

    /**
   * Mark a suggestion annotation as applied
   */
  async markSuggestionApplied(threadId: string, annotationId: string): Promise<ReviewAnnotation> {
    const { session, thread } = await this.findThread(threadId);

    const annotation = thread.annotations.find(a => a.id === annotationId);
    if (!annotation) {
      throw new Error(`Annotation not found: ${annotationId}`);
    }

    if (annotation.type !== 'suggestion' || !annotation.suggestion) {
      throw new Error(`Annotation ${annotationId} is not a suggestion`);
    }

    const now = new Date().toISOString();
    annotation.meta = {
      ...annotation.meta,
      applied: true,
      appliedAt: now,
    };
    annotation.updatedAt = now;
    thread.updatedAt = now;
    session.updatedAt = now;

    await this.saveSession(session);

    return annotation;
  }

  /**
   * Update an existing review session
   */
  async updateSession(session: ReviewSession): Promise<void> {
    await this.saveSession(session);
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private getReviewDir(feature: string): string {
    return path.join(getFeaturePath(this.projectRoot, feature), REVIEWS_DIR);
  }

  private getIndexPath(feature: string): string {
    return path.join(this.getReviewDir(feature), INDEX_FILE);
  }

  private getSessionPath(feature: string, sessionId: string): string {
    return path.join(this.getReviewDir(feature), `review-${sessionId}.json`);
  }

  private async loadIndex(feature: string): Promise<ReviewIndex> {
    const indexPath = this.getIndexPath(feature);
    const existing = readJson<ReviewIndex>(indexPath);

    if (existing) {
      return existing;
    }

    // Return default empty index
    return {
      schemaVersion: 1,
      activeSessionId: null,
      sessions: [],
    };
  }

  private async saveIndex(feature: string, index: ReviewIndex): Promise<void> {
    const indexPath = this.getIndexPath(feature);
    ensureDir(path.dirname(indexPath));
    writeJson(indexPath, index);
  }

  private async loadSession(sessionId: string, feature?: string): Promise<ReviewSession> {
    // If feature is provided, load directly
    if (feature) {
      const sessionPath = this.getSessionPath(feature, sessionId);
      const session = readJson<ReviewSession>(sessionPath);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      return session;
    }

    // Otherwise, search all features
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  private async saveSession(session: ReviewSession): Promise<void> {
    const sessionPath = this.getSessionPath(session.featureName, session.id);
    ensureDir(path.dirname(sessionPath));
    writeJson(sessionPath, session);
  }

  private generateId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Find a thread by ID across all sessions
   */
  private async findThread(threadId: string): Promise<{ session: ReviewSession; thread: ReviewThread }> {
    const features = await this.listFeatures();

    for (const feature of features) {
      const index = await this.loadIndex(feature);
      for (const sessionEntry of index.sessions) {
        const session = await this.loadSession(sessionEntry.id, feature);
        const thread = session.threads.find(t => t.id === threadId);
        if (thread) {
          return { session, thread };
        }
      }
    }

    throw new Error(`Thread not found: ${threadId}`);
  }

  /**
   * List all features in the project
   */
  private async listFeatures(): Promise<string[]> {
    const featuresPath = path.join(this.projectRoot, '.hive', 'features');
    if (!fileExists(featuresPath)) return [];

    const fs = await import('fs');
    return fs.readdirSync(featuresPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }
}
