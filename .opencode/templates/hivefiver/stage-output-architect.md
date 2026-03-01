---
name: stage-output-architect
description: "Deterministic output format for the architect stage. Asset topology, contracts, dependencies."
version: "1.0.0"
stage: architect
consumers:
  - build (all journeys that reach architect)
---

# Architect Stage Output Template

> Consumed by: build workflow.
> Produced by: `/hivefiver-architect` command → `architect.md` workflow.

## Schema

```json
{
  "stage": "architect",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "topology": {
    "assets": [
      {"type": "agent", "name": "code-reviewer", "path": ".opencode/agents/code-reviewer.md", "action": "create"},
      {"type": "command", "name": "review", "path": ".opencode/commands/review.md", "action": "create"},
      {"type": "workflow", "name": "review", "path": ".opencode/workflows/review.md", "action": "create"}
    ],
    "total_count": 3
  },
  "contracts": {
    "per_asset": [
      {
        "name": "code-reviewer",
        "type": "agent",
        "contract": {
          "name": "code-reviewer",
          "description": "Code review agent (starts with Use when...)",
          "scope_paths": {"allow": [".opencode/"], "forbidden": ["src/", "tests/"]},
          "verification_obligations": ["quality-check.sh", "parity check"]
        }
      }
    ]
  },
  "dependencies": {
    "graph": [
      {"source": "command:review", "target": "agent:code-reviewer", "type": "requires"},
      {"source": "workflow:review", "target": "command:review", "type": "requires"}
    ],
    "build_order": ["agent:code-reviewer", "command:review", "workflow:review"],
    "is_acyclic": true
  },
  "risk_assessment": "low",
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "architect",
    "completed_stages": ["start", "discovery", "intake", "spec", "architect"],
    "pipeline_target": "architecture approved: 3 assets"
  },
  "next_command": "/hivefiver-build",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"architect"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `topology.assets` | object[] | ✅ | Every asset to create/modify |
| `topology.assets[].type` | enum | ✅ | `agent \| command \| skill \| workflow \| template \| reference` |
| `topology.assets[].name` | string | ✅ | Kebab-case identifier |
| `topology.assets[].path` | string | ✅ | Exact file path |
| `topology.assets[].action` | enum | ✅ | `create \| modify \| delete` |
| `topology.total_count` | integer | ✅ | Total assets in topology |
| `contracts.per_asset` | object[] | ✅ | One contract per asset |
| `dependencies.graph` | object[] | ✅ | Source→target edges with type |
| `dependencies.build_order` | string[] | ✅ | Topologically sorted build sequence |
| `dependencies.is_acyclic` | boolean | ✅ | Must be `true` (no circular deps) |
| `risk_assessment` | enum | ✅ | `low \| medium \| high` |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Always `"/hivefiver-build"` |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| build | `topology.assets` | Creates each asset in order |
| build | `contracts.per_asset` | Validates created assets against contracts |
| build | `dependencies.build_order` | Determines creation sequence |
