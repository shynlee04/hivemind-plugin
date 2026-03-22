# Loop Checkpoint

```json
{
  "_meta": {
    "created_at": "2026-03-22T10:00:00Z",
    "updated_at": "2026-03-22T10:45:00Z"
  },
  "loop_id": "scan_src_tools",
  "activity_type": "codescan",
  "phase_type": "pipeline-map",
  "loop_type": "codescan",
  "max_iterations": 10,
  "current_iteration": 3,
  "status": "running",
  "open_packet_ids": ["deleg_1711072800_codemap"],
  "cleanup_allowed": "no",
  "iterations": [],
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

## Iteration Entry

```json
{
  "iteration": 1,
  "pass_id": "pass_1",
  "status": "complete",
  "summary": "High-level structure extracted: 6 subdirectories, seams at index.ts files",
  "output_path": ".hivemind/activity/codescan/pass_1/synthesis.json",
  "carry_forward": ["src/tools/ has 6 subdirectories", "seams at index.ts files"],
  "coverage_status": "partial",
  "remaining_risks": ["pipeline ownership still unclear"]
}
```

## Bead Entry (fine-grained within iteration)

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
