---
phase: P41-B
plan: 01
status: planned
type: execute
wave: 1
depends_on: [P41-A]
files_modified:
  - src/features/session-tracker/types.ts
  - src/features/governance/persistence.ts (NEW)
  - src/task-management/continuity/delegation-persistence.ts
  - src/task-management/continuity/index.ts
  - src/features/governance-engine/evaluator.ts
autonomous: true
requirements: [REQ-P41B-01, REQ-P41B-02, REQ-P41B-03, REQ-P41B-04, REQ-P41B-05, REQ-P41B-06, REQ-P41B-07]
must_haves:
  truths:
    - "ChildSessionRecord carries 7 new optional fields (pendingNotifications, queueKey, terminalKind, recoveryGuarantee, executionMode, compactionCheckpoint, lifecycle) without breaking existing construction"
    - "persistDelegations() writes to both delegations.json AND ChildWriter.createChildFile()"
    - "recordSessionContinuity()/patchSessionContinuity() writes to both session-continuity.json AND ChildWriter"
    - "Governance state persists independently at .hivemind/state/governance-state.json"
    - "npm run typecheck passes with zero errors"
    - "npm run test passes with zero failures"
  artifacts:
    - path: src/features/session-tracker/types.ts
      provides: "ChildSessionRecord with 7 new optional fields"
      contains: "pendingNotifications?: PendingNotification[]"
    - path: src/features/governance/persistence.ts (NEW)
      provides: "Standalone governance state I/O (getGovernanceStatePath, readGovernanceState, writeGovernanceState, emptyGovernanceState)"
      min_lines: 40
    - path: src/task-management/continuity/delegation-persistence.ts
      provides: "persistDelegations() with dual-write to session-tracker"
      contains: "childWriter.createChildFile"
    - path: src/task-management/continuity/index.ts
      provides: "recordSessionContinuity() and patchSessionContinuity() with dual-write to session-tracker"
      contains: "childWriter.createChildFile"
    - path: src/features/governance-engine/evaluator.ts
      provides: "Governance evaluator redirect to writeGovernanceState()"
      contains: "writeGovernanceState"
  key_links:
    - from: src/task-management/continuity/delegation-persistence.ts
      to: src/features/session-tracker/persistence/child-writer.ts
      via: "import ChildWriter + construct with projectRoot"
      pattern: "new ChildWriter"
    - from: src/task-management/continuity/index.ts
      to: src/features/session-tracker/persistence/child-writer.ts
      via: "import ChildWriter + construct with projectRoot"
      pattern: "new ChildWriter"
    - from: src/features/governance-engine/evaluator.ts
      to: src/features/governance/persistence.ts
      via: "replace recordGovernancePersistenceState with writeGovernanceState"
      pattern: "writeGovernanceState"
    - from: src/task-management/continuity/index.ts
      to: src/features/governance/persistence.ts
      via: "export getCanonicalStateDir for governance path resolution"
      pattern: "getCanonicalStateDir"
---

<objective>
Add 7 gap fields to ChildSessionRecord, create standalone governance-state.json, and redirect 5 writer paths from legacy files to session-tracker via dual-write.

**Purpose:** Enable the session-tracker to carry all data currently written to delegations.json and session-continuity.json, and route all writes through the new canonical paths while keeping old files working for readers (P41-C converts those).

**Output:** Extended type definitions, new governance persistence module, dual-write redirect paths for persistDelegations(), recordSessionContinuity(), patchSessionContinuity(), and governance evaluator.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P41-state-cluster-redesign/P41-B-SPEC.md
@.planning/phases/P41-state-cluster-redesign/41-B-RESEARCH.md
@.planning/phases/P41-state-cluster-redesign/P41-B-ASSUMPTIONS.md

# Source files
@src/features/session-tracker/types.ts
@src/features/session-tracker/persistence/child-writer.ts
@src/features/session-tracker/persistence/hierarchy-manifest.ts
@src/task-management/continuity/delegation-persistence.ts
@src/task-management/continuity/index.ts
@src/features/governance-engine/evaluator.ts
@src/coordination/delegation/types.ts
@src/coordination/completion/notification-handler.ts
@src/coordination/delegation/state-machine.ts
@src/shared/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add 7 optional gap fields to ChildSessionRecord</name>
  <files>
    src/features/session-tracker/types.ts
  </files>
  <action>
    Add 7 new optional fields to the `ChildSessionRecord` interface (lines 211-236):

    1. Add type imports at the top of the file from:
       - `../../shared/types.js`: `PendingNotification`, `CompactionCheckpointData`, `SessionLifecycleState`
       - `../../coordination/delegation/types.js`: `DelegationRecoveryGuarantee`, `DelegationTerminalKind`

    2. After the `journey?: JourneyEntry[]` field (line 235), insert 7 new fields in this exact order, each with a JSDoc comment:

       ```typescript
       // 7 new optional gap fields (P41-B)
       /** Pending notifications for this session (from continuity store). REF: REQ-P41B-01 */
       pendingNotifications?: PendingNotification[]
       /** Queue key for slot-managed delegation (from delegation record). REF: REQ-P41B-02 */
       queueKey?: string
       /** How the delegation terminated (from delegation record). REF: REQ-P41B-02 */
       terminalKind?: DelegationTerminalKind
       /** Recovery guarantee level (from delegation record). REF: REQ-P41B-02 */
       recoveryGuarantee?: DelegationRecoveryGuarantee
       /** How the child session was dispatched (from delegation record). REF: REQ-P41B-02 */
       executionMode?: "sdk" | "pty" | "headless"
       /** Compaction checkpoint data (from continuity store). REF: REQ-P41B-02 */
       compactionCheckpoint?: CompactionCheckpointData
       /** Session lifecycle state (from continuity store). REF: REQ-P41B-02 */
       lifecycle?: SessionLifecycleState
       ```

    **Constraints (per SPEC):**
    - All fields MUST be optional with `?` — no required fields
    - Do NOT change any existing field, JSDoc, or guard function
    - Do NOT add default value logic in the type (optional = `undefined`)
    - Do NOT modify `isValidSessionID`, `isValidHookPayload`, or any type guard
    - Do NOT modify `PendingNotification`, `DelegationTerminalKind`, `DelegationRecoveryGuarantee`, `CompactionCheckpointData`, or `SessionLifecycleState` types themselves — they are stable imports

    **Self-check:** After editing, run `npx tsc --noEmit --pretty` to verify zero type errors with the expanded interface.
  </action>
  <verify>
    <automated>grep -n "pendingNotifications?" src/features/session-tracker/types.ts && grep -n "queueKey?" src/features/session-tracker/types.ts && grep -n "executionMode?" src/features/session-tracker/types.ts && grep -n "lifecycle?" src/features/session-tracker/types.ts && npm run typecheck</automated>
  </verify>
  <done>
    - `ChildSessionRecord` has 7 new optional fields
    - All existing typecheck passes (`npm run typecheck` exits 0)
    - No `any` types introduced
    - No existing field, guard, or test is broken
  </done>
</task>

<task type="auto">
  <name>Task 2: Create standalone governance persistence module at src/features/governance/persistence.ts</name>
  <files>
    src/features/governance/persistence.ts (NEW)
  </files>
  <action>
    Create a new file at `src/features/governance/persistence.ts` that provides atomic read/write to `.hivemind/state/governance-state.json`.

    **Module exports (4 functions):**

    1. `getGovernanceStatePath(projectRoot?: string): string`
       - Resolve via `getCanonicalStateDir()` imported from `../../task-management/continuity/index.js`
       - Return `resolve(stateDir, "governance-state.json")`

    2. `readGovernanceState(projectRoot?: string): GovernancePersistenceState`
       - If file doesn't exist, return `emptyGovernanceState()`
       - Try-catch JSON.parse, return `emptyGovernanceState()` on parse failure
       - Import type from `../../shared/types.js`

    3. `writeGovernanceState(state: GovernancePersistenceState, projectRoot?: string): void`
       - Atomic write pattern: write to temp → rename (matching existing `continuity/index.ts` pattern)
       - Use `mkdirSync(dirname(filePath), { recursive: true })` to ensure directory exists
       - Temp file: `${filePath}.${process.pid}.${randomUUID()}.tmp`
       - Write `JSON.stringify(state, null, 2) + "\n"`, then `renameSync(tmpFile, filePath)`
       - Imports from `node:fs` (sync `writeFileSync`, `renameSync`, `existsSync`, `mkdirSync`)
       - Import `randomUUID` from `node:crypto`

    4. `emptyGovernanceState(): GovernancePersistenceState`
       - Returns `{ rules: [], violations: [], updatedAt: Date.now() }`

    **Constraints (per SPEC REQ-P41B-03):**
    - NO import dependency on session-tracker or continuity types (only imports from `src/shared/types.ts`)
    - `getCanonicalStateDir` import from `../../task-management/continuity/index.js` IS allowed — this is the same dependency direction as existing `getGovernancePersistenceState()`
    - Use existing atomic write convention (writeFileSync + renameSync, NOT fs/promises — governance is synchronous)
    - Governance is cross-cutting (NOT per-session) — do NOT store inside ChildSessionRecord

    **Reference implementation from RESEARCH.md lines 483-517.**
  </action>
  <verify>
    <automated>test -f src/features/governance/persistence.ts && grep -q "writeGovernanceState" src/features/governance/persistence.ts && grep -q "getGovernanceStatePath" src/features/governance/persistence.ts && npm run typecheck</automated>
  </verify>
  <done>
    - `src/features/governance/persistence.ts` exists with 4 exported functions
    - Path resolves to `<projectRoot>/.hivemind/state/governance-state.json`
    - No session-tracker import dependency
    - Atomic write pattern (temp → rename) used
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto">
  <name>Task 3: Redirect governance evaluator to writeGovernanceState() + deprecate old recordGovernancePersistenceState()</name>
  <files>
    src/features/governance-engine/evaluator.ts
    src/task-management/continuity/index.ts
  </files>
  <action>
    **Part A: Governance evaluator redirect (evaluator.ts)**

    1. Change the import on line 2:
       - Remove: `recordGovernancePersistenceState`
       - Keep: `getGovernancePersistenceState`
       - Add: `import { writeGovernanceState } from "../governance/persistence.js"` (relative path from `src/features/governance-engine/` to `src/features/governance/persistence.js`)

    2. Replace line 99 (`recordGovernancePersistenceState(state)`) with:
       ```typescript
       writeGovernanceState(state)
       ```

    3. Keep the try-catch around lines 95-103 — the new `writeGovernanceState()` is sync and could throw on fs errors.

    **Part B: Deprecate old recordGovernancePersistenceState() (continuity/index.ts)**

    1. After the existing `recordGovernancePersistenceState()` function (lines 464-474), add a deprecation notice. Change the function body to:
       ```typescript
       export function recordGovernancePersistenceState(state: GovernancePersistenceState, projectRoot?: string): GovernancePersistenceState {
         console.warn(`[Harness] DEPRECATED: recordGovernancePersistenceState() is a no-op. Use writeGovernanceState() from governance/persistence.ts instead.`)
         // Old behavior: writes to continuity store's governance field
         // const next = cloneGovernanceState({ ...state, updatedAt: Date.now() })
         // const store = ensureStoreLoaded(projectRoot)
         // store.governance = next
         // persistStore(projectRoot)
         // return cloneGovernanceState(next)
         return cloneGovernanceState({
           rules: [],
           violations: [],
           updatedAt: Date.now(),
         })
       }
       ```

    2. The old code path is COMMENTED OUT (not removed) so the pattern is visible for reference.

    **Constraints (per SPEC):**
    - Keep `getGovernancePersistenceState()` fully functional (governance engine still reads from continuity store during P41-B, and readers aren't migrated until P41-C)
    - The deprecation warning helps developers notice when old code paths are still being called

    **Self-check:** Verify evaluator no longer imports from continuity for writes (only `getGovernancePersistenceState` remains). Verify `npm run typecheck` passes.
  </action>
  <verify>
    <automated>grep -q "writeGovernanceState" src/features/governance-engine/evaluator.ts && grep -q "DEPRECATED" src/task-management/continuity/index.ts && npm run typecheck</automated>
  </verify>
  <done>
    - Evaluator.ts calls `writeGovernanceState()` instead of `recordGovernancePersistenceState()`
    - `recordGovernancePersistenceState()` logged as deprecated no-op with warning
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto">
  <name>Task 4: Add dual-write to persistDelegations() for session-tracker</name>
  <files>
    src/task-management/continuity/delegation-persistence.ts
  </files>
  <action>
    Add fire-and-forget dual-write to `persistDelegations()` (line 58) so it also writes to session-tracker `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()`.

    **Step 1: Add imports at the top of the file:**
    ```typescript
    import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
    import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
    import { HierarchyManifestWriter } from "../../features/session-tracker/persistence/hierarchy-manifest.js"
    ```

    **Step 2: Add a helper function** before `persistDelegations()`:
    ```typescript
    /**
     * Builds a ChildSessionRecord from a Delegation for dual-write to session-tracker.
     * REF: REQ-P41B-04 field mapping table.
     */
    function buildChildRecordFromDelegation(d: Delegation): ChildSessionRecord {
      const status = d.status === "dispatched" || d.status === "running" ? "active"
        : d.status === "completed" ? "completed"
        : "error" // timeout / error both map to error

      return {
        sessionID: d.childSessionId,
        parentSessionID: d.parentSessionId,
        delegationDepth: d.nestingDepth ?? 1,
        delegatedBy: {
          agentName: d.agent,
          model: "",
          tool: "task",
          description: d.prompt ?? "",
          subagentType: "",
        },
        created: new Date(d.createdAt).toISOString(),
        updated: d.completedAt ? new Date(d.completedAt).toISOString() : new Date().toISOString(),
        status,
        mainAgent: { name: d.agent, model: "" },
        turns: [],
        children: [],
        // 7 new gap fields (P41-B)
        queueKey: d.queueKey || undefined,
        terminalKind: d.terminalKind,
        recoveryGuarantee: d.recoveryGuarantee,
        executionMode: d.executionMode,
      }
    }
    ```

    **Step 3: At the end of `persistDelegations()`** (after `renameSync(tmpFile, filePath)` on line 133), add the dual-write block:
    ```typescript
    // --- P41-B: Dual-write to session-tracker (fire-and-forget, best-effort) ---
    try {
      const storeDir = getDelegationStoreDirectory()
      const projectRoot = dirname(storeDir) // parent of the .hivemind/state directory
      const childWriter = new ChildWriter({ projectRoot })
      const manifestWriter = new HierarchyManifestWriter({ projectRoot })

      for (const d of delegations) {
        if (!d.childSessionId || !d.parentSessionId) {
          console.warn(`[Harness] persistDelegations dual-write: skipping delegation ${d.id} — missing session IDs`)
          continue
        }

        const childRecord = buildChildRecordFromDelegation(d)
        void childWriter.createChildFile(d.parentSessionId, d.childSessionId, childRecord)

        void manifestWriter.addChild({
          rootMainSessionID: d.parentSessionId, // fallback — correct for depth-1; regeneratable from continuity
          childSessionID: d.childSessionId,
          parentSessionID: d.parentSessionId,
          delegationDepth: d.nestingDepth ?? 1,
          delegatedBy: d.agent,
          subagentType: "",
          childFile: `${d.childSessionId}.json`,
        })
      }
    } catch (err) {
      // Fire-and-forget: log but never throw — old sync path already wrote to delegations.json
      console.error(`[Harness] persistDelegations dual-write error: ${err instanceof Error ? err.message : String(err)}`)
    }
    ```

    **Constraints (per SPEC REQ-P41B-04):**
    - Fire-and-forget with `void` — do NOT await
    - Old `writeFileSync` + `renameSync` path remains unchanged (lines 124-133)
    - If `childSessionId` or `parentSessionId` is missing, SKIP (do NOT throw)
    - Construct `ChildWriter` and `HierarchyManifestWriter` internally — do NOT change the `persistDelegations()` function signature (keeps all callers unchanged)
    - `rootMainSessionID` fallback to `parentSessionId` is APPROXIMATE but safe — manifest is regeneratable in P41-C
    - Status mapping: dispatched/running → "active", completed → "completed", error/timeout → "error"

    **Self-check:** Verify `persistAll()` in state-machine.ts remains synchronous (no `async`). Verify old tests still pass because old `delegations.json` path is untouched.
  </action>
  <verify>
    <automated>grep -q "new ChildWriter" src/task-management/continuity/delegation-persistence.ts && grep -q "createChildFile" src/task-management/continuity/delegation-persistence.ts && grep -q "HierarchyManifestWriter" src/task-management/continuity/delegation-persistence.ts && npm run typecheck</automated>
  </verify>
  <done>
    - `persistDelegations()` calls `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()` as fire-and-forget
    - Old sync path to `delegations.json` is unchanged
    - Function signature remains `void` (not async)
    - Missing session IDs are skipped with warning (no throw)
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto">
  <name>Task 5: Add dual-write to recordSessionContinuity() and patchSessionContinuity() for session-tracker</name>
  <files>
    src/task-management/continuity/index.ts
  </files>
  <action>
    Add dual-write to continuity store write functions so lifecycle, pendingNotifications, and compactionCheckpoint fields also propagate to session-tracker child files.

    **Step 1: Add import:**
    ```typescript
    import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
    ```

    **Step 2: In `recordSessionContinuity()` (after `persistStore()` on line 377, before the return):**
    Add fire-and-forget dual-write:
    ```typescript
    // --- P41-B: Dual-write to session-tracker (fire-and-forget) ---
    if (record.sessionID.startsWith("ses_")) {
      try {
        const projectRoot = dirname(dirname(getContinuityFile())) // up from .hivemind/state/ to project root
        const childWriter = new ChildWriter({ projectRoot })
        void childWriter.createChildFile(record.sessionID, record.sessionID, {
          sessionID: record.sessionID,
          parentSessionID: record.sessionID,
          delegationDepth: 0,
          delegatedBy: { agentName: "", model: "", tool: "", description: "", subagentType: "" },
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          status: "active",
          mainAgent: { name: "", model: "" },
          turns: [],
          children: [],
          lifecycle: record.metadata.lifecycle,
          pendingNotifications: record.metadata.pendingNotifications?.length ? record.metadata.pendingNotifications : undefined,
          compactionCheckpoint: record.metadata.compactionCheckpoint,
        })
      } catch (err) {
        console.error(`[Harness] recordSessionContinuity dual-write error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    ```

    **Step 3: In `patchSessionContinuity()` (after `persistStore()` on line 420, before the return):**
    Add fire-and-forget dual-write for lifecycle-related patches:
    ```typescript
    // --- P41-B: Dual-write to session-tracker (fire-and-forget) ---
    if (sessionID.startsWith("ses_")) {
      const hasLifecycleFields = patch.lifecycle || patch.pendingNotifications || patch.compactionCheckpoint
      if (hasLifecycleFields) {
        try {
          const projectRoot = dirname(dirname(getContinuityFile()))
          const childWriter = new ChildWriter({ projectRoot })
          // Check if child file exists before writing (avoid orphan files)
          // Use parentSessionID from continuity record if available, else skip
          const continuityRecord = store.sessions[sessionID]
          const parentID = continuityRecord?.metadata.delegation?.rootID ?? sessionID
          const fileExists = await childWriter.childFileExists(parentID, sessionID)
          if (fileExists) {
            const patchRecord: Record<string, unknown> = { updated: new Date().toISOString() }
            if (patch.lifecycle) patchRecord.lifecycle = patch.lifecycle
            if (patch.pendingNotifications !== undefined) patchRecord.pendingNotifications = patch.pendingNotifications
            if (patch.compactionCheckpoint) patchRecord.compactionCheckpoint = patch.compactionCheckpoint
            // Write via createChildFile (mergeChildRecord handles merge internally)
            // We pass minimal data — only the fields we want updated
            void childWriter.createChildFile(parentID, sessionID, {
              sessionID,
              parentSessionID: parentID,
              delegationDepth: continuityRecord?.metadata.delegation?.depth ?? 0,
              delegatedBy: { agentName: "", model: "", tool: "", description: "", subagentType: "" },
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              status: "active",
              mainAgent: { name: "", model: "" },
              turns: [],
              children: [],
              lifecycle: patch.lifecycle,
              pendingNotifications: patch.pendingNotifications?.length ? patch.pendingNotifications : undefined,
              compactionCheckpoint: patch.compactionCheckpoint,
            })
          }
        } catch (err) {
          // Graceful skip: if child file doesn't exist or any error, data still flows through old continuity path
          console.warn(`[Harness] patchSessionContinuity dual-write: skipping session-tracker write for ${sessionID}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    }
    ```

    **IMPORTANT async concern:** `patchSessionContinuity()` is currently synchronous. The `childFileExists()` call is async. To avoid changing the function signature, we must NOT use `await`. Instead:
    - Remove the `await` — the `.then()` pattern wraps the async flow inside the fire-and-forget
    - Wrap the entire block in an immediately-invoked async expression:
      ```typescript
      void (async () => {
        // ... async code using childFileExists ...
      })()
      ```
    - The catch handles all errors gracefully

    So Step 3 should be wrapped in an IIAFE:
    ```typescript
    // --- P41-B: Dual-write to session-tracker (fire-and-forget) ---
    if (sessionID.startsWith("ses_")) {
      const hasLifecycleFields = patch.lifecycle || patch.pendingNotifications || patch.compactionCheckpoint
      if (hasLifecycleFields) {
        void (async () => {
          try {
            const projectRoot = dirname(dirname(getContinuityFile()))
            const childWriter = new ChildWriter({ projectRoot })
            const continuityRecord = store.sessions[sessionID]
            if (!continuityRecord) return
            const parentID = continuityRecord.metadata.delegation?.rootID ?? sessionID
            const fileExists = await childWriter.childFileExists(parentID, sessionID)
            if (!fileExists) return
            void childWriter.createChildFile(parentID, sessionID, {
              sessionID,
              parentSessionID: parentID,
              delegationDepth: continuityRecord.metadata.delegation?.depth ?? 0,
              delegatedBy: { agentName: "", model: "", tool: "", description: "", subagentType: "" },
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              status: "active",
              mainAgent: { name: "", model: "" },
              turns: [],
              children: [],
              lifecycle: patch.lifecycle,
              pendingNotifications: patch.pendingNotifications?.length ? patch.pendingNotifications : undefined,
              compactionCheckpoint: patch.compactionCheckpoint,
            })
          } catch (err) {
            console.warn(`[Harness] patchSessionContinuity dual-write: skipping session-tracker write for ${sessionID}: ${err instanceof Error ? err.message : String(err)}`)
          }
        })()
      }
    }
    ```

    **Constraints (per SPEC REQ-P41B-05):**
    - Graceful skip if child file doesn't exist — do NOT create orphan files
    - Old `persistStore()` path remains unchanged
    - Only lifecycle-related patches trigger dual-write (lifecycle, pendingNotifications, compactionCheckpoint)
    - The existing notification redirect via `patchSessionContinuity()` automatically covers `notification-handler.ts` and `plugin.ts` callers
    - `getContinuityFile()` is accessible — it's a module-scoped function already in the file
    - Add `import { dirname } from "node:path"` — already imported at line 3

    **Self-check:** Verify continuity/index.ts already imports `dirname` from `node:path` (line 3). Verify `npm run typecheck` passes.
  </action>
  <verify>
    <automated>grep -q "ChildWriter" src/task-management/continuity/index.ts && grep -q "createChildFile" src/task-management/continuity/index.ts && grep -q "hasLifecycleFields" src/task-management/continuity/index.ts && npm run typecheck</automated>
  </verify>
  <done>
    - `recordSessionContinuity()` dual-writes lifecycle/pendingNotifications/compactionCheckpoint to session-tracker
    - `patchSessionContinuity()` dual-writes lifecycle-related patches to session-tracker (child file exists check)
    - Both functions remain synchronous (async wrapped in IIAFE fire-and-forget)
    - Old `persistStore()` path unchanged
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| task-management/continuity → session-tracker | Writer code in continuity module now writes to session-tracker files. The import direction (task-management → features) is architecturally valid — no circular dependency. |
| governance-engine → governance/persistence | Governance evaluator now writes to standalone file instead of continuity store. One-way dependency. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-41B-01 | Tampering | ChildWriter/HierarchyManifestWriter constructors | mitigate | `safeSessionPath()` prevents path traversal in session IDs. Construct with derived `projectRoot` from existing continuity path. |
| T-41B-02 | DoS | Dual-write crash on Fire-and-forget errors | mitigate | Fire-and-forget is wrapped in try-catch — errors are logged but never thrown. Old sync path guarantees data delivery. |
| T-41B-03 | Tampering | Governance state file hijacking | mitigate | Atomic write pattern (temp → rename) with `randomUUID()` in temp filename prevents predictable temp file attacks. |
| T-41B-04 | Tampering | Missing session ID causes orphan writes | mitigate | Graceful skip with warning log — `persistDelegations()` skips records missing `childSessionId`/`parentSessionId`; `patchSessionContinuity()` skips if child file doesn't exist. |
| T-41B-SC | Tampering | npm/pip/cargo installs | mitigate | No external packages added — all types and utilities exist in the codebase. Phase gate passes without new dependencies. |
</threat_model>

<verification>
## Phase Gate
```bash
npm run typecheck && npm run test  # Both MUST pass
```

## Per-Requirement Verification

| Req | Command | Expected |
|-----|---------|----------|
| REQ-P41B-01 | `grep -n "pendingNotifications?" src/features/session-tracker/types.ts` | Line found with type `PendingNotification[]` |
| REQ-P41B-02 | `grep -nE "queueKey|terminalKind|recoveryGuarantee|executionMode|compactionCheckpoint|lifecycle" src/features/session-tracker/types.ts` | 6 fields present with correct types |
| REQ-P41B-03 | `test -f src/features/governance/persistence.ts && npm run typecheck` | File exists, typecheck passes |
| REQ-P41B-04 | `grep -q "createChildFile" src/task-management/continuity/delegation-persistence.ts` | Dual-write call present |
| REQ-P41B-05 | `grep -q "createChildFile" src/task-management/continuity/index.ts` | Dual-write call present in continuity |
| REQ-P41B-06 | `npm run typecheck && npm run test` | Both exit 0 |
| REQ-P41B-07 | `npm run test` | All tests pass |

## Wave 0 Gaps
- [ ] No new tests for governance persistence module (RECOMMENDED but not required per SPEC)
- [ ] No new tests for dual-write redirect behavior (RECOMMENDED but not required per SPEC)
</verification>

<success_criteria>
- [ ] `npm run typecheck` exits with code 0 (no type errors)
- [ ] `npm run test` exits with code 0 (no test failures)
- [ ] `ChildSessionRecord` has 7 new optional fields — no existing construction sites broken
- [ ] `src/features/governance/persistence.ts` created with 4 exported functions
- [ ] Governance evaluator writes to `writeGovernanceState()` instead of `recordGovernancePersistenceState()`
- [ ] `persistDelegations()` calls `ChildWriter.createChildFile()` as fire-and-forget dual-write
- [ ] `recordSessionContinuity()` dual-writes lifecycle/pendingNotifications/compactionCheckpoint to session-tracker
- [ ] `patchSessionContinuity()` dual-writes lifecycle-related patches to session-tracker
- [ ] Old writer paths remain fully functional (dual-write preserved)
- [ ] No `any` types introduced in modified files
- [ ] No circular module dependencies introduced
</success_criteria>

<output>
Create `.planning/phases/P41-state-cluster-redesign/P41-B-SUMMARY.md` when done.
</output>
