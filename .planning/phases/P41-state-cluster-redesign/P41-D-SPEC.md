# P41-D: Delete Old Files, Make Old Writers No-Ops, Remove Dead Code

**Phase:** P41-D
**Replaces:** `.hivemind/state/delegations.json` + `session-continuity.json` with no-ops after P41-B (dual-write) and P41-C (readers prefer session-tracker).

---

## REQ-P41D-01: `persistDelegations()` Becomes No-Op, `delegations.json` Deleted

**Rationale:** P41-B wrote all delegation data to session-tracker via `ChildWriter` + `HierarchyManifestWriter`. The `delegations.json` file is no longer the canonical persistence target.

**Acceptance criteria:**
- `persistDelegations()` in `delegation-persistence.ts` skips all `delegations.json` file I/O (read-merge-write loop, atomic write, quarantine logic).
- The session-tracker dual-write section (lines 172-206) remains active — delegation records are still written to session-tracker.
- `persistDelegations()` is a fire-and-forget no-op for the file path: no mkdirSync, no writeFileSync, no renameSync for delegations.json.
- `readPersistedDelegations()` returns `[]` (empty array) — session-tracker is canonical for delegation reads.
- Existing calls to `readPersistedDelegations()` in `delegation-status.ts`, `manager-runtime.ts`, `session-journal-export.ts` continue to compile but receive empty results.
- The file `.hivemind/state/delegations.json` is deleted at plugin startup (one-shot migration, similar to CP-ST-03 event-tracker migration).

**Breaking change detection:** Typecheck + 2963+ tests pass. Tests that assert delegations.json file content or file existence will fail and need updating.

---

## REQ-P41D-02: `persistStore()` Becomes No-Op, `session-continuity.json` Deleted

**Rationale:** P41-C made all 5 continuity readers prefer session-tracker data via `enrichContinuityWithTracker()`. The `session-continuity.json` file is no longer the canonical persistence target.

**Acceptance criteria:**
- `persistStore()` in `continuity/index.ts` becomes a no-op — no `writeStoreToDisk()` call, no atomic write.
- `flushAllStores()` becomes a no-op — no calls to `writeStoreToDisk()`.
- `registerShutdownHandlers()` becomes a no-op — no process exit flush.
- `loadStoreFromDisk()` still loads from disk (for backward compat with existing files), but `persistStore()` no longer writes.
- In-memory store (`storeCache`) updates from `recordSessionContinuity()`, `patchSessionContinuity()`, `deleteSessionContinuity()` remain functional for current-process reads.
- The session-tracker dual-write sections in `recordSessionContinuity()` (lines 380-405) and `patchSessionContinuity()` (lines 451-486) remain active.
- The file `.hivemind/state/session-continuity.json` is deleted at plugin startup (one-shot migration).
- Readers (`getSessionContinuity()`, `listSessionContinuity()`) still return in-memory data for the current process — they are NOT made into no-ops.

**Breaking change detection:** Typecheck + 2963+ tests pass. Tests that assert session-continuity.json file content will fail and need updating.

---

## REQ-P41D-03: Dead Exported Functions Removed / Warnings Added

**Rationale:** Several functions from `continuity/index.ts` have zero callers outside their module. Keeping them in the public API adds confusion and dead code that must be maintained.

**Acceptance criteria:**

Functions REMOVED from exports (never imported outside continuity/index.ts):
- `getSessionToolProfile()` — 0 external callers
- `getSessionPromptParams()` — 0 external callers
- `getSessionContinuityMetadata()` — 0 external callers
- `patchSessionDelegationPacket()` — 0 external callers
- `getGovernancePersistenceState()` — 0 external callers
- `recordGovernancePersistenceState()` — 0 external callers (already deprecated no-op)
- `flushAllStores()` — only called by `registerShutdownHandlers()` (itself dead)
- `registerShutdownHandlers()` — only called module-level (no external importers)

Functions that remain exported (still in use):
- `getCanonicalStateDir()` — used by `governance/persistence.ts`
- `getContinuityStoragePath()` — used by `tool-guard-hooks.ts`, `session-hooks.ts`, `workflow-persistence.ts`
- `getSessionContinuity()` — used by plugin.ts, tool-guard-hooks.ts, session-hooks.ts, lifecycle/index.ts, notification-handler.ts
- `listSessionContinuity()` — used by plugin.ts, lifecycle/index.ts, session-journal-export.ts
- `recordSessionContinuity()` — used by plugin.ts, notification-handler.ts
- `patchSessionContinuity()` — used by plugin.ts, lifecycle/index.ts, notification-handler.ts

---

## REQ-P41D-04: Typecheck + 3000+ Tests Pass

**Rationale:** The teardown phase must not break the existing test suite. All changes are validated by type-check and existing tests (updated for new no-op behavior).

**Acceptance criteria:**
- `npm run typecheck` passes with zero errors.
- `npm test` passes (all 2963+ tests pass).
- Test files that assert `delegations.json` or `session-continuity.json` content are updated:
  - `tests/lib/continuity.test.ts` — asserts file writes, atomic writes, rehydration, governance state → updated for no-op
  - `tests/lib/delegation-manager.test.ts` — asserts `delegations.json` reads/writes → updated for empty reader
  - `tests/lib/delegation/readers/legacy-reader.test.ts` — tests legacy reader that reads delegations.json → reader returns empty array
  - `tests/lib/state-root-migration.test.ts` — asserts storage paths → stays (paths still valid, just no writes)
  - `tests/tools/session-journal-export.test.ts` — creates test files directly → stays (test fixture unchanged)
  - `tests/tools/delegation-status.test.ts` — calls `persistDelegations()` → no-op now
  - `tests/tools/hivemind-pressure.test.ts` — asserts files don't exist → PASS (they never did in that test)
  - `tests/lib/trajectory/ledger.test.ts` — asserts files don't exist → PASS
  - `tests/plugins/plugin-lifecycle.test.ts` — calls `recordSessionContinuity()` → still works (in-memory)
  - `tests/lib/lifecycle-manager.test.ts` — calls `getSessionContinuity()`, `recordSessionContinuity()` → still works

**Non-goal:** This phase does NOT add new test coverage. It only updates existing tests to match the new no-op behavior.
