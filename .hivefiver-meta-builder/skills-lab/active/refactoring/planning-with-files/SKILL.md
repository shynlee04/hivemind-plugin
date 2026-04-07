---
name: planning-with-files
description: >
  This skill should be used when the agent is managing a multi-step task that spans
  more than one session, involves delegation to subagents, or needs to survive context
  compaction. It provides a 3-file external memory system (task_plan.md, findings.md,
  progress.md) that prevents goal drift across orchestrator-to-subagent handoffs.
  Activate when the user says "plan this", "break down", "organize", when dispatching
  subagents on a complex task, when recovering after /clear or interruption, or when
  a task touches 3+ files. Do NOT activate for single-file edits, simple questions,
  or one-command operations.
metadata:
  layer: "2"
  role: "persistent-memory"
  pattern: P3
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Planning with Files

## Why This Skill Exists

LLM context windows are volatile RAM. When orchestrating a multi-step task — especially
one involving subagent delegation, multiple sessions, or recovery from interruptions —
external memory is essential. The filesystem IS that memory.

This skill provides a 3-file system that acts as persistent brain:
- **task_plan.md** — Where you're going (goal + phases + decisions)
- **findings.md** — What you've learned (research + technical discoveries)
- **progress.md** — What you've done (session log + errors + handoffs)

Any agent — the orchestrator, a subagent, or a future session — can pick up exactly
where work left off by reading 3 files.

## Tiered Response — Not Everything Needs Full Ritual

Different situations need different ceremony levels. Don't force a full checkpoint
on every action. Use this decision tree:

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
|   +-- YES --> ABSORB: Write findings.md, update task_plan.md phase status,
|                 log in progress.md
|
+-- Did something fail or change direction?
|   +-- YES --> PIVOT: Log error in task_plan.md, update findings.md,
|                 add new phase if needed
|
+-- About to hand off to user or end session?
|   +-- YES --> HANDOFF: Archive current state, write resume instructions
|                 in progress.md
|
+-- Just doing routine work within current phase?
    +-- LIGHT: Update progress.md with action taken. No full checkpoint needed.
```

## First Action — When Skill Loads

1. **Check for existing planning files:** `ls task_plan.md findings.md progress.md 2>/dev/null`
2. **If all 3 exist** — Read all 3. Resume from the current phase. Full context restored.
3. **If some exist** — Read what's there. Create missing files using skeletons below.
4. **If none exist** — Create all 3 with skeleton structure. Fill in the Goal from the
   user's request before doing anything else.

**Gate:** Do not proceed with execution until `task_plan.md` has a Goal and at least
one phase defined. If mid-action without having read the plan in this session, stop
and read it.

## File Structure

### task_plan.md — The North Star

Answers: "Where am I, where am I going, and what decisions got me here?"

```markdown
# Task Plan: [Descriptive Title]

## Goal
[One sentence. The north star. Every action should move toward this.]

## Current Phase
Phase N: [name]

## Phases

### Phase 1: [Descriptive name, not "Phase 1"]
- [ ] Specific deliverable
- [ ] Specific deliverable
**Status:** pending | in_progress | complete

### Phase 2: [Descriptive name]
- [ ] ...
**Status:** pending

## Decisions Made
| Decision | Rationale | When |
|----------|-----------|------|
| Used X over Y | Because Z | Phase 1 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| FileNotFoundError | 1 | Created default |
```

### findings.md — The Knowledge Store

Answers: "What have I learned that's too important to lose?"

```markdown
# Findings: [Task Title]

## Requirements
[What the user actually needs, extracted from conversation]

## Research Findings
[Key discoveries from exploration, web searches, code analysis]

## Technical Decisions
| Choice | Rationale | Reference |
|--------|-----------|-----------|
| X over Y | Because Z | file:line or URL |

## Resources
[URLs, file paths, API references discovered during work]
```

Critical rule: Web/search results go here, NOT in task_plan.md. Keep the plan lean.

### progress.md — The Session Log

Answers: "What happened, when, and what's the handoff?"

```markdown
# Progress: [Task Title]

## Session: [Date]
### Phase: [current phase name]
- **Started:** [time or relative marker]
- **Actions:**
  - Did X (result: Y)
  - Did Z (result: W)
- **Files Modified:** file1.ts, file2.ts
- **Errors:** [any errors encountered]
- **Handoff:** [what the next agent/session needs to know]
```

## The Core Discipline: Read Before Write

The single most important behavior: **before making any non-trivial change, read
task_plan.md** (at minimum the Goal and Current Phase sections).

Context compaction, subagent returns, and user interruptions all cause drift. The
plan file is the anchor. No counter needed — use judgment. If it's been a while
since reading the plan, read it.

**Specific trigger points where re-reading the plan is recommended:**
- After a subagent returns with results
- After switching to a new phase
- After the user changes requirements
- When uncertain about what to do next
- After a long research/exploration session

## Delegation Protocol — Subagent Handoffs

When dispatching a subagent, the planning files ARE the handoff mechanism:

1. **Before dispatch:** Ensure task_plan.md reflects what the subagent will do. Add
   the subagent's scope as a phase or sub-task.
2. **After return:** Subagent findings go into findings.md. Completed work gets logged
   in progress.md. Update phase status in task_plan.md.
3. **If subagent fails:** Log the error in task_plan.md (Errors Encountered). Do NOT
   re-dispatch with the same approach. Change the method.

### Subagent Envelope Pattern

When dispatching, tell the subagent exactly which files to read and write:
```
Read: task_plan.md (Goal + Phase N), findings.md (## Requirements section)
Write to: findings.md (append ## Research Findings)
Do NOT modify: task_plan.md (coordinator owns this)
```

This prevents subagents from stomping on the plan.

## Session Recovery

After /clear, interruption, or new session:

1. **Read all 3 files** — task_plan.md, findings.md, progress.md
2. **Cross-reference with reality** — `git diff --stat` to see what actually changed
   vs what the plan says
3. **Reconcile** — Update planning files to match current state. Mark completed phases.
4. **Resume** — Continue from the current phase.

If no planning files exist, the session was lost. Ask the user what was being worked on.

## Error Discipline

When something fails:

1. **Log it** — Add to task_plan.md Errors Encountered table
2. **Try once more with the same approach** — Sometimes transient
3. **If it fails again, CHANGE APPROACH** — Different tool, different library, different method
4. **If a third approach fails, ESCALATE** — Present the user with what was tried and
   what is needed

Do NOT silently retry the same failing action. The Errors Encountered table is proof
of not spinning.

## Anti-Patterns

| Pattern | Why It's Bad | What To Do Instead |
|---------|-------------|-------------------|
| Using TodoWrite as sole memory | Todos are volatile; don't survive sessions | Mirror todo items into task_plan.md phases |
| Stating goals once, never re-reading | Context compaction eats the goal | Re-read task_plan.md at phase boundaries |
| Hiding errors | Future sessions won't know what failed | Log every error in the table |
| Writing web content to task_plan.md | Bloats the plan, buries the goal | findings.md is for research data |
| Starting execution without a plan | Guaranteed drift | Create the plan first, even if minimal |
| Creating files in skill directories | Skills are read-only | Write to project root |
| Full ritual on every action | Wastes tokens, slows work | Use tiered response (LIGHT vs CHECKPOINT) |

## Integration with Other Skills

This skill is LAYER 2. It works best with:
- **LAYER 1:** `user-intent-interactive-loop` — clarifies requirements, feeds findings.md
- **LAYER 3:** `coordinating-loop` — dispatches subagents, reads/writes planning files
- **Any domain skill** — executes work, reports back to findings.md

**Conflict resolution:** Files are source of truth. If another skill's guidance conflicts
with the planning files, trust the files — they represent accumulated context.

## Phase Schema — Adapt to Task Type

Don't force a rigid waterfall. Generate phases based on what the task needs:

| Task Type | Phase Pattern |
|-----------|--------------|
| Research | Discover, Synthesize, Deliver |
| Debugging | Reproduce, Isolate, Fix, Verify |
| Feature | Design, Implement, Test, Polish |
| Refactoring | Analyze, Restructure, Verify |
| Skill Authoring | Audit, Draft, Validate, Iterate |
| Generic | Plan, Execute, Verify |

Rules: Minimum 2 phases. Maximum 7 (beyond 7, split into sub-tasks). Each phase
needs deliverables (checkboxes) and a status field.

## The 5-Question Sanity Check

At any point, the agent should be able to answer:

| Question | Answer Source |
|----------|---------------|
| Where am I? | Current phase in task_plan.md |
| Where am I going? | Remaining phases |
| What's the goal? | Goal statement |
| What have I learned? | findings.md |
| What have I done? | progress.md |

If unable to answer all 5, re-read the files.
