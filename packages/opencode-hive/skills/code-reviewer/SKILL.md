---
name: code-reviewer
description: Use when reviewing implementation changes against an approved plan or task (especially before merging or between Hive tasks) to catch missing requirements, YAGNI, dead code, and risky patterns
---

# Code Reviewer

## Overview

This skill teaches a reviewer to evaluate implementation changes for:
- Adherence to the approved plan/task (did we build what we said?)
- Correctness (does it work, including edge cases?)
- Simplicity (YAGNI, dead code, over-abstraction)
- Risk (security, performance, maintainability)

**Core principle:** The best change is the smallest correct change that satisfies the plan.

## Conversational Review Workflow

When delegated as a sub-agent reviewer, use the Hive review tools for a conversational workflow:

### Starting a Review

Use `hive_review_start` with your agent ID for attribution:
```
hive_review_start(feature: "my-feature", reviewer: "hygienic-reviewer")
```

### Adding Comments with Attribution

Always include `agentId` to identify your comments:
```
hive_review_add_comment(
  entityId: "file.ts",
  uri: "file:///path/to/file.ts",
  range: { start: { line: 10, character: 0 }, end: { line: 10, character: 50 } },
  type: "comment",
  body: "Consider extracting this logic",
  agentId: "hygienic-reviewer"
)
```

### Asking Questions (Human Interaction)

When you need clarification, use `type: "question"`:
```
hive_review_add_comment(
  type: "question",
  body: "Is this intentional behavior? The plan mentions X but the code does Y.",
  agentId: "hygienic-reviewer"
)
```

Questions notify the human reviewer who can reply in the conversation panel.

### Code Suggestions

For concrete code changes, use `hive_review_suggest`:
```
hive_review_suggest(
  entityId: "file.ts",
  uri: "file:///path/to/file.ts",
  range: { start: { line: 10, character: 0 }, end: { line: 15, character: 0 } },
  body: "Simplify with early return",
  replacement: "if (!valid) return;\n\n// rest of code",
  agentId: "hygienic-reviewer"
)
```

### Replying to Threads

When responding to human questions or continuing a conversation:
```
hive_review_reply(
  threadId: "thread-123",
  body: "Good point. I'll revise my assessment.",
  agentId: "hygienic-reviewer"
)
```

### Submitting Review

**IMPORTANT**: Sub-agents can provide verdicts but CANNOT approve final merges. Only humans can approve.
```
hive_review_submit(verdict: "request_changes", summary: "3 critical issues found.")
```

### Sub-Agent Constraints

- **Cannot resolve threads** - Only humans can mark threads as resolved
- **Cannot approve merges** - Sub-agent `approve` verdict is advisory only
- **Must use agentId** - All comments must include attribution
- **Questions notify humans** - Use `type: "question"` to escalate ambiguity

## Iron Laws

- Review against the task/plan first. Code quality comes second.
- Bias toward deletion and simplification. Every extra line is a liability.
- Prefer changes that leverage existing patterns and dependencies.
- Be specific: cite file paths and (when available) line numbers.
- Do not invent requirements. If the plan/task is ambiguous, mark it and request clarification.

## What Inputs You Need

Minimum:
- The task intent (1-3 sentences)
- The plan/task requirements (or a link/path to plan section)
- The code changes (diff or list of changed files)

If available (recommended):
- Acceptance criteria / verification steps from the plan
- Test output or proof the change was verified
- Any relevant context files (design decisions, constraints)

## Review Process (In Order)

### 1) Identify Scope

1. List all files changed.
2. For each file, state why it changed (what requirement it serves).
3. Flag any changes that do not map to the task/plan.

**Rule:** If you cannot map a change to a requirement, treat it as suspicious until justified.

### 2) Plan/Task Adherence (Non-Negotiable)

Create a simple checklist:
- What the task says must happen
- Evidence in code/tests that it happens

Flag as issues:
- Missing requirements (implemented behavior does not match intent)
- Partial implementation with no follow-up task (TODO-driven shipping)
- Behavior changes that are not in the plan/task

### 3) Correctness Layer

Review for:
- Edge cases and error paths
- Incorrect assumptions about inputs/types
- Inconsistent behavior across platforms/environments
- Broken invariants (e.g., state can become invalid)

Prefer "fail fast, fail loud": invalid states should become clear errors, not silent fallbacks.

### 4) Simplicity / YAGNI Layer

Be ruthless and concrete:
- Remove dead branches, unused flags/options, unreachable code
- Remove speculative TODOs and "reserved for future" scaffolding
- Remove comments that restate the code or narrate obvious steps
- Inline one-off abstractions (helpers/classes/interfaces used once)
- Replace cleverness with obvious code
- Reduce nesting with guard clauses / early returns

Prefer clarity over brevity:
- Avoid nested ternary operators; use `if/else` or `switch` when branches matter
- Avoid dense one-liners that hide intent or make debugging harder

### 4b) De-Slop Pass (AI Artifacts / Style Drift)

Scan the diff (not just the final code) for AI-generated slop introduced in this branch:
- Extra comments that a human would not add, or that do not match the file's tone
- Defensive checks or try/catch blocks that are abnormal for that area of the codebase
  - Especially swallowed errors ("ignore and continue") and silent fallbacks
  - Especially redundant validation in trusted internal codepaths
- TypeScript escape hatches used to dodge type errors (`as any`, `as unknown as X`) without necessity
- Style drift: naming, error handling patterns, logging style, and structure inconsistent with nearby code

Default stance:
- Prefer deletion over justification.
- If validation is needed, do it at boundaries; keep internals trusting parsed inputs.
- If a cast is truly unavoidable, localize it and keep the justification to a single short note.

When recommending simplifications, do not accidentally change behavior. If the current behavior is unclear, request clarification or ask for a test that pins it down.

**Default stance:** Do not add extensibility points without an explicit current requirement.

### 5) Risk Layer (Security / Performance / Maintainability)

Only report what you are confident about.

Security checks (examples):
- No secrets in code/logs
- No injection vectors (shell/SQL/HTML) introduced
- Authz/authn checks preserved
- Sensitive data not leaked

Performance checks (examples):
- Avoid unnecessary repeated work (N+1 queries, repeated parsing, repeated filesystem hits)
- Avoid obvious hot-path allocations or large sync operations

Maintainability checks:
- Clear naming and intent
- Consistent error handling
- API boundaries not blurred
- Consistent with local file patterns (imports, export style, function style)

### 6) Make One Primary Recommendation

Provide one clear path to reach approval.
Mention alternatives only when they have materially different trade-offs.

### 7) Signal the Investment

Tag the required follow-up effort using:
- Quick (<1h)
- Short (1-4h)
- Medium (1-2d)
- Large (3d+)

## Confidence Filter

Only report findings you believe are >=80% likely to be correct.
If you are unsure, explicitly label it as "Uncertain" and explain what evidence would confirm it.

## Output Format (Use This Exactly)

---

**Files Reviewed:** [list]

**Plan/Task Reference:** [task name + link/path to plan section if known]

**Overall Assessment:** [APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION]

**Bottom Line:** 2-3 sentences describing whether it matches the task/plan and what must change.

### Critical Issues
- None | [file:line] - [issue] (why it blocks approval) + (recommended fix)

### Major Issues
- None | [file:line] - [issue] + (recommended fix)

### Minor Issues
- None | [file:line] - [issue] + (suggested fix)

### YAGNI / Dead Code
- None | [file:line] - [what to remove/simplify] + (why it is unnecessary)

### Positive Observations
- [at least one concrete good thing]

### Action Plan
1. [highest priority change]
2. [next]
3. [next]

### Effort Estimate
[Quick | Short | Medium | Large]

---

## Common Review Smells (Fast Scan)

Task/plan adherence:
- Adds features not mentioned in the plan/task
- Leaves TODOs as the mechanism for correctness
- Introduces new configuration modes/flags "for future"

YAGNI / dead code:
- Options/config that are parsed but not used
- Branches that do the same thing on both sides
- Comments like "reserved for future" or "we might need this"

AI slop / inconsistency:
- Commentary that restates code, narrates obvious steps, or adds process noise
- try/catch that swallows errors or returns defaults without a requirement
- `as any` used to silence type errors instead of fixing types
- New helpers/abstractions with a single call site

Correctness:
- Silent fallbacks to defaults on error when the task expects a hard failure
- Unhandled error paths, missing cleanup, missing returns

Maintainability:
- Abstractions used once
- Unclear naming, "utility" grab-bags

## When to Escalate

Use NEEDS_DISCUSSION (instead of REQUEST_CHANGES) when:
- The plan/task is ambiguous and multiple implementations could be correct
- The change implies a product/architecture decision not documented
- Fixing issues requires changing scope, dependencies, or public API
