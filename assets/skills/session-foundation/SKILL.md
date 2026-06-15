---
name: session-foundation
description: >-
  Discover, navigate, and aggregate session state across the project. Use when
  you need to: find active sessions, list all sessions, check session status,
  explore delegation hierarchy, trace parent-child chains, aggregate
  cross-session context, find related sessions by tool overlap, search
  session content, build a unified session view, resume an interrupted session,
  stack new work onto an existing session, or determine which sessions are
  resumable before dispatch. This is a read-side, CQRS-compliant skill —
  it discovers and reads session state without mutating it.
version: 1.0.0
load_priority: 1
allowed-tools:
  - session-tracker
  - session-hierarchy
  - session-context
  - hivemind-session-view
  - delegate-task
  - delegation-status
  - execute-slash-command
  - hivemind-command-engine
  - prompt-skim
  - prompt-analyze
  - read
  - grep
  - glob
  - bash
  - task
  - todowrite
---

# Session Foundation — Session Governance Core

## 1. Overview (30-second read)

Session governance is the practice of discovering what work is happening across
the project, understanding how sessions relate to each other, and deciding what
to resume or extend. This skill provides a structured workflow using operational
tools — no aspirational capabilities, no undocumented behavior.

**Core principle:** This is a **read-side** skill. It discovers, reads, and
aggregates session state. It does NOT mutate sessions or create delegations
directly (that is the write-side, handled by other skills and tools).

**What you can do with this skill:**
- Discover all sessions that have ever run on the project
- Filter sessions by status, agent type, depth, or time range
- Search session content (including child .json files)
- Navigate the delegation hierarchy (parents, children, depth)
- Aggregate cross-session data by status or agent type
- Build a unified session view from multiple data roots
- Check delegation status and verify resumability
- Stack new work onto existing sessions

## 2. Core Workflow (2-minute read)

The session governance loop has four phases. Follow them in order when you
need to understand the session landscape.

### Phase 1: Discover — "What sessions exist?"

```
session-tracker({action: "list-sessions"})
```

Returns every session with status, depth, and timestamps. Start here to get
the full picture.

**To find active sessions specifically:**
```
session-tracker({action: "filter-sessions", status: "active"})
```

Filters by status, agent type, depth range, or time range. Replace the old
manual discovery approach — this is the correct discovery tool.

**To search session content:**
```
session-tracker({action: "search-sessions", query: "<term>", limit: 10})
```

Searches across session .md files AND child .json files including
lastMessage, turn.content, and journey[].content. Use this when you need to
find sessions by topic rather than metadata.

### Phase 2: Navigate — "How are sessions related?"

```
session-hierarchy({action: "get-children", sessionId: "<id>"})
session-hierarchy({action: "get-manifest", sessionId: "<id>"})
session-hierarchy({action: "get-parent-chain", sessionId: "<id>"})
session-hierarchy({action: "get-delegation-depth", sessionId: "<id>"})
```

**`get-manifest` is the preferred action** for inspecting delegation trees.
It reads a flattened child list — no recursive tree walking needed.

Use `get-parent-chain` to trace a session back to its root. Use
`get-delegation-depth` for a quick depth check.

### Phase 3: Aggregate — "What patterns exist?"

```
session-context({action: "aggregate", groupBy: "status"})
session-context({action: "aggregate", groupBy: "subagentType"})
session-context({action: "find-related", sessionId: "<id>"})
session-context({action: "cross-reference", term: "<tool-or-term>"})
session-context({action: "synthesize-context", sessionIds: ["<id1>", "<id2>"]})
```

Use `aggregate` to get counts — how many sessions per status, per agent type.
Use `find-related` to discover sessions sharing tool usage patterns.
Use `synthesize-context` to build a unified picture from multiple sessions.

### Phase 4: Act — "What do I do next?"

Once you understand the session landscape:

1. **For a unified view of a specific session:**
   ```
   hivemind-session-view({action: "get", sessionId: "<id>"})
   ```
   Returns nested data: `{session, delegations}`. Reads from session data,
   delegation records, and trajectory checkpoints in a single call.

2. **To check if a delegation is still running:**
   ```
   delegation-status({action: "status", delegationId: "<id>"})
   ```

3. **To continue work or verify completeness:**
   - Resume a session: via `task` tool with `task_id` (PREFERRED — full control)
    - Stack new work onto session: via `task` tool with `task_id` (PREFERRED) or `delegate-task` with `context: '{"parentSessionId": "<id>"}'` (async background only)
   - Run a command: via `execute-slash-command`
   - Discover available commands: via `hivemind-command-engine`

## 3. Tool Reference (quick lookup)

### 3.1 session-tracker — Session Discovery

| Action | Returns | Use Case |
|--------|---------|----------|
| `list-sessions` | All session IDs with status, depth, timestamps | Full project activity picture |
| `filter-sessions({status, agentType, minDepth, maxDepth, timeRange})` | Matching sessions | Find active/resumable sessions |
| `search-sessions({query, limit})` | Search results across .md + .json | Topic-based session discovery |
| `get-status({sessionId})` | Status and metadata | Quick session health check |
| `get-summary({sessionId})` | Summarized overview | Brief session snapshot |
| `export-session({sessionId})` | Full session data | Complete session detail |

**Key distinction:** `filter-sessions` is the discovery tool. `search-sessions`
is the research tool. Neither performs resume — they provide metadata for you
to decide.

### 3.2 session-hierarchy — Delegation Navigation

| Action | Returns | Use Case |
|--------|---------|----------|
| `get-children({sessionId})` | Direct children in hierarchy | View immediate delegations |
| `get-manifest({sessionId})` | Flattened child list | Full delegation tree (preferred) |
| `get-parent-chain({sessionId})` | Chain of parents up to root | Trace delegation path |
| `get-delegation-depth({sessionId})` | Numerical depth | Quick depth check |

### 3.3 session-context — Cross-Session Intelligence

| Action | Returns | Use Case |
|--------|---------|----------|
| `aggregate({groupBy: "status"})` | Count per status | "How many active sessions?" |
| `aggregate({groupBy: "subagentType"})` | Count per agent type | "What are top agent types?" |
| `find-related({sessionId})` | Related sessions by tool overlap | Finding related work |
| `cross-reference({term})` | Sessions referencing a tool or term | Cross-session reference search |
| `synthesize-context({sessionIds})` | Merged context | Building unified picture |

### 3.4 hivemind-session-view — Unified View

| Action | Returns | Use Case |
|--------|---------|----------|
| `get({sessionId})` | `{session, delegations}` | Complete picture from one call |

Use this when you need a unified view. For simple queries (just status,
just depth), use the specific tool action instead to avoid over-fetching.

### 3.5 delegate-task — Session Stacking

| Parameter | Purpose | When to Use |
|-----------|---------|-------------|
| `agent` | Specialist agent to dispatch | Always required |
| `prompt` | Task description | Clear, bounded task scope |
| `context: '{"parentSessionId": "<id>"}'` | Stack onto existing session | Continue related work |

Use the `parentSessionId` pattern to attach new work as a child of an
existing session. This creates a proper delegation hierarchy without
needing to resume the original session.

### 3.6 delegation-status — Delegation Health

| Action | Returns | Use Case |
|--------|---------|----------|
| `status({delegationId})` | Delegation progress and state | Check a specific delegation |
| `list({status})` | All delegations, optionally filtered | Overview of delegation activity |

## 4. Session Resume & Stacking Guidance

### When to Resume vs Stack

| Situation | Approach | Why |
|-----------|----------|-----|
| Session is still active, agent is same type | **Resume** via `task(task_id=...)` | Preserves full context |
| Session completed, need to add work | **Stack** via `task(task_id=...)` (preferred) or `delegate-task(parentSessionId=...)` (if async needed) | Clean hierarchy; task tool gives full control |
| Different agent type needed | **Stack** via `task(task_id=...)` (if supported) or `delegate-task` | Agent type mismatch may prevent resume |
| Not sure if resumable | **Check** via delegation-status first | Verify before attempting |

### Resume Mechanics

```
task({subagent_type: "<agentType>", task_id: "<sessionId>", prompt: "Continue"})
```

**Critical: Resume depends on SDK support.** If the SDK does not support
full context restoration via `task_id`, the resume may start a fresh session
instead of continuing the existing one.

**Verify before resuming:**
1. Check session status via `session-tracker({action: "get-status", sessionId})`
2. Verify delegation exists via `delegation-status({action: "status", delegationId})`
3. Attempt resume with a specific, bounded prompt — not just "Continue"

### Stacking Mechanics

```
delegate-task({
  agent: "<specialist>",
  prompt: "<bounded task>",
  context: '{"parentSessionId": "<existing-session-id>"}'
})
```

The `parentSessionId` context parameter chains the new delegation as a child
of the specified session. Do NOT inject the session ID into the prompt text —
that creates an independent session without hierarchy tracking.

## 5. Anti-Patterns

| Anti-Pattern | Symptom | Correction |
|-------------|---------|------------|
| **Over-fetching** | Loading full session data for every session when only status is needed | Use `get-status` or `get-summary` first. Only `export-session` or `hivemind-session-view` when you need the full picture |
| **Broken resume assumption** | Assuming `task(task_id=...)` always preserves context | Verify SDK version and delegation status before attempting resume |
| **Lost hierarchy** | Injecting session IDs into prompt text instead of using `parentSessionId` parameter | Use `context: '{"parentSessionId": "..."}'` — the SDK handles hierarchy tracking |
| **Discovery without filter** | Calling `list-sessions` on a project with hundreds of sessions | Use `filter-sessions` with status, agent type, or time range to narrow results |
| **Read-write blur** | Calling session state tools when the real need is to create or continue work | Use discover→navigate→aggregate to inform, then use task tool (preferred, full control) or delegate-task (async background only) for action |

## 6. Self-Correction — When Things Go Wrong

### Mode 1: Tool Returns Empty Results

**Symptom:** `filter-sessions` or `list-sessions` returns zero sessions.

**Diagnosis:**
1. Check if session-tracker data exists on disk:
   ```
   glob(".hivemind/session-tracker/*/")
   ```
2. If directories exist, the tool may need a different query — try
   `search-sessions` with a broad query
3. If no directories exist, no sessions have been tracked on this project yet

### Mode 2: Session Not Found

**Symptom:** `get-status({sessionId})` returns not-found.

**Diagnosis:**
1. Verify session ID format — it usually starts with `ses_` or is a UUID
2. Try `list-sessions` to get the exact session ID format used in this project
3. The session may have been cleaned up or never tracked

### Mode 3: Resume Fails

**Symptom:** `task(task_id=...)` starts a new session instead of resuming.

**Diagnosis:**
1. Check SDK version in `node_modules/@opencode-ai/sdk/package.json`
2. If SDK version < 2.x, `task_id` resume may not preserve context
3. Fall back to stacking via `delegate-task(parentSessionId=...)`
4. If both fail, create a fresh delegation and reference the original session
   in the prompt

### Mode 4: Delegation Depth Too Deep

**Symptom:** Delegation chain exceeds reasonable depth (recommended max: 3).

**Diagnosis:**
1. Check depth: `session-hierarchy({action: "get-delegation-depth", sessionId})`
2. If depth >= 3, the chain is too deep for reliable operation
3. Escalate to the user: "This chain is too deep. Consider an architectural
   split or restart from root with accumulated context."
4. Use `get-manifest` to show the full tree
5. Use `synthesize-context` to aggregate work across the chain

## 7. References — Progressive Disclosure

These reference files provide deeper detail. Load them on demand, not
all at once.

| File | Contains | Read When |
|------|----------|-----------|
| `references/session-tools-reference.md` | Complete tool signatures, parameter schemas, response formats | You need exact API details for tool calls |
| `references/future-tools-tbd.md` | 🟡 PARTIAL tools in development: trajectory (P24), pressure (P26), agent-work (P25), background-command (CP-PTY-01) — their current state and future role | You hear about a session tool not in the main catalog or need to know what's coming

## 8. Short Version (for tight context)

```
1. session-tracker({action:"list-sessions"})          → see everything
2. session-tracker({action:"filter-sessions", status:"active"})
                                                        → find active sessions
3. session-hierarchy({action:"get-manifest", sessionId})
                                                        → inspect delegation tree
4. hivemind-session-view({action:"get", sessionId})     → unified view
5. Decide: resume (task_id) or stack (parentSessionId) or create fresh
6. delegation-status({action:"status", delegationId})   → verify health
```

## 9. When to Load

| Scenario | Load Priority | Why |
|----------|--------------|-----|
| Session start | **Load immediately** | Get the current session landscape |
| Before delegation | **Always load** | Check if a session exists to stack onto vs create fresh |
| After disconnect | **Load immediately** | Find sessions that may need attention |
| Cross-session research | **Load immediately** | Search, aggregate, and synthesize session data |
| Before resume | **Always load** | Verify session status and delegation health first |
