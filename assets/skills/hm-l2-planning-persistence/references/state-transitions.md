# State Transitions

> Valid state transitions for task, phase, and session lifecycles in hm-planning-persistence.
> See `references/file-formats.md` for the file structures these states apply to.

## Task States

```
                  ┌─────────┐
                  │ PLANNED │
                  └────┬────┘
                       │ start
                  ┌────▼────┐
           ┌──────│IN_PROGRESS│──────┐
           │      └────┬────┘      │
           │ complete  │           │ cancel
           │      ┌────▼────┐ ┌───▼──────┐
           │      │COMPLETED│ │CANCELLED │
           │      └─────────┘ └──────────┘
           │ block
      ┌────▼────┐
      │ BLOCKED │──── unblock ──→ IN_PROGRESS
      └─────────┘
```

### Valid Transitions

| From | To | Precondition |
|------|----|--------------|
| (none) | PLANNED | Task defined in task_plan.md |
| PLANNED | IN_PROGRESS | Prerequisites complete, dependencies resolved |
| IN_PROGRESS | COMPLETED | All deliverables produced, verification passed |
| IN_PROGRESS | BLOCKED | External dependency unavailable or error encountered |
| IN_PROGRESS | CANCELLED | Task no longer needed |
| BLOCKED | IN_PROGRESS | Blocker resolved |
| BLOCKED | CANCELLED | Task no longer needed after blocking |

### Invalid Transitions (Must Not Occur)

| From | To | Why Invalid |
|------|----|-------------|
| COMPLETED | IN_PROGRESS | Completed tasks cannot be reopened (create new task) |
| CANCELLED | IN_PROGRESS | Cancelled tasks must be re-planned |
| PLANNED | COMPLETED | Must pass through IN_PROGRESS |
| IN_PROGRESS | PLANNED | Cannot go backward to planning |

---

## Phase States

```
          ┌─────────────┐
          │ NOT_STARTED  │
          └──────┬───────┘
                 │ begin phase
          ┌──────▼───────┐
          │ IN_PROGRESS  │
          └──────┬───────┘
                 │ all tasks complete
          ┌──────▼───────┐
          │  COMPLETED   │
          └──────────────┘
```

### Valid Transitions

| From | To | Precondition |
|------|----|--------------|
| NOT_STARTED | IN_PROGRESS | Phase plan defined in task_plan.md |
| IN_PROGRESS | COMPLETED | All phase tasks COMPLETED or CANCELLED |

Phase state transitions are simpler than task states because phases only track whether work has started and whether it's done. Individual task blocking within a phase doesn't block the phase transition — it just means some tasks may be CANCELLED or BLOCKED when the phase completes.

---

## Session States

```
    ┌─────────┐
    │ ACTIVE  │
    └────┬────┘
         │ pause / interruption
    ┌────▼────┐
    │ PAUSED  │
    └────┬────┘
         │ resume
    ┌────▼────┐
    │ RESUMED │──── complete ──→ COMPLETED
    └─────────┘
         │ end
    ┌────▼────┐
    │COMPLETED│
    └─────────┘
```

### Valid Transitions

| From | To | Precondition |
|------|----|--------------|
| ACTIVE | PAUSED | Context saved to all 3 planning files |
| PAUSED | RESUMED | All 3 files valid and non-stale |
| PAUSED | COMPLETED | All phases COMPLETED |
| RESUMED | COMPLETED | All phases COMPLETED |
| ACTIVE | COMPLETED | All phases COMPLETED without interruption |

### Invalid Transitions

| From | To | Why Invalid |
|------|----|-------------|
| COMPLETED | ACTIVE | Session is done. Start new session for new work. |
| PAUSED | ACTIVE | Must go through RESUMED to verify state is valid. |

---

## Transition Rules (Enforced by Agent Behavior)

1. **Always update frontmatter before changing state.** The `updated` timestamp must reflect the transition.

2. **Log all transitions in progress.md.** Each state change gets a timestamped entry.

3. **Validate preconditions before transition.** Check that the state machine allows the move.

4. **Never skip states.** PLANNED → COMPLETED is invalid. Go through IN_PROGRESS.

5. **Blocked tasks notify.** When a task enters BLOCKED, add the blocker to the Errors table in task_plan.md.

---

## State Detection from File State

If state is ambiguous (e.g., after interruption), infer from file state:

| File State | Inferred Session State |
|------------|----------------------|
| All 3 files exist, last_updated < 1 hour | ACTIVE or RESUMED |
| All 3 files exist, last_updated > 1 hour | PAUSED (stale) |
| Some files exist | PAUSED (partial) |
| No files exist | New session |

---

## Diagram Summary (ASCII Art)

```
TASK:      PLANNED → IN_PROGRESS → COMPLETED
                        ↓
                     BLOCKED ──→ IN_PROGRESS
                        ↓
                     CANCELLED

PHASE:     NOT_STARTED → IN_PROGRESS → COMPLETED

SESSION:   ACTIVE → PAUSED → RESUMED → COMPLETED
              ↓                    ↓
           PAUSED ─────────→ COMPLETED
              (if all phases complete on resume check)
```
