# Commit Memory Schema

## Full JSON Schema

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00Z",
    "updated_at": "2026-03-24T10:00:00Z"
  },
  "commit_sha": "abc1234",
  "memory": {
    "what": "Added memory-enforce commit metadata schema",
    "why": "Needed to link commits to delegation packets for retrieval",
    "who_decided": "hivemaker",
    "evidence": ["ADR-2026-03-23", "delegation packet batch_007"],
    "alternatives_considered": ["Inline metadata only — rejected: not queryable"]
  },
  "linkage": {
    "packet_id": "batch_007",
    "plan_phase": "implementation",
    "decision_id": "decision_20260324_a3f2",
    "delegation_chain": ["orchestrator", "hivemaker"],
    "task_id": null,
    "pass_id": "pass_001"
  },
  "retrieval": {
    "tags": ["git-memory", "commit-metadata", "knowledge-network", "tools"],
    "memory_context": "commits must carry decision context for cross-session retrieval"
  },
  "classification": {
    "activity_classes": ["code"],
    "affected_surfaces": ["tools"]
  },
  "provenance": {
    "branch": "feature/git-memory-enforce",
    "worktree": "product-detox",
    "timestamp": "2026-03-24T10:00:00Z",
    "gate_passed": "2026-03-24T10:00:00Z"
  },
  "gate_result": {
    "memory_enforced": true,
    "memory_context_present": true,
    "linkage_valid": true,
    "tags_valid": true,
    "orphan_status": "linked"
  }
}
```

## Field Definitions

### `_meta` (required)

Standard metadata block. `created_at` and `updated_at` are ISO 8601 timestamps.

### `commit_sha` (required)

Full 40-character git SHA of the commit. Used as the primary key for index lookups.

### `memory` (required)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `what` | string | Yes | ≤ 120 chars |
| `why` | string | Yes | Must reference a decision driver |
| `who_decided` | string | Yes | Agent name or `user:<handle>` |
| `evidence` | string[] | Yes | Non-empty for non-trivial commits |
| `alternatives_considered` | string[] | No | Recommended for non-trivial commits |

### `linkage` (required, with minimum)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `packet_id` | string \| null | At least one of packet/decision/phase | `batch_` or `delegation_` prefix |
| `plan_phase` | string \| null | At least one of packet/decision/phase | One of the phase values |
| `decision_id` | string \| null | At least one of packet/decision/phase | `decision_{YYYYMMDD}_{hash}` |
| `delegation_chain` | string[] | No | Array of agent names in order |
| `task_id` | string \| null | No | OpenCode SDK task_id |
| `pass_id` | string \| null | No | `pass_NNN` format |

### `retrieval` (required)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `tags` | string[] | Yes | 5-8 kebab-case tags |
| `memory_context` | string | Yes | ≤ 100 chars, one-line decision summary |

### `classification` (required)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `activity_classes` | string[] | Yes | From hivemind-atomic-commit taxonomy |
| `affected_surfaces` | string[] | No | Surface class names |

### `provenance` (required)

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `branch` | string | Yes | Branch name at commit time |
| `worktree` | string | Yes | Worktree name |
| `timestamp` | string | Yes | ISO 8601 |
| `gate_passed` | string | Yes | ISO 8601, must match gate timestamp |

### `gate_result` (required)

| Field | Type | Description |
|-------|------|-------------|
| `memory_enforced` | boolean | Whether memory gates were run |
| `memory_context_present` | boolean | Whether memory_context was in message |
| `linkage_valid` | boolean | Whether linkage minimum was met |
| `tags_valid` | boolean | Whether tags passed validation |
| `orphan_status` | string | `linked` or `memory_orphan` |

## Validation

Records are validated against this schema at:
1. Creation time (before commit)
2. Index registration time (after commit)
3. Retrieval time (when querying)

Invalid records are flagged with `validation_errors` array and `confidence: low`.
