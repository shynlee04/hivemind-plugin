# Decision Log Schema

This reference defines the JSONL contract for `.hivemind/state/decisions.jsonl`.

## File Contract

- Path: `.hivemind/state/decisions.jsonl`
- Format: one JSON object per line (`JSONL`)
- Write model: append-only for new decisions
- Update model: supersession links may update existing lines retroactively

## Canonical Record

```json
{
  "id": "dec/{module}/{topic}/{seq}",
  "timestamp": 1709337600,
  "content": "Use content-derived slugs instead of SHA256 hashes",
  "rationale": "Opaque hashes are not consumable by agents or humans",
  "supersedes": null,
  "superseded_by": null,
  "hierarchy_node": "action/fix-schemas",
  "agent": "hivefiver",
  "session_id": "ses_abc123"
}
```

## Field Definitions

- `id` (string, required): `dec/{module}/{topic}/{seq}`
- `timestamp` (number, required): Unix epoch seconds at append time
- `content` (string, required): Decision statement
- `rationale` (string, required): Why this decision was made
- `supersedes` (string|null): Prior decision id this line overrides
- `superseded_by` (string|null): Newer decision id that overrides this line
- `hierarchy_node` (string|null): Related hierarchy location
- `agent` (string|null): Agent identifier
- `session_id` (string|null): Session identifier

## ID Rules

- Pattern: `dec/{module}/{topic}/{seq}`
- `module` and `topic` are human-readable, content-derived slugs
- `seq` is zero-padded to 3 digits and increments per `{module, topic}` pair
  - First decision for pair: `001`
  - Second decision for same pair: `002`

## Supersession Rules

When decision B overrides decision A:

- `B.supersedes = A.id`
- `A.superseded_by = B.id`

The second link (`A.superseded_by`) is a retroactive update and requires rewriting
the existing line for A in the JSONL file.

## Query Semantics

- Active decisions: records where `superseded_by == null`
- Historical decisions: records where `superseded_by != null`
