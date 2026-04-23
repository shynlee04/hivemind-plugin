---
name: hm-planning-with-files
description: Persist task state across sessions with a 3-file external memory system. Use when planning complex tasks, recovering after context loss, or handing off between agents. NOT for simple one-step tasks or in-memory todo lists.
metadata:
  layer: "2"
  role: "persistent-memory"
  pattern: P3
  version: "2.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Planning with Files

## The Iron Law

```
The filesystem IS persistent memory. Before any non-trivial change, read the plan.
```

## Why This Skill Exists

LLM context windows are volatile RAM. When orchestrating a multi-step task — especially one involving subagent delegation, multiple sessions, or recovery from interruptions — external memory is essential. The filesystem IS that memory.

This skill provides a 3-file system that acts as persistent brain:
- **task_plan.md** — Where you're going (goal + phases + decisions)
- **findings.md** — What you've learned (research + technical discoveries)
- **progress.md** — What you've done (session log + errors + handoffs)

Any agent can pick up exactly where work left off by reading these 3 files.

## Reference Map

| File | When to Read |
|------|-------------|
| `references/file-templates.md` | Need the exact markdown templates for all 3 files |
| `references/phase-schemas.md` | Need phase patterns by task type (research, debug, feature, etc.) |
| `references/session-context-protocol.md` | Need cross-session checkpoint schema and context propagation rules |

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

1. **Check for existing planning files:** `ls task_plan.md findings.md progress.md 2>/dev/null`
2. **If all 3 exist** — Read all 3. Resume from the current phase.
3. **If some exist** — Read what's there. Create missing files using templates from `references/file-templates.md`.
4. **If none exist** — Create all 3. Fill in the Goal from the user's request.

**Gate:** Do not proceed with execution until `task_plan.md` has a Goal and at least one phase defined.

## The Core Discipline: Read Before Write

Before making any non-trivial change, **read task_plan.md** (at minimum the Goal and Current Phase sections).

Context compaction, subagent returns, and user interruptions all cause drift. The plan file is the anchor.

**Re-read the plan when:**
- After a subagent returns with results
- After switching to a new phase
- After the user changes requirements
- When uncertain about what to do next

## Delegation Protocol — Subagent Handoffs

The planning files ARE the handoff mechanism:

1. **Before dispatch:** Ensure task_plan.md reflects what the subagent will do.
2. **After return:** Subagent findings go into findings.md. Completed work logged in progress.md.
3. **If subagent fails:** Log the error in task_plan.md. Do NOT re-dispatch with the same approach.

### Subagent Envelope Pattern

Tell the subagent exactly which files to read and write:
```
Read: task_plan.md (Goal + Phase N), findings.md (## Requirements section)
Write to: findings.md (append ## Research Findings)
Do NOT modify: task_plan.md (coordinator owns this)
```

## Session Recovery

After /clear, interruption, or new session:
1. **Read all 3 files**
2. **Read session context** — `.hivemind/state/session-context-prompt.md` (see `references/session-context-protocol.md`)
3. **Cross-reference with reality** — `git diff --stat` to see what actually changed
4. **Reconcile** — Update planning files to match current state
5. **Resume** — Continue from the current phase

## Session Context Integration

For multi-session or multi-phase projects, the 3-file system is supplemented by a **session context file** (`.hivemind/state/session-context-prompt.md`). This file tracks:
- Phase history and outcomes across sessions
- Persistent constraints and goals
- Checkpoint state for loop iterations

**When to use session context:**
- Starting a new phase in a multi-phase project
- Resuming after interruption
- Handing off between subagents that need shared state

See `references/session-context-protocol.md` for the full schema, checkpoint types, and propagation rules.

## Error Discipline

When something fails:
1. **Log it** — Add to task_plan.md Errors Encountered table
2. **Try once more** — Sometimes transient
3. **If it fails again, CHANGE APPROACH** — Different tool, library, method
4. **If a third approach fails, ESCALATE** — Present what was tried

Do NOT silently retry the same failing action.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Todo Relier** | Uses TodoWrite as sole memory | Mirror todo items into task_plan.md phases |
| **The Goal Forgetter** | States goals once, never re-reads | Re-read task_plan.md at phase boundaries |
| **The Error Hider** | Doesn't log failures | Log every error in the Errors table |
| **The Plan BLOATER** | Writes web content to task_plan.md | findings.md is for research data. Keep plan lean. |
| **The Plan Skipper** | Starts execution without a plan | Create the plan first, even if minimal |
| **The Skill Writer** | Creates files in skill directories | Skills are read-only. Write to project root. |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | hm-coordinating-loop dispatches subagents. This skill provides the handoff mechanism those subagents use. |
| `hm-user-intent-interactive-loop` | hm-user-intent-interactive-loop clarifies requirements. This skill persists those requirements into findings.md. |
| `hm-phase-loop` | hm-phase-loop owns iterative loop semantics. This skill provides the context schema that loop iterations read/write. |
