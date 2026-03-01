---
name: stage-output-doctor
description: "Deterministic output format for the doctor stage. Diagnosis, fixes applied, regression check."
version: "1.0.0"
stage: doctor
consumers:
  - audit (post-fix verification)
  - start (new build cycle if needed)
---

# Doctor Stage Output Template

> Consumed by: audit (verify health post-fix), start (if new assets needed).
> Produced by: `/hivefiver-doctor` command → `doctor.md` workflow.

## Schema

```json
{
  "stage": "doctor",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "diagnostics": {
    "total_issues": 5,
    "critical_found": 1,
    "critical_fixed": 1,
    "high_found": 2,
    "high_fixed": 2,
    "medium_found": 1,
    "medium_fixed": 1,
    "low_found": 1,
    "low_fixed": 0,
    "remaining": 1
  },
  "fixes_applied": [
    {
      "id": "FIX-001",
      "finding_id": "F-001",
      "issue": "Build command references deleted workflow",
      "fix": "Updated workflow reference to current path",
      "file": ".opencode/commands/hivefiver-build.md",
      "verified": true,
      "schema_guard": "committed"
    }
  ],
  "regressions": {
    "new_issues_introduced": 0,
    "quality_check_passed": true,
    "contract_validation_passed": true,
    "parity_synced": true
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "doctor",
    "completed_stages": ["start", "doctor"],
    "pipeline_target": "doctor complete: 4 fixed, 1 deferred"
  },
  "next_command": "/hivefiver-audit",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"doctor"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `diagnostics.total_issues` | integer | ✅ | Total issues diagnosed |
| `diagnostics.critical_found` | integer | ✅ | Critical issues found |
| `diagnostics.critical_fixed` | integer | ✅ | Critical issues resolved |
| `diagnostics.remaining` | integer | ✅ | Issues not fixed (deferred/low) |
| `fixes_applied` | object[] | ✅ | Every fix with evidence |
| `fixes_applied[].id` | string | ✅ | Unique fix ID (FIX-NNN) |
| `fixes_applied[].finding_id` | string | ✅ | Links to audit finding |
| `fixes_applied[].verified` | boolean | ✅ | Post-fix verification passed |
| `fixes_applied[].schema_guard` | enum | ✅ | `committed \| pending \| failed` |
| `regressions.new_issues_introduced` | integer | ✅ | Must be 0 for gate pass |
| `regressions.quality_check_passed` | boolean | ✅ | Post-fix quality check |
| `regressions.parity_synced` | boolean | ✅ | Post-fix parity status |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Usually `"/hivefiver-audit"` |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| audit | `fixes_applied` | Verify fixes resolved original findings |
| audit | `regressions` | Confirm no new issues introduced |
| start | `diagnostics.remaining` | If remaining > 0, may need new build cycle |
