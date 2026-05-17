# Delegation / Queue / Completion Cluster Analysis

**Analysis Date:** 2026-05-18
**Scope:** `src/coordination/` (delegation, concurrency, completion, sdk-delegation, command-delegation, spawner) + `src/tools/delegation/` + `src/shared/task-status.ts` + `src/shared/tool-response.ts` + `src/task-management/continuity/delegation-persistence.ts`
**Purpose:** Deep structural audit of the delegation lifecycle — from tool entry-point through dispatch, concurrency gating, completion detection, and notification delivery.

---

## A) Source Document — Module Map (10 core files)

| # | File | LOC | Responsibility | Owned State |
|---|------|-----|----------------|-------------|
| 1 | `src/tools/delegation/delegate-task.ts` | ~200 | Tool entry-point: Zod schema validation, injects DelegationManager, returns ToolResponse envelope | None (delegates to manager) |
| 2 | `src/tools/delegation/delegation-status.ts` | ~150 | Tool poll/status: reads from in-memory delegations + persisted fallback | None (read-only) |
| 3 | `src/coordination/delegation/manager.ts` | ~500 | Core orchestrator: composes state-machine, queue, completion, command-handler, SDK handler. Routes dispatch to SDK/command/fallback paths | Owns `Map<string, Delegation>` in-memory store |
| 4 | `src/coordination/delegation/state-machine.ts` | ~200 | Transition validator: dispatched→running→completed/error/timeout, grace period timers, batch pruning | Owns transition rules, grace/safety timers |
| 5 | `src/coordination/concurrency/queue.ts` | ~200 | Lane-based concurrency: `buildDelegationQueueKey()` cascade (provider:model→model→agent:category→agent→category→default), acquire/release slots | Owns `Map<string, Set<string>>` active per-key sets |
| 6 | `src/coordination/completion/detector.ts` | ~300 | Event-driven completion: `feed()`/`watch()` API, stability timeout, cached terminal signals from lifecycle events | Owns `Map<string, {lastCount, timer, result}>` per-session |
| 7 | `src/coordination/sdk-delegation/handler.ts` | ~324 | SDK polling lifecycle: adaptive intervals (active/base/idle/deep-idle), stability thresholds, CompletionDetector integration, recovery retry | Owns `Map<string, NodeJS.Timeout>` stability timers |
| 8 | `src/coordination/command-delegation/handler.ts` | ~350 | PTY + headless command delegation: process spawn, poll timers, PTY session tracking, exit code capture | Owns `Map<string, {process, timer, ptySessionId}>` |
| 9 | `src/shared/task-status.ts` | ~50 | `TaskStatus` transitions: pending/queued/running/completed/failed/error/cancelled/interrupt | None (pure transition validator) |
| 10 | `src/task-management/continuity/delegation-persistence.ts` | ~200 | File-based delegation record I/O: `persistDelegations()`, `readPersistedDelegations()`, derives surface/recovery | None (reads/writes `.hivemind/state/`) |

**Supporting files:**

| File | LOC | Role |
|------|-----|------|
| `src/coordination/delegation/types.ts` | 140 | `DelegationStatus`, `Delegation`, `DelegationResult`, constants (timeouts, intervals) |
| `src/coordination/spawner/concurrency-key.ts` | 13 | Thin wrapper: `resolveDelegationConcurrencyKey()` → `buildDelegationQueueKey()` |
| `src/coordination/completion/notification-handler.ts` | 242 | Terminal notification delivery: `notifyDelegationTerminal()`, `queuePendingNotification()`, pending replay |
| `src/shared/tool-response.ts` | ~40 | ToolResponse envelope: `success()`/`error()`/`pending()` factory functions |

---

## B) Lifecycle Flow — End-to-End Dispatch → Completion

### B1. Happy Path (SDK delegation)

```
User invokes delegate-task tool
    │
    ▼
[delegate-task.ts] Zod validates input, calls manager.dispatch()
    │
    ▼
[manager.ts] ──→ evaluateCategoryGate() (allow/ask/audit)
    │               │
    │               ▼ allow
    │           buildDelegationQueueKey() from queue.ts
    │               │
    │               ▼
    │           queue.acquire(key, delegationId)
    │               │
    │               ▼ slot granted
    │           spawner.buildSdkSpawnRequest() + spawnDelegatedSession()
    │               │
    │               ▼ child session created
    │           state-machine.transition("dispatched" → "running")
    │               │
    │               ▼
    ┌─────────── sdk-handler.scheduleStabilityPoll() ───────────────┐
    │                                                                │
    │  Adaptive polling loop:                                        │
    │  1. getSessionMessageCount() → feed into CompletionDetector    │
    │  2. Check cached terminal signals from lifecycle events        │
    │  3. Track stablePollCount + lastMessageCountChangeAt           │
    │  4. Dual gate: MIN_STABILITY_TIME_MS && STABLE_POLLS_REQUIRED  │
    │                                                                │
    │  Completion signals (any triggers finalization):               │
    │  • CompletionDetector.consumeCachedResult() → "idle"           │
    │  • Stable polls reach threshold                                │
    │  • Stale timeout (45min no activity)                           │
    │                                                                │
    └──────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
              finalizeSdkDelegation()
              → extractAllAssistantText(messages)
              → hasAssistantWorkEvidence() fallback
              → onTerminal("completed")
                           │
                           ▼
              state-machine.transition("running" → "completed")
              → persistAllDelegations()
              → notifyDelegationTerminal()
              → queue.release(key, delegationId)
              → scheduleGracePeriodCleanup()
```

### B2. Command Delegation Path (PTY / Headless)

```
[manager.ts] ──→ commandHandler.dispatchCommand()
                    │
                    ├── PTY available?
                    │   ├── YES: ptyManager.spawn() → track ptySessionId
                    │   │         poll PtyManager for exit
                    │   └── NO: spawn headless child_process
                    │            poll process.exit / stdout drain
                    │
                    ▼
              poll-based completion:
              • PtyManager.onExit() or process.on("exit")
              • Captures exit code, stdout/stderr
              • onTerminal("completed" | "error")
```

### B3. Safety Ceiling (parallel timeout)

```
Both paths have INDEPENDENT timeout mechanisms running in parallel:

1. DelegationStateMachine safety ceiling:
   - setTimeout(safetyCeilingMs) → onTerminal("timeout")
   - Fires regardless of completion progress

2. SdkDelegationHandler stale detection:
   - timeSinceLastChange > DEFAULT_STALE_TIMEOUT_MS (45min)
   - Only fires if no message activity

3. CompletionDetector stability timeout:
   - stabilityTimeoutMs of unchanged message counts
   - Fires "idle" signal into cached result

All three can race. First terminal signal wins → others are no-ops
because state-machine rejects transitions from terminal states.
```

---

## C) Overlap & Chaos Analysis

### C1. Dual Status Type Systems (Severity: HIGH)

**What:** Two independent status enums with overlapping but incompatible states.

| `TaskStatus` (`src/shared/task-status.ts`) | `DelegationStatus` (`src/coordination/delegation/types.ts`) |
|---|---|
| pending | — |
| queued | — |
| running | running |
| completed | completed |
| failed | — |
| error | error |
| cancelled | — |
| interrupt | — |
| — | dispatched |
| — | timeout |

**Problem:** `TaskStatus` is used by tool-response envelope (`tool-response.ts`) and session tracker. `DelegationStatus` is used by delegation lifecycle. The mapping between them is implicit — `"completed"` maps directly, but `"timeout"` has no TaskStatus equivalent, and `"dispatched"` has no TaskStatus equivalent. The `delegation-status.ts` tool must manually bridge these when constructing responses.

**Impact:** When a delegation reaches `"timeout"`, the status tool reports it as `"timeout"` but any consumer expecting `TaskStatus` cannot parse it. The `delegation-persistence.ts` file stores `DelegationStatus` — a reader that expects `TaskStatus` would silently fail or misinterpret.

**Files:** `src/shared/task-status.ts`, `src/coordination/delegation/types.ts`, `src/tools/delegation/delegation-status.ts`

---

### C2. Duplicate deriveSurface / deriveRecoveryGuarantee (Severity: MEDIUM)

**What:** `delegation-persistence.ts` contains its own copies of `deriveSurface()` and `deriveRecoveryGuarantee()` that duplicate logic already in `state-machine.ts`.

**Evidence:**
- `src/task-management/continuity/delegation-persistence.ts` — defines `deriveSurface()` and `deriveRecoveryGuarantee()` for re-hydrating persisted delegations
- `src/coordination/delegation/state-machine.ts` — defines the same derivation logic during dispatch

**Problem:** If the derivation rules change (e.g., new `DelegationSurface` value or new recovery guarantee), both files must be updated in lockstep. No shared function enforces this.

**Impact:** Drift risk. Already the two files may have subtle differences in edge-case handling that aren't caught by tests.

**Fix approach:** Extract to a shared utility in `src/shared/` or `src/coordination/delegation/types.ts` and have both consumers import from the single source.

---

### C3. Triple Dispatch Path with Divergent Error Handling (Severity: MEDIUM)

**What:** DelegationManager routes to three execution modes, each with different error surface:

| Mode | Handler | Error Capture | Completion Signal |
|------|---------|---------------|-------------------|
| SDK | `SdkDelegationHandler` | SDK call failures, message extraction errors | CompletionDetector + adaptive polling |
| PTY | `CommandDelegationHandler` | Process exit codes, stderr | PtyManager exit callback |
| Headless | `CommandDelegationHandler` | Process exit codes, stdout drain | process.on("exit") |

**Problem:** Error messages have inconsistent formats across modes:
- SDK: `[Harness] Session ${signal} during delegation: ${error}`
- SDK (empty result): `[Harness] Delegation reached stability without assistant completion evidence...`
- PTY: Process exit code based, format varies
- Headless: Different format again

The `delegation-status.ts` tool and `notification-handler.ts` must handle all these formats without a unified error contract.

**Files:** `src/coordination/sdk-delegation/handler.ts:179-181`, `src/coordination/command-delegation/handler.ts`

---

### C4. Three Parallel Timeout Mechanisms (Severity: MEDIUM)

**What:** Three independent timeout/timer systems can fire simultaneously for a single delegation:

1. **DelegationStateMachine safety ceiling** (`state-machine.ts`): `setTimeout(safetyCeilingMs)` — hard max runtime
2. **SdkDelegationHandler stale detection** (`sdk-delegation/handler.ts`): `timeSinceLastChange > 45min` — activity-based
3. **CompletionDetector stability timeout** (`detector.ts`): `stabilityTimeoutMs` — message count unchanged

**Mitigating factor:** The state-machine rejects transitions from terminal states, so only the first signal wins. This is correct by design.

**Residual risk:** Timer cleanup. If the state-machine fires first, the SdkDelegationHandler's stability poll timer and CompletionDetector's timer may still be running until their next poll discovers the delegation is already terminal. This is a minor memory/timer leak, not a correctness issue.

**Files:** `src/coordination/delegation/state-machine.ts`, `src/coordination/sdk-delegation/handler.ts:230-233`, `src/coordination/completion/detector.ts`

---

### C5. Notification Delivery with Silent Failure Queue (Severity: LOW)

**What:** `notifyDelegationTerminal()` in `notification-handler.ts` is fire-and-forget. If `sendPrompt()` fails, the notification is queued into `pendingNotifications` on the session continuity record. There is no retry loop — notifications sit until `replayPendingNotifications()` is called (which only happens during session recovery).

**Problem:** In normal operation, a failed notification may never be delivered. The parent session never learns the child completed. The `queuePendingNotification()` function correctly deep-clones the notification, but there's no TTL or expiry — stale notifications from hours ago could be replayed.

**Files:** `src/coordination/completion/notification-handler.ts:135-166`, `src/coordination/completion/notification-handler.ts:221-240`

---

### C6. Concurrency Key Resolution — Actually Unified (Severity: NONE)

**Initial concern:** `buildDelegationQueueKey()` in `queue.ts` vs `resolveDelegationConcurrencyKey()` in `spawner/concurrency-key.ts` might diverge.

**Finding:** `resolveDelegationConcurrencyKey()` is a 13-line thin wrapper that delegates directly to `buildDelegationQueueKey()`. **No divergence.** This is clean.

**Files:** `src/coordination/spawner/concurrency-key.ts`, `src/coordination/concurrency/queue.ts`

---

## D) External Pattern Comparison

### D1. vs. OpenAI Assistants API (Run/Thread model)

| Aspect | Hivemind Delegation | OpenAI Assistants |
|--------|---------------------|-------------------|
| Dispatch model | Always-background WaiterModel | Poll-based Run status |
| Completion signal | Dual: event-driven + polling stability | Single: Run.status polling |
| Concurrency control | Per-key lane queue with cascade fallback | Thread-level (one run per thread) |
| Timeout | Safety ceiling (max, not deadline) | max_prompt_tokens + max_completion_tokens |
| Notification | Fire-and-forget SDK prompt + pending queue | Webhook callback |

**Hivemind advantage:** Dual-signal completion is more robust than single-source polling. The adaptive polling interval tiers (active→base→idle→deep-idle) are more sophisticated than OpenAI's flat polling.

### D2. vs. Temporal.io Workflow Model

| Aspect | Hivemind Delegation | Temporal Workflows |
|--------|---------------------|--------------------|
| State machine | In-memory Map + file persistence | Event-sourced history |
| Recovery | Rehydrate from `.hivemind/state/` JSON | Replay from event log |
| Timer management | `setTimeout` with grace periods | Server-side timer queues |
| Concurrency | Per-key semaphore | Task queue with rate limiting |

**Temporal advantage:** Event sourcing provides perfect audit trail. Hivemind's file-based persistence can lose in-flight state between writes (if process crashes mid-persist, the JSON may be partial/corrupt — though the retry-queue in `child-writer.ts` mitigates this per CP-ST-06).

### D3. vs. BullMQ Job Queue

| Aspect | Hivemind Queue | BullMQ |
|--------|---------------|--------|
| Queue key resolution | Cascade: provider:model→model→agent:category→agent→category→default | Named queues |
| Slot management | In-memory `Set<string>` per key | Redis-backed semaphores |
| Priority | No priority ordering — FIFO within key | Priority scoring |
| Dead letter | Stale timeout → terminal "timeout" | DLQ with retry counts |

**Hivemind gap:** No priority ordering. All delegations within the same concurrency key are treated equally. A quick "research" task and a deep "implementation" task compete for the same slot if they share a key.

---

## E) Nine-Criteria Assessment (1–5 scale)

### E1. Single Responsibility — Score: 3/5

**Rationale:** Each module has a clear primary responsibility, but `manager.ts` at ~500 LOC is at the cap and orchestrates too many concerns (dispatch routing, recovery, cleanup scheduling, notification triggering). The triple-dispatch-path routing (SDK/PTY/headless) could be extracted to a strategy pattern.

**Evidence:** `src/coordination/delegation/manager.ts` — single file handles category gates, concurrency acquisition, spawn request building, dispatch routing, recovery reconciliation, grace period scheduling, and notification triggering.

---

### E2. Cohesion — Score: 4/5

**Rationale:** Within each subdirectory, files are tightly related. `sdk-delegation/handler.ts` owns SDK polling, `command-delegation/handler.ts` owns command execution, `completion/detector.ts` owns signal detection. The callback interface pattern (`SdkDelegationCallbacks`, `CommandDelegationCallbacks`) creates clean boundaries.

**Weakness:** `delegation-persistence.ts` lives in `src/task-management/continuity/` but contains delegation-specific derivation logic (surface, recovery guarantee) that should live closer to the delegation domain.

---

### E3. Coupling — Score: 3/5

**Rationale:** `manager.ts` is the coupling bottleneck — it imports from `state-machine.ts`, `queue.ts`, `completion/detector.ts`, `sdk-delegation/handler.ts`, `command-delegation/handler.ts`, `spawner/`, `notification-handler.ts`, and `delegation-persistence.ts`. This is inherent to the orchestrator role, but it means any change to any of these modules requires regression testing through the manager.

**Evidence:** `manager.ts` constructor injects 8+ dependencies. The callback interfaces partially mitigate this — handlers don't import manager, they receive callbacks. But the coupling is still structural.

---

### E4. Testability — Score: 4/5

**Rationale:** Callback interfaces make unit testing straightforward — each handler can be tested in isolation with mock callbacks. The adaptive polling logic in `sdk-delegation/handler.ts` is well-tested with timer simulation.

**Weakness:** Integration testing the full dispatch→completion flow requires mocking the OpenCode SDK client, PTY manager, and file system — heavy setup. No integration test exists that exercises all three dispatch paths end-to-end.

---

### E5. Error Handling Consistency — Score: 2/5

**Rationale:** Error messages use `[Harness]` prefix consistently, but:
- SDK handler uses `[Harness] Session ${signal} during delegation: ${error}`
- SDK handler (empty result) uses `[Harness] Delegation reached stability without assistant completion evidence...`
- SDK handler (tool-use evidence) uses `[Harness] Delegation completed with tool-use evidence but no text output.`
- Command handler uses process exit code format
- Persistence uses `[Harness]` prefix but different sentence structure

There is no `DelegationError` type or error code system. Consumers must string-match error messages to determine what went wrong.

---

### E6. State Consistency — Score: 3/5

**Rationale:** In-memory state (`Map<string, Delegation>` in manager) is the source of truth during runtime. File persistence (`delegation-persistence.ts`) is write-through on every mutation via `persistAllDelegations()`. Recovery reconciles from file back to memory.

**Risk:** The dual status system (TaskStatus vs DelegationStatus) creates a semantic gap. A delegation in `"timeout"` state has no TaskStatus equivalent. Consumers that only understand TaskStatus cannot process timeout delegations.

**Mitigating:** Grace period cleanup prunes terminal delegations after 10 minutes, reducing stale state accumulation.

---

### E7. Observability — Score: 3/5

**Rationale:** The `delegation-status.ts` tool provides runtime querying. The notification handler delivers terminal state to parent sessions. `session-api.ts` provides message count queries.

**Gap:** No structured logging of delegation lifecycle events (dispatch, completion, timeout, error). No metrics (average delegation duration, completion rate, timeout rate). No tracing correlation between parent and child sessions. Debugging a stuck delegation requires manually correlating timers across multiple modules.

---

### E8. Extensibility — Score: 4/5

**Rationale:** Adding a new execution mode requires implementing a handler class with the callback interface pattern — clean extension point. Adding new concurrency key tiers is straightforward (extend `buildDelegationQueueKey` cascade). New completion signals can be added to CompletionDetector without touching the polling loop.

**Constraint:** The 500 LOC cap on manager.ts limits how much more orchestration logic can be added before requiring extraction.

---

### E9. Documentation & Intent Clarity — Score: 4/5

**Rationale:** Phase markers in comments (Phase 16.2, Phase 36.1) link code to architecture decisions. Requirement tags (R-POLL-01 through R-POLL-04, R-NOTIF-02 through R-NOTIF-04, R-COMPLETION-DETECTOR-01 through R-COMPLETION-DETECTOR-04) trace to spec requirements. JSDoc comments explain callback interfaces.

**Gap:** The relationship between TaskStatus and DelegationStatus is undocumented. The three-timeout-race behavior is documented as "first wins" but the timer cleanup responsibility is not specified.

---

## F) Summary Scorecard

| Criterion | Score | Trend |
|-----------|-------|-------|
| E1. Single Responsibility | 3/5 | At cap — extraction needed for new paths |
| E2. Cohesion | 4/5 | Strong — callback boundaries work |
| E3. Coupling | 3/5 | Manager is coupling bottleneck |
| E4. Testability | 4/5 | Good — callback pattern enables isolation |
| E5. Error Handling Consistency | 2/5 | **Weakest** — no error codes, string-based |
| E6. State Consistency | 3/5 | Dual status systems create semantic gap |
| E7. Observability | 3/5 | No structured logging or metrics |
| E8. Extensibility | 4/5 | Clean extension points via callback interfaces |
| E9. Documentation & Intent | 4/5 | Phase markers + requirement tags are strong |
| **Overall** | **3.3/5** | Functional but needs hardening |

---

## G) Prioritized Remediation Candidates

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P1 | Unify `TaskStatus` ↔ `DelegationStatus` mapping (E5, E6) | Medium | Removes semantic gap, enables type-safe status consumers |
| P2 | Extract shared `deriveSurface()` / `deriveRecoveryGuarantee()` (C2) | Low | Eliminates drift risk |
| P3 | Add `DelegationError` type with error codes (E5) | Medium | Enables programmatic error handling, monitoring |
| P4 | Timer cleanup on pre-empted delegations (C4) | Low | Prevents minor timer leak |
| P5 | Structured delegation lifecycle logging (E7) | Medium | Enables debugging stuck delegations |
| P6 | Extract dispatch strategy from manager.ts (E1, E3) | High | Reduces coupling, creates clean extension point |
| P7 | Notification TTL and retry (C5) | Low | Prevents stale notification replay |

---

*Cluster analysis: 2026-05-18 — 12 source files, ~2,500 LOC analyzed*
