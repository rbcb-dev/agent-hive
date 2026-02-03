# Storybook MCP Integration & Skill Configuration

## Overview

This document explains how the Storybook Stories Expert skill integrates with OpenCode and the Hive agent system in the agent-hive repository.

### What is the Storybook Skill?

The `storybook-stories-expert` skill is a comprehensive guide for AI agents working on:
- Creating new Storybook stories (`.stories.ts` / `.stories.tsx` files)
- Writing interaction tests with play functions
- Configuring story arguments and controls
- Testing accessibility with a11y addons
- Setting up visual regression testing
- Documenting components via Autodocs

### Key Resources

- **SKILL.md**: Complete Storybook reference (1000+ lines)
  - Story structure and CSF3 format
  - Arguments, ArgTypes, Decorators, Parameters
  - Play function patterns and testing best practices
  - Accessibility testing (a11y)
  - Configuration and performance optimization
  - Common patterns and mistake/solution guide

- **AGENTS.md**: Agent-specific guidance (900+ lines)
  - Core agent responsibilities by type
  - Story creation workflow (Analysis → Outline → Implementation)
  - Testing strategies and interaction patterns
  - Configuration setup and CI/CD integration
  - Quality assurance checklist
  - Common scenarios and solutions

---

## Architecture

### Skill Location

```
.agents/skills/storybook-stories-expert/
├── SKILL.md           # Comprehensive Storybook reference
├── AGENTS.md          # Agent-specific guidance
└── [future: rules/]   # Individual rule patterns (optional)
```

### MCP Configuration

```
.opencode/mcp.json    # Storybook MCP definition
                      # - Capabilities: story generation, testing, validation
                      # - Tools: create_story, add_play_function, validate_story, etc.
                      # - Agent mapping: which agents use this MCP
```

### OpenCode Configuration

```
opencode.jsonc        # Agent autoLoad configuration
                      # - hive-master: auto-loads Storybook skill
                      # - architect-planner: auto-loads Storybook skill
                      # - forager-worker: auto-loads Storybook skill
                      # - scout-researcher: auto-loads Storybook skill
                      # - hygienic-reviewer: auto-loads Storybook skill
```

---

## Agent Responsibilities & Skill Injection

### Who Gets the Storybook Skill?

The `storybook-stories-expert` skill is injected into all Hive agents because story creation is a **multi-phase concern** requiring input from multiple agent types:

#### 1. **SCOUT-RESEARCHER** (Read-Only Analysis)
**When autoLoaded:** Session start (unconditional)

**Why Storybook skill?** Scout analyzes existing stories to:
- Discover story patterns and naming conventions
- Identify component props and interaction patterns
- Map existing test coverage and accessibility features
- Report gaps in story hierarchy or test coverage

**Example tasks:**
```
Scout: Analyze src/**/*.stories.ts for:
  - Current story structure (CSF3 vs CSF2)
  - PlayFunction test coverage %
  - Accessibility tag usage %
  - Common prop patterns
  - Missing story variants
```

**Output:** Pattern report and coverage analysis

---

#### 2. **ARCHITECT-PLANNER** (Strategy & Design)
**When autoLoaded:** Session start (unconditional)

**Why Storybook skill?** Architect plans:
- Story hierarchy and naming conventions
- Which story variants are needed (Primary, Secondary, Disabled, Error, etc.)
- Testing strategy (what to test in play functions)
- Accessibility requirements per component
- Documentation scope

**Example tasks:**
```
Architect: Plan stories for Button component:
  - Story hierarchy: Components/Inputs/Button
  - Variants needed: Primary, Secondary, Disabled, Loading, Error
  - Test strategy:
    * Primary: render test only
    * Disabled: verify click disabled in play()
    * Error: accessibility focus order test
  - Accessibility: WCAG AA compliance
  - Docs: auto-docs from Autodocs addon
```

**Output:** Detailed story plan with variants, test matrix, and accessibility checklist

---

#### 3. **FORAGER-WORKER** (Story Implementation)
**When autoLoaded:** Session start + task delegation

**Why Storybook skill?** Forager creates:
- New story files with proper CSF3 structure
- Story variants with appropriate ArgTypes
- Play functions with userEvent + expect assertions
- Accessibility testing with a11y addon
- TypeScript types and SatisfiesMeta validation
- Documentation via markdown description

**Example tasks:**
```
Forager: Implement Button.stories.tsx
  - Create default meta with title, component, tags, argTypes
  - Add 5 story variants:
    * Primary: basic render
    * Secondary: variant change
    * Disabled: state testing + play()
    * Loading: async state + waitFor()
    * Error: error state + recovery
  - Each play() uses userEvent + within() + expect()
  - TypeScript strict (satisfies Meta<typeof Button>)
  - Autodocs enabled (tags: ['autodocs'])
```

**Output:** Complete story file with tests and documentation

---

#### 4. **HYGIENIC-REVIEWER** (Quality Validation)
**When autoLoaded:** Before completing task

**Why Storybook skill?** Reviewer validates:
- Story naming convention compliance
- ArgTypes match component props (TypeScript)
- Play functions use correct patterns (userEvent, within, expect)
- Accessibility tags present and appropriate
- Documentation complete and accurate
- No hardcoded test data
- All assertions present in play functions

**Example validation:**
```
Reviewer: Validate Button.stories.tsx
  ✅ Title format: Components/Inputs/Button
  ✅ Args match Button.props type
  ✅ 5+ story variants
  ✅ Play functions use userEvent + within() + expect()
  ✅ Accessibility testing with a11y tag
  ✅ No TypeScript errors
  ✅ No hardcoded test data
  ✅ Documentation complete
  APPROVED
```

**Output:** Pass/Fail with specific feedback on quality

---

### Skill Injection Configuration

#### In OpenCode Config (opencode.jsonc)

```jsonc
{
  "agent": {
    // Hybrid planner/orchestrator
    "hive-master": {
      "model": "github-copilot/claude-opus-4.5",
      "autoLoadSkills": [
        "storybook-stories-expert",      // 🎯 Injected here
        "vercel-react-best-practices",
        "vercel-composition-patterns"
      ]
    },

    // Pure planning agent
    "architect-planner": {
      "model": "github-copilot/gpt-5.2-codex",
      "autoLoadSkills": [
        "storybook-stories-expert"       // 🎯 Injected here
      ]
    },

    // Code execution specialist
    "forager-worker": {
      "model": "github-copilot/claude-opus-4.5",
      "autoLoadSkills": [
        "storybook-stories-expert",      // 🎯 Injected here
        "test-driven-development",
        "verification-before-completion"
      ]
    },

    // Code exploration specialist
    "scout-researcher": {
      "model": "github-copilot/gpt-5.2-codex",
      "autoLoadSkills": [
        "storybook-stories-expert"       // 🎯 Injected here
      ]
    },

    // Quality validation specialist
    "hygienic-reviewer": {
      "model": "github-copilot/gpt-5.2-codex",
      "autoLoadSkills": [
        "storybook-stories-expert"       // 🎯 Injected here
      ]
    }
  }
}
```

#### How autoLoadSkills Works

1. **Skill Discovery**: OpenCode searches for skill files in this order:
   - Hive builtin skills (bundled with opencode-hive)
   - Project OpenCode: `.opencode/skills/<skill-id>/SKILL.md` ← **We put it here**
   - Global OpenCode: `~/.config/opencode/skills/<id>/SKILL.md`
   - Project Claude: `.claude/skills/<id>/SKILL.md`
   - Global Claude: `~/.claude/skills/<id>/SKILL.md`

2. **Skill Injection**: At session start, OpenCode:
   - Loads SKILL.md + AGENTS.md for each skill in `autoLoadSkills`
   - Injects skill context into agent system prompt
   - Skill remains available throughout session (read-only)
   - Agent can reference skill by name in reasoning

3. **Graceful Degradation**: If skill not found:
   - Logs warning
   - Continues startup (no fatal error)
   - Agent works without skill context

---

## Workflow: How Storybook Skill Is Used

### Typical Story Creation Workflow

```
User Request:
  "Create comprehensive stories for the Button component"

↓

[PLANNING PHASE] (with autoLoadSkills)
┌─────────────────────────────────────────────────────┐
│ hive-master (orchestrator) with skills:             │
│  • storybook-stories-expert                         │
│  • vercel-react-best-practices                      │
│  • vercel-composition-patterns                      │
│                                                     │
│ Decision: Complex story task → spawn agents         │
└─────────────────────────────────────────────────────┘

↓

[RESEARCH PHASE]
┌─────────────────────────────────────────────────────┐
│ scout-researcher with skill:                        │
│  • storybook-stories-expert ← Auto-loaded           │
│                                                     │
│ Tasks:                                              │
│  1. Analyze Button.tsx props & types               │
│  2. Find existing Button.stories.tsx               │
│  3. Report current story coverage                  │
│  4. Identify test gaps                             │
│                                                     │
│ Output → Attached to plan                          │
└─────────────────────────────────────────────────────┘

↓

[PLANNING PHASE]
┌─────────────────────────────────────────────────────┐
│ architect-planner with skill:                       │
│  • storybook-stories-expert ← Auto-loaded           │
│                                                     │
│ Uses skill to plan:                                │
│  1. Story hierarchy & naming                       │
│  2. Variants matrix (Primary, Secondary, etc.)     │
│  3. Play function test strategy                    │
│  4. Accessibility coverage plan                    │
│  5. Documentation scope                            │
│                                                     │
│ Output → .hive/features/button-stories/plan.md    │
└─────────────────────────────────────────────────────┘

↓

[USER REVIEW GATE]
  User approves plan in VS Code extension

↓

[EXECUTION PHASE]
┌─────────────────────────────────────────────────────┐
│ forager-worker with skills:                        │
│  • storybook-stories-expert ← Auto-loaded           │
│  • test-driven-development                         │
│  • verification-before-completion                  │
│                                                     │
│ Task: Implement stories following plan              │
│                                                     │
│ Using storybook-stories-expert to:                 │
│  1. Create proper CSF3 structure                   │
│  2. Define ArgTypes matching props                 │
│  3. Implement play() functions with patterns       │
│  4. Add accessibility testing                      │
│  5. Verify TypeScript types                        │
│                                                     │
│ Output → src/components/Button.stories.tsx         │
└─────────────────────────────────────────────────────┘

↓

[VERIFICATION PHASE]
┌─────────────────────────────────────────────────────┐
│ hygienic-reviewer with skill:                       │
│  • storybook-stories-expert ← Auto-loaded           │
│                                                     │
│ Quality checks using skill:                        │
│  1. Story naming convention                        │
│  2. ArgTypes match component props                 │
│  3. Play functions use correct patterns            │
│  4. Accessibility tags present                     │
│  5. Documentation complete                         │
│  6. TypeScript validation                          │
│                                                     │
│ Output → APPROVED / REJECTED with feedback         │
└─────────────────────────────────────────────────────┘

↓

[TESTING & COMPLETION]
  npm run test:storybook       # Run all play() tests
  npm run build:storybook      # Verify no build errors
  
  If all pass → Task complete ✅
  If failures → Send to forager to fix
```

---

## Configuration Details

### MCP Configuration (.opencode/mcp.json)

```json
{
  "mcps": {
    "storybook": {
      "name": "storybook-stories-expert",
      "description": "Comprehensive MCP for Storybook story creation, testing, and documentation management",
      "version": "8.0.0",
      "enabled": true,
      
      "capabilities": {
        "story_generation": { "enabled": true },
        "interaction_testing": { "enabled": true },
        "accessibility_testing": { "enabled": true },
        "story_analysis": { "enabled": true },
        "configuration_management": { "enabled": true }
      },
      
      "tools": {
        "create_story": { /* ... */ },
        "add_play_function": { /* ... */ },
        "validate_story": { /* ... */ },
        "analyze_stories": { /* ... */ },
        "configure_storybook": { /* ... */ }
      },
      
      "agents": {
        "scout_researcher": { "enabled": true },
        "architect_planner": { "enabled": true },
        "forager_worker": { "enabled": true },
        "hygienic_reviewer": { "enabled": true }
      }
    }
  }
}
```

### OpenCode Configuration (opencode.jsonc)

**Location:** `/home/dev/repos/github/agent-hive/opencode.jsonc`

**Storybook Skill Injection Points:**

```jsonc
{
  "agent": {
    "hive-master": {
      "autoLoadSkills": [
        "storybook-stories-expert",      // NEW
        "vercel-react-best-practices",
        "vercel-composition-patterns"
      ]
    },
    "architect-planner": {
      "autoLoadSkills": [
        "storybook-stories-expert"       // NEW
      ]
    },
    "forager-worker": {
      "autoLoadSkills": [
        "storybook-stories-expert",      // NEW
        "test-driven-development",
        "verification-before-completion"
      ]
    },
    "scout-researcher": {
      "autoLoadSkills": [
        "storybook-stories-expert"       // NEW
      ]
    },
    "hygienic-reviewer": {
      "autoLoadSkills": [
        "storybook-stories-expert"       // NEW
      ]
    }
  }
}
```

---

## Skill Location & Discovery

### Directory Structure

```
agent-hive/
├── .agents/
│   └── skills/
│       └── storybook-stories-expert/   ← Skill location
│           ├── SKILL.md                ← Main reference (1000+ lines)
│           ├── AGENTS.md               ← Agent guidance (900+ lines)
│           └── rules/                  ← Future: individual rule files
│
├── .opencode/
│   ├── mcp.json                        ← MCP configuration
│   └── skills/                         ← OpenCode skill search path
│       └── [optional: symlink or copies]
│
└── opencode.jsonc                      ← Agent autoLoad config
```

### Skill Discovery Process

When `opencode` starts with `autoLoadSkills: ["storybook-stories-expert"]`:

1. **Check Hive builtin skills**: Does opencode-hive bundle this? (No)
2. **Check project OpenCode**: `.opencode/skills/storybook-stories-expert/SKILL.md`? (Could be)
3. **Check global OpenCode**: `~/.config/opencode/skills/storybook-stories-expert/SKILL.md`? (No)
4. **Check project Claude**: `.claude/skills/storybook-stories-expert/SKILL.md`? (No)
5. **Check global Claude**: `~/.claude/skills/storybook-stories-expert/SKILL.md`? (No)

✅ **Found** in: `.agents/skills/storybook-stories-expert/SKILL.md`

### Skill Priority (First Match Wins)

1. **Hive builtin** (bundled with opencode-hive) — Highest priority
2. **Project OpenCode** `.opencode/skills/...` — Project-specific
3. **Global OpenCode** `~/.config/opencode/skills/...` — User-wide
4. **Project Claude** `.claude/skills/...` — Legacy/Claude-specific
5. **Global Claude** `~/.claude/skills/...` — Legacy/Claude-specific

---

## Best Practices

### When to Use autoLoadSkills

**Use autoLoadSkills for:**
- ✅ Skills relevant to **all agents** in this repository
- ✅ Skills needed **unconditionally** at session start
- ✅ Cross-cutting concerns (accessibility, performance, testing)

**Examples:**
- `storybook-stories-expert` (story creation concerns all agents)
- `test-driven-development` (testing concerns all agents)
- `verification-before-completion` (QA concerns all agents)

### When NOT to Use autoLoadSkills

**Skip autoLoadSkills for:**
- ❌ Task-specific skills (load manually with `hive_skill()`)
- ❌ Heavy skills (large context cost)
- ❌ Rarely-used skills

**Example:** "React Native" skill only autoLoad if most work is React Native

### Managing Skill Load

**Control memory footprint:**

```jsonc
{
  "agent": {
    "forager-worker": {
      // Explicitly choose which skills to auto-load
      "autoLoadSkills": [
        "storybook-stories-expert",      // Story creation
        "test-driven-development",        // Testing approach
        "verification-before-completion"  // QA validation
      ],
      
      // OPTIONAL: disable default skills if needed
      "disableSkills": [
        "some-default-skill"
      ]
    }
  }
}
```

---

## Testing the Integration

### Verify Skill is Discovered

```bash
# Start OpenCode with logging
opencode --agent scout-researcher --verbose

# Look for in logs:
# ✓ Loading skill: storybook-stories-expert
# ✓ Found at: .agents/skills/storybook-stories-expert/SKILL.md
```

### Verify Skill is Injected

```bash
# In OpenCode conversation, ask agent:
# "What skills are available to you?"

# Expected: Agent lists storybook-stories-expert among available skills
```

### Run a Simple Story Task

```bash
# In OpenCode:
opencode --agent forager-worker

# Request:
# "Create a simple Button.stories.tsx with 3 variants"

# Expected:
# - Agent references storybook-stories-expert skill
# - Creates proper CSF3 structure
# - Uses skill patterns for play functions
# - Mentions ArgTypes, decorators, interactions
```

---

## Troubleshooting

### Skill Not Loading

**Symptom:** Warning "Skill not found: storybook-stories-expert"

**Causes:**
1. SKILL.md not in correct location
2. Wrong directory structure

**Fixes:**
```bash
# Verify directory exists:
ls -la .agents/skills/storybook-stories-expert/

# Should exist:
# SKILL.md
# AGENTS.md

# If missing, create the directory:
mkdir -p .agents/skills/storybook-stories-expert/
```

### Skill Loaded But Not Used

**Symptom:** Agent doesn't reference skill patterns

**Causes:**
1. autoLoadSkills misconfigured
2. SKILL.md content not loaded properly
3. Agent not receiving skill context

**Fixes:**
```jsonc
// Verify in opencode.jsonc:
"forager-worker": {
  "autoLoadSkills": ["storybook-stories-expert"]  // ← Must be present
}

// Restart OpenCode:
# Exit current session (Ctrl+C)
# Start new session:
opencode --agent forager-worker
```

### Context Window Too Large

**Symptom:** "Context limit exceeded" errors

**Causes:**
1. Too many autoLoadSkills per agent
2. Skill files too large

**Fixes:**
```jsonc
// Reduce autoLoadSkills count:
"forager-worker": {
  "autoLoadSkills": [
    "storybook-stories-expert"  // Just this for stories
    // Remove others if not needed for this task
  ]
}

// Or use manual loading instead:
// In conversation:
// "/skill storybook-stories-expert"
```

---

## Future Enhancements

### Planned Improvements

1. **Individual Rule Files** (rules/ directory)
   - `rules/csf3-specification.md`
   - `rules/play-function-patterns.md`
   - `rules/accessibility-checklist.md`
   - Allows agents to load only needed rules

2. **Story Templates** (templates/ directory)
   - Pre-made story templates for common patterns
   - Button, Form, Modal, Async Loading, Error states

3. **Storybook Config Templates** (config/ directory)
   - main.ts boilerplate
   - preview.ts with best practices
   - Addon configuration recipes

4. **Real-World Examples** (examples/ directory)
   - Complete story implementations
   - Common component patterns
   - Test coverage examples

### Current Limitations

- ⚠️ No individual rule loading (all-or-nothing injection)
- ⚠️ No template library (agents must generate from scratch)
- ⚠️ AGENTS.md context large (~900 lines)

---

## References

### External Docs

- [Storybook Docs](https://storybook.js.org/docs)
- [Storybook API](https://storybook.js.org/docs/api)
- [Testing Library](https://testing-library.com/docs/queries/about)
- [OpenCode Configuration](https://opencode.ai/docs/config)

### Internal Docs

- `.agents/skills/storybook-stories-expert/SKILL.md` — Main reference
- `.agents/skills/storybook-stories-expert/AGENTS.md` — Agent guidance
- `.opencode/mcp.json` — MCP capabilities
- `opencode.jsonc` — Agent autoLoad config

### Related Skills

- `vercel-react-best-practices` — React optimization patterns
- `vercel-composition-patterns` — Component composition patterns
- `test-driven-development` — Testing methodology
- `verification-before-completion` — Quality assurance

---

## Summary

The Storybook Stories Expert skill is now fully integrated into the agent-hive repository:

✅ **Skill Created** (SKILL.md + AGENTS.md)
✅ **MCP Configured** (.opencode/mcp.json)
✅ **AutoLoad Configured** (opencode.jsonc for all agents)
✅ **Agent Mapping** (scout, architect, forager, reviewer all get skill)
✅ **Documentation** (this file + skill files)

**Quick Start:**

```bash
# Start creating stories
opencode --agent forager-worker

# Request:
# "Create Button.stories.tsx with Primary, Secondary, and Disabled variants"

# Agent will use storybook-stories-expert skill automatically ✨
```
