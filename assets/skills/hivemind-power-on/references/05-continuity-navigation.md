# Reference 05: Continuity Navigation

**See also:** [01-session-tracker-anatomy.md](#), [02-task-tool-resume.md](#)

## Summary

Navigation across the persistence layer. Three data roots feed the tool-based surface. This reference describes what each holds, and the preferred read path via tool actions.

## Three-Data-Root Architecture

```
.hivemind/state/
├── session-continuity.json     # Delegation records + hierarchy
├── delegations.json            # Legacy/durable delegation store
└── events.jsonl                # Event log (Phase 16)
```

### session-continuity.json

The durable delegation store written by `src/task-management/continuity/index.ts`. Contains the delegation hierarchy records. Written at delegation boundaries (create, complete).

```json
{
  "version": "2.0",
  "rootSessionId": "<root>",
  "startTime": "<ISO-8601>",
  "lastUpdated": "<ISO-8601>",
  "lastPhaseCheckpoint": "<phase-name>",
  "delegations": {
    "<sessionId>": {
      "sessionId": "<id>",
      "parentId": "<parent-id-or-null>",
      "rootId": "<root>",
      "depth": <0|1|2>,
      "status": "dispatched" | "running" | "completed" | "error" | "timeout",
      "agentType": "<agent>",
      "created": "<ISO-8601>",
      "updated": "<ISO-8601>",
      "completedAt": "<ISO-8601-or-null>",
      "turnCount": <number>,
      "error": "<error-message-or-null>",
      "resultSummary": "<result-or-null>"
    }
  }
}
```

### delegations.json (Legacy)

```json
{
  "<delegationId>": {
    "sessionId": "<id>",
    "status": "...",
    "agentType": "...",
    ...
  }
}
```

Written by `delegation-persistence.ts`. Partially migrated to `session-continuity.json`. Use for cross-reference when continuity records don't have the full picture.

### events.jsonl (Event Log)

```
{"type":"delegation_dispatch","sessionId":"...","timestamp":"...","data":{...}}
{"type":"delegation_complete","sessionId":"...","timestamp":"...","data":{...}}
{"type":"session_resume","sessionId":"...","timestamp":"...","data":{...}}
```

Append-only JSON lines format. Each row is a single event. Use `grep` or `rg` for event filtering.

## Preferred Read Paths

| Data Needed | Tool / Command | File(s) Queried |
|-------------|---------------|-----------------|
| List active delegations | `delegation-status({action: "list", status: "running"})` | `session-continuity.json` |
| Inspect delegation chain | `session-hierarchy({action: "get-manifest", sessionId})` | `hierarchy-manifest.json` |
| Unified session view | `hivemind-session-view({action: "get", sessionId})` | All three roots |
| Resume a session | `task({task_id: "<id>", ...})` | `session-continuity.json` |
| Read event timeline | `grep "^.\{0,500\}" .hivemind/state/events.jsonl` | `events.jsonl` |
| Cross-reference by session | `delegation-status({action: "list"})` then match IDs | Both continuity files |
| Check delegation status | `delegation-status({action: "status", delegationId})` | `delegations.json` |

## hivemind-session-view Unified Return

```json
{
  "session": { /* project-continuity.json entry */ },
  "delegations": [ /* all delegations for this session */ ],
  "trajectory": { /* trajectory data if available */ },
  "recovered": true
}
```

This is the **recommended** read path for getting a complete picture of a session. It consolidates data from all three data roots into one response.

## Navigation Decision Tree

```
NEED CONTINUITY INFO?
    |
    ├── Just list running delegations?
    |   └── delegation-status({action: "list", status: "running"})
    |
    ├── Need full session context?
    |   └── hivemind-session-view({action: "get", sessionId})
    |
    ├── Need to resume a child session?
    |   └── session-hierarchy({action: "get-manifest", sessionId})
    |       → filter-sessions to find active
    |       → task(task_id=...) to resume
    |
    ├── Need event log for debugging?
    |   └── Read .hivemind/state/events.jsonl
    |       → Search for sessionId
    |       → Trace event sequence
    |
    └── Fallback (tools not available)?
        └── Read files directly:
            1. .hivemind/state/session-continuity.json
            2. .hivemind/state/delegations.json
            3. .hivemind/state/hierarchy-manifest.json
```

## Phase Checkpoints

`session-continuity.json` has a `lastPhaseCheckpoint` field. This records the last-plan-name when the continuity was last written. For GSD execution phases:

| Phase Pattern | Checkpoint Value |
|---------------|-----------------|
| `CP-*` | Control plane |
| `BOOT-*` | Bootstrap |
| `PHASE-*` | General development |
| `null` | No checkpoint recorded |

## Aggregation Tool

```
session-context({action: "aggregate", groupBy: "status"})
```

Returns quick aggregate statistics without traversing files individually. Useful for summary reports.
