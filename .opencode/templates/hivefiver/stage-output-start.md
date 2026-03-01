---
name: stage-output-start
description: "Deterministic output format for the start stage. Every start completion MUST emit this structure."
version: "1.0.0"
stage: start
consumers:
  - discovery (build_new, extend, learn, custom)
  - doctor (fix_broken)
  - audit (audit_health, improve)
---

# Start Stage Output Template

> Consumed by: discovery, doctor, audit workflows depending on journey.
> Produced by: `/hivefiver-start` command → `start.md` workflow.

## Schema

```json
{
  "stage": "start",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "intent": {
    "classified": "build_new",
    "confidence": "high",
    "method": "keyword",
    "raw_input": "build me an agent for code review"
  },
  "pipeline": {
    "id": "full_build",
    "sequence": ["start", "discovery", "intake", "spec", "architect", "build", "audit"],
    "current_position": 0,
    "next_stage": "discovery"
  },
  "state_updates": {
    "pipeline_active": true,
    "current_stage": "start",
    "completed_stages": ["start"],
    "pipeline_target": "build new code review agent"
  },
  "next_command": "/hivefiver-discovery",
  "gate_result": "passed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"start"` |
| `status` | string | ✅ | `"completed"` or `"failed"` |
| `timestamp` | string (ISO 8601) | ✅ | Completion timestamp |
| `intent.classified` | enum | ✅ | `build_new \| extend \| fix_broken \| audit_health \| improve \| learn \| custom` |
| `intent.confidence` | enum | ✅ | `high \| medium \| low \| none` |
| `intent.method` | enum | ✅ | `keyword \| intent_classifier \| pipeline_resume` |
| `intent.raw_input` | string | ✅ | Original user input text |
| `pipeline.id` | enum | ✅ | `full_build \| doctor_fix \| audit_only \| audit_then_build \| guided_onboard \| adaptive` |
| `pipeline.sequence` | string[] | ✅ | Ordered stage list for this journey |
| `pipeline.current_position` | integer | ✅ | Zero-based index in sequence |
| `pipeline.next_stage` | string | ✅ | Next stage to execute |
| `state_updates.pipeline_active` | boolean | ✅ | Always `true` after start |
| `state_updates.current_stage` | string | ✅ | Always `"start"` |
| `state_updates.completed_stages` | string[] | ✅ | Always `["start"]` |
| `state_updates.pipeline_target` | string | ✅ | Human-readable goal description |
| `next_command` | string | ✅ | Exact command to run next |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer Stage | Fields Read | Purpose |
|---------------|-------------|---------|
| discovery | `intent.classified`, `pipeline.sequence` | Determines question focus and reclassification need |
| doctor | `intent.classified` | Confirms fix_broken intent |
| audit | `intent.classified` | Determines audit scope (full vs triage) |
| router | `pipeline.next_stage`, `next_command` | Dispatches to correct command |
