---
phase: CP-PTY-03-agent-subagent-background-task-coordination
status: ready
created: 2026-05-08
updated: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred
depends_on:
  - CP-PTY-02-sdk-session-delegation-integration
  - BOOT-08-agent-skill-integration
allowed_surfaces_when_authorized:
  - src/lib/delegation-manager.ts
  - src/lib/completion-detector.ts
  - src/lib/lifecycle-manager.ts
  - src/lib/notification-handler.ts
  - src/lib/concurrency.ts
  - src/hooks/**
  - tests/**
blocked_surfaces:
  - src/tools/**
  - src/plugin.ts
  - src/schema-kernel/**
  - .opencode/**
  - .hivemind/**
---

# CP-PTY-03 Agent/Subagent Background Task Coordination

## Goal

Validate lifecycle-aware coordination between agents, subagents, and background tasks through comprehensive test coverage — covering wave-based dispatch, completion-looping guardrails, queue management, cascade cleanup, and session recovery detection.

## Rationale

CP-PTY-01 (command-process) and CP-PTY-02 (SDK session delegation) establish the primitives. This phase **tests** the coordination layer: how agents dispatch subagents in waves, how background tasks participate in completion detection, how queue-key validation prevents duplicate work, and how lifecycle events propagate across parent-child delegation chains. The implementation already exists in `delegation-manager.ts`, `completion-detector.ts`, `concurrency.ts`, and `lifecycle-manager.ts` — this phase closes the test-coverage gaps.

## High-Level Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| CPPTY03-AC-01 | Wave-based dispatch: N child tasks dispatched in parallel, results collected. | `npx vitest run tests/lib/delegation-manager-wave.test.ts` |
| CPPTY03-AC-02 | Completion-looping: notification-first + polling fallback + stability timer. | `npx vitest run tests/lib/completion-looping-guardrails.test.ts` |
| CPPTY03-AC-03 | Queue-key validation: duplicate dispatch prevented for same logical work unit. | `npx vitest run tests/lib/concurrency-dedup.test.ts` |
| CPPTY03-AC-04 | Lifecycle cascade: parent abort → child sessions cleaned up. | `npx vitest run tests/lib/lifecycle-cascade.test.ts` |
| CPPTY03-AC-05 | Session recovery: stale delegation state detected and surfaced honestly. | `npx vitest run tests/lib/recovery-detection.test.ts` |
| CPPTY03-AC-06 | All new tests pass with `npm run typecheck && npm test`. | Full suite |

## Research Sources

- Existing `completion-detector.ts` (two-signal completion: session.idle + stability timer)
- Existing `concurrency.ts` (keyed semaphore FIFO, `DelegationConcurrencyQueue`)
- Existing `lifecycle-manager.ts` (session lifecycle state machine, `cancelDelegatedSession`)
- Existing `delegation-manager.ts` (WaiterModel dispatch, `recoverPending`, `handleSessionIdle`)
- Existing `notification-handler.ts` (async completion notification)
- `oh-my-openagent` notification-first task model
- Hivemind `hm-l2-coordinating-loop` and `hm-l2-completion-looping` skills

## Dependencies

- CP-PTY-02: SDK session delegation must exist before building coordination on top.
- BOOT-08: agent hierarchy and routing contracts.

## Out Of Scope

- Cross-cutting integration with task/session management APIs (CP-PTY-04).
- Sidecar/tmux projection (SC-PTY-01).
- Command-process delegation (CP-PTY-01).
- New tool creation or plugin wiring changes.

---

## Tasks

### CPPTY03-T01: Wave-Based Dispatch Integration Tests

**Description:** Add integration tests proving that `DelegationManager.dispatch()` can dispatch N child tasks in parallel (respecting concurrency limits), collect results from all children, and handle partial failures without crashing the wave.

**File:** `tests/lib/delegation-manager-wave.test.ts` (new)

**Test Scenarios:**
1. Dispatch 3 child tasks concurrently — all return `dispatched` status.
2. Concurrency limit respected: when limit=1, tasks queue and execute sequentially.
3. Partial wave failure: 1 of 3 children errors — other 2 complete normally.
4. Wave result collection: all children's `DelegationResult` retrievable via `getStatus()`.
5. Parallelization toggle: when `config.parallelization=false`, dispatches are sequential (limit=1).

**Acceptance Criteria:**
- All 5 scenarios pass.
- Tests use mock `OpenCodeClient` (no real SDK calls).
- `npm run typecheck` passes.

**Estimated LOC:** ~200

**Commit:** `test: add wave-based dispatch integration tests for CP-PTY-03`

---

### CPPTY03-T02: Completion-Looping Guardrail Tests

**Description:** Add tests proving the dual-signal completion detection path: notification-first (session.idle event → `CompletionDetector.feed()`) with polling fallback (stability timer fires when message count stabilizes) and explicit terminal signals (error, deleted, timeout).

**File:** `tests/lib/completion-looping-guardrails.test.ts` (new)

**Test Scenarios:**
1. Notification-first: `feed("session.idle")` resolves pending `watch()` immediately.
2. Stability timer: `feedMessageCount()` with stable count → timer fires → idle signal.
3. Stability reset: message count changes → timer resets → no premature idle.
4. Polling fallback: `watch()` times out when no signal arrives within timeout.
5. Terminal signal caching: `feed("session.error")` before `watch()` → cached result returned.
6. Dual-signal race: idle event arrives while stability timer is pending → idle wins, timer cleared.
7. `peekCachedResult` non-destructive read + `consumeCachedResult` destructive read.
8. `cancel()` resolves watcher with `cancelled` signal.

**Acceptance Criteria:**
- All 8 scenarios pass.
- Tests use fake timers (`vi.useFakeTimers()`).
- `npm run typecheck` passes.

**Estimated LOC:** ~250

**Commit:** `test: add completion-looping guardrail tests for CP-PTY-03`

---

### CPPTY03-T03: Queue-Key Validation Duplicate Prevention Tests

**Description:** Add tests proving that `DelegationConcurrencyQueue` prevents duplicate dispatch for the same logical work unit via queue-key deduplication, and that `buildDelegationQueueKey()` produces stable keys for equivalent contexts.

**File:** `tests/lib/concurrency-dedup.test.ts` (new)

**Test Scenarios:**
1. Same provider+model → same key (dedup).
2. Same agent+category → same key (dedup).
3. Different provider → different key (parallel).
4. Different agent → different key (parallel).
5. Empty context → `"default"` key.
6. Case normalization: `"OpenAI"` and `"openai"` produce same key.
7. Whitespace trimming: `" openai "` and `"openai"` produce same key.
8. Queue snapshot: `snapshot()` reports active/pending/limit correctly.
9. Priority queue: `enqueue()` with `high` priority dequeues before `normal`.
10. `dequeue()` by taskID removes specific task from queue.

**Acceptance Criteria:**
- All 10 scenarios pass.
- Tests are pure unit tests (no mocks needed).
- `npm run typecheck` passes.

**Estimated LOC:** ~180

**Commit:** `test: add queue-key validation and dedup tests for CP-PTY-03`

---

### CPPTY03-T04: Lifecycle Cascade Tests

**Description:** Add tests proving that parent session abort/timeout cascades to child sessions via `lifecycle-manager.cancelDelegatedSession()` and `delegation-manager.handleSessionDeleted()`.

**File:** `tests/lib/lifecycle-cascade.test.ts` (new)

**Test Scenarios:**
1. `cancelDelegatedSession()` calls `abortSession()` on the SDK client.
2. `cancelDelegatedSession()` feeds `cancel` to `CompletionDetector`.
3. `cancelDelegatedSession()` patches continuity with `failed` phase.
4. `handleSessionDeleted()` transitions delegation to `error` terminal state.
5. `handleSessionDeleted()` with unknown session → no-op (no crash).
6. Cascade chain: parent deleted → child delegations found → children cancelled.
7. `handleEvent()` feeds session.idle/error/deleted to `CompletionDetector`.
8. `handleEvent()` with unknown event type → no-op.

**Acceptance Criteria:**
- All 8 scenarios pass.
- Tests use mock `OpenCodeClient`.
- `npm run typecheck` passes.

**Estimated LOC:** ~200

**Commit:** `test: add lifecycle cascade tests for CP-PTY-03`

---

### CPPTY03-T05: Session Recovery Detection Tests

**Description:** Add tests proving that `DelegationManager.recoverPending()` detects stale delegation state after restart and surfaces honest recovery status — including non-resumable headless commands, PTY best-effort recovery, and SDK resumable recovery.

**File:** `tests/lib/recovery-detection.test.ts` (new)

**Test Scenarios:**
1. SDK delegation with `running` status → `recoverSdkDelegation()` called.
2. PTY delegation with `running` status → `recoverPtyDelegation()` called.
3. Headless delegation with `running` status → transitioned to `error` with `non-resumable-after-restart` terminal kind.
4. Completed delegation → skipped (no recovery attempt).
5. Error delegation → skipped (no recovery attempt).
6. Empty persistence → no-op.
7. Multiple delegations: mix of SDK/PTY/headless → each handled correctly.
8. `recoverPending()` hydrates delegation state from persistence.

**Acceptance Criteria:**
- All 8 scenarios pass.
- Tests mock `readPersistedDelegations()` to control input.
- `npm run typecheck` passes.

**Estimated LOC:** ~220

**Commit:** `test: add session recovery detection tests for CP-PTY-03`

---

### CPPTY03-T06: Create VERIFICATION.md

**Description:** Create the phase verification artifact mapping all acceptance criteria to test evidence.

**File:** `.planning/phases/CP-PTY-03-agent-subagent-background-task-coordination/VERIFICATION.md`

**Content:**
- Date-stamped verification report.
- Table mapping CPPTY03-AC-01 through CPPTY03-AC-06 to test file + pass count.
- Checklist: all tests pass, typecheck passes, no runtime mutation (test-only phase).
- Verdict: PASS or FAIL with remediation notes.

**Acceptance Criteria:**
- All 6 ACs mapped to evidence.
- `npm test` passes with 0 failures from new test files.

**Commit:** `docs: add CP-PTY-03 verification artifact`

---

## Wave Execution Plan

| Wave | Tasks | Parallel? | Rationale |
|------|-------|-----------|-----------|
| W1 | CPPTY03-T01, CPPTY03-T02, CPPTY03-T03 | Yes | Independent test files, no shared state |
| W2 | CPPTY03-T04, CPPTY03-T05 | Yes | Independent test files, no shared state |
| W3 | CPPTY03-T06 | No | Depends on W1+W2 evidence |

## Verification Commands

```bash
npm run typecheck                    # Type-check all files
npx vitest run tests/lib/delegation-manager-wave.test.ts
npx vitest run tests/lib/completion-looping-guardrails.test.ts
npx vitest run tests/lib/concurrency-dedup.test.ts
npx vitest run tests/lib/lifecycle-cascade.test.ts
npx vitest run tests/lib/recovery-detection.test.ts
npm test                             # Full suite — no regressions
```

## Stop Conditions

- Any AC test file fails after 3 fix attempts → STOP, document remaining failures.
- `npm run typecheck` fails → STOP, fix type errors before continuing.
- Existing test suite regresses → STOP, fix regressions before adding new tests.
