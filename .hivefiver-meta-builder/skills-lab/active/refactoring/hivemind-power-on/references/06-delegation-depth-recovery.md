# Reference 06: Delegation Depth Recovery

**See also:** [01-session-tracker-anatomy.md](#), [02-task-tool-resume.md](#), [05-continuity-navigation.md](#)

## Summary

Depth is a state variable tracked in `session-continuity.json` and exposed through tool actions. This reference explains how to check current depth, handle depth violations, and understand the depth guardrail rules.

## Depth Rules

| Rule | Exceptions | Enforcement |
|------|-----------|-------------|
| **Hard limit:** Max depth = 3 | None | Circuit breaker trips at depth >= 3 |
| **L0 human dispatch:** Treated as depth 0 | N/A | Always resets to 0 |
| **L1 coordinator dispatch:** Creates depth 1 | L2 can't dispatch further | Dispatching from L1 increases depth to 1 |
| **L2 specialist dispatch:** Creates depth 2 | L2 can delegate to subtools (depth limit: subtools = 2 max) | Dispatching from L2 increases depth to 2 (or 3 if subtool inside subtool) |
| **Subtle recovery:** Session depth reset | Only when re-serialized by L0 | New dispatch from L0 resets depth |
| **Recovery by L2:** Redispatched task | L2 cannot to | None |
| **Recovery by L1:** Redispatched from same L1 | Same | L1 dispatches at depth 1, which is below the max depth |
| **Resume from SDK v2:** Creates depth 0 | N/A | SDK session-tracking reports original depth |
| **Parallel dispatch:** Depth count stays | Parallel agents at same depth | Both count as same depth level |

## Current Depth Check

```
session-hierarchy({action: "get-delegation-depth", sessionId: "<id>"})
```

Returns:
```json
{
  "sessionId": "<id>",
  "currentDepth": 1,
  "maxDepthAllowed": 3,
  "canDispatch": true
}
```

If `canDispatch` === false, an L1 coordinator must take over for further dispatching.

## Depth State in session-continuity.json

```json
{
  "delegations": {
    "<sessionId>": {
      "sessionId": "<id>",
      "depth": <0|1|2>,
      "parentId": "<parent-id-or-null>",
      "status": "dispatched" | "running" | "completed" | "error" | "timeout"
    }
  }
}
```

`delegationDepth` in `session-continuity.json` also records the depth at save time for the current session.

## Recovery Scenarios

### Scenario A: L0 Dispatched L1, L1 Crashed Before Returning

**Situation:** `delegation-status({action: "list", status: "running"})` shows L1 as running.
**Action:** L0 can resume L1 at depth 1 via `task({task_id: "<L1-id>", prompt: "Continue"})`.
**Why it works:** L0 dispatch resets depth to 0, L1 dispatch creates depth 1, all within limits.
**Tool to use:** `filter-sessions({status: "active"})` to find the L1 session, then `task()`.

### Scenario B: L1 Dispatched L2, L2 Crashed

**Situation:** L2 shows as running or error in `get-manifest`.
**Action:** L1 should NOT dispatch a new L2 — it should resume the existing L2 if possible, or return to L0 for fresh dispatch.
**Tool to use:** `hivemind-session-view({action: "get", sessionId: "<L2-id>"})` to assess state.

### Scenario C: Depth Limit Reached (maxDepthAllowed === false)

**Situation:** `get-delegation-depth` returns `canDispatch: false`.
**Action:** Return to L0. L0 dispatches a new L1, which can create a fresh depth = 1 chain.
**Why it works:** L0 always resets depth.

### Scenario D: Parallel Dispatch at Same Depth

**Situation:** Multiple L1 dispatches from L0.
**Action:** Depth remains 1 for all. No depth violation.
**Tool:** `session-hierarchy({action: "get-manifest", sessionId: "<L0-id>"})` shows all children.

## Fallback: Manual Depth Inspection

If tool actions are unavailable:

```bash
# Read delegation records directly
cat .hivemind/state/session-continuity.json | node -e "
const fs = require('fs');
const stdin = fs.readFileSync('/dev/stdin', 'utf8');
const data = JSON.parse(stdin);
Object.entries(data.delegations || {}).forEach(([id, d]) => {
  console.log(id, 'depth:', d.depth, 'status:', d.status);
});
"
```
