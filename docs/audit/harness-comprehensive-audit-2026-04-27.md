# HiveMind V3 Harness — Comprehensive Production Audit

**Date:** 2026-04-27
**Scope:** Full codebase — 68 TypeScript files, 11,980 LOC, 907 tests (all passing)
**Auditor:** Coordinator-orchestrated 5 parallel specialist subagents
**Methodology:** SCAN-mode investigation across 15 audit dimensions

---

## Executive Summary

### Overall Verdict: **FUNCTIONAL WITH KNOWN GAPS — NOT PRODUCTION-HARDENED**

The harness is architecturally sound, feature-rich (9/10 advertised features implemented), and has excellent code discipline (93% error prefix compliance, zero barrel imports, proper deep-clone-on-read). However, it carries **8 CRITICAL findings** and **31 WARNING findings** that must be addressed before production deployment.

### Severity Distribution

| Severity | Count | Impact |
|----------|-------|--------|
| CRITICAL | 8 | Broken functionality, data corruption risk, or complete test gap |
| WARNING | 31 | May cause failures under load, edge cases, or concurrent access |
| INFO | 39 | Improvement opportunities, documentation gaps |

### Top-Line Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total LOC | 11,980 | ~4,000-5,000 | ⚠️ 2.4x over target |
| Test count | 907 (all pass) | — | ✅ Green |
| Files > 500 LOC | 1 | 0 | ❌ 1 violation |
| Circular deps | 1 | 0 | ❌ 1 violation |
| Feature completeness | 9/10 | 10/10 | ⚠️ Category system partial |
| Hook test coverage | 0% | 100% | ❌ Zero tests for hooks |
| [Harness] error prefix | 93% | 100% | ⚠️ 3 violations |

---

## CRITICAL Findings (Must Fix Before Production)

### C-1: Circular Dependency — `cross-primitive-validator.ts` ↔ `runtime-validator.ts`
- **File:** `src/lib/cross-primitive-validator.ts:5` → `src/lib/runtime-validator.ts:10`
- **Evidence:** `cross-primitive-validator.ts` imports `validateRuntime` from `runtime-validator.ts`. `runtime-validator.ts` imports `PrimitiveMap` type from `cross-primitive-validator.ts`.
- **Impact:** Circular imports can cause undefined bindings at runtime, especially with ES module loading order.
- **Fix:** Extract shared `PrimitiveMap` type to `types.ts` (leaf module) to break the cycle.

### C-2: LOC Budget Violation — `event-tracker/writer.ts` at 578 LOC
- **File:** `src/lib/event-tracker/writer.ts`
- **Evidence:** 578 lines, exceeds 500 LOC max by 78 lines (15.6% over).
- **Impact:** Module complexity makes maintenance and testing harder.
- **Fix:** Split writer from rotation/cleanup logic into separate module.

### C-3: Cross-Model State Machine Inconsistency
- **File:** `src/lib/lifecycle-manager.ts:53` vs `src/lib/task-status.ts:5`
- **Evidence:** `lifecycle-manager.ts` allows `queued→completed` transition but `task-status.ts` only allows `queued→[running, failed, cancelled]`. Three overlapping status models (TaskStatus 8-val, SessionLifecyclePhase 6-val, DelegationStatus 5-val) have inconsistent transition rules.
- **Impact:** Delegation could reach a state that TaskStatus cannot represent, causing undefined behavior.
- **Fix:** Establish canonical authority (TaskStatus) and derive other models from it. Enforce transitions through a single validation function.

### C-4: CompletionDetector Arguments Swapped in Lifecycle Manager
- **File:** `src/lib/lifecycle-manager.ts:123`
- **Evidence:** `CompletionDetector.feed()` signature is `feed(eventType: string, sessionID: string | undefined)` but lifecycle-manager calls `feed(sessionID, 'idle')` — sessionID is passed where eventType is expected, 'idle' is passed where sessionID is expected. The TERMINAL_EVENTS lookup will never match a UUID, so the feed becomes a no-op.
- **Impact:** The lifecycle-manager's idle-detection shortcut is effectively dead code. This does NOT affect delegation completion (sdk-delegation.ts has independent polling), but it means the lifecycle manager cannot detect idle sessions via CompletionDetector.
- **Fix:** Swap arguments to `feed('idle', sessionID)` or `feed('session.idle', sessionID)`.

### C-5: Transition Guards Unenforced in Core State Machines
- **File:** `src/lib/delegation-manager.ts:152,345`
- **Evidence:** `canTransition()` exists in task-status.ts but is NEVER called by delegation-manager.ts or lifecycle-manager.ts. Status mutations are direct property assignments (`delegation.status = 'running'`) without guard validation. Two concurrent callers (safety ceiling + stability poll) can race past the check.
- **Impact:** Double-completion of delegations is theoretically possible if two async paths race.
- **Fix:** Enforce `canTransition()` before every status mutation. Add compare-and-swap pattern.

### C-6: No Session Cleanup/Disposal Hook
- **File:** `src/hooks/create-session-hooks.ts:124`
- **Evidence:** `autoLoopStates` Map grows unboundedly — entries only deleted on completion signal or exhaustion. No hook for session.deleted or session cleanup. If a session ends without either, the entry leaks permanently.
- **Impact:** Memory leak in long-running processes (e.g., 24h session).
- **Fix:** Add session cleanup hook that clears autoLoopStates, state.ts maps, and delegation maps on session end.

### C-7: Zero Test Coverage for `continuity.ts` (433 LOC Persistence Backbone)
- **File:** `src/lib/continuity.ts`
- **Evidence:** No `tests/lib/continuity.test.ts` exists. This is the single most critical persistence module (durable JSON state, atomic writes, deep cloning).
- **Impact:** Regressions in persistence logic will go undetected. No validation of corrupt-file handling, atomic write failures, or migration paths.
- **Fix:** Create comprehensive test suite covering: read/write cycles, corrupt file recovery, concurrent access, migration, deep-clone verification.

### C-8: Zero Test Coverage for ALL Hooks (4 files)
- **Files:** `src/hooks/create-core-hooks.ts`, `create-session-hooks.ts`, `create-tool-guard-hooks.ts`, `hooks/types.ts`
- **Evidence:** No `tests/hooks/` directory exists. 4 hook files (~555 LOC combined) are completely untested.
- **Impact:** Hook regressions (incorrect event routing, missing sessionID extraction, CQRS violations) will go undetected.
- **Fix:** Create `tests/hooks/` directory with tests for each hook factory. Mock OpenCode client, verify event processing, error boundaries, and state mutations.

---

## WARNING Findings (Should Fix Before Scaling)

### Production Readiness (7 warnings)

| ID | File | Issue |
|----|------|-------|
| W-1 | `delegation-manager.ts:154` | Swallowed error in `dispatch()` — bare `catch {}` loses error context |
| W-2 | `delegation-manager.ts:328` | Swallowed error in `handleSafetyCeiling()` — abort failure silently ignored |
| W-3 | `notification-handler.ts:241` | Swallowed error in `notifyParentSession()` — no logging |
| W-4 | `command-delegation.ts:284` | Headless child processes NOT killed on cleanup — process leak |
| W-5 | `sdk-delegation.ts:210` | Failed `messages()` during finalization leaves child session running |
| W-6 | `delegation-manager.ts:320` | `void this.handleSafetyCeiling()` — unhandled rejection possible |
| W-7 | `plugin.ts:10-32` | Static imports — any single module failure crashes entire plugin |

### Architecture (6 warnings)

| ID | File | Issue |
|----|------|-------|
| W-8 | Dependency depth | Max chain = 6 levels (vs 2 stated in AGENTS.md) |
| W-9 | `delegation-manager.ts` | Imports 12 modules — highest coupling among business modules |
| W-10 | `delegation-manager.ts` | Directly imports 5 spawner internals — should use facade |
| W-11 | `create-core-hooks.ts:73` | CQRS violation: hook calls `patchSessionContinuity()` (write from read-side) |
| W-12 | `types.ts` (493 LOC) | Within 1.4% of 500 LOC limit |
| W-13 | `delegation-manager.ts` (494 LOC) | Within 1.2% of 500 LOC limit |

### Lifecycle (7 warnings)

| ID | File | Issue |
|----|------|-------|
| W-14 | `task-status.ts:13` | `interrupt` state is non-terminal with no timeout — orphaned tasks possible |
| W-15 | `sdk-delegation.ts:138` | Null message count → indefinite polling until safety ceiling (up to 45 min) |
| W-16 | `delegation-manager.ts:141-152` | Crash window between dispatched/running states |
| W-17 | `delegation-manager.ts:390-394` | Grace period cleanup is memory-only — delegation ghosts on restart |
| W-18 | `create-session-hooks.ts:135` | Only processes `session.idle` — ignores created/error/deleted |
| W-19 | `create-core-hooks.ts:81` | No session ownership validation — processes events from non-harness sessions |
| W-20 | `sdk-delegation.ts:160` | Dual-signal degrades to single-signal (stale timeout) if child stays busy |

### E2E & Features (6 warnings)

| ID | File | Issue |
|----|------|-------|
| W-21 | `types.ts:29` | Category system is PARTIAL — labels only, no agent profile presets |
| W-22 | `create-core-hooks.ts:97` | `system.transform` is empty stub (stripped Phase 14-01) |
| W-23 | `create-core-hooks.ts:105` | `chat.system.transform` is no-op stub |
| W-24 | `create-core-hooks.ts:112` | `messages.transform` is pass-through (stripped Phase 35) |
| W-25 | `index.ts` | `DelegationManager` not exported — limits extensibility |
| W-26 | `index.ts` | Wildcard exports may expose internal implementation details |

### Anti-Patterns (5 warnings)

| ID | File | Issue |
|----|------|-------|
| W-27 | `sdk-delegation.ts:86` | Magic number 5000ms (recovery timeout) |
| W-28 | `sdk-delegation.ts:58` | Magic numbers 30000/300000 (adaptive polling thresholds) |
| W-29 | `sdk-delegation.ts:86,92` | Missing `[Harness]` prefix on 2 error messages |
| W-30 | `session-journal.ts:88` | No file locking for concurrent JSONL writes |
| W-31 | `notification-handler.ts` | Zero test coverage for 298 LOC notification module |

---

## Feature Completeness Matrix

| Feature | Status | Evidence |
|---------|--------|----------|
| Background agents | ✅ IMPLEMENTED | DelegationManager + SDK/command dispatch |
| Auto-loop / ralph-loop | ✅ IMPLEMENTED | create-session-hooks, configurable iterations |
| WaiterModel delegation | ✅ IMPLEMENTED | Always-background, immediate return with ID |
| Dual-signal completion | ✅ IMPLEMENTED | CompletionDetector + stability polling |
| Task queuing | ✅ IMPLEMENTED | Keyed semaphore with FIFO + priority |
| Category system | ⚠️ PARTIAL | Labels only, no agent profile presets |
| Session recovery | ✅ IMPLEMENTED | recoverPending() + hydration from persistence |
| PTY integration | ✅ IMPLEMENTED | Lazy-loaded bun-pty with headless fallback |
| Circuit breaker | ✅ IMPLEMENTED | Repeated signature detection in tool guard hooks |
| Tool budget limits | ✅ IMPLEMENTED | maxToolCallsPerSession with per-session override |
| Config workflow (8-turn) | ✅ IMPLEMENTED | src/lib/config-workflow/ |
| Event tracker | ✅ IMPLEMENTED | src/lib/event-tracker/ with JSONL + rotation |
| Session journal | ✅ IMPLEMENTED | Append-only JSONL with idempotency |
| Schema kernel | ✅ IMPLEMENTED | 9 Zod schemas in src/schema-kernel/ |
| Primitive loader | ✅ IMPLEMENTED | src/lib/primitive-loader.ts |

---

## What's Working Well

1. **Error Discipline**: 93% [Harness] prefix compliance, structured error propagation
2. **Type Safety**: Only 1 `as any` cast in entire codebase, `import type` consistently used
3. **Import Hygiene**: Zero barrel imports, proper module boundaries
4. **Deep-Clone-on-Read**: 6 dedicated clone functions in continuity.ts — no internal state leaked
5. **Security Surface**: No eval/exec/Function, category whitelisting, depth bounding, spawn (not exec)
6. **Resource Cleanup**: Timer cleanup is thorough across all exit paths
7. **Test Suite**: 907 tests all green, including 93 delegation-manager tests
8. **Atomic Writes**: continuity.ts uses tmp+rename pattern for corruption protection
9. **PTY Degradation**: Dynamic import with graceful fallback to headless
10. **Semaphore Quality**: FIFO queue, idempotent release, per-key isolation

---

## Architecture Drift vs Specification

The codebase has grown beyond its original architecture proposal:

| Aspect | Proposal | Actual | Status |
|--------|----------|--------|--------|
| Total LOC | 4,000-5,000 | 11,980 | ⚠️ 2.4x over |
| Tool count | 5 | 9 | ✅ More feature-rich |
| Hook count | Not specified | 10 (3 stubs) | ⚠️ 3 stubs |
| Dependency depth | 2 levels max | 6 levels actual | ❌ Exceeded |
| Circular deps | None | 1 pair | ❌ Violation |
| CLI substrate | ~500 LOC | Not implemented | ⚠️ Missing |

---

## Remediation Priority Order

### Phase 1: Critical (Must fix before any production use)
1. Fix swapped arguments in `lifecycle-manager.ts:123` (C-4)
2. Add test coverage for `continuity.ts` (C-7)
3. Add test coverage for hooks (C-8)
4. Break circular dependency `cross-primitive-validator` ↔ `runtime-validator` (C-1)
5. Enforce `canTransition()` guards in delegation-manager (C-5)
6. Resolve cross-model state machine inconsistency (C-3)
7. Add session cleanup hook (C-6)
8. Split `event-tracker/writer.ts` to ≤500 LOC (C-2)

### Phase 2: Warning (Fix before scaling)
9. Kill headless child processes on cleanup (W-4)
10. Log swallowed errors in delegation-manager (W-1, W-2, W-3)
11. Abort child session on messages() failure (W-5)
12. Add `.catch()` to void-fire-and-forget (W-6)
13. Fix missing [Harness] prefixes (W-29)
14. Extract magic numbers to constants (W-27, W-28)

### Phase 3: Improvement (Fix when convenient)
15. Facade spawner imports in delegation-manager (W-10)
16. Address CQRS violation in create-core-hooks.ts (W-11)
17. Restore system.transform stubs (W-22, W-23, W-24)
18. Export DelegationManager selectively (W-25)
19. Add notification-handler tests (W-31)
20. Add runtime.ts tests

---

## Honest Assessment

**This harness is a solid engineering artifact with genuine production concerns.** The feature set is comprehensive (15 of 15 major features implemented or partially implemented), the code discipline is high (strict TypeScript, proper cloning, atomic writes), and the test suite is extensive (907 tests).

However, the **8 CRITICAL findings represent real risks**:
- The swapped CompletionDetector arguments (C-4) are a genuine bug that makes the lifecycle idle-detection path dead code
- The missing continuity.ts tests (C-7) mean the persistence backbone is unvalidated
- The unenforced transition guards (C-5) could cause double-completion under concurrent access
- The circular dependency (C-1) could cause runtime loading failures

The codebase has also grown significantly beyond its original scope (11,980 LOC vs 4,000-5,000 target), which has led to architectural drift (6-level dependency chains, coupling concerns).

**Recommendation**: Fix all 8 CRITICAL findings before any production deployment. The WARNING findings should be addressed in a prioritized follow-up phase. The architecture proposal needs updating to reflect the actual scope.
