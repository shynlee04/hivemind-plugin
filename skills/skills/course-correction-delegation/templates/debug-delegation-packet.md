# Debug Delegation Packet

```json
{
  "_meta": {
    "created_at": "",
    "updated_at": ""
  },
  "packet_id": "",
  "concern": "",
  "activity_type": "delegation",
  "phase_type": "",
  "mode": "execution",
  "execution_mode": "sequential",
  "debug_phase": "reproduce | narrow | contain | evidence",
  "failing_behavior": "",
  "repro_steps": [],
  "hypotheses": [],
  "scope": "",
  "out_of_scope": "",
  "authority_surfaces": [],
  "constraints": [],
  "return_contract": {
    "status": "complete | partial | blocked",
    "repro_confirmed": false,
    "root_cause": "",
    "fix_applied": false,
    "regression_test": false
  },
  "dispatched_at": "",
  "timeout_minutes": 30
}
```

## Phase-Specific Fields

| Phase | Required Fields |
|-------|----------------|
| Reproduce | `debug_phase`, `failing_behavior`, `repro_steps` |
| Narrow | `debug_phase`, `hypotheses`, `repro_steps` |
| Contain | `debug_phase`, `root_cause`, `authority_surfaces` |
| Evidence | `debug_phase`, `return_contract.regression_test` |
