---
name: stage-output-build
description: "Deterministic output format for the build stage. Created/modified assets with validation results."
version: "1.0.0"
stage: build
consumers:
  - audit (post-build verification)
---

# Build Stage Output Template

> Consumed by: audit workflow.
> Produced by: `/hivefiver-build` command → `build.md` workflow.

## Schema

```json
{
  "stage": "build",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "assets_created": [
    {
      "type": "agent",
      "name": "code-reviewer",
      "path": ".opencode/agents/code-reviewer.md",
      "lines": 145,
      "contract_valid": true,
      "schema_guard": "committed"
    }
  ],
  "assets_modified": [
    {
      "type": "command",
      "name": "hivefiver",
      "path": ".opencode/commands/hivefiver.md",
      "diff_lines": 12,
      "contract_valid": true,
      "schema_guard": "committed"
    }
  ],
  "validations": {
    "frontmatter_valid": true,
    "contracts_passed": true,
    "parity_synced": true,
    "quality_check": "passed",
    "schema_guard": "committed",
    "anti_patterns_detected": []
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "build",
    "completed_stages": ["start", "discovery", "intake", "spec", "architect", "build"],
    "pipeline_target": "built: code-reviewer agent + review command"
  },
  "next_command": "/hivefiver-audit",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"build"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `assets_created` | object[] | ✅ | Newly created assets (may be empty) |
| `assets_created[].type` | enum | ✅ | Asset type |
| `assets_created[].name` | string | ✅ | Asset identifier |
| `assets_created[].path` | string | ✅ | Exact file path |
| `assets_created[].lines` | integer | ✅ | Line count |
| `assets_created[].contract_valid` | boolean | ✅ | Contract validation passed |
| `assets_created[].schema_guard` | enum | ✅ | `committed \| pending \| failed` |
| `assets_modified` | object[] | ✅ | Modified assets (may be empty) |
| `validations.frontmatter_valid` | boolean | ✅ | All frontmatter parses |
| `validations.contracts_passed` | boolean | ✅ | All contracts validated |
| `validations.parity_synced` | boolean | ✅ | .opencode/ matches root |
| `validations.quality_check` | enum | ✅ | `passed \| failed` |
| `validations.schema_guard` | enum | ✅ | `committed \| pending \| failed` |
| `validations.anti_patterns_detected` | string[] | ✅ | G-01 through G-10 IDs (empty = clean) |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Always `"/hivefiver-audit"` |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| audit | `assets_created`, `assets_modified` | Knows which assets to scan |
| audit | `validations` | Baseline validation state |
| doctor | `validations.anti_patterns_detected` | Feeds diagnosis if patterns found |
