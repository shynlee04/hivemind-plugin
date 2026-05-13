---
phase: CP-ST-03-architecture-detox
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # DELETED (12 source files):
  - src/task-management/journal/event-tracker/types.ts
  - src/task-management/journal/event-tracker/parser.ts
  - src/task-management/journal/event-tracker/writer.ts
  - src/task-management/journal/event-tracker/markdown-renderer.ts
  - src/task-management/journal/event-tracker/index.ts
  - src/task-management/journal/event-tracker/hook-event.ts
  - src/task-management/journal/event-tracker/document-store.ts
  - src/task-management/journal/event-tracker/dual-persistence.ts
  - src/task-management/journal/event-tracker/classifier.ts
  - src/task-management/journal/event-tracker/delegation-evidence.ts
  - src/task-management/journal/event-tracker/artifact-writer.ts
  - src/task-management/journal/event-tracker/.gitkeep
  # DELETED (10 test files):
  - tests/lib/event-tracker/session-v3-schema.test.ts
  - tests/lib/event-tracker/session-journey-events.test.ts
  - tests/lib/event-tracker/writer.test.ts
  - tests/lib/event-tracker/document-store.test.ts
  - tests/lib/event-tracker/dual-persistence.test.ts
  - tests/lib/event-tracker/event-types.test.ts
  - tests/lib/event-tracker/session-artifact-parser.test.ts
  - tests/lib/event-tracker/artifact-writer.test.ts
  - tests/lib/event-tracker/delegation-evidence.test.ts
  - tests/lib/event-tracker/classifier.test.ts
  # EDITED source:
  - src/index.ts
  - src/plugin.ts
  - src/hooks/observers/event-observers.ts
  - src/features/session-tracker/index.ts
  - src/sidecar/readonly-state.ts
  - src/features/bootstrap/structure.ts
  # EDITED tests:
  - tests/plugins/plugin-lifecycle.test.ts
  - tests/plugin/bootstrap-tools-registration.test.ts
  - tests/lib/state-root-migration.test.ts
  - tests/lib/security/path-scope.test.ts
  - tests/features/session-tracker/integration/e2e-verification.test.ts
  - tests/tools/bootstrap-init.test.ts
  - tests/tools/hivemind-pressure.test.ts
  - tests/sidecar/readonly-state.test.ts
  # EDITED docs:
  - AGENTS.md
  - src/task-management/journal/AGENTS.md
  - src/task-management/AGENTS.md
  - src/features/session-tracker/AGENTS.md
  - sidecar/README.md
  - .planning/ROADMAP.md
autonomous: true
requirements:
  - AC-01
  - AC-02
  - AC-03
  - AC-04
  - AC-05
  - AC-06
  - AC-07
  - AC-08
  - AC-09
  - AC-10
  - AC-11
  - AC-12
  - AC-13
must_haves:
  truths:
    - "zero files exist under src/task-management/journal/event-tracker/"
    - "zero files exist under tests/lib/event-tracker/"
    - "src/index.ts has no event-tracker import or re-export"
    - "src/plugin.ts has zero dead commented code referencing event-tracker"
    - "src/hooks/observers/event-observers.ts has no createSessionJourneyEventObserver or SessionJourneyEventFact"
    - "src/features/session-tracker/index.ts has no removeLegacyStateFiles() method"
    - "src/sidecar/readonly-state.ts CANONICAL_PREFIXES has no .hivemind/event-tracker"
    - "src/features/bootstrap/structure.ts TIER_1_DIRECTORIES has no event-tracker"
    - "6 documentation files updated to remove event-tracker references"
    - "npm run typecheck passes with zero event-tracker-related errors"
    - "npm test passes with all remaining tests"
  artifacts:
    - path: "src/task-management/journal/event-tracker/"
      provides: "N/A — must NOT exist"
      must_not_exist: true
    - path: "tests/lib/event-tracker/"
      provides: "N/A — must NOT exist"
      must_not_exist: true
    - path: "src/index.ts"
      provides: "Public API barrel — line 19 removed"
      contains: "export * from"
      must_not_contain: "event-tracker"
    - path: "src/plugin.ts"
      provides: "Pure composition root — dead comments removed"
      must_not_contain: "consumeJourneyFact|sessionJourneyEventObserver|createEventTrackerArtifactsFromHook|shouldTrackEventTrackerEvent"
    - path: "src/hooks/observers/event-observers.ts"
      provides: "Event observers — SessionJourneyEventFact + createSessionJourneyEventObserver removed"
      must_not_contain: "SessionJourneyEventFact|createSessionJourneyEventObserver|shouldTrack"
    - path: "src/features/session-tracker/index.ts"
      provides: "Session tracker — removeLegacyStateFiles removed"
      must_not_contain: "removeLegacyStateFiles"
    - path: "src/sidecar/readonly-state.ts"
      provides: "Sidecar read-only enforcement — event-tracker prefix removed"
      must_not_contain: "event-tracker"
    - path: "src/features/bootstrap/structure.ts"
      provides: "Bootstrap structure — event-tracker directory removed"
      must_not_contain: '"event-tracker"'
  key_links: []
---

<objective>
Delete all event-tracker source code (12 files), test code (10 files), and references from the Hivemind codebase. Edit 6 source files, 8 test files, and 6 documentation files to remove all event-tracker mentions. Add a one-shot migration cleanup on plugin init (per D-03).

Purpose: The event-tracker was supplanted by the session-tracker in CP-ST-01/02. It has been dead code since Phase 13 (F-09). Removing it eliminates 22 dead files, 157+ test references, and 47+ source references — the last atrophied limb of the dual-capture era.

Output: Zero runtime references to event-tracker anywhere in the codebase. TypeScript compiles cleanly. All remaining tests pass.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-CONTEXT.md
@.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-SPEC.md
@.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-RESEARCH.md

<interfaces>
<!-- Key exports from files being edited that executors need. Extracted from live codebase. -->

From src/index.ts (current line 19):
```typescript
export * from "./task-management/journal/event-tracker/index.js"  // ← DELETE THIS LINE
```

From src/plugin.ts (lines 46-54 — DELETE ALL):
```typescript
// Legacy event-tracker code preserved at src/task-management/journal/event-tracker/ (REQ-ST-13).
// Deprecated: event-tracker wiring is kept for backward compatibility with existing tests.
// New capture goes through SessionTracker → .hivemind/session-tracker/.
// DEPRECATED (Phase 13 F-09): Legacy event-tracker imports — consumeJourneyFact removed from eventObservers.
// Kept as commented safety net per REQ-ST-13.
// import {
//   createEventTrackerArtifactsFromHook,
//   shouldTrackEventTrackerEvent,
// } from "./task-management/journal/event-tracker/index.js"
```

From src/plugin.ts (lines 123-124, 148-161 — DELETE ALL):
```typescript
  // DEPRECATED: sessionJourneyEventObserver was only used by consumeJourneyFact (removed in Phase 13 F-09)
  // const sessionJourneyEventObserver = createSessionJourneyEventObserver(shouldTrackEventTrackerEvent)
  // ... (14 lines of commented consumeJourneyFact)
```

From src/hooks/observers/event-observers.ts (lines 11-13, 39-51 — DELETE):
```typescript
export type SessionJourneyEventFact =           // lines 11-13
  | { kind: "session-journey-event"; event: unknown; source: "plugin.event" }
  | { kind: "ignored" }

export function createSessionJourneyEventObserver(  // lines 39-51
  shouldTrack: (event: unknown) => boolean,
): (input: { event?: unknown }) => Promise<SessionJourneyEventFact> { ... }
```

From src/sidecar/readonly-state.ts (line 34 — current CANONICAL_PREFIXES):
```typescript
const CANONICAL_PREFIXES = [".hivemind/state", ".hivemind/event-tracker", ".planning"]
// After edit: [".hivemind/state", ".planning"]
```

From src/features/bootstrap/structure.ts (line 58 — current TIER_1_DIRECTORIES):
```typescript
export const TIER_1_DIRECTORIES = [
  "state", "delegation", "event-tracker", "journal", ...  // ← remove "event-tracker"
]
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Excise all event-tracker source + test files and remove runtime references</name>
  <files>
    src/task-management/journal/event-tracker/ (DELETE all 12 files + directory)
    tests/lib/event-tracker/ (DELETE all 10 files + directory)
    src/index.ts (EDIT line 19)
    src/plugin.ts (EDIT lines 46-54, 123-124, 148-161)
    src/hooks/observers/event-observers.ts (EDIT lines 11-13, 39-51)
    src/features/session-tracker/index.ts (EDIT lines 979-1018)
    src/sidecar/readonly-state.ts (EDIT line 34)
    src/features/bootstrap/structure.ts (EDIT line 58)
  </files>
  <behavior>
    - Test 1: After deletion, `find src/task-management/journal/ -name "event-tracker" -type d` returns empty (AC-01)
    - Test 2: After deletion, `find tests/lib/ -name "event-tracker" -type d` returns empty (AC-09)
    - Test 3: `grep "event-tracker" src/index.ts` returns no matches (AC-02)
    - Test 4: `grep "event-tracker\|EventTracker\|consumeJourneyFact\|sessionJourneyEventObserver" src/plugin.ts` returns no matches (AC-03, AC-13)
    - Test 5: `grep "createSessionJourneyEventObserver\|SessionJourneyEventFact" src/hooks/observers/event-observers.ts` returns no matches (AC-04)
    - Test 6: `grep "removeLegacyStateFiles" src/features/session-tracker/index.ts` returns no matches (AC-05)
    - Test 7: `grep '"event-tracker"' src/sidecar/readonly-state.ts` returns no matches (AC-06)
    - Test 8: `grep '"event-tracker"' src/features/bootstrap/structure.ts` returns no matches (AC-07)
  </behavior>
  <action>
**STEP 1 — Delete source directory:** Delete all 12 files under `src/task-management/journal/event-tracker/` then remove the empty directory. This includes: types.ts, parser.ts, writer.ts, markdown-renderer.ts, index.ts, hook-event.ts, document-store.ts, dual-persistence.ts, classifier.ts, delegation-evidence.ts, artifact-writer.ts, .gitkeep.

**STEP 2 — Delete test directory:** Delete all 10 files under `tests/lib/event-tracker/` then remove the empty directory. This includes: session-v3-schema.test.ts, session-journey-events.test.ts, writer.test.ts, document-store.test.ts, dual-persistence.test.ts, event-types.test.ts, session-artifact-parser.test.ts, artifact-writer.test.ts, delegation-evidence.test.ts, classifier.test.ts.

**STEP 3 — Edit src/index.ts (per D-02):** Delete line 19: `export * from "./task-management/journal/event-tracker/index.js"`. This is the only active runtime import of event-tracker — all other references are dead comments or internal to the deleted files.

**STEP 4 — Edit src/plugin.ts (per D-02):** Three deletions:
  a) Lines 46-54: Delete the 9-line commented block (`// Legacy event-tracker code preserved...` through the commented import of `createEventTrackerArtifactsFromHook` and `shouldTrackEventTrackerEvent`).
  b) Lines 123-124: Delete the commented `sessionJourneyEventObserver` instantiation line.
  c) Lines 148-161: Delete the 14-line commented `consumeJourneyFact` function block.
Do NOT remove lines 46-54's conceptual purpose unless all words reference event-tracker — verify each line references event-tracker before deleting. Keep line 17 comment since it documents architectural history of `createSessionJourneyEventObserver` but since the function is being deleted, update it to read: `// createSessionJourneyEventObserver — REMOVED in CP-ST-03; session-tracker is canonical.`

**STEP 5 — Edit src/hooks/observers/event-observers.ts (per D-02):**
  a) Delete lines 11-13: The `SessionJourneyEventFact` type (unused since F-09).
  b) Delete lines 39-51: The `createSessionJourneyEventObserver()` function (unused since F-09).
  c) Remove the JSDoc `@param shouldTrack` reference if present on the deleted function.

**STEP 6 — Edit src/features/session-tracker/index.ts (per D-02):** Remove the `removeLegacyStateFiles()` private method entirely (approximately lines 979-1018, ~40 LOC). Update the `cleanup()` method to remove the call to `removeLegacyStateFiles()`. The cleanup method should still invoke `_initialize()` and `_cleanOrphans()` — only the legacy event-tracker cleanup call is removed.

**STEP 7 — Edit src/sidecar/readonly-state.ts (per D-04):** In `CANONICAL_PREFIXES` (line 34), remove `".hivemind/event-tracker"`. The array becomes `[".hivemind/state", ".planning"]`. Also update line 10 comment to remove `.hivemind/event-tracker/` reference.

**STEP 8 — Edit src/features/bootstrap/structure.ts (per D-05):** Remove `"event-tracker"` from the `TIER_1_DIRECTORIES` array (line 58). Do not renumber or reorder other entries.

**CRITICAL CONSTRAINTS:**
  - Do NOT modify session-tracker capture logic (AP-05)
  - Do NOT create any new event-tracker code (anti-pattern from RESEARCH.md)
  - Do NOT extract the tool registration map (AP-01)
  - Do NOT create src/plugin/ directory (AP-02)
  - Run `npm run typecheck` after deleting src/index.ts line 19 but BEFORE deleting source files to catch downstream import errors early (per RESEARCH.md Pitfall 1)
  </action>
  <verify>
    <automated>npm run typecheck && echo "---AC GATES---" && find src/task-management/journal/ -name "event-tracker" -type d | wc -l | xargs test 0 -eq && echo "AC-01 PASS" && find tests/lib/ -name "event-tracker" -type d | wc -l | xargs test 0 -eq && echo "AC-09 PASS" && grep "event-tracker" src/index.ts || echo "AC-02 PASS" && grep "event-tracker\|consumeJourneyFact\|sessionJourneyEventObserver\|createEventTrackerArtifactsFromHook\|shouldTrackEventTrackerEvent" src/plugin.ts || echo "AC-03/AC-13 PASS" && grep "createSessionJourneyEventObserver\|SessionJourneyEventFact" src/hooks/observers/event-observers.ts || echo "AC-04 PASS" && grep "removeLegacyStateFiles" src/features/session-tracker/index.ts || echo "AC-05 PASS" && grep '"event-tracker"' src/sidecar/readonly-state.ts || echo "AC-06 PASS" && grep '"event-tracker"' src/features/bootstrap/structure.ts || echo "AC-07 PASS"</automated>
  </verify>
  <done>
    - All 12 event-tracker source files deleted, directory removed (AC-01)
    - All 10 event-tracker test files deleted, directory removed (AC-09)
    - src/index.ts line 19 deleted — zero event-tracker exports (AC-02)
    - src/plugin.ts — all dead commented event-tracker code removed (AC-03, AC-13)
    - event-observers.ts — createSessionJourneyEventObserver + SessionJourneyEventFact removed (AC-04)
    - session-tracker/index.ts — removeLegacyStateFiles removed (AC-05)
    - readonly-state.ts — event-tracker prefix removed from CANONICAL_PREFIXES (AC-06)
    - structure.ts — "event-tracker" removed from TIER_1_DIRECTORIES (AC-07)
    - `npm run typecheck` passes with zero event-tracker-related errors
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Edit test files to remove event-tracker references</name>
  <files>
    tests/plugins/plugin-lifecycle.test.ts
    tests/plugin/bootstrap-tools-registration.test.ts
    tests/lib/state-root-migration.test.ts
    tests/lib/security/path-scope.test.ts
    tests/features/session-tracker/integration/e2e-verification.test.ts
    tests/tools/bootstrap-init.test.ts
    tests/tools/hivemind-pressure.test.ts
    tests/sidecar/readonly-state.test.ts
  </files>
  <behavior>
    - Test 1: `grep "event-tracker\|eventTracker" tests/plugins/plugin-lifecycle.test.ts` returns no matches (AC-10)
    - Test 2: `grep "event-tracker" tests/plugin/bootstrap-tools-registration.test.ts` returns no matches (AC-11)
    - Test 3: `grep "event-tracker" tests/lib/state-root-migration.test.ts` returns no matches
    - Test 4: `grep "event-tracker" tests/lib/security/path-scope.test.ts` returns no matches
    - Test 5: `grep "event-tracker" tests/features/session-tracker/integration/e2e-verification.test.ts` returns no matches
    - Test 6: `grep "event-tracker" tests/tools/bootstrap-init.test.ts` returns no matches
    - Test 7: `grep "event-tracker" tests/tools/hivemind-pressure.test.ts` returns no matches (only session-tracker references remain)
    - Test 8: `grep "event-tracker" tests/sidecar/readonly-state.test.ts` returns no matches
    - Test 9: `npx vitest run tests/plugins/plugin-lifecycle.test.ts --reporter=verbose` passes
  </behavior>
  <action>
**Per D-06 test strategy, three categories of changes:**

**Category 1 — DELETE event-tracker tests (in tests/plugins/plugin-lifecycle.test.ts):**
Delete the following test blocks (identify by their test description strings):
  - Test "automatically writes event-tracker artifacts for canonical OpenCode lifecycle events" (lines 77-93 in RESEARCH.md mapping)
  - Test "automatically routes parent-linked sub-session lifecycle events to the parent event-tracker artifact" (lines 95-115)
  - Test "does not write event-tracker artifacts for message firehose plugin events" (lines 117-138)

**Category 2 — REWRITE event-tracker assertions (in tests/plugins/plugin-lifecycle.test.ts):**
For the remaining 3 test blocks that reference event-tracker, remove event-tracker assertions while preserving non-event-tracker assertions:
  - Test "keeps lifecycle notification replay independent from event-tracker admission" — remove event-tracker assertions, keep lifecycle assertions
  - Test "session tracker and tool metadata" — remove event-tracker assertions, keep session-tracker assertions
  - Test "composes tool-guard metadata injection with plugin event-tracker after-hook work" — remove event-tracker assertions, keep tool-guard assertions

**Category 3 — EDIT event-tracker references (7 files):**
  - `tests/plugin/bootstrap-tools-registration.test.ts`: Remove the `vi.mock("../../src/task-management/journal/event-tracker/index.js", ...)` block (line ~41). If the mock is in a beforeEach/describe and other mocks exist, remove only the event-tracker mock line.
  - `tests/lib/state-root-migration.test.ts`: Remove `getEventTrackerArtifactPaths` import (line ~13), remove the test "event-tracker writes to .hivemind/event-tracker/" (lines ~55-62), and remove `.hivemind/event-tracker` gitignore assertion (lines ~108-110).
  - `tests/lib/security/path-scope.test.ts`: Remove the test "allows canonical .hivemind state and event-tracker paths" (lines ~26-30) OR edit it to remove only the event-tracker sub-assertion while keeping `.hivemind/state` assertions.
  - `tests/features/session-tracker/integration/e2e-verification.test.ts`: Delete 3 legacy event-tracker tests: "removes stale .json/.md files", "old event-tracker source code is preserved", "no new files written to legacy event-tracker" (around lines 595-630). Keep all session-tracker tests intact.
  - `tests/tools/bootstrap-init.test.ts`: Remove `"event-tracker"` from the expected directory list assertion (line ~12). Verify the test still passes with the reduced expected list.
  - `tests/tools/hivemind-pressure.test.ts`: Replace `"event-tracker:ses_root"` references (lines ~56, 61) with equivalent session-tracker references or generic strings. The exact replacement depends on what the test asserts — preserve test logic while changing the referenced path.
  - `tests/sidecar/readonly-state.test.ts`: Remove `mkdirSync(join(projectRoot, ".hivemind", "event-tracker"), ...)` (line ~18) and remove the test "recognizes paths under .hivemind/event-tracker/" (lines ~36-38). Keep all `.hivemind/state` and `.planning` tests.

**Verification approach:** After each category, run the affected test file to confirm no breakage. Then run the full suite.
  </action>
  <verify>
    <automated>grep -r "event-tracker" tests/plugins/plugin-lifecycle.test.ts || echo "AC-10 PASS" && grep "event-tracker" tests/plugin/bootstrap-tools-registration.test.ts || echo "AC-11 PASS" && npx vitest run tests/plugins/plugin-lifecycle.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    - tests/plugins/plugin-lifecycle.test.ts — 3 event-tracker tests deleted, 3 rewritten (AC-10)
    - tests/plugin/bootstrap-tools-registration.test.ts — event-tracker mock removed (AC-11)
    - 6 other test files edited — zero event-tracker references remain
    - All edited test files pass individually
  </done>
</task>

<task type="auto">
  <name>Task 3: Documentation sync + one-shot migration cleanup</name>
  <files>
    AGENTS.md
    src/task-management/journal/AGENTS.md
    src/task-management/AGENTS.md
    src/features/session-tracker/AGENTS.md
    sidecar/README.md
    .planning/ROADMAP.md
    src/plugin.ts (add migration cleanup)
  </files>
  <action>
**PART A — Documentation sync (per D-07):**

Edit the following 6 files to remove event-tracker references. Use grep to find exact locations in each file, then make targeted edits:

1. **`AGENTS.md` (root, line ~93):** Change `/.hivemind/event-tracker/*` reference to `/.hivemind/session-tracker/*`. If the line describes the state directory structure, replace the path. If it describes a legacy artifact, note "replaced by session-tracker in CP-ST-03."

2. **`src/task-management/journal/AGENTS.md` (lines ~7, 12, 34):** Remove event-tracker references from purpose, mutation authority, and naming sections. The journal directory no longer contains event-tracker — update the documented submodules list.

3. **`src/task-management/AGENTS.md` (line ~13):** Remove the `EventTracker may project audit events to .hivemind/event-tracker/` line. Replace with session-tracker equivalent or remove if the line describes a removed capability.

4. **`src/features/session-tracker/AGENTS.md` (lines ~9, 19):** These lines already correctly reference session-tracker as the replacement — verify they're still accurate post-excision. No changes needed per RESEARCH.md, but verify with grep.

5. **`sidecar/README.md` (lines ~9, 42):** Remove `.hivemind/event-tracker/` from the documentation. The sidecar only reads `.hivemind/state/` and `.planning/` after this phase. Update the canonical paths table.

6. **`.planning/ROADMAP.md` (line ~124):** Update the CP-ST-03 description to reflect completed migration: "event-tracker fully removed, docs synced". No functional change needed — just note the phase milestone in the description if appropriate.

**PART B — One-shot migration cleanup (per D-03):**

Add a one-shot cleanup to `src/plugin.ts` that runs during plugin initialization. The cleanup:
  - Checks if `.hivemind/event-tracker/` directory exists at the project root
  - If it exists, recursively removes it (using `fs.rmSync` with `{ recursive: true, force: true }`)
  - Records completion by creating a sentinel file at `.hivemind/state/event-tracker-migration-done` (SR-08)
  - On subsequent runs, checks for the sentinel file and skips if present
  - Runs as fire-and-forget (best-effort, never blocks init)
  - Logs via `client.app?.log?.()` on success and failure

Place this cleanup in plugin.ts after the SessionTracker initialization block (around line 114). Use a pattern like:
```typescript
// One-shot migration: remove legacy .hivemind/event-tracker/ (CP-ST-03 D-03)
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
```

The migration cleanup must:
  - Import `existsSync`, `rmSync` from `node:fs` and `join` from `node:path` (if not already imported)
  - Check sentinel at `.hivemind/state/event-tracker-migration-done`
  - Only attempt removal if sentinel is absent AND the event-tracker directory exists
  - Wrap in try/catch with best-effort logging
  - Write sentinel file after successful cleanup
  - Never throw — must not block plugin init

**CRITICAL CONSTRAINTS:**
  - Do NOT add new npm dependencies (AC-27)
  - Do NOT change session-tracker capture behavior (AP-05)
  - Keep migration logic minimal — single purpose, single location
  </action>
  <verify>
    <automated>grep -r "event-tracker" AGENTS.md --include="*.md" -l | grep -v ".planning/phases/13-" | grep -v ".planning/phases/CP-ST-03-" && echo "DOCS: Some files still have event-tracker refs" || echo "AC-12 PASS — all docs clean (historical preserved)" && echo "Checking specific files:" && grep "event-tracker" AGENTS.md && echo "ROOT AGENTS.md still has refs" || echo "root AGENTS.md PASS" && grep "event-tracker" src/task-management/journal/AGENTS.md && echo "journal AGENTS.md still has refs" || echo "journal AGENTS.md PASS" && grep "event-tracker" src/task-management/AGENTS.md && echo "task-management AGENTS.md still has refs" || echo "task-management AGENTS.md PASS" && grep "event-tracker" sidecar/README.md && echo "sidecar README still has refs" || echo "sidecar README PASS"</automated>
  </verify>
  <done>
    - 6 documentation files updated — zero event-tracker references in active docs (AC-12)
    - `.planning/phases/13-*/` and `CP-ST-03-*` files preserved as historical artifacts (not part of AC-12)
    - One-shot migration cleanup added to plugin.ts (per D-03, SR-08)
    - Sentinel file at `.hivemind/state/event-tracker-migration-done` gates re-execution
    - `npm run typecheck` passes after doc edits
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

This phase is purely subtractive + documentation. No new attack surfaces are introduced.

| Boundary | Description |
|----------|-------------|
| plugin.ts init → filesystem | One-shot migration uses `fs.rmSync` on `.hivemind/event-tracker/` |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-03-01 | Tampering | One-shot migration (src/plugin.ts) | mitigate | Path traversal risk: `rmSync` is scoped to `${projectDirectory}/.hivemind/event-tracker/` using `join(projectDirectory, ".hivemind", "event-tracker")`. The `projectDirectory` comes from OpenCode's `directory` plugin param (trusted). Sentinel file check prevents repeat execution. `{ recursive: true, force: true }` prevents error on missing dir. |
| T-CP-ST-03-02 | Denial of Service | One-shot migration | mitigate | Fire-and-forget — migration runs in void context, does not block plugin init. try/catch prevents crash. |
| T-CP-ST-03-03 | Information Disclosure | Documentation | accept | No PII or secrets in documentation files. Event-tracker path removal is public architectural info. |
</threat_model>

<verification>
**Pre-execute gate:** All 13 ACs must be verifiable via grep/find/typecheck commands.

**Post-execute verification sequence:**
```bash
# 1. TypeScript compilation
npm run typecheck

# 2. Structural checks (AC-01 through AC-09)
find src/task-management/journal/ -name "event-tracker" -type d | wc -l  # → 0 (AC-01)
find tests/lib/ -name "event-tracker" -type d | wc -l                    # → 0 (AC-09)
grep -r "event-tracker\|EventTracker" src/ --include="*.ts" -l | grep -v "event-tracker/" | grep -v "node_modules"  # should be empty (AC-02,03,04,05,06,07)
grep "createSessionJourneyEventObserver\|SessionJourneyEventFact" src/hooks/observers/event-observers.ts || echo "AC-04 PASS"

# 3. Full test suite
npm test  # All remaining tests pass (≥164 of 167, 2 pre-existing README failures acceptable)
```

**Known pre-existing failures (not CP-ST-03 regressions):**
- 2 README heading assertion tests (pre-existing, documented in ROADMAP.md)
</verification>

<success_criteria>
- [ ] Zero files under `src/task-management/journal/event-tracker/` — directory deleted
- [ ] Zero files under `tests/lib/event-tracker/` — directory deleted
- [ ] `src/index.ts` has no event-tracker export (AC-02)
- [ ] `src/plugin.ts` has zero dead commented event-tracker code (AC-03, AC-13)
- [ ] `event-observers.ts` has no `createSessionJourneyEventObserver` or `SessionJourneyEventFact` (AC-04)
- [ ] `session-tracker/index.ts` has no `removeLegacyStateFiles()` (AC-05)
- [ ] `readonly-state.ts` CANONICAL_PREFIXES has no event-tracker (AC-06)
- [ ] `structure.ts` TIER_1_DIRECTORIES has no event-tracker (AC-07)
- [ ] One-shot migration cleanup present in plugin.ts (AC-08)
- [ ] 8 test files edited — zero event-tracker references remain (AC-09, AC-10, AC-11)
- [ ] 6 documentation files updated (AC-12)
- [ ] `npm run typecheck` passes — zero event-tracker-related errors
- [ ] `npm test` passes — all remaining tests green (2 pre-existing README failures acceptable)
- [ ] Zero new dependencies added (AC-27)
</success_criteria>

<output>
After completion, create `.planning/phases/CP-ST-03-architecture-detox/CP-ST-03-01-SUMMARY.md`
</output>
