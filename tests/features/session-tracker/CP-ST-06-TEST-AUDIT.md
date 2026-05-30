# CP-ST-06 Test Audit Matrix

**Created:** 2026-05-16
**Baseline:** 38 test files, 8 failed / 30 passed. 25 failed tests / 362 passed tests.
**Scope:** All session-tracker test files audited per GA-3 (individual audit, no bulk delete).

---

## Legend

| Disposition | Meaning |
|---|---|
| **keep** | Test passes, asserts correct behavior, no rewrite needed |
| **rewrite** | Test asserts wrong/stale behavior; rewrite to match source + GA decisions |
| **delete** | Test is entirely stale (mock rot, tests code that was removed) |
| **future** | Test is for planned-but-not-yet-built code (retry-queue, etc.) |

---

## Section A: Failing Test Files (8 files, 25 failing tests)

### A1. `persistence/hierarchy-index.test.ts` — 2 failures

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 1 | `getRootMain() > should resolve root correctly when registering reverse order` | RC-2: getRootMain returns `ses_level1` instead of `ses_root` when registered child→root | **rewrite** | Source bug — reverse-order registration loses root tracking. Fix source, then verify test passes. |
| 2 | `getDepth() > should preserve L3 delegation depth without capping at L2` | RC-1: getDepth caps at 2, test expects 3. BUT GA-2 locks max depth at L2. | **rewrite** | Change expectation to `toBe(2)` per GA-2. L3 was superseded. Source is correct, test expectation is wrong. |

### A2. `persistence/child-writer.test.ts` — 1 failure

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 3 | `updateChildStatus > handles non-existent child file gracefully (queue swallows errors)` | RC-5: ENOENT on missing child file. Child-writer write queue silently swallows. | **rewrite** | After GA-1 retry-queue lands, this should propagate to retry/error surface, not silently swallow. Rewrite to expect error propagation or retry. |

### A3. `persistence/session-index-writer.test.ts` — 1 failure

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 4 | `updateChildStatus > should update nested child status in root-owned hierarchy` | RC-2: TypeError — `l1.children["ses_l2child..."]` is undefined. Mock-based test, nested structure not populated. | **rewrite** | Rewrite with real filesystem (tempProjectRoot pattern). Source `updateChildStatus` needs recursive/root-owned hierarchy fix. |

### A4. `ensure-session-ready-classification.test.ts` — 5 failures

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 5 | `ensureSessionReady does NOT query SDK for parentID (classification removed)` | RC-3: Test expects classification removed from ensureSessionReady. Source still has classification logic. | **rewrite** | After RC-3 fix (classification moved before ensureSessionReady), this test should verify ensureSessionReady receives pre-classified result. |
| 6 | `ensureSessionReady does NOT check hierarchyIndex for child classification` | RC-3: Same as #5 — hierarchy check still in ensureSessionReady. | **rewrite** | Verify classification gate removed from ensureSessionReady body. |
| 7 | `ensureSessionReady does NOT check pendingRegistry for child classification` | RC-3: Same as #5 — pending check still in ensureSessionReady. | **rewrite** | Verify pending gate removed from ensureSessionReady body. |
| 8 | `ensureSessionReady creates directory for root main session when caller classified it` | RC-3: Test expects ensureSessionReady to trust caller's classification. Source doesn't. | **rewrite** | After refactor, ensureSessionReady should be classification-agnostic — just create dir for "main" sessions. |
| 9 | `handleChatMessage routes child sessions to childWriter, not ensureSessionReady` | RC-3: Routing logic not yet in source. | **rewrite** | Verify handleChatMessage routes to childWriter when classification says child. |

### A5. `session-tracker.test.ts` — 5 failures

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 10 | `F-02 — lazy bootstrap > should create directory for main sessions via lazy bootstrap (parentID null)` | RC-3: Test uses mock SDK returning parentID=null. Source bootstrap path changed. | **rewrite** | Rewrite with real temp filesystem + mock SDK. Verify lazy bootstrap creates dir only when classification=main. |
| 11 | `parentID gate — SDK failure fallback > should treat session as main when SDK call fails (conservative fallback)` | RC-3: SDK failure fallback path in source doesn't match test expectation. | **rewrite** | Conservative fallback: if SDK fails, classify as main. Verify with real temp fs. |
| 12 | `idempotency > should not bootstrap the same session twice` | RC-3: Bootstrap idempotency guard not matching test mock structure. | **rewrite** | Rewrite with real filesystem, verify only one dir creation even with multiple calls. |
| 13 | `F-05 — child session routing > should route child session chat messages to childWriter.appendChildTurn` | RC-3: handleChatMessage routing not matching mock expectations. | **rewrite** | Rewrite to verify child routing with real child-writer instance. |
| 14 | `F-05 — child session routing > should route main session chat messages to messageCapture (unchanged)` | RC-3: handleChatMessage main routing path. | **rewrite** | Rewrite to verify main routing with real message capture. |
| 15 | `F-05 — child session routing > should fallback to main session when SDK call fails (conservative)` | RC-3: SDK failure in child routing. | **rewrite** | Conservative: SDK fail → treat as main → route to messageCapture. |

### A6. `index.test.ts` — 6 failures

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 16 | `handleToolExecuteBefore() > should register child in HierarchyIndex and update pending registry on discovery` | RC-3: Tool execute hook child registration. 3s timeout suggests async mock issue. | **rewrite** | Rewrite with real HierarchyIndex (temp filesystem). Verify child registration + pending update. |
| 17 | `handleChatMessage — classify BEFORE ensureSessionReady > should NOT call ensureSessionReady when SDK reports parentID (Gate 1 child)` | RC-3: Classification-before-I/O pattern not matching mock structure. | **rewrite** | Verify Gate 1 (SDK parentID) skips ensureSessionReady. Use real classification instance. |
| 18 | `handleChatMessage — classify BEFORE ensureSessionReady > should NOT call ensureSessionReady when HierarchyIndex detects child (Gate 2)` | RC-3: Gate 2 not matching. | **rewrite** | Verify Gate 2 (hierarchy) skips ensureSessionReady. |
| 19 | `handleChatMessage — classify BEFORE ensureSessionReady > should NOT call ensureSessionReady when PendingDispatchRegistry detects child (Gate 3)` | RC-3: Gate 3 not matching. | **rewrite** | Verify Gate 3 (pending) skips ensureSessionReady. |
| 20 | `handleChatMessage — classify BEFORE ensureSessionReady > should call ensureSessionReady for main sessions (no parent, no hierarchy, no pending)` | RC-3: Main session path. | **rewrite** | Verify all 3 gates fail → ensureSessionReady called. |
| 21 | `ensureSessionReady — root-only directory creation > should create directory for a main session (no parent, not child, no pending)` | RC-3: Directory creation for main. | **rewrite** | Rewrite with real temp filesystem. |
| 22 | `ensureSessionReady — root-only directory creation > should create directory when all three gates fail (root main session)` | RC-3: All gates fail fallback. | **rewrite** | Rewrite with real temp filesystem, verify dir created. |

### A7. `integration/cleanup.test.ts` — 2 failures

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 23 | `Legacy cleanup > removes .json and .md files from .hivemind/event-tracker/` | Stale: cleanup logic changed, test expects old file patterns. | **rewrite** | Rewrite with real temp filesystem containing fixture files. Verify cleanup removes correct files. |
| 24 | `Legacy cleanup > does not remove event-tracker source code directory` | Stale: directory guard not matching source. | **rewrite** | Rewrite to verify source code directory is preserved during cleanup. |

### A8. `integration/pipeline.test.ts` — 1 failure

| # | Test Name | Root Cause | Disposition | Notes |
|---|-----------|------------|-------------|-------|
| 25 | `F-06: Turn counter seeding > should seed turn counter from existing .md and continue from next turn` | Timing: 421ms test, may have race condition or stale fixture format. | **rewrite** | Rewrite with deterministic temp filesystem fixture. Seed .md with known turns, verify counter starts from next. |

---

## Section B: Passing Test Files (30 files) — Spot Audit

### B1. Capture Layer (6 files) — All Pass

| # | File | Tests | Disposition | Notes |
|---|------|-------|-------------|-------|
| 26 | `capture/event-capture-child.test.ts` | pass | **keep** | Child event capture, real fs |
| 27 | `capture/event-capture-classification-first.test.ts` | pass | **keep** | Classification-first pattern |
| 28 | `capture/event-capture-compaction.test.ts` | pass | **keep** | Compaction logic |
| 29 | `capture/event-capture.test.ts` | pass | **keep** | Core event capture |
| 30 | `capture/message-capture.test.ts` | pass | **keep** | Message capture |
| 31 | `capture/tool-capture-child.test.ts` | pass | **keep** | Child tool capture |

### B2. Hooks & Routing (1 file) — All Pass

| # | File | Tests | Disposition | Notes |
|---|------|-------|-------------|-------|
| 32 | `hooks/session-classification-hook.test.ts` | pass | **keep** | Hook wiring |

### B3. Journey Recording (2 files) — All Pass

| # | File | Tests | Disposition | Notes |
|---|------|-------|-------------|-------|
| 33 | `journey-recording-child.test.ts` | pass | **keep** | Child journey |
| 34 | `journey-recording-routing.test.ts` | pass | **keep** | Journey routing |

### B4. Persistence Layer (8 files) — 6 Pass, 2 Failed (covered above)

| # | File | Tests | Disposition | Notes |
|---|------|-------|-------------|-------|
| 35 | `persistence/atomic-write.test.ts` | pass | **keep** | Atomic write utility |
| 36 | `persistence/child-writer-depth-journey.test.ts` | pass | **keep** | Depth journey |
| 37 | `persistence/hierarchy-manifest.test.ts` | pass | **keep** | Manifest read/write |
| 38 | `persistence/orphan-quarantine.test.ts` | pass | **keep** | Orphan handling |
| 39 | `persistence/pending-dispatch-registry.test.ts` | pass | **keep** | Pending registry |
| 40 | `persistence/project-index-writer-recovery.test.ts` | pass | **keep** | Recovery |
| 41 | `persistence/project-index-writer.test.ts` | pass | **keep** | Project index |
| 42 | `persistence/session-writer.test.ts` | pass | **keep** | Session writer (note: RC-4 lastMessage coverage gap — new tests in Task 3) |

### B5. Integration Layer (5 files) — 3 Pass, 2 Failed (covered above)

| # | File | Tests | Disposition | Notes |
|---|------|-------|-------------|-------|
| 43 | `integration/concurrency.test.ts` | pass | **keep** | Concurrency patterns |
| 44 | `integration/e2e-verification.test.ts` | pass | **keep** | E2E verification |
| 45 | `integration/fork-handling.test.ts` | pass | **keep** | Fork handling |
| 46 | `integration/hook-wiring.test.ts` | pass | **keep** | Hook wiring |
| 47 | `integration/recovery-integration.test.ts` | pass | **keep** | Recovery integration |

### B6. Other Passing Files (7 files)

| # | File | Tests | Disposition | Notes |
|---|------|-------|-------------|-------|
| 48 | `orphan-cleanup-preserve.test.ts` | pass | **keep** | Orphan cleanup preserve |
| 49 | `tool-capture.test.ts` | pass | **keep** | Tool capture |
| 50 | `tools/tool-safety.test.ts` | pass | **keep** | Tool safety |
| 51 | `transform/agent-transform.test.ts` | pass | **keep** | Agent transform |
| 52 | `transform/schema-normalizer.test.ts` | pass | **keep** | Schema normalizer |
| 53 | `types.test.ts` | pass | **keep** | Type guards |
| 54 | `recovery/session-recovery.test.ts` | pass | **keep** | Session recovery |

---

## Section C: New Tests To Create (Tasks 2 & 3)

These are TDD RED tests — they assert behavior that doesn't exist yet.

| # | File | Target RC/GA | Tests | Phase |
|---|------|-------------|-------|-------|
| 55 | `integration/default-sub.test.ts` | RC-3 (default→sub classification) | 4+ tests: verify default sub from SDK, hierarchy, pending; fallback to main | Task 2 |
| 56 | `persistence/retry-queue.test.ts` | GA-1 (retry queue) | 5+ tests: enqueue, retry with backoff, max 5x, mark degraded, flush | Task 2 |
| 57 | `integration/parallel-children.test.ts` | GA-5 (parallel children safe) | 4+ tests: concurrent register, concurrent write, no data loss, hierarchy consistent | Task 3 |
| 58 | `integration/last-message.test.ts` | RC-4 (lastMessage metadata) | 4+ tests: main lastMessage, child lastMessage, nested lastMessage, missing field graceful | Task 3 |

---

## Summary

| Category | Count | Disposition Breakdown |
|---|---|---|
| Failing tests (Section A) | 25 | 0 keep, 25 rewrite, 0 delete, 0 future |
| Passing tests (Section B) | ~337 | 337 keep, 0 rewrite, 0 delete, 0 future |
| New tests (Section C) | 17+ | 0 keep, 0 rewrite, 0 delete, 17+ future (TDD RED) |
| **Total audit rows** | **58** | |

### Root Cause Distribution (Failing Tests)

| Root Cause | Affected Tests | Fix Required |
|---|---|---|
| RC-1 (getDepth cap) | 1 | Change expectation to L2 (GA-2) |
| RC-2 (getRootMain reverse + nested TypeError) | 2 | Fix source getRootMain + rewrite test with real fs |
| RC-3 (classification routing) | 19 | Rewrite all to use real filesystem + real classifier |
| RC-4 (lastMessage) | 0 failing (coverage gap) | New tests in Task 3 |
| RC-5 (error swallowing) | 1 | Rewrite after GA-1 retry-queue |
| Stale fixtures | 3 | Rewrite with deterministic temp fs |

### No Deletions

Per GA-3, no test is deleted. All 25 failing tests are rewritten to match source + GA decisions.
All 30 passing test files are kept unchanged.
