# P41-D Assumptions

> Evidence-based assumptions for the P41-D teardown phase. Each assumption is tagged with its evidence source and confidence level.

---

## A1: `readPersistedDelegations()` Callers Accept Empty Results After P41-C Reader Migration

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase grep]` Three callers: `delegation-status.ts` (line 429 — fallback), `manager-runtime.ts` (line 318 — recovery), `session-journal-export.ts` (line 84 — export). The `delegation-status.ts` caller already has a `deps.readPersisted` override: `deps.readPersisted ?? (deps.lifecycle ? () => [] : readPersistedDelegations)` — meaning it's explicitly designed to accept empty results when lifecycle is available. P41-C readers already prefer session-tracker, so these are fallback-only consumers. |
| **Risk** | LOW: `manager-runtime.ts` uses `readPersistedDelegations()` for recovery. If session-tracker is not ready at init time, delegations are lost. But P41-C already made session-tracker the preferred read path, and recovery reads were already best-effort. |

## A2: In-Memory Continuity Cache Is Sufficient for Current-Process Readers

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase analysis]` `getSessionContinuity()` calls `ensureStoreLoaded().sessions[sessionID]`. `ensureStoreLoaded()` returns cached store (from `storeCache` Map) or loads from disk. As long as `recordSessionContinuity()` and `patchSessionContinuity()` still update the in-memory cache (which they do — lines 377 and 448 still set `store.sessions[sessionID] = ...`), same-process reads continue to work. Only cross-process reads (restart) lose the in-memory cache — but P41-C already handles that via session-tracker enrichment. |
| **Risk** | LOW: On restart, continuity records are empty until a new `recordSessionContinuity()` call populates them. All P41-C readers (tool-guard-hooks, session-hooks, lifecycle-manager, notification-handler, plugin) now prefer session-tracker data and fall back gracefully. |

## A3: `continuity.test.ts` Heavily Asserts File Writes That Will No-Op

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase grep]` `tests/lib/continuity.test.ts` has ~500 lines testing: atomic write (temp file rename, line 75-81), legacy-to-canonical migration (line 230-276), rehydration after restart (line 162-171), corrupt file quarantine (line 48), flush on exit (line 510-514). These tests assert that `session-continuity.json` contains expected data after writes. With `persistStore()` becoming no-op, these assertions will fail. |
| **Risk** | MEDIUM: ~25% of tests in this file will need rewriting to assert in-memory behavior instead of file output. The rehydration test (A6) is most impacted — it tests that writing session A, then creating a new continuity module instance, returns both sessions A and B. With no-op writes, the new instance sees nothing. |

## A4: `delegation-manager.test.ts` Asserts delegations.json File Content

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase grep]` Tests at lines 1443 ("writes delegations to delegations.json with valid JSON array"), 1523 (reads back via `readPersistedDelegations()`), 1827 ("handles empty delegations.json"), 1876 ("handles missing delegations.json file"). With `readPersistedDelegations()` returning `[]`, these tests need updating. |
| **Risk** | MEDIUM: Tests that create delegations and verify them via file will need to verify via session-tracker or in-memory state instead. |

## A5: `delegate-task-e2e.test.ts` Already Passes No-Op `persistDelegations`

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase grep]` Line 26: `setupDelegationModules({ ... persistDelegations: () => undefined, ... })`. The E2E test already injects a no-op `persistDelegations`. This confirms the architecture already tolerates a no-op writer at the test level. |
| **Risk** | NONE: Test is already compatible. |

## A6: Deleted Files Must Be Cleaned Up via One-Shot Migration

| Property | Value |
|----------|-------|
| **Confidence** | MEDIUM |
| **Evidence** | `[ASSUMED]` The CP-ST-03 pattern in `plugin.ts` (lines 441-469) removes legacy `.hivemind/event-tracker/` via a sentinel file check at plugin startup. The same pattern should be reused for deleting `delegations.json` and `session-continuity.json`. However, the exact timing (plugin startup vs. the old writer code path) needs design — if the file is deleted before the old writer runs, the writer will create it again. |
| **Risk** | MEDIUM: The deletion must happen AFTER the writers are made no-ops, not before. Order: make writers no-op first in code, then migration deletes the file. If done in reverse, the file is recreated before the no-op takes effect. |

## A7: Dead Export Removal Has No Deprecation Period Needed

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase grep]` For each candidate: `getSessionToolProfile` (0 imports), `getSessionPromptParams` (0 imports), `getSessionContinuityMetadata` (0 imports), `patchSessionDelegationPacket` (0 imports), `getGovernancePersistenceState` (0 imports), `recordGovernancePersistenceState` (0 imports), `flushAllStores` (0 imports), `registerShutdownHandlers` (0 imports). Zero import sites across all `src/**/*.ts` files. |
| **Risk** | NONE: Dead exports removed. No downstream consumers. |
