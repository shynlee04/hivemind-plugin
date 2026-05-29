# Integration Verification: Task Tool + Trajectory + Contracts

**Date:** 2026-05-29
**Verifier:** gsd-integration-checker
**Scope:** Verify the integration surface for wiring trajectory + contracts into the task tool lifecycle

---

## Hook Point Verification

### Claim: `recordChildTaskDelegation()` exists at `src/features/session-tracker/tool-delegation.ts:227`

**VERIFIED ✅**

Evidence:
- File: `src/features/session-tracker/tool-delegation.ts`
- Method signature at line 227: `async recordChildTaskDelegation(parentID: string, input: { tool: string; sessionID: string; callID: string; args: unknown }, output: { title: string; output: unknown; metadata: unknown }, ensureChildRoute: (parentID: string, childID: string) => Promise<void>): Promise<void>`
- Method is 134 lines long (227-360)

### Claim: Called for BOTH `task` and `delegate-task` tools

**VERIFIED ✅**

Evidence:
- File: `src/features/session-tracker/index.ts`
- Line 312: `if (input.tool === "task" || input.tool === "delegate-task") {`
- Line 313-315: `await this.toolDelegation.recordChildTaskDelegation(parentID, input, output, this.ensureChildRoute.bind(this))`
- This is inside `handleToolExecuteAfter()` which is the `tool.execute.after` hook handler

### Claim: Hook point is the earliest with child session ID

**VERIFIED ✅**

Evidence:
- Line 233: `const childSessionID = extractTaskID(output.output)`
- Line 234: `if (!childSessionID) return` — exits early if no child session ID
- The child session ID is extracted from the tool output, which is only available after the task tool executes
- The `tool.execute.before` hook (line 81-121) does NOT have the child session ID — it only has the parent session ID and tool args

---

## Data Availability Verification

### Data available at `recordChildTaskDelegation()` time

| Data | Source | Line | Available? |
|------|--------|------|------------|
| `childSessionID` | `extractTaskID(output.output)` | 233 | ✅ |
| `parentSessionID` | `input.sessionID` | 229 | ✅ |
| `subagentType` | `args.subagent_type` or `args.agent` | 239-242 | ✅ |
| `description` | `args.description` | 237 | ✅ |
| `rootMain` | `this.hierarchyIndex.getRootMain(input.sessionID)` | 247 | ✅ |
| `depth` | `this.hierarchyIndex.getDepth(childSessionID)` | 249 | ✅ |
| `input.tool` | `"task"` or `"delegate-task"` | 229 | ✅ |
| `now` | `new Date().toISOString()` | 250 | ✅ |

### Data NOT available (needs to be added)

| Data | Required by | How to obtain |
|------|-------------|---------------|
| `projectRoot` | `attachTrajectoryEvidence()`, `eventTrajectory()`, `createAgentWorkContract()` | Add to `ToolDelegationDeps` interface |

---

## Module Interface Verification

### Trajectory Module

**File:** `src/task-management/trajectory/store-operations.ts`

#### `attachTrajectoryEvidence(input: TrajectoryMutationInput)`

Required fields (from `types.ts:113-128`):
```
projectRoot: string      ← NOT in ToolDelegationDeps (needs adding)
trajectoryId: string     ← Can derive as `traj-${childSessionID}`
rootSessionId: string    ← Available as `rootMain`
sessionId: string        ← Available as `childSessionID`
parentTrajectoryId: string ← Can derive as `traj-${input.sessionID}`
evidenceRef: string      ← Can construct
```

**VERDICT:** Interface matches available data after adding `projectRoot` to deps.

#### `eventTrajectory(input: TrajectoryMutationInput & { eventType: string; summary: string })`

Same as above plus:
```
eventType: string        ← Can use "delegation_dispatch"
summary: string          ← Can construct from description
```

**VERDICT:** Interface matches available data after adding `projectRoot` to deps.

#### Idempotency

**VERIFIED ✅**

Evidence:
- Line 136-163: `upsertTrajectory()` function
- Line 137: `const existing = ledger.trajectories[input.trajectoryId]`
- Line 138-142: If trajectory exists, updates fields and returns existing
- Line 144-162: If trajectory doesn't exist, creates new
- Both `attachTrajectoryEvidence()` and `eventTrajectory()` call `upsertTrajectory()`
- Safe to call multiple times with the same `trajectoryId`

### Contract Module

**File:** `src/features/agent-work-contracts/operations.ts`

#### `createAgentWorkContract(input: CreateAgentWorkContractInput)`

Required fields (from `types.ts:24-45`):
```
projectRoot: string      ← NOT in ToolDelegationDeps (needs adding)
owner.agent: string      ← Available as `subagentType`
owner.sessionId: string  ← Available as `childSessionID`
owner.parentSessionId: string ← Available as `input.sessionID`
scope.taskBoundary: string ← Available as `description`
evidence.minimumEvidenceLevel: string ← Can use "L4_IMPLEMENTATION_TRACE"
compaction.briefing: string ← Can use description.slice(0, 200)
```

Optional fields with defaults:
```
scope.allowedSurfaces: [] (default)
scope.dependencies: [] (default)
scope.nonGoals: [] (default)
evidence.requiredProof: [] (default)
evidence.verificationCommands: [] (default)
evidence.blockedStateRules: [] (default)
compaction.summary: "" (default)
compaction.anchors: [] (default)
compaction.reinjectionPayload: "" (default)
compaction.sourceRefs: [] (default)
```

**VERDICT:** Interface matches available data after adding `projectRoot` to deps. All required fields can be populated from available data. Optional fields have sensible defaults.

#### Idempotency

**PARTIALLY VERIFIED ⚠️**

Evidence:
- Line 37: `const id = input.id ?? \`awc_${randomUUID()}\``
- Line 52: `const persisted = upsertAgentWorkContract(input.projectRoot, contract)`
- If `input.id` is provided, `upsertAgentWorkContract()` will overwrite the existing contract
- If `input.id` is NOT provided, a new UUID is generated each time — NOT idempotent

**Mitigation:** Use a deterministic ID like `awc-${childSessionID}` to ensure idempotency.

---

## Session-Idle Handler Verification

### Claim: Completion event can be recorded at `session-idle-handler.ts`

**VERIFIED ✅ (with conditions)**

Evidence:
- File: `src/features/session-tracker/capture/handlers/session-idle-handler.ts`
- Line 27-46: Child session idle handling
- Line 31: `await this.deps.childWriter.updateChildStatus(childRoute.parentID, sessionID, "completed")`
- Line 32: `await this.deps.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")`
- Line 33-35: Manifest writer update

Data available at this point:
```
sessionID: string        ← Available (function parameter)
childRoute.parentID: string ← Available
childRoute.rootMainID: string ← Available
```

**Condition:** `HandlerDeps` does NOT have `projectRoot`. Needs to be added to `HandlerDeps` interface in `types.ts:33-45`.

---

## Conflict Analysis

### Circular Dependency Risk

**NO RISK ✅**

Evidence:
- Trajectory module: `src/task-management/trajectory/` — standalone, no imports from session-tracker
- Contract module: `src/features/agent-work-contracts/` — imports from trajectory module only
- Session-tracker: `src/features/session-tracker/` — would import from trajectory and contract modules
- Dependency direction: session-tracker → trajectory, session-tracker → contracts
- No circular dependency possible

### CQRS Boundary

**ALREADY VIOLATED (consistent pattern)**

Evidence:
- Session-tracker claims to be "read-side observer" (`index.ts:9`)
- But it already performs write-side mutations:
  - `childWriter.createChildFile()` — creates .json files (line 293)
  - `sessionIndexWriter.addChild()` — updates indices (line 308)
  - `manifestWriter.addChild()` — updates hierarchy manifest (line 317)
  - `projectIndexWriter.addSession()` — updates project index (line 327)
- Adding trajectory/contract writes is consistent with existing pattern
- NOT introducing a new violation — extending an existing one

### Import Path Conflicts

**NO CONFLICTS ✅**

Evidence:
- Trajectory: `src/task-management/trajectory/index.ts` — barrel exports
- Contracts: `src/features/agent-work-contracts/index.ts` — barrel exports
- Both use standard import paths
- No naming conflicts with existing imports in `tool-delegation.ts`

---

## Summary of Required Changes

### 1. Add `projectRoot` to `ToolDelegationDeps` (tool-delegation.ts:23-32)

```typescript
export interface ToolDelegationDeps {
  client: OpenCodeClient
  classifier: SessionClassifier
  childWriter: ChildWriter
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter: ProjectIndexWriter
  hierarchyIndex: HierarchyIndex
  pendingRegistry: PendingDispatchRegistry
  manifestWriter: HierarchyManifestWriter
  projectRoot: string  // NEW
}
```

### 2. Add `projectRoot` to `ToolDelegation` class (tool-delegation.ts:41-49)

```typescript
export class ToolDelegation {
  // ... existing fields ...
  private readonly projectRoot: string  // NEW
```

### 3. Wire `projectRoot` in initialization (initialization.ts:515-524)

In `SessionTracker.initialize()`:
```typescript
this.toolDelegation = new ToolDelegation({
  // ... existing deps ...
  projectRoot: this.projectRoot,  // NEW
})
```

### 4. Add `projectRoot` to `HandlerDeps` (handlers/types.ts:33-45)

```typescript
export interface HandlerDeps {
  // ... existing fields ...
  projectRoot: string  // NEW
}
```

### 5. Wire `projectRoot` in EventCapture constructor (initialization.ts:216-226)

```typescript
const eventCapture = new EventCapture({
  // ... existing deps ...
  projectRoot,  // NEW
})
```

### 6. Add trajectory/contract creation in `recordChildTaskDelegation()` (tool-delegation.ts:331)

After `projectIndexWriter.addSession()`, before the `taskResult` block:
```typescript
// Trajectory + contract integration
const trajectoryId = `traj-${childSessionID}`
const contractId = `awc-${childSessionID}`
try {
  attachTrajectoryEvidence({ projectRoot: this.projectRoot, trajectoryId, rootSessionId: rootMain, sessionId: childSessionID, parentTrajectoryId: `traj-${input.sessionID}`, evidenceRef: `session-tracker:delegation:${input.tool}:${childSessionID}` })
  eventTrajectory({ projectRoot: this.projectRoot, trajectoryId, eventType: "delegation_dispatch", summary: `${input.tool} delegation to ${subagentType}: ${description.slice(0, 200)}`, evidenceRef: `session-tracker:child-json:${childSessionID}` })
  createAgentWorkContract({ projectRoot: this.projectRoot, id: contractId, owner: { agent: subagentType, sessionId: childSessionID, parentSessionId: input.sessionID }, scope: { taskBoundary: description.slice(0, 500) || "Delegated task", allowedSurfaces: [], dependencies: [], nonGoals: [] }, evidence: { requiredProof: [], minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE", verificationCommands: [], blockedStateRules: [] }, compaction: { briefing: description.slice(0, 200) || "", summary: "", anchors: [], reinjectionPayload: "", sourceRefs: [] }, trajectoryId })
} catch (err) {
  // Best-effort — don't fail delegation
}
```

### 7. Add trajectory completion event in session-idle-handler.ts:35

After `manifestWriter.updateChildStatus()`:
```typescript
try {
  eventTrajectory({ projectRoot: this.deps.projectRoot, trajectoryId: `traj-${sessionID}`, eventType: "delegation_completed", summary: `Child session ${sessionID} completed`, evidenceRef: `session-tracker:idle:${sessionID}` })
} catch {
  // Best-effort
}
```

---

## Verdict

**CONDITIONAL PASS ✅**

The integration surface is valid and the hook point is correct. The implementation can proceed with the following conditions:

1. **Add `projectRoot` to `ToolDelegationDeps`** — required for trajectory/contract writes
2. **Add `projectRoot` to `HandlerDeps`** — required for completion event in idle handler
3. **Use deterministic contract ID** (`awc-${childSessionID}`) — required for idempotency
4. **Best-effort error handling** — trajectory/contract failures must not break delegation

All module interfaces match the available data. No circular dependencies. No new CQRS violations (extending existing pattern). Implementation effort: ~30 lines across 4-5 files.
