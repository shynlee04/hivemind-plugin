# Refactor Delegation Packet

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
  "refactor_phase": "assess | plan | execute | verify",
  "seam_inventory": [],
  "risk_assessment": "",
  "scope": "",
  "out_of_scope": "",
  "authority_surfaces": [],
  "constraints": [],
  "return_contract": {
    "status": "complete | partial | blocked",
    "seams_identified": 0,
    "steps_planned": 0,
    "steps_executed": 0,
    "tests_passing": true
  },
  "dispatched_at": "",
  "timeout_minutes": 30
}
```

## Phase-Specific Fields

| Phase | Required Fields |
|-------|----------------|
| Assess | `refactor_phase`, `scope` |
| Plan | `refactor_phase`, `seam_inventory`, `risk_assessment` |
| Execute | `refactor_phase`, `authority_surfaces`, `seam_inventory` |
| Verify | `refactor_phase`, `constraints` |
