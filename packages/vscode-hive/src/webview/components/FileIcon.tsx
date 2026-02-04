/**
 * FileIcon component - Shows file/folder icons using VS Code codicons
 * 
 * Uses @vscode/codicons for lightweight, VS Code-style icons.
 * Maps common file extensions to appropriate icon categories.
 */

import React from 'react';
import '@vscode/codicons/dist/codicon.css';

/**
 * Map file extensions to codicon icon names.
 * Uses generic icon categories to keep the mapping maintainable.
 */
const FILE_ICON_MAP: Record<string, string> = {
  // Languages - code files
  ts: 'file-code',
  tsx: 'file-code',
  js: 'file-code',
  jsx: 'file-code',
  py: 'file-code',
  rb: 'file-code',
  go: 'file-code',
  rs: 'file-code',
  java: 'file-code',
  c: 'file-code',
  cpp: 'file-code',
  h: 'file-code',
  hpp: 'file-code',
  cs: 'file-code',
  php: 'file-code',
  swift: 'file-code',
  kt: 'file-code',
  scala: 'file-code',
  
  // Data/Config - text/structured files
  json: 'file-text',
  yaml: 'file-text',
  yml: 'file-text',
  xml: 'file-text',
  toml: 'file-text',
  ini: 'file-text',
  csv: 'file-text',
  
  // Documentation - markdown
  md: 'markdown',
  mdx: 'markdown',
  
  // Special files
  lock: 'lock',
  env: 'gear',
  
  // Styles
  css: 'file-code',
  scss: 'file-code',
  sass: 'file-code',
  less: 'file-code',
  
  // Templates
  html: 'file-code',
  htm: 'file-code',
  vue: 'file-code',
  svelte: 'file-code',
  
  // Shell scripts
  sh: 'terminal',
  bash: 'terminal',
  zsh: 'terminal',
  
  // Default
  default: 'file',
};

export interface FileIconProps {
  /** The filename to determine the icon from */
  filename: string;
  /** Whether this is a directory (shows folder icon) */
  isDirectory: boolean;
}

/**
 * Get the file extension from a filename, handling special cases
 */
function getExtension(filename: string): string {
  // Handle dotfiles like .env, .gitignore
  if (filename.startsWith('.') && !filename.includes('.', 1)) {
    // .env -> env, .gitignore -> gitignore (but we only check env in our map)
    return filename.slice(1).toLowerCase();
  }
  
  // Get the last part after the last dot
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  
  // No extension
  return '';
}

/**
 * FileIcon component - Renders codicon icons for files and folders
 */
export function FileIcon({ filename, isDirectory }: FileIconProps): React.ReactElement {
  if (isDirectory) {
    return <span className="codicon codicon-folder" aria-hidden="true" />;
  }
  
  const ext = getExtension(filename);
  const icon = FILE_ICON_MAP[ext] || FILE_ICON_MAP.default;
  
  return <span className={`codicon codicon-${icon}`} aria-hidden="true" />;
}
