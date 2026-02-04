#!/usr/bin/env node
/**
 * Build script for Storybook development
 * 
 * This script:
 * 1. Builds the webview (TSX -> JS)
 * 2. Checks if hive-core needs rebuilding
 * 3. Rebuilds hive-core if necessary
 * 4. Then starts Storybook
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(color, label, message) {
  console.log(`${color}[${label}]${colors.reset} ${message}`);
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function fileIsNewer(file1, file2) {
  if (!fileExists(file1) || !fileExists(file2)) return true;
  try {
    const stat1 = fs.statSync(file1);
    const stat2 = fs.statSync(file2);
    return stat1.mtimeMs > stat2.mtimeMs;
  } catch {
    return true;
  }
}

async function main() {
  try {
    log(colors.blue, 'BUILD', 'Preparing Storybook environment...');
    
    const packageRoot = path.resolve(__dirname, '..');
    const hiveCoreRoot = path.resolve(packageRoot, '../hive-core');
    const webviewSrc = path.resolve(packageRoot, 'src/webview');
    const webviewDist = path.resolve(packageRoot, 'src/webview/__compiled__');
    
    // Check if webview needs building
    log(colors.yellow, 'CHECK', 'Checking webview sources...');
    
    const webviewSourceFiles = [
      path.join(webviewSrc, 'App.tsx'),
      path.join(webviewSrc, 'main.tsx'),
    ];
    
    const needsWebviewBuild = !fileExists(webviewDist) || 
      webviewSourceFiles.some(file => fileIsNewer(file, webviewDist));
    
    if (needsWebviewBuild) {
      log(colors.green, 'BUILD', 'Building webview...');
      execSync('npm run build:webview', { stdio: 'inherit', cwd: packageRoot, shell: true });
    } else {
      log(colors.green, 'SKIP', 'Webview already built');
    }
    
    // Check if hive-core needs building
    log(colors.yellow, 'CHECK', 'Checking hive-core sources...');
    
    const hiveCoreDistFile = path.join(hiveCoreRoot, 'dist/index.js');
    const hiveCoreSourceDir = path.join(hiveCoreRoot, 'src');
    
    let needsHiveCoreBuild = false;
    try {
      if (!fileExists(hiveCoreDistFile)) {
        needsHiveCoreBuild = true;
      } else if (fileExists(hiveCoreSourceDir)) {
        const files = fs.readdirSync(hiveCoreSourceDir);
        needsHiveCoreBuild = files.some(file => {
          const srcFile = path.join(hiveCoreSourceDir, file);
          return fileIsNewer(srcFile, hiveCoreDistFile);
        });
      }
    } catch (error) {
      // If we can't check, assume it needs building
      needsHiveCoreBuild = true;
    }
    
    if (needsHiveCoreBuild) {
      log(colors.green, 'BUILD', 'Building hive-core dependency...');
      try {
        // Use stdio: 'inherit' to show build output and avoid false error detection
        // execSync only throws if the command returns non-zero exit code
        execSync('npm run build', { cwd: hiveCoreRoot, shell: true, stdio: 'inherit' });
        log(colors.green, 'BUILD', 'hive-core built successfully');
      } catch (error) {
        // Build actually failed (non-zero exit code)
        if (fileExists(hiveCoreDistFile)) {
          log(colors.yellow, 'WARN', 'hive-core build had issues but output exists, continuing...');
        } else {
          log(colors.yellow, 'WARN', 'hive-core build failed, Storybook may have issues with hive-core imports');
        }
      }
    } else {
      log(colors.green, 'SKIP', 'hive-core already built');
    }
    
    log(colors.blue, 'READY', 'Environment prepared! Starting Storybook...\n');
    
    // Start Storybook
    execSync('npm run storybook:dev', { stdio: 'inherit', cwd: packageRoot, shell: true });
    
  } catch (error) {
    log(colors.red, 'ERROR', `Build failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  log(colors.red, 'ERROR', error.message);
  process.exit(1);
});
