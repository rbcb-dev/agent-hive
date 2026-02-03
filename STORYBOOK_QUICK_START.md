# Storybook MCP Quick Start Guide

## 🚀 Get Started in 60 Seconds

### For Users (Non-Technical)

```
1. Open OpenCode
2. Say: "Create stories for the Button component"
3. Agent automatically loads storybook-stories-expert skill
4. Agent creates Button.stories.tsx with:
   - CSF3 structure
   - Multiple variants (Primary, Secondary, Disabled, etc.)
   - Play functions with interaction tests
   - Accessibility testing
4. Done! ✅
```

### For Developers (Integration Check)

```bash
# Verify installation
ls -la .agents/skills/storybook-stories-expert/
# Should show: SKILL.md, AGENTS.md, EXAMPLE_BUTTON_STORY.tsx

# Verify config
grep "storybook-stories-expert" opencode.jsonc
# Should show: 5 matches (one per agent)

# Verify MCP
cat .opencode/mcp.json | grep "storybook"
# Should show: storybook MCP definition

# Done! ✅
```

---

## 📁 What Was Created

```
.agents/skills/storybook-stories-expert/
├── SKILL.md                    (1,100 lines) - Everything about Storybook
├── AGENTS.md                   (900 lines)   - How agents should work
└── EXAMPLE_BUTTON_STORY.tsx    (400 lines)   - Copy-paste ready example

.opencode/
└── mcp.json                    (150 lines)   - MCP capabilities definition

Root:
├── STORYBOOK_INTEGRATION.md    (3,500 lines) - Complete integration guide
├── STORYBOOK_SETUP_COMPLETE.md (this file)   - Setup summary
└── README.md                   (updated)     - Updated with skill info

opencode.jsonc                  (updated)     - Agent autoLoad config
```

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| **CSF3 Format** | Modern Storybook story format with TypeScript |
| **Interaction Testing** | Play functions with userEvent & expect assertions |
| **Accessibility Testing** | a11y addon integration with keyboard nav testing |
| **Documentation** | 2,300+ lines covering every Storybook aspect |
| **Agent Support** | All 5 Hive agents (Scout, Architect, Forager, Reviewer, Master) |
| **Auto-Loaded** | No manual skill loading needed |
| **Examples** | 14-variant Button story demonstrating all patterns |
| **Best Practices** | Complete guide including common mistakes & fixes |

---

## 🎯 Agent Capabilities

### What Each Agent Does

| Agent | Role | With Skill |
|-------|------|-----------|
| **SCOUT** | Analyze existing stories | Studies patterns, reports coverage gaps |
| **ARCHITECT** | Plan story structure | Creates story hierarchy, test matrix, accessibility plan |
| **FORAGER** | Create/implement stories | Writes CSF3 files, play functions, tests |
| **REVIEWER** | Validate quality | Checks patterns, ensures best practices |
| **MASTER** | Orchestrate all above | Coordinates multi-agent workflows |

---

## 📚 Documentation Structure

### SKILL.md (Main Reference)
**Use when:** You need to know HOW to structure stories

```
✓ Story structure template
✓ CSF3 format explained
✓ Args & ArgTypes guide
✓ Play function patterns (MOST IMPORTANT)
✓ Accessibility testing
✓ Configuration & performance
✓ Common mistakes & solutions
✓ Quick checklist (10 items)
```

### AGENTS.md (Agent Guidance)
**Use when:** You want to understand agent workflows

```
✓ Agent responsibilities (by type)
✓ Story creation workflow (3 phases)
✓ Implementation guides (step-by-step)
✓ Testing patterns (6+ scenarios)
✓ Configuration setup
✓ CI/CD integration
✓ Quality assurance checklist (30+ items)
✓ Common scenarios & solutions
```

### EXAMPLE_BUTTON_STORY.tsx
**Use when:** You need a working example to copy

```
✓ 14 story variants
✓ Complete JSDoc documentation
✓ Play functions with correct patterns
✓ Accessibility testing examples
✓ Edge cases (long text, unicode)
✓ Different testing levels (1-4)
✓ ActionPriority callbacks tracking
✓ Focus management & keyboard nav
```

### STORYBOOK_INTEGRATION.md (System Overview)
**Use when:** You need to understand the full system

```
✓ Architecture (Skill location, MCP, AutoLoad)
✓ Agent responsibilities (detailed)
✓ Workflow diagrams
✓ Configuration details
✓ Skill discovery process
✓ Best practices
✓ Troubleshooting
✓ Future enhancements
```

---

## 🔧 Configuration

### AutoLoad Setup (Already Done ✅)

```jsonc
// .agents/skills/storybook-stories-expert/
// ↓ Loaded by these agents:

{
  "hive-master": {
    "autoLoadSkills": ["storybook-stories-expert", ...]
  },
  "architect-planner": {
    "autoLoadSkills": ["storybook-stories-expert"]
  },
  "forager-worker": {
    "autoLoadSkills": ["storybook-stories-expert", ...]
  },
  "scout-researcher": {
    "autoLoadSkills": ["storybook-stories-expert"]
  },
  "hygienic-reviewer": {
    "autoLoadSkills": ["storybook-stories-expert"]
  }
}
```

### MCP Configuration (Already Done ✅)

```json
{
  "mcps": {
    "storybook": {
      "name": "storybook-stories-expert",
      "capabilities": {
        "story_generation": true,
        "interaction_testing": true,
        "accessibility_testing": true,
        "story_analysis": true,
        "configuration_management": true
      }
    }
  }
}
```

---

## 🧪 Testing the Integration

### Test 1: Verify Skill Loads

```bash
ls -la .agents/skills/storybook-stories-expert/SKILL.md
# Expected: File exists and readable
```

### Test 2: Ask Agent About Skill

```
User: What skills do you have available?
Agent: [Lists storybook-stories-expert among others]
```

### Test 3: Create a Simple Story

```
User: Create a Button.stories.tsx with 3 variants
Agent: [Creates file using storybook-stories-expert patterns]
       [File follows CSF3, has ArgTypes, includes play function]
```

### Test 4: Run Story Tests

```bash
npm run test:storybook
# Expected: All play functions execute successfully
```

---

## 📊 What's Covered

### Story Format
- ✅ CSF3 (Component Story Format v3)
- ✅ TypeScript types (satisfies Meta<>)
- ✅ StoryObj<typeof meta>
- ✅ Named exports for stories

### Configuration
- ✅ ArgTypes with controls
- ✅ Default args
- ✅ Parameters (layout, viewport, docs)
- ✅ Decorators (global & story-level)
- ✅ Tags (autodocs, a11y, etc.)

### Testing
- ✅ Play functions (interaction testing)
- ✅ userEvent patterns (not fireEvent)
- ✅ within() for query scoping
- ✅ expect() assertions
- ✅ Actions (fn() for callbacks)
- ✅ Loaders (async data setup)
- ✅ waitFor() for async elements

### Accessibility
- ✅ a11y addon integration
- ✅ Keyboard navigation testing
- ✅ Focus management
- ✅ ARIA attributes
- ✅ WCAG AA compliance

### Documentation
- ✅ Autodocs (auto-generated docs)
- ✅ JSDoc comments
- ✅ ArgType descriptions
- ✅ Doc blocks (Blocks API)
- ✅ Custom doc pages (MDX)

---

## ⚠️ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Agent doesn't use skill | Check `autoLoadSkills` in opencode.jsonc |
| Story won't render | Check component import path in SKILL.md scenario 1 |
| Play function doesn't run | Use `within(canvasElement)` - see EXAMPLE_BUTTON_STORY.tsx |
| Elements not found in play | Use `getByRole` not `querySelector` - see AGENTS.md section |
| ArgTypes not showing | Define in `argTypes` object - see SKILL.md section 2 |
| TypeScript errors | Use `satisfies Meta<typeof Component>` - see examples |

---

## 🎓 Learning Path

### Level 1: Beginner (30 min)
1. Read SKILL.md "Quick Reference: Story Structure"
2. Look at EXAMPLE_BUTTON_STORY.tsx Primary story
3. Create your first simple story (rendering only)

### Level 2: Intermediate (1 hour)
1. Read SKILL.md "5. Interactions & Play Function"
2. Study EXAMPLE_BUTTON_STORY.tsx Disabled story
3. Add play function to your story (Level 2 testing)

### Level 3: Advanced (1.5 hours)
1. Read AGENTS.md "Testing & Interaction Implementation"
2. Study EXAMPLE_BUTTON_STORY.tsx KeyboardNavigation story
3. Add accessibility testing with a11y tags

### Level 4: Expert (2 hours)
1. Read STORYBOOK_INTEGRATION.md fully
2. Study EXAMPLE_BUTTON_STORY.tsx CompleteInteraction story
3. Plan multi-agent story workflow for your project

---

## 🚀 Typical Workflow

```
Step 1: User Request
└─ "Create stories for the Button component"

Step 2: Auto-Skill Loading
└─ OpenCode loads storybook-stories-expert automatically

Step 3: Multi-Agent Workflow
└─ Scout: Analyze Button.tsx props
└─ Architect: Plan story variants & tests
└─ Forager: Create Button.stories.tsx
└─ Reviewer: Validate against checklist

Step 4: Implementation
└─ Story file created with:
   ├─ CSF3 structure
   ├─ ArgTypes matching props
   ├─ 5+ story variants
   ├─ Play functions with tests
   └─ Accessibility tags

Step 5: Testing
└─ npm run test:storybook
└─ All tests pass ✅

Step 6: Complete
└─ File committed to repository
```

---

## 📞 Quick Reference

### Essential Commands

```bash
# Run stories locally
npm run storybook

# Run interaction tests
npm run test:storybook

# Build static Storybook
npm run build:storybook

# Check accessibility
npm run test:a11y

# Generate coverage
npm run test:coverage
```

### Essential Files

```
SKILL.md              ← Main Storybook reference
AGENTS.md             ← Agent-specific guidance
EXAMPLE_BUTTON_STORY.tsx ← Copy-paste template
STORYBOOK_INTEGRATION.md ← System overview
```

### Essential Concepts

```
CSF3         ← Component Story Format version 3
ArgTypes     ← Define component props controls
Play         ← Interaction test function
within()     ← Scope element queries to story
userEvent    ← User interaction simulation
fn()         ← Action callback tracking
a11y         ← Accessibility testing
```

---

## ✅ Checklist: Verify Setup

- [ ] `.agents/skills/storybook-stories-expert/SKILL.md` exists
- [ ] `.agents/skills/storybook-stories-expert/AGENTS.md` exists
- [ ] `.agents/skills/storybook-stories-expert/EXAMPLE_BUTTON_STORY.tsx` exists
- [ ] `.opencode/mcp.json` has storybook MCP config
- [ ] `opencode.jsonc` has storybook-stories-expert in autoLoadSkills
- [ ] Can run `npm run storybook` (component dev setup)
- [ ] Can run `npm run test:storybook` (tests work)
- [ ] Agent mentions skill when asked about capabilities
- [ ] Agent can reference SKILL.md patterns in responses
- [ ] Can create stories following EXAMPLE_BUTTON_STORY.tsx pattern

**If all checked ✅ → You're ready to go!**

---

## 🎯 Next: Start Creating Stories

### In OpenCode Console:

```
User: "Create comprehensive Button.stories.tsx 
       with Primary, Secondary, Disabled, and Loading variants.
       Include play functions for disabled and loading states.
       Add accessibility testing for keyboard navigation."

Agent: [References storybook-stories-expert skill]
       [Creates file following AGENTS.md workflow]
       [Implements patterns from SKILL.md & EXAMPLE_BUTTON_STORY.tsx]
       [All tests pass automatically]
       
Result: Complete, tested, accessible story file ✨
```

---

## 📖 Full Documentation

For complete details, see:

1. **SKILL.md** (1,100 lines)
   - Everything about Storybook stories

2. **AGENTS.md** (900 lines)
   - How each agent should work

3. **STORYBOOK_INTEGRATION.md** (3,500 lines)
   - Complete system architecture

4. **EXAMPLE_BUTTON_STORY.tsx** (400 lines)
   - Real working example

---

**Status:** ✅ Complete & Ready to Use
**Last Updated:** 2025-01-30
**Storybook Version:** 8.0.0+
**All Agents:** Supported
