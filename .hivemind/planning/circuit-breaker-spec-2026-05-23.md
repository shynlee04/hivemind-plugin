[LANGUAGE: Write this file in en per Language Governance.]
# Auto-Retry with Circuit Breaker — Design Spec

> **Date:** 2026-05-23  
> **Status:** Draft  
> **Author:** GSD Advisor Researcher  
> **Target:** Hivemind delegation system (`src/coordination/delegation/`, `src/coordination/concurrency/`)

---

## Problem Statement

The current retry system in `src/coordination/delegation/retry-handler.ts` has a single responsibility: wrapping delegation *persistence* (writing to `delegations.json`) with exponential backoff (1s, 2s, 4s, 8s, 16s — line 13) and a degraded fallback file. It does **not** protect delegation *dispatch* — the act of creating a child session, acquiring a concurrency slot, and sending a prompt.

When persistent failures occur at the dispatch layer, four cascading problems emerge:

1. **Concurrency slot exhaustion** — Each failed dispatch holds a `semaphore.acquire()` slot until the `finally { release() }` block in `manager-runtime.ts:248-251`. Rapid retries against a failing OpenCode server keep lanes saturated, starving legitimate delegations.

2. **Orphan child session proliferation** — `spawnDelegatedSession()` at `manager-runtime.ts:202-204` creates OpenCode child sessions that outlive the delegation record. Without circuit breaking, these orphan sessions accumulate server-side, consuming budget and confusing session recovery at `manager-runtime.ts:298-322`.

3. **No fast-fail mechanism** — The `FailureCheckpointTracker` (`escalation-timer.ts`) has levels 0-4 (60s/120s/180s/300s checkpoints at `types.ts:136`), but it only injects thin-line notifications into the parent session. It never blocks new dispatches or signals upstream that the system is degraded.

4. **Blind retry amplification** — When the root cause is a persistent condition (rate-limited API key, crashed subagent, exhausted descendant budget at `queue.ts:268-301`), retrying is not just futile — it is destructive. Each retry makes recovery harder by adding more failed state.

**Scope:** This feature adds a stateful circuit breaker at the concurrency-lane level (`src/coordination/concurrency/`) that guards delegation dispatch (`src/coordination/delegation/manager-runtime.ts`). It does NOT replace the existing `retry-handler.ts` (persistence retry) — it sits *above* it, preventing dispatch attempts when the lane is in a degraded state.

---

## Design Options

### Option A — Per-Lane Circuit Breaker (Recommended)

Each `DelegationConcurrencyQueue` lane (identified by `buildDelegationQueueKey()` at `queue.ts:30-51`) gets its own circuit breaker. The breaker tracks failures per queue key (e.g., `agent:claude`, `provider:anthropic:model:claude-sonnet-4-20250514`).

**States:** `CLOSED` (normal) → `OPEN` (fast-fail) → `HALF_OPEN` (probe) → `CLOSED` (recovered).

### Option B — Global Circuit Breaker

A single breaker for all delegations regardless of lane. Simpler to implement but less granular — a failure in one agent lane blocks *all* delegations, including those to healthy agents.

### Option C — Hybrid: Per-Lane with Global Override

Per-lane breakers as in Option A, plus a system-level "degraded" state that drops all non-critical delegations when the overall failure rate exceeds a configurable threshold. Adds complexity of cascade logic.

### Comparison Table

| Option | Pros | Cons | Complexity | Recommendation |
|--------|------|------|------------|----------------|
| **A: Per-Lane** | Isolates failure to offending lane, preserves healthy delegation flows, aligns with existing `queueKey` partitioning, supports granular recovery | More state per lane (N maps vs 1), needs cleanup of stale breaker state | 4 files, new dep — Risk: state leak if lane keys drift | **Rec if precision matters** — most delegations run on different agent/model lanes |
| **B: Global** | Simplest implementation, single state machine, trivial to reason about | Blocks ALL delegations on ANY lane failure, defeats purpose of per-key concurrency gating | 2 files, no new dep — Risk: over-blocking healthy lanes | Rec only if all delegations share one backend |
| **C: Hybrid** | Maximum resilience — catches both lane-specific and system-wide degradation | Highest complexity, risk of double-triggering (lane + global), unclear UX for notification | 6 files, new dep — Risk: cascading state interaction | Rec if running at production scale with 5+ concurrent agents |

---

## Recommendation

**Option A — Per-Lane Circuit Breaker** is recommended because:

- The existing `buildDelegationQueueKey()` (`queue.ts:30-51`) already partitions delegations by provider, model, and agent. Each partition is an independent failure domain. A circuit breaker should match that boundary.
- The `DelegationConcurrencyQueue` (`queue.ts:55-221`) already stores per-lane state. Adding a `CircuitState` to each lane is a natural extension — see `Lane` type at `queue.ts:8-16`.
- Per-lane isolation matches the current `resolveAcquireArgs()` pattern at `manager-runtime.ts:47-53`, where each lane has its own concurrency limit and acquire timeout.
- Option C's global cascade can be added as Phase 5 if monitoring shows system-wide degradation patterns — YAGNI for MVP.

---

## Implementation Plan

### Phase 1: Circuit Breaker Types and State Machine

**Files affected:**
- `src/coordination/concurrency/circuit-breaker.ts` (new, ~120 LOC)
- `src/coordination/delegation/types.ts` (add `CircuitState` to exports)

**Changes:**

1. Create `src/coordination/concurrency/circuit-breaker.ts` with:

```typescript
export type CircuitState = "closed" | "open" | "half-open"

export interface CircuitBreakerConfig {
  failureThreshold: number    // failures before OPEN (default 5)
  resetTimeoutMs: number      // time in OPEN before HALF_OPEN probe (default 30_000)
  probeTimeoutMs: number      // time in HALF_OPEN before retry (default 10_000)
  halfOpenMaxRequests: number // max probe requests allowed in HALF_OPEN (default 1)
}

export interface CircuitBreakerSnapshot {
  state: CircuitState
  failures: number
  lastFailureAt: number | null
  openedAt: number | null
  halfOpenStartedAt: number | null
  totalFailures: number       // lifetime counter (never resets)
  totalSuccesses: number
  config: CircuitBreakerConfig
}

export class LaneCircuitBreaker {
  private state: CircuitState = "closed"
  private failures = 0
  private lastFailureAt: number | null = null
  private openedAt: number | null = null
  private halfOpenStartedAt: number | null = null
  private totalFailures = 0
  private totalSuccesses = 0

  constructor(private config: CircuitBreakerConfig) {}

  /** Returns true if the request should be allowed through. */
  allowRequest(): boolean { /* ... */ }

  /** Record a successful call. Resets failure count, transitions to CLOSED if HALF_OPEN. */
  recordSuccess(): void { /* ... */ }

  /** Record a failure. Transitions to OPEN if threshold exceeded. */
  recordFailure(): void { /* ... */ }

  /** Force-reset the breaker to CLOSED (admin/tool action). */
  reset(): void { /* ... */ }

  snapshot(): CircuitBreakerSnapshot { /* ... */ }
}
```

2. Add `CircuitState` and circuit breaker config types to `src/coordination/delegation/types.ts`.

3. Add `DEFAULT_CIRCUIT_BREAKER_CONFIG` to `src/shared/types.ts` alongside existing constants at lines 169-196.

**Verification:**
- `npm run typecheck` passes
- `npx vitest run tests/lib/coordination/concurrency/circuit-breaker.test.ts` passes (new tests: state transitions, threshold triggering, half-open probe logic, reset)
- `npx vitest run tests/lib/coordination/delegation/types.test.ts` passes (existing type tests unaffected)

### Phase 2: Integrate Breaker into DelegationConcurrencyQueue

**Files affected:**
- `src/coordination/concurrency/queue.ts` (extend `Lane` type, add breaker to acquire path)
- `src/coordination/delegation/manager-runtime.ts` (integrate into `dispatch()`)

**Changes:**

1. Extend `Lane` type in `queue.ts:8-16`:

```typescript
type Lane = {
  active: number
  limit: number
  pending: Array<(release: () => void) => void>
  queued: { high: QueuedTask[]; normal: QueuedTask[] }
  circuitBreaker?: LaneCircuitBreaker  // NEW
}
```

2. Add a `withCircuitBreaker(key: string, config?: CircuitBreakerConfig)` method to `DelegationConcurrencyQueue` at `queue.ts:55`.

3. Modify `acquire()` at `queue.ts:60-99` to call `this.lanes.get(key)?.circuitBreaker?.allowRequest()` before processing the acquire. If the breaker blocks, throw a `[Harness] Circuit breaker OPEN for lane "${key}"` error immediately — this uses the existing `acquireTimeoutMs` error path shape at `queue.ts:85-89` for consistency.

4. In `manager-runtime.ts:172-252`, wrap the `dispatch()` try/catch block:

```typescript
async dispatch(params: DelegateParams): Promise<DelegationResult> {
  const acquireQueueKey = buildDelegationQueueKey(canonicalContext)
  // Phase 2 gate: circuit breaker check
  const breaker = this.semaphore.getBreaker(acquireQueueKey)
  if (breaker && !breaker.allowRequest()) {
    throw new Error(`[Harness] Circuit breaker OPEN for "${acquireQueueKey}"`)
  }
  // ... existing acquire + dispatch logic ...
  try {
    // ... spawn and prompt ...
    breaker?.recordSuccess()   // only on clean completion
  } catch (error) {
    breaker?.recordFailure()   // on any error
    // ... existing error handling ...
  }
}
```

5. Wire the breaker config from `RuntimePolicy` (`src/shared/types.ts:190-198`), adding a new `circuitBreaker` policy section alongside the existing `concurrency`, `budget`, and `trustedRuntime` sections (`runtime-policy.ts:28-41`).

**Verification:**
- `npm run typecheck` passes
- `npx vitest run tests/lib/coordination/concurrency/queue.test.ts` passes (existing queue tests unaffected)
- `npx vitest run tests/lib/coordination/delegation/manager-runtime.test.ts` passes (existing dispatch tests unaffected)
- New tests verify breaker blocks acquire and records success/failure

### Phase 3: Half-Open Auto-Recovery and Stale Cleanup

**Files affected:**
- `src/coordination/concurrency/circuit-breaker.ts` (half-open logic, stale state sweep)
- `src/coordination/delegation/manager-runtime.ts` (recovery timer)

**Changes:**

1. Implement the `HALF_OPEN` probe logic in `LaneCircuitBreaker`:

```typescript
allowRequest(): boolean {
  if (this.state === "closed") return true
  if (this.state === "open") {
    if (Date.now() - this.openedAt! >= this.config.resetTimeoutMs) {
      this.state = "half-open"
      this.halfOpenStartedAt = Date.now()
      this.failures = 0
      return true  // allow first probe request through
    }
    return false  // still in open window
  }
  // half-open: allow limited requests
  return this.currentProbeRequests < this.config.halfOpenMaxRequests
}
```

2. Add a lane cleanup sweep in `DelegationConcurrencyQueue` that removes `circuitBreaker` entries for lanes that have been `CLOSED` with zero failures for > `resetTimeoutMs * 2`. Runs as a side-effect of `acquire()` and `release()` — no dedicated timer needed (YAGNI for MVP).

3. Wire `handleSafetyCeiling` at `state-machine.ts:437-442` to also `recordFailure()` on the delegation's lane breaker when a safety ceiling time-out fires — so persistent timeouts contribute to circuit breaker failure tracking.

**Verification:**
- Half-open state transitions tested
- Probe request limiting verified
- Stale breaker cleanup verified (zero-failure closed lanes removed after TTL)
- Safety ceiling → breaker failure path verified

### Phase 4: Events, Metrics, and Notifications

**Files affected:**
- `src/coordination/concurrency/circuit-breaker.ts` (emit callbacks)
- `src/coordination/delegation/types.ts` (add notification types)
- `src/coordination/delegation/notification-formatter.ts` (format circuit-open messages)
- `src/hooks/` (observe breaker state changes — read-only CQRS)

**Changes:**

1. Add callback hooks to `LaneCircuitBreaker`:

```typescript
export interface CircuitBreakerHooks {
  onStateChange?: (key: string, from: CircuitState, to: CircuitState, snapshot: CircuitBreakerSnapshot) => void
  onProbeSuccess?: (key: string, snapshot: CircuitBreakerSnapshot) => void
  onProbeFailure?: (key: string, snapshot: CircuitBreakerSnapshot) => void
}
```

2. Add `BREAKER_OPEN` and `BREAKER_CLOSED` to `DelegationNotificationType` at `types.ts:109`.

3. Extend `formatStatusLine` in `notification-formatter.ts` to include circuit state when the lane is not `CLOSED`.

4. Register an `onStateChange` callback from `plugin.ts` (composition root) to log state transitions via `client.app.log()` — reusing the existing log pattern at `state-machine.ts:293-299`.

**Verification:**
- Callbacks fire on state transitions
- Notifications inject into parent session on open/close
- Logs show `[Harness] Circuit breaker for "agent:claude" OPEN → HALF_OPEN`

### Phase 5: Configuration, Observability, and Documentation

**Files affected:**
- `src/shared/runtime-policy.ts` (add circuit breaker config to `RuntimePolicy` type)
- `src/shared/types.ts` (add `CircuitBreakerPolicy` type)
- `src/config/subscriber.ts` (load breaker config from workspace policy)
- `.planning/codebase/ARCHITECTURE.md` (document new surface)
- `docs/draft/` (user-facing config docs)

**Changes:**

1. Add to `src/shared/types.ts`:

```typescript
export type CircuitBreakerPolicy = {
  enabled: boolean
  failureThreshold: number
  resetTimeoutMs: number
  halfOpenMaxRequests: number
  probeTimeoutMs: number
}

export type RuntimePolicy = {
  concurrency: ConcurrencyPolicy
  budget: BudgetPolicy
  trustedRuntime: TrustedRuntimePolicy
  circuitBreaker?: CircuitBreakerPolicy  // NEW
}
```

2. Expose a `DEFAULT_CIRCUIT_BREAKER_POLICY` constant:

```typescript
export const DEFAULT_CIRCUIT_BREAKER_POLICY: CircuitBreakerPolicy = {
  enabled: true,
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenMaxRequests: 1,
  probeTimeoutMs: 10_000,
}
```

3. Load from workspace config in `src/config/subscriber.ts` (follow the existing `loadRuntimePolicy` pattern at `runtime-policy.ts:103-139`).

**Verification:**
- `npm run typecheck` passes
- Full test suite: `npm test`
- Workspace config loading/unloading verified
- Option A vs C decision documented in `ARCHITECTURE.md`

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **State leak** — breaker state retained for stale lanes that are no longer dispatched | Medium | Low | Phase 3 stale cleanup sweeps closed lanes after TTL; max state bounded by unique queue keys (typically < 20) |
| **False open** — transient blip triggers circuit open, blocking legitimate dispatches | Low | Medium | Default threshold of 5 consecutive failures; half-open allows probe after 30s; configurable per-lane via `RuntimePolicy` |
| **Concurrency deadlock** — breaker blocks dispatch while holding semaphore slot | Low | High | `allowRequest()` checked BEFORE `semaphore.acquire()` in `manager-runtime.ts:196-199` — no slot held during rejection |
| **Half-open thundering herd** — multiple probe requests hit recovering system simultaneously | Low | Low | `halfOpenMaxRequests: 1` limits probes to one at a time; subsequent callers fast-fail with `OPEN` semantics |
| **Notification spam** — every breaker state transition floods the parent session | Medium | Low | Phase 4 debounces transitions: only first OPEN and first CLOSED after a series emit notifications; intermediate HALF_OPEN probes are silent unless they fail |
| **Backward compatibility** — existing deployments have no circuit breaker config | Low | Low | Defaults to `failureThreshold: 5, resetTimeoutMs: 30000, halfOpenMaxRequests: 1` — matches current no-breaker behavior for healthy systems; `enabled: true` by default, but disabled systems see no change |
| **Circuit breaker + retry handler conflict** — retry-handler.ts retries persistence after breaker blocks dispatch | Low | Medium | They operate at orthogonal layers: breaker blocks DISPATCH, retry-handler retries PERSISTENCE. No conflict. Document at `retry-handler.ts:16-17` and in this spec. |

### Design Decisions

1. **Breaker at concurrency-lane level, not session level.** Each `queueKey` represents a provider-model-agent tuple. Breakers should match that granularity because failure is correlated by backend (agent), not by session.

2. **Failures = consecutive only, not sliding-window rate.** The `FailureCheckpointTracker` at `escalation-timer.ts:11-86` uses absolute intervals (60/120/180/300s). The circuit breaker uses a simpler consecutive-failure counter because delegation dispatch is a low-frequency operation (seconds between calls, not milliseconds). A sliding window adds complexity without proportional benefit.

3. **Half-open = fire one probe, await outcome.** A single probe request is sent when the reset timeout expires. If it succeeds → close the circuit. If it fails → reset the open timer. This avoids overwhelming a recovering backend (the "thundering herd" problem).

4. **No circuit breaker for persistence retry.** The existing `DelegationRetryHandler` at `retry-handler.ts:16-49` has its own exponential backoff and degraded fallback. Adding a breaker there would add complexity without benefit — persistence is a local filesystem write, not a remote call.

### File Reference Map

| Component | File | Existing Surface | New Surface |
|-----------|------|-----------------|-------------|
| Circuit breaker state machine | `src/coordination/concurrency/circuit-breaker.ts` | (new) | `LaneCircuitBreaker` class, `CircuitBreakerConfig`, `CircuitBreakerSnapshot` |
| Lane integration | `src/coordination/concurrency/queue.ts` | `Lane` type (line 8), `acquire()` (line 60) | `circuitBreaker?` on Lane, `getBreaker()`, modified `acquire()` |
| Dispatch integration | `src/coordination/delegation/manager-runtime.ts` | `dispatch()` (line 172), `resolveAcquireArgs()` (line 47) | Breaker check before semaphore acquire, success/failure recording |
| Safety ceiling tie-in | `src/coordination/delegation/state-machine.ts` | `handleSafetyCeiling()` (line 437) | Record failure on breaker when timer fires |
| Policy configuration | `src/shared/runtime-policy.ts` | `DEFAULT_RUNTIME_POLICY` (line 28), `loadRuntimePolicy()` (line 103) | `circuitBreaker` policy section |
| Types | `src/shared/types.ts` | `RuntimePolicy`, `ConcurrencyPolicy` (lines 190-198) | `CircuitBreakerPolicy`, `DEFAULT_CIRCUIT_BREAKER_POLICY` |
| Types | `src/coordination/delegation/types.ts` | `DelegationNotificationType` (line 109) | `BREAKER_OPEN`, `BREAKER_CLOSED` notification types |
| Notifications | `src/coordination/delegation/notification-formatter.ts` | `formatStatusLine()` | Circuit state formatting |
| Composition | `src/plugin.ts` | Plugin wiring | `onStateChange` callback registration |
| Tests | `tests/lib/coordination/concurrency/circuit-breaker.test.ts` | (new) | State transitions, threshold, half-open, stale cleanup |
| Tests | `tests/lib/coordination/delegation/manager-runtime.test.ts` | Existing dispatch tests | Breaker integration tests |

---

## Appendix: State Transition Diagram

```
                     ┌──────────────────────────────┐
                     │          CLOSED               │
                     │  (normal operation, requests  │
                     │   allowed through)            │
                     └──────────┬───────────────────┘
                                │
                    consecutive failures >= threshold
                                │
                                ▼
                     ┌──────────────────────────────┐
                     │           OPEN                │
                     │  (all requests rejected,      │
                     │   failure count frozen)       │
                     └──────────┬───────────────────┘
                                │
                     resetTimeoutMs elapsed
                                │
                                ▼
                     ┌──────────────────────────────┐
                     │        HALF_OPEN              │
                     │  (probe request allowed,      │
                     │   limited to `maxProbes`)     │
                     └──────┬───────────┬───────────┘
                            │           │
                        success      failure
                            │           │
                            ▼           │
                     ┌──────────┐       │
                     │ CLOSED   │       │
                     │ failures=0│       │
                     └──────────┘       │
                                        ▼
                                 back to OPEN
                                 (reset timer)
```
