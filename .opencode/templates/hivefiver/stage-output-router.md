---
name: stage-output-router
description: "Deterministic output format for the router. Action resolution and dispatch."
version: "1.0.0"
stage: router
consumers:
  - target stage command (dispatched to)
---

# Router Stage Output Template

> Consumed by: whatever stage command the router dispatches to.
> Produced by: `/hivefiver` command → `router.md` workflow.

## Schema

```json
{
  "stage": "router",
  "status": "completed",
  "timestamp": "2026-03-01T12:00:00Z",
  "resolved_action": "build",
  "resolved_command": "/hivefiver-build",
  "classification_method": "keyword",
  "confidence": "high",
  "intent": {
    "classified": "build_new",
    "raw_input": "build",
    "alternatives": []
  },
  "pipeline_state": {
    "active": true,
    "current_stage": "architect",
    "completed_stages": ["start", "discovery", "intake", "spec", "architect"],
    "error": null,
    "next_recommended": "build"
  },
  "user_profile": {
    "language": "en",
    "maturity": "L2",
    "guidance": "low"
  },
  "dispatch": {
    "target": "/hivefiver-build",
    "method": "keyword_match",
    "auto_executed": true
  },
  "gate_result": "passed | failed"
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | string | ✅ | Always `"router"` |
| `status` | string | ✅ | `"completed"` or `"dispatched"` |
| `timestamp` | string (ISO 8601) | ✅ | Resolution timestamp |
| `resolved_action` | string | ✅ | Matched stage keyword |
| `resolved_command` | string | ✅ | Full command path |
| `classification_method` | enum | ✅ | `keyword \| intent_classifier \| pipeline_resume` |
| `confidence` | enum | ✅ | `high \| medium \| low \| none` |
| `intent.classified` | string | ✅ | Intent category |
| `intent.raw_input` | string | ✅ | Original user input |
| `intent.alternatives` | string[] | ✅ | Other possible intents |
| `pipeline_state` | object | ✅ | Current pipeline snapshot |
| `user_profile` | object | conditional | If guided-discovery ran |
| `dispatch.target` | string | ✅ | Command being dispatched to |
| `dispatch.method` | enum | ✅ | `keyword_match \| intent_match \| pipeline_next \| user_choice` |
| `dispatch.auto_executed` | boolean | ✅ | Whether dispatch happened automatically |
| `gate_result` | enum | ✅ | `passed \| failed` |

## Downstream Consumption

| Consumer | Fields Read | Purpose |
|----------|-------------|---------|
| Target stage | `resolved_action` | Knows which stage was requested |
| Target stage | `pipeline_state` | Current pipeline context |
| Target stage | `user_profile` | Adapts interaction style |
