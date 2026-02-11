import {
  getPlanPath,
  getCommentsPath,
  getFeatureJsonPath,
  getApprovedPath,
  readJson,
  writeJson,
  readText,
  writeText,
  fileExists,
} from '../utils/paths.js';
import {
  FeatureJson,
  CommentsJson,
  PlanComment,
  PlanCommentReply,
  PlanReadResult,
} from '../types.js';
import * as fs from 'fs';

export class PlanService {
  constructor(private projectRoot: string) {}

  write(featureName: string, content: string): string {
    const planPath = getPlanPath(this.projectRoot, featureName);
    writeText(planPath, content);

    this.clearComments(featureName);
    this.revokeApproval(featureName);

    return planPath;
  }

  read(featureName: string): PlanReadResult | null {
    const planPath = getPlanPath(this.projectRoot, featureName);
    const content = readText(planPath);

    if (content === null) return null;

    const comments = this.getComments(featureName);
    const isApproved = this.isApproved(featureName);

    return {
      content,
      status: isApproved ? 'approved' : 'planning',
      comments,
    };
  }

  approve(featureName: string): void {
    if (!fileExists(getPlanPath(this.projectRoot, featureName))) {
      throw new Error(`No plan.md found for feature '${featureName}'`);
    }

    const comments = this.getComments(featureName);
    const unresolved = comments.filter((c) => c.resolved !== true);
    if (unresolved.length > 0) {
      throw new Error(
        `Cannot approve plan: ${unresolved.length} unresolved comment(s) remain`,
      );
    }

    const approvedPath = getApprovedPath(this.projectRoot, featureName);
    const timestamp = new Date().toISOString();
    fs.writeFileSync(approvedPath, `Approved at ${timestamp}\n`);

    // Also update feature.json for backwards compatibility
    const featurePath = getFeatureJsonPath(this.projectRoot, featureName);
    const feature = readJson<FeatureJson>(featurePath);
    if (feature) {
      feature.status = 'approved';
      feature.approvedAt = timestamp;
      writeJson(featurePath, feature);
    }
  }

  isApproved(featureName: string): boolean {
    return fileExists(getApprovedPath(this.projectRoot, featureName));
  }

  revokeApproval(featureName: string): void {
    const approvedPath = getApprovedPath(this.projectRoot, featureName);
    if (fileExists(approvedPath)) {
      fs.unlinkSync(approvedPath);
    }

    // Also update feature.json for backwards compatibility
    const featurePath = getFeatureJsonPath(this.projectRoot, featureName);
    const feature = readJson<FeatureJson>(featurePath);
    if (feature && feature.status === 'approved') {
      feature.status = 'planning';
      delete feature.approvedAt;
      writeJson(featurePath, feature);
    }
  }

  getComments(featureName: string): PlanComment[] {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath);
    if (!data?.threads) return [];

    return data.threads.map((thread) =>
      this.migrateComment(
        thread as unknown as Record<string, unknown>,
        commentsPath,
      ),
    );
  }

  /**
   * Migrate a comment from old format to the current schema.
   * Old format may lack author, timestamp, or have replies as string[].
   */
  private migrateComment(
    raw: Record<string, unknown>,
    commentsPath: string,
  ): PlanComment {
    const comment: PlanComment = {
      id: (raw.id as string) || `comment-${Date.now()}`,
      line: (raw.line as number) || 0,
      body: (raw.body as string) || '',
      author: (raw.author as 'human' | 'agent') || 'human',
      timestamp: (raw.timestamp as string) || this.getFileMtime(commentsPath),
    };

    if (raw.resolved !== undefined) {
      comment.resolved = raw.resolved as boolean;
    }

    if (Array.isArray(raw.replies) && raw.replies.length > 0) {
      comment.replies = raw.replies.map((reply: unknown) => {
        if (typeof reply === 'string') {
          // Old format: replies were plain strings
          return {
            id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            body: reply,
            author: 'human' as const,
            timestamp: comment.timestamp,
          };
        }
        // New format: reply is a PlanCommentReply object
        const replyObj = reply as Record<string, unknown>;
        return {
          id: (replyObj.id as string) || `reply-${Date.now()}`,
          body: (replyObj.body as string) || '',
          author: (replyObj.author as 'human' | 'agent') || 'human',
          timestamp: (replyObj.timestamp as string) || comment.timestamp,
        } as PlanCommentReply;
      });
    }

    return comment;
  }

  private getFileMtime(filePath: string): string {
    try {
      const stat = fs.statSync(filePath);
      return stat.mtime.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  addComment(
    featureName: string,
    comment: Omit<PlanComment, 'id' | 'timestamp'>,
  ): PlanComment {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const newComment: PlanComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    data.threads.push(newComment);
    writeJson(commentsPath, data);

    return newComment;
  }

  clearComments(featureName: string): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    writeJson(commentsPath, { threads: [] });
  }
}
