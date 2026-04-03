# Ralph-Loop Integration

Scripting patterns, hooks, and automation for iterative agent-driven development loops — mapped to skill-authoring workflows.

---

## What Is the Ralph-Loop Pattern?

The ralph-loop pattern is a **programmatic, measurable** approach to agent-driven development:

1. **Define work as user stories** with testable acceptance criteria.
2. **Run AI agents in a loop** until all stories pass.
3. **Scripts verify phase completion** — not subjective judgment.
4. **Hooks automate lifecycle events** — pre-dispatch, post-completion, on-failure.

The pattern comes from the [fullstackrecipes ralph-loop](https://fullstackrecipes.com/recipes/ralph-setup) ecosystem and is adapted here for skill-authoring workflows.

---

## Mapping Ralph-Loop to Skill Authoring

The original ralph-loop uses `.stories/*.json` files for user stories. For skill authoring, the "user stories" are the deliverables of the skill pack itself.

### Skill-Authoring User Stories

Instead of JSON story files, define acceptance criteria as a checklist in `task_plan.md`:

```markdown
## Acceptance Criteria (Skill Pack)
- [ ] SKILL.md exists with valid YAML frontmatter (name, description)
- [ ] SKILL.md body contains procedural guidance (not just concepts)
- [ ] SKILL.md contains at least one worked example
- [ ] All referenced files in SKILL.md exist (references/, scripts/)
- [ ] All scripts pass `bash -n` syntax check
- [ ] All scripts are executable (chmod +x)
- [ ] No banned terminology (CLAUDE.md, "Claude" as agent name)
- [ ] Skill passes: bash the validation script against the skill directory
```

Each checkbox is a "user story." The loop runs until all checkboxes are marked.

### Phase Mapping for Skill Authoring

| Ralph-Loop Phase | Skill-Authoring Equivalent | Verification |
|-----------------|--------------------------|--------------|
| Define stories | Write acceptance criteria checklist | Checklist exists in task_plan.md |
| Implement | Write SKILL.md, references, scripts | Files exist, non-empty |
| Test | Run `bash -n`, `validate-skill.sh` | Scripts pass, validation passes |
| Verify | Check all acceptance criteria | All checkboxes marked |
| Loop if fail | Fix failures, re-run validation | Gates pass on re-check |

---

## Core Components

### 1. Session Init Script (Shipped)

`scripts/init-session.sh` — initializes planning files for a new coordination session:

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

### 2. Coordination Check Script (Shipped)

`scripts/coordination-check.sh` — validates coordination state and gate passage. See the scripts directory for the full implementation.

### 3. Loop Status Script (Shipped)

`scripts/loop-status.sh` — reports current loop phase and progress. See the scripts directory for the full implementation.

---

## Hook Integration

Hooks automate lifecycle events in the coordination loop. These are shipped as reference implementations — adapt them to your workflow.

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

## Loop Termination Conditions

The loop terminates when ANY of the following occur:

1. **All gates pass** — G1 through G5 all report "passed." Exit with success.
2. **Maximum cycles reached** — 3 full cycles through G1→G5 without all gates passing. Exit with failure, escalate to user.
3. **User intervention** — User explicitly stops the loop or changes the task. Exit immediately, save state.
4. **Unrecoverable error** — A gate fails and the failure cannot be retried (e.g., missing files, permission denied). Exit with failure, escalate to user.

**On termination, always:**
- Write final state to `.coordination/<session>/progress.md`
- Run `scripts/loop-status.sh <session>` to produce a final status report
- Summarize results to the user

---

## Cross-References

- `references/01-handoff-protocols.md` — Task Envelope format used in dispatch phase
- `references/02-sequential-vs-parallel.md` — Execution mode decided in assess phase
- `references/03-parent-child-cycles.md` — Parent monitors children during monitor phase
- `scripts/coordination-check.sh` — Validates gate passage
- `scripts/loop-status.sh` — Reports current loop phase
- `dispatching-parallel-agents` skill — Underlying dispatch pattern
- `planning-with-files` skill — task_plan.md, findings.md, progress.md integration
