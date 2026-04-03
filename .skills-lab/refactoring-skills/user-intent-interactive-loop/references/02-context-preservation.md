# Context Preservation

**Purpose:** Maintaining awareness across sessions, compactions, and interruptions. Specifies concrete file paths.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [Concrete File Paths](#concrete-file-paths)
3. [What to Persist](#what-to-persist)
4. [Persistence Protocol](#persistence-protocol)
5. [Recovery Protocol](#recovery-protocol)
6. [Compaction Handling](#compaction-handling)
7. [State Reconstruction](#state-reconstruction)
8. [Anti-Patterns](#anti-patterns)
9. [Worked Examples](#worked-examples)
10. [Cross-References](#cross-references)

---

## Core Principle

**Context is lost between turns by default. The only defense is write-to-disk.** Memory compression, session resets, and platform interruptions will erase conversational context. Files on disk survive.

The Agent must treat the filesystem as its external memory system. Every meaningful decision, discovery, and state change gets written to a named file with a clear structure.

---

## Concrete File Paths

All persistence files live under the **project root** (the directory containing the git repository root or the current working directory if not in a repo).

| File | Absolute Path Pattern | Purpose |
|------|----------------------|---------|
| Task plan | `<project-root>/task_plan.md` | Current phase, goals, locked decisions, blockers |
| Findings | `<project-root>/findings.md` | Discovered facts, analysis results, scores |
| Progress log | `<project-root>/progress.md` | Timestamped actions, decisions, recovery state |
| Checkpoints | `<project-root>/.checkpoints/<YYYY-MM-DD_HHMMSS>-<name>.md` | Session state snapshots |
| Delegation log | `<project-root>/progress.md` (section) | What was delegated, to whom, with what budget |
| Session notes | `<project-root>/.session-notes/` | Optional: per-session detailed notes |

**Path resolution rules:**
1. If in a git worktree, use the worktree root as `<project-root>`.
2. If not in git, use the current working directory.
3. Never write persistence files outside the project root.
4. Create directories (`.checkpoints/`, `.session-notes/`) on first use.

**Example paths:**
```
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/task_plan.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/findings.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/progress.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.checkpoints/2026-04-03_143022-phase1-complete.md
```

---

## What to Persist

| Artifact | Content | Update Frequency | File Path |
|----------|---------|------------------|-----------|
| `task_plan.md` | Current phase, goals, locked decisions, blockers | Every phase change | `<project-root>/task_plan.md` |
| `findings.md` | Discovered facts, analysis results, scores | Every 2-3 discoveries | `<project-root>/findings.md` |
| `progress.md` | Timestamped actions, decisions, recovery state | Every meaningful action | `<project-root>/progress.md` |
| Session notes | User's stated intent, confirmed assumptions | Every confirmation | `<project-root>/progress.md` |
| Delegation log | What was delegated, to whom, with what budget | Every dispatch/return | `<project-root>/progress.md` |
| Checkpoints | Full state snapshot | On request or phase change | `<project-root>/.checkpoints/<timestamp>-<name>.md` |

### File Templates

**`task_plan.md`** — The goal-refresh mechanism. Re-read before any major decision.

```markdown
# Task Plan

## Goal
[User's confirmed intent in 1-2 sentences]

## Current Phase
[Phase name and number, e.g., "Phase 2 of 5"]

## Phases
- [ ] Phase 1: [Name] — **Status:** pending
- [ ] Phase 2: [Name] — **Status:** pending
- [ ] Phase 3: [Name] — **Status:** pending

## Locked Decisions
- [Decision] ([reason], [timestamp])

## Blockers
- None / [description]
```

**`findings.md`** — Research and discovered facts only. No actions, no opinions.

```markdown
# Findings

## [Topic] — [YYYY-MM-DD]
- [Fact] ([source])
- [Fact] ([source])
```

**`progress.md`** — Timestamped actions, decisions, and recovery state.

```markdown
# Progress Log

## Session: [YYYY-MM-DD HH:MM]
- **Intent:** [User's stated intent]
- **Action:** [What was done]
- **Decision:** [What was decided and why]
- **State:** [Current position in the workflow]
```

---

## Persistence Protocol

### When to Write

| Trigger | Action | File |
|---------|--------|------|
| User confirms intent | Write to `progress.md` | `<project-root>/progress.md` |
| Phase changes | Update `task_plan.md` | `<project-root>/task_plan.md` |
| New fact discovered | Append to `findings.md` | `<project-root>/findings.md` |
| Decision made | Write to `progress.md` with reasoning | `<project-root>/progress.md` |
| Subagent dispatched | Write delegation details | `<project-root>/progress.md` |
| Subagent returns | Write results | `<project-root>/progress.md` |
| Blocker found | Write to `task_plan.md` blockers | `<project-root>/task_plan.md` |
| Every 5 turns | Quick state checkpoint | `<project-root>/progress.md` |

### How to Write

1. **Read the file first** — Don't overwrite, append or update in place
2. **Use clear structure** — Headers, timestamps, bullet points
3. **Be specific** — "Fixed parser bug in line 42" not "Made progress"
4. **Include reasoning** — "Chose X because Y" not just "Chose X"
5. **Date-stamp filenames** — When creating new files, use `name-YYYY-MM-DD` format

---

## Recovery Protocol

When the Agent detects a session restart, compaction, or context loss:

### Step 1: Detect the Situation

Signs of context loss:
- The Agent's own previous messages are no longer visible
- The conversation feels like it's starting over
- The user references something the Agent doesn't remember
- Platform indicates a session reset

### Step 2: Read Recovery Files (In Order)

```
1. <project-root>/task_plan.md  → What are we doing? What phase?
2. <project-root>/findings.md   → What have we learned?
3. <project-root>/progress.md   → What have we done? Where are we?
```

### Step 3: Reconstruct State

Answer the 5 Recovery Questions (write answers in `progress.md`):

1. **Where am I?** — Current phase, current file, current task
2. **Where am I going?** — Next step, next phase
3. **What's the goal?** — User's confirmed intent
4. **What have I learned?** — Key findings, decisions, constraints
5. **What have I done?** — Completed tasks, pending tasks, blockers

### Step 4: Confirm with User

> "I've recovered from a session interruption. Here's where we are:
> - Phase: [X]
> - Last completed: [Y]
> - Next step: [Z]
> - Any changes since we last spoke?"

---

## Compaction Handling

Context compaction (conversation summarization) is a special case of context loss. The Agent must prepare for it proactively.

### Before Compaction

1. Write a **compaction checkpoint** to `progress.md`:
   ```markdown
   ## Compaction Checkpoint [YYYY-MM-DD HH:MM]
   - User intent: [verbatim or close]
   - Current phase: [name]
   - Completed: [list]
   - In progress: [description]
   - Next: [specific next action]
   - Key constraints: [list]
   ```

2. Ensure `task_plan.md` is up to date
3. Ensure `findings.md` has all recent discoveries

### After Compaction

1. Read the compaction checkpoint from `progress.md`
2. Re-read `task_plan.md` for goals
3. Re-read `findings.md` for facts
4. Confirm state with user if uncertain

---

## State Reconstruction

When files exist but the Agent needs to rebuild its mental model:

### Reconstruction Algorithm

```
1. Read task_plan.md → Extract: current phase, goals, blockers
2. Read findings.md → Extract: known facts, constraints
3. Read progress.md → Extract: completed actions, pending actions
4. Cross-reference: Do completed actions match the phase?
5. If mismatch → Flag as inconsistency, ask user
6. If consistent → Resume from next pending action
```

### Inconsistency Detection

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Phase says "done" but tasks pending | Phase updated prematurely | Revert phase, complete tasks |
| Findings reference deleted files | Files moved or archived | Check `.archive/` directory |
| Progress log has gaps | Session interruption | Ask user what happened in the gap |
| task_plan.md is stale | Not updated during work | Reconstruct from progress.md |

---

## Anti-Patterns

| Pattern | What It Looks Like | Why It Fails | Fix |
|---------|-------------------|--------------|-----|
| The Amnesiac | "What were we working on?" every restart | No write-to-disk discipline | Write every turn |
| The Overwriter | Replaces files instead of appending | Loses history, can't reconstruct | Append with timestamps |
| The Hoarder | Keeps everything in conversational memory | Memory gets compressed/lost | Write to disk |
| The Stale Planner | task_plan.md never updated | Recovery reads wrong state | Update on every phase change |
| The Silent Worker | No progress log for 20 turns | Can't reconstruct what happened | Log every meaningful action |
| The Orphan Writer | Writes files no one reads | Wastes tokens, no value | Write structured, recoverable files |
| The Path Wanderer | Writes persistence files to random directories | Recovery can't find them | Always use `<project-root>/` paths |

---

## Worked Examples

### Example 1: Normal Session Flow

```
Turn 1:  User states intent → Agent writes to <project-root>/progress.md
Turn 3:  Agent discovers key fact → Appends to <project-root>/findings.md
Turn 5:  Agent completes phase 1 → Updates <project-root>/task_plan.md
Turn 7:  Agent delegates task → Writes delegation log to <project-root>/progress.md
Turn 10: Subagent returns → Writes results to <project-root>/progress.md
Turn 12: Agent completes phase 2 → Updates <project-root>/task_plan.md
Turn 15: Session checkpoint → Writes to <project-root>/.checkpoints/2026-04-03_143022-turn15.md
```

### Example 2: Recovery After Interruption

```
[Session restarts]

Agent: "Let me recover our state..."
  → Reads <project-root>/task_plan.md: "Phase 2 of 4, building the quality matrix"
  → Reads <project-root>/findings.md: "5 dimensions identified, weights assigned"
  → Reads <project-root>/progress.md: "Last action: drafted scoring rubric, pending user review"

Agent: "We were building the quality matrix. I drafted the scoring rubric
        and was waiting for your review. The rubric covers 5 dimensions
        with weighted scores. Want me to show it again, or shall we proceed?"
```

### Example 3: Compaction Preparation

```
Agent: "The conversation is getting long. Before we continue, let me save
        our state so nothing is lost."

  → Writes compaction checkpoint to <project-root>/progress.md:
    "Compaction Checkpoint 2026-04-03 14:30
     - User intent: Build GROUP 1 skills for meta-builder
     - Current phase: Creating user-intent-interactive-loop
     - Completed: SKILL.md, 3 of 4 reference files
     - In progress: Writing 04-long-session-management.md
     - Next: Complete reference file, run validation, commit
     - Key constraints: <500 lines SKILL.md, universal terminology,
       Agent not Claude, AGENTS.md not CLAUDE.md"
```

---

## Cross-References

| Topic | Reference |
|-------|-----------|
| Probing user intent (what to persist from conversations) | `01-question-protocols.md` |
| Brainstorming sessions (persisting ideation output) | `03-brainstorming-patterns.md` |
| Long session management (compaction, fatigue) | `04-long-session-management.md` |
| Git-backed memory persistence | `gcc` skill |
| File-based planning structure | `planning-with-files` skill |
