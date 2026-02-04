# Storybook MCP Integration - README

## Quick Links

- **Getting Started:** [STORYBOOK_QUICK_START.md](./STORYBOOK_QUICK_START.md)
- **Full Guide:** [STORYBOOK_INTEGRATION.md](./STORYBOOK_INTEGRATION.md)
- **Setup Summary:** [STORYBOOK_SETUP_COMPLETE.md](./STORYBOOK_SETUP_COMPLETE.md)
- **File Organization:** [STORYBOOK_FILES_MANIFEST.md](./STORYBOOK_FILES_MANIFEST.md)

## What Is This?

A complete **Storybook MCP (Model Context Protocol)** integration that enables AI agents to automatically create, test, and manage Storybook stories with modern best practices.

## In 60 Seconds

```bash
opencode --agent forager-worker
# Say: "Create Button.stories.tsx with Primary and Secondary variants"
# Result: Production-ready story file with tests ✨
```

## What's Included

### 1. Storybook Skill
**Location:** `.agents/skills/storybook-stories-expert/`

- **SKILL.md** (1,100 lines) - Complete Storybook reference
  - CSF3 format, ArgTypes, play functions, accessibility, documentation
  - Common patterns, mistakes, and solutions
  
- **AGENTS.md** (900 lines) - Agent-specific guidance
  - Workflows for Scout, Architect, Forager, Reviewer
  - Implementation patterns and testing strategies
  
- **EXAMPLE_BUTTON_STORY.tsx** (400 lines) - Working example
  - 14 story variants demonstrating all patterns

### 2. Auto-Load Configuration
**File:** `opencode.jsonc`

Skill is **automatically loaded** for all 5 Hive agents:
- hive-master (orchestrator)
- architect-planner (planning)
- forager-worker (implementation)
- scout-researcher (analysis)
- hygienic-reviewer (quality)

### 3. Integration Documentation
4 comprehensive guides (6,950 lines):
- STORYBOOK_INTEGRATION.md - System architecture
- STORYBOOK_SETUP_COMPLETE.md - Setup summary
- STORYBOOK_QUICK_START.md - Quick reference
- STORYBOOK_FILES_MANIFEST.md - File organization

## Key Features

✅ **Auto-Loaded** - No manual loading needed
✅ **Comprehensive** - 9,350+ lines of documentation
✅ **4-Level Testing** - Rendering → Interaction → Accessibility → E2E
✅ **Accessibility First** - a11y addon integration
✅ **Production Ready** - CSF3 + TypeScript + Modern Patterns
✅ **Multi-Agent** - All Hive agents supported

## Getting Started

### 1. Verify Setup (30 seconds)
```bash
# Check skill files exist
ls -la .agents/skills/storybook-stories-expert/

# Check agent configuration
grep "storybook-stories-expert" opencode.jsonc
```

### 2. Read Quick Start (5 minutes)
See [STORYBOOK_QUICK_START.md](./STORYBOOK_QUICK_START.md)

### 3. Create Your First Story
```bash
opencode --agent forager-worker
# Request: "Create Button.stories.tsx"
```

### 4. Explore Full Documentation
- Deep dive: [STORYBOOK_INTEGRATION.md](./STORYBOOK_INTEGRATION.md)
- Reference: `.agents/skills/storybook-stories-expert/SKILL.md`
- Example: `.agents/skills/storybook-stories-expert/EXAMPLE_BUTTON_STORY.tsx`

## What Agents Can Do

With storybook-stories-expert auto-loaded, agents can:

✓ Create `.stories.tsx` files with proper CSF3 structure
✓ Define ArgTypes with component prop controls
✓ Write story variants (Primary, Secondary, Disabled, Loading, Error)
✓ Implement play() functions with interaction tests
✓ Add accessibility testing with a11y addon
✓ Track callbacks with fn() actions
✓ Generate TypeScript-safe stories (satisfies Meta<>)
✓ Enable auto-documentation (Autodocs addon)
✓ Validate story quality
✓ Analyze existing stories for gaps
✓ Coordinate multi-agent workflows

## Documentation Roadmap

**For quick start:** [STORYBOOK_QUICK_START.md](./STORYBOOK_QUICK_START.md) (5 min)
→ 60-second overview, quick reference, learning path

**For implementation:** `.agents/skills/storybook-stories-expert/SKILL.md` (reference)
→ Every Storybook pattern, example, best practice

**For agent workflows:** `.agents/skills/storybook-stories-expert/AGENTS.md`
→ How each agent should work, implementation templates

**For system architecture:** [STORYBOOK_INTEGRATION.md](./STORYBOOK_INTEGRATION.md) (15 min)
→ How everything fits together, multi-agent workflows

**For project overview:** [STORYBOOK_SETUP_COMPLETE.md](./STORYBOOK_SETUP_COMPLETE.md)
→ What was created, configuration details, best practices

**For file organization:** [STORYBOOK_FILES_MANIFEST.md](./STORYBOOK_FILES_MANIFEST.md)
→ Where everything is, what each file does

## Example: Complete Workflow

```
User: "Create comprehensive Button stories with tests"

↓ Agent loads storybook-stories-expert skill automatically

↓ Multi-Agent Execution:
  1. Scout analyzes existing Button.tsx
  2. Architect plans story structure & variants
  3. Forager implements Button.stories.tsx
  4. Reviewer validates quality

↓ Result:
  ✓ CSF3 structure
  ✓ ArgTypes matching props
  ✓ 5+ story variants
  ✓ Play functions with tests
  ✓ Accessibility testing
  ✓ Complete documentation
```

## Key Concepts

### CSF3 (Component Story Format v3)
Modern Storybook format with TypeScript types and named exports

### ArgTypes
Define component props in controls panel with `control`, `options`, `description`

### Play Function
Interaction testing with userEvent, within(), and expect() assertions

### a11y Addon
Accessibility testing with keyboard navigation, focus management, ARIA attributes

### Autodocs
Auto-generated documentation from story metadata and JSDoc

## Quick Reference

### Common Commands

```bash
# Run stories locally
npm run storybook

# Run interaction tests
npm run test:storybook

# Build static Storybook
npm run build:storybook

# Test accessibility
npm run test:a11y
```

### File Structure

```
.agents/skills/storybook-stories-expert/
├── SKILL.md                    # Main reference
├── AGENTS.md                   # Agent guidance
└── EXAMPLE_BUTTON_STORY.tsx    # Copy-paste template

opencode.jsonc                  # Agent config (updated)

STORYBOOK_INTEGRATION.md        # System guide
STORYBOOK_QUICK_START.md        # Quick ref
etc.
```

### Story Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: { /* controls */ },
  args: { /* defaults */ },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { /* variant specific */ },
};

export const WithTest: Story = {
  args: { /* args */ },
  play: async ({ canvasElement }) => {
    // interaction testing
  },
};
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not loading | Check `.agents/skills/storybook-stories-expert/SKILL.md` exists |
| Agent doesn't use skill | Verify `autoLoadSkills` in `opencode.jsonc` |
| Play function fails | Use `within(canvasElement)` - see EXAMPLE_BUTTON_STORY.tsx |
| Elements not found | Use `getByRole` not `querySelector` - see SKILL.md |
| TypeScript errors | Use `satisfies Meta<typeof Component>` - see examples |

See [STORYBOOK_INTEGRATION.md](./STORYBOOK_INTEGRATION.md) for more troubleshooting.

## Next Steps

1. ✅ Verify setup works
2. 📖 Read [STORYBOOK_QUICK_START.md](./STORYBOOK_QUICK_START.md)
3. 🚀 Create your first story
4. 🤖 Use agents to scale

## Support

- **Quick Start:** [STORYBOOK_QUICK_START.md](./STORYBOOK_QUICK_START.md)
- **Full Guide:** [STORYBOOK_INTEGRATION.md](./STORYBOOK_INTEGRATION.md)
- **Reference:** `.agents/skills/storybook-stories-expert/SKILL.md`
- **Example:** `.agents/skills/storybook-stories-expert/EXAMPLE_BUTTON_STORY.tsx`

## Version

- **Setup Date:** 2025-01-30
- **Storybook Version:** 8.0.0+
- **Status:** ✅ Complete & Ready to Use
- **All Agents:** Supported

---

**Ready to create amazing Storybook stories with AI agents? Start now!**

```bash
opencode --agent forager-worker
# "Create [ComponentName].stories.tsx"
```

✨ The storybook-stories-expert skill is already loaded and ready to help!
