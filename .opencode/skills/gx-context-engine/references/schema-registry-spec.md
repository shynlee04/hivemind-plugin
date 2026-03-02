# Schema Registry Specification

> **SOT:** `docs/plans/2026-03-02-gx-pack-certified-requirements.md` CR-06
> **Script:** `scripts/gx-schema-sync.sh`

## Overview

Every `.hivemind/state/*.json` file MUST match a declared schema. Unknown fields are REJECTED (not silently ignored). Version evolution is additive-only. The schema registry tracks version per file and validates on every write.

## Schemas

### runtime-profile.json (`gx-runtime-profile-v1`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Profile identifier |
| `created` | string | ✅ | ISO 8601 creation time |
| `created_epoch` | number | ✅ | Unix epoch creation time |
| `ttl` | number | ✅ | Time-to-live in ms |
| `intent` | string | ✅ | Discriminator: build_new, fix_broken, audit, extend, improve |
| `policy_version` | string | ✅ | Policy version identifier |
| `role_envelope` | object | ✅ | Role definitions (primary, secondary, monitor) |
| `capabilities` | object | ✅ | Allowed tools, paths, delegations |
| `constraints` | array | ✅ | String constraints list |

### todo.json (`gx-todo-v1`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | ✅ | Schema version |
| `items` | array | ✅ | TODO item objects |
| `lastSync` | number | ✅ | Last sync timestamp |
| `activeItem` | string\|null | ❌ | Currently active item ID |

### health-metrics.json (`gx-health-metrics-v1`)

Already defined in `references/health-metrics-schema.md`. 12-signal vector with composite scoring.

### hierarchy.json (`gx-hierarchy-v1`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | ✅ | Schema version |
| `root` | object | ✅ | Root node of hierarchy tree |
| `cursor` | string\|object\|null | ❌ | Current position cursor |

### enforcement.json (`gx-enforcement-v1`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | ✅ | Schema identifier |
| `version` | number | ✅ | Schema version |
| `mode` | string | ✅ | active\|passive\|disabled |
| `active_node` | string\|null | ✅ | Current hierarchy node |
| `scope` | object | ✅ | allowed_paths, allowed_tools, allowed_delegations |
| `violations` | array | ✅ | Recorded violations |
| `last_check` | number | ✅ | Last check timestamp |
| `block_active` | boolean | ✅ | Whether blocking is active |
| `block_reason` | string\|null | ✅ | Reason for current block |

### decisions.jsonl (`gx-decision-entry-v1`)

Per-line validation. Each line must be valid JSON with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Decision ID (dec/{module}/{topic}/{seq}) |
| `timestamp` | number | ✅ | Unix epoch |
| `content` | string | ✅ | Decision text |
| `rationale` | string | ✅ | Why this decision |
| `hierarchy_node` | string | ✅ | Linked hierarchy node |
| `agent` | string | ✅ | Agent that made decision |

### wf-{id}.json (`gx-workflow-state-v1`)

Already defined in `references/workflow-state-schema.md`.

## Schema Registry

File: `.hivemind/state/schema-registry.json`

```json
{
  "$schema": "gx-schema-registry-v1",
  "version": 1,
  "files": {
    "<filename>": {
      "schema_id": "<schema-id>",
      "schema_version": 1,
      "file_version": 1,
      "last_validated": 1709337600,
      "status": "valid|invalid|unregistered"
    }
  },
  "validation_log": [
    {
      "file": "<filename>",
      "timestamp": 1709337600,
      "result": "valid|invalid",
      "errors": []
    }
  ]
}
```

## Validation Rules

1. **Required fields**: MUST exist (structural check)
2. **Unknown fields**: Top-level fields not in schema → REJECTED
3. **Type checking**: strings are strings, numbers are numbers, arrays are arrays
4. **Version field**: Must be present and numeric
5. **Additive-only**: New fields can be added to schema. Removing required fields = ERROR.
