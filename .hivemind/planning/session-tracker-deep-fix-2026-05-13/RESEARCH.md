[LANGUAGE: Write this file in vi per Language Governance.]
# RESEARCH: Session-Tracker Deep Architecture & Root Cause Analysis — 2026-05-13

> **Status:** COMPLETE | **Confidence:** HIGH | **Evidence Level:** L2/L3 | **Sources:** 30+

---

## 1. OpenCode SDK Task Tool Lifecycle

### 1.1 Session ID Creation Timing

The session ID is **generated at INPUT dispatch time**, NOT at output completion time. This is a critical distinction.

| Stage | What Happens | Session ID Exists? | Data Available |
|-------|-------------|---------------------|----------------|
| **Pre-execution** (`tool.execute.before`) | Agent decides to call `task` tool. Hook fires BEFORE dispatch. | No child ID yet | Parent `sessionID`, `callID`, `args` |
| **Dispatch** (`TaskTool.execute`) | Child session created immediately with `parentID` set. OR existing session resumed via `task_id`. | Yes — child exists | Child `sessionID`, `parentID`, model, agent |
| **Post-execution** (`tool.execute.after`) | Hook fires AFTER tool completes. | Yes | `output.metadata.sessionId` = child ID; `input.sessionID` = parent ID |
| **Child runs** | Child session processes prompt independently. | Yes | Full session with messages, tools, agent |
| **Child completes** (`session.idle`) | Fires when child becomes idle. | Yes | `properties.sessionID` (NO parentID) |

### 1.2 Session Resume Mechanics

When a `task_id` is provided to the task tool:
1. OpenCode calls `sessions.get(SessionID.make(taskID))` to look up the session
2. **If found:** Resumes the existing session with its full message history, model, agent, and **original depth**
3. **If NOT found:** Creates a new child session with `parentID` = current session

### 1.3 Fork Behavior

`Session.fork` creates a NEW session with `parentID` = original session ID. Messages from original are copied up to specified `messageID`. No dedicated "fork" event exists — fires standard `session.created`.

### 1.4 Revert/Undo Behavior

`SessionRevert.revert` modifies session **in-place** — stores `messageID`, `snapshot`, `diff`. No new session created. No dedicated "revert" event type exists.

---

## 2. Plugin Hook Signatures

### 2.1 Canonical Signatures (from OpenCode SDK)

```typescript
// PreToolUse — fires BEFORE tool executes
"tool.execute.before"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any },
) => Promise<void>

// PostToolUse — fires AFTER tool completes
"tool.execute.after"?: (
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: { title: string; output: string; metadata: any },
) => Promise<void>
// For task tool: output.metadata = { sessionId: string, model: string }

// Event observer — fires on session lifecycle events
event?: (input: { event: Event }) => Promise<void>
// EventSessionCreated: properties.info.id = sessionID, properties.info.parentID = parent
// EventSessionIdle: properties.sessionID (NO parentID)

// Chat message
"chat.message"?: (
  input: { sessionID: string; agent?: string; model?: object; messageID?: string; variant?: string },
  output: { message: UserMessage; parts: Part[] },
) => Promise<void>
```

### 2.2 What plugin.ts ACTUALLY Uses — THE GAPS

**GAP #1 — session.created sessionID extraction (plugin.ts:164):**
```typescript
// CURRENT (BROKEN):
const sessionID = (ev?.sessionID as string) || ""
// SDK provides: ev.properties.info.id
// RESULT: sessionID = "" for ALL session.created events
```

**GAP #2 — tool.execute.after sessionID loss (plugin.ts:236-237):**
```typescript
// CURRENT (BROKEN):
input: { tool: string; args?: Record<string, unknown> }
// SDK provides: { tool, sessionID, callID, args }
// RESULT: sessionID never forwarded to session-tracker
```

---

## 3. Complete Event Flow

### 3.1 Normal Flow (chat.message) — WORKS

```
OpenCode event: chat.message
  → plugin.ts:192 hook (sessionID correctly forwarded)
  → sessionTracker.handleChatMessage(input, output)
  → ensureSessionReady(sessionID) — lazy-bootstrap gate
    → SDK parentID check (getSession)
    → HierarchyIndex.isChild check
  → IF child: childWriter.appendChildTurn()
  → IF main: messageCapture.handleChatMessage()
    → sessionWriter.appendUserTurn()
    → sessionIndexWriter.incrementTurnCount()
```

### 3.2 BROKEN Flow (session.created — GAP #1)

```
OpenCode event: session.created
  properties.info.id = "ses_xxx" (correct)
  ev.sessionID = undefined (SDK does NOT set this)
  → plugin.ts:161 consumeSessionTrackerFact
    const sessionID = ev?.sessionID || ""  ← EMPTY STRING
  → sessionTracker.handleSessionEvent("session.created", "", event)
  → eventCapture.handleSessionCreated("")
    → getSession(client, "") → FAILS
    → parentID never checked
    → directory never created
  RESULT: SILENT FAILURE — session.created completely ignored
```

### 3.3 BROKEN Flow (tool.execute.after — GAP #2)

```
OpenCode event: tool.execute.after
  input: { tool, sessionID, callID, args } (SDK provides all)
  → plugin.ts:235 hook
    input: { tool, args }  ← sessionID DROPPED
  → handleToolExecuteAfter(input, output)
    → ensureSessionReady(input.sessionID) — sessionID = undefined
    → isValidSessionID(undefined) → false → SKIPPED
  RESULT: Tool blocks silently dropped for un-bootstrapped sessions
```

---

## 4. Current Code Architecture Flaws

### 4.1 CRITICAL: GAP #1 — session.created sessionID extraction

| Aspect | Detail |
|--------|--------|
| **Location** | `src/plugin.ts:164` |
| **Current code** | `const sessionID = (ev?.sessionID as string) \|\| ""` |
| **SDK reality** | sessionID at `ev.properties.info.id` |
| **Impact** | ALL session.created events produce empty IDs |
| **Detection** | VERY HIGH difficulty — no error, just silent data loss |

### 4.2 CRITICAL: GAP #2 — tool.execute.after sessionID loss

| Aspect | Detail |
|--------|--------|
| **Location** | `src/plugin.ts:236-237` |
| **Current type** | `input: { tool: string; args?: Record<string, unknown> }` |
| **SDK provides** | `input: { tool, sessionID, callID, args }` |
| **Impact** | sessionID never forwarded to tracker |

### 4.3 Hardcoded Depth (L1/L2 Flattening)

| Aspect | Detail |
|--------|--------|
| **Location** | `src/features/session-tracker/capture/tool-capture.ts:235` |
| **Current** | `depth = 1` (hardcoded) |
| **Should be** | `parentDepth + 1` (computed from parent chain) |
| **Impact** | ALL children show depth 1 including L2 grandchildren |
| **Evidence** | 21+ child JSONs verified — zero exceptions |

### 4.4 Hardcoded Delegator Attribution

| Aspect | Detail |
|--------|--------|
| **Location** | `src/features/session-tracker/persistence/child-writer.ts` |
| **Current** | `delegatedBy.agentName = "main_l0_agent"` |
| **Should be** | Actual agent name from task tool `subagent_type` parameter |
| **Impact** | Delegation lineage completely lost |

### 4.5 HierarchyIndex Race Condition

| Aspect | Detail |
|--------|--------|
| **Location** | `hierarchy-index.ts` + `index.ts` |
| **Issue** | In-memory only, populated AFTER child events may arrive |
| **Impact** | Child session.created fires before registerChild() → orphan directory |
| **Mitigation** | Dual-gate (SDK + HierarchyIndex), but SDK unreachable due to GAP #1 |

[LANGUAGE: Write this file in vi per Language Governance.]
---

### 4.6 CRITICAL: GAP #6 — Aborted Task Tool Sessions Not Captured (NEW)

**Location:** `src/features/session-tracker/capture/tool-capture.ts` (handleTask) + `src/plugin.ts` (hook wiring)

**Root Cause:** Current session capture relies ONLY on `tool.execute.after` (PostToolUse). When a task tool is aborted, PostToolUse hook may never fire. Since session IDs are created at INPUT dispatch time and sub-sessions run regardless of abort status, aborted sessions generate child sessions that are NEVER registered in the hierarchy → orphan directories.

**Evidence:** Session export `session-ses_1e28.md` lines 5159-5298 show 6 consecutive aborted task tool dispatches. Yet all child sessions (`ses_1e2c59d22ffe`, `ses_1e2bcaaeaffe`, `ses_1e2b554fcffe`) ran successfully and produced output files.

**Why hooks alone are insufficient:** The `tool.execute.before` hook gives access to tool input parameters but may NOT expose the child session ID (OpenCode generates child session ID internally during dispatch). The Server API is the authoritative source for session parentID and children relationships.

**Required Fix:**
1. Add `tool.execute.before` (PreToolUse) hook in plugin.ts to detect task tool dispatch at INPUT time
2. Use OpenCode SDK Server API to query session relationships:
   - `POST /session` — includes `parentID` in request body, returns created `Session` with ID
   - `GET /session/:id/children` — returns child `Session[]`
   - `GET /session` — list all sessions for discovery
   - `POST /session/:id/fork` — fork detection
   - `POST /session/:id/abort` — abort detection
3. Build hierarchy from Server API queries as PRIMARY source, with hook events as SECONDARY triggers
4. Register child session at PreToolUse time; use PostToolUse only for metadata updates (duration, status)

**Server API Endpoints Required:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /session` | GET | List all sessions — discover new sessions not yet tracked |
| `GET /session/:id` | GET | Get session details — includes parentID field |
| `POST /session` | POST | Create session with `{ parentID?, title? }` — parentID is SET by OpenCode when task tool dispatches |
| `GET /session/:id/children` | GET | Get child sessions — authoritative hierarchy source |
| `POST /session/:id/fork` | POST | Fork session — creates new L0 with inherited L1/L2 children |
| `POST /session/:id/abort` | POST | Abort session — signals session termination |

---

## 5. Sample Session Analysis

### 5.1 Classification Table

| # | Session ID | Agent | Level | Turns | Task Delegate? |
|---|-----------|-------|-------|-------|----------------|
| 1 | ses_1ed9 | hm-l2-architect | L2 | 1 | No (terminal) |
| 2 | ses_1eea | hm-l1-coordinator | L1 | 1 | Yes, 2x researcher |
| 3 | ses_1ef1 | hm-l1-coordinator | L1 | 1 | Yes, 2x investigator |
| 4 | ses_1f10 | hf-l2-skill-builder | L2 | 1 | No |
| 5 | ses_1f11 | hf-l2-skill-builder | L2 | 1 | No |
| 6 | ses_1f2d | hm-l1-coordinator | L1 | 1 | Yes, 4 subagents |
| 7 | ses_2043 | hm-l0-orchestrator | L0 | Multi | Yes |
| 8 | ses_2069 | gsd-doc-writer | L2 | 1 | No |
| 9 | ses_207a | gsd-executor | L2 | 1 | No |
| 10 | ses_2096 | gsd-planner | L2 | 1 | No |
| 11 | ses_20bf | hm-l0-orchestrator | L0 | 10+ | Yes (extensive) |
| 12 | ses_2176 | hm-l0-orchestrator | L0 | Multi | Yes |
| 13 | ses_22ee | L0 orchestrator | L0 | Multi | Unknown |
| 14 | ses_22fd | hm-l0-orchestrator | L0 | Multi | Yes |
| 15 | ses_23a0 | Multiple | L0 | Multi | Yes (4x executor) |

### 5.2 Distribution

| Level | Count | Description |
|-------|-------|-------------|
| L0 (main) | 4 | hm-l0-orchestrator original sessions |
| L1 (child) | 4 | hm-l1-coordinator wave dispatches |
| L2 (grandchild) | 7 | hm-l2/hf-l2/gsd-* specialists |

### 5.3 Key Finding

**ZERO** of the 15 sample session IDs have representation in `.hivemind/session-tracker/` state. These predate tracker deployment.

---

## 6. Current .hivemind/ State Analysis

### 6.1 Inventory

| Metric | Count | Evidence |
|--------|-------|----------|
| On-disk session directories | 36 | glob count |
| Entries in project-continuity.json | 15 | parsed JSON |
| **Orphan directories** | **21 (58%)** | 36 minus 15 |
| Sessions with no directory | 0 | All 15 indexed have directories |

### 6.2 Universal Errors

- ALL children: `delegationDepth: 1` regardless of actual hierarchy
- ALL children: `delegatedBy.agentName: "main_l0_agent"` regardless of actual delegator
- ALL entries: `totalDelegationDepth: 0` regardless of child count

### 6.3 Three Orphan Causes

1. **GAP #1:** session.created produces empty IDs → no proactive registration
2. **GAP #2:** Child sessions with only tool events never get directories
3. **Design gap:** Child sessions never added to project-continuity.json

---

## 7. Edge Cases

| Edge Case | Behavior | Current Code Status |
|-----------|----------|-------------------|
| **Resume** | Same sessionID, same depth, no new L3 | No turnCount-based resume detection |
| **Fork** | New session with parentID = original | Correctly handled IF GAP #1 fixed |
| **Revert** | Modifies in-place, no new session | No revert detection handler |
| **L1 vs L2** | Walk parentID chain to compute depth | Hardcoded depth=1, fails |
| **turnCount** | ==1 original main; >1 resumed main | Only incremented for main sessions |
| **Race condition** | Child events before index populated | Dual-gate exists but Gate 1 unreachable |
| **Cold start** | HierarchyIndex empty on restart | buildFromDisk() works; SDK fallback unreachable |

[LANGUAGE: Write this file in vi per Language Governance.]
---

### 7.X Fork Session Inheritance (NEW)

**Scenario:** User forks a session at a message point via `POST /session/:id/fork`.

**OpenCode behavior:** Creates a new session with a new session ID. The original session's messages up to the fork point are copied. But child sessions (L1, L2 delegations) are NOT automatically copied.

**Hivemind requirement:** The forked L0 session must "inherit" the children sessions of the original up to the forked point. This is for continuity awareness — when the agent at the forked session looks up past child sessions, it can see what delegations were there and all downstream L1, L2 delegations for retrieval of context and for re-delegation.

**Implementation approach:**
1. Detect fork via `POST /session/:id/fork` event or by comparing session creation patterns
2. Query `GET /session/:id/children` on the original session
3. Build a fork inheritance map: `{ originalSessionID → [childSessionIDs] }`
4. Write inheritance records to `session-continuity.json` of the new forked session
5. The inherited children are accessible for context lookup but not re-executable

**This is our INTERNAL build** — the writer, indexer, logic toward session-continuity and project-continuity, and tools to inspect session-tracker must all support this fork inheritance pattern.

---

## 8. Evidence Index

| # | Finding | Source |
|---|---------|--------|
| 1 | Session ID at dispatch time | DeepWiki anomalyco/opencode |
| 2 | session.created ID at properties.info.id | GitHub SDK source |
| 3 | GAP #1: ev?.sessionID wrong path | src/plugin.ts:164 |
| 4 | GAP #2: sessionID omitted from type | src/plugin.ts:236-237 |
| 5 | PostToolUse has sessionID in input | GitHub SDK source |
| 6 | task output.metadata has sessionId | DeepWiki |
| 7 | Hardcoded depth=1 | tool-capture.ts:235 |
| 8 | Hardcoded delegatedBy | child-writer.ts |
| 9 | 36 on-disk directories | Glob count |
| 10 | 15 entries in project index | project-continuity.json |
| 11 | 58% orphan rate | Deduced |
| 12 | ALL children depth=1 | 21+ child JSONs |
| 13 | ALL delegatedBy="main_l0_agent" | All child JSONs |
| 14 | ALL totalDelegationDepth=0 | project-continuity.json |
| 15 | 0/15 sample sessions in tracker | Grep |
| 16 | HierarchyIndex memory-only | hierarchy-index.ts |
| 17 | Turn count main-only | session-index-writer.ts |
| 18 | Dual-gate architecture | index.ts:124-181,301-398 |
| 19 | 12 Phase 13 fixes | Phase 13 directory |
| 20 | 5 debug bugs documented | .planning/debug/ |

---

**Summary:** The session-tracker has sound architecture. TWO critical gaps in plugin.ts wiring silently block the primary event pipelines. Hardcoded depth and delegator flatten all hierarchy data. 58% orphan rate in current state. Fix plugin.ts, compute depth, backfill state.
