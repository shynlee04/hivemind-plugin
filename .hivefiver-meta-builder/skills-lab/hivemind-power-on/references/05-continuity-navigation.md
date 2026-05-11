# Reference 05: Continuity Navigation

## File Purpose Summary

| File | Location | Contains |
|------|----------|----------|
| `project-continuity.json` | `.hivemind/session-tracker/` | Index of ALL main sessions in the project |
| `session-continuity.json` | `.hivemind/session-tracker/<sessionId>/` | Delegation hierarchy WITHIN one session |
| `<sessionId>.md` | `.hivemind/session-tracker/<sessionId>/` | Full capture of session content (turns, tool calls) |
| `<childId>.json` | `.hivemind/session-tracker/<parentId>/` | Child session details |

## project-continuity.json — Navigation

### Read it:
```json
{
  "version": "2.0",
  "projectRoot": "/absolute/path/to/project",
  "lastUpdated": "2026-05-11T12:36:32.353Z",
  "sessions": {
    "<sessionId>": {
      "dir": "<sessionId>/",
      "mainFile": "<sessionId>.md",
      "continuityIndex": "<sessionId>/session-continuity.json",
      "created": "2026-05-10T23:30:16.540Z",
      "updated": "2026-05-10T23:30:16.540Z",
      "status": "active",
      "childCount": 0,
      "totalDelegationDepth": 0
    }
  },
  "chronologicalOrder": ["<sessionId1>", "<sessionId2>", ...]
}
```

### How to use it:
```
1. Read once at power-on — small JSON, ~500 lines even with 50 sessions

2. Filter active sessions:
   sessions where .status === "active"

3. Find sessions with aborted delegations:
   active sessions where .childCount > 0

4. Sort by recency:
   Sort active sessions by .updated descending

5. For each candidate, read its session-continuity.json
```

### Status field explainer:
- **"active"** — Session was started but never terminated. May have aborted delegations. **CHECK FIRST.**
- **"idle"** — Session is alive but has no active delegations. Safe to skip.
- **"completed"** — Session finished successfully. Skip.
- **"error"** — Session failed. Skip for auto-resume. May need manual inspection.

### childCount and totalDelegationDepth:
- `childCount: 0` → No delegations were made. Safe to skip.
- `childCount: >0` → Delegations exist. Check if any are still "active".
- `totalDelegationDepth: 0` → Root session only, no delegation tree.
- `totalDelegationDepth: 1` → L1 children exist.
- `totalDelegationDepth: 2` → L2 grandchildren exist (deepest possible).

## session-continuity.json — Navigation

### Read it:
```json
{
  "version": "2.0",
  "sessionID": "<this session ID>",
  "lastUpdated": "2026-05-11T09:41:51.487Z",
  "hierarchy": {
    "root": "<this session ID>",
    "children": {
      "<childSessionId>": {
        "file": "<childSessionId>.json",
        "depth": 1,
        "status": "active",
        "delegatedBy": "<agent_type>",
        "children": {
          "<grandchildSessionId>": {
            "file": "<grandchildSessionId>.json",
            "depth": 2,
            "status": "active",
            "delegatedBy": "<agent_type>",
            "children": {}
          }
        }
      }
    }
  },
  "turnCount": 5,
  "toolSummary": {}
}
```

### How to traverse children:
```
1. hierarchy.children → map of childId → childInfo
2. For each child, check .status
3. Active children → need resume
4. For each active child, check .children for grandchildren
5. Grandchildren → deeper delegation, resume deepest first
```

### Find deepest active:
```
function getDeepestActive(hierarchy):
  deepest = null
  maxDepth = -1

  for each child in hierarchy.children:
    if child.status === "active":
      if child.depth > maxDepth:
        deepest = child
        maxDepth = child.depth
      // Check grandchildren recursively
      for each grandchild in child.children:
        if grandchild.status === "active" and grandchild.depth > maxDepth:
          deepest = grandchild
          maxDepth = grandchild.depth

  return deepest  // { sessionId, depth, delegatedBy }
```

## Parent → Child Chain Tracing

### Trace from root to deepest active:
```
1. Read project-continuity.json → find active parent sessions
2. Read parent's session-continuity.json → find active children
3. For each active child → check if child has its own session-continuity.json
4. If child has active grandchildren → trace to grandchildren
5. Deepest active = resume target

Example chain:
  ses_1ebe832c5ffeeYuFbS1kqleZnD (root, L0)
    ├── ses_1ebe39941ffecHehSRcc13IqeD (L1 child, depth=1, active, delegatedBy=hm-l2-auditor)
    └── ses_1ebd373b1ffeDa7AJ7KJIPShVE (L1 child, depth=1, active, delegatedBy=hm-l2-researcher)

  → Two active L1 children. Both need resume.
  → Resume ses_1ebe39941ffecHehSRcc13IqeD first (only one needs to run at a time for sequential dispatch)
```

## Real Example Walkthrough

### Step 1: Read project-continuity.json
```
read(".hivemind/session-tracker/project-continuity.json")
→ 47 sessions, most recent: ses_1e8f5fe2fffeaOjWuQ8dOk7Z8i
→ Most have childCount=0, status="active"
```

### Step 2: Filter for sessions with active children
```
Filter: sessions with childCount > 0 AND status === "active"
Results (from real data):
  - ses_1ebe832c5ffeeYuFbS1kqleZnD: childCount=2, depth=1
  - ses_1e9a6ecf5ffev5trgNwpy4CjOf: childCount=5, depth=1
  - ses_1e97a18f0ffe4tz4GJcaLAfmC3: childCount=4, depth=1
  - ses_1e903ee6effet2MD0kFjZUNzug: childCount=1, depth=1
```

### Step 3: Check children for active status
```
Read: ses_1e9a6ecf5ffev5trgNwpy4CjOf/session-continuity.json
→ 5 children, ALL active, ALL depth=1
  - ses_1e99c28bbffek55k6UCs0G7d4N delegatedBy=main_l0_agent
  - ses_1e99ac4e3ffeSa0QV5dg96628Q delegatedBy=main_l0_agent
  - ses_1e99bd468ffetJO2iV7K2XEqmc delegatedBy=main_l0_agent
  - ses_1e99b195affetbGfs42YyehaEO delegatedBy=main_l0_agent
  - ses_1e99b6d51ffePAxZJNXXFiOv24 delegatedBy=main_l0_agent

→ None have grandchildren. All depth=1.
```

### Step 4: Identify resume target
```
No grandchildren exist. Pick the most recently updated parent session:
  ses_1e97a18f0ffe4tz4GJcaLAfmC3 (updated: 2026-05-11T11:24:39.541Z)
  → First active child: ses_1e9734971ffewoLT5pzVTcvXJk (delegatedBy=main_l0_agent)
  → Resume: task(description="resume", subagent_type="main_l0_agent",
                   task_id="ses_1e9734971ffewoLT5pzVTcvXJk")
```

## Field Meaning Summary

| Field | In File | Meaning |
|-------|---------|---------|
| `sessionId` (root key) | project-continuity.json | Main session identifier |
| `status` | Both files | Session state: active/idle/completed/error |
| `childCount` | project-continuity.json | Number of child sessions created |
| `totalDelegationDepth` | project-continuity.json | Max delegation depth |
| `hierarchy.root` | session-continuity.json | Self-reference to root session |
| `hierarchy.children.<id>.depth` | session-continuity.json | 1=L1 child, 2=L2 grandchild |
| `hierarchy.children.<id>.status` | session-continuity.json | Child state |
| `hierarchy.children.<id>.delegatedBy` | session-continuity.json | Agent type dispatched |
| `hierarchy.children.<id>.children` | session-continuity.json | Grandchildren (recursive) |
| `turnCount` | session-continuity.json | Number of turns in parent session |
| `chronologicalOrder` | project-continuity.json | All session IDs in creation order |
