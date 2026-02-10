/**
 * File utilities for the File Content Request Protocol
 *
 * Note: This file is used in browser (webview) context, so we avoid Node.js
 * built-ins like `path` module. All path operations use browser-safe implementations.
 */

/**
 * Large file threshold in bytes (10MB)
 */
export const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

/**
 * Browser-safe implementation of path.extname
 * Extracts the extension from a file path (including the dot)
 */
function getExtension(filePath: string): string {
  // Get the last segment (filename) after any slashes
  const lastSlash = Math.max(
    filePath.lastIndexOf('/'),
    filePath.lastIndexOf('\\'),
  );
  const filename = lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;

  // Find the last dot in the filename
  const lastDot = filename.lastIndexOf('.');

  // No dot, or dot is at the start (hidden file), or dot is at the end
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return '';
  }

  return filename.slice(lastDot);
}

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
  const ext = getExtension(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
}

/**
 * Check if a file path is within the workspace root
 * This prevents reading files outside the workspace (security measure)
 *
 * Note: This is a browser-safe implementation that handles common cases.
 * For full security, the extension host should do additional validation.
 *
 * @param workspaceRoot - The workspace root directory
 * @param filePath - The file path to check (must be absolute)
 * @returns true if the file is within the workspace
 */
export function isPathWithinWorkspace(
  workspaceRoot: string,
  filePath: string,
): boolean {
  // Normalize paths: ensure consistent separators and no trailing slashes
  const normalize = (p: string): string => {
    // Replace backslashes with forward slashes for consistency
    let normalized = p.replace(/\\/g, '/');
    // Remove trailing slashes
    while (normalized.endsWith('/') && normalized.length > 1) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  };

  // Simple resolution of . and .. components
  const resolvePath = (p: string): string => {
    const parts = normalize(p).split('/');
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '.' || part === '') {
        continue;
      } else if (part === '..') {
        resolved.pop(); // Go up one directory
      } else {
        resolved.push(part);
      }
    }

    // Preserve leading slash for absolute paths
    const prefix = p.startsWith('/') ? '/' : '';
    return prefix + resolved.join('/');
  };

  const normalizedWorkspace = resolvePath(workspaceRoot);
  const normalizedFile = resolvePath(filePath);

  // Check if the normalized file path starts with the workspace root
  // Add path separator to prevent matching partial directory names
  // e.g., /project vs /project-backup
  return (
    normalizedFile === normalizedWorkspace ||
    normalizedFile.startsWith(normalizedWorkspace + '/')
  );
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
