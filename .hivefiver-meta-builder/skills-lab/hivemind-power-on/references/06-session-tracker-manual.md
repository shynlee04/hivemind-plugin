# Reference 06: Session-Tracker Manual

> **Jump targets:** [ref-06 §1]–[ref-06 §8]

## §1 — Tool API Reference

### session-tracker Tool API (validated against src/tools/hivemind/session-tracker.ts)

| Parameter | Type | Required For |
|-----------|------|-------------|
| `action` | `"export-session" \| "list-sessions" \| "search-sessions"` | All |
| `sessionId` | `string` | `export-session` |
| `query` | `string` | `search-sessions` |
| `limit` | `number` (1-100, default 20) | `list-sessions`, `search-sessions` |

### Response Shapes

- **list-sessions:** `{ total, sessions: [{ sessionId, metadata }], hasMore, indexLastUpdated }`
- **export-session:** `{ sessionId, content, filePath }`
- **search-sessions:** `{ totalMatches, sessions: [{ sessionId, file, snippet, matchLine }], hasMore }`

### Quick Invocation Reference

| Goal | Invocation |
|------|-----------|
| List all sessions | `session-tracker(action: "list-sessions", limit: 20)` |
| Export specific session | `session-tracker(action: "export-session", sessionId: "ses_xxx")` |
| Search for aborts | `session-tracker(action: "search-sessions", query: "aborted\|active\|cancelled")` |
| Read project index | `read(".hivemind/session-tracker/project-continuity.json")` |
| Read session hierarchy | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
| Find last user turn | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read specific section | `read(filePath, offset=N, limit=M)` — NEVER read full file |

## §2 — Directory Structure

```
.hivemind/session-tracker/
├── project-continuity.json              # Cross-session index
└── ses_<24-char-id>/                    # One per main session
    ├── ses_<24-char-id>.md              # Full session capture (YAML + MD)
    ├── session-continuity.json          # Intra-session delegation hierarchy
    ├── ses_<child-id>.json              # Child session (delegation level 1)
    └── ses_<grandchild-id>.json         # Grandchild (delegation level 2)
```

### File Purpose Summary

| File | Contains |
|------|----------|
| `project-continuity.json` | Index of ALL main sessions in the project |
| `session-continuity.json` | Delegation hierarchy WITHIN one session |
| `<sessionId>.md` | Full capture of session content (turns, tool calls) |
| `<childId>.json` | Child session details |

## §3 — project-continuity.json Schema

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
| `status: "active"` | Session running or aborted mid-delegation | Finding aborted sessions to resume |
| `status: "idle"` | Session alive but no active delegations | Skip in resume protocol |
| `status: "completed"` | Session finished cleanly | Skip |
| `status: "error"` | Session terminated with error | Skip for auto-resume |
| `childCount` | Number of children (delegations) | Filter for sessions with active children |
| `totalDelegationDepth` | Deepest delegation level | 0=no delegations, 3=max depth |
| `updated` | Last write timestamp | Sort to find most recent active |

### Navigation: How to Use

```
1. Read once at power-on — small JSON, ~500 lines even with 50 sessions
2. Filter active sessions: sessions where .status === "active"
3. Find aborted delegations: active sessions where .childCount > 0
4. Sort by recency: Sort active sessions by .updated descending
5. For each candidate, read its session-continuity.json
```

## §4 — session-continuity.json Schema

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

### How to Traverse Children

```
1. hierarchy.children → map of childId → childInfo
2. For each child, check .status
3. Active children → need resume
4. For each active child, check .children for grandchildren
5. Grandchildren → deeper delegation, resume deepest first
```

### Find Deepest Active Algorithm

```
function getDeepestActive(hierarchy):
  deepest = null, maxDepth = -1
  for each child in hierarchy.children:
    if child.status === "active" and child.depth > maxDepth:
      deepest = child; maxDepth = child.depth
    for each grandchild in child.children:
      if grandchild.status === "active" and grandchild.depth > maxDepth:
        deepest = grandchild; maxDepth = grandchild.depth
  return deepest  // { sessionId, depth, delegatedBy }
```

### Cross-File Field Summary

| Field | In File | Meaning |
|-------|---------|---------|
| `sessionId` (root key) | project-continuity.json | Main session identifier |
| `status` | Both files | Session state: active/idle/completed/error |
| `childCount` | project-continuity.json | Number of child sessions created |
| `totalDelegationDepth` | project-continuity.json | Max delegation depth |
| `hierarchy.children.<id>.depth` | session-continuity.json | 1=L1 child, 2=L2 grandchild |
| `hierarchy.children.<id>.delegatedBy` | session-continuity.json | Agent type dispatched |
| `hierarchy.children.<id>.children` | session-continuity.json | Grandchildren (recursive) |
| `chronologicalOrder` | project-continuity.json | All session IDs in creation order |

## §5 — Navigation Patterns

### Find Aborted Sessions

```
1. Read project-continuity.json
2. Filter: sessions with status === "active" AND childCount > 0
3. Sort: by updated descending (most recent first)
4. For each match: read its session-continuity.json
5. Look at hierarchy.children for children with status === "active"
6. The child with highest depth is the deepest aborted delegation
```

### Deepest Active Delegation

```
Example:
  session ses_A has children:
    child_X: depth=1, status="active" (no grandchildren)
    child_Y: depth=1, status="active" (has grandchild_Z: depth=2, status="active")

  → grandchild_Z at depth=2 is the DEEPEST active.
  → Resume grandchild_Z first: task(..., task_id="<grandchild_Z>")
```

### Parent → Child Chain Tracing

```
Example chain:
  ses_A (root, L0)
    ├── ses_B (L1 child, depth=1, active, delegatedBy=hm-l2-auditor)
    └── ses_C (L1 child, depth=1, active, delegatedBy=hm-l2-researcher)

  → Two active L1 children. Resume sequentially.
```

## §6 — Session .md File Format

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

### Key Extraction Points

| What to find | How |
|-------------|-----|
| Last user intent | grep `"## USER \\(turn"` on .md → read last match |
| Last task dispatch | grep `"## TOOL: task"` on .md → read last match |
| Agent type for resume | From task tool call: `subagent_type` field |
| Task ID for resume | From task tool output: `task_id` field |

## §7 — Efficient Reading Patterns

| Goal | Command |
|------|---------|
| Find last user turn in .md | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read last turn content | `read(filePath, offset=<lastUserLine>, limit=60)` |
| Find task dispatches | `grep(pattern: "## TOOL: task", include: "*.md")` |
| Find specific session child | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
| Search across all sessions | `session-tracker(action: "search-sessions", query: "<agent_type>")` |

### Anti-Pattern: Full File Reads

**NEVER:** `read(".hivemind/session-tracker/ses_xxx/ses_xxx.md")` (could be 7000+ lines)

**ALWAYS:** Use grep to find the line number, then read with offset and limit.

## §8 — Tool Fallback Strategies

> **When:** session-tracker tool fails, returns wrong data, or extracts too much context.

### FALLBACK 1: Direct bash navigation
```
  List sessions:   bash("ls .hivemind/session-tracker/")
  Read index:      bash("cat .hivemind/session-tracker/project-continuity.json")
  Read hierarchy:  bash("cat .hivemind/session-tracker/<id>/session-continuity.json")
  Search JSON:     grep(pattern: '"status"\\s*:\\s*"active"', path: ".hivemind/session-tracker/", include: "*.json")
  List children:   glob(pattern: "*.json", path: ".hivemind/session-tracker/<id>/")
```

### FALLBACK 2: Grep-based search
```
  Find active:    grep(pattern: "status.*active|cancelled|aborted", include: "session-continuity.json", path: ".hivemind/session-tracker/")
  Find user turns: grep(pattern: "## USER \\\\(turn", include: "*.md", path: ".hivemind/session-tracker/<id>/")
  Find task_ids:   grep(pattern: "task_id:", include: "*.md", path: ".hivemind/session-tracker/<id>/")
```

### FALLBACK 3: Efficient reading (when export is too heavy)
```
  NEVER read full .md files — use offset/limit:
    read(filePath, offset=1, limit=30) — frontmatter only
    grep for "## USER" → get line number → read(filePath, offset=N, limit=30)
  JSON files are small (~20-50 lines): read(filePath) — full JSON is fine, MD is not
```

### FALLBACK 4: Node.js one-liner (for complex JSON filtering)
```
  Filter sessions:  bash("node -e \"const j=require('./.hivemind/session-tracker/project-continuity.json'); Object.entries(j.sessions).forEach(([k,v])=>console.log(k, v.status))\"")
  List children:    bash("node -e \"const j=require('./.hivemind/session-tracker/<id>/session-continuity.json'); Object.entries(j.hierarchy.children||{}).forEach(([k,v])=>console.log(k, v.status, v.depth))\"")
```

### Edge Cases Covered

| Problem | Symptom | Fix |
|---------|---------|-----|
| **Forked sessions** | session ID ≠ directory name | Use `ls` to verify directory exists before reading |
| **Stale index entries** | project-continuity.json has non-existent directories | Verify: `bash("test -d .hivemind/session-tracker/<id> && echo EXISTS")` |
| **Missing session-continuity.json** | Directory exists but no index file | Read child `.json` files directly: `glob(".hivemind/session-tracker/<id>/*.json")` |
| **Wrong tool extracting too much** | session-tracker export returns huge .md | Use grep to find line numbers, then `read(offset=N, limit=30)` instead |
| **JSON parse errors** | Corrupted JSON file | Use bash `cat` to inspect raw content, then grep for specific fields |
