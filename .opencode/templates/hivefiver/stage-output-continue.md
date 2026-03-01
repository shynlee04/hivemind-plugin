---
name: stage-output-continue
description: "Deterministic output format for the continue stage. Session handoff with full context."
version: "1.0.0"
stage: continue
consumers:
  - new session (via handoff prompt)
---

# Continue Stage Output Template

> Consumed by: freshly spawned HiveFiver session.
> Produced by: `/hivefiver-continue` command → `continue.md` workflow.

## Schema

```json
{
  "stage": "continue",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "pipeline_state": {
    "active": true,
    "current_stage": "build",
    "completed_stages": ["start", "discovery", "intake", "spec", "architect"],
    "target": "building code-reviewer agent",
    "error": null
  },
  "continuation_command": "opencode run --agent hivefiver --prompt 'Load skills hivefiver-mode and hivefiver-coordination. Resume pipeline at build stage...'",
  "handoff_file": ".hivemind/hive-modules/hivefiver-v2/handoffs/handoff-20260301-143756.json",
  "handoff_content": {
    "skills_to_load": ["hivefiver-mode", "hivefiver-coordination"],
    "current_stage": "build",
    "completed_stages": ["start", "discovery", "intake", "spec", "architect"],
    "pipeline_target": "building code-reviewer agent",
    "prior_handoff": null,
    "scope_boundaries": [".opencode/", ".hivemind/"],
    "quality_gate": "runtime-gate.sh pre-turn must pass before any action"
  },
  "new_session_will_do": "Resume at build stage, working on code-reviewer agent",
  "gate_result": "passed | failed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"continue"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `pipeline_state.active` | boolean | ✅ | Must be `true` to continue |
| `pipeline_state.current_stage` | string | ✅ | Stage to resume at |
| `pipeline_state.completed_stages` | string[] | ✅ | What's already done |
| `pipeline_state.target` | string | ✅ | What we're building |
| `pipeline_state.error` | string \| null | ✅ | Error state if any |
| `continuation_command` | string | ✅ | Exact opencode run command |
| `handoff_file` | string | ✅ | Path to handoff JSON file |
| `handoff_content` | object | ✅ | Full handoff payload |
| `handoff_content.skills_to_load` | string[] | ✅ | Skills for new session |
| `handoff_content.scope_boundaries` | string[] | ✅ | Allowed paths |
| `handoff_content.quality_gate` | string | ✅ | First thing new session must do |
| `new_session_will_do` | string | ✅ | Human-readable summary |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer | Fields Read | Purpose |
|----------|-------------|---------|
| New session | `handoff_content.*` | Full context bootstrap |
| New session | `continuation_command` | Exact invocation |
| Handoff audit | `handoff_file` | Verify record persisted |
