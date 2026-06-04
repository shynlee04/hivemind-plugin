# Execution State Template

Default root: `.opencode/state/opencode-harness/phase-execution/<phase>/`

Use this template for recoverable phase execution in arbitrary OpenCode projects. If the project defines a different state root, write an adapter note into the artifact.

## Directory Layout

```text
<root>/
├── claims/<plan>.json
├── artifacts/<plan>.md
├── done/<plan>.json
└── failures/<plan>.json
```

## Claim JSON

```json
{
  "phase": "29-example",
  "plan": "01",
  "wave": 1,
  "depends_on": [],
  "executor": "agent-session-id",
  "started_at": "2026-04-25T00:00:00Z",
  "stale_after": "2026-04-25T02:00:00Z",
  "status": "claimed"
}
```

## Done JSON

```json
{
  "phase": "29-example",
  "plan": "01",
  "completed_at": "2026-04-25T01:00:00Z",
  "verification": ["npm test", "npm run typecheck"],
  "artifacts": ["artifacts/01.md"],
  "commits": []
}
```

## Failure JSON

```json
{
  "phase": "29-example",
  "plan": "01",
  "failed_at": "2026-04-25T01:00:00Z",
  "blocked_by": "missing dependency artifact",
  "evidence": "path/to/output.log",
  "next_action": "repair dependency marker before rerun"
}
```
