import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ReviewService } from 'hive-core';
import type { ReviewSession, Range, AnnotationType } from 'hive-core';

/**
 * Message types sent from webview to extension
 */
type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'addComment'; threadId?: string; entityId: string; uri?: string; range: Range; body: string; annotationType: string }
  | { type: 'reply'; threadId: string; body: string }
  | { type: 'resolve'; threadId: string }
  | { type: 'submit'; verdict: string; summary: string }
  | { type: 'selectFile'; path: string }
  | { type: 'selectThread'; threadId: string }
  | { type: 'changeScope'; scope: string };

/**
 * Message types sent from extension to webview
 */
type ExtensionToWebviewMessage =
  | { type: 'sessionData'; session: ReviewSession }
  | { type: 'sessionUpdate'; session: ReviewSession }
  | { type: 'error'; message: string }
  | { type: 'scopeChanged'; scope: string };

/**
 * ReviewPanel manages the webview for code review UI
 */
export class ReviewPanel {
  public static currentPanel: ReviewPanel | undefined;
  private static readonly viewType = 'hive.review';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _disposables: vscode.Disposable[] = [];
  private readonly _reviewService: ReviewService;
  private _currentSession: ReviewSession | null = null;

  public static createOrShow(
    extensionUri: vscode.Uri,
    workspaceRoot: string,
    featureName?: string
  ): ReviewPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (ReviewPanel.currentPanel) {
      ReviewPanel.currentPanel._panel.reveal(column);
      if (featureName) {
        ReviewPanel.currentPanel.loadSession(featureName);
      }
      return ReviewPanel.currentPanel;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      ReviewPanel.viewType,
      'Hive Review',
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri)
    );

    ReviewPanel.currentPanel = new ReviewPanel(panel, extensionUri, workspaceRoot, featureName);
    return ReviewPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    workspaceRoot: string,
    featureName?: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._reviewService = new ReviewService(workspaceRoot);

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content when the panel becomes visible
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        await this._handleMessage(message);
      },
      null,
      this._disposables
    );

    // Load session if feature name provided
    if (featureName) {
      this.loadSession(featureName);
    }
  }

  public dispose(): void {
    ReviewPanel.currentPanel = undefined;

    // Clean up resources
    this._panel.dispose();

    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  /**
   * Load or create a review session for a feature
   */
  public async loadSession(featureName: string): Promise<void> {
    try {
      // Get the active session or create a new one
      const sessions = await this._reviewService.listSessions(featureName);
      const activeSession = sessions.find(s => s.status === 'in_progress');

      if (activeSession) {
        this._currentSession = await this._reviewService.getSession(activeSession.id);
      } else {
        // Create a new session
        this._currentSession = await this._reviewService.startSession(featureName, 'code');
      }

      if (this._currentSession) {
        this._postMessage({ type: 'sessionData', session: this._currentSession });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load session';
      this._postMessage({ type: 'error', message });
    }
  }

  /**
   * Handle messages from the webview
   */
  private async _handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.type) {
      case 'ready':
        // Webview is ready, send current session if available
        if (this._currentSession) {
          this._postMessage({ type: 'sessionData', session: this._currentSession });
        }
        break;

      case 'addComment':
        await this._handleAddComment(message);
        break;

      case 'reply':
        await this._handleReply(message);
        break;

      case 'resolve':
        await this._handleResolve(message);
        break;

      case 'submit':
        await this._handleSubmit(message);
        break;

      case 'selectFile':
        // Open the file in editor
        this._handleSelectFile(message.path);
        break;

      case 'selectThread':
        // Highlight the thread location
        this._handleSelectThread(message.threadId);
        break;

      case 'changeScope':
        this._postMessage({ type: 'scopeChanged', scope: message.scope });
        break;
    }
  }

  private async _handleAddComment(message: {
    entityId: string;
    uri?: string;
    range: Range;
    body: string;
    annotationType: string;
  }): Promise<void> {
    if (!this._currentSession) {
      this._postMessage({ type: 'error', message: 'No active session' });
      return;
    }

    try {
      await this._reviewService.addThread(
        this._currentSession.id,
        message.entityId,
        message.uri || null,
        message.range,
        {
          type: message.annotationType as AnnotationType,
          body: message.body,
          author: { type: 'human', name: 'user' },
        }
      );

      // Refresh the session
      this._currentSession = await this._reviewService.getSession(this._currentSession.id);
      if (this._currentSession) {
        this._postMessage({ type: 'sessionUpdate', session: this._currentSession });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      this._postMessage({ type: 'error', message: errorMessage });
    }
  }

  private async _handleReply(message: { threadId: string; body: string }): Promise<void> {
    if (!this._currentSession) {
      this._postMessage({ type: 'error', message: 'No active session' });
      return;
    }

    try {
      await this._reviewService.replyToThread(message.threadId, message.body);

      // Refresh the session
      this._currentSession = await this._reviewService.getSession(this._currentSession.id);
      if (this._currentSession) {
        this._postMessage({ type: 'sessionUpdate', session: this._currentSession });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reply';
      this._postMessage({ type: 'error', message: errorMessage });
    }
  }

  private async _handleResolve(message: { threadId: string }): Promise<void> {
    if (!this._currentSession) {
      this._postMessage({ type: 'error', message: 'No active session' });
      return;
    }

    try {
      await this._reviewService.resolveThread(message.threadId);

      // Refresh the session
      this._currentSession = await this._reviewService.getSession(this._currentSession.id);
      if (this._currentSession) {
        this._postMessage({ type: 'sessionUpdate', session: this._currentSession });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve thread';
      this._postMessage({ type: 'error', message: errorMessage });
    }
  }

  private async _handleSubmit(message: { verdict: string; summary: string }): Promise<void> {
    if (!this._currentSession) {
      this._postMessage({ type: 'error', message: 'No active session' });
      return;
    }

    try {
      this._currentSession = await this._reviewService.submitSession(
        this._currentSession.id,
        message.verdict as 'approve' | 'request_changes' | 'comment',
        message.summary
      );

      this._postMessage({ type: 'sessionUpdate', session: this._currentSession });
      vscode.window.showInformationMessage(`Review submitted: ${message.verdict}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
      this._postMessage({ type: 'error', message: errorMessage });
    }
  }

  private _handleSelectFile(filePath: string): void {
    // Open the file in VSCode
    const uri = vscode.Uri.file(filePath);
    vscode.window.showTextDocument(uri);
  }

  private _handleSelectThread(threadId: string): void {
    if (!this._currentSession) return;

    const thread = this._currentSession.threads.find(t => t.id === threadId);
    if (!thread || !thread.uri) return;

    // Open file and navigate to the thread's range
    const uri = vscode.Uri.file(thread.uri);
    const range = new vscode.Range(
      thread.range.start.line,
      thread.range.start.character,
      thread.range.end.line,
      thread.range.end.character
    );

    vscode.window.showTextDocument(uri, {
      selection: range,
      preserveFocus: false,
    });
  }

  private _postMessage(message: ExtensionToWebviewMessage): void {
    this._panel.webview.postMessage(message);
  }

  private _update(): void {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const webviewDistPath = path.join(this._extensionUri.fsPath, 'dist', 'webview');

    // Check if built webview exists
    const indexHtmlPath = path.join(webviewDistPath, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hive Review</title>
</head>
<body>
  <h1>Webview not built</h1>
  <p>Please run <code>bun run build:webview</code> in packages/vscode-hive</p>
</body>
</html>`;
    }

    // Read the index.html
    let html = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Get URIs for assets
    const assetsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'assets'));

    // Rewrite asset paths to webview URIs
    // Replace href="assets/..." and src="assets/..."
    html = html.replace(/href="assets\//g, `href="${assetsUri}/`);
    html = html.replace(/src="assets\//g, `src="${assetsUri}/`);

    // Update CSP to allow webview resources
    const nonce = getNonce();
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} data:`,
    ].join('; ');

    // Replace existing CSP meta tag or add one
    if (html.includes('Content-Security-Policy')) {
      html = html.replace(
        /<meta[^>]*Content-Security-Policy[^>]*>/,
        `<meta http-equiv="Content-Security-Policy" content="${csp}">`
      );
    } else {
      html = html.replace(
        '<head>',
        `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`
      );
    }

    return html;
  }
}

/**
 * Get webview options for the panel
 */
function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
    ],
  };
}

/**
 * Generate a nonce for CSP
 */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
