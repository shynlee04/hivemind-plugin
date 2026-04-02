# Ralph-Loop Integration

Scripting patterns, hooks, and automation for iterative agent-driven development loops.

---

## What Is the Ralph-Loop Pattern?

The ralph-loop pattern is a **programmatic, measurable** approach to agent-driven development:

1. **Define features as user stories** with testable acceptance criteria.
2. **Run AI agents in a loop** until all stories pass.
3. **Scripts verify phase completion** — not subjective judgment.
4. **Hooks automate lifecycle events** — pre-dispatch, post-completion, on-failure.

The pattern comes from the [fullstackrecipes ralph-loop](https://fullstackrecipes.com/recipes/ralph-setup) ecosystem and is adapted here for cross-platform coordination.

---

## Core Components

### 1. User Stories (Input)

Each feature is defined as a JSON file with acceptance criteria:

```json
{
  "id": "US-001",
  "title": "Agent can dispatch parallel tasks",
  "acceptance": [
    "Given 3 independent tasks, when dispatched, then all 3 run concurrently",
    "Given related tasks, when dispatched, then they run sequentially",
    "Given a task with shared files, when dispatched, then scope conflict is detected"
  ],
  "status": "pending"
}
```

### 2. Phase Verification Script (Gate)

`check-complete.sh` — validates whether the current phase is complete:

```bash
#!/usr/bin/env bash
# check-complete.sh — Verify all acceptance criteria for current phase
# Usage: ./check-complete.sh <phase-name>

set -euo pipefail

PHASE="${1:?Phase name required}"
STORIES_DIR="${STORIES_DIR:-.stories}"

echo "[ralph-loop] Checking phase: $PHASE"

PASS=0
FAIL=0

for story in "$STORIES_DIR"/*.json; do
  status=$(jq -r '.status' "$story")
  if [[ "$status" == "passed" ]]; then
    PASS=$((PASS + 1))
  elif [[ "$status" == "pending" || "$status" == "failed" ]]; then
    FAIL=$((FAIL + 1))
    echo "  FAIL: $(jq -r '.title' "$story") — status: $status"
  fi
done

echo "[ralph-loop] Phase $PHASE: $PASS passed, $FAIL remaining"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi

echo "[ralph-loop] Phase $PHASE complete ✓"
exit 0
```

### 3. Session Init Script (Setup)

`init-session.sh` — initializes planning files for a new coordination session:

```bash
#!/usr/bin/env bash
# init-session.sh — Initialize session tracking files
# Usage: ./init-session.sh <session-name>

set -euo pipefail

SESSION="${1:?Session name required}"
DATE=$(date +%Y-%m-%d)

mkdir -p ".coordination/$SESSION"

cat > ".coordination/$SESSION/task_plan.md" << EOF
# Task Plan: $SESSION
# Date: $DATE

## Current Phase: ASSESS
## Goals:
- [ ] Identify all tasks
- [ ] Group by independence
- [ ] Decide execution mode

## Locked Decisions:
(none yet)

## Blockers:
(none yet)
EOF

cat > ".coordination/$SESSION/findings.md" << EOF
# Findings: $SESSION
# Date: $DATE

(Research and discovered facts go here)
EOF

cat > ".coordination/$SESSION/progress.md" << EOF
# Progress: $SESSION
# Date: $DATE

## Timeline
- $(date '+%H:%M') — Session initialized, phase: ASSESS
EOF

echo "[ralph-loop] Session '$SESSION' initialized at .coordination/$SESSION/"
```

---

## Hook Integration

Hooks automate lifecycle events in the coordination loop:

### Pre-Dispatch Hook

Runs before each child agent is dispatched:

```bash
#!/usr/bin/env bash
# pre-dispatch.sh — Validate task envelope before dispatch
# Called with: ./pre-dispatch.sh <task-id> <agent-name>

TASK_ID="${1:?Task ID required}"
AGENT="${2:?Agent name required}"

echo "[hook:pre-dispatch] Task $TASK_ID → Agent $AGENT"

# Verify task envelope exists
if [[ ! -f ".coordination/tasks/$TASK_ID.md" ]]; then
  echo "[hook:pre-dispatch] ERROR: Task envelope not found for $TASK_ID"
  exit 1
fi

# Verify scope boundaries are defined
if ! grep -q "## Scope" ".coordination/tasks/$TASK_ID.md"; then
  echo "[hook:pre-dispatch] ERROR: No scope boundaries defined for $TASK_ID"
  exit 1
fi

echo "[hook:pre-dispatch] Task $TASK_ID validated ✓"
exit 0
```

### Post-Completion Hook

Runs after each child agent returns:

```bash
#!/usr/bin/env bash
# post-completion.sh — Record child agent result
# Called with: ./post-completion.sh <task-id> <status> <summary-file>

TASK_ID="${1:?Task ID required}"
STATUS="${2:?Status required}"
SUMMARY="${3:?Summary file required}"

echo "[hook:post-completion] Task $TASK_ID → $STATUS"

# Append to progress log
echo "- $(date '+%H:%M') — Task $TASK_ID completed: $STATUS (see $SUMMARY)" \
  >> ".coordination/$(basename "$(pwd)")/progress.md"

# Update story status if applicable
STORY_FILE=$(grep -l "$TASK_ID" .stories/*.json 2>/dev/null || true)
if [[ -n "$STORY_FILE" ]]; then
  jq --arg s "$STATUS" '.status = $s' "$STORY_FILE" > "$STORY_FILE.tmp" && \
    mv "$STORY_FILE.tmp" "$STORY_FILE"
fi

exit 0
```

### Stop Hook

Runs when the loop must terminate (success or failure):

```bash
#!/usr/bin/env bash
# stop.sh — Finalize coordination session
# Called with: ./stop.sh <session-name> <exit-code>

SESSION="${1:?Session name required}"
EXIT_CODE="${2:-0}"

echo "[hook:stop] Session '$SESSION' ending with exit code $EXIT_CODE"

if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo "[hook:stop] All gates passed ✓"
else
  echo "[hook:stop] Some gates failed — review progress.md"
fi

# Write final summary
cat >> ".coordination/$SESSION/progress.md" << EOF

## Session Complete
- Exit code: $EXIT_CODE
- Completed: $(date '+%Y-%m-%d %H:%M')
EOF

exit 0
```

---

## Loop State Management

Track coordination state across turns and sessions:

### State File Format

```json
{
  "session": "coordinating-loop-2026-04-03",
  "phase": "DISPATCH",
  "gates": {
    "G1_assess": "passed",
    "G2_dispatch": "in_progress",
    "G3_monitor": "pending",
    "G4_integrate": "pending",
    "G5_verify": "pending"
  },
  "children": [
    {
      "id": "child-1",
      "task": "Fix auth.test.ts",
      "status": "running",
      "dispatched_at": "2026-04-03T10:00:00Z"
    }
  ],
  "retries": {},
  "last_updated": "2026-04-03T10:05:00Z"
}
```

### State Transitions

```
ASSESS → DISPATCH → MONITOR → INTEGRATE → VERIFY
   ↑                                        |
   └──────────── (if VERIFY fails) ─────────┘
```

**Rules:**
- Each phase must complete before the next begins.
- If VERIFY fails, loop back to the phase where the failure originated.
- Maximum 3 full loop cycles before escalation.
- State is written to disk after every transition.

---

## Integration with Coordination Gates

The ralph-loop pattern maps directly to the coordination gate system:

| Ralph-Loop Element | Coordination Gate | Verification |
|-------------------|-------------------|--------------|
| User stories defined | G1: Assess | `check-complete.sh assess` |
| Agents dispatched | G2: Dispatch | All task envelopes validated |
| Progress tracked | G3: Monitor | No hung agents, budgets respected |
| Results merged | G4: Integrate | No conflicts, validation passes |
| Acceptance criteria met | G5: Verify | `check-complete.sh verify` |

**All gates must pass** before the loop exits. This is the programmatic, measurable guarantee that the ralph-loop pattern provides.

---

## Cross-References

- `references/01-handoff-protocols.md` — Task Envelope format used in dispatch phase
- `references/02-sequential-vs-parallel.md` — Execution mode decided in assess phase
- `references/03-parent-child-cycles.md` — Parent monitors children during monitor phase
- `scripts/coordination-check.sh` — Validates gate passage
- `scripts/loop-status.sh` — Reports current loop phase
- `dispatching-parallel-agents` skill — Underlying dispatch pattern
- `planning-with-files` skill — task_plan.md, findings.md, progress.md integration
