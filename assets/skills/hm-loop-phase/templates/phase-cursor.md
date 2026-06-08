# Phase Loop Cursor Template

The durable cursor for a phase loop. Persist after every meaningful
step so resume works on disconnect.

```yaml
# Phase Loop Cursor
loop_id: "<unique-id>"  # e.g., "phase-24-auth-flow-2026-06-08"
phase: <phase-number>
phase_name: "<name>"
started_at: "<ISO timestamp>"
last_checkpoint: "<ISO timestamp>"
iteration: 0
max_iterations: 5
status: "running|paused|completed|blocked"

# State
completed_steps:
  - step: "<step-name>"
    completed_at: "<ISO timestamp>"
    evidence: "<file:line or path>"

# Context (preserved across resume)
input_artifacts:
  - "<file path>"
  - "<file path>"

output_artifacts:
  - "<file path>"
  - "<file path>"

# Decisions made (so resume knows what's settled)
locked_decisions:
  - decision: "<one-line>"
    made_at: "<ISO timestamp>"
    evidence: "<file:line>"

# Open questions
open_questions:
  - "<question>"

# Last error (if any)
last_error:
  message: "<error text>"
  occurred_at: "<ISO timestamp>"
  remediation: "<what to do>"

# Resume instruction
resume_from_step: "<next-step-name>"
```

## Storage

Save to `.hivemind/state/loops/<loop_id>/cursor.yaml`. After every
meaningful step.

## Loading on Resume

```bash
test -f .hivemind/state/loops/$LOOP_ID/cursor.yaml || {
  echo "No cursor; starting fresh"
}
yq -p yaml -o json .hivemind/state/loops/$LOOP_ID/cursor.yaml
```

## Why Durable Cursors

Phase loops can run for hours. Without durable state:
- Disconnect = total loss
- Compaction = total loss
- Delegation failure = state drift

Cursors enable: resume from last checkpoint, validate state, lock
decisions, track open questions.
