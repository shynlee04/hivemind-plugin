# Memory-First Message Format

## Extended Commit Message Specification

Commit messages must carry semantic memory beyond code description.

### Format Template

```
<type>(<scope>): <description>

[body — 2-3 sentences max describing what changed and why]

[footer]
memory_context: <one-line decision summary>
packet_id: <linked packet or "none">
plan_phase: <phase or "none">
decision_id: <linked decision or "none">
who_decided: <agent or user>
evidence: <comma-separated evidence refs>
alternatives: <brief rejected alternative>
retrieval_tags: <comma-separated tags for search>
activity_classes: [<class>, ...]
rollback_method: <method>
gate_passed: <timestamp>
```

### Field Constraints

| Field | Constraint | Example |
|-------|------------|---------|
| `memory_context` | ≤ 100 chars, must state the decision driver | "commits must carry decision context for retrieval" |
| `packet_id` | `batch_` or `delegation_` prefix, or `none` | `batch_007` |
| `plan_phase` | One of the phase values from packet-linkage.md | `implementation` |
| `decision_id` | `decision_{YYYYMMDD}_{hash}` or `none` | `decision_20260324_a3f2` |
| `who_decided` | Agent name or `user:<handle>` | `hivemaker` |
| `evidence` | Comma-separated, no spaces after commas | `ADR-2026-03-23,batch_007,issue-42` |
| `alternatives` | Brief, format: `"<option> — rejected: <reason>"` | `"inline only — rejected: not queryable"` |
| `retrieval_tags` | 5-8 tags, comma-separated, kebab-case | `git-memory,commit-metadata,knowledge-network` |
| `activity_classes` | From hivemind-atomic-commit taxonomy | `[code]` |
| `rollback_method` | From hivemind-atomic-commit rollback methods | `revert-commit` |
| `gate_passed` | ISO 8601 timestamp | `2026-03-24T10:00:00Z` |

### Retrieval Tag Rules

1. Tags must be kebab-case: `git-memory` not `gitMemory`
2. Tags should include at least one of: topic keyword, phase name, agent name, affected surface
3. Maximum 8 tags per commit
4. Tags should be reusable — avoid overly specific tags that will never be searched again
5. New tags should be added to the project taxonomy when they first appear

### Message Length Limits

- Subject line: ≤ 72 characters
- Body: ≤ 300 characters (2-3 sentences)
- Footer: no limit (structured fields)
- Total message: ≤ 500 characters recommended

## Parsing Commit Messages

To extract memory fields from a commit message:

```bash
# Extract memory_context
git log -1 --format='%B' <sha> | grep -oP 'memory_context: \K.*'

# Extract packet_id
git log -1 --format='%B' <sha> | grep -oP 'packet_id: \K\S+'

# Extract retrieval_tags as array
git log -1 --format='%B' <sha> | grep -oP 'retrieval_tags: \K.*' | tr ',' '\n'
```

## Backward Compatibility

Commits that predate this skill may lack memory fields. The retrieval methodology (see retrieval-methodology.md) handles this by:
1. Parsing existing conventional commit format
2. Inferring `memory_context` from the subject line
3. Flagging as `memory_retrofit` rather than `memory_enforced`
