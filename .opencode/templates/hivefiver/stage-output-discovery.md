---
name: stage-output-discovery
description: "Deterministic output format for the discovery stage. Adaptive QA, user profiling, brainstorming."
version: "1.0.0"
stage: discovery
consumers: ["intake", "doctor", "audit", "router"]
---

# Discovery Stage Output Template

> Consumed by: intake, doctor, audit, router (depending on journey reclassification).
> Produced by: `/hivefiver-discovery` command → `discovery.md` workflow.

## Schema

```json
{
  "stage": "discovery",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "discovery_summary": {
    "problem_statement": "Framework agents bypass quality gates",
    "primary_user_pain": "Work claims completion without evidence",
    "in_scope": [".opencode/agents/", ".opencode/commands/"],
    "out_of_scope": ["src/", "tests/"],
    "non_negotiable_constraints": ["All edits in .opencode/ only"],
    "acceptance_signals": ["runtime-gate runs at every command"],
    "failure_modes": ["Agent ignores enforcement blocks"],
    "verification_evidence": ["bash runtime-gate.sh pre-turn . exits 0"]
  },
  "user_profile": {
    "language": "en",
    "maturity": "L2",
    "input_band": "medium",
    "guidance": "low"
  },
  "unresolved_critical": 0,
  "unresolved_minor": 0,
  "brainstorm_output": {
    "selected_approach": "Runtime enforcement via unified gate script",
    "alternatives_rejected": ["Prose-only instructions", "Per-command manual checks"]
  },
  "reclassified_intent": null,
  "promotion_allowed": true,
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "discovery",
    "completed_stages": ["start", "discovery"],
    "pipeline_target": "build runtime enforcement"
  },
  "next_command": "/hivefiver-intake",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"discovery"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `discovery_summary.problem_statement` | string | ✅ | Clear problem in ≤2 sentences |
| `discovery_summary.primary_user_pain` | string | ✅ | Root pain point |
| `discovery_summary.in_scope` | string[] | ✅ | Paths/areas in scope |
| `discovery_summary.out_of_scope` | string[] | ✅ | Explicitly excluded |
| `discovery_summary.non_negotiable_constraints` | string[] | ✅ | Hard constraints |
| `discovery_summary.acceptance_signals` | string[] | ✅ | How to know it's done |
| `discovery_summary.failure_modes` | string[] | ✅ | What would make it wrong |
| `discovery_summary.verification_evidence` | string[] | ✅ | Concrete verification commands |
| `user_profile.language` | enum | ✅ | `en \| vi \| bilingual` |
| `user_profile.maturity` | enum | ✅ | `L0 \| L1 \| L2 \| L3` |
| `user_profile.input_band` | enum | ✅ | `short \| medium \| long \| wall_of_text` |
| `user_profile.guidance` | enum | ✅ | `high \| medium \| low` |
| `unresolved_critical` | integer | ✅ | Must be 0 to promote |
| `unresolved_minor` | integer | ✅ | Must be ≤1 to promote |
| `brainstorm_output` | object \| null | conditional | Required for build_new/extend intents |
| `reclassified_intent` | string \| null | conditional | Non-null for custom/adaptive journey |
| `promotion_allowed` | boolean | ✅ | Gate pass/fail |
| `state_updates` | object | ✅ | Pipeline state mutations |
| `next_command` | string | ✅ | Exact next command |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| intake | `discovery_summary.*` | Pre-populates requirements from discovery answers |
| spec | `discovery_summary.acceptance_signals`, `verification_evidence` | Seeds acceptance criteria |
| router | `reclassified_intent` | Re-routes custom journey to correct pipeline |
