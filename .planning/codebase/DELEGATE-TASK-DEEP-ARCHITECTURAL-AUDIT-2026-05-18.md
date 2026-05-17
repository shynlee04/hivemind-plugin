# Deep Architectural Audit: Delegate-Task Delegation Subsystem

**Analysis Date:** 2026-05-18
**Scope:** Full dispatch lifecycle — tool entry through dual-signal completion
**Evidence Level:** L3 source-code static analysis (no runtime traces)
**Total Files Audited:** 15 source files, 4 AGENTS.md sector guides

---

## A) Source Doc — Audited Files

| # | File | LOC | Key Exports | Role |
|---|------|-----|-------------|------|
| 1 | `src/tools/delegation/delegate-task.ts` | ~75 | `delegateTaskTool` (Zod schema + handler) | Tool entry point, input validation |
| 2 | `src/tools/delegation/delegation-status.ts` | ~135 | `delegationStatusTool` | Status query tool, filtering logic |
| 3 | `src/coordination/delegation/manager.ts` | ~504 | `DelegationManager` class | Central orchestrator — dispatch, recovery, timers, polling |
| 4 | `src/coordination/delegation/state-machine.ts` | ~full | `DelegationStateMachine` | In-memory state Maps, state transitions, timer lifecycle |
| 5 | `src/coordination/delegation/types.ts` | ~full | `DelegationStatus`, `DelegationSurface`, `DelegationRecoveryGuarantee` | Type authority + polling constants |
| 6 | `src/coordination/concurrency/queue.ts` | ~full | `DelegationConcurrencyQueue`, `buildDelegationQueueKey` | Per-key concurrency gating, key resolution |
| 7 | `src/coordination/completion/detector.ts` | ~full | `CompletionDetector` | Dual-signal idle + message threshold detection |
| 8 | `src/coordination/sdk-delegation/handler.ts` | ~full | `SdkDelegationHandler`, `SdkDelegationCallbacks` | SDK dispatch path, adaptive polling |
| 9 | `src/coordination/command-delegation/handler.ts` | ~full | `CommandDelegationHandler`, `CommandDelegationCallbacks` | Command/PTY dispatch path |
| 10 | `src/shared/task-status.ts` | 22 | `TaskStatus` transitions | Status transition helpers |
| 11 | `src/coordination/spawner/spawn-request-builder.ts` | 136 | `buildSdkSpawnRequest`, `resolveDelegationPermissionProfile` | Spawn request construction, permission resolution |
| 12 | `src/coordination/spawner/session-creator.ts` | 35 | `spawnDelegatedSession` | Thin SDK session creation wrapper |
| 13 | `src/coordination/spawner/agent-primitive-policy.ts` | 51 | `enrichAgentFromPrimitives`, `parseToolBooleans` | Agent metadata enrichment from `.opencode/agents` |
| 14 | `src/coordination/spawner/concurrency-key.ts` | 13 | `resolveDelegationConcurrencyKey` | Passthrough to `buildDelegationQueueKey` |
| 15 | `src/coordination/spawner/spawner-types.ts` | 84 | `DelegationSpawnRequest`, `DelegationPermissionProfile` | Canonical spawn contracts |
| 16 | `src/shared/types.ts` | 415 | `HarnessStatus`, `DelegationMeta`, re-exports | Shared type authority + backward-compat re-exports |

---

## B) Dispatch Lifecycle — End-to-End Flow

### B.1 Primary Dispatch Path (SDK Mode)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ 1. USER CALLS delegate-task TOOL                                     │
│    `src/tools/delegation/delegate-task.ts`                           │
│    Zod validates: agent, prompt, title?, safetyCeilingMs?            │
│    Resolves workingDirectory from process.cwd()                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ calls manager.delegate()
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. DELEGATION MANAGER                                                │
│    `src/coordination/delegation/manager.ts`                          │
│    a) Validates category gate (RuntimePolicy.categoryGate)           │
│    b) Checks depth ≤ maxDelegationDepth (default 3)                  │
│    c) Resolves concurrency key → queue.acquire(key)                 │
│    d) Creates DelegationStateMachine entry                           │
│    e) Calls stateMachine.start(id) → status: "queued"               │
│    f) Selects dispatch path: SDK vs Command                          │
│       - If executionMode === "sdk" → sdkHandler.dispatch()           │
│       - Else → commandHandler.dispatch()                             │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ dispatch() via callback
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3a. SDK DELEGATION HANDLER                                           │
│     `src/coordination/sdk-delegation/handler.ts`                     │
│     a) Calls spawner.buildSdkSpawnRequest()                          │
│     b) Calls spawner.spawnDelegatedSession()                         │
│     c) Starts adaptive polling loop                                  │
│     d) Poll intervals: active=1s, base=2s, idle=5s, deep-idle=15s   │
│     e) On completion signal → invokes completionCallback()           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 3b. COMMAND DELEGATION HANDLER (alternative path)                    │
│     `src/coordination/command-delegation/handler.ts`                 │
│     a) Builds command execution context                              │
│     b) Dispatches via PTY or headless child_process                  │
│     c) Monitors stdout/stderr for completion markers                 │
│     d) On completion → invokes completionCallback()                  │
└──────────────────────────────────────────────────────────────────────┘
```

### B.2 Completion Detection (Dual-Signal)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ 4. COMPLETION DETECTOR                                               │
│    `src/coordination/completion/detector.ts`                         │
│    Signal 1: Session idle detection                                  │
│      - Polls session status via SDK                                  │
│      - Tracks MIN_IDLE_TIME_MS + STABLE_POLLS_REQUIRED consecutive  │
│    Signal 2: Message threshold                                      │
│      - Monitors message count against STABILITY_THRESHOLD            │
│    Dual-signal: BOTH must fire for "completed"                       │
│    Maps: watchers, cachedResults, stabilityTimers                    │
│    → Fires onDelegationComplete() back to Manager                    │
└──────────────────────────────────────────────────────────────────────┘
```

### B.3 State Transitions

```text
pending → queued → dispatching → running → completed
                                         → failed
                                         → error
                                         → cancelled
                    → (interrupt preserves previous)
```

Status is tracked in THREE overlapping models:
- `TaskStatus` (8 values) — continuity store (`src/shared/types.ts:3`)
- `SessionLifecyclePhase` (6 values) — runtime lifecycle (`src/shared/types.ts:259-265`)
- `DelegationPacketStatus` (4 values) — coarse packet view (`src/shared/types.ts:156`)
- `HarnessStatus` (9 values) — canonical superset (`src/shared/types.ts:145-154`)

Mapping table: `src/shared/types.ts:126-138`

---

## C) Architectural Problems

### AP-01 — God-Object Manager (CRITICAL)

**File:** `src/coordination/delegation/manager.ts` (~504 LOC)
**What:** DelegationManager owns dispatch orchestration, recovery, timer management, category gate evaluation, status tracking, polling orchestration, and completion routing — all in a single class at the 500 LOC cap.
**Evidence:**
- 8+ imports at top of file
- Methods span: `delegate()`, `recoverPendingDelegations()`, `startSafetyTimer()`, `clearGracePeriodTimer()`, `evaluateCategoryGate()`, `onDelegationComplete()`, `getStatus()`, `listDelegations()`
- Timer lifecycle mixed with business logic
**Impact:** Any change to dispatch, recovery, timers, or completion touches the same file. High merge conflict risk. Difficult to test in isolation.
**Fix approach:** Extract `DelegationTimerManager` (safety + grace period timers), `DelegationRecoveryService` (startup recovery), and `CategoryGateEvaluator` (gate logic) into separate modules under `src/coordination/delegation/`.

---

### AP-02 — Lazy Setter Circular Dependency Workaround (HIGH)

**Files:** `src/coordination/delegation/manager.ts`, `src/coordination/sdk-delegation/handler.ts`, `src/coordination/command-delegation/handler.ts`
**What:** Manager uses `setSdkHandler()` and `setCommandHandler()` methods to inject handlers post-construction, breaking what would otherwise be circular `import` chains.
**Evidence:**
- Manager imports handler types but not handler implementations
- Handlers accept callback interfaces (`SdkDelegationCallbacks`, `CommandDelegationCallbacks`) instead of Manager directly
- Wire-up happens in `src/plugin.ts` composition root
**Impact:** No compile-time guarantee that handlers are set before first use. Runtime null-reference risk. Confusing initialization order.
**Fix approach:** Introduce a `DelegationDispatcher` interface that both handlers implement. Manager depends on the interface, handlers depend on callback interfaces. Register via constructor injection in plugin.ts.

---

### AP-03 — Dual Dispatch Path Divergence (HIGH)

**Files:** `src/coordination/sdk-delegation/handler.ts`, `src/coordination/command-delegation/handler.ts`
**What:** SDK and Command dispatch paths implement separate polling strategies, error handling, and completion detection logic. No shared abstract base or strategy interface.
**Evidence:**
- SDK handler uses adaptive polling (4 intervals: active/base/idle/deep-idle)
- Command handler monitors PTY stdout/stderr streams
- Different error propagation patterns
- Different timeout handling
**Impact:** Behavioral divergence between dispatch modes. Bug fixes in one path don't apply to the other. Testing requires covering both paths independently.
**Fix approach:** Define `DelegationDispatchStrategy` interface with `dispatch()`, `poll()`, `cancel()`, `cleanup()` methods. Both handlers implement the interface. Shared polling logic extracted to `AdaptivePoller` utility.

---

### AP-04 — State Machine with Too Many Concerns (HIGH)

**File:** `src/coordination/delegation/state-machine.ts`
**What:** `DelegationStateMachine` owns four in-memory Maps: `delegations`, `delegationsBySession`, `safetyTimers`, `gracePeriodTimers`. It manages both state transitions AND resource lifecycle (timers).
**Evidence:**
- `delegations: Map<string, Delegation>` — primary state
- `delegationsBySession: Map<string, Set<string>>` — session-to-delegation index
- `safetyTimers: Map<string, NodeJS.Timeout>` — timeout resource management
- `gracePeriodTimers: Map<string, NodeJS.Timeout>` — timer resource management
- `start()`, `complete()`, `fail()`, `cancel()` methods manage both state AND timers
**Impact:** State consistency is coupled to timer lifecycle. A timer leak = state corruption. Difficult to test state transitions independently of timer behavior.
**Fix approach:** Split into `DelegationStateStore` (delegations + index Maps, pure CRUD) and `DelegationTimerService` (timer lifecycle, calls back to state store on expiry).

---

### AP-05 — Fragile Concurrency Key Resolution (MEDIUM)

**File:** `src/coordination/concurrency/queue.ts` — `buildDelegationQueueKey()`
**What:** Queue key resolution uses a 5-level fallback cascade: `provider:model → model → agent:category → agent → category → "default"`. The resolution order is implicit and hard to predict.
**Evidence:**
```typescript
// Pseudocode from queue.ts
if (provider && model) return `${provider}:${model}`
if (model) return `model:${model}`
if (agent && category) return `${agent}:${category}`
if (agent) return `agent:${agent}`
if (category) return `category:${category}`
return "default"
```
**Impact:** Two delegations with the same agent but different providers may share a concurrency slot unexpectedly. Key prediction requires tracing all 5 branches.
**Fix approach:** Normalize to a structured key format: `{type}:{value}` with explicit resolution order documented. Consider making the key a discriminated union type for compile-time safety.

---

### AP-06 — Permission Resolution Spread Across 3 Files (MEDIUM)

**Files:** `src/coordination/spawner/spawn-request-builder.ts`, `src/coordination/spawner/agent-primitive-policy.ts`, agent metadata
**What:** Permission profile derivation requires: (1) `enrichAgentFromPrimitives()` loads `.opencode/agents` metadata, (2) `toolsFromAgentMetadata()` parses tools/permission fields, (3) `isReviewOnlyTask()` does string matching heuristic, (4) `resolveDelegationPermissionProfile()` combines all three.
**Evidence:**
- `enrichAgentFromPrimitives()` in `agent-primitive-policy.ts:37-50` — async I/O to load primitives
- `toolsFromAgentMetadata()` in `spawn-request-builder.ts:84-95` — parses agent.tools or agent.permission
- `isReviewOnlyTask()` in `spawn-request-builder.ts:127-136` — string heuristic
- `resolveDelegationPermissionProfile()` in `spawn-request-builder.ts:70-82` — combines results
**Impact:** Understanding the permission model requires reading 3 files with non-obvious call chains. The string heuristic for review detection is easily gamed (e.g., agent named "reviewer-but-writes").
**Fix approach:** Consolidate permission resolution into a single `PermissionProfileResolver` class with clear stages: enrich → parse → classify → resolve. Replace string heuristic with explicit agent metadata field.

---

### AP-07 — Review-Only Detection Uses String Matching (MEDIUM)

**File:** `src/coordination/spawner/spawn-request-builder.ts:31-35, 127-136`
**What:** `REVIEW_MARKERS = ["review", "critic", "audit", "verify", "research", "inspect", "read-only"]` and `isReviewOnlyTask()` joins agent name + title + prompt + category + description into a haystack, then checks `includes(marker)`.
**Evidence:**
```typescript
const REVIEW_MARKERS = ["review", "critic", "audit", "verify", "research", "inspect", "read-only"]
// ...
const haystack = [params.agent, params.title, params.prompt, params.category, agent.name, agent.category, agent.description]
  .filter(...)
  .join(" ")
  .toLowerCase()
return REVIEW_MARKERS.some((marker) => haystack.includes(marker))
```
**Impact:** False positives: agent named "research-and-implement" gets read-only. False negatives: agent named "analyst" with write needs gets write-capable. No audit trail for the decision.
**Fix approach:** Add an explicit `permissionMode` field to agent frontmatter. Use string matching only as fallback when field is absent. Log the resolution decision for audit.

---

### AP-08 — Three Overlapping Status Models (HIGH)

**Files:** `src/shared/types.ts:3,145-154,156,259-265`, `src/shared/task-status.ts`
**What:** Four status enums exist: `TaskStatus` (8 values), `HarnessStatus` (9 values), `SessionLifecyclePhase` (6 values), `DelegationPacketStatus` (4 values). The mapping table in `types.ts:126-138` documents conversion but runtime conversion is manual and error-prone.
**Evidence:**
- `TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "error" | "cancelled" | "interrupt"`
- `HarnessStatus` adds `"dispatching"` but uses same values for others
- `SessionLifecyclePhase` drops `"error"`, `"cancelled"`, `"interrupt"`, maps them to `"failed"`
- `DelegationPacketStatus` collapses to 4 values: `"pending" | "running" | "completed" | "failed"`
**Impact:** Status conversion bugs are invisible at compile time. A `TaskStatus.error` mapped to `HarnessStatus.error` then to `SessionLifecyclePhase.failed` loses the error distinction. Downstream consumers can't distinguish error from cancellation.
**Fix approach:** Make `HarnessStatus` the single canonical status. Derive other views via explicit converter functions with exhaustiveness checks. Add `toLifecyclePhase()`, `toPacketStatus()` converter functions with unit tests.

---

### AP-09 — Unnecessary Indirection in Concurrency-Key Module (MEDIUM)

**File:** `src/coordination/spawner/concurrency-key.ts` (13 LOC)
**What:** `resolveDelegationConcurrencyKey()` is a single-function passthrough that calls `buildDelegationQueueKey()` from `queue.ts`. No additional logic, no transformation, no validation.
**Evidence:**
```typescript
export function resolveDelegationConcurrencyKey(args): string {
  return buildDelegationQueueKey(args)
}
```
**Impact:** Every call to `resolveDelegationConcurrencyKey` could call `buildDelegationQueueKey` directly. The indirection adds a file to maintain without adding value. Callers must know which function to import.
**Fix approach:** Either add validation/transformation logic to this module, or remove it and import `buildDelegationQueueKey` directly. If kept, add queue-key format validation here.

---

### AP-10 — Manager Mixes Orchestration with Resource Lifecycle (HIGH)

**File:** `src/coordination/delegation/manager.ts`
**What:** Manager directly creates and clears `setTimeout` calls for safety ceilings and grace periods. Timer management is interleaved with dispatch orchestration logic.
**Evidence:**
- `startSafetyTimer()` — creates setTimeout, stores in state machine
- `clearGracePeriodTimer()` — clears timeout from state machine
- Timer expiry callbacks inline in manager methods
- No centralized timer cleanup on shutdown
**Impact:** Timer leaks on unexpected errors. No single point of cleanup. Difficult to test timer behavior without mocking `setTimeout`. Race conditions between timer expiry and normal completion.
**Fix approach:** Extract `DelegationTimerManager` with `startSafetyTimer()`, `startGracePeriod()`, `cancelAll()`, `cleanup()` methods. Manager delegates timer operations, never touches `setTimeout` directly.

---

### AP-11 — Re-export Chain Creates Import Confusion (MEDIUM)

**Files:** `src/shared/types.ts:373-399`, `src/coordination/delegation/types.ts`
**What:** `shared/types.ts` re-exports 9 types and 13 constants from `coordination/delegation/types.ts`. The comment says "backward compatibility — existing imports unchanged" but creates a confusing dependency where a leaf-like shared module imports from a deep coordination module.
**Evidence:**
```typescript
// shared/types.ts:373-399
export type { DelegationStatus, DelegationSurface, ... } from "../coordination/delegation/types.js"
export { DEFAULT_SAFETY_CEILING_MS, MAX_DELEGATION_DEPTH, ... } from "../coordination/delegation/types.js"
```
**Impact:** Importers can reach delegation types from either `shared/types` or `coordination/delegation/types`. Violates the leaf constraint where `shared/` should not import from `coordination/`. Creates hidden coupling.
**Fix approach:** Deprecate the re-exports. Add a migration plan: consumers should import from `coordination/delegation/types.js` directly. Remove re-exports after all consumers are migrated.

---

### AP-12 — Hardcoded Polling Intervals (MEDIUM)

**File:** `src/coordination/delegation/types.ts` (constants)
**What:** Polling intervals are exported constants: `POLL_INTERVAL_ACTIVE_MS`, `POLL_INTERVAL_BASE_MS`, `POLL_INTERVAL_IDLE_MS`, `POLL_INTERVAL_DEEP_IDLE_MS`. Not configurable via runtime policy.
**Evidence:**
- Constants defined in `types.ts`, re-exported via `shared/types.ts`
- No `RuntimePolicy` field overrides these values
- SDK handler reads them directly
**Impact:** Cannot tune polling behavior per-project or per-delegation-category. High-frequency delegations waste cycles polling at fixed intervals.
**Fix approach:** Add `pollingPolicy` to `RuntimePolicy` with override fields. Handler reads from resolved policy, falls back to constants.

---

### AP-13 — Session Creator Has No Retry Logic (MEDIUM)

**File:** `src/coordination/spawner/session-creator.ts` (35 LOC)
**What:** `spawnDelegatedSession()` calls `createSession()` once. If the SDK call fails (network, rate limit, transient error), the delegation fails immediately with no retry.
**Evidence:**
```typescript
const childSession = await createSession(args.client, { ... })
// No try/catch, no retry, no backoff
```
**Impact:** Transient SDK failures cause permanent delegation failures. The retry queue added in CP-ST-06 handles persistence-level retries but not session creation retries.
**Fix approach:** Add bounded retry with exponential backoff (3 attempts, 1s→2s→4s) for transient SDK errors. Distinguish between retryable (network, 429) and non-retryable (auth, validation) errors.

---

### AP-14 — CompletionDetector State Accumulation Risk (HIGH)

**File:** `src/coordination/completion/detector.ts`
**What:** CompletionDetector maintains three Maps: `watchers`, `cachedResults`, `stabilityTimers`. These grow with each delegation and are only cleaned up when completion is detected.
**Evidence:**
- `watchers: Map<string, ...>` — one entry per active delegation
- `cachedResults: Map<string, ...>` — accumulates results
- `stabilityTimers: Map<string, NodeJS.Timeout>` — one timer per watched delegation
- Cleanup happens in `onDelegationComplete()` callback
**Impact:** If completion detection fails (bug, race condition), entries accumulate indefinitely — memory leak. No TTL or max-size guard on these Maps. No periodic cleanup sweep.
**Fix approach:** Add TTL-based eviction for Maps (e.g., max 1 hour). Add periodic cleanup sweep (every 5 minutes). Add max-size guard (e.g., 1000 entries). Log warnings when eviction triggers.

---

## D) Dependency Graph

```text
src/tools/delegation/delegate-task.ts
  └──→ src/coordination/delegation/manager.ts  (direct import)
          ├──→ src/coordination/delegation/state-machine.ts
          │       └──→ src/coordination/delegation/types.ts
          ├──→ src/coordination/delegation/types.ts
          ├──→ src/coordination/concurrency/queue.ts
          │       └──→ (buildDelegationQueueKey logic)
          ├──→ src/coordination/sdk-delegation/handler.ts  (via lazy setter)
          │       ├──→ src/coordination/spawner/spawn-request-builder.ts
          │       │       ├──→ src/coordination/spawner/spawner-types.ts
          │       │       ├──→ src/coordination/spawner/agent-primitive-policy.ts
          │       │       │       └──→ src/features/bootstrap/primitive-loader.ts
          │       │       └──→ src/shared/types.ts (DEFAULT_SAFETY_CEILING_MS)
          │       └──→ src/coordination/spawner/session-creator.ts
          │               └──→ src/shared/session-api.ts
          ├──→ src/coordination/command-delegation/handler.ts  (via lazy setter)
          └──→ src/coordination/completion/detector.ts

src/shared/types.ts  (RE-EXPORTS from coordination/delegation/types.ts)
  └──→ src/coordination/delegation/types.ts  ← VIOLATES leaf constraint

src/coordination/spawner/concurrency-key.ts
  └──→ src/coordination/concurrency/queue.ts  (pure passthrough)
```

### Dependency Metrics

| Module | Dependencies | Dependents | Risk |
|--------|-------------|------------|------|
| `manager.ts` | 8+ | 2 tools + plugin.ts | Highest — changes ripple everywhere |
| `state-machine.ts` | 1 (types.ts) | manager.ts | High — single point of state corruption |
| `types.ts` (delegation) | 0 | 7+ modules + shared/types.ts re-export | Medium — type changes cascade widely |
| `queue.ts` | 0 | manager.ts, concurrency-key.ts | Low — isolated logic |
| `detector.ts` | 1 (types.ts) | manager.ts | Medium — completion coupling |
| `spawn-request-builder.ts` | 2 | SDK handler | Medium — permission authority |
| `session-creator.ts` | 1 (session-api) | SDK handler | Low — thin wrapper |

---

## E) So sánh OpenCode Innate Delegation vs Hivemind Harness

| Capability | OpenCode Innate | Hivemind Harness | Gap |
|-----------|----------------|-------------------|-----|
| **Session spawning** | `client.createSession()` — basic parent/child linking | Wraps + adds permission profiles, safety ceilings, execution mode selection | Harness adds bounded permissions |
| **Completion detection** | No built-in mechanism — caller polls manually | Dual-signal (idle + message threshold) with adaptive polling | Harness provides automated completion |
| **Concurrency control** | None — unlimited parallel sessions | Per-key concurrency gates with configurable limits | Harness adds resource management |
| **Status tracking** | Basic session status (idle/busy) | 4-tier status model (Task/Harness/Lifecycle/Packet) | Harness provides granular lifecycle |
| **Recovery** | None — lost sessions stay lost | Startup recovery of pending delegations from persistence | Harness adds crash recovery |
| **Permission scoping** | Agent-level permissions from `.opencode/agents` | Derives least-privilege tool allowlist per delegation | Harness adds per-task permission narrowing |
| **Depth limiting** | None | MAX_DELEGATION_DEPTH (default 3) | Harness prevents runaway nesting |
| **Category gates** | None | Runtime policy category gate (ask/allow unknowns) | Harness adds classification gates |
| **Timer management** | None | Safety ceiling + grace period timers | Harness adds bounded execution |
| **Persistence** | None | Delegation records to `.hivemind/state/` | Harness adds durable state |

### Key Insight

OpenCode provides **session primitives** (create, send message, list sessions). Hivemind builds **orchestration** on top: lifecycle management, concurrency, completion detection, recovery, and permission scoping. The gap is entirely in coordination and reliability — OpenCode has no opinion about how sessions relate to each other.

---

## F) Recommended Tackle Order

### Phase 1 — Structural Safety (address CRITICAL + HIGH that affect data integrity)

| Priority | Problem ID | Action | Estimated Effort |
|----------|-----------|--------|------------------|
| F-01 | AP-01 | Extract `DelegationTimerManager` from manager.ts | 1 plan |
| F-02 | AP-04 | Split `DelegationStateMachine` → StateStore + TimerService | 1 plan |
| F-03 | AP-10 | Move all setTimeout calls behind TimerManager | (covered by F-01) |
| F-04 | AP-14 | Add TTL eviction + max-size guards to CompletionDetector Maps | 1 plan |
| F-05 | AP-02 | Replace lazy setters with interface-based DI | 1 plan |

### Phase 2 — Behavioral Consistency (address divergence and confusion)

| Priority | Problem ID | Action | Estimated Effort |
|----------|-----------|--------|------------------|
| F-06 | AP-03 | Define `DelegationDispatchStrategy` interface, extract shared polling | 1 plan |
| F-07 | AP-08 | Add `toLifecyclePhase()` / `toPacketStatus()` converter functions | 1 plan |
| F-08 | AP-05 | Normalize concurrency key to structured format with explicit resolution | 1 plan |

### Phase 3 — Code Quality (address MEDIUM that slow development)

| Priority | Problem ID | Action | Estimated Effort |
|----------|-----------|--------|------------------|
| F-09 | AP-06 | Consolidate permission resolution into `PermissionProfileResolver` | 1 plan |
| F-10 | AP-07 | Add explicit `permissionMode` agent frontmatter field | 1 plan |
| F-11 | AP-11 | Deprecate `shared/types.ts` re-exports, migrate consumers | 1 plan |
| F-12 | AP-12 | Add `pollingPolicy` to `RuntimePolicy` | 1 plan |
| F-13 | AP-13 | Add bounded retry to `spawnDelegatedSession` | 1 plan |
| F-14 | AP-09 | Remove or justify `concurrency-key.ts` passthrough | 0.5 plan |

### Summary

| Severity | Count | Phase |
|----------|-------|-------|
| CRITICAL | 1 (AP-01) | Phase 1 |
| HIGH | 5 (AP-02, AP-03, AP-04, AP-08, AP-10, AP-14) | Phase 1 + Phase 2 |
| MEDIUM | 6 (AP-05, AP-06, AP-07, AP-09, AP-11, AP-12, AP-13) | Phase 2 + Phase 3 |

**Total estimated effort:** ~11 plans across 3 phases
**Highest risk if deferred:** AP-01 (god-object), AP-04 (state + timer coupling), AP-14 (memory leak)

---

*Audit produced by GSD codebase mapper — 2026-05-18 — evidence level L3 static analysis*
