import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ReviewService, ConfigService } from 'hive-core';
import type { ReviewSession, Range, AnnotationType, ReviewConfig, ReviewNotificationsConfig } from 'hive-core';

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
  | { type: 'changeScope'; scope: string }
  | { type: 'requestFile'; uri: string };

/**
 * Resolved review config with all defaults applied
 */
type ResolvedReviewConfig = Required<ReviewConfig> & { notifications: Required<ReviewNotificationsConfig> };

/**
 * Message types sent from extension to webview
 */
type ExtensionToWebviewMessage =
  | { type: 'sessionData'; session: ReviewSession; config: ResolvedReviewConfig }
  | { type: 'sessionUpdate'; session: ReviewSession }
  | { type: 'configUpdate'; config: ResolvedReviewConfig }
  | { type: 'error'; message: string }
  | { type: 'scopeChanged'; scope: string }
  | { type: 'fileContent'; uri: string; content: string; language?: string; warning?: string }
  | { type: 'fileError'; uri: string; error: string };

/**
 * Large file threshold in bytes (10MB)
 */
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

/**
 * ReviewPanel manages the webview for code review UI
 */
export class ReviewPanel {
  public static currentPanel: ReviewPanel | undefined;
  private static readonly viewType = 'hive.review';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _workspaceRoot: string;
  private readonly _disposables: vscode.Disposable[] = [];
  private readonly _reviewService: ReviewService;
  private readonly _configService: ConfigService;
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
     this._workspaceRoot = workspaceRoot;
     this._reviewService = new ReviewService(workspaceRoot);
     this._configService = new ConfigService();

     console.log('[HIVE WEBVIEW] ReviewPanel constructor: Creating webview panel');
     console.log('[HIVE WEBVIEW] Extension URI:', extensionUri.toString());
     console.log('[HIVE WEBVIEW] Workspace root:', workspaceRoot);

     // Set the webview's initial html content
     this._update();

     // Listen for when the panel is disposed
     this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

     // Update the content when the panel becomes visible
     this._panel.onDidChangeViewState(
       () => {
         if (this._panel.visible) {
           console.log('[HIVE WEBVIEW] Panel visibility changed to visible, updating...');
           this._update();
         }
       },
       null,
       this._disposables
     );

     // Handle messages from the webview
     this._panel.webview.onDidReceiveMessage(
       async (message: WebviewToExtensionMessage) => {
         console.log('[HIVE WEBVIEW] Received message from webview:', message.type);
         await this._handleMessage(message);
       },
       null,
       this._disposables
     );

     // Load session if feature name provided
     if (featureName) {
       console.log('[HIVE WEBVIEW] Loading session for feature:', featureName);
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
        const config = this._configService.getReviewConfig();
        this._postMessage({ type: 'sessionData', session: this._currentSession, config });
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
          const config = this._configService.getReviewConfig();
          this._postMessage({ type: 'sessionData', session: this._currentSession, config });
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

      case 'requestFile':
        await this._handleRequestFile(message.uri);
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

  private async _handleSelectThread(threadId: string): Promise<void> {
    if (!this._currentSession) {
      console.log('[HIVE WEBVIEW] No session for selectThread');
      return;
    }

    const thread = this._currentSession.threads.find(t => t.id === threadId);
    if (!thread || !thread.uri) {
      console.log('[HIVE WEBVIEW] Thread not found or no URI:', threadId);
      return;
    }

    try {
      console.log('[HIVE WEBVIEW] Selecting thread:', threadId, 'URI:', thread.uri);
      
      // Resolve the file URI - handle relative and absolute paths
      let uri: vscode.Uri;
      const threadUri = thread.uri.trim();
      
      // Check if it's an absolute path
      if (path.isAbsolute(threadUri)) {
        uri = vscode.Uri.file(threadUri);
      } else {
        // Treat as relative to workspace root
        const absolutePath = path.resolve(this._workspaceRoot, threadUri);
        uri = vscode.Uri.file(absolutePath);
      }
      
      console.log('[HIVE WEBVIEW] Resolved URI:', uri.fsPath);
      
      // Create range for the thread location
      const range = new vscode.Range(
        thread.range.start.line,
        thread.range.start.character,
        thread.range.end.line,
        thread.range.end.character
      );

      console.log('[HIVE WEBVIEW] Opening file with range:', {
        line: thread.range.start.line,
        char: thread.range.start.character
      });
      
      // Open the document and show it in the editor
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, {
        selection: range,
        preserveFocus: false,
      });
      
      console.log('[HIVE WEBVIEW] Successfully opened thread file');
    } catch (error) {
      console.error('[HIVE WEBVIEW] Error opening thread file:', error);
      
      // Show user-friendly error message
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Hive: Failed to open file. ${errorMsg}`
      );
      
      // Also send error back to webview
      this._postMessage({ 
        type: 'error', 
        message: `Failed to open file: ${errorMsg}` 
      });
    }
  }

  /**
   * Handle file content request from webview
   * Reads file content and sends it back to the webview for inline viewing
   */
  private async _handleRequestFile(requestUri: string): Promise<void> {
    console.log('[HIVE WEBVIEW] Handling requestFile:', requestUri);
    
    try {
      // Resolve the file path
      let absolutePath: string;
      const trimmedUri = requestUri.trim();
      
      if (path.isAbsolute(trimmedUri)) {
        absolutePath = trimmedUri;
      } else {
        // Treat as relative to workspace root
        absolutePath = path.resolve(this._workspaceRoot, trimmedUri);
      }
      
      // Normalize path to prevent directory traversal attacks
      const normalizedPath = path.resolve(absolutePath);
      const normalizedWorkspace = path.resolve(this._workspaceRoot);
      
      // Security check: ensure file is within workspace
      if (!normalizedPath.startsWith(normalizedWorkspace + path.sep) && 
          normalizedPath !== normalizedWorkspace) {
        console.log('[HIVE WEBVIEW] File outside workspace:', normalizedPath);
        this._postMessage({
          type: 'fileError',
          uri: requestUri,
          error: 'File is outside the workspace and cannot be accessed',
        });
        return;
      }
      
      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        console.log('[HIVE WEBVIEW] File not found:', normalizedPath);
        this._postMessage({
          type: 'fileError',
          uri: requestUri,
          error: `File not found: ${requestUri}`,
        });
        return;
      }
      
      // Get file stats
      const stats = fs.statSync(normalizedPath);
      
      // Check file size
      let warning: string | undefined;
      if (stats.size > LARGE_FILE_THRESHOLD) {
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        warning = `File is large (${sizeMB}MB). Reading may take a moment.`;
        console.log('[HIVE WEBVIEW] Large file warning:', warning);
      }
      
      // Read file content
      const content = fs.readFileSync(normalizedPath, 'utf-8');
      
      // Detect language from file extension
      const language = this._getLanguageId(normalizedPath);
      
      console.log('[HIVE WEBVIEW] File read successfully:', {
        path: normalizedPath,
        size: stats.size,
        language,
        hasWarning: !!warning,
      });
      
      // Send content to webview
      this._postMessage({
        type: 'fileContent',
        uri: requestUri,
        content,
        language,
        warning,
      });
      
    } catch (error) {
      console.error('[HIVE WEBVIEW] Error reading file:', error);
      
      const errorMsg = error instanceof Error ? error.message : String(error);
      this._postMessage({
        type: 'fileError',
        uri: requestUri,
        error: errorMsg,
      });
    }
  }

  /**
   * Get VS Code language identifier from file path
   */
  private _getLanguageId(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescriptreact',
      '.js': 'javascript',
      '.jsx': 'javascriptreact',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.json': 'json',
      '.jsonc': 'jsonc',
      '.md': 'markdown',
      '.mdx': 'mdx',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.html': 'html',
      '.htm': 'html',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.sh': 'shellscript',
      '.bash': 'shellscript',
      '.zsh': 'shellscript',
      '.sql': 'sql',
      '.graphql': 'graphql',
      '.gql': 'graphql',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.kts': 'kotlin',
      '.scala': 'scala',
      '.toml': 'toml',
      '.ini': 'ini',
      '.env': 'dotenv',
      '.dockerfile': 'dockerfile',
    };
    return languageMap[ext] || 'plaintext';
  }

  private _postMessage(message: ExtensionToWebviewMessage): void {
    this._panel.webview.postMessage(message);
  }

  private _update(): void {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
  }

   private _getHtmlForWebview(webview: vscode.Webview): string {
     const webviewDistPath = path.join(this._extensionUri.fsPath, 'dist', 'webview');

     // === LOGGING: Extension Path Info ===
     console.log('[HIVE WEBVIEW] Extension URI fsPath:', this._extensionUri.fsPath);
     console.log('[HIVE WEBVIEW] Webview dist path:', webviewDistPath);

     // Check if built webview exists
     const indexHtmlPath = path.join(webviewDistPath, 'index.html');
     const indexHtmlExists = fs.existsSync(indexHtmlPath);
     console.log('[HIVE WEBVIEW] index.html exists:', indexHtmlExists, 'at:', indexHtmlPath);

     if (!indexHtmlExists) {
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
     console.log('[HIVE WEBVIEW] index.html size:', html.length, 'bytes');

     // === LOGGING: Asset Directory Info ===
     const assetsDir = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'assets');
     const assetsDirFsPath = assetsDir.fsPath;
     const assetsDirExists = fs.existsSync(assetsDirFsPath);
     console.log('[HIVE WEBVIEW] Assets directory exists:', assetsDirExists, 'at:', assetsDirFsPath);

     if (assetsDirExists) {
       const assetFiles = fs.readdirSync(assetsDirFsPath);
       console.log('[HIVE WEBVIEW] Asset files found:', assetFiles);
       assetFiles.forEach(file => {
         const filePath = path.join(assetsDirFsPath, file);
         const fileStat = fs.statSync(filePath);
         console.log(`  [HIVE WEBVIEW]   - ${file} (${fileStat.size} bytes)`);
       });
     }

     const assetsUri = webview.asWebviewUri(assetsDir);
     console.log('[HIVE WEBVIEW] Assets URI (from asWebviewUri):', assetsUri.toString());

     // === LOGGING: Asset Path Detection ===
     const assetPathsInHtml = html.match(/(?:href|src)="(?:\.\/)?(?:\/)?assets\/[^"]+"/g) || [];
     console.log('[HIVE WEBVIEW] Asset paths found in HTML:', assetPathsInHtml.length);
     assetPathsInHtml.slice(0, 5).forEach((match, idx) => {
       console.log(`  [HIVE WEBVIEW]   ${idx + 1}. ${match}`);
     });

     // Rewrite asset paths to webview URIs
     // Handle all formats: /assets/, assets/, ./assets/
     const beforeRewrite = html;
     html = html.replace(/href="\/assets\//g, `href="${assetsUri}/`);
     html = html.replace(/src="\/assets\//g, `src="${assetsUri}/`);
     html = html.replace(/href="\.\/assets\//g, `href="${assetsUri}/`);
     html = html.replace(/src="\.\/assets\//g, `src="${assetsUri}/`);
     html = html.replace(/href="assets\//g, `href="${assetsUri}/`);
     html = html.replace(/src="assets\//g, `src="${assetsUri}/`);

     // === LOGGING: Rewrite Results ===
     const assetPathsAfterRewrite = html.match(/(?:href|src)="vscode-webview:\/\/[^"]+"/g) || [];
     console.log('[HIVE WEBVIEW] Webview URIs after rewrite:', assetPathsAfterRewrite.length);
     assetPathsAfterRewrite.slice(0, 3).forEach((match, idx) => {
       console.log(`  [HIVE WEBVIEW]   ${idx + 1}. ${match.substring(0, 80)}...`);
     });

     // Update CSP to allow webview resources
     const nonce = getNonce();
     const csp = [
       `default-src 'none'`,
       `style-src ${webview.cspSource} 'unsafe-inline'`,
       `script-src ${webview.cspSource} 'unsafe-inline'`,
       `font-src ${webview.cspSource}`,
       `img-src ${webview.cspSource} data:`,
     ].join('; ');

     // === LOGGING: CSP Info ===
     console.log('[HIVE WEBVIEW] CSP Source:', webview.cspSource);
     console.log('[HIVE WEBVIEW] CSP Policy:', csp);

     // Replace existing CSP meta tag or add one
     if (html.includes('Content-Security-Policy')) {
       html = html.replace(
         /<meta[^>]*Content-Security-Policy[^>]*>/,
         `<meta http-equiv="Content-Security-Policy" content="${csp}">`
       );
       console.log('[HIVE WEBVIEW] Replaced existing CSP meta tag');
     } else {
       html = html.replace(
         '<head>',
         `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`
       );
       console.log('[HIVE WEBVIEW] Added new CSP meta tag to head');
     }

     // === LOGGING: Final HTML Info ===
     console.log('[HIVE WEBVIEW] Final HTML size:', html.length, 'bytes');
     console.log('[HIVE WEBVIEW] HTML preparation complete, sending to webview');

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
      vscode.Uri.joinPath(extensionUri, 'dist'),
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'assets'),
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
