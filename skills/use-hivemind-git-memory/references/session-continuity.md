# Session Continuity

## Purpose

Carry session identity and state across turns, resumptions, and nested delegations using deterministic file locations.

## Session Identifiers

| Identifier | Source | Use |
|-----------|--------|-----|
| `sessionID` | OpenCode SDK `context.sessionID` | Official session identifier at the platform boundary |
| `ses_id` | Internal persisted alias of `sessionID` | Stored in local continuity JSON for compact project-local state |
| `task_id` | OpenCode SDK subagent continuation | Resumes a specific subagent context; fresh call without it starts from scratch |
| `pass_id` | Pack convention | Identifies a specific scan or work pass within a session |
| `batch_id` | Pack convention | Identifies a batch within a pass |

`continuity.json` is an internal-only pack artifact. It mirrors selected official identifiers and adds local recovery fields such as branch, worktree, and activity typing. It is not a competing source of truth beside the SDK.

## Continuity State File

Stored at `{project}/.hivemind/activity/sessions/continuity.json`:

```json
{
  "_meta": {
    "created_at": "2026-03-22T04:00:00Z",
    "updated_at": "2026-03-22T04:00:00Z"
  },
  "current_session": {
    "sessionID": "abc-123",
    "ses_id": "abc-123",
    "task_id": null,
    "agent": "explorer",
    "branch": "refactor/product-detox-concerns",
    "worktree": "/repo/.worktrees/product-detox",
    "worktree_role": "primary | linked | scratch",
    "activity_type": "planning",
    "phase_type": "entry",
    "started_at": "2026-03-22T04:00:00Z",
    "last_turn_at": "2026-03-22T04:05:00Z",
    "turn_count": 3,
    "open_loop_ids": [],
    "open_packet_ids": [],
    "commit_anchor": {
      "summary": "tighten delegation loop contract",
      "tags": ["planning", "delegation", "continuity"]
    }
  },
  "activity_log": [
    {
      "at": "2026-03-22T04:03:00Z",
      "activity_type": "planning",
      "phase_type": "entry",
      "summary": "resumed refactored pack hardening"
    }
  ],
  "subsessions": [
    {
      "task_id": "task-456",
      "agent": "explorer",
      "activity_type": "codescan",
      "phase_type": "high-level-map",
      "purpose": "scan src/tools/",
      "status": "complete",
      "output_path": ".hivemind/activity/codescan/pass_1/batch_1.json"
    }
  ],
  "resume_history": [
    {
      "ses_id": "prev-789",
      "resumed_at": "2026-03-22T03:50:00Z",
      "reason": "session compaction"
    }
  ]
}
```

## Turn Carry-Forward Protocol

At the end of each turn or before handoff:

1. **Update `continuity.json`** with the current `ses_id`, `turn_count`, and `last_turn_at`.
2. **Mirror current git control context** with `branch`, `worktree`, and `worktree_role`.
3. **Record the active `activity_type` and `phase_type`** so the next turn knows which layer of work was in progress.
4. **Record `open_loop_ids` and `open_packet_ids`** when delegation, codescan, or debug work is still active.
5. **Attach a brief `commit_anchor`** when the turn meaningfully changes planning, delegation, verification, or refactor posture.
6. **Record any active `task_id`s** from subagent work in the `subsessions` array.
7. **Record any output paths** generated during this turn so the next turn knows where to find them.
8. **If a long-haul task is active**, update `activity/{domain}/task-state.json` with the latest checkpoint (where `{domain}` is the current active domain).

At the start of a new turn:

1. **Read `continuity.json`** to recover session identity and active subsessions.
2. **Check `branch` and `worktree`** against current git evidence before trusting the continuity state.
3. **If `task_id` references exist**, use them to resume subagent work instead of starting fresh.
4. **If output paths exist**, verify they still contain valid files before trusting their content.
5. **Increment `turn_count`** and update `last_turn_at`.

## Long-Haul Task State

For work spanning many turns (refactors, large scans, phased restoration):

Stored at `{project}/.hivemind/activity/{domain}/task-state.json` (domain-scoped, not global):

```json
{
  "_meta": {
    "created_at": "2026-03-22T04:00:00Z",
    "updated_at": "2026-03-22T04:20:00Z"
  },
  "active_task": {
    "id": "skill-pack-enrichment",
    "description": "Enrich refactored skills pack for long-haul work",
    "activity_type": "refactor",
    "phase_type": "stabilization",
    "branch": "refactor/product-detox-concerns",
    "worktree": "/repo/.worktrees/product-detox",
    "worktree_role": "linked",
    "started_at": "2026-03-22T04:00:00Z",
    "phase": "enrichment",
    "checkpoint": {
      "turn": 5,
      "last_completed": "delegation-protocol enrichment",
      "next_step": "codemap enrichment",
      "blocking_issues": [],
      "open_loop_ids": [],
      "open_packet_ids": [],
      "commit_anchor": null
    }
  },
  "completed_tasks": []
}
```

## Git-Memory Integration

When using `use-hivemind-git-memory` to resume:
- Check `continuity.json` first for recent session state.
- Fall back to git history only when `continuity.json` is missing, stale (>24h since `last_turn_at`), or the session has no `ses_id` / `sessionID` linkage.
- If both sources exist, prefer `continuity.json` for recent state and git history for rationale and decisions.

## Commit Anchor Guidance

Use short anchor summaries with tags. Keep them brief and typed.

Example:

```json
{
  "summary": "tighten phase-based codescan handoff",
  "tags": ["codescan", "delegation", "continuity"],
  "activity_type": "codescan",
  "phase_type": "pipeline-map"
}
```

## Anti-Patterns

- Starting a fresh subagent without checking if a `task_id` exists for resuming prior context
- Assuming continuity state is current without checking `last_turn_at` age
- Assuming all activity artifacts live under one flat structure
- Mixing artifacts from different domains in the same folder
