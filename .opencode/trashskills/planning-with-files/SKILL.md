---
name: "planning-with-files"
description: "File-based planning methodology using project-root task_plan.md, findings.md, and progress.md as persistent working memory. Prevents context loss, enforces structured reasoning, and ensures recoverability across multi-turn agent workflows."
---

# File-Based Planning Methodology

## Core Principle

**Context window = RAM (volatile, limited). Filesystem = Disk (persistent, searchable).**

Every complex task must be decomposed into files on disk. Never rely on in-context memory alone for multi-step work.

## The 3 Files

### task_plan.md — Phase Tracker
Tracks the overall plan, current phase, and what comes next.

```markdown
# Task: [name]
## Goal: [one line]
## Status: IN-PROGRESS
## Phases:
- [x] 1. Research codebase structure
- [ ] 2. Identify change points
- [ ] 3. Implement changes
- [ ] 4. Verify and test
## Current Phase: 2
## Blockers: none
```

### findings.md — Discoveries Log
Accumulates facts discovered during research. Prevents re-searching.

```markdown
# Findings
## Architecture
- Entry point: src/index.ts
- Config loaded from opencode.json

## Dependencies
- Uses zod for validation (not ajv)
- Node 20+ required

## Constraints
- No external HTTP calls in test env
```

### progress.md — Session Log
Timestamped record of what was done. Enables session recovery.

```markdown
# Progress Log
## [2024-01-15 10:30] Started task
- Read package.json, identified tech stack
- Found 3 entry points

## [2024-01-15 10:45] Research complete
- Mapped dependency graph
- Identified circular ref in utils/
```

## The 2-Action Rule

After every 2 search/read/grep operations, **save findings to a file**.

1. Search A → Search B → **Write to project-root findings.md**
3. Search C → Search D → **Append to project-root findings.md**

This prevents catastrophic context loss when the window shifts.

## Read Before Decide

Before making any major decision (architecture choice, file to modify, approach):

1. Re-read project-root `task_plan.md` to verify current phase
2. Re-read project-root `findings.md` for relevant facts
3. Then decide

This is **attention manipulation** — forcing the relevant context back into focus.

## The 5-Question Reboot Test

When lost, confused, or looping, answer these **in writing** in project-root `progress.md`:

1. **Where am I?** — Current file, function, phase
2. **Where am I going?** — Next concrete step
3. **What's the goal?** — The task's end state
4. **What have I learned?** — Key facts from findings.md
5. **What have I done?** — Last 3 actions taken

If you cannot answer all 5, stop and re-research.

## The 3-Strike Error Protocol

When the same error occurs 3 times:

| Strike | Action |
|--------|--------|
| 1 | Diagnose — read the error, identify root cause |
| 2 | Alternative — try a different approach entirely |
| 3 | Rethink — question assumptions, re-read the plan |
| 3+ | Escalate — report to conductor with full context |

## File Locations

Always create these runtime working files in the **project root**:
- `task_plan.md`
- `findings.md`
- `progress.md`

If this harness repository also ships `.opencode/planning/task_plan.md`, `.opencode/planning/findings.md`, or `.opencode/planning/progress.md`, those are harness-development artifacts for the experiment and documentation process. They are not the runtime working-memory location for user tasks.

Clean them up when the task is complete.
