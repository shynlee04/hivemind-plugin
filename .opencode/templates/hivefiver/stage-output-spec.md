---
name: stage-output-spec
description: "Deterministic output format for the spec stage. Specification with acceptance criteria."
version: "1.0.0"
stage: spec
consumers:
  - architect (all journeys that reach spec)
---

# Spec Stage Output Template

> Consumed by: architect workflow.
> Produced by: `/hivefiver-spec` command → `spec.md` workflow.

## Schema

```json
{
  "stage": "spec",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "specification": {
    "name": "code-reviewer",
    "purpose": "Code review agent that validates PR diffs against project standards",
    "scope": {
      "in_scope": [".opencode/agents/code-reviewer.md", ".opencode/commands/review.md"],
      "out_of_scope": ["src/", "tests/"]
    },
    "behavior": "Reads PR diffs, checks against coding standards, produces structured review with findings",
    "inputs": {
      "format": "command arguments",
      "fields": ["pr_url: string (required)", "review_depth: enum (optional)"]
    },
    "outputs": {
      "format": "json",
      "schema": {"findings": "array", "summary": "string", "verdict": "enum"}
    },
    "constraints": ["Single context window", "Read-only repository access"]
  },
  "acceptance_criteria": [
    {
      "id": "AC-1",
      "given": "A PR URL is provided",
      "when": "Agent runs review command",
      "then": "Structured review JSON is produced with findings array",
      "verification": "bash quality-check.sh review . | grep passed"
    },
    {
      "id": "AC-2",
      "given": "Agent profile exists",
      "when": "Frontmatter is parsed",
      "then": "All required fields present (name, description, permissions)",
      "verification": "head -10 .opencode/agents/code-reviewer.md | grep -c '^---$' == 2"
    }
  ],
  "ambiguity_map": [
    {
      "description": "Which coding standards to enforce",
      "resolution": "Use project AGENTS.md conventions",
      "risk": "low"
    }
  ],
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "spec",
    "completed_stages": ["start", "discovery", "intake", "spec"],
    "pipeline_target": "spec approved: code-reviewer"
  },
  "next_command": "/hivefiver-architect",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"spec"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `specification.name` | string | ✅ | Kebab-case identifier |
| `specification.purpose` | string | ✅ | Single-sentence purpose |
| `specification.scope` | object | ✅ | in_scope and out_of_scope |
| `specification.behavior` | string | ✅ | Detailed behavioral description |
| `specification.inputs` | object | ✅ | Input format and fields |
| `specification.outputs` | object | ✅ | Output format and schema |
| `specification.constraints` | string[] | ✅ | Operational limits |
| `acceptance_criteria` | object[] | ✅ | Given-When-Then with verification |
| `acceptance_criteria[].id` | string | ✅ | Unique AC identifier |
| `acceptance_criteria[].verification` | string | ✅ | Executable verification command |
| `ambiguity_map` | object[] | ✅ | Resolved ambiguities with risk |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Always `"/hivefiver-architect"` |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| architect | `specification.*` | Designs asset topology from spec |
| architect | `acceptance_criteria` | Maps criteria to contract validations |
| build | `specification.name`, `scope` | Creates assets at correct paths |
