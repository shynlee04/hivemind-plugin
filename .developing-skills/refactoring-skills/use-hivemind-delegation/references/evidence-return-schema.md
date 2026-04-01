# Evidence Return Schema

## Purpose

Delegation returns must be ingestible by another agent without guesswork. The evidence object standardizes how claims are paired with proof, how confidence is scored, and how different agent types report completion.

## Canonical Evidence Object

Use this shape for every evidence item:

```json
{
  "claim": "The packet template requires target_agent.",
  "evidence_quote": "\"target_agent\": \"hivexplorer\"",
  "source_url": "file:///project/.developing-skills/refactored-skills/use-hivemind-delegation/templates/delegation-packet.json",
  "source_title": "delegation-packet.json",
  "confidence": 0.98
}
```

## Field Definitions

| Field | Type | Required | Meaning |
|------|------|----------|---------|
| `claim` | string | yes | A specific, reviewable assertion |
| `evidence_quote` | string | yes | The exact supporting excerpt or command output |
| `source_url` | string | yes | File URL, HTTPS URL, or artifact URL |
| `source_title` | string | yes | Human-readable label for the source |
| `confidence` | number | yes | Numeric score from 0.0 to 1.0 |

## Confidence Scale

| Score | Meaning | Use When |
|------|---------|---------|
| 0.90-1.00 | Confirmed | Direct file read, command output, or live source quote |
| 0.70-0.89 | Strong inference | High-confidence synthesis from multiple aligned sources |
| 0.40-0.69 | Weak inference | One incomplete source or indirect signal |
| 0.00-0.39 | Unverified | Hypothesis only; should rarely ship in a final return |

## Evidence Rules

1. Every claim needs its own quote.
2. Confidence must be explicit and numeric.
3. Quotes must be direct, not paraphrased summaries.
4. `source_url` must resolve to the evidence location.
5. Multiple claims may cite the same source, but each claim still needs its own quote.

## Return Envelope

All agents should return evidence inside a shared envelope.

```json
{
  "status": "complete",
  "summary": "Packet validated with one warning.",
  "evidence": [],
  "blocked_routes": [],
  "recommended_next": "Proceed to verification",
  "artifacts": [],
  "_meta": {
    "producer": "hiveq",
    "packet_id": "batch-3-delegation",
    "created_at": "2026-03-29T12:00:00Z",
    "updated_at": "2026-03-29T12:05:00Z"
  }
}
```

## Shared Return Fields

| Field | Required | Notes |
|------|----------|-------|
| `status` | yes | `complete`, `partial`, or `blocked` |
| `summary` | yes | One-paragraph synthesis or short status line |
| `evidence` | yes | Array of canonical evidence objects |
| `blocked_routes` | yes | Empty array when nothing is blocked |
| `recommended_next` | yes | Concrete next step |
| `artifacts` | no | Output paths or URLs |
| `_meta` | yes | Producer, packet, timestamps |

## Agent-Specific Return Contracts

### `hivexplorer`

Use for read-only repo investigation.

Required emphasis:

- file-backed evidence
- `files_checked`
- `coverage_gaps`
- `blocked_routes` for missing context only

Recommended additions:

```json
{
  "files_checked": ["src/tools/task/index.ts"],
  "coverage_gaps": [],
  "evidence": []
}
```

### `hiverd`

Use for external ecosystem or web research.

Required emphasis:

- external URLs
- source freshness
- authority signal in `source_title` or summary
- explicit note when evidence is not local-code-backed

Recommended additions:

```json
{
  "search_query": "OpenCode delegation patterns 2026",
  "sources_consulted": 4
}
```

### `hiveq`

Use for verification against requirements.

Required emphasis:

- requirement-to-evidence mapping
- pass/fail disposition
- unresolved deviations

Recommended additions:

```json
{
  "verification_result": "pass",
  "requirement_checks": [
    {
      "requirement": "Packet includes evidence schema",
      "status": "pass",
      "evidence_refs": ["ev-001"]
    }
  ]
}
```

### `hivemaker`

Use for implementation returns.

Required emphasis:

- files changed
- verification command results
- deviations from scope

Recommended additions:

```json
{
  "files_modified": ["SKILL.md"],
  "verification": [
    { "command": "bash -n scripts/hm-packet-validate.sh", "status": "pass" }
  ],
  "deviations": []
}
```

## JSON Schema for Ingestion

Use this schema as the ingestion baseline.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["status", "summary", "evidence", "blocked_routes", "recommended_next", "_meta"],
  "properties": {
    "status": { "enum": ["complete", "partial", "blocked"] },
    "summary": { "type": "string", "minLength": 1 },
    "evidence": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["claim", "evidence_quote", "source_url", "source_title", "confidence"],
        "properties": {
          "claim": { "type": "string", "minLength": 1 },
          "evidence_quote": { "type": "string", "minLength": 1 },
          "source_url": { "type": "string", "minLength": 1 },
          "source_title": { "type": "string", "minLength": 1 },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
        },
        "additionalProperties": true
      }
    },
    "blocked_routes": { "type": "array", "items": { "type": "string" } },
    "recommended_next": { "type": "string", "minLength": 1 },
    "_meta": {
      "type": "object",
      "required": ["producer", "created_at", "updated_at"],
      "properties": {
        "producer": { "type": "string", "minLength": 1 },
        "packet_id": { "type": "string" },
        "created_at": { "type": "string", "minLength": 1 },
        "updated_at": { "type": "string", "minLength": 1 }
      },
      "additionalProperties": true
    }
  },
  "additionalProperties": true
}
```

## Minimal Valid Example

```json
{
  "status": "complete",
  "summary": "Confirmed that the packet validator enforces target_agent.",
  "evidence": [
    {
      "claim": "Validator rejects missing target_agent.",
      "evidence_quote": "Packet missing required field: target_agent",
      "source_url": "file:///project/scripts/hm-packet-validate.sh",
      "source_title": "hm-packet-validate.sh",
      "confidence": 0.97
    }
  ],
  "blocked_routes": [],
  "recommended_next": "Run verifier against a packet sample.",
  "_meta": {
    "producer": "hiveq",
    "packet_id": "packet-123",
    "created_at": "2026-03-29T12:00:00Z",
    "updated_at": "2026-03-29T12:00:00Z"
  }
}
```

## Invalid Patterns

| Invalid Pattern | Why It Fails |
|----------------|-------------|
| claim without quote | Assertion has no proof |
| quote without source URL | Evidence cannot be traced |
| prose confidence like `high` | Harder to validate mechanically |
| blocked return with empty next step | Parent cannot route the next move |
| summary only, no evidence array | Not ingestible for verification |

## Ingestion Checklist

- Is `status` one of the allowed values?
- Does every evidence item have all five canonical fields?
- Is `confidence` numeric and bounded between 0 and 1?
- Does `_meta.producer` identify the source agent?
- Is `recommended_next` actionable?
