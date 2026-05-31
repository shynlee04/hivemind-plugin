---
phase: P41-D
plan: 02
status: planned
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/task-management/continuity/index.ts
autonomous: true
requirements:
  - REQ-P41D-02
  - REQ-P41D-03
must_haves:
  truths:
    - "persistStore() is a no-op — no writeStoreToDisk() call, no atomic write"
    - "flushAllStores() is a no-op — no calls to writeStoreToDisk()"
    - "registerShutdownHandlers() is a no-op — no process exit handlers"
    - "In-memory storeCache updates from recordSessionContinuity(), patchSessionContinuity(), deleteSessionContinuity() remain functional"
    - "Session-tracker dual-write sections in recordSessionContinuity() and patchSessionContinuity() remain active"
    - "8 dead exports removed: getSessionToolProfile, getSessionPromptParams, getSessionContinuityMetadata, patchSessionDelegationPacket, getGovernancePersistenceState, recordGovernancePersistenceState, flushAllStores, registerShutdownHandlers"
    - "Module-level shutdown handler registration (line 574-576) removed"
    - "6 remaining exports compile without error: getCanonicalStateDir, getContinuityStoragePath, getSessionContinuity, listSessionContinuity, recordSessionContinuity, patchSessionContinuity"
  artifacts:
    - path: src/task-management/continuity/index.ts
      provides: "No-op persistStore + removed dead exports"
      min_lines: 340
  key_links:
    - from: persistStore
      to: (no-op)
      via: "no writeStoreToDisk call — in-memory store updates are the caller's responsibility"
    - from: recordSessionContinuity
      to: ChildWriter.createChildFile
      via: "session-tracker dual-write (lines 380-405 kept)"
      pattern: "childWriter.createChildFile"
---

<objective>
Make `persistStore()`, `flushAllStores()`, and `registerShutdownHandlers()` no-ops in `continuity/index.ts`. Remove 8 dead exported functions. Keep in-memory store cache + session-tracker dual-write fully active.

**Purpose:** Complete the teardown of file-based session-continuity.json persistence. After P41-C redirected all 5 readers to prefer session-tracker, the old disk persistence is no longer needed.
**Output:** `src/task-management/continuity/index.ts` — no-op writers, 8 dead exports removed, module-level shutdown registration removed.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P41-state-cluster-redesign/P41-D-SPEC.md
@.planning/phases/P41-state-cluster-redesign/P41-D-RESEARCH.md
@sandbox-/Users/apple/hivemind-plugin-private/src/task-management/continuity/index.ts

**Live exports confirmed by codebase grep (src/ directory):**
Stay (6):
- `getCanonicalStateDir` — imported by `governance/persistence.ts`
- `getContinuityStoragePath` — imported by `tool-guard-hooks.ts`, `session-hooks.ts`, `workflow-persistence.ts`
- `getSessionContinuity` — imported by `plugin.ts`, `tool-guard-hooks.ts`, `session-hooks.ts`, `lifecycle/index.ts`, `notification-handler.ts`
- `listSessionContinuity` — imported by `plugin.ts`, `lifecycle/index.ts`, `session-journal-export.ts`
- `recordSessionContinuity` — imported by `plugin.ts`, `notification-handler.ts`
- `patchSessionContinuity` — imported by `plugin.ts`, `lifecycle/index.ts`, `notification-handler.ts`

Removed (8 — zero external import sites, confirmed by grep):
- `getSessionToolProfile` — 0 external callers
- `getSessionPromptParams` — 0 external callers
- `getSessionContinuityMetadata` — 0 external callers
- `patchSessionDelegationPacket` — 0 external callers
- `getGovernancePersistenceState` — 0 external callers
- `recordGovernancePersistenceState` — 0 external callers (already deprecated)
- `flushAllStores` — only called by `registerShutdownHandlers()` (itself dead)
- `registerShutdownHandlers` — only called from module level (line 575)
</context>

<tasks>

<task type="auto">
  <name>Task 1: No-op persistStore(), flushAllStores(), registerShutdownHandlers()</name>
  <files>src/task-management/continuity/index.ts</files>
  <action>
    Make three functions no-ops while keeping all related infrastructure intact:

    **`persistStore()` (lines 325-341):**
    Replace body with a no-op:
    ```typescript
    function persistStore(_projectRoot?: string): void {
      // REQ-P41D-02: No disk write. In-memory store is kept for current-process reads.
      // Session-tracker dual-write is handled by recordSessionContinuity/patchSessionContinuity.
    }
    ```

    **`flushAllStores()` (lines 546-554):**
    Replace body with a no-op:
    ```typescript
    export function flushAllStores(): void {
      // REQ-P41D-02: No flush to disk. In-memory cache is sufficient for current-process reads.
    }
    ```
    NOTE: This function will be fully removed (export removed) in Task 2 below. For this task, just no-op the body.

    **`registerShutdownHandlers()` (lines 557-572):**
    Replace body with a no-op:
    ```typescript
    export function registerShutdownHandlers(): void {
      // REQ-P41D-02: No process-exit flush. Session-tracker handles cross-restart persistence.
    }
    ```
    NOTE: This function will be fully removed (export removed) in Task 2 below. For this task, just no-op the body.

    **Module-level shutdown registration (lines 574-576):**
    REMOVE this block entirely:
    ```typescript
    if (typeof process !== "undefined" && !process.env.VITEST) {
      registerShutdownHandlers()
    }
    ```

    **What to KEEP (NO changes):**
    - `ensureStoreLoaded()` — still loads from disk for backward compat (returns emptyStore when file is gone after migration)
    - `loadStoreFromDisk()` — still reads existing files if not yet migrated
    - `writeStoreToDisk()` — keep the function (it's `function` not `export function` — used internally by the old persistStore). Actually, after no-op `persistStore()`, `writeStoreToDisk()` has zero callers. But removing it is optional — keep it to minimize diff for now (it's a private `function`, not exported).
    - `store-cache.ts` imports (`getStoreCache`, `setStoreCache`, `getAllStoreCaches`) — keep, `ensureStoreLoaded()` still uses them
    - `ensureStoreLoaded()` — keep, `recordSessionContinuity()`, `patchSessionContinuity()`, `deleteSessionContinuity()` call it for in-memory updates
    - `recordSessionContinuity()` lines 368-408 — keep all in-memory + session-tracker dual-write
    - `patchSessionContinuity()` lines 410-489 — keep all in-memory + session-tracker dual-write
    - `deleteSessionContinuity()` lines 513-521 — keep in-memory deletion + persistStore call (persistStore is now no-op, fine)
    - The `getCachedConfig` import (line 7) — only used by `persistStore()` for atomic_commit gate. Since persistStore is no-op, this import can be REMOVED.
    - All `node:fs` imports (`existsSync`, `mkdirSync`, `readFileSync`, `renameSync`, `writeFileSync`) — only used by `loadStoreFromDisk()` (read) and `writeStoreToDisk()` (write). `loadStoreFromDisk()` still needs file reads for backward compat, `writeStoreToDisk()` kept as private function. So KEEP fs imports.

    **Remove these imports since persistStore no longer needs config:**
    - `import { getCachedConfig } from "../../config/subscriber.js"` — ONLY used by persistStore. Remove it.

    **Ordering requirement:** No-op first, then verify module-level code compiles. The `persistStore()` call in `recordSessionContinuity()` line 378 is fine — the function is now a no-op. Same for lines 449 and 520.
  </action>
  <verify>
    <automated>npm run typecheck 2>&1</automated>
  </verify>
  <done>
    - `persistStore()` body is empty (no writeStoreToDisk call, no atomic_commit gate, no getCachedConfig)
    - `flushAllStores()` body is empty
    - `registerShutdownHandlers()` body is empty
    - Module-level shutdown handler registration removed (lines 574-576)
    - `getCachedConfig` import removed
    - Typecheck passes
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove 8 dead exported functions</name>
  <files>src/task-management/continuity/index.ts</files>
  <action>
    Remove 8 exported functions that have zero external importers (confirmed by codebase grep of `src/` and `tests/`):

    1. **`getSessionToolProfile()`** (lines 356-358) — Remove entire function.
    2. **`getSessionPromptParams()`** (lines 360-362) — Remove entire function.
    3. **`getSessionContinuityMetadata()`** (lines 364-366) — Remove entire function.
    4. **`patchSessionDelegationPacket()`** (lines 491-511) — Remove entire function. Also remove the `DelegationPacket` type import from line 18 if it's only used here (check: `DelegationPacket` is also used by `cloneDelegationPacket` which is used by `patchSessionContinuity` — so KEEP the import).
    5. **`getGovernancePersistenceState()`** (lines 527-529) — Remove entire function. Also check: `GovernancePersistenceState` import — used by `recordGovernancePersistenceState` too, which is also being removed. Check if `isGovernanceState` and `cloneGovernanceState` are still needed — `loadStoreFromDisk()` (line 297) calls `isGovernanceState` and `cloneGovernanceState`. So KEEP those private helpers.
    6. **`recordGovernancePersistenceState()`** (lines 531-544) — Remove entire function.
    7. **`flushAllStores()`** (lines 546-554) — Since we no-op'd the body in Task 1, now remove the entire `export function flushAllStores()` declaration. Also remove `getAllStoreCaches` from the store-cache import (line 8) — check if used elsewhere. `getAllStoreCaches` is ONLY called by `flushAllStores()`. So remove it from the import.
    8. **`registerShutdownHandlers()`** (lines 557-572) — Since we no-op'd the body in Task 1, now remove the entire `export function registerShutdownHandlers()` declaration.

    **Import clean-up:**
    - `store-cache.ts` import (line 8): Remove `getAllStoreCaches` from destructured import. Keep `getStoreCache` and `setStoreCache` (used by `ensureStoreLoaded()`).
    - `DelegationPacket` type (line 18): check if still used — yes, by `cloneDelegationPacket()` referenced in `patchSessionContinuity()`. KEEP.
    - `GovernancePersistenceState` (line 15): check if still used — `isGovernanceState` and `cloneGovernanceState` are used by `loadStoreFromDisk()`. KEEP.

    **After removal, verify these 6 exports remain at the module's public interface:**
    - `getCanonicalStateDir`
    - `getContinuityStoragePath`
    - `getSessionContinuity`
    - `listSessionContinuity`
    - `recordSessionContinuity`
    - `patchSessionContinuity`

    Also verify `deleteSessionContinuity` (line 513) — it's NOT exported (no `export` keyword before `function`). It's internal only. That's correct per the SPEC — it stays as-is.

    **What to avoid:**
    - Do NOT remove private helper functions that are still used: `cloneContinuityRecord`, `normalizeContinuityRecord`, `ensureStoreLoaded`, `loadStoreFromDisk`, `writeStoreToDisk`, `emptyStore`, `isParsedStore`, `cloneDelegationMeta`, `cloneDelegationPacket`, `cloneGovernanceState`, `isGovernanceState`, `quarantineCorruptFile`, `resolveContinuityFilePath`, `resolveLegacyFilePath`, etc.
    - Do NOT remove `getContinuityFile()` private helper — used by `getContinuityStoragePath()`.
  </action>
  <verify>
    <automated>npm run typecheck 2>&1</automated>
  </verify>
  <done>
    - 8 exported functions removed from continuity/index.ts
    - `getAllStoreCaches` removed from store-cache import
    - Remaining 6 exports compile without error
    - All private helpers that are still referenced remain
    - Typecheck passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| continuity/index.ts public API | 8 dead exports removed — external callers cannot import what no longer exists. 0 external callers confirmed by grep. |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P41D-03 | Tampering | persistStore no-op | mitigate | In-memory store updates + session-tracker dual-write remain active. Only filesystem writes removed. |
| T-P41D-04 | Elevation of Privilege | Dead export removal | accept | 0 external callers verified via grep. Removing functions with no callers has no privilege impact. |
| T-P41D-05 | Denial of Service | Module-level shutdown removed | accept | `registerShutdownHandlers()` was best-effort process cleanup. Session-tracker handles cross-restart persistence. In-memory data for current process is unaffected. |
| T-P41D-SC | Tampering | npm/pip/cargo installs | mitigate | No packages installed in this phase |
</threat_model>

<verification>
- Typecheck: `npm run typecheck` passes
- Continuity module still exports 6 functions: `getCanonicalStateDir`, `getContinuityStoragePath`, `getSessionContinuity`, `listSessionContinuity`, `recordSessionContinuity`, `patchSessionContinuity`
</verification>

<success_criteria>
- `persistStore()`, `flushAllStores()`, `registerShutdownHandlers()` are no-ops
- Module-level shutdown handler registration removed
- `getCachedConfig` import removed
- 8 dead exported functions removed from continuity/index.ts
- `getAllStoreCaches` removed from store-cache import
- 6 remaining exports compile without error
- In-memory store updates + session-tracker dual-write remain active
- Typecheck passes
</success_criteria>

<output>
Create `.planning/phases/P41-state-cluster-redesign/P41-D-02-SUMMARY.md` when done
</output>
