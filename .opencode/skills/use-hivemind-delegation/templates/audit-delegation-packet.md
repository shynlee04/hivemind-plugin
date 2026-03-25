# Audit Delegation Packet

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
  "mode": "research",
  "execution_mode": "sequential",
  "audit_phase": "scan | analyze | recommend",
  "scan_scope": [],
  "analysis_focus": "",
  "scope": "",
  "out_of_scope": "",
  "authority_surfaces": [],
  "constraints": [],
  "return_contract": {
    "status": "complete | partial | blocked",
    "files_scanned": 0,
    "issues_found": 0,
    "recommendations": 0
  },
  "dispatched_at": "",
  "timeout_minutes": 30
}
```

## Phase-Specific Fields

| Phase | Required Fields |
|-------|----------------|
| Scan | `audit_phase`, `scan_scope` |
| Analyze | `audit_phase`, `analysis_focus`, `scan_scope` |
| Recommend | `audit_phase`, `analysis_focus` |
