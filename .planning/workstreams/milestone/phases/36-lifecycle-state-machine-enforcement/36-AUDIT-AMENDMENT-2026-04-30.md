---
phase: 36
amendment_source: delegation-async-pty-lifecycle-audit-2026-04-30.md
severity: critical_override
author: hm-l1-coordinator
---

# Phase 36: AUDIT AMENDMENT — Dual-Signal Completion Detection is False

**Audit Date:** 2026-04-30
**Previous Status:** PENDING (depends on Phase 35)
**Amended Status:** **BLOCKED — CRITICAL GAP IN COMPLETION DETECTION**

---

## Audit Override

The 2026-04-30 comprehensive audit reveals that **the "dual-signal completion" claim in the worktree is false**:

- **Main repo** (`completion-detector.ts:1-124`): True two-signal design — terminal events (`session.idle`, `session.error`, `session.deleted`) AND message-count stability timer (`feedMessageCount()` + `stabilityTimeoutMs`). **Tested with 24 tests.**
- **Worktree** (`sdk-delegation.ts:146-201`): Multi-threshold adaptive polling loop — `MIN_IDLE_TIME_MS` (5s), `MIN_STABILITY_TIME_MS` (10s), `STABLE_POLLS_REQUIRED` (3 polls), `DEFAULT_STALE_TIMEOUT_MS` (45min). Calls itself "dual-signal" in comments but implements a **four-threshold polling loop**. **Zero tests.**
- **Worktree `lifecycle-manager.ts:73`**: Creates a `CompletionDetector` instance but **never uses it**. The lifecycle manager is a facade that delegates everything to `DelegationManager.dispatch()`.

**The worktree abandoned the simpler, tested `CompletionDetector` from the main repo and replaced it with an untested, more complex polling system.**

---

## Amended Requirements

### PH36-04: Replace worktree adaptive polling with main repo CompletionDetector

**New Requirement:** Port the main repo's `CompletionDetector` (event-driven, two-signal) to replace the worktree's `SdkDelegationHandler` adaptive polling.

**Details:**
- Delete `calculateAdaptiveInterval()` in `sdk-delegation.ts`
- Delete `MIN_IDLE_TIME_MS`, `MIN_STABILITY_TIME_MS`, `STABLE_POLLS_REQUIRED` constants
- Wire `session.idle`, `session.error`, `session.deleted` events to `CompletionDetector.feed()`
- Wire message count changes to `CompletionDetector.feedMessageCount()`
- Use stability timer (not poll count) as the second signal

**Acceptance Criterion:**
- Completion is declared when BOTH signals fire: (1) terminal event received OR session disappears, AND (2) message count stable for `stabilityTimeoutMs`
- No adaptive polling intervals
- No `STABLE_POLLS_REQUIRED` counter
- Behavior matches main repo `completion-detector.ts` tests (port tests too)

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/sdk-delegation.ts`, `src/lib/lifecycle-manager.ts`, `src/lib/completion-detector.ts` (port from main repo)

---

### PH36-05: Wire orphaned CompletionDetector in lifecycle-manager.ts

**New Requirement:** The `CompletionDetector` instance created at `lifecycle-manager.ts:73` must be fed events.

**Details:**
- Event observer must route `session.idle`, `session.error`, `session.deleted` to `completionDetector.feed(eventType)`
- Message count observer must route `feedMessageCount(currentCount)` on each poll
- `CompletionDetector` completion callback must trigger delegation finalization

**Acceptance Criterion:** `lifecycle-manager.ts` uses its own `CompletionDetector` instance instead of delegating all completion logic to `DelegationManager`.

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/lifecycle-manager.ts`

---

### PH36-06: Normalize status models

**New Requirement:** The worktree has 4 overlapping status enums. Consolidate to one.

**Current State:**
- `HarnessStatus` (8 values) in `types.ts`
- `DelegationStatus` (5 values: `dispatched`, `running`, `completed`, `error`, `timeout`)
- `SessionLifecyclePhase` (6 values) 
- `DelegationPacketStatus` (4 values: `pending`, `running`, `completed`, `failed`)

**Required Action:**
- Delete `HarnessStatus` — unused or redundant
- Delete `DelegationPacketStatus` — redundant with `DelegationStatus`
- Use `DelegationStatus` (5 values) as the **canonical runtime status**
- Map to `SessionLifecyclePhase` (6 values) **only** for continuity records

**Acceptance Criterion:** Single status enum used throughout delegation flow. No confusion between "packet status" and "delegation status".

**Priority:** P1 HIGH

**Affected Files:** `src/lib/types.ts:123-168`, all consumers

---

## Amended Context

**Previous CONTEXT.md:**
```
- `src/lib/lifecycle-manager.ts` (~152 LOC stub)
- `src/lib/delegation-manager.ts` (~656 LOC — needs split)
```

**Amended:**
```
- `src/lib/lifecycle-manager.ts` (~152 LOC stub) — MUST use its CompletionDetector instance
- `src/lib/delegation-manager.ts` (~656 LOC — needs split) — MUST extract background-observer.ts
- `src/lib/completion-detector.ts` (port from main repo — 124 LOC, tested)
- `src/lib/sdk-delegation.ts` (~161 LOC) — MUST delete adaptive polling, use CompletionDetector
```

---

## Module Split Plan (Respecting 500 LOC Limit)

The main repo's `lifecycle-manager.ts` is 706 LOC (exceeds limit). The worktree's is 213 LOC (facade). The merged target should be:

1. **`src/lib/lifecycle-manager.ts`** (~200 LOC) — Orchestrator only. Delegates to sub-modules.
2. **`src/lib/background-observer.ts`** (~150 LOC NEW) — Event routing + `CompletionDetector` wiring
3. **`src/lib/recovery-manager.ts`** (~150 LOC NEW) — Session recovery logic extracted from lifecycle-manager
4. **`src/lib/notification-scheduler.ts`** (~100 LOC NEW) — Parent notification scheduling
5. **`src/lib/completion-detector.ts`** (~124 LOC) — Port from main repo as-is

---

## Verification Criteria (Added)

- [ ] `CompletionDetector` from main repo is present in worktree `src/lib/`
- [ ] `sdk-delegation.ts` does NOT contain `calculateAdaptiveInterval()` or `MIN_IDLE_TIME_MS`
- [ ] `lifecycle-manager.ts:73` CompletionDetector instance is wired to events
- [ ] All modules under 500 LOC
- [ ] Single canonical status enum (`DelegationStatus`) used in delegation flow
- [ ] 24+ tests ported from main repo `completion-detector.test.ts`
- [ ] New integration tests verify event-driven completion (not polling)

---

## Cross-Phase Impact

| Phase | Impact |
|-------|--------|
| Phase 16.3 (Delegation Hardening) | Must use normalized status model |
| Phase 46 (Delegation Truth) | Completion truth depends on this fix |
| Phase 48.1 (Runtime Correctness) | Must verify two-signal, not adaptive polling |
| Phase 37 (Result Harvesting) | Harvesting fires on CompletionDetector completion |

---

_Amended: 2026-04-30_
_Priority: P0 CRITICAL — completion detection is core to all delegation behavior_
