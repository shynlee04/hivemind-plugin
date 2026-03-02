# Workflow State Schema

This document defines the JSON structure persisted at:

`<workdir>/.hivemind/state/wf-{workflow-id}.json`

## Canonical Example

```json
{
  "workflow_id": "gx-recover-loop",
  "current_step": 2,
  "total_steps": 5,
  "step_name": "2_diagnose",
  "iteration_count": 1,
  "max_iterations": 3,
  "started_at": 1709337600,
  "last_step_completed_at": 1709337700,
  "step_outputs": {
    "1_scan": {"findings": 3, "completed_at": 1709337650}
  },
  "transition_log": [
    {"from": "1_scan", "to": "2_diagnose", "at": 1709337650, "reason": "scan complete"}
  ],
  "is_blocked": false,
  "blocked_reason": null
}
```

## Field Reference

- `workflow_id` (string): unique workflow identifier used in `wf-{workflow-id}.json`
- `current_step` (number): current 1-based step index; starts at `0` before the first advance
- `total_steps` (number): maximum number of steps in the workflow
- `step_name` (string|null): most recently completed step name; `null` before first advance
- `iteration_count` (number): current retry loop iteration counter
- `max_iterations` (number): maximum allowed retries; default `3`
- `started_at` (number): Unix epoch seconds when workflow was initialized
- `last_step_completed_at` (number|null): Unix epoch seconds for most recent completed step
- `step_outputs` (object): map of `step_name -> output object`, with `completed_at` timestamp
- `transition_log` (array): append-only transition entries
  - `from` (string): previous step name (or `0_init` for first transition)
  - `to` (string): new step name
  - `at` (number): Unix epoch seconds at transition time
  - `reason` (string): transition reason
- `is_blocked` (boolean): whether workflow is currently blocked
- `blocked_reason` (string|null): reason for blocked state

## Storage Location

- Active state files: `<workdir>/.hivemind/state/wf-{workflow-id}.json`
- Archived state files: `<workdir>/.hivemind/archive/wf-{workflow-id}.json`
