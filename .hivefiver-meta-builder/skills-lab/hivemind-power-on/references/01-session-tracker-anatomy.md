# Reference 01: Session-Tracker Anatomy

## Directory Structure

```
.hivemind/session-tracker/
├── project-continuity.json              # Cross-session index
└── ses_<24-char-id>/                    # One per main session
    ├── ses_<24-char-id>.md              # Full session capture (YAML + MD)
    ├── session-continuity.json          # Intra-session delegation hierarchy
    ├── ses_<child-id>.json              # Child session (delegation level 1)
    └── ses_<grandchild-id>.json         # Grandchild (delegation level 2)
```

## project-continuity.json Schema

```json
{
  "version": "2.0",
  "projectRoot": "<absolute-path>",
  "lastUpdated": "<ISO-8601>",
  "sessions": {
    "<sessionId>": {
      "dir": "<sessionId>/",
      "mainFile": "<sessionId>.md",
      "continuityIndex": "<sessionId>/session-continuity.json",
      "created": "<ISO-8601>",
      "updated": "<ISO-8601>",
      "status": "active" | "idle" | "completed" | "error",
      "childCount": <number>,
      "totalDelegationDepth": <number>
    }
  },
  "chronologicalOrder": ["<sessionId>", ...]
}
```

### Field Meanings

| Field | Meaning | Used For |
|-------|---------|----------|
| `status: "active"` | Session is running or aborted mid-delegation | Finding aborted sessions to resume |
| `status: "idle"` | Session alive but no active delegations | Skip in resume protocol |
| `status: "completed"` | Session finished cleanly | Skip in resume protocol |
| `status: "error"` | Session terminated with error | Skip in resume protocol |
| `childCount` | Number of children (delegations) | Filter for sessions with active children |
| `totalDelegationDepth` | Deepest delegation level | 0=no delegations, 3=max depth |
| `updated` | Last write timestamp | Sort to find most recent active |

### Navigation Pattern — Find Aborted Sessions

```
1. Read project-continuity.json
2. Filter: sessions with status === "active" AND childCount > 0
3. Sort: by updated descending (most recent first)
4. For each match: read its session-continuity.json
5. Look at hierarchy.children for children with status === "active"
6. The child with highest depth is the deepest aborted delegation
```

## session-continuity.json Schema

```json
{
  "version": "2.0",
  "sessionID": "<sessionId>",
  "lastUpdated": "<ISO-8601>",
  "hierarchy": {
    "root": "<same sessionId>",
    "children": {
      "<childSessionId>": {
        "file": "<childSessionId>.json",
        "depth": <1|2>,
        "status": "active" | "completed" | "error",
        "delegatedBy": "<agent_type>",
        "children": {
          "<grandchildSessionId>": {
            "file": "<grandchildSessionId>.json",
            "depth": <2>,
            "status": "active" | "completed" | "error",
            "delegatedBy": "<agent_type>",
            "children": {}
          }
        }
      }
    }
  },
  "turnCount": <number>,
  "toolSummary": {}
}
```

### Field Meanings

| Field | Meaning | Used For |
|-------|---------|----------|
| `depth: 1` | Child of root (L1-level delegation) | Filter: depth=1 = L1 aborted |
| `depth: 2` | Grandchild (L2-level delegation) | Filter: depth=2 = L2 aborted (deeper!) |
| `delegatedBy` | The agent type that was dispatched | Use EXACT SAME type for resume |
| `status: "active"` | Child is still running / aborted | **This is what you resume** |
| `children` | Nested children of this child | Check for depth=2 active children |

## How to Filter for the DEEPEST Active Delegation

```
Algorithm:
  1. Collect all active children from ALL active sessions
  2. For each active child, check if it has active grand-children
  3. Pick:
     a. Highest depth first (depth=2 > depth=1)
     b. Most recently updated parent session (tiebreaker)
  4. Use the child session ID AS the task_id for resume

Example:
  session ses_A has children:
    child_X: depth=1, status="active" (no grandchildren)
    child_Y: depth=1, status="active" (has grandchild_Z: depth=2, status="active")
  
  → grandchild_Z at depth=2 is the DEEPEST active.
  → Resume grandchild_Z first: task(..., task_id="<grandchild_Z>")
```

## Session .md File Format

```yaml
---
session_id: "ses_xxxx"
created: "<ISO-8601>"
updated: "<ISO-8601>"
parent_session_id: null              # null = root, or parent ID
delegation_depth: 0                  # 0=root, 1=child, 2=grandchild
children:
  - session_id: "ses_child"
    child_file: "ses_child.json"
continuity_index: "session-continuity.json"
status: "active"
---

## USER (turn 1)

<user prompt content>

## ASSISTANT (turn 1) — <agent_name> (<model>)

<assistant response>

## TOOL: task(tool_id=N, description="...", subagent_type="<type>")

{
  "task_id": "ses_child_id_here"
}
```

### Key extraction points:

| What to find | How |
|-------------|-----|
| Last user intent | grep `"## USER \\(turn"` on .md → read last match |
| Last task dispatch | grep `"## TOOL: task"` on .md → read last match |
| Agent type for resume | From task tool call: `subagent_type` field |
| Task ID for resume | From task tool output: `task_id` field |

## Efficient Reading Patterns

| Goal | Command |
|------|---------|
| Find last user turn in .md | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read last turn content | `read(filePath, offset=<lastUserLine>, limit=60)` |
| Find task dispatches | `grep(pattern: "## TOOL: task", include: "*.md")` |
| Find specific session child | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
| Search across all sessions | `session-tracker(action: "search-sessions", query: "<agent_type>")` |

## Anti-Pattern: Reading Full .md Files

**NEVER:** `read(".hivemind/session-tracker/ses_xxx/ses_xxx.md")` (could be 7000+ lines)

**ALWAYS:** Use grep to find the line number, then read with offset and limit.
