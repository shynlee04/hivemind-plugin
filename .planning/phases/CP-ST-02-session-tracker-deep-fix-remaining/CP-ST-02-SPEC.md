[LANGUAGE: Write this file in vi per Language Governance.]
# SPEC: CP-ST-02 — Session-Tracker Correct Directory Structure & Three-Gate Classification

**Created:** 2026-05-13
**Status:** DRAFT — Ready for spec-phase verification
**Based on:** CONTEXT.md, RESEARCH.md, live bug evidence

---

## 1. Correct Directory Structure (NON-NEGOTIABLE)

### 1.1 Target Structure

```
.hivemind/session-tracker/
├── project-continuity.json                          ← ALL sessions registered
└── {mainSessionID}/                                 ← ONLY L0 main session dir
    ├── {mainSessionID}.md                           ← main session messages
    ├── session-continuity.json                      ← hierarchy: L1+L2 children
    ├── {childL1_1}.json                             ← L1 child as JSON
    ├── {childL1_2}.json                             ← L1 child as JSON
    └── {grandchildL2}.json                          ← L2 grandchild as JSON
```

### 1.2 Directory Creation Rules

| Session Level | Gets Directory? | Gets .md? | Gets .json? | Registered in project-continuity? |
|--------------|----------------|-----------|-------------|-----------------------------------|
| L0 main | YES | YES (mainFile) | NO | YES |
| L1 child | NO | NO | YES (under parent) | YES |
| L2 grandchild | NO | NO | YES (under L0 root) | YES |

### 1.3 Rule: NO Child Directories

**WHEN** any session is classified as L1 or L2
**THEN** session-tracker SHALL NOT create a subdirectory for it
**AND** session-tracker SHALL NOT create a `.md` file for it
**AND** session-tracker SHALL create a `.json` file under the L0 main session directory

### 1.4 Rule: Child JSON Location

**WHEN** an L1 child is created with `parentSessionID = ses_main`
**THEN** child file path = `.hivemind/session-tracker/ses_main/{childID}.json`
**WHEN** an L2 grandchild is created
**THEN** child file path = `.hivemind/session-tracker/{rootL0ID}/{childID}.json`

### 1.5 Rule: Child JSON Contents

Child `.json` files SHALL contain:
- `delegationDepth` — computed dynamically from parent chain
- `delegatedBy.agentName` — actual `subagent_type` from task tool args
- `turns[]` — chat messages captured via childWriter
- Tool call records captured via childWriter
- `status` — updated by PostToolUse (completed/aborted/error)

---

## 2. Three-Gate Classification System

### 2.1 Gate Order (NON-NEGOTIABLE)

```
classifySession(sessionID):
  1. Gate 1 (SDK): client.session.get(id) → check parentID
     → IF parentID non-null → CHILD → STOP
  
  2. Gate 2 (HierarchyIndex): hierarchyIndex.isChild(id)
     → IF true → CHILD → STOP
  
  3. Gate 3 (PendingDispatchRegistry): pendingRegistry.has(id)
     → IF true → CHILD → STOP
  
  4. Fallback: MAIN (conservative — create directory)
```

### 2.2 PendingDispatchRegistry

**Purpose:** Bridge the gap between PreToolUse (dispatch known) and PostToolUse (child ID known).

**Lifecycle:**
1. `tool.execute.before` with `tool === "task"` → add entry: `{ parentSessionID, callID, subagentType, timestamp }`
2. `tool.execute.after` with `output.metadata.sessionId` → remove entry, register child in HierarchyIndex
3. Stale entries (>30s old) → auto-purge on next classification check
4. `session.created` for child → check registry → if found, classify as CHILD

### 2.3 Gate Activation Timing

| Event | Gates Active | Notes |
|-------|-------------|-------|
| `session.created` | Gate 1 + Gate 2 + Gate 3 | All three gates checked before directory creation |
| `chat.message` (lazy bootstrap) | Gate 1 + Gate 2 + Gate 3 | `ensureSessionReady` before message capture |
| `tool.execute.after` (lazy bootstrap) | Gate 1 + Gate 2 + Gate 3 | `ensureSessionReady` before tool capture |

---

## 3. PreToolUse Hook Integration

### 3.1 Hook Wiring

```typescript
// src/plugin.ts — NEW hook
"tool.execute.before": async (input, output) => {
  // Existing tool guard logic runs first
  // Then session-tracker:
  if (input.tool === "task") {
    const args = (output?.args ?? {}) as Record<string, unknown>
    await sessionTracker.handleToolExecuteBefore({
      sessionID: input.sessionID,
      callID: input.callID,
      subagentType: (args.subagent_type as string) || "",
      description: (args.description as string) || "",
      taskId: (args.task_id as string) || undefined,  // resume detection
    })
  }
}
```

### 3.2 handleToolExecuteBefore Behavior

**WHEN** `task_id` is present (resume):
**THEN** no new registration needed — skip

**WHEN** `task_id` is absent (new dispatch):
**THEN** register in PendingDispatchRegistry
**AND** fire-and-forget poll `client.session.children(parentID)` (~200ms retry, max 5)
**AND** on child discovery → register in HierarchyIndex, remove from pending

### 3.3 Polling Strategy

```
pollForChildren(parentID, maxAttempts = 5, interval = 200):
  for attempt in 1..maxAttempts:
    children = await client.session.children({ path: { id: parentID } })
    newChildren = children.filter(c => c.id not in knownChildren)
    for child in newChildren:
      hierarchyIndex.registerChild(parentID, child.id)
      pendingRegistry.removeByParentAndRecent(parentID)
    if newChildren.length > 0: break
    await sleep(interval)
```

---

## 4. Delegator Attribution

### 4.1 Capture Point

`tool.execute.before` output: `args.subagent_type` contains the delegating agent name.

### 4.2 Flow

```
PreToolUse: args.subagent_type = "gsd-planner"
  → stored in PendingDispatchRegistry entry

PostToolUse: output.metadata.sessionId = "ses_child123"
  → create child record with delegatedBy.agentName = "gsd-planner"
  → write to ses_main/ses_child123.json
```

### 4.3 Fallback

**WHEN** `subagent_type` is empty/undefined at PreToolUse time:
**THEN** store `"unknown"` as agentName
**AND** log warning

---

## 5. Acceptance Criteria

### AC-01: No Orphan Directories
**GIVEN** L0 session dispatches task tool
**WHEN** child session events fire (session.created, chat.message, tool.execute.after)
**THEN** `.hivemind/session-tracker/` contains exactly 1 subdirectory (the L0 main)
**AND** child session exists ONLY as `.json` file under L0 directory

### AC-02: Three-Gate Classification
**GIVEN** `session.created` fires for child session during race window
**WHEN** SDK parentID is not yet available AND HierarchyIndex not yet populated
**THEN** Gate 3 (PendingDispatchRegistry) classifies as CHILD
**AND** no directory created

### AC-03: Child JSON Created at PostToolUse
**GIVEN** task tool dispatch completes
**WHEN** `tool.execute.after` fires with `output.metadata.sessionId`
**THEN** child `.json` file created under parent directory
**AND** `delegationDepth` computed from parent chain (not hardcoded)
**AND** `delegatedBy.agentName` = actual `subagent_type` (not "unknown")
**AND** child registered in `session-continuity.json` hierarchy.children
**AND** child registered in `project-continuity.json`

### AC-04: Child Messages Captured in JSON
**GIVEN** L1 child session receives chat messages
**WHEN** `chat.message` fires for child
**THEN** messages appended to child `.json` turns[] via childWriter
**AND** messages NOT written to any `.md` file

### AC-05: PendingDispatchRegistry Lifecycle
**GIVEN** PreToolUse fires for task tool
**WHEN** entry added to PendingDispatchRegistry
**THEN** entry removed when PostToolUse fires with child session ID
**OR** entry auto-purged after 30s if PostToolUse never fires
**AND** stale entries never cause false CHILD classification

### AC-06: Delegator Attribution Correct
**GIVEN** `hm-l1-coordinator` dispatches task tool with `subagent_type: "hm-l2-researcher"`
**WHEN** child session record created
**THEN** `delegatedBy.agentName` = `"hm-l2-researcher"`

### AC-07: Existing Tests Pass
**GIVEN** CP-ST-02 implementation complete
**WHEN** `npx vitest run tests/features/session-tracker/` executed
**THEN** all 256 existing tests pass (no regressions)

### AC-08: project-continuity.json Completeness
**GIVEN** sessions exist in `.hivemind/session-tracker/`
**WHEN** `project-continuity.json` is read
**THEN** `sessions` entry count = total session count (main + children)
**AND** no orphan sessions missing from index

### AC-09: PostToolUse Still Works
**GIVEN** PreToolUse hook captures dispatch metadata
**WHEN** PostToolUse fires with child session ID
**THEN** child `.json` updated with completion status, output metadata
**AND** existing HandleTask logic continues to function

### AC-10: Resume Detection
**GIVEN** task tool called with `task_id` parameter (resume)
**WHEN** PreToolUse fires
**THEN** no new PendingDispatchRegistry entry created
**AND** no new child registration

---

## 6. Anti-Patterns (DO NOT IMPLEMENT)

| Anti-Pattern | Why Wrong |
|-------------|-----------|
| Create directory for child sessions | Causes orphan directories; violates single-directory constraint |
| Hardcode `delegationDepth = 1` | Flattens L1/L2 distinction |
| Hardcode `delegatedBy.agentName = "unknown"` | Destroys delegation lineage |
| Skip Gate 3 fallback | Race condition window remains open |
| Block tool execution on session-tracker failure | Violates best-effort contract |
| Write to `.hivemind/` directly from hooks | Violates CQRS boundary (ARCHITECTURE.md §3) |
| Use `ev?.sessionID` for session.created | Wrong SDK property path (already fixed in CP-ST-01) |
