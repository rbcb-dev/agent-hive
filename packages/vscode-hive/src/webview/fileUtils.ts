/**
 * File utilities for the File Content Request Protocol
 */

import * as path from 'path';

/**
 * Large file threshold in bytes (10MB)
 */
export const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

/**
 * Map of file extensions to VS Code language identifiers
 */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
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

/**
 * Get the VS Code language identifier for a file path
 * @param filePath - The file path or name
 * @returns The language identifier (e.g., 'typescript', 'javascript')
 */
export function getLanguageId(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
}

/**
 * Check if a file path is within the workspace root
 * This prevents reading files outside the workspace (security measure)
 * @param workspaceRoot - The workspace root directory
 * @param filePath - The file path to check (must be absolute)
 * @returns true if the file is within the workspace
 */
export function isPathWithinWorkspace(workspaceRoot: string, filePath: string): boolean {
  // Normalize both paths to handle .. and other path components
  const normalizedWorkspace = path.resolve(workspaceRoot);
  const normalizedFile = path.resolve(filePath);
  
  // Check if the normalized file path starts with the workspace root
  // Add path separator to prevent matching partial directory names
  // e.g., /project vs /project-backup
  return normalizedFile === normalizedWorkspace || 
         normalizedFile.startsWith(normalizedWorkspace + path.sep);
}

/**
 * Check if a file size exceeds the large file threshold
 * @param sizeInBytes - File size in bytes
 * @returns true if the file is considered large
 */
export function isLargeFile(sizeInBytes: number): boolean {
  return sizeInBytes > LARGE_FILE_THRESHOLD;
}

/**
 * Get a human-readable file size string
 * @param sizeInBytes - File size in bytes
 * @returns Human-readable size string (e.g., "10.5 MB")
 */
export function formatFileSize(sizeInBytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
