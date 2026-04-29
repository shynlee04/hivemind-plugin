---
name: hm-planning-persistence
description: Persist task state across sessions with a 3-file external memory system rooted in .hivemind/state/planning/. Use when planning complex multi-step tasks, recovering after context loss, handing off between agents, or when work spans multiple sessions. Produces task_plan.md, findings.md, progress.md in session-isolated directories. NOT for simple one-step tasks, in-memory todo lists, or generic planning advice.
metadata:
  layer: "2"
  role: "persistent-memory"
  pattern: "P3"
  version: "1.0.0"
  lineage: "hm"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
pipeline:
  stage: persistence
  reads:
    - ".hivemind/state/session-continuity.json"
    - ".hivemind/state/delegations.json"
    - ".hivemind/state/planning/<session-id>/task_plan.md"
    - ".hivemind/state/planning/<session-id>/findings.md"
    - ".hivemind/state/planning/<session-id>/progress.md"
  writes:
    - ".hivemind/state/planning/<session-id>/task_plan.md"
    - ".hivemind/state/planning/<session-id>/findings.md"
    - ".hivemind/state/planning/<session-id>/progress.md"
  upstream:
    - "hm-user-intent-interactive-loop"
    - "hm-spec-driven-authoring"
  downstream:
    - "hm-coordinating-loop"
    - "hm-phase-execution"
    - "hm-phase-loop"
    - "hm-debug"
    - "hm-refactor"
    - "hm-test-driven-execution"
    - "hm-completion-looping"
    - "hm-subagent-delegation-patterns"
     - "hf-meta-builder"
    - "hm-research-chain"
    - "hf-delegation-gates"
---

## Overview

Three-file external memory system for persisting task state across sessions and context resets. Use when planning complex multi-step work, recovering after context loss, or handing off between agents. Produces durable task plans, findings logs, and progress trackers in session-isolated directories under `.hivemind/state/planning/`.

This skill replaces the disabled `hm-planning-with-files` with session isolation, structured YAML frontmatter, explicit pipeline integration contracts (D-09), and a clean architecture that works across any skills-compatible platform.

## The Iron Law

```
The filesystem IS persistent memory. Before any non-trivial change, read the plan.
```

## Why This Skill Exists

LLM context windows are volatile RAM. When orchestrating a multi-step task — especially one involving subagent delegation, multiple sessions, or recovery from interruptions — external memory is essential. The filesystem IS that memory.

This skill provides a 3-file system that acts as persistent brain:
- **task_plan.md** — Where you're going (goal + phases + decisions + errors)
- **findings.md** — What you've learned (research + technical discoveries)
- **progress.md** — What you've done (session log + errors + handoffs)

Any agent can pick up exactly where work left off by reading these 3 files from the session directory.

### What Changed from hm-planning-with-files

| Old (Disabled) | New (This Skill) |
|---|---|
| Files in project root | Files in `.hivemind/state/planning/<session-id>/` |
| Pure markdown | YAML frontmatter + markdown body |
| Implicit skill dependencies | Explicit pipeline contract (see frontmatter) |
| Hard prerequisite blocking | Soft boundary — graceful fallback |
| No session isolation | Session-scoped directories |

## Reference Map

| When You Need | Read This |
|---------------|-----------|
| Exact file format specifications | `references/file-formats.md` |
| State machine and transition rules | `references/state-transitions.md` |
| Schema for session metadata | `references/metadata-schema.json` |
| Template for new task_plan.md | `templates/task_plan.md` |
| Template for new findings.md | `templates/findings.md` |
| Template for new progress.md | `templates/progress.md` |
| Rationale for design decisions | `research/design-decisions.md` |

## Tiered Response — Not Everything Needs Full Ritual

Different situations need different ceremony levels:

```
About to do something? Ask yourself:
|
+-- Am I starting a new complex task?
|   +-- YES --> INIT: Create all 3 files (see First Action)
|
+-- Did I just complete a phase or make a significant discovery?
|   +-- YES --> CHECKPOINT: Update all 3 files with current state
|
+-- Did a subagent return with results?
|   +-- YES --> ABSORB: Write findings.md, update task_plan.md phase status
|
+-- Did something fail or change direction?
|   +-- YES --> PIVOT: Log error, update findings.md, add new phase if needed
|
+-- Just doing routine work within current phase?
    +-- LIGHT: Update progress.md only. No full checkpoint needed.
```

## First Action — When Skill Loads

1. **Determine session ID:**
   - Check `.hivemind/state/session-continuity.json` for active session
   - If no session: generate UUID v4 as session ID
   - Set `SESSION_DIR=.hivemind/state/planning/<session-id>/`

2. **Check for `.hivemind/` directory:**
   - If exists: use `.hivemind/state/planning/<session-id>/` (canonical)
   - If absent: use `.session/<session-id>/` (fallback)
   - Note: if using fallback, log warning in progress.md

3. **Check for existing planning files:**
   ```bash
   ls $SESSION_DIR/task_plan.md $SESSION_DIR/findings.md $SESSION_DIR/progress.md 2>/dev/null
   ```

4. **If all 3 exist** — Read all 3. Resume from the current phase.

5. **If some exist** — Read what's there. Create missing files using templates from `templates/`.

6. **If none exist** — Create all 3 using templates. Fill in the Goal from user's request.

7. **Create the session directory** if it doesn't exist:
   ```bash
   mkdir -p $SESSION_DIR
   ```

**Gate:** Do not proceed with execution until `task_plan.md` has a Goal and at least one phase defined.

## The Core Discipline: Read Before Write

Before making any non-trivial change, **read task_plan.md** (at minimum the Goal and Current Phase sections).

Context compaction, subagent returns, and user interruptions all cause drift. The plan file is the anchor.

**Re-read the plan when:**
- After a subagent returns with results
- After switching to a new phase
- After the user changes requirements
- When uncertain about what to do next
- After context compaction or session interruption

## Delegation Protocol — Subagent Handoffs

The planning files ARE the handoff mechanism:

1. **Before dispatch:** Ensure task_plan.md reflects what the subagent will do.
2. **After return:** Subagent findings go into findings.md. Completed work logged in progress.md.
3. **If subagent fails:** Log the error in task_plan.md Errors table. Do NOT re-dispatch with the same approach.

### Subagent Envelope Pattern

Tell the subagent exactly which files to read and write:
```
Read: $SESSION_DIR/task_plan.md (Goal + Phase N), $SESSION_DIR/findings.md (## Requirements section)
Write to: $SESSION_DIR/findings.md (append ## Research Findings)
Do NOT modify: $SESSION_DIR/task_plan.md (coordinator owns this)
```

### Envelope Configuration Table

| Agent Type | Can Read | Can Write | Cannot Touch |
|------------|----------|-----------|--------------|
| Coordinator | All 3 files | task_plan.md, progress.md | (owns everything) |
| Researcher | task_plan.md (goal+phase), findings.md (all) | findings.md (append) | task_plan.md (modify) |
| Builder | task_plan.md (goal+phase) | progress.md (append) | task_plan.md, findings.md |
| Critic | All 3 files | findings.md (append findings) | task_plan.md, progress.md |

## Session Recovery

After /clear, interruption, or new session:
1. **Read all 3 files** from the session directory
2. **Cross-reference with reality** — `git diff --stat` to see what actually changed
3. **Reconcile** — Update planning files to match current state
4. **Update timestamps** — Set `last_updated` in frontmatter to current time
5. **Resume** — Continue from the current phase

### Recovery Decision Tree

```
Recovery needed?
|
+-- All 3 files exist AND last_updated < 1 hour ago?
|   +-- YES --> Quick resume: read current phase, continue
|
+-- All 3 files exist AND last_updated > 1 hour ago?
|   +-- Stale state. Cross-reference with git diff. Reconcile differences.
|
+-- Some files missing?
|   +-- Create missing from templates. Log what was missing.
|
+-- No files exist?
    +-- Fresh start. Create all 3 from templates.
```

## Error Discipline

When something fails:
1. **Log it** — Add to task_plan.md Errors Encountered table with timestamp
2. **Try once more** — Sometimes transient (network, rate limit, race condition)
3. **If it fails again, CHANGE APPROACH** — Different tool, library, method, or strategy
4. **If a third approach fails, ESCALATE** — Present what was tried and what's blocking

Do NOT silently retry the same failing action. The error table is accountability.

## Fallback Behavior — When .hivemind/ is Unavailable

This skill is designed for Hivemind projects but works everywhere:

| Condition | Behavior |
|-----------|----------|
| `.hivemind/` exists | Use `.hivemind/state/planning/<session-id>/` (canonical) |
| `.hivemind/` absent | Use `.session/<session-id>/` (fallback) |
| No session ID found | Generate UUID v4 |
| Fallback used | Log warning in progress.md: "NOTE: .hivemind/ not found. Using .session/ fallback." |

The fallback ensures this skill is useful in any skills-compatible environment, not just Hivemind-initialized projects.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Todo Relier** | Uses in-memory todo lists as sole memory | Mirror tasks into task_plan.md phases |
| **The Goal Forgetter** | States goals once, never re-reads | Re-read task_plan.md at phase boundaries |
| **The Error Hider** | Doesn't log failures | Log every error in the Errors table |
| **The Plan Bloater** | Writes web content or large code blocks to task_plan.md | findings.md is for research data. Keep plan lean. |
| **The Plan Skipper** | Starts execution without a plan | Create the plan first, even if minimal |
| **The Skill Writer** | Creates files in skill directories | Skills are read-only. Write to session directory. |
| **The Session Sprawler** | Creates files flat in project root | Use session directory. Never write task_plan.md to project root. |
| **The Path Hardcoder** | Uses absolute paths or hardcoded session IDs | Use $SESSION_DIR. Read session ID from state. |
| **The Concurrency Ignorer** | Multiple agents writing to same file without envelope | Use Subagent Envelope Pattern. Declare boundaries. |

## Cross-References

### Pipeline Integration

| Related Skill | Boundary |
|---------------|----------|
| `hm-user-intent-interactive-loop` | hm-user-intent-interactive-loop clarifies requirements. This skill persists those requirements into findings.md. |
| `hm-spec-driven-authoring` | hm-spec-driven-authoring locks falsifiable requirements. This skill stores them as decisions in task_plan.md. |
| `hm-coordinating-loop` | hm-coordinating-loop dispatches subagents. This skill provides the handoff mechanism (see Delegation Protocol). |
| `hm-phase-execution` | hm-phase-execution executes phase plans. This skill tracks execution progress in progress.md. |
| `hm-phase-loop` | hm-phase-loop iterates on phases. This skill provides the context schema for loop iterations. |
| `hm-test-driven-execution` | hm-test-driven-execution runs RED/GREEN/REFACTOR cycles. This skill tracks test status in progress.md. |
| `hm-completion-looping` | hm-completion-looping guards against premature completion. This skill tracks completion state in task_plan.md. |
| `hm-subagent-delegation-patterns` | hm-subagent-delegation-patterns defines dispatch protocols. This skill provides the file-based handoff surface. |
| `hm-debug` | hm-debug tracks debug session state. This skill stores debug findings and state transitions. |
| `hm-refactor` | hm-refactor adds refactor steps. This skill stores refactor plans in task_plan.md. |
| `hm-research-chain` | hm-research-chain produces research artifacts. This skill stores findings in findings.md. |
| `hf-meta-builder` | hf-meta-builder routes skill creation requests. This skill stores creation plans and audit results. |
| `hf-delegation-gates` | hf-delegation-gates enforces authorization gates. This skill reads gate state from task_plan.md. |

### NOT Coupled

| Skill | Why Separated |
|-------|---------------|
| `hm-planning-with-files` | This skill replaces it. The disabled skill is archived at `.opencode/retired/`. |
| `hm-brainstorm` | SE-3 skill. Will consume hm-planning-persistence for brainstorm artifact storage. |
| `hm-plan-generator` | [future deliverable — SE-10+] Plan generation skill. Will write generated plans through this persistence layer. |
| `gsd-code-review` | Code review handled by GSD agent (gsd-code-review), not an hm-* skill. Review findings written to findings.md. |
| `hm-gate-orchestrator` | SE-5 skill. Gate validation reads task status from task_plan.md for gate evidence. |

## Kit Bundle Contents

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Entry point with procedural workflow and pipeline contract |
| `references/file-formats.md` | Canonical format definitions for all 3 files |
| `references/state-transitions.md` | Valid state transitions with preconditions |
| `references/metadata-schema.json` | JSON Schema for session metadata validation |
| `templates/task_plan.md` | Template with goal + phases + decisions structure |
| `templates/findings.md` | Template with research + discoveries sections |
| `templates/progress.md` | Template with session log + errors + handoffs |
| `research/design-decisions.md` | Design rationale for all architectural choices (D-08) |

## Self-Correction

### When the Task Keeps Failing

[Detection] If planning files become corrupted or inconsistent, first check which file is the source of truth — task_plan.md is authoritative for goals and phases, findings.md for research, progress.md for session history. Reconstruct the most critical file first (task_plan.md), then regenerate findings and progress from git history and session context. If a subagent writes to files it shouldn't (e.g., builder modifying task_plan.md), revert the unauthorized changes and re-dispatch with stricter envelope boundaries.

[Recovery] Reconstruct from git history if files are corrupted. task_plan.md is the reconstruction priority. Revert unauthorized writes and tighten envelope permissions.

### When Unsure About the Next Step

[Detection] If you cannot determine which ceremony level to use (INIT/CHECKPOINT/ABSORB/PIVOT/LIGHT), default to CHECKPOINT — it's the safest option when state is uncertain. Read task_plan.md to re-orient before deciding. If you're between phases and unsure whether to update progress.md, update it — over-documenting is better than losing state. If you can't find the session directory, check both `.hivemind/state/planning/` (canonical) and `.session/` (fallback).

[Recovery] Default to CHECKPOINT when uncertain. Re-read task_plan.md for orientation. Check both canonical and fallback session directories.

### When the User Contradicts Skill Guidance

[Detection] If the user wants to skip planning and execute directly, warn that work without a plan cannot be reliably resumed after interruption — but if the task is genuinely simple (single file, known approach), create a minimal task_plan.md with just Goal + 1 phase. If the user wants to use a different memory system or directory, adapt the file paths but maintain the 3-file structure — the pattern matters more than the specific location. If the user says the existing plan is wrong, update it to match their current intent rather than arguing — the plan serves the user's goals, not the other way around.

[Recovery] Create minimal plans for simple tasks. Adapt paths while preserving 3-file structure. Update plans to match user's current intent.

### When an Edge Case Is Encountered

[Detection] If `.hivemind/` doesn't exist and `.session/` fallback is also unavailable, create a session directory in the project root with a clear name (e.g., `.planning-session-<timestamp>/`) and log the degraded state. If multiple coordinators are writing to the same session directory (race condition), detect the conflict by checking file modification timestamps and append-only sections — findings.md and progress.md are append-only, task_plan.md is the only file that should be overwritten. If a session spans multiple git branches, include the branch name in the session metadata to prevent cross-branch state confusion.

[Recovery] Use timestamped fallback directory when both canonical and standard fallback are unavailable. Detect race conditions via timestamps. Include branch name in multi-branch session metadata.
