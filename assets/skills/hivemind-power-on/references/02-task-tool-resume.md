# Reference 02: Task Tool Resume — The Truth

**See also:** [01-session-tracker-anatomy.md](#), [05-continuity-navigation.md](#), [06-delegation-depth-recovery.md](#)

## Summary

This reference describes the actual resume workflow using real tool capabilities. Unlike the previous aspirational guidance, this document is honest about limitations: task tool resume **depends on SDK v2**. Use `filter-sessions` for discovery, `get-manifest` for hierarchy inspection, and `hivemind-session-view` for unified views. Then attempt resume via `task(task_id=...)` — but verify SDK support first.

## The Real Resume Workflow

### Step 1: Discover Active Sessions

```
session-tracker({action: "filter-sessions", status: "active"})
```

Returns:
```json
[
  {
    "sessionId": "ses_1e665f792ffe...",
    "agentType": "gsd-planner",
    "depth": 1,
    "status": "active",
    "lastMessage": "Planning complete, ready to execute...",
    "createdAt": "2026-05-10T23:30:16.540Z",
    "updatedAt": "2026-05-11T09:41:51.487Z",
    "toolSummary": { "read": 23, "write": 5, "grep": 12 }
  }
]
```

Additional filter options:
- `agentType: "gsd-planner"` — Filter by agent type
- `minDepth: 1, maxDepth: 2` — Filter by delegation depth
- `timeRange: { after: "2026-05-10T00:00:00Z" }` — Filter by time

### Step 2: Inspect Delegation Hierarchy

```
session-hierarchy({action: "get-manifest", sessionId: "<id>"})
```

Returns the flattened child list from `hierarchy-manifest.json`. This is faster than recursive tree traversal.

### Step 3: Get Unified View (Optional)

```
hivemind-session-view({action: "get", sessionId: "<id>"})
```

Returns `{ session: {...}, delegations: [...], trajectory: {...} }` — the complete picture from three data roots in one call.

### Step 4: Attempt Resume

```
task({subagent_type: "<agentType>", task_id: "<sessionId>", prompt: "Continue"})
```

**IMPORTANT — Verify SDK support first:**

```bash
# Check if SDK supports task_id resume
node -e "const pkg = require('@opencode-ai/sdk/package.json'); console.log(pkg.version);"
```

If SDK version >= 2.x, task_id resume should preserve context.
If SDK version < 2.x, `task(task_id=...)` may start a new session instead.

**Verification after dispatch:**
```
delegation-status({action: "status", delegationId: "<id>"})
```

## What Changed from the Old Guidance

| Old (Aspirational) | New (Truthful) |
|-------------------|----------------|
| "Context is auto-preserved" | "Context preservation depends on SDK v2" |
| "No thought must — just delegate" | "Verify SDK support before dispatching" |
| "Even if wrong it returns safely" | "If SDK doesn't support resume, task_id is ignored" |
| `find-resumable` action | `filter-sessions({status: "active"})` |
| Manual .md file reading | Tool actions: get-manifest, hivemind-session-view |

## Parameter Guide

| Parameter | Required | Value |
|-----------|----------|-------|
| `subagent_type` | Yes | EXACT agent type from `delegatedBy` field (use `get-manifest` to find it) |
| `task_id` | Yes | The child's session ID (24-char hex, from `filter-sessions` output) |
| `description` | Yes | Brief description (3-5 words) |
| `prompt` | Optional | "Continue" or minimal — context may not be preserved on older SDKs |

## Failure Modes

| Failure | Likely Cause | Action |
|---------|-------------|--------|
| `task()` returns new session ID | SDK < 2.x doesn't support resume | Extract original prompt from session .md, create fresh dispatch |
| Resume returns "I don't recognize this" | Wrong task_id or expired session | Fall back to `filter-sessions` to find correct session |
| Session shows "active" but resume fails | Session was externally terminated | Check `delegation-status`; create fresh dispatch if needed |
| `get-manifest` returns empty | No delegations created yet | Session is root-level only — no child to resume |
