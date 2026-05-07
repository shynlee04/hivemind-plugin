# Wave Protocol

## Wave Assignment

1. Wave 1: plans with depends_on: []
2. Wave N: plans whose depends_on are all in waves < N
3. Circular dependencies: rejected at validation

## Validation

```bash
# Check all depends_on exist
# Check no circular deps
# Check wave monotonicity
```

## Execution

```bash
for wave in waves; do
  for plan in wave.plans; do
    dispatch "$plan" &
  done
  wait
  validate_results || abort

done
```

## Claim Discipline

Before a plan starts, write a claim record. The claim is not a lock that blocks forever; it is evidence for recovery.

```json
{
  "phase": "<phase-id>",
  "plan": "<plan-id>",
  "wave": 1,
  "depends_on": [],
  "executor": "<agent-or-session-id>",
  "started_at": "<iso-8601>",
  "stale_after": "<iso-8601>",
  "status": "claimed"
}
```

Rules:

- A plan with unmet dependencies is not runnable.
- A plan with a live claim is not runnable by another executor.
- A stale claim can be taken over only after recording why it is stale.
- A downstream wave cannot start unless every upstream dependency has a `done` marker with verification evidence.
