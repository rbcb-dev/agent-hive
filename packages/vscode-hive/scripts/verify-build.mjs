#!/usr/bin/env node

/**
 * Verify VS Code Extension Build
 * 
 * This script validates that the extension has been built correctly:
 * 1. Extension JS file exists and is readable
 * 2. Webview files exist and are accessible
 * 3. CSS is bundled and contains required styles
 * 4. VSIX package is created successfully
 * 5. All assets are properly included
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(__dirname, '..');

const checks = [];
let failureCount = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    checks.push({ name, status: 'pass' });
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    checks.push({ name, status: 'fail', error: error.message });
    failureCount++;
  }
}

function fileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

function fileIsReadable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch {
    throw new Error(`File not readable: ${filePath}`);
  }
}

function fileSizeGreaterThan(filePath, minSize) {
  const size = fs.statSync(filePath).size;
  if (size < minSize) {
    throw new Error(`File too small: ${filePath} (${size} bytes, expected > ${minSize})`);
  }
}

function directoryExists(dirPath) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
}

function fileContains(filePath, searchString) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes(searchString)) {
    throw new Error(`File does not contain expected content: "${searchString}"`);
  }
}

console.log('\n🔍 Verifying VS Code Extension Build...\n');

// 1. Extension files
console.log('📦 Extension Binary:');
check('Extension JS file exists', () => {
  fileExists(path.join(PACKAGE_DIR, 'dist/extension.js'));
});
check('Extension JS is readable', () => {
  fileIsReadable(path.join(PACKAGE_DIR, 'dist/extension.js'));
});
check('Extension JS has reasonable size (>100KB)', () => {
  fileSizeGreaterThan(path.join(PACKAGE_DIR, 'dist/extension.js'), 100 * 1024);
});
check('Extension source map exists', () => {
  fileExists(path.join(PACKAGE_DIR, 'dist/extension.js.map'));
});

// 2. Webview files
console.log('\n📱 Webview Bundle:');
check('Webview dist directory exists', () => {
  directoryExists(path.join(PACKAGE_DIR, 'dist/webview'));
});
check('Webview index.html exists', () => {
  fileExists(path.join(PACKAGE_DIR, 'dist/webview/index.html'));
});
check('Webview HTML contains React root', () => {
  fileContains(path.join(PACKAGE_DIR, 'dist/webview/index.html'), 'root');
});

// 3. Webview assets
console.log('\n🎨 Webview Assets:');
check('Assets directory exists', () => {
  directoryExists(path.join(PACKAGE_DIR, 'dist/webview/assets'));
});
check('CSS bundle exists', () => {
  fileExists(path.join(PACKAGE_DIR, 'dist/webview/assets/index.css'));
});
check('CSS has reasonable size (>1KB)', () => {
  fileSizeGreaterThan(path.join(PACKAGE_DIR, 'dist/webview/assets/index.css'), 1 * 1024);
});
check('CSS contains review styles', () => {
  fileContains(path.join(PACKAGE_DIR, 'dist/webview/assets/index.css'), 'hive-review');
});
check('JavaScript bundle exists', () => {
  fileExists(path.join(PACKAGE_DIR, 'dist/webview/assets/index.js'));
});
check('JavaScript has reasonable size (>50KB)', () => {
  fileSizeGreaterThan(path.join(PACKAGE_DIR, 'dist/webview/assets/index.js'), 50 * 1024);
});

// 4. VSIX package
console.log('\n📦 VSIX Package:');
check('VSIX file exists', () => {
  fileExists(path.join(PACKAGE_DIR, 'vscode-hive.vsix'));
});
check('VSIX has reasonable size (>100KB)', () => {
  fileSizeGreaterThan(path.join(PACKAGE_DIR, 'vscode-hive.vsix'), 100 * 1024);
});

// 5. Asset references in HTML
console.log('\n🔗 Asset References:');
check('HTML references webview assets correctly', () => {
  const html = fs.readFileSync(path.join(PACKAGE_DIR, 'dist/webview/index.html'), 'utf-8');
  if (!html.includes('assets/') && !html.includes('./assets/')) {
    throw new Error('HTML does not reference assets directory');
  }
});

// 6. File integrity
console.log('\n✔️  File Integrity:');
check('No dist files are empty', () => {
  const files = [
    'dist/extension.js',
    'dist/webview/index.html',
    'dist/webview/assets/index.css',
    'dist/webview/assets/index.js'
  ];
  files.forEach(file => {
    const filePath = path.join(PACKAGE_DIR, file);
    const size = fs.statSync(filePath).size;
    if (size === 0) {
      throw new Error(`Empty file: ${file}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`Summary: ${checks.length - failureCount}/${checks.length} checks passed`);

if (failureCount > 0) {
  console.log(`\n❌ Build verification FAILED (${failureCount} issue${failureCount > 1 ? 's' : ''})`);
  console.log('\nFailed checks:');
  checks
    .filter(c => c.status === 'fail')
    .forEach(c => console.log(`  • ${c.name}: ${c.error}`));
  process.exit(1);
} else {
  console.log('\n✅ Build verification PASSED - Ready for testing!');
  console.log('\nNext steps:');
  console.log('  1. Install extension: code --install-extension vscode-hive.vsix');
  console.log('  2. Reload VS Code window');
  console.log('  3. Open a workspace with .hive directory');
  console.log('  4. Test: Cmd/Ctrl+Shift+P → "Hive: Open Review"');
  process.exit(0);
}
