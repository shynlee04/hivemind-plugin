# Loop Checkpoint

```json
{
  "_meta": {
    "created_at": "",
    "updated_at": ""
  },
  "loop_id": "",
  "activity_type": "",
  "phase_type": "",
  "loop_type": "codescan | audit | refactor | verification",
  "max_iterations": 10,
  "current_iteration": 0,
  "status": "running | paused | complete | blocked | exceeded_max",
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
  "handoff_readiness": "not-ready | partial | ready"
}
```

## Iteration Entry

```json
{
  "iteration": 1,
  "pass_id": "",
  "status": "complete | running | blocked",
  "summary": "",
  "output_path": "",
  "carry_forward": [],
  "coverage_status": "",
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
    {
      "path": "",
      "status": "done | pending | blocked",
      "findings": 0
    }
  ]
}
```
