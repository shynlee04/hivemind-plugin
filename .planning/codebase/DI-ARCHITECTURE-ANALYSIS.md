# Dependency Injection & Architecture Analysis

**Analysis Date:** 2026-05-21

## Executive Summary

**Primary pattern: EXPLICIT FACTORY INJECTION** — consistent across ~30+ tool/hook/feature instantiations. Every dependency enters through the composition root (`src/plugin.ts`), which creates typed dependency bundles and passes them to factory functions. There is **one dominant pattern** with **variants** (not competing patterns).

**Pattern consistency: HIGH** (~90% of the codebase follows factory injection). The exception is `src/config/subscriber.ts` (module-level singleton) and `src/routing/command-engine/` (pure imports).

---

## 1. Composition Root: `src/plugin.ts`

### Pattern: Explicit factory injection + standalone setup function

**Lines:** 493 total
**Role:** Composition root — instantiates all shared dependencies, wires hook factories, registers tools.

**Key structural elements:**

```
HarnessControlPlane (Plugin object)
  ├── Startup: loadRuntimePolicy → getConfig → ptyManager → setupDelegationModules
  ├── Recovery: delegationManager.recoverPending() → lifecycleManager.hydrateFromContinuity()
  ├── Session tracker: new SessionTracker({ client, projectRoot }) (fire-and-forget init)
  ├── Observers: createSessionEntryEventObserver() → createDelegationEventObserver()
  ├── Consumers: createSessionEntryConsumer() → createDelegationConsumer() → createSessionTrackerConsumer()
  ├── Hooks: createCoreHooks(deps) → createSessionHooks(deps) → createToolGuardHooks(deps)
  └── Tool registry: { "tool-name": createXxxTool(deps), ... } (23 tools)
```

**`setupDelegationModules()` (lines 155-217):**
- Standalone function (not a class) that creates a complete delegation module cluster
- Returns a 7-module bundle `DelegationModuleSetup`
- Internal wiring is explicit: creates `SlotManager` → `AgentResolver` → `DelegationDispatcher` → `CompletionDetector` → `NotificationRouter` (with closure-callback for TUI) → `DelegationLifecycle` (with inline Map closure) → `DelegationMonitor` (with closure callbacks) → `DelegationRetryHandler` → `DelegationCoordinator` → `DelegationManager`
- **Implicit ordering constraint:** `coordinatorRef` is set on line 204 after the `coordinator` is created, and consumed in `monitor.onFirstActionDeadline` closure. This creates a temporal coupling.

**Dependency injection approach in plugin.ts:**
- `deps` object on line 323: constructed explicitly, passed to `createSessionHooks(deps)` and `createCoreHooks({...deps, eventObservers})`
- Consumer factories receive only the interfaces they need: `createDelegationConsumer({ observer, handleSessionIdle, ... })`
- Tool registry: each tool factory call is inline in the tool object literal — no separate registration step

**Fire-and-forget pattern (3 instances):**
1. `delegationManager.recoverPending()` — line 244
2. `sessionTracker.initialize().then(() => sessionTracker.cleanup())` — lines 276-287
3. `replayPendingDelegationNotifications(client)` — line 262

**Anti-pattern:** Fire-and-forget promises are uncaught at the top level. The `sessionTracker.initialize()` call has a `.catch()` but others are fire-and-forget without error handlers beyond internal catches.

---

## 2. Public API Surface: `src/index.ts`

### Pattern: Barrel re-export

**Lines:** 30 total
**Structure:**
- `export { HarnessControlPlane }` — the plugin object
- `export * from 18 modules` — everything public
- `export { executeCommandEngineAction, listCommands, discoverCommandBundles }` — selective named exports

**What's exposed:**
| Module | Exports |
|--------|---------|
| `coordination/concurrency/queue.js` | Queue, concurrency key |
| `task-management/continuity/index.js` | Session continuity persistence |
| `shared/helpers.js`, `runtime.js`, `session-api.js`, `state.js`, `types.js`, `task-status.js` | Shared utilities |
| `shared/runtime-policy.js` | Runtime policy types |
| `coordination/completion/detector.js` | Completion detection |
| `task-management/journal/*.js` | Journal, execution lineage |
| `features/doc-intelligence/index.js` | Document intelligence |
| `task-management/trajectory/index.js` | Trajectory ledger |
| `features/runtime-pressure/index.js` | Runtime pressure |
| `features/agent-work-contracts/index.js` | Work contracts |
| `features/sdk-supervisor/index.js` | SDK diagnostics |
| `features/bootstrap/*.js` | Bootstrap/primitive registry |
| `routing/command-engine/index.js` | Command discovery |

**Note:** No module-level hiding — everything under the re-exported module paths is public.

---

## 3. Tool Factories: `src/tools/`

### Pattern: Factory injection — CONSISTENT

Every tool is created via `createXxxTool(deps)` where deps vary. The **factory signature** determines the injection shape:

| Tool | Factory Signature | Dependency Shape |
|------|-------------------|-----------------|
| `delegate-task.ts` | `createDelegateTaskTool(coordinator: CoordinatorLike, config?)` | Narrow interface |
| `delegation-status.ts` | `createDelegationStatusTool(delegationManager: ManagerLike, deps: StatusDeps)` | Narrow interface + deps bundle |
| `run-background-command.ts` | `createRunBackgroundCommandTool({ delegationManager, ptyManager })` | Destructured object |
| `hivemind-doc.ts` | `createHivemindDocTool(projectRoot: string)` | String primitive |
| `execute-slash-command.ts` | `createExecuteSlashCommandTool(client)` | SDK client |
| `session-journal-export.ts` | `createSessionJournalExportTool()` | None (self-contained) |
| `session-patch/index.ts` | `createSessionPatchTool(projectDirectory: string)` | String primitive |
| `configure-primitive.ts` | `createConfigurePrimitiveTool()` | None (self-contained — imports all deps) |
| `validate-restart.ts` | `createValidateRestartTool()` | None |
| `bootstrap-init.ts` | `createBootstrapInitTool()` | None |
| `bootstrap-recover.ts` | `createBootstrapRecoverTool()` | None |
| `prompt-skim/tools.ts` | `createPromptSkimTool(projectDirectory: string)` | String primitive |
| `prompt-analyze/tools.ts` | `createPromptAnalyzeTool(projectDirectory: string)` | String primitive |
| `hivemind-trajectory.ts` | `createHivemindTrajectoryTool(projectRoot: string)` | String primitive |
| `hivemind-pressure.ts` | `createHivemindPressureTool(projectRoot: string)` | String primitive |
| `hivemind-sdk-supervisor.ts` | `createHivemindSdkSupervisorTool()` | None |
| `hivemind-command-engine.ts` | `createHivemindCommandEngineTool(projectRoot: string)` | String primitive |
| `session-tracker.ts` | `createSessionTrackerTool(projectRoot: string)` | String primitive |
| `session-hierarchy.ts` | `createSessionHierarchyTool(projectRoot: string)` | String primitive |
| `session-context.ts` | `createSessionContextTool(projectRoot: string)` | String primitive |
| `hivemind-session-view.ts` | `createHivemindSessionViewTool(projectRoot: string)` | String primitive |
| `hivemind-agent-work.ts` | `createHivemindAgentWorkCreateTool(projectRoot)`, `createHivemindAgentWorkExportTool(projectRoot)` | String primitive |

**Tool factory variance analysis:**
- **Type A: Narrow interface** (2 tools) — `CoordinatorLike`, `ManagerLike` — duck-typed minimal surfaces. Cleanest approach.
- **Type B: Concrete class** (1 tool) — `DelegationManager` used directly in `run-background-command.ts`. Creates tighter coupling.
- **Type C: Destructured deps object** (1 tool) — `{ delegationManager, ptyManager }`. Clean.
- **Type D: String primitive** (11 tools) — `projectRoot`. These tools use `projectRoot` to scope file-system operations.
- **Type E: No deps** (6 tools) — Self-contained via direct imports (config, compiler, bootstrap).

**Key finding:** There are 5 distinct dependency shapes across 21 tool factories. This is **variance within a consistent pattern** — type D (projectRoot string) dominates because these tools are file-system-scoped and have no runtime dependencies.

---

## 4. Hook Factories: `src/hooks/`

### Pattern: Factory injection — CONSISTENT

| Hook | Factory Signature | Dependency Shape |
|------|-------------------|-----------------|
| `core-hooks.ts` | `createCoreHooks(deps: HookDependencies)` | Shared bundle |
| `session-hooks.ts` | `createSessionHooks(deps: HookDependencies)` | Shared bundle |
| `tool-guard-hooks.ts` | `createToolGuardHooks(deps: ToolGuardDependencies)` | Narrow bundle |
| `delegation-consumer.ts` | `createDelegationConsumer(deps: DelegationConsumerDeps)` | Narrow interface |
| `session-tracker-consumer.ts` | `createSessionTrackerConsumer(deps: SessionTrackerConsumerDeps)` | Narrow interface |
| `session-entry-consumer.ts` | `createSessionEntryConsumer(observer)` | Single function |
| `session-main-consumer.ts` | `createSessionMainConsumer(observer)` | Single function |
| `event-observers.ts` | `createDelegationEventObserver()` / `createSessionEntryEventObserver()` / `createSessionIsMainObserver()` | None (closures) |

**`HookDependencies`** (defined in `src/hooks/types.ts`, 61 lines):
```typescript
interface HookDependencies {
  lifecycleManager: HarnessLifecycleManager
  client: OpenCodeClient
  stateManager: TaskStateManager
  eventObservers?: Array<(input: { event?: unknown }) => Promise<void> | void>
  autoLoopConfig?: Partial<AutoLoopConfig>
  parentAutoLoopConfig?: Partial<ParentAutoLoopConfig>
  sleep?: (ms: number) => Promise<void>
  runAutoLoop?: <T>(options: AutoLoopOptions<T>) => Promise<AutoLoopResult<T>>
  runRalphLoop?: <T>(options: RalphLoopOptions<T>) => Promise<RalphLoopResult<T>>
  escalationMessage?: <T>(result: RalphLoopResult<T>) => string
  getIntake?: (sessionId: string) => IntakeResult | undefined
  hivemindConfig?: HivemindConfigs
  getFreshHivemindConfig?: () => HivemindConfigs
  getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile
  isMainSession?: (sessionId: string) => boolean
}
```

**CQRS boundary enforcement:**
- `classifyHookEffect()` in `src/hooks/composition/cqrs-boundary.ts` classifies hooks as "observation", "response-shaping", or "guard-decision"
- `assertHookWriteBoundary()` throws if a hook attempts a "durable-write" operation
- All hooks have `durableWriteAllowed: false` — hooks must NOT write to filesystem

**Observer → Consumer pattern:**
Observers produce facts (read-side) → Consumer factories route facts to write-side (tools/coordination):
```
Event → DelegationEventObserver → DelegationEventFact → DelegationConsumer → DelegationManager.handleSessionIdle()
Event → SessionEntryEventObserver → SessionEntryEventFact → (intake cache)
Event → SessionIsMainObserver → (isMainSession cache) → SessionTrackerConsumer → SessionTracker.handleSessionEvent()
```

---

## 5. Delegation Dual-Facade: `manager.ts` + `manager-runtime.ts`

### Pattern: Adapter/Facade for migration

**`src/coordination/delegation/manager.ts`** (362 lines):
- `DelegationManager` class — thin public facade
- Constructor: `(client?: OpenCodeClient, options: DelegationManagerOptions)`
- **Two dispatch paths:**
  1. v2 path (coordinator injected): delegates to `DelegationCoordinator.dispatch()`
  2. v1 path (runtime adapter): delegates to `RuntimeDelegationManager.dispatch()`
- Routes `handleSessionIdle/Error/Deleted` to **both** v1 runtime and v2 coordinator

**`src/coordination/delegation/manager-runtime.ts`** (478 lines):
- `DelegationManager` class — heavy legacy runtime implementation
- Uses `SdkDelegationHandler` + `CommandDelegationHandler` + `DelegationConcurrencyQueue`
- Contains PTY session management, behavioral guardrails, recovery logic

**Dual-facade flow:**
```
External call → DelegationManager (facade)
  ├── coordinator exists? → v2: DelegationCoordinator.dispatch()
  └── client exists? → v1: RuntimeDelegationManager.dispatch()
```

**Anti-pattern concern:** The optional `client` parameter and dual-path dispatch create conditional branching throughout the facade. `canSessionAccessDelegation()` (line 307) tries v2 first, falls back to v1. `getStatus()` tries lifecycle first, falls back to runtime. This makes the facade harder to reason about.

---

## 6. Session Tracker: `src/features/session-tracker/index.ts`

### Pattern: Constructor injection with deferred initialization

**Constructor:** `new SessionTracker({ client, projectRoot })` — receives only client and root.
**Initialization:** `initialize()` (lines 432-509) — lazily constructs all inner dependencies.

**Inner module creation** via `constructDependencies()`:
- `eventCapture`, `messageCapture`, `toolCapture` — capture handlers
- `childWriter`, `sessionIndexWriter`, `projectIndexWriter`, `hierarchyIndex` — persistence writers
- `pendingRegistry`, `manifestWriter`, `recovery`, `retryQueue` — state management
- `bootstrap`, `classifier`, `sessionRouter`, `childRecorder`, `orphanCleanup` — routing/cleanup
- `toolDelegation` — ToolDelegation (constructed after Object.assign of deps)
- `projectContinuityChecker` — ProjectContinuityChecker (constructed after deps)

**Lifecycle signals from plugin.ts:**
1. Constructor invoked (line 248)
2. `delegationManager.setCompletionDetector(...)` called (line 272) — closes dependency loop
3. `sessionTracker.initialize()` called fire-and-forget (line 276)
4. `sessionTracker.cleanup()` called after initialize (line 277) — cleanup starts immediately!

**Anti-pattern: Cleanup-on-init.** Line 277 calls `sessionTracker.cleanup()` immediately after `initialize()`. This is intentional per the source comment ("init+cleanup") but confusing — the cleanup clears the retry flush interval immediately after the retry queue is flushed. This means the retry flush loop runs only once during init and never again unless a new `chat.message` or `tool.execute.after` event triggers additional writes.

**Null assertion concern:** All inner properties (eventCapture, messageCapture, etc.) are declared with `!` (definite assignment assertion, lines 68-88) because `initialize()` sets them lazily. If `handleSessionEvent()` or `handleChatMessage()` is called before `initialize()` completes, it hits a `TypeError` on undefined properties.

---

## 7. Config: `src/config/subscriber.ts`

### Pattern: Module-level singleton — the ONLY global state

**Lines:** 97 total

```typescript
let cachedConfig: HivemindConfigs | null = null
let cachedProjectRoot: string | null = null
```

**API:**
- `getConfig(projectRoot)` — lazy-loads + caches (keyed by projectRoot)
- `getCachedConfig()` — returns cache or defaults
- `getFreshConfig(projectRoot)` — always reads disk (used by `system.transform` hook for live config)
- `invalidateConfigCache()` — clears cache

**Consumers:**
- `src/plugin.ts` (line 235): `getConfig(projectDirectory)` — startup config load
- `src/plugin.ts` (line 323): `getFreshConfig` passed as dep to hooks
- `src/tools/hivemind/run-background-command.ts` (line 159): `getCachedConfig()` — checks delegation flags
- `src/hooks/lifecycle/core-hooks.ts` (line 78): `getFreshHivemindConfig?.()` — live config on every request

**Why this is an anti-pattern:**
- Module-level mutable state can't be reset between tests without calling `invalidateConfigCache()`
- The caching logic is trivial (one if-check) but global — any import of `subscriber.js` shares the state
- `getCachedConfig()` returning defaults when cache is cold is a silent fallback that may mask missing config loading

---

## 8. Command Engine: `src/routing/command-engine/index.ts`

### Pattern: Standalone pure functions with direct imports

**Lines:** 223 total

No factory function needed — these are pure/semi-pure functions that import dependencies directly:
- `discoverCommandBundles()` — imports `loadPrimitives()` directly
- `analyzeCommandContract()` — pure function, no dependencies
- `renderCommandContext()` — pure function
- `transformCommandMessages()` — pure function
- `routeCommandPreview()` — imports `detectRuntimePressure()` directly

**Why no injection:** These functions are stateless and don't need runtime dependencies. They receive all their inputs as parameters.

**Exported via `src/index.ts`:** `executeCommandEngineAction`, `listCommands`, `discoverCommandBundles` are part of the public npm package API.

---

## 9. Pattern Comparison Summary

| Layer | Pattern | Variance | Anti-patterns |
|-------|---------|----------|---------------|
| `plugin.ts` | Factory injection | Spread-merge hook composition | Fire-and-forget promise hygiene |
| `tools/` | Factory injection | 5 dep shapes (narrow interface → string → none) | `run-background-command.ts` uses concrete `DelegationManager` class |
| `hooks/` | Factory injection | Shared bundle vs narrow bundles | None significant |
| `coordination/delegation/` | Constructor injection + adapter | Dual-facade (v1/v2 bridge) | Optional client param creates conditional branching |
| `features/session-tracker/` | Constructor + deferred init | Lazy dependency construction | Cleanup-on-init, null assertions on all properties |
| `config/` | Module singleton | — | Global mutable state, only mutable global in codebase |
| `routing/command-engine/` | Pure function imports | — | No DI (but stateless, so acceptable) |
| `index.ts` | Barrel re-export | — | Everything is public — no hidden internals |

**Overall verdict: ONE consistent pattern (factory injection) with acceptable variance.** The codebase does NOT have competing DI frameworks or mixed patterns. The variants are:

1. **Factory function → tool/hook** (~30 instances) — dominant, recommended pattern
2. **Constructor injection** (2 instances: `DelegationManager`, `SessionTracker`) — used for stateful classes
3. **Module-level singleton** (1 instance: `config/subscriber.ts`) — legacy/utility pattern
4. **Pure function imports** (1 instance: `command-engine/index.ts`) — stateless utilities

---

## 10. Anti-Patterns and Risks

### Anti-Pattern 1: Module-level Config Singleton
**Files:** `src/config/subscriber.ts` (lines 22-25)
**Impact:** Global mutable state that leaks across tests and cannot be tree-shaken.
**Recommendation:** Consider passing config as an explicit dependency where needed, or making the cache instance-scoped.

### Anti-Pattern 2: Fire-and-Forget Promise Hygiene
**Files:** `src/plugin.ts` (lines 244, 262, 276-277, 290)
**Impact:** Uncaught promise rejections in fire-and-forget calls. Only `sessionTracker.initialize()` has a `.catch()`. If `delegationManager.recoverPending()` or `replayPendingDelegationNotifications()` rejects, the error is silently swallowed.
**Recommendation:** Add `.catch()` handlers or `void` annotations with error logging.

### Anti-Pattern 3: SessionTracker Cleanup-on-Init
**Files:** `src/plugin.ts` (lines 276-277), `src/features/session-tracker/index.ts` (lines 516-532)
**Impact:** `cleanup()` is called immediately after `initialize()`, which clears the retry flush interval. The retry queue only flushes once during init.
**Recommendation:** This appears intentional but is misleading. Document the intended lifecycle more clearly or restructure so `cleanup()` is only called on shutdown.

### Anti-Pattern 4: DelegationManager Dual-Path
**Files:** `src/coordination/delegation/manager.ts` (lines 51-362)
**Impact:** The optional `client` constructor parameter creates conditional branching across 10+ methods. Every method must check "which path am I on?"
**Recommendation:** Complete the v2 migration and remove the v1 runtime adapter path.

### Anti-Pattern 5: setupDelegationModules Temporal Coupling
**Files:** `src/plugin.ts` (lines 170, 197, 204)
**Impact:** `coordinatorRef` is set on line 204, but consumed by `monitor.onFirstActionDeadline` closure (line 197) which calls `coordinatorRef?.markExecutionUnconfirmed`. If this closure fires before line 204 executes (theoretically impossible in sync code, but fragile), it would silently no-op.
**Recommendation:** Pass the coordinator directly to `DelegationMonitor` constructor instead of using a post-construction ref assignment.

---

## 11. Wiring Diagram

```
plugin.ts
 │
 ├── loadRuntimePolicy()          ← resolveWorkspaceRuntimePolicy()
 ├── getConfig(projectDirectory)  ← config/subscriber (singleton)
 ├── createPtyManagerIfSupported() ← features/background-command
 │
 ├── setupDelegationModules({client, projectDirectory, ptyManager, runtimePolicy})
 │   ├── new SlotManager()
 │   ├── new AgentResolver({client, projectRoot})
 │   ├── new DelegationDispatcher({agentResolver, slotManager})
 │   ├── new CompletionDetector()
 │   ├── new NotificationRouter({deliver, persistPending})
 │   ├── new DelegationLifecycle({get, getAll, register, transition, ...})
 │   ├── new DelegationMonitor({getDelegationRecord, getStatus, ...})
 │   ├── new DelegationRetryHandler({persist})
 │   ├── createSdkChildSessionStarter(client)
 │   ├── new DelegationCoordinator(...)
 │   └── new DelegationManager(client, {coordinator, lifecycle, ...})
 │
 ├── createHarnessLifecycleManager({client, pollTimeoutMs, runtimePolicy, delegationManager})
 │   └── hydrateFromContinuity()
 │
 ├── new SessionTracker({client, projectRoot})
 │   └── initialize() [fire-and-forget]
 │   └── cleanup() [immediate after init]
 │
 ├── createSessionEntryEventObserver() → createSessionEntryConsumer()
 ├── createSessionIsMainObserver()    → createSessionMainConsumer()
 ├── createDelegationEventObserver()  → createDelegationConsumer({...delegationManager methods})
 ├── createSessionTrackerConsumer({sessionTracker})
 │
 ├── createCoreHooks({...deps, eventObservers})
 ├── createSessionHooks(deps)
 ├── createToolGuardHooks({stateManager, lifecycleManager, runtimePolicy, hivemindConfig})
 │
 ├── createToolBeforeGuard({toolGuardHook, sessionTracker})
 ├── createChatMessageCapture({sessionTracker})
 │
 └── tool: { 23 tools }
     ├── delegate-task         (coordinator)
     ├── delegation-status     (delegationManager + deps)
     ├── run-background-command ({delegationManager, ptyManager})
     ├── prompt-skim           (projectDirectory)
     ├── prompt-analyze        (projectDirectory)
     ├── session-patch         (projectDirectory)
     ├── execute-slash-command (client)
     ├── session-journal-export ()
     ├── hivemind-doc          (projectRoot)
     ├── hivemind-trajectory   (projectRoot)
     ├── hivemind-pressure     (projectRoot)
     ├── hivemind-sdk-supervisor ()
     ├── hivemind-command-engine (projectRoot)
     ├── session-tracker       (projectRoot)
     ├── session-hierarchy     (projectRoot)
     ├── session-context       (projectRoot)
     ├── hivemind-session-view (projectRoot)
     ├── hivemind-agent-work-create (projectRoot)
     ├── hivemind-agent-work-export (projectRoot)
     ├── configure-primitive   ()
     ├── validate-restart      ()
     ├── bootstrap-init        ()
     └── bootstrap-recover     ()
```
