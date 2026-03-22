---
name: hivemind-gatekeeping-delegation
description: |
  Gatekeeping layer for multi-pass delegation. Use when: iterative loop control needed, synthesis gates required between iterations, carry-forward compression for loop state, integration verification for parallel slices, or cascading failure recovery. Extends use-hivemind-delegation with loop governance and advanced failure patterns.
---

# hivemind-gatekeeping-delegation

Gatekeeping layer for multi-pass delegation loops. Governs loop state, synthesis gates between iterations, integration verification for parallel slices, and cascading failure recovery.

## Purpose

- Enforce bounded iteration with explicit checkpoint discipline
- Gate each iteration's output before the next begins
- Compress carry-forward state to prevent context bloat
- Verify parallel slice integration before claiming completion
- Detect and recover from cascading failure patterns

## Use This For

- Iterative delegation loops that need max_iterations and stop conditions
- Multi-pass workflows where each pass depends on prior carry-forward
- Synthesis checkpoints between delegation iterations
- Parallel slice integration verification (import conflicts, type collisions, shared-state races)
- Cascading failure detection (>50% parallel failure)
- Fine-grained bead tracking within iterations

## Do Not Use This For

- Single-pass delegation — use `use-hivemind-delegation` directly
- Domain-specific delegation (TDD, debug, refactor, research) — use the domain skill
- Simple parallel dispatch without iteration — use `use-hivemind-delegation` parallel mode
- Tasks without checkpoint needs — inline execution is sufficient

## Prerequisites

- `use-hivemind-delegation` MUST be loaded first — this skill extends it with loop governance
- Familiarity with delegation packets and return contracts

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-delegation` | Base delegation protocol — this skill extends it |
| `tdd-delegation` | TDD-specific delegation — uses this for loop control within TDD phases |
| `course-correction-delegation` | Domain delegation — uses this for debug/refactor loop gating |
| `research-delegation` | Research delegation — uses this for multi-source synthesis gating |
| `hivemind-system-debug` | Debug mechanics — this skill gates debug loop iterations |
| `hivemind-codemap` | Scan mechanics — this skill gates multi-pass scan loops |

## Iterative Loop Control

Every multi-pass delegation requires a loop checkpoint before starting.

### Loop Setup

1. Set `max_iterations` — default is 10, adjust based on scope
2. Define `stop_conditions` — at least 2 conditions required
3. Initialize checkpoint at `{activity}/delegation/{loop_id}-checkpoint.json`
4. Set `cleanup_allowed: "no"` — remains no while loop is active

### Iteration Rules

- Each iteration MUST produce a `carry_forward` — ≤5 key findings + blockers + paths
- The checkpoint is the loop's memory — read it before deciding the next iteration
- Stop when any stop condition fires — never iterate past `max_iterations`
- If blocked, record `blocked_reason` and set `status: "blocked"`
- Never run parallel iterations — each depends on the previous carry-forward

### Bead Tracking

For fine-grained progress within an iteration (file-by-file, batch-by-batch):

```json
{
  "bead_id": "audit_batch_2",
  "total_items": 20,
  "completed": 14,
  "remaining": 6,
  "blocked": 0,
  "items": [
    { "path": "src/tools/runtime/tools.ts", "status": "done", "findings": 2 }
  ]
}
```

See `references/iterative-loop-control.md` for full checkpoint schema and rules.

## Carry-Forward Compression

Each iteration carries forward ONLY:

- Key findings (≤5 short statements)
- Discovered blockers
- Paths to detailed output files

Never carry full scan results — they live in their output files. The carry-forward is a summary for the next iteration's context.

Compression rules:
- If carry_forward exceeds 5 items, merge related findings
- If a finding needs explanation, store it in the output file and reference the path
- Blockers take priority over findings in carry_forward

## Synthesis Gates

After each iteration, output must pass a synthesis gate before the next iteration begins.

### Gate Checks

| Check | Pass Condition |
|-------|---------------|
| `carry_forward_populated` | carry_forward array has 1-5 items |
| `coverage_status_updated` | coverage_status reflects actual progress |
| `no_contradictions` | findings don't contradict prior iteration carry-forwards |
| `output_written` | output_path points to a valid file |

### Gate Failure Handling

1. Set gate result to `fail` or `conditional`
2. Pause the loop — `status: "paused"`
3. Emit gate failure report with specific failed checks
4. Await orchestrator decision: `continue`, `pause`, or `abort`
5. Do NOT proceed to next iteration until gate passes

See `references/synthesis-gates.md` for gate result format and detailed rules.

## Integration Verification

When parallel slices return, verify they integrate before claiming completion.

### Verification Steps

1. Run integration test suite against all results simultaneously
2. Check for import conflicts — same symbol imported from different sources
3. Check for type collisions — same type name, different definitions
4. Check for shared-state races — concurrent mutations to shared state
5. Identify which specific slice caused each conflict
6. Re-delegate only the conflicting slice — do not re-delegate all

See `references/integration-verification.md` for verification procedures.

## Advanced Failure Recovery

### Cascading Failure

When >50% of parallel slices fail:
1. Stop all remaining slices
2. Reassess task decomposition — slices may be incorrectly scoped
3. Identify shared root cause across failures
4. Re-plan decomposition before re-delegating

### Multi-Iteration Failure Pattern

If the same type of failure appears across 3+ iterations:
1. Stop the loop — `status: "blocked"`
2. The loop approach may be wrong, not the individual iterations
3. Escalate to orchestrator with failure pattern evidence
4. Consider re-planning vs re-delegation

### Re-Planning vs Re-Delegation Decision

| Condition | Action |
|-----------|--------|
| Same slice fails twice with different errors | Re-delegate with tighter constraints |
| Same slice fails twice with same error | Re-plan — slice boundary is wrong |
| >50% parallel failure | Re-plan — decomposition is wrong |
| Iteration produces contradictions | Re-plan — loop structure is wrong |

See `references/cascading-failure.md` for detailed recovery procedures.

## Anti-Patterns

| Anti-Pattern | Why Dangerous |
|--------------|---------------|
| Running without max_iterations | Infinite loop risk → session exhaustion |
| Carrying full output in carry_forward | Context bloat → subagent context overflows |
| Ignoring stop conditions | Diminishing returns → contradictory findings |
| Starting iteration without reading checkpoint | Duplicate work, broken evidence chain |
| Using chat memory instead of checkpoint file | Ephemeral — compaction erases it |
| Re-delegating all slices on integration failure | Wastes resources — isolate the conflicting slice |

## Storage

Loop checkpoints: `{activity}/delegation/{loop_id}-checkpoint.json`
Scan-specific loops: `{activity}/codescan/{pass_id}/loop-checkpoint.json`
Gate results: `{activity}/delegation/{loop_id}-gate-{iteration}.json`

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/iterative-loop-control.md` | Checkpoint schema, loop rules, carry-forward compression, bead tracking |
| `references/synthesis-gates.md` | Gate checks, failure handling, gate result format |
| `references/integration-verification.md` | Parallel integration verification procedures |
| `references/cascading-failure.md` | Cascading failure detection and recovery |
| `templates/loop-checkpoint.md` | Loop checkpoint JSON template |
| `templates/synthesis-gate-result.md` | Gate result JSON template |
| `tests/iterative-loop.md` | Iterative loop scenario with validation |
| `tests/cascading-failure.md` | Cascading failure scenario with validation |

## Independence Rules

- This package extends `use-hivemind-delegation` — it does not replace it
- It may be selected directly or composed with domain-specific delegation skills
- Gate results and checkpoints are stored in `{project}/.hivemind/activity/delegation/` at runtime
