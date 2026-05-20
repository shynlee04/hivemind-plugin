# Deep Analysis: Coordination and Hooks Sectors

**Analysis Date:** 2026-05-21

**Scope:** All 31 files under `src/coordination/` + all 16 files under `src/hooks/`

## 1. Delegation Lifecycle Flow (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DELEGATION LIFECYCLE FLOW                              │
│                                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────────┐       │
│  │ delegate-task │    │  DelegationManager  │    │    DelegationCoordinator   │   │
│  │    tool      │───▶│   (thin facade)    │───▶│       (v2 dispatch)         │   │
│  │  (tools/)    │    │   manager.ts      │    │    coordinator.ts           │   │
│  └──────────────┘    └────────┬─────────┘    └─────────────┬─────────────┘       │
│                               │                            │                     │
│                     ┌─────────▼─────────┐      ┌───────────▼───────────┐        │
│                     │ RuntimeDelegation   │      │ DelegationDispatcher │        │
│                     │ Manager (v1 legacy) │      │   dispatcher.ts      │        │
│                     │ manager-runtime.ts │      │   (preflight checks) │        │
│                     │                    │      └───────────┬───────────┘        │
│                     │  SdkDelegation     │                  │                    │
│                     │  Handler           │      ┌───────────▼───────────┐        │
│                     │  sdk-delegation/   │      │   AgentResolver        │        │
│                     │  handler.ts        │      │   agent-resolver.ts    │        │
│                     │                    │      │   (validate agent)     │        │
│                     │  CommandDelegation │      └───────────┬───────────┘        │
│                     │  Handler           │                  │                    │
│                     │  command-delegation│      ┌───────────▼───────────┐        │
│                     │  /handler.ts       │      │   SlotManager          │        │
│                     └────────────────────┘      │   slot-manager.ts      │        │
│                                                  │   (per-session slots) │        │
│                                                  └───────────┬───────────┘        │
│                                                              │                    │
│                                                  ┌───────────▼───────────┐        │
│                                                  │  Spawner              │        │
│                                                  │  spawn-request-       │        │
│                                                  │  builder.ts           │        │
│                                                  │  session-creator.ts   │        │
│                                                  │  agent-primitive-     │        │
│                                                  │  policy.ts            │        │
│                                                  └───────────┬───────────┘        │
│                                                              │                    │
│                                                  ┌───────────▼───────────┐        │
│                                                  │  SdkDelegationHandler  │        │
│                                                  │  sdk-delegation/       │        │
│                                                  │  handler.ts            │        │
│                                                  │  (stability polling)  │        │
│                                                  └───────────┬───────────┘        │
│                                                              │                    │
│                                                  ┌───────────▼───────────┐        │
│                                                  │  CompletionDetector    │        │
│                                                  │  completion/detector.ts│        │
│                                                  │  (dual-signal)        │        │
│                                                  └───────────┬───────────┘        │
│                                                              │                    │
│                                                  ┌───────────▼───────────┐        │
│                                                  │  DelegationState       │        │
│                                                  │  Machine               │        │
│                                                  │  state-machine.ts      │        │
│                                                  │  (persist, timers)    │        │
│                                                  └─────────────────────────┘        │
│                                                                                 │
│  CONCURRENCY & MONITORING                                                       │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐         │
│  │ DelegationConcurr- │  │ DelegationMonitor │  │ FailureCheckpoint    │         │
│  │ encyQueue          │  │ monitor.ts       │  │ Tracker             │         │
│  │ concurrency/queue  │  │ (progressive     │  │ escalation-timer.ts │         │
│  │ .ts                │  │  polling)        │  │ (checkpoint levels) │         │
│  └────────────────────┘  └──────────────────┘  └─────────────────────┘         │
│                                                                                 │
│  NOTIFICATIONS                                                                  │
│  ┌────────────────────────┐  ┌──────────────────┐  ┌───────────────────┐      │
│  │ NotificationRouter     │  │ Notification-     │  │ completion/      │      │
│  │ notification-router.ts │  │ formatter.ts      │  │ notification-    │      │
│  │ (route/deliver/        │  │ (pure formatting) │  │ handler.ts       │      │
│  │  queuePending/replay)  │  └──────────────────┘  │ (notifyParent-   │      │
│  └────────────────────────┘                        │  Session, replay) │      │
│                                                     └───────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Two parallel dispatch paths exist simultaneously:**
- **v1 (legacy/runtime-adapter):** `manager.ts` → `manager-runtime.ts` → `SdkDelegationHandler` / `CommandDelegationHandler`
- **v2 (coordinator):** `manager.ts` → `DelegationCoordinator` → `DelegationDispatcher` → `SlotManager` → spawner → `SdkDelegationHandler`

The facade routes based on whether `client` (v1) or `coordinator` (v2) is injected.

## 2. Hook Event Chain

```
OpenCode Runtime Event
    │
    ▼
event hook (createCoreHooks)
    │
    ├──▶ lifecycleManager.handleEvent({event, eventType, sessionID})
    │       └──▶ CompletionDetector.feed(eventType, sessionID) — on idle/error/deleted
    │
    ├──▶ lifecycleManager.replayPendingNotificationsForEvent(sessionID, eventType)
    │
    ├──▶ consumeDelegationFact (createDelegationConsumer)
    │       └──▶ createDelegationEventObserver
    │               ├── "session.idle" → delegationManager.handleSessionIdle
    │               ├── "session.error" → delegationManager.handleSessionError
    │               └── "session.deleted" → delegationManager.handleSessionDeleted
    │
    ├──▶ sessionEventObserver (createSessionHooks)
    │       └──▶ auto-loop retry logic on "session.idle"
    │
    ├──▶ consumeSessionTrackerFact (createSessionTrackerConsumer)
    │       └──▶ sessionTracker.handleSessionEvent
    │
    ├──▶ consumeSessionEntryFact (createSessionEntryConsumer)
    │       └──▶ createSessionEntryEventObserver (intake classification)
    │
    └──▶ consumeIsMainSessionFact (createSessionMainConsumer)
            └──▶ createSessionIsMainObserver (main vs delegated session)

system.transform / experimental.chat.system.transform
    └──▶ Language Governance injection (if main session)
    └──▶ Governance block injection (mode, expertise, language)
    └──▶ Session intake context injection
    └──▶ Behavioral profile context injection

messages.transform
    └──▶ CURRENTLY NO-OP (stripped in Phase 35)

shell.env
    └──▶ CI=true, GIT_TERMINAL_PROMPT=0, NO_COLOR=1, TERM=dumb

tool.execute.before
    └──▶ Tool guard (circuit breaker, budget, repeated-signature detection)
    └──▶ Language governance reminder (Write/Edit on .md files)
    └──▶ Session tracker: detect task tool dispatch for proactive child discovery

chat.message
    └──▶ delegationManager.recordChildMessageSignal (feeds v2 coordinator)
    └──▶ createChatMessageCapture → sessionTracker.handleChatMessage

tool.execute.after
    └──▶ createToolExecuteAfterHook
    │       └──▶ toolGuardHooks["tool.execute.after"] (inject _harness metadata)
    │
    ├──▶ delegationManager.recordChildToolSignal (feeds v2 coordinator)
    ├──▶ sessionTracker.handleToolExecuteAfter
    └──▶ createToolAfterWorkflow (configure-primitive persistence)

experimental.session.compacting
    └──▶ Inject lifecycle snapshot + auto-loop state + continuity + intake into context
```

## 3. Per-File Classification: COORDINATION (31 files)

### delegation/ (18 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `manager.ts` | 362 | **MIGRATIONAL** | Thin public facade | Routes to v2 coordinator or v1 runtime adapter. Migration artifact — consolidate when v1 paths removed. |
| `manager-runtime.ts` | 478 | **ACTIVE** | Heavy runtime implementation | Real dispatch, concurrency, session polling, recovery. Near 500 LOC cap. |
| `types.ts` | 196 | **ACTIVE** | Shared delegation contracts | `Delegation`, `DelegationResult`, constants. Imported from `shared/types.ts` re-exports. |
| `state-machine.ts` | 443 | **ACTIVE** | In-memory store + transitions | `DelegationStateMachine` — extracted to respect 500 LOC cap. Owns `delegations`, `delegationsBySession`, `safetyTimers`. |
| `coordinator.ts` | 445 | **ACTIVE** | v2 SDK-free dispatch coordinator | Separate parallel implementation alongside runtime manager. Creates its own in-memory store (`this.active`). |
| `dispatcher.ts` | 63 | **ACTIVE** | Preflight checks | Concurrency slot + depth + agent validation. Used by v2 coordinator path. |
| `agent-resolver.ts` | 58 | **ACTIVE** | Agent validation + permission profile | Validates app agents, builds permission profiles. |
| `completion-detector.ts` | 273 | **ACTIVE (misnamed)** | Semantic completion analysis | PURE functions: `checkSemanticCompletion()`, `hasFileChangeIndicators()`, etc. NOT a detector class. Naming conflicts with `completion/detector.ts`. |
| `escalation-timer.ts` | 86 | **ACTIVE** | Failure checkpoint tracking | `FailureCheckpointTracker` — 60/120/180/300s levels. |
| `lifecycle.ts` | 93 | **ACTIVE** | Lifecycle adapter over state machine | Thin wrapper for DelegationLifecycle. |
| `monitor.ts` | 229 | **ACTIVE** | Progressive polling + completion check | `DelegationMonitor` — 30→45→60→90→120→180s cadence. Schedules failure checkpoints. |
| `notification-formatter.ts` | 123 | **ACTIVE** | Pure formatting functions | No side effects, no state. |
| `notification-router.ts` | 155 | **ACTIVE** | Route delegation notifications to parent | With idempotency keys, pending queue, replay. |
| `resume-resolver.ts` | 82 | **ACTIVE** | Resume strategy logic | Determines reuse vs fresh dispatch. |
| `retry-handler.ts` | 50 | **ACTIVE** | Exponential backoff for persistence | Writes to degraded file as fallback. |
| `sdk-child-session-starter.ts` | 62 | **ACTIVE** | Start SDK child session | Creates session, sends prompt with permission profile. Used by v2 coordinator. |
| `slot-manager.ts` | 107 | **ACTIVE** | Per-session + per-key slot gating | Wraps `DelegationConcurrencyQueue`. Higher level than concurrency/queue.ts. |
| `survival-kit.ts` | 129 | **ACTIVE** | Context compaction survival | Serializes/deserializes delegation state for compacted context. |

### completion/ (2 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `detector.ts` | 226 | **ACTIVE** | Watcher-based dual-signal completion | `CompletionDetector` class — watches events, feeds message counts, dual-signal. The canonical completion watcher. |
| `notification-handler.ts` | 242 | **ACTIVE** | Parent session notification delivery | `notifyDelegationTerminal()`, `replayPendingNotifications()`. |

### concurrency/ (1 file)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `queue.ts` | 300 | **ACTIVE** | Per-key lane-based concurrency gate | `DelegationConcurrencyQueue`. Primitives: acquire/release/enqueue/dequeue. Also contains `SpawnReservation` for descendant budget. |

### command-delegation/ (1 file)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `handler.ts` | 416 | **ACTIVE** | PTY + headless command execution | `CommandDelegationHandler`. Handles both PTY and headless child_process paths. |

### sdk-delegation/ (1 file)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `handler.ts` | 324 | **ACTIVE** | SDK delegation polling + stability | `SdkDelegationHandler`. Adaptive polling, dual-signal integration, recovery. |

### spawner/ (7 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `spawn-request-builder.ts` | 137 | **ACTIVE** | Build SDK spawn requests + permission profiles | Permission resolution from agent metadata. |
| `session-creator.ts` | 35 | **ACTIVE** | Create child session via SDK | Thin wrapper around `createSession()`. |
| `spawner-types.ts` | 82 | **ACTIVE** | Spawner contracts | `DelegationSpawnRequest`, `DelegationPermissionProfile`, `DelegationSpawnResult`. |
| `agent-primitive-policy.ts` | 51 | **ACTIVE** | Enrich agent metadata from local primitives | Falls back gracefully on failure. |
| `concurrency-key.ts` | 12 | **NEAR-DEAD** | Single-line wrapper | `resolveDelegationConcurrencyKey()` just calls `buildDelegationQueueKey()`. Documented as "runtime adoption in plan 16-04." |
| `parent-directory.ts` | 9 | **ACTIVE** | Resolve working directory | Simple priority chain: contextDirectory > worktree > parentSessionDirectory > cwd. |
| `auto-loop.ts` | — | **ACTIVE** | Auto-loop execution | Referenced in plugin.ts imports. |
| `ralph-loop.ts` | — | **ACTIVE** | Ralph-loop execution | Referenced in plugin.ts imports. |

## 4. Per-File Classification: HOOKS (16 files)

### composition/ (1 file)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `cqrs-boundary.ts` | 36 | **ACTIVE** | CQRS write boundary enforcement | `classifyHookEffect()`, `assertHookWriteBoundary()`. Currently **no actual enforcement** — the functions are called but the assertion only runs if explicitly invoked. |

### guards/ (2 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `governance-block.ts` | 104 | **ACTIVE** | Governance block builder | Pure function: builds the `--- Governance ---` block for system prompt injection. |
| `tool-guard-hooks.ts` | 203 | **ACTIVE** | Tool guard hooks | Circuit breaker, budget, language guard. `tool.execute.before` and `tool.execute.after`. |

### lifecycle/ (2 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `core-hooks.ts` | 212 | **ACTIVE** | Core lifecycle hook factory | `event`, `system.transform` (×2), `messages.transform` (NO-OP), `shell.env`. |
| `session-hooks.ts` | 340 | **ACTIVE** | Session hooks factory | Event handler + compaction handler. Auto-loop retry logic. |

### observers/ (5 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `event-observers.ts` | 135 | **ACTIVE** | Three observer factories | `createDelegationEventObserver()`, `createSessionEntryEventObserver()`, `createSessionIsMainObserver()`. Core observation logic. |
| `delegation-consumer.ts` | 41 | **ACTIVE** | Routes delegation facts to DelegationManager | Pass-through: observer → DelegationManager methods. |
| `session-entry-consumer.ts` | 22 | **THIN SHELL** | Routes session entry facts | Catches errors silently. Candidates for consolidation. |
| `session-main-consumer.ts` | 20 | **THIN SHELL** | Routes main-session facts | Catches errors silently. Candidates for consolidation. |
| `session-tracker-consumer.ts` | 41 | **ACTIVE** | Routes events to session tracker | Error-logging wrapper. |

### transforms/ (4 files)

| File | LOC | Status | Role | Notes |
|------|-----|--------|------|-------|
| `chat-message-capture.ts` | 39 | **THIN SHELL** | Chat message capture | Single delegation to sessionTracker.handleChatMessage(). |
| `tool-after-composer.ts` | 71 | **ACTIVE** | Tool-after response shaping | `createToolExecuteAfterHook()` — composes guard + output summary. |
| `tool-after-workflow.ts` | 54 | **ACTIVE (niche)** | Workflow persistence | Only activates for `configure-primitive` tool. Best-effort. |
| `tool-before-guard.ts` | 67 | **ACTIVE** | Tool-before guard composition | Wraps tool guard hook + session tracker detection. |

## 5. Cross-Cutting Findings

### 5.1 Duplicate Codepaths

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 1 | **Two DelegationManager classes** | `manager.ts` + `manager-runtime.ts` | Migration artifact. The facade adds 362 LOC of indirection. Every method delegates to either `coordinator` (v2) or `runtime` (v1). When v1 paths are removed, `manager.ts` can fold into a thinner adapter. |
| 2 | **Two in-memory delegation stores** | `coordinator.ts` (`this.active` Map) + `state-machine.ts` (`this.delegations` Map) | The v2 coordinator maintains its own `this.active` Map + `delegationByChildSession` Map, SEPARATE from the state machine used by the runtime manager. This means two independent stores track delegation state — potential for drift. |
| 3 | **"completion-detector" naming collision** | `delegation/completion-detector.ts` (pure functions) vs `completion/detector.ts` (class) | The former exports pure semantic analysis functions; the latter exports the `CompletionDetector` watcher class. Different purposes, same name concept. |
| 4 | **Two concurrency abstractions** | `concurrency/queue.ts` (primitive) + `delegation/slot-manager.ts` (wrapper) | SlotManager wraps DelegationConcurrencyQueue. The primitive queue is also imported directly by manager-runtime.ts. Two different concurrent gating paths exist. |
| 5 | **Dual system.transform registration** | `core-hooks.ts` lines 175-187 | Both `system.transform` and `experimental.chat.system.transform` registered with identical implementations. The former is for backward compat/tests; only the latter is dispatched by the OpenCode runtime. |

### 5.2 Leaky Abstractions

| # | Issue | Description |
|---|-------|-------------|
| 1 | **Hooks call delegationManager directly** | `plugin.ts` binds `delegationManager.handleSessionIdle()`, `.handleSessionError()`, `.handleSessionDeleted()`, `.recordChildMessageSignal()`, `.recordChildToolSignal()` directly into hook handlers. This creates tight coupling between hooks (read-side) and delegation (write-side orchestration). |
| 2 | **CompletionDetector wired through lifecycleManager, but consumed by SdkDelegationHandler** | `plugin.ts` line 272: `delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())`. The lifecycle manager owns the detector, but the SDK handler consumes it via a lazy accessor on delegation manager's callbacks. This is a documented circular dependency workaround (Phase 36.1). |
| 3 | **Notification handler persists directly** | `notification-handler.ts` calls `patchSessionContinuity()` and `recordSessionContinuity()` directly, which are durable writes. This violates the hook CQRS boundary (hooks should not write). Called from `state-machine.ts -> notifyDelegationTerminal()`, which is in coordination, not hooks. So technically ok — the hook routes the signal, but coordination performs the write. |
| 4 | **assertHookWriteBoundary() is called but never throws** | `classifyHookEffect()` is called at the top of several hook functions (e.g., `tool-guard-hooks.ts` lines 69, 162; `core-hooks.ts` line 194), but the result is assigned to a variable that is never used. `assertHookWriteBoundary()` is never actually called with `"durable-write"` operation. The boundary is documented but not actively enforced at runtime. |

### 5.3 File Consolidation Opportunities

| Opportunity | Files | Benefit |
|-------------|-------|---------|
| **Merge manager.ts + manager-runtime.ts** | 2 files, ~840 LOC total | Removes indirection when v1 paths die. |
| **Merge observer consumer files** | `session-entry-consumer.ts`, `session-main-consumer.ts` → inline into `plugin.ts` | Saves 42 LOC of trivial pass-through wrappers. |
| **Remove concurrency-key.ts** | `concurrency-key.ts` (12 LOC) | Single wrapper line. Inline or remove. |
| **Remove redundant `system.transform` hook** | `core-hooks.ts` line 175-180 | Keep only `experimental.chat.system.transform`. |
| **Merge notification-formatter.ts into notification-router.ts** | 2 files, 278 LOC total | Router is the only consumer of formatter. Could be same module. |

### 5.4 CQRS Boundary Analysis

The CQRS boundary states: **hooks must not perform durable writes**.

Actual behavior:
- **Hooks in `tool-guard-hooks.ts`**: Call `stateManager.ensureStats()` and `stateManager.addWarning()` — these are in-memory state mutations, not durable writes. ✅
- **Hooks in `core-hooks.ts`**: Call `lifecycleManager.handleEvent()`, `replayPendingNotificationsForEvent()` — delegated to task-management. ✅
- **Hooks in `session-hooks.ts`**: Call `getSessionContinuity()`, `getSessionMessages()`, `lifecycleManager.requestAutoLoopRetry()`, `stateManager.addWarning()` — reads and delegated writes. ✅
- **Notification handler in `completion/notification-handler.ts`**: Calls `patchSessionContinuity()` and `recordSessionContinuity()` — **direct durable writes** — but this is in the coordination sector, not hooks. ⚠️ The location is correct per the architecture, but the function name doesn't make this clear.
- **Tool after workflow in `transforms/tool-after-workflow.ts`**: Calls `persistWorkflow()` via dynamic import — **durable write from a transform file**. This IS in the hooks sector and performs a durable write. ❌

**Verdict:** `tool-after-workflow.ts` violates the CQRS boundary by performing durable writes (`persistWorkflow()`) from the hooks sector.

### 5.5 Dead Code / No-Op Analysis

| Code | File | Status |
|------|------|--------|
| `messages.transform` handler | `hooks/lifecycle/core-hooks.ts:189-196` | Documented no-op (stripped Phase 35). Just copies input to output. Still registered. |
| `system.transform` (non-experimental) | `hooks/lifecycle/core-hooks.ts:175-180` | Only used by tests. Same implementation as experimental version. |
| Governance engine comment | `hooks/guards/tool-guard-hooks.ts:8` | Doc comment says "Governance evaluation is no-op" — stripped in 14-01. |
| `concurrency-key.ts` wrapper | `coordination/spawner/concurrency-key.ts` | Single-line delegating wrapper. Documented for future plan. |

### 5.6 Import Chain Complexity

The `manager-runtime.ts` has the most complex import chain — 15 imports from 10 different modules across `shared/`, `task-management/`, `config/`, `spawner/`, `concurrency/`, `command-delegation/`, `sdk-delegation/`, `routing/`, and `features/`:

```
manager-runtime.ts imports:
  → shared/types.ts
  → shared/session-api.ts
  → shared/runtime-policy.ts
  → shared/app-api.ts
  → task-management/continuity/delegation-persistence.ts
  → config/subscriber.ts
  → spawner/agent-primitive-policy.ts
  → spawner/concurrency-key.ts
  → spawner/parent-directory.ts
  → spawner/session-creator.ts
  → spawner/spawn-request-builder.ts
  → concurrency/queue.ts
  → command-delegation/handler.ts
  → sdk-delegation/handler.ts
  → delegation/state-machine.ts
  → delegation/monitor.ts
  → delegation/notification-router.ts
```

### 5.7 Vulnerability: Configuration Persists from Hooks

`transforms/tool-after-workflow.ts` performs `persistWorkflow()` — a durable write — from a hook transform. This violates the CQRS boundary. The comment says "Best-effort persistence — never fail the tool call" but this doesn't address the architectural violation. This code should be moved to a tool-level handler or routed through the task-management sector.

## 6. Summary Statistics

| Metric | Coordination | Hooks |
|--------|-------------|-------|
| Total files | 31 | 16 |
| Total LOC | ~4,800 | ~1,400 |
| Active files | 28 | 12 |
| Migration artifacts | 1 (`manager.ts`) | 0 |
| Thin shells | 0 | 2 (`session-entry-consumer`, `session-main-consumer`) |
| Near-dead | 1 (`concurrency-key.ts`) | 1+ (`messages.transform`, `system.transform`) |
| CQRS violations | 0 | 1 (`tool-after-workflow.ts`) |
| Duplicate stores | 2 (coordinator + state-machine) | 0 |
| Parallel dispatch paths | 2 (v1 runtime + v2 coordinator) | 0 |

---

*Deep analysis: 2026-05-21*
