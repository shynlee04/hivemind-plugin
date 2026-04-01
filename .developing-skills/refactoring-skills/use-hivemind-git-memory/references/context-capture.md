# Context Capture Protocol

## Required Fields

Every non-trivial commit must capture decision context before staging.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `what` | string | Yes | What changed — code, config, docs, etc. |
| `why` | string | Yes | Why this change was made — the decision rationale |
| `who_decided` | string | Yes | Agent name or `user:<name>` who made the decision |
| `evidence` | string[] | Yes (non-empty for non-trivial) | Supporting evidence: ADR IDs, delegation packets, issue refs |
| `alternatives_considered` | string[] | Recommended | What was rejected and why — format: `"<option> — rejected: <reason>"` |

## Validation Rules

1. `what` must be ≤ 120 characters and describe the change, not the commit mechanics
2. `why` must reference a decision driver (requirement, bug, plan phase, user request) — not just "improved code"
3. `who_decided` must be traceable: agent name from the current session, or `user:<handle>`
4. `evidence` must be non-empty for any commit touching >1 file or >20 lines
5. `alternatives_considered` is recommended but not required for trivial fixes

## Trivial Commit Exemption

Commits classified as `chore` with ≤ 3 files changed and ≤ 10 lines modified may skip `alternatives_considered` and use a shortened `evidence` array. The `what` and `why` fields are still required.

## Capture Workflow

```
1. Agent identifies what will be committed
2. Agent fills context fields: what, why, who_decided, evidence, alternatives
3. Agent validates against the rules above
4. Agent formats into commit message footer (see memory-message-format.md)
5. Agent proceeds to staging and commit
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `why: "improved code"` | Not a decision driver | Reference the specific requirement or bug |
| `evidence: []` | No traceability | Add at least one reference: ADR, packet, issue |
| `who_decided: "me"` | Not traceable | Use specific agent name or user handle |
| `what: "fixed stuff"` | Not descriptive | Describe the actual change |
| `alternatives: "none"` | Suspicious | At least one alternative always exists ("do nothing" counts) |
