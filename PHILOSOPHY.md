# Hive Philosophy

> Living documentation tracking how Hive thinks about vibe coding problems.
> This evolves as we learn.

---

## Built on Battle-Tested Principles

Hive's design is grounded in proven practices from the AI coding community, particularly [Boris Cherny's 13 Pro Tips for Claude Code](https://www.anthropic.com/research/claude-code-best-practices).

| Boris's Tip | Hive Implementation |
|-------------|---------------------|
| **Tip 4: Team CLAUDE.md** | Context persists per-feature in `.hive/context/` |
| **Tip 6: Start in Plan mode** | Plan → Approve → Execute workflow |
| **Tip 8: Leverage subagents** | Batched parallelism with worktree isolation |
| **Tip 13: Give feedback loops** | TDD subtasks — tests define done |

> *"Give Claude a way to verify its work. When Claude has a feedback loop, it will 2-3x the quality of the final result."* — Boris Cherny

---

## Why Hive Exists

Vibe coding is powerful but chaotic. We identified 6 pain points:

| # | Pain Point | What Happens |
|---|------------|--------------|
| 1 | **Lost context** | New session = start from scratch. "We discussed this yesterday" means nothing. |
| 2 | **Subagents go wild** | Parallel agents do their own thing. No coordination, duplicated work, conflicts. |
| 3 | **Scope creep** | "Add dark mode" becomes "rewrite the entire theme system." |
| 4 | **Messes to clean up** | Agent changes 47 files. Half are broken. Good luck reverting. |
| 5 | **Parallel steering impossible** | Can't guide multiple agents. They're all in their own world. |
| 6 | **No audit trail** | "What happened?" Nobody knows. Logs scattered, no unified view. |

**The ideal**: `Ticket → Hive → Iterate → Done → 3 months later → Context intact`

---

## The 6 Core Principles

### P1: Context Persists

Calibration survives between sessions. The "3 months later" problem solved.

Store grounded, project-specific knowledge:
- "We use Zustand, not Redux"
- "Auth is in `/lib/auth`, don't create new auth code"
- "We tried X, it was overkill for our scale"

**Don't store**: General knowledge the agent already has.

*Inspired by Boris's Tip 4: "Share a single CLAUDE.md file for your codebase... Whenever Claude does something incorrectly, add it so Claude learns not to repeat the mistake."*

### P2: Plan → Approve → Execute

Two phases with a clear gate between them.

| Phase | Mode | Human Role |
|-------|------|------------|
| **Planning** | Dialogue | Shape, question, refine |
| **Execution** | Trust | Agent runs, human monitors |

Planning is collaborative. Execution is autonomous. The approval gate is where trust is earned.

*Inspired by Boris's Tip 6: "Most sessions should start in Plan mode... A good plan makes all the difference."*

### P3: Human Shapes, Agent Builds

Human owns:
- The shape (what are we building?)
- The why (what problem does this solve?)
- The taste (what feels right?)

Agent owns:
- The details (how exactly to implement)
- The how (which patterns, which libraries)
- The execution (just do it)

Destination known. Path explored.

### P4: Good Enough Wins

Capture what's good enough FOR THIS CONTEXT. Reject over-engineering.

Valuable context examples:
- "We tried X, it was overkill for our 3-person team"
- "We chose Y because it was simpler, not because it's better"
- "Don't suggest Z, we explicitly rejected it"

This prevents future sessions from re-proposing rejected solutions.

### P5: Batched Parallelism

Parallel tasks grouped into batches. Sequential batches share context.

```
Batch 1 (parallel):     Batch 2 (parallel):
├── Task A              ├── Task D (uses A+B+C)
├── Task B              └── Task E (uses A+B+C)
└── Task C
        ↓
   Glue task synthesizes results
        ↓
   Context flows to Batch 2
```

This solves multi-agent coordination without complex orchestration. Each task gets a worktree. Glue tasks merge and synthesize.

*Inspired by Boris's Tip 8: "Use a few subagents regularly to automate common workflows."*

### P6: Tests Define Done

For implementation tasks, tests provide the feedback loop that dramatically improves quality.

**TDD Subtask Pattern:**
```
Task: Implement calculator
├── Subtask 1.1 [test]: Write failing tests
│   └── spec.md: Test requirements
│   └── report.md: Tests written, all failing ✓
├── Subtask 1.2 [implement]: Make tests pass
│   └── spec.md: Implementation approach
│   └── report.md: All tests passing ✓
└── Subtask 1.3 [verify]: Final verification
    └── report.md: 100% coverage, shipped ✓
```

Each subtask has its own `spec.md` (what to do) and `report.md` (what was done) — first-class audit trail.

*Inspired by Boris's Tip 13: "Give Claude a way to verify its work. When Claude has a feedback loop, it will 2-3x the quality of the final result."*

---

## Subtasks: First-Class TDD Support

Subtasks enable granular tracking within a task, perfect for TDD workflows:

```
.hive/features/user-auth/tasks/01-auth-service/
├── spec.md
├── report.md
└── subtasks/
    ├── 1-write-failing-tests/
    │   ├── status.json
    │   ├── spec.md      ← Detailed test requirements
    │   └── report.md    ← What tests were written
    ├── 2-implement-auth-service/
    │   ├── status.json
    │   ├── spec.md      ← Implementation approach
    │   └── report.md    ← What was implemented
    └── 3-verify-coverage/
        ├── status.json
        └── report.md    ← Final verification results
```

**Subtask Types:**
| Type | Purpose |
|------|---------|
| `test` | Write failing tests first |
| `implement` | Make tests pass |
| `verify` | Final verification |
| `review` | Code review checkpoint |
| `research` | Investigation before coding |
| `debug` | Fix issues |
| `custom` | Anything else |

---

## Key Design Decisions

### No loop-until-done

Unlike Ralph Wiggum's approach (keep retrying until success), we plan first.

- Ralph: "Just keep trying until it works"
- Hive: "Plan carefully, then execute with confidence"

Different philosophy. Both valid. Hive is for when you want control over direction.

### Fix tasks, not revert commands

When something goes wrong:
- ~~Add a revert command~~ (we tried this, ended badly)
- **Spawn a fix task** (agent can git revert if they decide to)

Everything is a task. Even fixes. Keeps the model consistent.

### Free-form context

Context structure is free-form. Content matters, not structure.

- Agent writes what's useful
- No forced directory structure
- No prescribed file names

Already have injection via `agents.md`, `CLAUDE.md`. Hive adds feature-scoped context.

### Platform, not replacement

Hive works WITH existing tools, not instead of them.

| Existing Tool | Hive Adds |
|---------------|-----------|
| `agents.md` | Feature-scoped context |
| `CLAUDE.md` | Plan + approval workflow |
| Git branches | Worktree isolation per task |
| Todo lists | Structured task tracking with status |

---

## What Hive Is / Isn't

### Hive IS:
- A plan-first development system
- A structure for multi-agent coordination
- A context persistence layer
- A platform that enhances existing tools
- A TDD-friendly workflow with subtask tracking

### Hive IS NOT:
- A visual dashboard (Vibe Kanban does this better)
- A loop-until-done executor (Ralph Wiggum does this)
- Heavy upfront documentation (Spec Kit territory)
- An agent replacement (Oh My OpenCode territory)

---

## How Hive Differs from Alternatives

| Tool | Philosophy | Hive's Take |
|------|------------|-------------|
| **[Spec Kit](https://github.com/github/spec-kit)** | Spec-first, heavy upfront docs | Too heavy. Specs emerge from planning, not before. |
| **[Ralph Wiggum](https://awesomeclaude.ai/ralph-wiggum)** | Loop until done, persistence wins | Different philosophy. We plan first, not retry first. |
| **[Conductor](https://github.com/gemini-cli-extensions/conductor)** | Context-driven, track-based | Similar goals. We add worktree isolation + batching. |
| **[Oh My OpenCode](https://github.com/code-yeongyu/oh-my-opencode)** | Agent-first, delegation model | Great complement! OMO as Hive Queen, Hive as workflow. |
| **Vibe Kanban** | Visual dashboard for agents | We're workflow, not UI. Could complement each other. |

**Hive's unique value**:
1. Batch-based parallelism with context flow (nobody else does this)
2. Worktree isolation per task (clean discard)
3. Two-phase autonomy with approval gate
4. Task-based everything (even fixes are tasks)
5. TDD subtasks with spec.md/report.md audit trail

---

## The Mental Model

```
Feature
└── Plan (dialogue until approved)
    └── Tasks (parallel in batches)
        └── Subtasks (TDD: test → implement → verify)
            └── Worktrees (isolated execution)
                └── Reports (what was done)
                    └── Context (persists for next time)
```

Human shapes at the top. Agent builds at the bottom. Gate in the middle. Tests verify the work.

---

## Evolution Notes

*This section tracks how our thinking evolved.*

### v0.1 (Initial)
- Started with 8 principles
- Consolidated to 5 (nothing lost, just cleaner)
- Dropped "revert command" idea after bad experience
- Chose free-form context over prescribed structure

### v0.8 (Subtask Folder Structure)
- Added P6: Tests Define Done
- Subtasks became first-class with own folders
- Each subtask has spec.md and report.md
- TDD workflow: test → implement → verify
- Inspired by Boris Cherny's "feedback loop" principle

---

<p align="center">
  <em>Plan first. Execute with trust. Context persists. Tests verify.</em>
</p>
