# Iterative Loop Control

## Purpose

Prevent uncontrolled iteration in multi-pass delegation. Make loop state explicit, bounded, and recoverable.

## Loop Checkpoint Schema

Every iterative delegation loop carries a checkpoint:

```json
{
  "_meta": {
    "created_at": "...",
    "updated_at": "..."
  },
  "loop_id": "scan_src_tools",
  "activity_type": "codescan",
  "phase_type": "pipeline-map",
  "loop_type": "codescan | audit | refactor | verification",
  "max_iterations": 10,
  "current_iteration": 3,
  "status": "running | paused | complete | blocked | exceeded_max",
  "open_packet_ids": ["deleg_1711072800_codemap"],
  "cleanup_allowed": "no",
  "iterations": [
    {
      "iteration": 1,
      "pass_id": "pass_1",
      "status": "complete",
      "summary": "High-level structure extracted",
      "output_path": ".hivemind/activity/codescan/pass_1/synthesis.json",
      "carry_forward": ["src/tools/ has 6 subdirectories", "seams at index.ts files"],
      "coverage_status": "partial",
      "remaining_risks": ["pipeline ownership still unclear"]
    },
    {
      "iteration": 2,
      "pass_id": "pass_2",
      "status": "complete",
      "summary": "Export/import map for critical dirs",
      "output_path": ".hivemind/activity/codescan/pass_2/synthesis.json",
      "carry_forward": ["3 circular import warnings", "dead exports in shared/"],
      "coverage_status": "improving",
      "remaining_risks": ["user journey impact not yet mapped"]
    },
    {
      "iteration": 3,
      "pass_id": "pass_3",
      "status": "running",
      "summary": null,
      "output_path": null,
      "carry_forward": null
    }
  ],
  "stop_conditions": [
    "All planned batches complete",
    "No new findings in last iteration",
    "Max iterations reached"
  ],
  "blocked_reason": null,
  "next_action": "Continue with pass_3 batch_2",
  "new_findings_delta": 2,
  "handoff_readiness": "not-ready"
}
```

## Loop Rules

1. **Set `max_iterations` before starting.** Default is 10. Adjust based on scope.
2. **Each iteration must produce a `carry_forward`** — a small list of findings that compress what was learned.
3. **Stop when any stop condition fires.** Do not iterate past `max_iterations`.
4. **If blocked, record `blocked_reason` and set status to `blocked`.** Do not silently retry.
5. **The orchestrator reads the checkpoint before deciding the next iteration.** The checkpoint is the loop's memory.
6. **Keep `cleanup_allowed` at `no` while the loop is running, paused, blocked, or missing accounting.**

## Carry-Forward Compression

Each iteration carries forward only:
- Key findings (≤5 short statements)
- Discovered blockers
- Paths to detailed output files

Do not carry forward full scan results — they live in their output files. The carry-forward is a summary for the next iteration's context.

## Bead-Style Progress Tracking

For fine-grained work within an iteration (e.g., file-by-file audit):

```json
{
  "bead_id": "audit_batch_2",
  "total_items": 20,
  "completed": 14,
  "remaining": 6,
  "blocked": 0,
  "items": [
    { "path": "src/tools/runtime/tools.ts", "status": "done", "findings": 2 },
    { "path": "src/tools/doc/tools.ts", "status": "done", "findings": 0 },
    { "path": "src/tools/task/tools.ts", "status": "pending" }
  ]
}
```

This style of tracking makes it possible to:
- Resume mid-batch after interruption
- Report precise progress percentages
- Identify exactly which items remain

## Delegation Fit

- Sequential loops: one iteration at a time, checkpoint between each.
- Parallel batches within an iteration: allowed when batches are isolated (see delegation-modes.md).
- Never run parallel iterations — each iteration depends on the previous one's carry-forward.
- Each deeper phase must read the previous phase synthesis or checkpoint before planning a new batch.

## Storage

Loop checkpoints are stored at:
- `{activity}/delegation/{loop_id}-checkpoint.json` for delegation-managed loops
- `{activity}/codescan/{pass_id}/loop-checkpoint.json` for scan-specific loops

## Anti-Patterns

- Running iterations without a max_iterations cap
- Carrying forward full output instead of compressed summaries
- Ignoring stop conditions and continuing past useful work
- Starting a new iteration without reading the prior checkpoint
- Using chat memory instead of the checkpoint file for loop state
