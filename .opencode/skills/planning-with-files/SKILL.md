---
name: planning-with-files
description: Use filesystem as persistent memory for complex tasks. Creates task_plan.md, findings.md, progress.md in project root. Triggers on: "plan this", "break down", "multi-step", "complex task", "session recovery", "/clear", or any work requiring >5 tool calls. Prevents goal drift via goal-refresh pattern.
metadata:
  audience: agents
  workflow: planning
  min-tool-calls: "5"
  enforcement: scripts + checklists
allowed-tools: "Read, Write, Edit, Bash, Glob, Grep"
---

## HIERARCHY ENFORCEMENT — Run This FIRST

This skill is LAYER 2 in the loading chain (persistent memory). Before any action:

1. **Verify hierarchy chain:**
   ```bash
   bash .skills-lab/refactoring-skills/workspace/scripts/verify-hierarchy.sh planning-with-files
   ```
   This checks that `user-intent-interactive-loop` is loaded and intent has been confirmed.

2. **Register this skill as loaded:**
   ```bash
   bash .opencode/state/register-skill.sh planning-with-files
   ```

3. **Prerequisites:**
   - `user-intent-interactive-loop` must be loaded (LAYER 1)
   - `.opencode/state/intent.json` must exist with `user_confirmed: true`
   - Background skills should already be loaded by upstream skills

**If hierarchy check fails → STOP. Intent must be confirmed before planning begins.**

# Planning with Files

Persistent markdown files as external memory. Context window is volatile RAM; filesystem is persistent disk.

## First Action — Do This Immediately

When this skill loads, execute these steps in order before any other action:

1. **Check for existing planning files** — Run `ls task_plan.md findings.md progress.md 2>/dev/null`
2. **If files exist** — Read all three. Run `scripts/check-complete.sh` to assess current state. Resume from the last `in_progress` phase.
3. **If files do NOT exist** — Run `scripts/init-session.sh` to create clean skeletons. Then read `task_plan.md` and fill in the Goal section from the user's request.
4. **Gate check** — Do NOT use Write, Edit, or Bash (beyond init/check scripts) until `task_plan.md` has a Goal and at least one phase defined.

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

## Dynamic Phase Schema

The file schema adapts to task type. Do NOT force a rigid 5-phase waterfall.

### Phase Generation Rules

Before creating `task_plan.md`, classify the task and generate appropriate phases:

| Task Type | Phase Pattern | Example Phases |
|-----------|--------------|----------------|
| **Research** | Discover → Synthesize → Deliver | Gather sources, Extract findings, Write summary |
| **Debugging** | Reproduce → Isolate → Fix → Verify | Reproduce bug, Find root cause, Apply fix, Test |
| **Feature** | Design → Implement → Test → Polish | API design, Write code, Add tests, Refine |
| **Refactoring** | Analyze → Restructure → Verify | Map dependencies, Extract modules, Run tests |
| **Skill Authoring** | Audit → Draft → Validate → Iterate | Review existing skills, Write SKILL.md, Run validation, Fix issues |
| **Generic** | Plan → Execute → Verify | Define approach, Do the work, Confirm results |

### Schema Rules

- **Minimum:** 2 phases (Plan → Execute)
- **Maximum:** 7 phases (beyond 7, split into sub-tasks)
- **Each phase must have:** checkboxes, `**Status:**` field (pending/in_progress/complete)
- **Phase titles** must describe the work, not generic labels like "Phase 1"

**See:** [references/01-file-structure.md](references/01-file-structure.md) for full schema details.

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

## Goal Refresh — Enforced by Checklist

Hooks are declarations. Checklists are procedures. **This skill enforces via checklist.**

### Pre-Tool-Use Checklist (Mandatory)

Before EVERY Write, Edit, or Bash (non-read-only) tool call, complete this checklist:

- [ ] **Read `task_plan.md` first 30 lines** — Confirm Goal and Current Phase are still correct
- [ ] **Verify phase is `in_progress`** — If status is `pending`, update it first. If `complete`, move to next phase
- [ ] **Check Errors Encountered table** — If this action failed before, do NOT repeat. Change approach (see 3-Strike Protocol)
- [ ] **Confirm content destination** — Web/search results → `findings.md`. Plan changes → `task_plan.md`. Session log → `progress.md`
- [ ] **Count tool calls since last plan read** — If ≥5, re-read `task_plan.md` (first 30 lines minimum) before proceeding

### Goal-Refresh Trigger Algorithm

```
1. Track: tool_calls_since_plan_read counter (starts at 0 after each Read of task_plan.md)
2. Before Write/Edit/Bash:
   a. If tool_calls_since_plan_read >= 5:
      → Read task_plan.md (first 30 lines)
      → Reset counter to 0
   b. Increment counter
   c. Run Pre-Tool-Use Checklist above
   d. Proceed with tool call
3. After phase status change:
   → Read task_plan.md (full file)
   → Reset counter to 0
```

**Violation = goal drift.** If you catch yourself mid-action without having read the plan, stop and read it now.

**See:** [references/03-goal-refresh.md](references/03-goal-refresh.md) for the full mechanism.

## File Schema

### task_plan.md — Phase Tracker

**Required sections:**
- `## Goal` — One sentence. The north star.
- `## Current Phase` — Which phase is active (e.g., "Phase 2").
- `## Phases` — 2-7 phases, each with checkboxes and `**Status:**` field.
- `## Decisions Made` — Table of choices with rationale.
- `## Errors Encountered` — Table of errors, attempt count, resolution.

**Status values:** `pending` → `in_progress` → `complete`

### findings.md — Knowledge Store

**Required sections:**
- `## Requirements` — Extracted from user request.
- `## Research Findings` — Key discoveries from exploration.
- `## Technical Decisions` — Table of choices with rationale.
- `## Issues Encountered` — Problems and resolutions.
- `## Resources` — URLs, file paths, API references.

**Critical rule:** Web/search/browser results go here, NOT in `task_plan.md`.

### progress.md — Session Log

**Required sections:**
- `## Session: <date>` — Grouped by date.
- Per-phase entries with status, actions taken, files modified.
- `## Test Results` — Table of tests run.
- `## Error Log` — Timestamped error entries.

**See:** [references/01-file-structure.md](references/01-file-structure.md) for full schema.

## Session Recovery Protocol

After `/clear`, interruption, or new session:

1. **Check for planning files** — If `task_plan.md` exists, read all three files immediately.
2. **Run catchup script** — Execute `python3 scripts/session-catchup.py` to detect unsynced context. Parse its JSON output (`--json` flag) for automated reconciliation.
3. **Cross-reference with git** — Run `git diff --stat` to see actual code changes since last plan update.
4. **Reconcile** — Update planning files to match current state. Mark completed phases. Log any gaps.
5. **Resume** — Continue from the current phase. Re-read `task_plan.md` before the next action.

**If no planning files exist after `/clear`:** The session was lost. Ask the user what was being worked on, then run `scripts/init-session.sh` to start fresh.

**See:** [references/02-session-lifecycle.md](references/02-session-lifecycle.md) for full lifecycle.

## Scripts — Actual Enforcement

| Script | Purpose | When to Run | Exit Code |
|--------|---------|-------------|-----------|
| `scripts/init-session.sh` | Creates skeleton files + validates | Start of new task | 0=ok, 1=failed |
| `scripts/check-complete.sh` | Content-level phase validation | End of session, before commit | 0=ok, 1=incomplete |
| `scripts/session-catchup.py` | Recovers state from git + session logs | After `/clear` or new session | 0=synced, 1=drift detected |

### Script Behavior Guarantees

- **No interactive prompts** — All scripts run headless
- **Structured output** — `[planning-with-files]` prefixed messages for parsing
- **Meaningful exit codes** — 0 = success, 1 = action needed
- **Agentic use** — Scripts output actionable next steps, not just status

## Error Discipline

### Log Every Error

```markdown
## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| FileNotFoundError | 1 | Created default config |
| API timeout | 2 | Added retry with exponential backoff |
```

### 3-Strike Protocol — With Tracking

| Strike | Action | Tracking |
|--------|--------|----------|
| **1** | Diagnose root cause, apply targeted fix. Log in Errors Encountered table. | `| <error> | 1 | <fix> |` |
| **2** | Try DIFFERENT method/tool/library. NEVER repeat same action. Log the change. | `| <error> | 2 | <different approach> |` |
| **3** | Question assumptions. Search for solutions. Consider updating the plan itself. | `| <error> | 3 | <rethink> |` |
| **After 3** | ESCALATE to user. Summarize: what was tried, what failed, what you need. | Stop. Ask user. |

**Tracking rule:** Every error MUST be logged in both `task_plan.md` (Errors Encountered table) AND `progress.md` (Error Log section) with timestamp. If the same error appears 2+ times in the table, you are on strike 2+.

### Decision Procedure — Before Each Tool Call

```
1. Is task_plan.md in my last 5 tool calls? If no, Read it.
2. Have I tried this exact action before? Check Errors Encountered table.
3. Is my current phase still in_progress? If no, update status first.
4. Am I writing external/web content? If yes, write to findings.md, not task_plan.md.
```

## Anti-Patterns — With Decision Procedures

| Anti-Pattern | Detection | Decision Procedure |
|-------------|-----------|-------------------|
| Using TodoWrite for persistence | Last 5 tool calls include todowrite but no Read of task_plan.md | Read task_plan.md. Copy todowrite items into Phases section. |
| Stating goals once, never re-reading | task_plan.md not Read in last 10 tool calls | Read task_plan.md immediately. Log the Read in progress.md. |
| Hiding errors, retrying silently | Same tool call repeated 2+ times with no error logged | Log error in Errors Encountered table. Change approach. |
| Writing web content to task_plan.md | Write/Edit targets task_plan.md with URL or search result content | Write to findings.md instead. Add pointer in task_plan.md if needed. |
| Starting execution without a plan | Write/Edit/Bash called before task_plan.md has Goal section | Stop. Create task_plan.md with Goal and at least 1 phase. |
| Repeating failed actions | Errors Encountered table shows same error 2+ times | Change tool, library, or approach. Log the mutation. |
| Creating files in skill directory | Write target is inside .opencode/skills/ or .agents/skills/ | Write to project root instead. |
| Stuffing everything in context | Single tool call returns >5000 chars | Write full content to findings.md. Store only the pointer in context. |

## The 5-Question Reboot Test

If the Agent can answer these, context management is solid:

| Question | Answer Source |
|----------|---------------|
| Where am I? | Current phase in `task_plan.md` |
| Where am I going? | Remaining phases |
| What's the goal? | Goal statement in `task_plan.md` |
| What have I learned? | `findings.md` |
| What have I done? | `progress.md` |

## Integration Protocol — Coordinating Skills

### Load Order

1. **First:** `user-intent-interactive-loop` — Clarify requirements before planning
2. **Second:** `planning-with-files` (this skill) — Create planning files
3. **Third:** `coordinating-loop` — Dispatch subagents against the plan
4. **Fourth:** `gcc` — Git-backup critical decisions
5. **Fifth:** Domain skills (`skill-creator`, `writing-skills`, etc.) — Execute work

### State Sharing

| Source Skill | Output Destination | How |
|-------------|-------------------|-----|
| `user-intent-interactive-loop` | `findings.md` → `## Requirements` | Copy clarified requirements |
| `planning-with-files` | `task_plan.md` | Phase definitions, goal |
| `coordinating-loop` | `progress.md` → Actions Taken | Log subagent dispatches |
| `gcc` | Git commit | Snapshot planning files at phase boundaries |

### Conflict Resolution

| Conflict | Resolution |
|----------|-----------|
| `coordinating-loop` says "dispatch parallel" vs this skill says "one phase at a time" | Parallel dispatch is allowed WITHIN a phase. Phases themselves remain sequential. |
| `gcc` memory vs file-based memory | Files are source of truth. GCC is backup. If they disagree, trust files. |
| `user-intent-interactive-loop` changes requirements mid-task | Update `findings.md` → `## Requirements`. Add a new phase to `task_plan.md` if scope changed significantly. |

## Worked Example — Skill Creation Task

**User says:** "Create a new skill for deep codebase research"

### Step 1: First Action (this skill loads)
```
Agent runs: ls task_plan.md findings.md progress.md 2>/dev/null
Result: No files found
Agent runs: scripts/init-session.sh
Result: Clean skeletons created
Agent reads: task_plan.md
```

### Step 2: Classify Task and Generate Phases
Task type: **Skill Authoring**
Phases generated:
1. Audit existing skills for overlap
2. Draft SKILL.md with frontmatter
3. Write reference documents
4. Run validation script
5. Iterate on failures

### Step 3: Fill task_plan.md
```markdown
# Task Plan: Deep Codebase Research Skill

## Goal
Create a complete skill pack at .opencode/skills/deep-research/ with SKILL.md, references, and validation.

## Current Phase
Phase 1

## Phases

### Phase 1: Audit existing skills for overlap
- [ ] Search for existing research-related skills
- [ ] Document overlap analysis in findings.md
- **Status:** in_progress

### Phase 2: Draft SKILL.md with frontmatter
- [ ] Write frontmatter with name, description, metadata
- [ ] Write skill body with triggers and workflows
- **Status:** pending

### Phase 3: Write reference documents
- [ ] Create references/ directory
- [ ] Write methodology and examples
- **Status:** pending

### Phase 4: Run validation script
- [ ] Execute validate-skill.sh
- [ ] Fix any failures
- **Status:** pending

### Phase 5: Iterate on failures
- [ ] Address validation errors
- [ ] Re-run until clean
- **Status:** pending
```

### Step 4: Execute Phase 1
```
Agent runs: Glob **/SKILL.md
Agent reads: findings.md → writes overlap analysis
Agent edits: task_plan.md → marks Phase 1 complete, Phase 2 in_progress
Agent updates: progress.md → logs actions
```

### Step 5: Continue through phases
Each phase follows the same pattern: Read plan → Do work → Update files → Verify.

## Templates

Copy templates to project root and fill in:

- [templates/task_plan.md](templates/task_plan.md) — Phase tracking skeleton
- [templates/findings.md](templates/findings.md) — Research storage skeleton
- [templates/progress.md](templates/progress.md) — Session logging skeleton

## Platform Adaptation

### OpenCode (Primary)
- Scripts: All `.sh` and `.py` scripts work natively.
- Skills: Place in `.opencode/skills/planning-with-files/`.

### Claude Code
- Skills: Place in `.claude/skills/planning-with-files/`.
- Scripts: `.sh` files work. `.py` requires Python 3.

### Codex
- Scripts: All scripts work. No native hook system — rely on script-based enforcement.

### Cursor
- Skills: Place in `.cursor/skills/planning-with-files/`.
