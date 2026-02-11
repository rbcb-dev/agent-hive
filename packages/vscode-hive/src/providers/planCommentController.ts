import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface StoredReply {
  id: string;
  body: string;
  author: 'human' | 'agent';
  timestamp: string;
}

/** Range anchor matching hive-core's Range type. All lines are 0-based (VS Code native). */
interface StoredRange {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

interface StoredThread {
  id: string;
  range: StoredRange;
  body: string;
  author: 'human' | 'agent';
  timestamp: string;
  resolved?: boolean;
  replies?: StoredReply[];
}

/**
 * Old format stored by previous versions of PlanCommentController.
 * Used `line` (single number) instead of `range`, replies was string[],
 * no author/timestamp fields.
 */
interface LegacyStoredThread {
  id: string;
  line?: number;
  range?: StoredRange;
  body: string;
  replies?: (string | StoredReply)[];
  author?: string;
  timestamp?: string;
}

interface CommentsFile {
  threads: (StoredThread | LegacyStoredThread)[];
}

export class PlanCommentController {
  private controller: vscode.CommentController;
  private threads = new Map<string, vscode.CommentThread>();
  private commentsWatcher: vscode.FileSystemWatcher | undefined;
  private normalizedWorkspaceRoot: string;

  constructor(private workspaceRoot: string) {
    this.normalizedWorkspaceRoot = this.normalizePath(workspaceRoot);
    this.controller = vscode.comments.createCommentController(
      'hive-plan-review',
      'Plan Review',
    );

    this.controller.commentingRangeProvider = {
      provideCommentingRanges: (document: vscode.TextDocument) => {
        if (path.basename(document.fileName) !== 'plan.md') return [];
        return [new vscode.Range(0, 0, document.lineCount - 1, 0)];
      },
    };

    const pattern = new vscode.RelativePattern(
      workspaceRoot,
      '.hive/features/*/comments.json',
    );
    this.commentsWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    this.commentsWatcher.onDidCreate((uri) => this.onCommentsFileChanged(uri));
    this.commentsWatcher.onDidChange((uri) => this.onCommentsFileChanged(uri));
    this.commentsWatcher.onDidDelete((uri) => this.onCommentsFileChanged(uri));
  }

  private onCommentsFileChanged(commentsUri: vscode.Uri): void {
    const featureMatch = this.getFeatureMatch(commentsUri.fsPath);
    if (!featureMatch) return;
    const planPath = path.join(
      this.workspaceRoot,
      '.hive',
      'features',
      featureMatch,
      'plan.md',
    );
    this.loadComments(vscode.Uri.file(planPath));
  }

  registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      this.controller,

      vscode.commands.registerCommand(
        'hive.comment.create',
        (reply: vscode.CommentReply) => {
          this.createComment(reply);
        },
      ),

      vscode.commands.registerCommand(
        'hive.comment.reply',
        (reply: vscode.CommentReply) => {
          this.replyToComment(reply);
        },
      ),

      vscode.commands.registerCommand(
        'hive.comment.resolve',
        (thread: vscode.CommentThread) => {
          thread.dispose();
          this.saveComments(thread.uri);
        },
      ),

      vscode.commands.registerCommand(
        'hive.comment.delete',
        (comment: vscode.Comment) => {
          for (const [id, thread] of this.threads) {
            const commentIndex = thread.comments.findIndex(
              (c) => c === comment,
            );
            if (commentIndex !== -1) {
              thread.comments = thread.comments.filter((c) => c !== comment);
              if (thread.comments.length === 0) {
                thread.dispose();
                this.threads.delete(id);
              }
              this.saveComments(thread.uri);
              break;
            }
          }
        },
      ),

      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (path.basename(doc.fileName) === 'plan.md') {
          this.loadComments(doc.uri);
        }
      }),

      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (path.basename(doc.fileName) === 'plan.md') {
          this.saveComments(doc.uri);
        }
      }),
    );

    vscode.workspace.textDocuments.forEach((doc) => {
      if (path.basename(doc.fileName) === 'plan.md') {
        this.loadComments(doc.uri);
      }
    });
  }

  private getFeatureMatch(filePath: string): string | null {
    const normalized = this.normalizePath(filePath);
    const normalizedWorkspace = this.normalizedWorkspaceRoot.replace(
      /\/+$/,
      '',
    );
    const compareNormalized =
      process.platform === 'win32' ? normalized.toLowerCase() : normalized;
    const compareWorkspace =
      process.platform === 'win32'
        ? normalizedWorkspace.toLowerCase()
        : normalizedWorkspace;
    if (!compareNormalized.startsWith(`${compareWorkspace}/`)) return null;
    const match = filePath
      .replace(/\\/g, '/')
      .match(/\.hive\/features\/([^/]+)\/(?:plan\.md|comments\.json)$/);
    return match ? match[1] : null;
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  private isSamePath(left: string, right: string): boolean {
    const normalizedLeft = this.normalizePath(left);
    const normalizedRight = this.normalizePath(right);
    if (process.platform === 'win32') {
      return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase();
    }
    return normalizedLeft === normalizedRight;
  }

  private createComment(reply: vscode.CommentReply): void {
    const range = reply.thread.range ?? new vscode.Range(0, 0, 0, 0);

    const thread = this.controller.createCommentThread(
      reply.thread.uri,
      range,
      [
        {
          body: new vscode.MarkdownString(reply.text),
          author: { name: 'You' },
          mode: vscode.CommentMode.Preview,
        },
      ],
    );
    thread.canReply = true;
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.threads.set(id, thread);
    this.saveComments(reply.thread.uri);

    reply.thread.dispose();
  }

  private replyToComment(reply: vscode.CommentReply): void {
    const newComment: vscode.Comment = {
      body: new vscode.MarkdownString(reply.text),
      author: { name: 'You' },
      mode: vscode.CommentMode.Preview,
    };
    reply.thread.comments = [...reply.thread.comments, newComment];
    this.saveComments(reply.thread.uri);
  }

  private getCommentsPath(uri: vscode.Uri): string | null {
    const featureMatch = this.getFeatureMatch(uri.fsPath);
    if (!featureMatch) return null;
    return path.join(
      this.workspaceRoot,
      '.hive',
      'features',
      featureMatch,
      'comments.json',
    );
  }

  private loadComments(uri: vscode.Uri): void {
    const commentsPath = this.getCommentsPath(uri);
    if (!commentsPath || !fs.existsSync(commentsPath)) return;

    try {
      const data: CommentsFile = JSON.parse(
        fs.readFileSync(commentsPath, 'utf-8'),
      );

      this.threads.forEach((thread, id) => {
        if (this.isSamePath(thread.uri.fsPath, uri.fsPath)) {
          thread.dispose();
          this.threads.delete(id);
        }
      });

      let needsMigration = false;

      for (const raw of data.threads) {
        const stored = this.migrateStoredThread(raw, commentsPath);
        if (
          !raw.author ||
          !raw.timestamp ||
          ('line' in raw && !('range' in raw))
        ) {
          needsMigration = true;
        }

        const replies = stored.replies || [];
        const comments: vscode.Comment[] = [
          {
            body: new vscode.MarkdownString(stored.body),
            author: { name: stored.author === 'agent' ? 'Agent' : 'You' },
            mode: vscode.CommentMode.Preview,
          },
          ...replies.map((r) => ({
            body: new vscode.MarkdownString(r.body),
            author: { name: r.author === 'agent' ? 'Agent' : 'You' },
            mode: vscode.CommentMode.Preview,
          })),
        ];

        const thread = this.controller.createCommentThread(
          uri,
          new vscode.Range(
            stored.range.start.line,
            stored.range.start.character,
            stored.range.end.line,
            stored.range.end.character,
          ),
          comments,
        );
        thread.canReply = true;
        thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;

        this.threads.set(stored.id, thread);
      }

      // Re-save to persist migrated format
      if (needsMigration) {
        this.saveComments(uri);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }

  /**
   * Migrate a thread from old format (line-only, string[] replies, no author/timestamp)
   * to the current format (Range-based, StoredReply[] replies, author + timestamp).
   */
  private migrateStoredThread(
    raw: StoredThread | LegacyStoredThread,
    commentsPath: string,
  ): StoredThread {
    const timestamp = raw.timestamp || this.getFileMtime(commentsPath);
    const author = (raw.author as 'human' | 'agent') || 'human';

    // Migrate line → range: if old `line` field exists but no `range`, convert
    let range: StoredRange;
    if (raw.range && typeof raw.range === 'object') {
      range = raw.range;
    } else {
      const line = 'line' in raw && typeof raw.line === 'number' ? raw.line : 0;
      range = {
        start: { line, character: 0 },
        end: { line, character: 0 },
      };
    }

    let replies: StoredReply[] | undefined;
    if (Array.isArray(raw.replies) && raw.replies.length > 0) {
      replies = raw.replies.map((r: string | StoredReply) => {
        if (typeof r === 'string') {
          return {
            id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            body: r,
            author: 'human' as const,
            timestamp,
          };
        }
        return r;
      });
    }

    return {
      id: raw.id,
      range,
      body: raw.body,
      author,
      timestamp,
      replies,
    };
  }

  private getFileMtime(filePath: string): string {
    try {
      const stat = fs.statSync(filePath);
      return stat.mtime.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private saveComments(uri: vscode.Uri): void {
    const commentsPath = this.getCommentsPath(uri);
    if (!commentsPath) return;

    const threads: StoredThread[] = [];
    const now = new Date().toISOString();

    this.threads.forEach((thread, id) => {
      if (!this.isSamePath(thread.uri.fsPath, uri.fsPath)) return;
      if (thread.comments.length === 0) return;

      const [first, ...rest] = thread.comments;
      const threadRange = thread.range;
      const range: StoredRange = threadRange
        ? {
            start: {
              line: threadRange.start.line,
              character: threadRange.start.character,
            },
            end: {
              line: threadRange.end.line,
              character: threadRange.end.character,
            },
          }
        : { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
      const getBodyText = (body: string | vscode.MarkdownString): string =>
        typeof body === 'string' ? body : body.value;

      const replies: StoredReply[] = rest.map((c) => ({
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        body: getBodyText(c.body),
        author: 'human' as const,
        timestamp: now,
      }));

      threads.push({
        id,
        range,
        body: getBodyText(first.body),
        author: 'human',
        timestamp: now,
        replies: replies.length > 0 ? replies : undefined,
      });
    });

    const data = { threads };

    try {
      fs.mkdirSync(path.dirname(commentsPath), { recursive: true });
      fs.writeFileSync(commentsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save comments:', error);
    }
  }

  dispose(): void {
    this.commentsWatcher?.dispose();
    this.controller.dispose();
  }
}
