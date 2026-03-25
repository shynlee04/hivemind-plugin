# TDD Checkpoint Template
```json
{
  "plan_id": "",
  "phase_index": 0,
  "tdd_sub_phase": "red|green|refactor|gate",
  "red": { "status": "pending|complete", "test_count": 0, "failing_output": "" },
  "green": { "status": "pending|complete", "test_count": 0, "passing_output": "" },
  "refactor": { "status": "pending|complete", "test_count": 0, "passing_output": "" },
  "transition_gate": { "phase_tests": false, "prior_tests": false, "build": false, "types": false },
  "cumulative_tests": { "total": 0, "passing": 0, "failing": 0 }
}
```
