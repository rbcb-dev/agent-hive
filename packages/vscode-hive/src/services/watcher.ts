import * as vscode from 'vscode';
import * as path from 'path';

export class HiveWatcher {
  private watcher: vscode.FileSystemWatcher;

  constructor(workspaceRoot: string, onChange: () => void) {
    const pattern = new vscode.RelativePattern(workspaceRoot, '.hive/**/*');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.watcher.onDidCreate(onChange);
    this.watcher.onDidChange(onChange);
    this.watcher.onDidDelete(onChange);
  }

  dispose(): void {
    this.watcher.dispose();
  }
}
