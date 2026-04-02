# Session Lifecycle: Create → Update → Compact → Recover

How planning files evolve from task start through completion, including recovery after interruption.

---

## Lifecycle States

```
NEW → ACTIVE → UPDATING → COMPACTING → COMPLETE → ARCHIVED
```

### NEW
No planning files exist. The Agent has not yet started planning.

**Transition trigger:** User requests a multi-step task or the Agent detects complexity >5 tool calls.

**Actions:**
1. Create `task_plan.md` with goal and initial phases.
2. Create `findings.md` with requirements section.
3. Create `progress.md` with session header.
4. Set Phase 1 status to `in_progress`, all others to `pending`.

### ACTIVE
Planning files exist. The Agent is working through phases.

**Transition trigger:** Planning files created and first phase started.

**Actions during ACTIVE state:**
- Re-read `task_plan.md` before every major decision.
- Write discoveries to `findings.md` after every 2 view/search operations.
- Update `progress.md` after each phase transition.
- Update `task_plan.md` phase status: `in_progress` → `complete`.

### UPDATING
A phase has just completed. The Agent is recording what happened.

**Transition trigger:** Phase work finishes (all checkboxes checked).

**Actions:**
1. Mark phase `**Status:**` as `complete` in `task_plan.md`.
2. Set next phase `**Status:**` to `in_progress` in `task_plan.md`.
3. Update `## Current Phase` to the new phase number.
4. Add phase summary to `progress.md` under current session.
5. Log any errors encountered during the phase.

### COMPACTING
Context window is filling up. The Agent needs to refresh goals without losing state.

**Transition trigger:** Context approaching limits, or Agent detects goal drift.

**Actions:**
1. Re-read `task_plan.md` in full — this is the goal-refresh mechanism.
2. Re-read `findings.md` if research context is needed.
3. Trim verbose sections from `progress.md` (keep pointers, drop full outputs).
4. Verify `## Current Phase` matches actual work state.

### COMPLETE
All phases marked `complete`. No `in_progress` or `pending` phases remain.

**Transition trigger:** Last phase status set to `complete`.

**Actions:**
1. Run `scripts/check-complete.sh` to verify.
2. Add final summary to `progress.md`.
3. If user has additional work, add new phases and return to ACTIVE.
4. If task is truly done, transition to ARCHIVED.

### ARCHIVED
Task is done. Planning files are preserved for reference but no longer active.

**Transition trigger:** Task delivered and user confirms completion.

**Actions:**
- Do not delete planning files. They serve as reference for future similar tasks.
- If git-tracked, commit the final state of all three files.

---

## Recovery After Interruption

### Scenario: `/clear` Command

The Agent's context window is wiped. Planning files on disk survive.

**Recovery steps:**
1. Check if `task_plan.md` exists in project root.
2. If yes: read all three planning files.
3. Identify `## Current Phase` and its `**Status:**`.
4. Run `git diff --stat` to see code changes since last plan update.
5. Reconcile: mark any completed phases that weren't recorded.
6. Resume from the current phase.

### Scenario: Session Timeout / Disconnection

The Agent was interrupted mid-phase. Some work may be unsaved.

**Recovery steps:**
1. Run `scripts/session-catchup.py` to detect unsynced context.
2. Read all three planning files.
3. Check git status for uncommitted changes.
4. If catchup report shows unsynced work:
   - Review what was done but not recorded.
   - Update `progress.md` with missing actions.
   - Update `task_plan.md` if phases were completed.
5. Resume from the current phase.

### Scenario: New Session, Existing Task

The Agent starts fresh but planning files from a previous session exist.

**Recovery steps:**
1. Read `task_plan.md` — this is the goal-refresh entry point.
2. Read `findings.md` — understand what has been discovered.
3. Read `progress.md` — understand what has been done.
4. Run `git log --oneline -10` to see recent commits.
5. Cross-reference git history with `progress.md` entries.
6. If gaps found: update `progress.md` to match reality.
7. Resume from `## Current Phase`.

---

## The 5-Question Reboot Test

After any recovery, the Agent should be able to answer:

| Question | Answer Source |
|----------|---------------|
| Where am I? | `## Current Phase` in `task_plan.md` |
| Where am I going? | Remaining phases in `task_plan.md` |
| What's the goal? | `## Goal` in `task_plan.md` |
| What have I learned? | `findings.md` |
| What have I done? | `progress.md` |

If any answer is unclear, the planning files need updating before proceeding.

---

## State Transition Diagram

```
                    ┌─────────────┐
                    │    NEW      │
                    └──────┬──────┘
                           │ Create files
                           ▼
                    ┌─────────────┐
              ┌─────│   ACTIVE    │─────┐
              │     └──────┬──────┘     │
              │            │ Phase done │
              │            ▼            │
              │     ┌─────────────┐     │
              │     │  UPDATING   │     │
              │     └──────┬──────┘     │
              │            │ Next phase │
              │            ▼            │
              │     ┌─────────────┐     │
              ├─────│   ACTIVE    │─────┤
              │     └──────┬──────┘     │
              │            │ Context full
              │            ▼            │
              │     ┌─────────────┐     │
              │     │ COMPACTING  │     │
              │     └──────┬──────┘     │
              │            │ Refreshed  │
              │            ▼            │
              │     ┌─────────────┐     │
              ├─────│   ACTIVE    │─────┤
              │     └──────┬──────┘     │
              │            │ All done   │
              │            ▼            │
              │     ┌─────────────┐     │
              │     │  COMPLETE   │     │
              │     └──────┬──────┘     │
              │            │ Confirmed  │
              │            ▼            │
              │     ┌─────────────┐     │
              └─────│  ARCHIVED   │◄────┘
                    └─────────────┘
```

---

## Compaction Rules

When context grows too large, compress strategically:

1. **Keep pointers, drop content** — Keep URLs and file paths. Drop full page contents.
2. **Preserve phase status** — Never lose track of which phases are complete.
3. **Preserve error log** — Failed attempts prevent repetition.
4. **Preserve decisions** — Rationale tables are high-value, low-size.
5. **Drop verbose outputs** — Replace full tool outputs with "See findings.md §X".
