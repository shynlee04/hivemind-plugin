[LANGUAGE: Write this file in vi per Language Governance.]
# SPEC: Session-Tracker Correct 3-Level Hierarchy — 2026-05-13

> **Status:** DRAFT | **Confidence:** HIGH | **Based on:** RESEARCH.md 2026-05-13

---

## 1. 3-Level Hierarchy Model (L0 -> L1 -> L2)

### 1.1 Formal Definitions

| Level | Name | Definition | Detection |
|-------|------|-----------|-----------|
| **L0** | Main Session | User-facing session. Created when user sends first prompt to orchestrator. Has no parentID. | `parentID === null` AND `turnCount >= 1` |
| **L1** | Direct Child | Subagent session created by L0 via `task` tool. Parent is L0. | `parentID` points to L0 (L0 has no parentID) |
| **L2** | Grandchild | Subagent session created by L1 via `task` tool. Parent is L1. | `parentID` points to L1 (L1 has parentID pointing to L0) |

### 1.2 Maximum Depth

- Max delegation depth: 2 (L0 -> L1 -> L2)
- No L3: Session-tracker SHALL NOT create L3 entries. Log warning if depth > 2.

### 1.3 Parent Chain Algorithm

```
computeDepth(sessionID):
  depth = 0
  current = sessionID
  while (current has parentID):
    depth += 1
    current = parentID
  return depth

classifyLevel(sessionID, turnCount):
  depth = computeDepth(sessionID)
  if depth == 0 AND turnCount == 1 -> L0 original main
  if depth == 0 AND turnCount > 1 -> L0 resumed main
  if depth == 1 -> L1
  if depth == 2 -> L2
  if depth > 2 -> log warning, cap at L2
```

### 1.4 Resumed Sessions

A resumed session retains its original sessionID and original depth:
- Resumed L0 is still L0 (turnCount > 1 distinguishes from original)
- Resumed L1 is still L1 (depth unchanged)
- Resumed L2 is still L2 (depth unchanged)

---

## 2. Classification Rules

### 2.1 Rule 1: parentID-Based Classification

**WHEN** a session has a non-null `parentID`:
**THEN** classify by walking parentID chain:
- If parent is L0 (no parentID) -> child is L1
- If parent is L1 (parentID points to L0) -> child is L2
- Depth = parentDepth + 1

### 2.2 Rule 2: turnCount-Based Classification

**WHEN** a session has no `parentID`:
**THEN** classify as L0:
- If turnCount == 1 -> L0 original main
- If turnCount > 1 -> L0 resumed main

### 2.3 Rule 3: Dual-Gate Classification

**WHEN** classifying a session (in ensureSessionReady or handleSessionCreated):
1. **Gate 1 (SDK):** Call `client.session.get(sessionID)`, check parentID. If non-null -> child.
2. **Gate 2 (HierarchyIndex):** If Gate 1 returns null, check `hierarchyIndex.isChild(sessionID)`.
3. **Fallback:** If BOTH gates indicate "not a child" -> treat as main.

**Rationale:** Defense-in-depth against race conditions.

### 2.4 Rule 4: Depth Computation

**WHEN** recording a child session's metadata:
**THEN** `delegationDepth` SHALL equal `parentDepth + 1`:
- Parent is L0 (depth 0) -> child depth = 1
- Parent is L1 (depth 1) -> child depth = 2
- Depth SHALL NEVER be hardcoded.

### 2.5 Rule 5: Delegator Attribution

**WHEN** recording a child session's `delegatedBy`:
**THEN** `delegatedBy.agentName` SHALL equal the actual `subagent_type` parameter from the task tool call.

---

## 3. Event Ordering Requirements

### 3.1 session.created Event

**WHEN** session.created fires:
**THEN** extract sessionID from `event.properties.info.id` (NOT `event.sessionID`).

### 3.2 task tool PostToolUse

**WHEN** tool.execute.after fires with `input.tool === "task"`:
**THEN** extract child sessionID from `output.metadata.sessionId`.
**AND** forward `input.sessionID` as parent sessionID.

### 3.3 HierarchyIndex Population Timing

**WHEN** handleTask() creates a child record:
**THEN** `hierarchyIndex.registerChild(parentID, childID)` called BEFORE returning.
**HOWEVER** child session.created MAY arrive before this completes (async).
**MITIGATION:** Dual-gate accepts HierarchyIndex even when SDK parentID unavailable.

### 3.4 session.idle Event

**WHEN** session.idle fires:
**THEN** use `properties.sessionID` to identify session.
**AND** call `client.session.get(id)` to resolve parentID (not in idle event).

---

## 4. Edge Case Specifications

### 4.1 Session Resume via task_id

**GIVEN** task tool call with task_id parameter:
**WHEN** `client.session.get(task_id)` returns existing session:
**THEN** depth unchanged, no new child entry, no new delegatedBy.

### 4.2 Fork from Message

**GIVEN** session fork operation:
**WHEN** forked session fires session.created:
**THEN** treat as new session with parentID from event. Depth = parentDepth.

### 4.3 Revert/Undo

**GIVEN** revert operation:
**WHEN** session revert field modified:
**THEN** no new session, no depth change, no turnCount change. Detect via session.updated.

### 4.4 Cold Start

**GIVEN** fresh .hivemind/session-tracker/:
**WHEN** first event arrives:
**THEN** buildFromDisk() to rebuild HierarchyIndex. If empty + SDK parentID null -> L0 main.

### 4.5 Concurrent Events

**GIVEN** two events for same session simultaneously:
**WHEN** both trigger ensureSessionReady:
**THEN** first creates dir, second detects existing and skips. Per-session serial queue.

---

## 5. Persistence Requirements

### 5.1 HierarchyIndex Survivability

Rebuild from disk on init via buildFromDisk() scanning all session-continuity.json files.

### 5.2 project-continuity.json Completeness

Include ALL known sessions (main + children). Currently missing 58% (21/36).

### 5.3 session-continuity.json Accuracy

delegationDepth = parentDepth + 1 (computed). Currently hardcoded to 1.

### 5.4 delegatedBy Accuracy

agentName = actual subagent_type from task tool call. Currently hardcoded to "main_l0_agent".

### 5.5 turnCount for Children

Increment for child sessions when chat messages routed to them. Currently only main sessions.

---

## 6. Acceptance Criteria

### AC-01: session.created sessionID Extraction
**WHEN** session.created fires with properties.info.id = "ses_abc"
**THEN** SessionTracker receives sessionID = "ses_abc" (not empty string).

### AC-02: Child Depth Computation
**WHEN** task tool creates child of L0 (depth 0)
**THEN** child delegationDepth = 1.
**WHEN** task tool creates child of L1 (depth 1)
**THEN** child delegationDepth = 2.

### AC-03: Delegator Attribution
**WHEN** hm-l1-coordinator dispatches task
**THEN** child delegatedBy.agentName = "hm-l1-coordinator".

### AC-04: project-continuity.json Coverage
**WHEN** project-continuity.json written
**THEN** entry count equals on-disk session directory count.

### AC-05: Depth on Resume
**WHEN** L1 session resumed via task_id
**THEN** delegationDepth remains 1.

### AC-06: HierarchyIndex Rebuild
**WHEN** session-tracker initializes after restart
**THEN** buildFromDisk() reconstructs all parent-child relationships.

### AC-07: Dual-Gate Race Condition
**WHEN** child session.created arrives before handleTask() populates index
**THEN** ensureSessionReady classifies as child (no orphan directory).

### AC-08: turnCount for Children
**WHEN** chat.message routed to child
**THEN** child turnCount increments by 1.

### AC-09: tool.execute.after sessionID
**WHEN** tool.execute.after fires
**THEN** handleToolExecuteAfter receives input.sessionID (not undefined).

[LANGUAGE: Write this file in vi per Language Governance.]
### AC-10: totalDelegationDepth
**WHEN** project-continuity.json updated for session with depth-2 children
**THEN** totalDelegationDepth = 2 (not 0).

### AC-11: SDK Server API Session Discovery

**Given** a task tool is dispatched (PreToolUse hook fires)
**When** the session-tracker detects a new task tool invocation
**Then** session-tracker MUST:
1. Query `GET /session` or `GET /session/:id/children` via SDK Server API
2. Identify newly created child session by matching parentID
3. Register child session in hierarchy IMMEDIATELY (not waiting for PostToolUse)
4. If PostToolUse fires later → update metadata (duration, status, output)
5. If PostToolUse NEVER fires (abort) → session is still registered (no orphan)

**Priority:** CRITICAL
**Evidence Level:** L2 (code-backed)

### AC-12: Fork Session Children Inheritance

**Given** user forks a session at a message point via `POST /session/:id/fork`
**When** OpenCode creates a new L0 session with a new session ID
**Then** session-tracker MUST:
1. Query `GET /session/:id/children` on the ORIGINAL session (pre-fork)
2. Copy ALL child sessions (L1, L2) up to the fork point to the NEW session's hierarchy
3. The new L0 session "inherits" the delegation history for context continuity
4. The inherited children are READ-ONLY references for context — not re-delegated
5. New delegations from the forked session create NEW children under the forked L0

**Purpose:** When an agent at the forked session looks up past child sessions, it can see what delegations were there — all downstream L1, L2 delegations — for retrieval of context and for re-delegation.

**Priority:** HIGH
**Evidence Level:** L2 (code-backed)
