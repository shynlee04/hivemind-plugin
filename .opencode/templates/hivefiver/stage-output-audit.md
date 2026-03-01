---
name: stage-output-audit
description: "Deterministic output format for the audit stage. System-wide health check results."
version: "1.0.0"
stage: audit
consumers:
  - doctor (escalation if critical findings)
  - intake (improve journey: triage-selected findings become requirements)
---

# Audit Stage Output Template

> Consumed by: doctor (if escalation), intake (if improve journey triage).
> Produced by: `/hivefiver-audit` command → `audit.md` workflow.

## Schema

```json
{
  "stage": "audit",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "summary": {
    "total_assets": 35,
    "passed": 30,
    "warnings": 4,
    "failures": 1
  },
  "findings": [
    {
      "id": "F-001",
      "severity": "critical",
      "category": "chain",
      "asset": ".opencode/commands/hivefiver-build.md",
      "description": "Build command references deleted workflow",
      "fix_suggestion": "Create or update workflow reference"
    },
    {
      "id": "F-002",
      "severity": "medium",
      "category": "parity",
      "asset": ".opencode/agents/hivefiver.md",
      "description": "Agent differs from root mirror",
      "fix_suggestion": "cp .opencode/agents/hivefiver.md agents/"
    }
  ],
  "anti_patterns": ["G-09"],
  "parity_status": "drifted",
  "contract_validation": {
    "total_checked": 35,
    "passed": 34,
    "failed": 1,
    "failures": [".opencode/commands/hivefiver-build.md"]
  },
  "triage": {
    "selected_for_fix": ["F-001"],
    "deferred": ["F-002"],
    "accepted_risk": []
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "audit",
    "completed_stages": ["start", "audit"],
    "pipeline_target": "audit complete: 1 critical, 4 warnings"
  },
  "next_command": "/hivefiver-doctor",
  "gate_result": "failed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"audit"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `summary.total_assets` | integer | ✅ | Total assets scanned |
| `summary.passed` | integer | ✅ | Assets with no issues |
| `summary.warnings` | integer | ✅ | Assets with warnings |
| `summary.failures` | integer | ✅ | Assets with failures |
| `findings` | object[] | ✅ | All findings (may be empty) |
| `findings[].id` | string | ✅ | Unique finding ID (F-NNN) |
| `findings[].severity` | enum | ✅ | `critical \| high \| medium \| low` |
| `findings[].category` | enum | ✅ | `anti_pattern \| contract \| parity \| stale \| chain` |
| `findings[].asset` | string | ✅ | Affected file path |
| `findings[].description` | string | ✅ | What's wrong |
| `findings[].fix_suggestion` | string | ✅ | How to fix |
| `anti_patterns` | string[] | ✅ | G-01..G-10 IDs detected |
| `parity_status` | enum | ✅ | `synced \| drifted` |
| `contract_validation` | object | ✅ | Contract check results |
| `triage` | object | conditional | Required for improve journey |
| `triage.selected_for_fix` | string[] | conditional | Finding IDs user selects |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Depends on findings severity |
| `gate_result` | enum | ✅ | `passed` (no critical) or `failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| doctor | `findings` (severity=critical/high) | Feeds diagnosis and fix plan |
| doctor | `anti_patterns` | Targets specific anti-pattern remediation |
| intake (improve) | `triage.selected_for_fix` | Converts selected findings into requirements |
