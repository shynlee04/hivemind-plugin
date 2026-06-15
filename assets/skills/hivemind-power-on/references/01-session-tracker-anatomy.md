# Reference 01: Session-Tracker Anatomy

**See also:** [02-task-tool-resume.md](#), [05-continuity-navigation.md](#)

## Summary

This reference describes the actual data files in `.hivemind/session-tracker/`. Three JSON schemas define the session state: `project-continuity.json` (master index), `session-continuity.json` (hierarchy per session), and `hierarchy-manifest.json` (flattened child list). Use the tool actions (`filter-sessions`, `get-manifest`) to query this data rather than reading files directly.

## Directory Structure

```
.hivemind/session-tracker/
├── project-continuity.json              # Master index — all sessions
└── ses_<24-char-id>/                    # One directory per main session
    ├── ses_<24-char-id>.md              # Full session capture (YAML frontmatter + conversation)
    ├── session-continuity.json          # Delegation hierarchy tree
    ├── hierarchy-manifest.json          # Flattened child list (NEW — Phase 16)
    └── ses_<child-id>.json              # Child session detail (per delegation)
```

## project-continuity.json — Master Index

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

### Key Fields

| Field | Meaning | Used For |
|-------|---------|----------|
| `status: "active"` | Session running or aborted mid-delegation | `filter-sessions({status: "active"})` finds these |
| `status: "idle"` | Alive but no active delegations | Generally safe to skip |
| `status: "completed"` | Finished cleanly | Skip for resume |
| `status: "error"` | Terminated with error | May need manual inspection |
| `childCount` | Number of child delegations | Quick filter for sessions with activity |
| `totalDelegationDepth` | Maximum delegation depth | 0=root only, 3=max depth |
| `updated` | Last write timestamp | Sort to find most recent |

## session-continuity.json — Delegation Hierarchy

```json
{
  "version": "2.0",
  "sessionID": "<sessionId>",
  "lastUpdated": "<ISO-8601>",
  "status": "active" | "idle" | "completed" | "error",
  "turnCount": <number>,
  "toolSummary": { },
  "delegationDepth": <number>,
  "hierarchy": {
    "root": "<same sessionId>",
    "children": [
      {
        "childSessionId": "<id>",
        "childFile": "<id>.json",
        "depth": <1|2>,
        "status": "active" | "completed" | "error",
        "delegatedBy": "<agent_type>",
        "parentSessionId": "<parent-id>",
        "turnCount": <number>,
        "lastMessage": "<snippet or null>",
        "delegationTime": "<ISO-8601>"
      }
    ]
  }
}
```

### Key Fields for Delegation Trees

| Field | Meaning |
|-------|---------|
| `hierarchy.children[].childSessionId` | Child session ID — used as `task_id` for resume |
| `hierarchy.children[].depth` | 1=L1 child, 2=L2 grandchild |
| `hierarchy.children[].status` | Child session state |
| `hierarchy.children[].delegatedBy` | Agent type dispatched — use EXACT value for resume |
| `hierarchy.children[].lastMessage` | Last message content (truncated to 500 chars) |
| `hierarchy.children[].turnCount` | Number of turns in child session |
| `turnCount` | Turns in parent session |
| `toolSummary` | Tools used: `{toolName: callCount}` |
| `delegationDepth` | Current delegation depth at capture time |

## hierarchy-manifest.json — Flattened Child List (NEW)

```json
{
  "version": "1.0",
  "sessionId": "<parent-id>",
  "lastUpdated": "<ISO-8601>",
  "children": [
    {
      "childSessionId": "<id>",
      "childFile": "<id>.json",
      "depth": <1|2>,
      "status": "active" | "completed" | "error",
      "delegatedBy": "<agent_type>",
      "parentSessionId": "<parent-id>",
      "turnCount": <number>,
      "delegationTime": "<ISO-8601>"
    }
  ]
}
```

### Purpose

`hierarchy-manifest.json` provides a **flattened** view of all children at any depth. Unlike `session-continuity.json` which uses a nested tree structure, the manifest is a simple array. This makes it faster to consume when you only need the child list, not the tree structure.

**When to use:**
- Call `session-hierarchy({action: "get-manifest", sessionId})` — reads this file
- Use when you need all children regardless of nesting depth
- Use when you need to quickly scan `status` and `delegatedBy` across the full delegation tree

## Session .md File Format

```yaml
---
session_id: "ses_xxxx"
created: "<ISO-8601>"
updated: "<ISO-8601>"
parent_session_id: null
delegation_depth: 0
children:
  - session_id: "ses_child"
    child_file: "ses_child.json"
continuity_index: "session-continuity.json"
status: "active"
---
```

The .md file contains the full conversation turns. Key extraction points:

| What to find | How |
|-------------|-----|
| Last user intent | Search for `## USER (turn` on .md — read last match |
| Last task dispatch | Search for `## TOOL: task` on .md — read last match |
| Agent type for resume | From task tool call: `subagent_type` field |

## Efficient Reading Patterns

| Goal | Tool / Command |
|------|---------------|
| List all sessions | `session-tracker({action: "list-sessions"})` |
| Find active sessions | `session-tracker({action: "filter-sessions", status: "active"})` |
| Search across all sessions | `session-tracker({action: "search-sessions", query: "<term>"})` |
| View delegation tree | `session-hierarchy({action: "get-manifest", sessionId})` |
| Get unified session view | `hivemind-session-view({action: "get", sessionId})` |
| Fallback: find directories | `glob(".hivemind/session-tracker/*/")` |
