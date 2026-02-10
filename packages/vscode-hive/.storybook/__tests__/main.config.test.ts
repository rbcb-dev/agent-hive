import { describe, it, expect } from 'vitest';
import config from '../main.js';

describe('Storybook main config', () => {
  it('registers @storybook/addon-docs in addons array', () => {
    expect(config.addons).toBeDefined();
    expect(config.addons).toContain('@storybook/addon-docs');
  });

  it('preserves @storybook/addon-a11y addon', () => {
    expect(config.addons).toContain('@storybook/addon-a11y');
  });

  it('preserves storybook/viewport addon', () => {
    expect(config.addons).toContain('storybook/viewport');
  });

  it('has docs configured', () => {
    expect(config.docs).toBeDefined();
    // autodocs may not be in the type but is set at runtime
    expect((config.docs as Record<string, unknown>)?.autodocs).toBe('tag');
  });

  it('uses react-vite framework', () => {
    expect(config.framework).toBeDefined();
    const framework = typeof config.framework === 'string'
      ? config.framework
      : config.framework?.name;
    expect(framework).toBe('@storybook/react-vite');
  });
});
