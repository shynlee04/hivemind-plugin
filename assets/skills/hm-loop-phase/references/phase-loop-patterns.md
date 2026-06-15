# Phase Loop Patterns

The 5 patterns for running iterative phase loops with bounded iteration.

## Pattern 1: Iterative Refinement

**Use**: A phase that loops until quality threshold is met.

```
phase → check → meets threshold? → yes: exit | no: refine → phase
```

### Protocol
1. Run the phase
2. Check the quality threshold (e.g., test coverage, lint pass)
3. If met, exit. If not, refine (improve weakest area) and re-run
4. Track iteration count. Max 5.

## Pattern 2: Convergence Loop

**Use**: Multiple agents converge on a single answer (e.g., best spec).

```
3 agents propose → judge picks best → re-prompt 3 agents with feedback → repeat
```

### Protocol
1. Spawn 3 agents with same input
2. Judge compares outputs
3. Pick best, feed back as critique
4. Re-spawn 3 agents with critique
5. Repeat until convergence or max iterations

## Pattern 3: Checkpoint Recovery

**Use**: Multi-hour phase that must survive disconnects.

```
start → checkpoint every N steps → on disconnect, resume from last checkpoint
```

### Protocol
1. Persist cursor state to `.hivemind/state/loops/<id>/cursor.json` every N steps
2. On resume, read cursor, continue from there
3. Validate: did the last checkpoint actually commit? If not, redo.

## Pattern 4: Bounded Iteration

**Use**: Phase that runs N times then exits, no condition.

```
start → loop N times → aggregate → exit
```

### Protocol
1. Define N upfront. Default 3, max 5.
2. Run phase N times
3. Aggregate results (best, average, majority)
4. Exit

## Pattern 5: Exit Criteria

**Use**: Phase that runs until a literal condition is met.

```
while not <condition>: run phase
```

### Protocol
1. Define condition literally. "Exit when: all REQs have acceptance tests."
2. Run phase, check condition
3. If not met, refine and re-run
4. If condition not converging, escalate

## Hivemind Tool Integration

| Pattern | Primary tool |
|---|---|
| 1, 2, 4 | `delegate-task` for parallel agents |
| 3 | `hivemind-trajectory` for checkpoint events |
| 5 | `delegate-task` + `delegation-status` for poll-loop |
| All | `hivemind-sdk-supervisor` for runtime pressure check |
