---
phase: 36
amendment_source: delegation-async-pty-lifecycle-audit-2026-04-30.md
severity: critical_override
author: hm-l1-coordinator
correction_note: |
  CORRECTED 2026-04-30: Original amendment incorrectly claimed CompletionDetector was "abandoned"
  and "never used" in lifecycle-manager.ts. Direct inspection shows CompletionDetector EXISTS
  in the worktree at src/lib/completion-detector.ts (127 LOC), is instantiated at
  lifecycle-manager.ts:73, fed events at lifecycle-manager.ts:124, and exposed via getter at
  lifecycle-manager.ts:203. The real issue is parallel adaptive polling in sdk-delegation.ts
  that duplicates/replaces CompletionDetector logic for SDK delegations.
---

# Phase 36: AUDIT AMENDMENT — Parallel Completion Detection Mechanisms Conflict

**Audit Date:** 2026-04-30 (corrected)
**Previous Status:** PENDING (depends on Phase 35)
**Amended Status:** **BLOCKED — DUAL COMPLETION DETECTION CAUSES CONFLICT**

---

## Corrected Audit Findings

Direct inspection of the worktree reveals that **CompletionDetector EXISTS and IS used**:

- **`src/lib/completion-detector.ts`** — 127 LOC, present in worktree, NOT from main repo
- **`lifecycle-manager.ts:73`** — `private readonly completionDetector = new CompletionDetector()`
- **`lifecycle-manager.ts:124`** — `this.completionDetector.feed("session.idle", sessionID)` — events ARE fed
- **`lifecycle-manager.ts:166`** — `this.completionDetector.cancel(sessionID)` — cancellation IS wired
- **`lifecycle-manager.ts:203-205`** — `getCompletionDetector(): CompletionDetector` — instance IS exposed

**However**, `src/lib/sdk-delegation.ts:146-201` has its OWN `performStabilityPoll()` with:
- `MIN_IDLE_TIME_MS` (5s)
- `MIN_STABILITY_TIME_MS` (10s)  
- `STABLE_POLLS_REQUIRED` (3 polls)
- `DEFAULT_STALE_TIMEOUT_MS` (45min)

**This creates TWO parallel completion detection mechanisms:**

| Mechanism | Location | Trigger | Coverage |
|-----------|----------|---------|----------|
| `CompletionDetector` | `lifecycle-manager.ts` | Event-driven (`session.idle`, etc.) | All sessions |
| `performStabilityPoll()` | `sdk-delegation.ts` | Adaptive polling loop | SDK delegations only |

**The problem:** For SDK delegations, `sdk-delegation.ts` does NOT use `CompletionDetector`. It uses its own polling-based stability detection that duplicates (and conflicts with) `CompletionDetector`'s design. `CompletionDetector` is fed events for all sessions but only command delegations (and non-SDK paths) benefit from it.

---

## Amended Requirements

### PH36-04-REVISED: Unify completion detection — remove adaptive polling from sdk-delegation.ts

**New Requirement:** Replace `sdk-delegation.ts` adaptive polling with `CompletionDetector` integration.

**Details:**
- Delete `performStabilityPoll()` in `sdk-delegation.ts:146-201`
- Delete `calculateAdaptiveInterval()` in `sdk-delegation.ts`
- Delete `MIN_IDLE_TIME_MS`, `MIN_STABILITY_TIME_MS`, `STABLE_POLLS_REQUIRED` constants from `sdk-delegation.ts`
- Wire SDK delegations to use `CompletionDetector` via `lifecycle-manager.ts`:
  - `session.idle` event → `completionDetector.feed()` → triggers `finalizeSdkDelegation()`
  - Message count stability → `completionDetector.feedMessageCount()` → triggers stability check
  - `DEFAULT_STALE_TIMEOUT_MS` → move to `CompletionDetector` constructor parameter

**Acceptance Criterion:**
- Single `CompletionDetector` instance handles ALL delegation completion detection
- SDK delegations finalize via `CompletionDetector` completion callback, not adaptive polling
- No `STABLE_POLLS_REQUIRED` counter or adaptive interval calculation in `sdk-delegation.ts`
- `CompletionDetector` tests cover SDK delegation paths

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/sdk-delegation.ts`, `src/lib/lifecycle-manager.ts`, `src/lib/completion-detector.ts`

---

### PH36-05-REVISED: Wire CompletionDetector completion callback to delegation finalization

**New Requirement:** The `CompletionDetector` instance in `lifecycle-manager.ts` must trigger delegation finalization.

**Current State:** `CompletionDetector` is fed events and cancels sessions, but there is NO completion callback that calls `delegationManager.finalize()` or similar.

**Details:**
- Add `onComplete` callback to `CompletionDetector` constructor or via setter
- Callback receives `{ signal, sessionID, error? }` 
- Lifecycle manager routes to `delegationManager.onTerminal(delegationId, signal, error)`
- SDK delegation handler receives terminal signal instead of polling

**Acceptance Criterion:**
- `CompletionDetector` completion callback is wired to actual delegation finalization
- `session.idle` → `CompletionDetector.feed()` → callback fires → `finalizeSdkDelegation()` runs
- No orphaned `CompletionDetector` instance (it IS used but not wired to finalization)

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/lifecycle-manager.ts`, `src/lib/completion-detector.ts`

---

### PH36-06: Normalize status models (UNCHANGED — still valid)

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

## What Was WRONG in Original Audit Routing

| Original Claim | Reality |
|---------------|---------|
| "CompletionDetector abandoned" | EXISTS at `src/lib/completion-detector.ts` (127 LOC) |
| "lifecycle-manager.ts never uses it" | Instantiated at :73, fed events at :124, exposed at :203 |
| "Worktree replaced it with untested polling" | Both exist in parallel; CompletionDetector handles events for all sessions, but sdk-delegation.ts has its own polling for SDK delegations only |
| "Must port from main repo" | Already present in worktree; needs to be wired to sdk-delegation.ts |

---

## Module Split Plan (Respecting 500 LOC Limit)

The worktree's `lifecycle-manager.ts` is 213 LOC (facade). The target should be:

1. **`src/lib/lifecycle-manager.ts`** (~250 LOC) — Orchestrator. Wires `CompletionDetector` to all delegation types.
2. **`src/lib/sdk-delegation.ts`** (~120 LOC) — Delete `performStabilityPoll()`, use `CompletionDetector` callback only.
3. **`src/lib/completion-detector.ts`** (~127 LOC) — Add `onComplete` callback mechanism.

---

## Verification Criteria (Corrected)

- [x] `CompletionDetector` exists in worktree `src/lib/` (127 LOC)
- [x] `lifecycle-manager.ts:73` instantiates `CompletionDetector`
- [x] `lifecycle-manager.ts:124` feeds events to `CompletionDetector`
- [ ] `sdk-delegation.ts` does NOT contain `performStabilityPoll()` or `calculateAdaptiveInterval()`
- [ ] `CompletionDetector` has `onComplete` callback wired to delegation finalization
- [ ] Single completion detection path for all delegation types
- [ ] All modules under 500 LOC
- [ ] Single canonical status enum (`DelegationStatus`) used in delegation flow
- [ ] Tests verify event-driven completion (not polling) for SDK delegations

---

## Cross-Phase Impact

| Phase | Impact |
|-------|--------|
| Phase 16.3 (Delegation Hardening) | Must use unified completion detection |
| Phase 46 (Delegation Truth) | Completion truth depends on single mechanism |
| Phase 48.1 (Runtime Correctness) | Must verify CompletionDetector callback fires for SDK delegations |
| Phase 37 (Result Harvesting) | Harvesting fires on CompletionDetector `onComplete` |

---

_Corrected: 2026-04-30_
_Priority: P0 CRITICAL — parallel completion detection causes race conditions and confusion_
