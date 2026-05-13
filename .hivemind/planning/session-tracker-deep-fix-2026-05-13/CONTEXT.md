[LANGUAGE: Write this file in vi per Language Governance.]
[LANGUAGE: Write this file in vi per Language Governance.]
# CONTEXT: Session-Tracker Deep Fix — Anti-Patterns & Correct Understanding — 2026-05-13

> **Status:** COMPLETE | **Based on:** RESEARCH.md + SPEC.md | **For:** Phase 14 planning

---

## 1. What Was Previously Understood (and Why Wrong)

### 1.1 Phase 13's Approach

Phase 13 applied 12 fixes (F-01 through F-12) addressing real symptoms:
- Session parent misclassification (F-01, F-02)
- Missing turn counts (F-03)
- Missing child count updates (F-04)
- Missing child message capture (F-05)
- Turn counter reset on restart (F-06)
- Concurrent write corruption (F-07, F-08)
- Legacy double-capture (F-09)
- Hardcoded metadata values (F-10)

### 1.2 Why the Fixes Were Wrong

Phase 13 made **incorrect assumptions** about OpenCode SDK event shapes:

| Assumption | Reality | Impact |
|-----------|---------|--------|
| session.created ID at ev.sessionID | ID at ev.properties.info.id | ALL events produce empty IDs |
| tool.execute.after receives only {tool, args} | SDK provides {tool, sessionID, callID, args} | sessionID never forwarded |
| delegationDepth can be hardcoded to 1 | Must be computed from parent chain | L1/L2 distinction flattened |
| delegatedBy can be hardcoded | Must capture actual delegating agent | Lineage lost |

### 1.3 The Fundamental Misdiagnosis

Phase 13 treated session-tracker internal logic as the problem. The internal architecture is actually sound. The real problem: **data never arrives correctly from the SDK** due to plugin.ts hook wiring bugs.

---

## 2. What the Correct Understanding Is

### 2.1 The Real Problem Is in plugin.ts

The session-tracker (14 files in src/features/session-tracker/) has sound architecture:
- CQRS-compliant hooks
- Atomic persistence (tmp+rename)
- Serial write queues per session/child
- Dual-gate classification (SDK + HierarchyIndex)

The bugs are in src/plugin.ts hook wiring:

```
// plugin.ts:164 — BROKEN
const sessionID = (ev?.sessionID as string) || ""
// FIX: use getEventSessionID(ev)

// plugin.ts:236-237 — BROKEN
input: { tool: string; args?: Record<string, unknown> }
// FIX: add sessionID, callID from SDK
```

### 2.2 Depth Must Be Computed

No built-in depth field in SDK. Must walk parentID chain:
- L0: no parentID, depth 0
- L1: parentID points to L0, depth 1
- L2: parentID points to L1 (whose parentID points to L0), depth 2

### 2.3 Delegator Must Be Captured

task tool subagent_type parameter identifies the creating agent. Must flow to delegatedBy.agentName.

---

## 3. All Edge Cases

| Edge Case | Correct Behavior | Current Status |
|-----------|-----------------|----------------|
| Resume | Same sessionID, same depth | No turnCount-based detection |
| Fork | New session with parentID | Correct if GAP #1 fixed |
| Revert | Modifies in-place, no new session | No revert detection |
| L1 vs L2 | Walk parentID chain for depth | Hardcoded depth=1, fails |
| turnCount | ==1 original, >1 resumed | Only for main sessions |
| Race condition | Dual-gate fallback | Gate 1 unreachable |
| Cold start | buildFromDisk() on init | Works, SDK fallback unreachable |
| Session deletion | Mark deleted, update index | handleSessionDeleted exists |

---

## 4. Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Depth
- **What it looks like:** `const depth = 1`
- **Why wrong:** Flattens L1/L2; all delegations appear equal
- **Correct:** Compute from parentID chain: `parentDepth + 1`

### Anti-Pattern 2: Hardcoded Agent Attribution
- **What it looks like:** `delegatedBy.agentName = "main_l0_agent"`
- **Why wrong:** Destroys delegation lineage
- **Correct:** Capture from task tool `subagent_type` parameter

### Anti-Pattern 3: Wrong SDK Property Path
- **What it looks like:** `ev?.sessionID` when SDK has `ev.properties.info.id`
- **Why wrong:** Produces empty strings; all events silently dropped
- **Correct:** Read actual SDK source; validate property paths

### Anti-Pattern 4: Incomplete Type Declarations
- **What it looks like:** Hook input omits sessionID field
- **Why wrong:** TypeScript drops undeclared fields; data lost at boundary
- **Correct:** Declare ALL SDK-provided fields in hook types

### Anti-Pattern 5: Memory-Only Critical Index
- **What it looks like:** HierarchyIndex Map with no disk backing
- **Why wrong:** Lost on restart; race condition window
- **Correct:** Rebuild from disk on init; accept SDK fallback during cold start

### Anti-Pattern 6: Silent Failure on Invalid Input
- **What it looks like:** isValidSessionID(undefined) returns false, silent skip
- **Why wrong:** Data loss without detection
- **Correct:** Log warning when sessionID invalid; escalate if critical

### Anti-Pattern 7: Index Incompleteness
- **What it looks like:** project-continuity.json has only main sessions
- **Why wrong:** 58% orphan rate; can't query children from master index
- **Correct:** Register ALL sessions (main + children)

---

## 5. Design Decisions and Rationale

### 5.1 Dual-Gate Classification

**Decision:** Use both SDK parentID AND HierarchyIndex.isChild().

**Rationale:** Defense-in-depth. SDK is authoritative but may be unavailable (cold start, race). HierarchyIndex is populated by prior handleTask() but is memory-only. Together they cover both timings.

### 5.2 Per-Session Serial Write Queues

**Decision:** Each session's writes go through a serial promise queue.

**Rationale:** Prevent concurrent read-modify-write corruption. Two events updating same session simultaneously could clobber changes.

### 5.3 Lazy-Bootstrap Directory Creation

**Decision:** Directories created on first event via ensureSessionReady(), not proactively.

**Rationale:** Handles cold-start where session.created was missed. If proactive path fails, lazy path catches it.

### 5.4 session.created as Authoritative Signal

**Decision:** session.created is richest metadata source (provides both sessionID AND parentID).

**Rationale:** No other event provides both identifiers. session.idle has no parentID. tool.execute.after has child ID embedded in output metadata.

### 5.5 project-continuity.json for All Sessions

**Decision:** Master index must contain every known session ID.

**Rationale:** Without complete index, queries require filesystem scans. Incomplete indexes break recovery, monitoring, debugging.

### 5.6 Atomic Writes via tmp+rename

**Decision:** All persistence through atomic-write.ts (write to tmp, then rename).

**Rationale:** Crash safety. If process crashes mid-write, original file intact. Partial writes never corrupt existing state.

[LANGUAGE: Write this file in vi per Language Governance.]
---

## 6. Why PostToolUse-Only Capture Is Fundamentally Flawed (NEW)

### 6.1 The Core Problem

Current session capture relies **exclusively** on `tool.execute.after` (PostToolUse hook). This creates a critical blind spot:

**When a task tool is aborted by the user**, the PostToolUse hook **may never fire**. The child session was already created at dispatch time (PreToolUse), ran its work, and produced output — but the completion hook never fired. Result: orphan session directory with no parent registration.

### 6.2 Evidence: "Aborted But Ran" Pattern

Session export `session-ses_1e28.md` (lines 5159-5298) documents **6 consecutive aborted task tool dispatches**:

| # | Child Session ID | Status | Output Generated |
|---|-----------------|--------|-----------------|
| 1 | ses_1e2c59d22ffe | Aborted | Yes — full output |
| 2 | ses_1e2bcaaeaffe | Aborted | Yes — full output |
| 3 | ses_1e2b554fcffe | Aborted | Yes — full output |
| 4-6 | (3 more) | Aborted | Yes |

**Key insight:** "Aborted" does NOT mean "did not run." The child sessions ran to completion and produced output. The abort signal arrived AFTER the work was done. But PostToolUse never fired → session-tracker never registered the child → orphan directory.

### 6.3 Why Server API Integration Is Required

The OpenCode SDK Server API is the **authoritative source** for session relationships:

| API | What It Provides | Why Needed |
|-----|-----------------|------------|
| `GET /session` | All sessions list | Discover sessions not captured by hooks |
| `GET /session/:id` | Session details with `parentID` | Resolve parent-child relationships |
| `GET /session/:id/children` | Child session list | Build hierarchy from authoritative source |
| `POST /session/:id/fork` | Fork event | Detect fork and trigger inheritance |
| `POST /session/:id/abort` | Abort event | Detect aborted sessions |

**Architecture shift:** Hook events become SECONDARY triggers. Server API queries become PRIMARY source of truth for hierarchy.

**New flow:**
1. PreToolUse fires → detect task tool dispatch → query Server API for child session
2. Register child IMMEDIATELY (not waiting for PostToolUse)
3. PostToolUse fires later → update metadata (duration, status, output)
4. PostToolUse NEVER fires (abort) → session already registered (no orphan)

### 6.4 Fork Session Inheritance Edge Case

**Scenario:** User forks a session at a message point via `POST /session/:id/fork`.

**OpenCode behavior:** Creates new L0 session with new ID. Messages copied up to fork point. But child sessions (L1, L2 delegations) are NOT automatically copied.

**Hivemind requirement:** The forked L0 must "inherit" the original's children for context continuity. When an agent at the forked session looks up past child sessions, it can see what delegations existed — all downstream L1, L2 delegations — for context retrieval and re-delegation.

**Implementation:**
1. Detect fork via Server API `POST /session/:id/fork` event
2. Query `GET /session/:id/children` on the original session
3. Build fork inheritance map: `{ originalSessionID → [childSessionIDs] }`
4. Write inheritance records to `session-continuity.json` of the new forked session
5. Inherited children are READ-ONLY references for context — not re-executable

### 6.5 Impact on Correct Fix Strategy

The Summary fix strategy (section below) must be extended:

| Original Fix | Extended Fix |
|-------------|-------------|
| Fix GAP #1 (session.created) | + Add PreToolUse hook for task detection |
| Fix GAP #2 (tool.execute.after) | + Query Server API at PreToolUse time |
| Compute depth from parentID chain | + Use Server API as primary depth source |
| Register children in project-continuity | + Support fork inheritance records |

---

## Summary: Correct Fix Strategy

1. **Fix GAP #1** in src/plugin.ts:164: Use correct SDK property path for session.created
2. **Fix GAP #2** in src/plugin.ts:236-237: Add sessionID and callID to hook input type
3. **Compute depth** from parentID chain (never hardcoded)
4. **Capture delegator** from task tool subagent_type parameter
5. **Register child sessions** in project-continuity.json
6. **Backfill existing state** with recovery script

The session-tracker internal architecture is sound. Fix the plugin.ts boundary data extraction, and the tracker works correctly.
