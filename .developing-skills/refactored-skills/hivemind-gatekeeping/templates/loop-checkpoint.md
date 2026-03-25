# Loop Checkpoint

```json
{
  "_meta": {
    "created_at": "2026-03-22T10:00:00Z",
    "updated_at": "2026-03-22T10:45:00Z"
  },
  "loop_id": "",
  "activity_type": "codescan",
  "phase_type": "pipeline-map",
  "loop_type": "codescan",
  "max_iterations": 10,
  "current_iteration": 0,
  "status": "running",
  "open_packet_ids": [],
  "cleanup_allowed": "no",
  "iterations": [],
  "stop_conditions": [
    "All planned batches complete",
    "No new findings in last iteration",
    "Max iterations reached"
  ],
  "blocked_reason": null,
  "next_action": "",
  "new_findings_delta": 0,
  "handoff_readiness": "not-ready"
}
```

## Iteration Entry

```json
{
  "iteration": 1,
  "pass_id": "",
  "status": "complete",
  "summary": "",
  "output_path": "",
  "carry_forward": [],
  "coverage_status": "partial",
  "remaining_risks": []
}
```

## Bead Entry (fine-grained within iteration)

```json
{
  "bead_id": "",
  "total_items": 0,
  "completed": 0,
  "remaining": 0,
  "blocked": 0,
  "items": [
    { "path": "", "status": "pending", "findings": 0 }
  ]
}
```
