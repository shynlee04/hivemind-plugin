# TDD Delegation Packet

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
  "tdd_phase": "red | green | refactor",
  "test_gate_command": "",
  "test_files": [],
  "implementation_files": [],
  "build_verify_command": "",
  "expected_behavior": "",
  "refactor_scope": "",
  "scope": "",
  "out_of_scope": "",
  "authority_surfaces": [],
  "constraints": [],
  "return_contract": {
    "status": "complete | partial | blocked",
    "gate_result": {},
    "build_verify_result": {},
    "tests_written": 0,
    "tests_passing": 0,
    "tests_failing": 0
  },
  "dispatched_at": "",
  "timeout_minutes": 30
}
```

## Phase-Specific Fields

| Phase | Required Fields | Optional Fields |
|-------|----------------|-----------------|
| Red | `tdd_phase`, `test_files`, `test_gate_command`, `expected_behavior` | `constraints` |
| Green | `tdd_phase`, `implementation_files`, `test_files`, `test_gate_command`, `build_verify_command` | `constraints` |
| Refactor | `tdd_phase`, `implementation_files`, `test_files`, `test_gate_command`, `build_verify_command`, `refactor_scope` | `constraints` |
