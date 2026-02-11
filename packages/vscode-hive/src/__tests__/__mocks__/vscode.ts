/**
 * Mock implementation of the `vscode` module for extension-side unit tests.
 *
 * Provides minimal stubs for the APIs used by PlanCommentController.
 * Functions are designed to be spyable/replaceable from tests.
 */

export class Range {
  constructor(
    public startLine: number,
    public startCharacter: number,
    public endLine: number,
    public endCharacter: number,
  ) {}

  get start() {
    return { line: this.startLine, character: this.startCharacter };
  }

  get end() {
    return { line: this.endLine, character: this.endCharacter };
  }
}

export class MarkdownString {
  constructor(public value: string) {}
}

export class Uri {
  public fsPath: string;
  private constructor(p: string) {
    this.fsPath = p;
  }
  static file(p: string) {
    return new Uri(p);
  }
}

export class RelativePattern {
  constructor(
    public base: string,
    public pattern: string,
  ) {}
}

export const CommentMode = { Preview: 1, Editing: 0 } as const;

export const CommentThreadCollapsibleState = {
  Collapsed: 0,
  Expanded: 1,
} as const;

/** Mutable store to track watcher registrations from tests */
export const __watcherCallbacks = {
  onCreate: null as ((...args: unknown[]) => unknown) | null,
  onChange: null as ((...args: unknown[]) => unknown) | null,
  onDelete: null as ((...args: unknown[]) => unknown) | null,
};

/** Mutable store to track createCommentThread calls */
export const __commentThreadCalls: Array<{
  uri: unknown;
  range: Range;
  comments: unknown[];
}> = [];

/** Mutable store for the most recently created controller's createCommentThread fn */
export let __createCommentThread = (
  uri: unknown,
  range: Range,
  threadComments: unknown[],
) => {
  const entry = { uri, range, comments: [...threadComments] };
  __commentThreadCalls.push(entry);
  return {
    uri,
    range,
    comments: [...threadComments],
    canReply: false,
    collapsibleState: 0,
    dispose: () => {},
  };
};

export function __reset() {
  __watcherCallbacks.onCreate = null;
  __watcherCallbacks.onChange = null;
  __watcherCallbacks.onDelete = null;
  __commentThreadCalls.length = 0;
}

export const comments = {
  createCommentController: (_id: string, _label: string) => ({
    commentingRangeProvider: null as unknown,
    dispose: () => {},
    createCommentThread: (
      uri: unknown,
      range: Range,
      threadComments: unknown[],
    ) => __createCommentThread(uri, range, threadComments),
  }),
};

export const workspace = {
  createFileSystemWatcher: (_pattern: RelativePattern) => ({
    onDidCreate: (cb: (...args: unknown[]) => unknown) => {
      __watcherCallbacks.onCreate = cb;
      return { dispose: () => {} };
    },
    onDidChange: (cb: (...args: unknown[]) => unknown) => {
      __watcherCallbacks.onChange = cb;
      return { dispose: () => {} };
    },
    onDidDelete: (cb: (...args: unknown[]) => unknown) => {
      __watcherCallbacks.onDelete = cb;
      return { dispose: () => {} };
    },
    dispose: () => {},
  }),
  onDidOpenTextDocument: () => ({ dispose: () => {} }),
  onDidSaveTextDocument: () => ({ dispose: () => {} }),
  textDocuments: [] as unknown[],
};
