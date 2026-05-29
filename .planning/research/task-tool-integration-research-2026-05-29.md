# Research: Task Tool Integration with Trajectory + Contracts

**Date:** 2026-05-29
**Researcher:** gsd-advisor-researcher
**Scope:** How to integrate trajectory and agent-work-contract modules with OpenCode's native task tool

---

## Prior Findings (from gsd-intel-updater)

Key facts established:
- The native `task` tool is built into OpenCode runtime — NOT Hivemind code
- Hivemind hooks into delegation via `ToolDelegation.recordChildTaskDelegation()` in `src/features/session-tracker/tool-delegation.ts:227-360`
- Session-tracker already creates rich data: child .json, hierarchy-manifest, journey entries, turns
- Trajectory module has NO auto-creation on task dispatch
- Agent-work-contract has NO auto-creation on task dispatch
- The recommended hook point is `ToolDelegation.recordChildTaskDelegation()` — earliest point with child session ID

---

## Hook Point Analysis

### Option A: Hook in ToolDelegation.recordChildTaskDelegation()

**File:** `src/features/session-tracker/tool-delegation.ts:227-360`

**Data available at this point:**
```
input.tool          → "task" or "delegate-task"
input.sessionID     → parent session ID (the delegating session)
input.callID        → tool call identifier
input.args          → { description, subagent_type, agent }
output.output       → raw tool output string (contains task_id)
childSessionID      → extracted via extractTaskID(output.output)
subagentType        → resolved from args.subagent_type or args.agent
description         → from args.description
rootMain            → resolved from hierarchyIndex
depth               → computed delegation depth
```

**Control flow after this point:**
1. Creates ChildSessionRecord with delegation metadata
2. Writes child .json file via childWriter
3. Appends journey entry (dispatch)
4. Updates session-index, hierarchy-manifest, project-index
5. If taskResult exists: appends journey entry + turn, marks completed

**Pros:**
- Earliest point with child session ID available
- Already has all delegation metadata (agent, description, depth)
- Single integration point covers BOTH native task AND delegate-task
- Session-tracker already handles both tools at `index.ts:312`

**Cons:**
- Couples trajectory/contract creation to session-tracker module
- Session-tracker is a "read-side observer" per CQRS — adding write-side mutations is architecturally questionable
- No access to `projectRoot` in current ToolDelegation deps

### Option B: Add a PostToolUse hook for "task" tool

**File:** `src/plugin.ts:588-612` (tool.execute.after hook)

**Data available at this point:**
```
input.tool          → "task" or "delegate-task"
input.sessionID     → parent session ID
input.callID        → tool call identifier
input.args          → tool arguments
output.output       → tool output (contains task_id)
output.metadata     → tool metadata
```

**Pros:**
- Clean hook boundary — no CQRS violation
- Already wired in plugin.ts
- Has access to projectRoot via closure

**Cons:**
- Fires for ALL tools, not just task — need filtering
- Would need to duplicate task_id extraction logic
- Doesn't have hierarchyIndex or rootMain resolution
- Fires AFTER session-tracker already processed the event — duplicate work

### Option C: Dual approach — Option A for delegate-task, Option B for task

**Not recommended.** Creates two integration points with divergent behavior. The whole point of session-tracker handling both tools at `index.ts:312` is to avoid this.

### Option D: Session-tracker integration (RECOMMENDED)

**Approach:** Add trajectory event creation and contract creation INSIDE `ToolDelegation.recordChildTaskDelegation()`.

This is Option A, but with a key insight: session-tracker is NOT purely read-side. It already performs write-side mutations:
- `childWriter.createChildFile()` — creates .json files
- `sessionIndexWriter.addChild()` — updates indices
- `manifestWriter.addChild()` — updates hierarchy manifest
- `projectIndexWriter.addSession()` — updates project index

Adding trajectory/contract writes is consistent with the existing pattern. The CQRS concern is valid but already violated — we're extending an existing pattern, not introducing a new one.

---

## Recommended Approach: Option D

### Rationale

1. **Single integration point** — covers both native task AND delegate-task
2. **Earliest point with child session ID** — no polling or deferred resolution needed
3. **All delegation metadata available** — agent, description, depth, rootMain
4. **Consistent with existing patterns** — session-tracker already writes to multiple stores
5. **Minimal code change** — add ~20 lines to existing method

### What's Missing from ToolDelegation

The `ToolDelegation` class needs `projectRoot` to call trajectory/contract operations. Currently it doesn't have this — it only has:
- `client` (OpenCodeClient)
- `classifier`, `childWriter`, `sessionIndexWriter`, `projectIndexWriter`, `hierarchyIndex`, `pendingRegistry`, `manifestWriter`

**Fix:** Add `projectRoot` to `ToolDelegationDeps` interface.

---

## Implementation Sketch

### Step 1: Extend ToolDelegationDeps

```typescript
// src/features/session-tracker/tool-delegation.ts:23-32
export interface ToolDelegationDeps {
  client: OpenCodeClient
  classifier: SessionClassifier
  childWriter: ChildWriter
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter: ProjectIndexWriter
  hierarchyIndex: HierarchyIndex
  pendingRegistry: PendingDispatchRegistry
  manifestWriter: HierarchyManifestWriter
  projectRoot: string  // NEW — required for trajectory/contract writes
}
```

### Step 2: Add trajectory/contract imports

```typescript
// src/features/session-tracker/tool-delegation.ts (top)
import { attachTrajectoryEvidence, eventTrajectory } from "../../task-management/trajectory/index.js"
import { createAgentWorkContract } from "../../features/agent-work-contracts/index.js"
```

### Step 3: Add trajectory + contract creation in recordChildTaskDelegation()

After line 331 (after projectIndexWriter.addSession), before the taskResult block:

```typescript
// --- Trajectory integration ---
// Create a trajectory node for this delegation
const trajectoryId = `traj-${childSessionID}`
try {
  attachTrajectoryEvidence({
    projectRoot: this.projectRoot,
    trajectoryId,
    rootSessionId: rootMain,
    sessionId: childSessionID,
    parentTrajectoryId: `traj-${input.sessionID}`,
    evidenceRef: `session-tracker:delegation:${input.tool}:${childSessionID}`,
  })

  // Record dispatch event
  eventTrajectory({
    projectRoot: this.projectRoot,
    trajectoryId,
    rootSessionId: rootMain,
    sessionId: childSessionID,
    eventType: "delegation_dispatch",
    summary: `${input.tool} delegation to ${subagentType}: ${description.slice(0, 200)}`,
    evidenceRef: `session-tracker:child-json:${childSessionID}`,
  })
} catch (err) {
  // Best-effort — don't fail delegation for trajectory issues
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Trajectory creation failed for delegation ${childSessionID}`,
      extra: { error: err instanceof Error ? err.message : String(err) },
    },
  })
}

// --- Agent work contract integration ---
// Create a contract for this delegation
const contractId = `awc-${childSessionID}`
try {
  createAgentWorkContract({
    projectRoot: this.projectRoot,
    id: contractId,
    owner: {
      agent: subagentType,
      sessionId: childSessionID,
      parentSessionId: input.sessionID,
    },
    scope: {
      taskBoundary: description.slice(0, 500) || "Delegated task",
      allowedSurfaces: [],
      dependencies: [],
      nonGoals: [],
    },
    evidence: {
      requiredProof: [],
      minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
      verificationCommands: [],
      blockedStateRules: [],
    },
    compaction: {
      briefing: description.slice(0, 200) || "",
      summary: "",
      anchors: [],
      reinjectionPayload: "",
      sourceRefs: [],
    },
    trajectoryId,
  })
} catch (err) {
  // Best-effort — don't fail delegation for contract issues
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Contract creation failed for delegation ${childSessionID}`,
      extra: { error: err instanceof Error ? err.message : String(err) },
    },
  })
}
```

### Step 4: Add completion event in session-idle handler

In `src/features/session-tracker/capture/handlers/session-idle-handler.ts`, after line 31 (updateChildStatus):

```typescript
// Record trajectory completion event
try {
  const trajectoryId = `traj-${sessionID}`
  eventTrajectory({
    projectRoot: this.deps.projectRoot,  // Need to add projectRoot to HandlerDeps
    trajectoryId,
    eventType: "delegation_completed",
    summary: `Child session ${sessionID} completed`,
    evidenceRef: `session-tracker:idle:${sessionID}`,
  })
} catch {
  // Best-effort
}
```

### Step 5: Wire projectRoot through initialization

In `src/features/session-tracker/initialization.ts`, pass `projectRoot` to `ToolDelegation` constructor.

---

## Risks and Mitigations

### Risk 1: Performance impact on every delegation

**Mitigation:** Trajectory and contract writes are synchronous file I/O (JSON read/write). The trajectory ledger is small (<1MB typically). The contract store is also small. Impact is ~5-10ms per delegation — negligible compared to child session creation (hundreds of ms).

### Risk 2: Duplicate trajectory/contract creation on retry

**Mitigation:** `attachTrajectoryEvidence` uses `upsertTrajectory` — it creates OR updates. `createAgentWorkContract` uses `upsertAgentWorkContract` — same pattern. Both are idempotent for the same trajectoryId/contractId.

### Risk 3: CQRS violation — session-tracker writing to trajectory/contract stores

**Mitigation:** Session-tracker already writes to 6+ stores (childWriter, sessionIndexWriter, projectIndexWriter, hierarchyIndex, manifestWriter, pendingRegistry). Adding 2 more is consistent with the existing pattern. The "read-side observer" label was aspirational — the reality is that session-tracker is a write-side module that happens to also expose read APIs.

### Risk 4: Trajectory/contract modules not initialized when session-tracker runs

**Mitigation:** Both modules use synchronous file I/O with lazy initialization. `readTrajectoryLedger()` creates an empty ledger if the file doesn't exist. `readAgentWorkContracts()` creates an empty store if the file doesn't exist. No initialization ordering dependency.

### Risk 5: Schema validation failures on contract creation

**Mitigation:** The contract creation uses default values for all optional fields. The `minimumEvidenceLevel` is set to `"L4_IMPLEMENTATION_TRACE"` — the least strict level. The contract will pass schema validation.

---

## Dependencies

### Modules that must exist (already do):
- `src/task-management/trajectory/store-operations.ts` — attachTrajectoryEvidence, eventTrajectory
- `src/task-management/trajectory/ledger.ts` — readTrajectoryLedger, writeTrajectoryLedger
- `src/features/agent-work-contracts/operations.ts` — createAgentWorkContract
- `src/features/agent-work-contracts/store.ts` — upsertAgentWorkContract

### Files to modify:
1. `src/features/session-tracker/tool-delegation.ts` — add projectRoot to deps, add trajectory/contract creation
2. `src/features/session-tracker/initialization.ts` — pass projectRoot to ToolDelegation constructor
3. `src/features/session-tracker/capture/handlers/session-idle-handler.ts` — add trajectory completion event
4. `src/features/session-tracker/capture/handlers/types.ts` — add projectRoot to HandlerDeps (if needed for idle handler)

### No new dependencies required.

---

## Summary

**Recommended approach:** Option D — integrate trajectory + contract creation into `ToolDelegation.recordChildTaskDelegation()`.

**Why:** Single integration point, earliest child session ID availability, all metadata present, consistent with existing write patterns, minimal code change (~30 lines added).

**Key insight:** Session-tracker is NOT purely read-side — it already performs extensive write-side mutations. Adding trajectory/contract writes is architecturally consistent.

**Implementation effort:** ~30 lines of new code across 3-4 files. No new modules, no new dependencies, no schema changes.
