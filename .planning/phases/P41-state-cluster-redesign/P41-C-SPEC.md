---
phase: P41-C
type: spec
upstream: P41-B-SUMMARY.md
downstream: P41-D
depends_on: [P41-B]
created: 2026-05-31
status: draft
authority: spec-driven
---

# Phase P41-C: Update Readers to Prefer Session-Tracker Instead of Old Files

**One-liner:** Update all 5 readers to prefer session-tracker data, falling back to old files — flip delegation merge priority, redirect session-view delegation reads, enrich continuity reads with child record data, and keep all old read paths functional for P41-D.

**Ambiguity Score:** LOW (all reader code paths verified in codebase before spec)

---

## Summary

P41-B added dual-write: old files + session-tracker. Now P41-C updates readers to prefer session-tracker data, falling back to old files. Five readers need changes with varying depth:

| Reader | File | Current Pattern | Change Depth |
|--------|------|----------------|--------------|
| Delegation status tool | `delegation-status.ts` | Already has session-tracker; merge order favors persisted file over tracker | SMALL — flip merge priority |
| Session view tool | `hivemind-session-view.ts` | Hardcoded `.hivemind/state/delegations.json` path | MEDIUM — add delegation reader |
| Notification replay | `plugin.ts` | `listSessionContinuity()` reads old file only | MEDIUM — enrich with session-tracker |
| Session hooks | `session-hooks.ts` | `getSessionContinuity()` reads old file only | SMALL — use enriched reader |
| Tool guard hooks | `tool-guard-hooks.ts` | `getSessionContinuity()` reads old file only | SMALL — use enriched reader |

**Key design decisions:**

1. **Continuity enrichment helper (NEW module):** Instead of modifying `getSessionContinuity()` / `listSessionContinuity()` (which are synchronous in-memory reads used by writers too), create a new async helper `enrichContinuityWithTracker()` in a new `continuity/continuity-reader.ts` module. It takes a `SessionContinuityRecord`, queries session-tracker for the child record, and merges `lifecycle`, `pendingNotifications`, `compactionCheckpoint` from the tracker — preferring tracker values over old-file values.

2. **Fire-and-forget enrichment:** The enrichment helper is best-effort — if session-tracker data isn't available (no child file, file not found), it silently returns the original continuity data. Never blocks.

3. **Delegation merge priority flip:** In `delegation-status.ts`, the `mergeAllDelegations()` array order changes from `[tracker, persisted, manager]` to `[persisted, tracker, manager]` so session-tracker data wins over old-file data.

4. **Old files remain untouched:** No old file paths are removed or made writable-only. Both `delegations.json` and `session-continuity.json` remain fully readable through their old APIs. P41-D handles deletion.

5. **No new external packages.** All types, utilities, and APIs used by the new reader code already exist in the codebase.

---

## Requirements

### REQ-P41C-01: Create `continuity/continuity-reader.ts` with enrichment helper

**Falsifiable criterion:** A new module `src/task-management/continuity/continuity-reader.ts` exists and exports `enrichContinuityWithTracker()` and `enrichContinuityListWithTracker()`.

**Acceptance criteria:**

1. **New file:** `src/task-management/continuity/continuity-reader.ts`
2. **Exports:**

   ```typescript
   export async function enrichContinuityWithTracker(
     record: SessionContinuityRecord,
     projectRoot?: string,
   ): Promise<SessionContinuityRecord>
   ```

   - Takes a `SessionContinuityRecord` (from the old continuity store) and an optional `projectRoot`
   - If `projectRoot` is provided, calls `resolveSessionFile(projectRoot, record.sessionID)` to check for a child record in session-tracker
   - If a child record exists and has `lifecycle`, `pendingNotifications`, or `compactionCheckpoint`, merges those fields into the returned record — **session-tracker fields take precedence**
   - If no child record or no `projectRoot`, returns the original record unchanged
   - Never throws — catches errors silently and returns the original record

   ```typescript
   export async function enrichContinuityListWithTracker(
     records: SessionContinuityRecord[],
     projectRoot?: string,
   ): Promise<SessionContinuityRecord[]>
   ```

   - Calls `enrichContinuityWithTracker()` for each record in parallel via `Promise.all()`
   - Returns the enriched list in the same order

3. **Import dependencies:**
   - `resolveSessionFile` from `../../tools/session/session-resolver.js`
   - `SessionContinuityRecord` type from `../../shared/types.js`
   - `existsSync` from `node:fs` (optional — for fast nonexistence check)
4. **Module boundaries:**
   - Does NOT import from `continuity/index.ts` (to avoid circular dependency — consumers call both independently)
   - Does NOT import from `features/session-tracker/persistence/` directly (uses `resolveSessionFile` as the public API)
   - Does NOT mutate the original record — returns a new merged object
5. **All existing typecheck and test suites pass**

**Merge precedence rule:**
```
return {
  ...continuityRecord,
  metadata: {
    ...continuityRecord.metadata,
    lifecycle: childRecord.lifecycle ?? continuityRecord.metadata.lifecycle,
    pendingNotifications: childRecord.pendingNotifications ?? continuityRecord.metadata.pendingNotifications,
    compactionCheckpoint: childRecord.compactionCheckpoint ?? continuityRecord.metadata.compactionCheckpoint,
  },
}
```
This means: session-tracker child record fields win over old continuity store fields. If the child record has `undefined` for any of these fields, the old value is preserved.

**Code template:**

```typescript
import { resolveSessionFile } from "../../tools/session/session-resolver.js"
import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { SessionContinuityRecord } from "../../shared/types.js"

/**
 * Enriches a continuity record with data from session-tracker child records.
 * Session-tracker fields take precedence over old-file fields.
 * Best-effort: returns original record if session-tracker data is unavailable.
 */
export async function enrichContinuityWithTracker(
  record: SessionContinuityRecord,
  projectRoot?: string,
): Promise<SessionContinuityRecord> {
  if (!projectRoot || !record.sessionID) return record

  try {
    const resolved = await resolveSessionFile(projectRoot, record.sessionID)
    if (!resolved || resolved.type !== "child" || !resolved.childRecord) return record

    const childRecord = resolved.childRecord
    if (!childRecord.lifecycle && !childRecord.pendingNotifications && !childRecord.compactionCheckpoint) {
      return record
    }

    return {
      ...record,
      metadata: {
        ...record.metadata,
        lifecycle: childRecord.lifecycle ?? record.metadata.lifecycle,
        pendingNotifications: childRecord.pendingNotifications ?? record.metadata.pendingNotifications,
        compactionCheckpoint: childRecord.compactionCheckpoint ?? record.metadata.compactionCheckpoint,
      },
    }
  } catch {
    return record
  }
}

/**
 * Enriches a list of continuity records with session-tracker data in parallel.
 */
export async function enrichContinuityListWithTracker(
  records: SessionContinuityRecord[],
  projectRoot?: string,
): Promise<SessionContinuityRecord[]> {
  if (!projectRoot || records.length === 0) return records
  return Promise.all(records.map((r) => enrichContinuityWithTracker(r, projectRoot)))
}
```

**Boundaries:**
- Do NOT modify `getSessionContinuity()`, `listSessionContinuity()`, or any other function in `continuity/index.ts`
- Do NOT import `continuity/index.ts` from the new file
- Do NOT add old-file-fallback logic in this helper — that's provided by the caller passing continuity records from the old store
- Do NOT handle delegation data — this helper is for continuity metadata only

---

### REQ-P41C-02: Flip merge priority in `delegation-status.ts` — session-tracker wins over old file

**Falsifiable criterion:** In `mergeAllDelegations()`, the record array order is `[persisted, trackerChildren, managerDelegations]` so session-tracker data takes precedence over old-file `delegations.json` data (but in-memory `DelegationManager` data still takes precedence over both).

**Acceptance criteria:**

1. **Line 400 change:** The `allRecords` array changes order from:
   ```typescript
   // Before: [...trackerChildren, ...persisted, ...managerDelegations]
   // After:  [...persisted, ...trackerChildren, ...managerDelegations]
   ```
   Because `byId.set()` replaces on last-write-wins, the later entries in the array take precedence.

2. **Merge rule (unchanged):** The existing `byId.set()` merge logic at lines 402-418 remains unchanged — it already spreads `...record, ...existing` (later record wins on primary fields, then specific sub-fields are merged individually).

3. **Single delegation lookup (lines 462-487):** The `getSessionTrackerDelegation()` call at line 468 is already preferred over `readPersisted()` — this remains correct. The merge at lines 473-484 (`if (delegation && trackerDel)`) is unchanged because it correctly prefers the in-memory delegation fields (`...delegation` spread after `...trackerDel`).

4. **`handleControl()` (lines 610-618):** The fallback chain already tries session-tracker — no change needed.

5. **No other changes** to `delegation-status.ts` beyond the array order flip.

**Boundaries:**
- Do NOT change the `Delegation`-to-`ChildSessionRecord` merge logic (lines 402-418)
- Do NOT change `getSessionTrackerDelegation()` or `getSessionTrackerChildren()` — they already read from session-tracker correctly
- Do NOT remove `readPersisted()` — that's P41-D
- The `LegacyPersistenceStatusReader` in `legacy-reader.ts` is NOT modified by this phase

---

### REQ-P41C-03: Redirect `hivemind-session-view.ts` delegation reader to session-tracker

**Falsifiable criterion:** The `readDelegationsForSession()` function in `hivemind-session-view.ts` first attempts to read delegation data from session-tracker child records + hierarchy manifest, and only falls back to the hardcoded `delegations.json` path if session-tracker returns no data.

**Acceptance criteria:**

1. **New import added:** Import `resolveSessionFile` from `../session/session-resolver.js` (if not already imported — it's at line 16)

2. **Modified `readDelegationsForSession()`:** The function body changes to prefer session-tracker data:
   ```typescript
   async function readDelegationsForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown>[]> {
     // 1. Try session-tracker first — resolve the session and read child delegations
     try {
       const resolved = await resolveSessionFile(projectRoot, sessionId)
       if (resolved && resolved.type === "main") {
         // For main sessions, read the hierarchy manifest to find all children
         const manifestRaw = await readFile(resolved.manifestPath, "utf-8")
         const manifest = JSON.parse(manifestRaw) as { children?: Record<string, Record<string, unknown>> }
         if (manifest.children) {
           const childDelegations = Object.entries(manifest.children)
             .filter(([, childMeta]) => (childMeta as Record<string, unknown>).parentSessionID === sessionId)
             .map(([id, meta]) => ({ id, childSessionId: id, ...(meta as Record<string, unknown>) }))
             .slice(0, 20)
           if (childDelegations.length > 0) return childDelegations
         }
       } else if (resolved && resolved.type === "child") {
         // For child sessions, this IS a delegation — return it
         if (resolved.childRecord) {
           return [resolved.childRecord as unknown as Record<string, unknown>]
         }
       }
     } catch { /* fall through to legacy */ }

     // 2. Fall back to old delegations.json path
     try {
       const delegationsPath = resolve(projectRoot, ".hivemind", "state", "delegations.json")
       const raw = await readFile(delegationsPath, "utf-8")
       const allDelegations = JSON.parse(raw) as Array<Record<string, unknown>>
       return allDelegations.filter((d) =>
         (d as Record<string, unknown>).childSessionId === sessionId ||
         (d as Record<string, unknown>).id === sessionId
       ).slice(0, 20)
     } catch { return [] }
   }
   ```

3. **The `buildUnifiedView()` function at lines 96-131:**
   - The delegations section now receives data from session-tracker (preferred) or the old file (fallback)
   - No structural change to `buildUnifiedView()` output — same shape, potentially richer data

**Boundaries:**
- Do NOT remove the old `delegations.json` fallback path — it stays until P41-D
- Do NOT change `readSessionData()` or `readTrajectoryForSession()` — they're already session-tracker-aware or not part of this migration
- Do NOT change the `buildUnifiedView()` output shape — only the data source changes

---

### REQ-P41C-04: Update `plugin.ts` notification replay to enrich continuity with session-tracker data

**Falsifiable criterion:** The `replayPendingDelegationNotifications()` function in `plugin.ts` enriches its continuity records with session-tracker `pendingNotifications` data before processing.

**Acceptance criteria:**

1. **Import added:**
   ```typescript
   import { enrichContinuityListWithTracker } from "./task-management/continuity/continuity-reader.js"
   ```

2. **Modified `replayPendingDelegationNotifications()` (line 629-647):**
   
   After `const allSessions = listSessionContinuity()` at line 630, add enrichment:
   ```typescript
   const enrichedSessions = await enrichContinuityListWithTracker(
     Object.values(allSessions),
     projectDirectory,
   )
   ```
   Then iterate over `enrichedSessions` instead of `Object.values(allSessions)`.

   The `projectDirectory` variable is available in the calling scope (line 355: `const projectDirectory = directory ?? process.cwd()`). Since `replayPendingDelegationNotifications()` is called at line 414 with `client` only, it needs to accept `projectDirectory` as a second parameter:

   ```typescript
   export async function replayPendingDelegationNotifications(
     client: OpenCodeClient,
     projectDirectory?: string,  // NEW parameter
   ): Promise<void>
   ```

   Update the call site at line 414:
   ```typescript
   void replayPendingDelegationNotifications(client, projectDirectory)
   ```

3. **Function body (updated loop):**
   ```typescript
   const allSessions = listSessionContinuity()
   const enrichedSessions = projectDirectory
     ? await enrichContinuityListWithTracker(Object.values(allSessions), projectDirectory)
     : Object.values(allSessions)
   
   for (const record of enrichedSessions) {
     const pending = record.metadata.pendingNotifications ?? []
     // ... rest of the loop unchanged
   }
   ```

**Boundaries:**
- Do NOT change the notification replay logic — only the data source is enriched
- Do NOT modify `patchSessionContinuity()` calls in the replay — they still clear via the old path
- The `projectDirectory` parameter is optional for backward compatibility (tests may call without it)

---

### REQ-P41C-05: Update `session-hooks.ts` to use session-tracker-enriched continuity data

**Falsifiable criterion:** The `createSessionHooks()` function in `session-hooks.ts` receives `projectDirectory` via `HookDependencies` and enriches `getSessionContinuity()` calls with session-tracker data via `enrichContinuityWithTracker()`.

**Acceptance criteria:**

1. **`HookDependencies` type extended:** Add optional `projectDirectory?: string` to the `HookDependencies` interface in `src/hooks/types.ts`
2. **deps passed from plugin.ts:** The `deps` object constructed at `plugin.ts:473` includes `projectDirectory` — add it to the spread

2. **Import added:**
   ```typescript
   import { enrichContinuityWithTracker } from "../../task-management/continuity/continuity-reader.js"
   ```

3. **Event hook (line 151):** The `const continuity = getSessionContinuity(sessionID)` call becomes:
   ```typescript
   const continuity = await enrichContinuityWithTracker(getSessionContinuity(sessionID) ?? fallbackRecord, deps.projectDirectory)
   ```
   
   Wait — `getSessionContinuity()` can return `undefined`. The enrichment helper expects a `SessionContinuityRecord`. So the pattern is:
   
   ```typescript
   const rawContinuity = getSessionContinuity(sessionID)
   if (!rawContinuity) return
   const continuity = await enrichContinuityWithTracker(rawContinuity, deps.projectDirectory)
   ```
   
   This applies at:
   - **Line 151:** `const continuity = getSessionContinuity(sessionID)` (event hook — auto-loop decisions)
   - **Line 308:** `const continuity = getSessionContinuity(sessionID)` (compacting hook — context injection)

4. **All existing typecheck and test suites pass**

**Boundaries:**
- Do NOT change the auto-loop decision logic — only the continuity data used for decisions is enriched
- Do NOT make `getSessionContinuity()` itself async — enrichment is a separate step
- The enrichment is fire-and-forget best-effort via the helper's internal try/catch

---

### REQ-P41C-06: Update `tool-guard-hooks.ts` to use session-tracker-enriched continuity data

**Falsifiable criterion:** The `createToolGuardHooks()` function in `tool-guard-hooks.ts` receives `projectRoot` through its deps and enriches `getSessionContinuity()` calls with session-tracker data.

**Acceptance criteria:**

1. **`ToolGuardDependencies` type extended:** Add optional `projectRoot?: string` to the `ToolGuardDependencies` interface at line 28-33:

2. **Import added:**
   ```typescript
   import { enrichContinuityWithTracker } from "../../task-management/continuity/continuity-reader.js"
   ```

3. **`tool.execute.after` hook (line 193):** The `const continuity = getSessionContinuity(sessionID)` call becomes:
   ```typescript
   const rawContinuity = getSessionContinuity(sessionID)
   const continuity = rawContinuity
     ? await enrichContinuityWithTracker(rawContinuity, deps.projectRoot)
     : undefined
   ```

4. **Wire `projectRoot` in plugin.ts (line 501):** The `createToolGuardHooks()` call gets `projectRoot`:
   ```typescript
   const toolGuardHooks = createToolGuardHooks({
     stateManager: taskState,
     lifecycleManager,
     runtimePolicy,
     hivemindConfig,
     projectRoot: projectDirectory,  // NEW
   })
   ```

5. **All existing typecheck and test suites pass**

**Boundaries:**
- Do NOT change the metadata injection logic — only the continuity data injected into `output.metadata._harness.continuity` is enriched
- Do NOT modify `evaluateGovernance()` or governance logic — that's not continuity data
- The `projectRoot` parameter is optional — existing callers that don't pass it fall back to old-file reads

---

### REQ-P41C-07: All existing tests pass, typecheck clean

**Falsifiable criterion:** `npm run typecheck` completes with zero errors and `npm run test` completes with zero failures.

**Acceptance criteria:**
1. `npm run typecheck` exits with code 0
2. `npm run test` exits with code 0
3. No new `any` types introduced in modified files
4. No new lint warnings in modified files

**Boundaries:**
- This requirement gates the entire phase
- The enrichment pattern (fire-and-forget, never throws) ensures tests that don't have session-tracker data still pass
- Tests that mock `getSessionContinuity()` continue to work because the enrichment is a separate wrapper call

---

## Files Modified

| File | Change | Risk |
|------|--------|------|
| `src/task-management/continuity/continuity-reader.ts` (NEW) | Create enrichment helper module | LOW — new file, independent |
| `src/tools/delegation/delegation-status.ts` | Flip merge order in `mergeAllDelegations()` | LOW — array order change only |
| `src/tools/hivemind/hivemind-session-view.ts` | Redirect `readDelegationsForSession()` to session-tracker first | LOW — additive fallback pattern |
| `src/plugin.ts` | Enrich notification replay with session-tracker data; pass `projectDirectory` to `replayPendingDelegationNotifications()` | LOW — additive enrichment call |
| `src/hooks/lifecycle/session-hooks.ts` | Enrich continuity reads in event/compacting hooks | LOW — enrichment wrapper around existing calls |
| `src/hooks/guards/tool-guard-hooks.ts` | Add `projectRoot` to deps, enrich continuity read in `tool.execute.after` | LOW — additive field + enrichment wrapper |
| `src/hooks/types.ts` | Add `projectDirectory?: string` field to `HookDependencies` interface | LOW — additive optional field |

## File Structure Changes

```
src/
└── task-management/
    └── continuity/
        ├── index.ts                  # UNCHANGED
        ├── delegation-persistence.ts # UNCHANGED
        ├── store-cache.ts            # UNCHANGED
        └── continuity-reader.ts      # NEW: enrichment helper
```

---

## Dependencies

- **No external packages.** All types and utilities already exist in the codebase.
- **Depends on:** P41-B complete (session-tracker child records have lifecycle/pendingNotifications/compactionCheckpoint fields)
- **Depends on:** `resolveSessionFile()` existing (created in earlier phases) — reads child records from disk
- **Unlocks:** P41-D (old file deletion — readers no longer depend on `delegations.json` or `session-continuity.json` for correctness)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Enrichment adds async overhead to synchronous hook paths | LOW | MEDIUM | Enrichment is fire-and-forget (best-effort, never awaited on hot path in tool-guard-hooks.ts after hook runs). The `continuity-reader` helper is only called in async contexts (hooks are already async). |
| `resolveSessionFile()` reads many manifest files, slowing down the tool.execute.after hook | LOW | LOW | `resolveSessionFile()` reads at most one manifest + one child file. The `enrichContinuityWithTracker()` helper returns early if no child record found (fast path). |
| HookDependencies lacks `projectRoot` | LOW | HIGH | If `HookDependencies` type doesn't have `projectRoot`, add it. The `deps` bundle in `plugin.ts` passes `projectDirectory` to `createSessionHooks()`. |
| Tests mock `getSessionContinuity()` and expect specific return values, but enrichment enriches with session-tracker data | LOW | LOW | Tests either don't have session-tracker data (returns original) or mock `resolveSessionFile()` too (enrichment doesn't run). The enrichment helper is testable independently. |
| Old file deletion in P41-D will break if any reader still has a hard dependency | LOW | HIGH | This phase ensures all 5 readers prefer session-tracker — P41-D can safely delete old files. If a missed reader exists, tests will fail. |

---

## Verification Protocol

```
Phase gate: npm run typecheck && npm run test  # Both must pass

Per-requirement verification:
  REQ-P41C-01: test -f src/task-management/continuity/continuity-reader.ts
               && grep -q "enrichContinuityWithTracker" src/task-management/continuity/continuity-reader.ts
               && grep -q "enrichContinuityListWithTracker" src/task-management/continuity/continuity-reader.ts

  REQ-P41C-02: grep -n "trackerChildren" src/tools/delegation/delegation-status.ts
               # Verify trackerChildren appears AFTER persisted in allRecords array (line ~400)

  REQ-P41C-03: grep -n "resolveSessionFile" src/tools/hivemind/hivemind-session-view.ts
               grep -n "session-tracker" src/tools/hivemind/hivemind-session-view.ts
               # Verify delegations.json path remains as fallback

  REQ-P41C-04: grep -q "enrichContinuityListWithTracker" src/plugin.ts
               grep -q "projectDirectory" src/plugin.ts  # Should see projectDirectory at replay call site

  REQ-P41C-05: grep -q "enrichContinuityWithTracker" src/hooks/lifecycle/session-hooks.ts

  REQ-P41C-06: grep -q "enrichContinuityWithTracker" src/hooks/guards/tool-guard-hooks.ts
               grep -q "projectRoot" src/hooks/guards/tool-guard-hooks.ts

  REQ-P41C-07: npm run typecheck && npm run test
```

---

## Assumptions Log

| # | Assumption | Section | Evidence | Risk if Wrong |
|---|-----------|---------|----------|---------------|
| A1 | `resolveSessionFile()` resolves child records for `ses_*` sessions after P41-B dual-write | ALL | P41-B created child files via `ChildWriter.createChildFile()`. `resolveSessionFile()` reads them from disk at `safeSessionPath()`. | Enrichment returns original continuity data unmodified — no breakage, just no enrichment |
| A2 | `HookDependencies` type has or can accept `projectRoot` | REQ-P41C-05 | `HookDependencies` is defined at `src/hooks/types.ts`. It currently carries `client`, `lifecycleManager`, `stateManager`, etc. `projectDirectory` may need to be added. | BUILD BREAK if the type is strict. Fixed by adding the field. |
| A3 | Enrichment never blocks the hook return | REQ-P41C-04, REQ-P41C-05, REQ-P41C-06 | The `enrichContinuityWithTracker()` helper has a top-level try-catch — any error returns the original record. | No data loss — old continuity data is always available as fallback |
| A4 | Flipping merge order in `mergeAllDelegations()` doesn't lose data | REQ-P41C-02 | The merge logic at lines 402-418 spreads `...record, ...existing` — fields from `existing` (later in array) win. Merged sub-fields (`messageCount`, `toolCallCount`, etc.) use `??` to prefer non-null values. | Session-tracker fields could overwrite more-detailed manager fields if the tracker data is stale. Mitigation: manager data is last in the array and wins on the `...existing` spread. |
| A5 | `listSessionContinuity()` returns all sessions including those only in session-tracker | REQ-P41C-04 | `listSessionContinuity()` reads from the in-memory store cache which is hydrated from `session-continuity.json`. After P41-B dual-write, continuity records are still written to the old file via `persistStore()`. | Sessions created solely through the session-tracker path (if any) won't appear in `listSessionContinuity()`. The enrichment only enriches existing records — it doesn't add new ones. Any session that has a continuity file entry will appear. |

---

## Open Questions

**None.** All decisions resolved in P41-A and P41-B.

---

## State of the Art

| Old Approach | New Approach | Phase |
|-------------|-------------|-------|
| `delegation-status.ts`: `mergeAllDelegations()` prefers persisted over tracker | `mergeAllDelegations()` prefers tracker over persisted | P41-C |
| `hivemind-session-view.ts`: `readDelegationsForSession()` reads delegations.json only | `readDelegationsForSession()` reads session-tracker first, falls back to delegations.json | P41-C |
| `plugin.ts`: `replayPendingDelegationNotifications()` reads continuity store only | `replayPendingDelegationNotifications()` enriches with session-tracker pendingNotifications | P41-C |
| `session-hooks.ts`: `getSessionContinuity()` used directly | `getSessionContinuity()` enriched with session-tracker lifecycle/pendingNotifications | P41-C |
| `tool-guard-hooks.ts`: `getSessionContinuity()` used directly | `getSessionContinuity()` enriched with session-tracker lifecycle/pendingNotifications | P41-C |
| Old files fully authoritative for reads | Old files are fallback; session-tracker is preferred | P41-C |

---

## Security Domain

**Applicable ASVS categories:** None directly. This phase adds no new authentication, input validation, or network surfaces. The new `continuity-reader.ts` module reads existing local filesystem paths through the existing `resolveSessionFile()` API, which already enforces `safeSessionPath()` protection against path traversal.

**Threat consideration:** The enrichment helper reads session-tracker child files from disk. Path construction goes through `resolveSessionFile()` → `safeSessionPath()`, which rejects session IDs with `..` or path separators. No new attack surface.
