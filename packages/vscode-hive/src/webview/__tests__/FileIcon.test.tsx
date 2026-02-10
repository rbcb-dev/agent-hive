/**
 * Tests for FileIcon component
 *
 * Uses @vscode/codicons for file and folder icons with file-type mapping.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from './test-utils';
import { FileIcon } from '../components/FileIcon';

describe('FileIcon', () => {
  describe('directory icons', () => {
    it('renders folder icon for directories', () => {
      const { container } = render(
        <FileIcon filename="src" isDirectory={true} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-folder');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('file type mapping', () => {
    it('renders file-code icon for TypeScript files', () => {
      const { container } = render(
        <FileIcon filename="Button.tsx" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file-code');
    });

    it('renders file-code icon for JavaScript files', () => {
      const { container } = render(
        <FileIcon filename="index.js" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file-code');
    });

    it('renders file-code icon for Python files', () => {
      const { container } = render(
        <FileIcon filename="main.py" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file-code');
    });

    it('renders file-text icon for JSON files', () => {
      const { container } = render(
        <FileIcon filename="package.json" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file-text');
    });

    it('renders file-text icon for YAML files', () => {
      const { container } = render(
        <FileIcon filename="config.yml" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file-text');
    });

    it('renders markdown icon for markdown files', () => {
      const { container } = render(
        <FileIcon filename="README.md" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-markdown');
    });

    it('renders lock icon for lock files', () => {
      const { container } = render(
        <FileIcon filename="package-lock.json" isDirectory={false} />,
      );

      // Lock files use the lock extension, not json
      // Actually lock is the extension here, so we need to check this
      const { container: lockContainer } = render(
        <FileIcon filename="bun.lock" isDirectory={false} />,
      );
      const lockIcon = lockContainer.querySelector('.codicon');
      expect(lockIcon).toHaveClass('codicon-lock');
    });

    it('renders gear icon for env files', () => {
      const { container } = render(
        <FileIcon filename=".env" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-gear');
    });

    it('renders default file icon for unknown extensions', () => {
      const { container } = render(
        <FileIcon filename="data.xyz" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file');
    });

    it('renders default file icon for files without extension', () => {
      const { container } = render(
        <FileIcon filename="Makefile" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-file');
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase extensions', () => {
      const { container } = render(
        <FileIcon filename="README.MD" isDirectory={false} />,
      );

      const icon = container.querySelector('.codicon');
      expect(icon).toHaveClass('codicon-markdown');
    });
  });
});
