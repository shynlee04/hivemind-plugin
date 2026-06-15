# Phase Loop Workflow

The 7-step workflow for running a bounded phase loop.

## Step 1: Define the Loop

Choose the pattern (see `references/phase-loop-patterns.md`):
- Iterative refinement
- Convergence
- Checkpoint recovery
- Bounded iteration
- Exit criteria

## Step 2: Set Iteration Budget

- Default: 3 iterations
- Max: 5 (per `hm-gate-triad` cap)
- Track in cursor: `iteration: 0`

## Step 3: Initialize Cursor

Save to `.hivemind/state/loops/<loop_id>/cursor.yaml` per
`templates/phase-cursor.md`. Includes:
- Input/output artifacts
- Locked decisions
- Open questions

## Step 4: Run Iteration

Each iteration:
1. Read cursor (state)
2. Execute phase
3. Update cursor (add to completed_steps)
4. Check exit condition
5. If met → DONE
6. If not → refine, increment iteration

## Step 5: Persist After Every Step

```bash
yq -i '.iteration = '"$ITERATION"' .hivemind/state/loops/'$LOOP_ID'/cursor.yaml'
yq -i '.last_checkpoint = "'"$(date -Iseconds)"'" .hivemind/state/loops/'$LOOP_ID'/cursor.yaml'
```

## Step 6: At Iteration 3

WARN. "2 iterations remaining. Check if approach needs change."

## Step 7: At Iteration 5 (HARD STOP)

If exit condition not met:
1. Summarize what was tried
2. List remaining work
3. Options: (a) user takes over, (b) change approach, (c) accept partial
4. Escalate to user via `hivemind-steer`

## Tools Used (Hivemind Custom)

- `delegate-task` — dispatch phase agents
- `delegation-status` — poll completion
- `hivemind-trajectory` — record iteration events
- `hivemind-sdk-supervisor` — runtime pressure check
- `hivemind-steer` — escalate to user

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| No cursor | Disconnect = total loss | Persist every step |
| Max iterations > 5 | Loop theater | Hard cap 5 |
| No exit condition | Unbounded | Define literal condition |
| Skip iteration count | Loses track | Always increment + persist |
| Same iteration count despite refinement | Stuck | Change approach at iter 3 |
