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
import type { Range } from '../types.js';
import * as fs from 'fs';

export class PlanService {
  /** Optional callback fired after a comment is added */
  onCommentAdded?: (
    featureName: string,
    commentId: string,
    unresolvedCount: number,
  ) => void;

  /** Optional callback fired after a plan is revised (rewritten) */
  onPlanRevised?: (featureName: string, previousCommentCount: number) => void;

  /** Optional callback fired after a plan is approved */
  onPlanApproved?: (featureName: string, approvedAt: string) => void;

  /** Optional callback fired after a comment is unresolved */
  onCommentUnresolved?: (featureName: string, commentId: string) => void;

  /** Optional callback fired after a comment is deleted */
  onCommentDeleted?: (featureName: string, commentId: string) => void;

  /** Optional callback fired after a comment is edited */
  onCommentEdited?: (featureName: string, commentId: string) => void;

  /** Optional callback fired after a reply is edited */
  onReplyEdited?: (
    featureName: string,
    commentId: string,
    replyId: string,
  ) => void;

  /** Optional callback fired after a reply is deleted */
  onReplyDeleted?: (
    featureName: string,
    commentId: string,
    replyId: string,
  ) => void;

  constructor(private projectRoot: string) {}

  write(featureName: string, content: string): string {
    const planPath = getPlanPath(this.projectRoot, featureName);

    // Capture previous comment count before clearing
    const previousComments = this.getComments(featureName);
    const previousCommentCount = previousComments.length;

    writeText(planPath, content);

    this.clearComments(featureName);
    this.revokeApproval(featureName);

    // Fire callback after write completes (fire-and-forget)
    try {
      this.onPlanRevised?.(featureName, previousCommentCount);
    } catch {
      // fire-and-forget: swallow errors
    }

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

    // Fire callback after approval completes (fire-and-forget)
    try {
      this.onPlanApproved?.(featureName, timestamp);
    } catch {
      // fire-and-forget: swallow errors
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
   * Old format may lack author, timestamp, have replies as string[],
   * or use `line: number` instead of `range: Range`.
   */
  private migrateComment(
    raw: Record<string, unknown>,
    commentsPath: string,
  ): PlanComment {
    // Migrate line → range: if old `line` field exists but no `range`, convert
    let range: Range;
    if (raw.range && typeof raw.range === 'object') {
      range = raw.range as Range;
    } else {
      const line = typeof raw.line === 'number' ? raw.line : 0;
      range = {
        start: { line, character: 0 },
        end: { line, character: 0 },
      };
    }

    const comment: PlanComment = {
      id: (raw.id as string) || `comment-${Date.now()}`,
      range,
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

    // Fire callback after comment persisted (fire-and-forget)
    try {
      const allComments = data.threads;
      const unresolvedCount = allComments.filter(
        (c) => c.resolved !== true,
      ).length;
      this.onCommentAdded?.(featureName, newComment.id, unresolvedCount);
    } catch {
      // fire-and-forget: swallow errors
    }

    return newComment;
  }

  resolveComment(featureName: string, commentId: string): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const comment = data.threads.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    comment.resolved = true;
    writeJson(commentsPath, data);
  }

  addReply(
    featureName: string,
    commentId: string,
    reply: Omit<PlanCommentReply, 'id' | 'timestamp'>,
  ): PlanCommentReply {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const comment = data.threads.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    const newReply: PlanCommentReply = {
      ...reply,
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push(newReply);
    writeJson(commentsPath, data);

    return newReply;
  }

  clearComments(featureName: string): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    writeJson(commentsPath, { threads: [] });
  }

  unresolveComment(featureName: string, commentId: string): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const comment = data.threads.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    comment.resolved = false;
    writeJson(commentsPath, data);

    // Fire callback after unresolve (fire-and-forget)
    try {
      this.onCommentUnresolved?.(featureName, commentId);
    } catch {
      // fire-and-forget: swallow errors
    }
  }

  deleteComment(featureName: string, commentId: string): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const index = data.threads.findIndex((c) => c.id === commentId);
    if (index === -1) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    data.threads.splice(index, 1);
    writeJson(commentsPath, data);

    // Fire callback after delete (fire-and-forget)
    try {
      this.onCommentDeleted?.(featureName, commentId);
    } catch {
      // fire-and-forget: swallow errors
    }
  }

  editComment(
    featureName: string,
    commentId: string,
    newBody: string,
  ): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const comment = data.threads.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    comment.body = newBody;
    comment.timestamp = new Date().toISOString();
    writeJson(commentsPath, data);

    // Fire callback after edit (fire-and-forget)
    try {
      this.onCommentEdited?.(featureName, commentId);
    } catch {
      // fire-and-forget: swallow errors
    }
  }

  editReply(
    featureName: string,
    commentId: string,
    replyId: string,
    newBody: string,
  ): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const comment = data.threads.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    const reply = comment.replies?.find((r) => r.id === replyId);
    if (!reply) {
      throw new Error(`Reply '${replyId}' not found`);
    }

    reply.body = newBody;
    reply.timestamp = new Date().toISOString();
    writeJson(commentsPath, data);

    // Fire callback after reply edit (fire-and-forget)
    try {
      this.onReplyEdited?.(featureName, commentId, replyId);
    } catch {
      // fire-and-forget: swallow errors
    }
  }

  deleteReply(
    featureName: string,
    commentId: string,
    replyId: string,
  ): void {
    const commentsPath = getCommentsPath(this.projectRoot, featureName);
    const data = readJson<CommentsJson>(commentsPath) || { threads: [] };

    const comment = data.threads.find((c) => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment '${commentId}' not found`);
    }

    const replyIndex = comment.replies?.findIndex((r) => r.id === replyId);
    if (replyIndex === undefined || replyIndex === -1) {
      throw new Error(`Reply '${replyId}' not found`);
    }

    comment.replies!.splice(replyIndex, 1);
    writeJson(commentsPath, data);

    // Fire callback after reply delete (fire-and-forget)
    try {
      this.onReplyDeleted?.(featureName, commentId, replyId);
    } catch {
      // fire-and-forget: swallow errors
    }
  }
}
