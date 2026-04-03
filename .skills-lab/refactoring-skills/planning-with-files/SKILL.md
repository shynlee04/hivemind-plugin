---
name: planning-with-files
description: Use filesystem as persistent memory for complex tasks. Creates task_plan.md, findings.md, progress.md in project root. Triggers on: "plan this", "break down", "multi-step", "complex task", "session recovery", "/clear", or any work requiring >5 tool calls. Prevents goal drift via goal-refresh pattern.
---

# Planning with Files

Use persistent markdown files as external memory. Context window is volatile RAM; filesystem is persistent disk.

## When to Use

**Activate when:**
- Task requires >5 tool calls
- User says "plan this", "break down", "organize", "multi-step"
- Session recovery needed after `/clear` or interruption
- Research tasks with multiple sources
- Feature development spanning multiple files
- Debugging complex bugs with unknown root cause

**Skip for:**
- Single-file edits
- Simple factual questions
- One-command operations

## The Core Pattern

```
Context Window = RAM (volatile, limited)
Filesystem = Disk (persistent, unlimited)
→ Anything important gets written to disk immediately.
```

## Planning Cycle

```
INIT → PLAN → EXECUTE → UPDATE → VERIFY → COMPACT
```

1. **INIT** — Check for existing planning files. If found, read all three. If not, create them.
2. **PLAN** — Write `task_plan.md` with goal, phases, key questions. Re-read before every decision.
3. **EXECUTE** — Work through phases one at a time. Write discoveries to `findings.md` as they happen.
4. **UPDATE** — After each phase: mark status, log errors, note files changed in `progress.md`.
5. **VERIFY** — Run `scripts/check-complete.sh` or manually confirm all phases complete.
6. **COMPACT** — If context grows stale, re-read `task_plan.md` to refresh goals. Trim verbose sections.

## File Schema

### task_plan.md — Phase Tracker

The goal-refresh mechanism. Re-reading this file pulls the original goal back into the Agent's attention window.

**Required sections:**
- `## Goal` — One sentence. The north star.
- `## Current Phase` — Which phase is active (e.g., "Phase 2").
- `## Phases` — 3-7 phases, each with checkboxes and `**Status:**` field.
- `## Decisions Made` — Table of choices with rationale.
- `## Errors Encountered` — Table of errors, attempt count, resolution.

**Status values:** `pending` → `in_progress` → `complete`

**See:** [references/01-file-structure.md](references/01-file-structure.md) for full schema.

### findings.md — Knowledge Store

Stores discoveries, research results, and technical decisions. Write here after every 2 view/search operations.

**Required sections:**
- `## Requirements` — Extracted from user request.
- `## Research Findings` — Key discoveries from exploration.
- `## Technical Decisions` — Table of choices with rationale.
- `## Issues Encountered` — Problems and resolutions.
- `## Resources` — URLs, file paths, API references.

**Critical rule:** Web/search/browser results go here, NOT in `task_plan.md`. `task_plan.md` is auto-read by hooks; untrusted content there amplifies on every tool call.

### progress.md — Session Log

Chronological record of actions, test results, and session state.

**Required sections:**
- `## Session: <date>` — Grouped by date.
- Per-phase entries with status, actions taken, files modified.
- `## Test Results` — Table of tests run.
- `## Error Log` — Timestamped error entries.

**See:** [references/01-file-structure.md](references/01-file-structure.md) for full schema.

## Session Recovery Protocol

After `/clear`, interruption, or new session:

1. **Check for planning files** — If `task_plan.md` exists, read all three files immediately.
2. **Run catchup script** — Execute `scripts/session-catchup.py` to detect unsynced context from previous sessions.
3. **Cross-reference with git** — Run `git diff --stat` to see actual code changes since last plan update.
4. **Reconcile** — Update planning files to match current state. Mark completed phases. Log any gaps.
5. **Resume** — Continue from the current phase. Re-read `task_plan.md` before the next action.

**See:** [references/02-session-lifecycle.md](references/02-session-lifecycle.md) for full lifecycle.

## Goal Refresh Mechanism

After ~50 tool calls, the original goal drifts out of the attention window ("lost in the middle" effect). The fix:

```
[Many tool calls have happened...]
[Context is getting long...]
→ Read task_plan.md          # Goal reappears in recent attention
→ Now make the decision       # Goals are fresh
```

**Rule:** Re-read `task_plan.md` before every major decision. This is non-negotiable for tasks >10 tool calls.

**See:** [references/03-goal-refresh.md](references/03-goal-refresh.md) for the full mechanism.

## Cross-Platform Hooks

This skill sustains discipline across platforms via hooks. Each platform has its own hook format:

| Platform | Hook Config | Script Location |
|----------|------------|-----------------|
| OpenCode | `.opencode/` hooks | `scripts/` |
| Claude Code | `.cursor/hooks/` | `scripts/` |
| Gemini CLI | `.gemini/hooks/` | `scripts/` |
| Cursor | `.cursor/hooks/` | `scripts/` |

**Hook lifecycle:**
- **UserPromptSubmit** — Inject current plan state into context.
- **PreToolUse** — Re-read `task_plan.md` before tool calls.
- **PostToolUse** — Remind Agent to update progress after writes.
- **Stop** — Run `check-complete.sh` to verify phase status.

**See:** [references/04-cross-platform-hooks.md](references/04-cross-platform-hooks.md) for platform-specific configs.

## Scripts

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `scripts/init-session.sh` | Creates all three planning files | Start of new task |
| `scripts/check-complete.sh` | Verifies all phases complete | End of session |
| `scripts/session-catchup.py` | Recovers state from git history | After `/clear` or new session |

## Error Discipline

### Log Every Error

```markdown
## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| FileNotFoundError | 1 | Created default config |
| API timeout | 2 | Added retry with exponential backoff |
```

### 3-Strike Protocol

| Attempt | Action |
|---------|--------|
| 1 | Diagnose root cause, apply targeted fix |
| 2 | Try different method/tool/library — NEVER repeat same action |
| 3 | Question assumptions, search for solutions, consider updating the plan |
| After 3 | Escalate to user with what was tried and the specific error |

### Never Repeat Failures

```
if action_failed:
    next_action != same_action
```

Track what you tried. Mutate the approach.

## Read vs Write Decision Matrix

| Situation | Action |
|-----------|--------|
| Just wrote a file | Don't re-read — content is still in context |
| Viewed image/PDF | Write findings NOW — multimodal content doesn't persist |
| Browser returned data | Write to `findings.md` — screenshots don't persist |
| Starting new phase | Read `task_plan.md` + `findings.md` — re-orient |
| Error occurred | Read relevant file — need current state to fix |
| Resuming after gap | Read ALL planning files — recover full state |

## The 5-Question Reboot Test

If the Agent can answer these, context management is solid:

| Question | Answer Source |
|----------|---------------|
| Where am I? | Current phase in `task_plan.md` |
| Where am I going? | Remaining phases |
| What's the goal? | Goal statement in `task_plan.md` |
| What have I learned? | `findings.md` |
| What have I done? | `progress.md` |

## Anti-Patterns

| Anti-Pattern | Why It Causes Hallucination | Fix |
|-------------|---------------------------|-----|
| Using TodoWrite for persistence | In-memory state vanishes on `/clear` | Use `task_plan.md` file |
| Stating goals once, never re-reading | Goals drift out of attention window | Re-read `task_plan.md` before decisions |
| Hiding errors, retrying silently | Agent repeats same failure loop | Log every error in `task_plan.md` |
| Writing web content to `task_plan.md` | Untrusted content auto-injected by hooks | Write external content to `findings.md` only |
| Starting execution without a plan | No goal anchor → drift → hallucination | Create `task_plan.md` FIRST |
| Repeating failed actions | Same input → same output | Track attempts, mutate approach |
| Creating files in skill directory | Templates ≠ working files | Create planning files in project root |
| Stuffing everything in context | Context window fills → truncation → loss | Store large content in files, keep pointers |

## Templates

Copy templates to project root and fill in:

- [templates/task_plan.md](templates/task_plan.md) — Phase tracking template
- [templates/findings.md](templates/findings.md) — Research storage template
- [templates/progress.md](templates/progress.md) — Session logging template

## Coordinating Skills

Load these skills together for maximum effectiveness:
- `coordinating-loop` — For dispatching subagents and managing iterative cycles
- `user-intent-interactive-loop` — For clarifying requirements before planning
- `gcc` — For git-backed memory across sessions
- `skill-creator` / `writing-skills` — When creating or improving skills
