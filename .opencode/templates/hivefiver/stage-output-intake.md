---
name: stage-output-intake
description: "Deterministic output format for the intake stage. Structured requirement collection."
version: "1.0.0"
stage: intake
consumers:
  - spec (all journeys that reach intake)
---

# Intake Stage Output Template

> Consumed by: spec workflow.
> Produced by: `/hivefiver-intake` command → `intake.md` workflow.

## Schema

```json
{
  "stage": "intake",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "asset_type": "agent",
  "requirements": {
    "purpose": "Code review agent that validates PR diffs",
    "scope": {
      "in_scope": [".opencode/agents/code-reviewer.md"],
      "out_of_scope": ["src/", "tests/"]
    },
    "behavior": "Reads PR diffs, checks against coding standards, produces structured review",
    "inputs": [
      {"name": "pr_url", "type": "string", "required": true},
      {"name": "review_depth", "type": "enum", "values": ["quick", "thorough"], "required": false}
    ],
    "outputs": [
      {"name": "review_report", "type": "json", "schema": "review-output.json"}
    ],
    "constraints": [
      "Must complete within single context window",
      "Read-only access to repository"
    ]
  },
  "ambiguities": {
    "resolved": [
      {"question": "Which coding standards?", "answer": "Project AGENTS.md conventions"}
    ],
    "deferred": [],
    "risk_accepted": []
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "intake",
    "completed_stages": ["start", "discovery", "intake"],
    "pipeline_target": "requirements gathered for: agent"
  },
  "next_command": "/hivefiver-spec",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"intake"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `asset_type` | enum | ✅ | `agent \| command \| skill \| workflow \| template \| reference` |
| `requirements.purpose` | string | ✅ | Single-sentence purpose |
| `requirements.scope` | object | ✅ | in_scope and out_of_scope paths |
| `requirements.behavior` | string | ✅ | Behavioral description |
| `requirements.inputs` | object[] | ✅ | Expected inputs with types |
| `requirements.outputs` | object[] | ✅ | Expected outputs with schemas |
| `requirements.constraints` | string[] | ✅ | Operational limits |
| `ambiguities.resolved` | object[] | ✅ | Question/answer pairs |
| `ambiguities.deferred` | object[] | ✅ | To be resolved later |
| `ambiguities.risk_accepted` | object[] | ✅ | Accepted risks |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Always `"/hivefiver-spec"` |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| spec | `requirements.*` | Transforms requirements into specification |
| spec | `ambiguities.*` | Carries forward unresolved items |
| architect | `asset_type` | Determines contract schema to apply |
