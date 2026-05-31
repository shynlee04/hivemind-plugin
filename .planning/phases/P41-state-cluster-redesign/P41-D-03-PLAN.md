---
phase: P41-D
plan: 03
status: planned
plan: 01
type: execute
wave: 2
depends_on:
  - P41-D-01
  - P41-D-02
files_modified:
  - src/plugin.ts
  - tests/lib/continuity.test.ts
  - tests/lib/delegation-manager.test.ts
  - tests/lib/delegation-persistence.test.ts
  - tests/lib/delegation/readers/legacy-reader.test.ts
autonomous: true
requirements:
  - REQ-P41D-01
  - REQ-P41D-02
  - REQ-P41D-04
must_haves:
  truths:
    - ".hivemind/state/delegations.json is deleted at plugin startup (one-shot migration with sentinel)"
    - ".hivemind/state/session-continuity.json is deleted at plugin startup (one-shot migration with sentinel)"
    - "The migration runs only once per project (sentinel file in .hivemind/state/)"
    - "Tests that assert delegations.json or session-continuity.json file writes are updated for no-op behavior"
    - "npm run typecheck passes"
    - "npm test passes"
  artifacts:
    - path: src/plugin.ts
      provides: "One-shot migration for delegations.json and session-continuity.json deletion"
      min_lines: 10
    - path: tests/lib/continuity.test.ts
      provides: "Updated tests — file persistence assertions rewritten for in-memory behavior"
    - path: tests/lib/delegation-manager.test.ts
      provides: "Updated tests — delegations.json file assertions updated for empty reader"
    - path: tests/lib/delegation-persistence.test.ts
      provides: "Updated tests — corrupt-file quarantine tests removed/updated"
  key_links:
    - from: plugin.ts migration block
      to: delegations.json + session-continuity.json
      via: "existsSync + rmSync with force:true"
      pattern: "delegations.*migration|sentinel"
---

<objective>
Add one-shot migration to delete `.hivemind/state/delegations.json` and `session-continuity.json` at plugin startup. Update all test files to match the new no-persistence behavior.

**Purpose:** Clean up old file artifacts after P41-D-01 and P41-D-02 made the writers no-ops. Prevent the files from existing as stale references.
**Output:** `src/plugin.ts` — migration block added. 4 test files updated.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/P41-state-cluster-redesign/P41-D-SPEC.md
@.planning/phases/P41-state-cluster-redesign/P41-D-RESEARCH.md
@/Users/apple/hivemind-plugin-private/src/plugin.ts
@/Users/apple/hivemind-plugin-private/tests/lib/continuity.test.ts
@/Users/apple/hivemind-plugin-private/tests/lib/delegation-manager.test.ts
@/Users/apple/hivemind-plugin-private/tests/lib/delegation-persistence.test.ts
@/Users/apple/hivemind-plugin-private/tests/lib/delegation/readers/legacy-reader.test.ts

**Migration pattern reference:** `src/plugin.ts` lines 441-469 — CP-ST-03 event-tracker migration. Reuse `existsSync` + `rmSync` + sentinel file pattern.

**Files to delete (one-shot):**
- `.hivemind/state/delegations.json`
- `.hivemind/state/session-continuity.json`

**Test impact analysis (from SPEC + RESEARCH):**
- `tests/lib/continuity.test.ts` (~25% of tests rewrite needed): rehydration tests, atomic write assertions, corrupt file quarantine
- `tests/lib/delegation-manager.test.ts`: delegations.json content assertions (4-5 tests)
- `tests/lib/delegation-persistence.test.ts`: corrupt file quarantine tests, JSON parse error tests
- `tests/lib/delegation/readers/legacy-reader.test.ts`: delegations.json entries test

**Test files that need NO changes (verified):**
- `tests/tools/session-journal-export.test.ts` — creates fixture files directly, not asserting file writes
- `tests/tools/hivemind-pressure.test.ts` — asserts files DON'T exist (already passes)
- `tests/lib/trajectory/ledger.test.ts` — asserts files DON'T exist (already passes)
- `tests/lib/state-root-migration.test.ts` — asserts path strings, not file existence
- `tests/lib/security/path-scope.test.ts` — asserts path resolution, not I/O
- `tests/lib/agent-work-contracts/store.test.ts` — asserts files DON'T exist (already passes)
- `tests/lib/control-plane/gatekeeper.test.ts` — asserts path string in error message (no change needed)
- All session-tracker test files — reference `session-continuity.json` under `.hivemind/session-tracker/` paths, NOT `.hivemind/state/`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add one-shot migration for delegations.json and session-continuity.json in plugin.ts</name>
  <files>src/plugin.ts</files>
  <action>
    Add a new one-shot migration block in `plugin.ts` AFTER the existing CP-ST-03 event-tracker migration (lines 441-469). Follow the exact same pattern. Insert after line 469 (after the closing `})()` of the event-tracker migration block).

    The new block:

    ```typescript
    // One-shot migration: remove legacy .hivemind/state/delegations.json and session-continuity.json (P41-D D-02, D-03)
    void (async () => {
      const sentinelPath = join(projectDirectory, ".hivemind", "state", "delegations-migration-done")
      const delegationsPath = join(projectDirectory, ".hivemind", "state", "delegations.json")
      const continuityPath = join(projectDirectory, ".hivemind", "state", "session-continuity.json")
      try {
        if (existsSync(sentinelPath)) return
        let deletedAny = false
        if (existsSync(delegationsPath)) {
          rmSync(delegationsPath, { force: true })
          deletedAny = true
        }
        if (existsSync(continuityPath)) {
          rmSync(continuityPath, { force: true })
          deletedAny = true
        }
        if (deletedAny) {
          const stateDir = join(projectDirectory, ".hivemind", "state")
          if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
          writeFileSync(sentinelPath, new Date().toISOString(), "utf-8")
          void client.app?.log?.({
            body: {
              service: "migration",
              level: "info",
              message: "[Harness] P41-D: removed legacy .hivemind/state/delegations.json and session-continuity.json",
            },
          })
        }
      } catch (err) {
        void client.app?.log?.({
          body: {
            service: "migration",
            level: "warn",
            message: "[Harness] P41-D: legacy file migration failed",
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      }
    })()
    ```

    **IMPORTANT ordering requirement:** This migration MUST run AFTER P41-D-01 and P41-D-02 have made the writers no-op. Since this is Plan 03 (Wave 2), it already depends on Plans 01 and 02. The sentinel file path is `delegations-migration-done` (distinct from the CP-ST-03 sentinel `event-tracker-migration-done`).

    **What to avoid:**
    - Do NOT modify the existing CP-ST-03 event-tracker migration (lines 441-469) — it stays intact
    - Do NOT use shared sentinel (use a distinct name)
    - Do NOT swallow the log message — the migration outcome should be visible in logs
  </action>
  <verify>
    <automated>npm run typecheck 2>&1</automated>
  </verify>
  <done>
    - Migration block added after line 469 in plugin.ts
    - Uses distinct sentinel file: `delegations-migration-done`
    - Deletes both `delegations.json` and `session-continuity.json` from `.hivemind/state/`
    - Reuses `existsSync`, `rmSync`, `writeFileSync` pattern matching CP-ST-03 style
    - Typecheck passes
  </done>
</task>

<task type="auto">
  <name>Task 2: Update continuity.test.ts — rewrite file-persistence assertions for in-memory behavior</name>
  <files>tests/lib/continuity.test.ts</files>
  <action>
    Update the following test sections in `tests/lib/continuity.test.ts`. Focus on tests that assert `session-continuity.json` file I/O or disk persistence — they must now verify in-memory behavior instead.

    **Section 1: Corrupt file quarantine test (around line 48)**
    This test writes a corrupt file and expects `ensureStoreLoaded()` or similar to quarantine it. Since `persistStore()` no longer writes, the reader (`loadStoreFromDisk()`) still reads existing files. Two scenarios:
    - If the test creates a corrupt file and then calls `getSessionContinuity()` (which calls `ensureStoreLoaded()` → `loadStoreFromDisk()`): the corrupt-file handling in `loadStoreFromDisk()` will still execute.
    - Change: Instead of relying on `persistStore()` to write the file, the test should write the corrupt fixture directly via `writeFileSync` (test fixture setup), then assert that `getSessionContinuity()` throws or the file is quarantined.
    - Update assertion for `.corrupt-` file existence: this part of the test should still work since `loadStoreFromDisk()` still calls `quarantineCorruptFile()`.

    **Section 2: Atomic write test (around line 67)**
    This test verifies that `.tmp` files are cleaned up. Since `persistStore()` no longer writes, `.tmp` files are no longer created. Change: Remove the `.tmp` creation assertion (the ".tmp" file check is moot since persistStore is no-op). Alternatively, write the fixture directly and verify the reader doesn't leave temp files.

    **Section 3: "creates session-continuity.json + delegations.json on a fresh install" (line 115)**
    This test asserts file creation. Since no files are written anymore, rewrite to:
    - Call `recordSessionContinuity()` with a session
    - Assert the session is returned by `listSessionContinuity()` (in-memory)
    - Assert the files do NOT exist on disk (the no-op behavior)
    - This proves: (a) in-memory updates work, (b) no file-side-effects occur

    **Section 4: Rehydration test (line 160 — "rehydrate state from existing continuity file")**
    This test creates a `continuity1` instance, writes two sessions, then creates `continuity2` and expects disk rehydration. Rewrite to:
    - Call `recordSessionContinuity()` twice as before
    - Verify sessions are in-memory via `listSessionContinuity()`
    - The cross-instance rehydration part becomes: "verify in-memory list still returns both sessions after additional writes"
    - Document that cross-instance rehydration is now handled by session-tracker

    **Section 5: `flushAllStores` / `registerShutdownHandlers` tests (lines 477-578)**
    These tests call `flushAllStores()` and assert it doesn't throw or writes to disk. Since these are now no-ops:
    - Rewrite to verify the no-op doesn't throw
    - Verify no files are created on disk after calling `flushAllStores()` or `registerShutdownHandlers()`
    - The tests for `registerShutdownHandlers` being a function should be updated — the export is removed in Plan 02. Since `registerShutdownHandlers` is no longer exported, these tests must be removed or converted to verify the module-level behavior is gone.

    **Strategy for removing tests:**
    - Tests that directly assert `flushAllStores()` or `registerShutdownHandlers()` behavior: remove the `describe` block (these functions are no longer exported)
    - Tests that assert file writes: rewrite to assert in-memory behavior + file-NOT-exists
    - Tests that assert corrupt-file handling: keep but ensure they use direct fixture writes (not relying on persistStore to create the file)

    **What to keep:**
    - `recordSessionContinuity()` tests — still work in-memory
    - `getSessionContinuity()` tests — still work from in-memory cache
    - `patchSessionContinuity()` tests — still work in-memory
    - `listSessionContinuity()` tests — still work in-memory
    - `deleteSessionContinuity()` tests — still work in-memory
    - `getContinuityStoragePath()` tests — path is still valid

    **Impact:** Expect rewrite of ~30-50 lines of test code (roughly 25% of the file).
  </action>
  <verify>
    <automated>npx vitest run tests/lib/continuity.test.ts -x 2>&1 | tail -20</automated>
  </verify>
  <done>
    - File-persistence assertions rewritten to in-memory assertions
    - Atomic-write tests updated (no temp files created)
    - Rehydration test verified in-memory (session-tracker handles cross-instance)
    - `flushAllStores`/`registerShutdownHandlers` test blocks removed (exports removed)
    - Test suite in continuity.test.ts passes
  </done>
</task>

<task type="auto">
  <name>Task 3: Update remaining test files for empty reader and no-op writer</name>
  <files>
    tests/lib/delegation-manager.test.ts,
    tests/lib/delegation-persistence.test.ts,
    tests/lib/delegation/readers/legacy-reader.test.ts
  </files>
  <action>
    Update three test files:

    **1. `tests/lib/delegation-manager.test.ts` (focus: lines 1443, 1827, 1876)**
    - Line 1443: `it("writes delegations to delegations.json with valid JSON array")` — This test calls `persistDelegations()` and asserts file content. Update to: call `persistDelegations()`, then verify the file does NOT exist (no-op writer) but the in-memory delegation records are accessible via the state machine's internal state.
    - Line 1827: `it("handles empty delegations.json — returns empty array")` — This test creates an empty file and reads it. Update to: `readPersistedDelegations()` returns `[]` regardless of file state. Simplify: remove the file creation step, just verify `readPersistedDelegations()` returns `[]`.
    - Line 1876: `it("handles missing delegations.json file gracefully")` — Already tests the "file doesn't exist" case. Since `readPersistedDelegations()` now always returns `[]`, this test simplifies to: expect empty array (same as line 1827). Merge or simplify.
    - Any test that calls `readPersistedDelegations()` and expects non-empty results: update assertion to expect `[]`.

    **2. `tests/lib/delegation-persistence.test.ts`**
    - Line 79: `it("quarantines corrupt delegations.json and throws a visible harness error")` — This test writes corrupt JSON and expects `readPersistedDelegations()` to throw. Since `readPersistedDelegations()` now returns `[]`, it will NOT throw. Remove this test or rewrite to: verify `readPersistedDelegations()` returns `[]` even if corrupt file exists.
    - Line 88: `it("reports non-array delegations.json as invalid persisted shape")` — Same issue. `readPersistedDelegations()` no longer reads the file. Remove or rewrite to verify empty return.
    - Line 62: nested write guard test — This intercepts `writeFileSync` for `.tmp` files. Since no file writes occur, the interception guard is unnecessary. Remove or simplify.
    - Line 83: `expect(() => persistence.readPersistedDelegations()).toThrow(...)` — Should now assert `readPersistedDelegations()` returns `[]` without throwing.
    - Line 92: Similar to line 83 — same rewrite.
    - Line 103: `const delegations = persistence.readPersistedDelegations()` — Assert `delegations` is `[]`.

    **3. `tests/lib/delegation/readers/legacy-reader.test.ts`**
    - This file tests `LegacyPersistenceStatusReader` which reads `delegations.json`. Three tests:
    - Line 18: "returns empty array when delegations.json does not exist" — Update: the fixture path doesn't exist, reader returns `[]`. This stays the same or simplifies.
    - Line 23: "parses valid delegations.json entries" — The reader was a wrapper around `readPersistedDelegations()`. Since that now returns `[]`, the reader returns `[]`. Update assertion to expect `[]` (empty).
    - Line 42: "rejects invalid delegations.json entries" — Same: `readPersistedDelegations()` returns `[]`, no rejection logic runs. Update assertion to expect `[]`.

    **What to avoid:**
    - Do NOT modify `tests/tools/session-journal-export.test.ts` — creates fixture files directly via `writeFileSync`, not relying on `persistDelegations`. This stays.
    - Do NOT modify `tests/tools/hivemind-pressure.test.ts` — asserts files DON'T exist. This still passes (no files created).
    - Do NOT modify `tests/lib/trajectory/ledger.test.ts` — same reason.
    - Do NOT modify any session-tracker test files — they reference `session-continuity.json` under session-tracker paths, not `.hivemind/state/`.
  </action>
  <verify>
    <automated>npm test 2>&1 | tail -30</automated>
  </verify>
  <done>
    - `delegation-manager.test.ts`: file-write tests updated for no-op writer; empty-reader tests simplified
    - `delegation-persistence.test.ts`: corrupt-file tests removed/updated; all assertions expect `[]` return
    - `legacy-reader.test.ts`: assertions expect `[]` for all read calls
    - All 4 test files pass standalone runs
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| plugin.ts — file deletion migration | Deletes known hardcoded paths within `.hivemind/state/`. No user-supplied paths. |
| Test file modifications | Test-only changes — no runtime production code affected |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-P41D-06 | Tampering | One-shot deletion in plugin.ts | mitigate | Hardcoded paths only (delegations.json, session-continuity.json). Sentinel file prevents re-execution. `rmSync` with `force: true`. |
| T-P41D-07 | Denial of Service | File deletion during active writes | accept | Writers are already no-op (Plans 01-02 delete-candidates). Migration runs at startup before any writer code executes. No active writes race condition. |
| T-P41D-08 | Information Disclosure | Stale files persist after migration skip | accept | If sentinel exists, migration skips. Files are no longer read by any code path (`readPersistedDelegations` returns `[]`, continuity readers use session-tracker). |
| T-P41D-SC | Tampering | npm/pip/cargo installs | mitigate | No packages installed in this phase |
</threat_model>

<verification>
- One-shot migration: sentinel prevents repeated execution
- File existence: after migration runs, neither `delegations.json` nor `session-continuity.json` exist under `.hivemind/state/`
- Typecheck: `npm run typecheck` passes
- Full suite: `npm test` passes (all 3000+ tests)
</verification>

<success_criteria>
- `.hivemind/state/delegations.json` is deleted at startup (one-shot with sentinel)
- `.hivemind/state/session-continuity.json` is deleted at startup (one-shot with sentinel)
- Migration block in plugin.ts uses CP-ST-03 pattern (existsSync + rmSync + sentinel)
- All test files updated to match no-persistence behavior
- Typecheck passes
- Full test suite passes
</success_criteria>

<output>
Create `.planning/phases/P41-state-cluster-redesign/P41-D-03-SUMMARY.md` when done
</output>
