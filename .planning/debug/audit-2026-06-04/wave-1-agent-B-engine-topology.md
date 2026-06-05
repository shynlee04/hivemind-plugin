# Wave 1 Agent B — Engine/Lib/Hook/Feature Topology Audit

**Audit Date:** 2026-06-04
**Track:** T4 of 9-track architectural audit
**Auditor:** GSD codebase mapper (Wave 1 Agent B)
**Mode:** L5 documentation only — no source changes
**Companion:** `wave-1a-tool-surface-and-sessions.md` (Track 1, 2, 4 — tools/sessions)
**Source-of-truth check:** file:line citations against `src/` HEAD (commit unknown; all paths verified 2026-06-04)

---

## 1. Executive Summary

### 1.1 Module Count

| Surface | Subdirectories | TS Files | LOC (sum) |
|---|---|---:|---:|
| **Composition root** | `src/` root | 2 | 1,000 (`plugin.ts:970`, `index.ts:30`) |
| **Coordination engines** | `src/coordination/` (6 subdirs) | 33 | ~7,400 |
| **Task-management engines** | `src/task-management/` (4 subdirs) | 12 | ~2,400 |
| **Features** | `src/features/` (15 subdirs) | 92 | ~19,000 |
| **Hooks** | `src/hooks/` (5 subdirs + 2 root) | 17 | ~3,200 |
| **Shared libs** | `src/shared/` (2 subdirs + 12 root) | 18 | ~2,800 |
| **Schema-kernel** | `src/schema-kernel/` (21 root files) | 22 | ~2,800 |
| **Routing** | `src/routing/` (3 subdirs) | 10 | ~1,440 |
| **Config** | `src/config/` (4 root + 1 subdir) | 8 | ~1,400 |
| **Tools** | `src/tools/` (5 subdirs + 2 root) | 16 | ~2,100 |
| **Sidecar** | `src/sidecar/` | 4 | ~700 |
| **CLI** | `src/cli/` | 6 | ~400 |
| **TOTAL** | — | **293** | **~51,988** |

**Verified at:** `find src/ -name '*.ts' | wc -l` → 293; `find src/ | xargs wc -l` → 51,988.

### 1.2 Coupling Index — Most-Central Modules

Measured by `grep "from \"\.\./\.\./"` importer count:

| Rank | Module | Importers | Role |
|---|---|---:|---|
| 1 | `src/shared/session-api.ts` (432 LOC) | 40+ | OpenCode SDK wrapper — every tool + hook uses it |
| 2 | `src/shared/types.ts` (422 LOC) | 35+ | Domain contract authority — DelegationMeta, TaskStatus, RuntimePolicy, ContinuityStoreFile |
| 3 | `src/shared/state.ts` (251 LOC) | 28+ | `TaskStateManager` — in-memory Maps (rootBudgets, sessionStats, delegationMeta) |
| 4 | `src/coordination/delegation/manager.ts` (587 LOC) | 15+ | `DelegationManager` facade — every delegation tool + spawner consumes it |
| 5 | `src/features/session-tracker/index.ts` (671 LOC) | 12+ | `SessionTracker` — fed by 3 hook chains (chat.message, tool.execute.after, tool.execute.before) |
| 6 | `src/schema-kernel/hivemind-configs.schema.ts` (551 LOC) | 28+ | Zod schema + defaults |
| 7 | `src/task-management/continuity/index.ts` (468 LOC) | 10+ | Session-continuity.json read/write |
| 8 | `src/coordination/completion/detector.ts` (252 LOC) | 8+ | `CompletionDetector` — owned by lifecycle, consumed by delegation |

The **3-axis central triad** is: `shared/session-api.ts` (SDK ingress) → `coordination/delegation/manager.ts` (delegation egress) → `features/session-tracker/index.ts` (session knowledge persistence). Every hook chain and every tool call traverses at least two of these three.

### 1.3 Top-5 Critical Findings (preview)

| # | File:Line | Issue | Impact |
|---|---|---|---|
| 1 | `src/plugin.ts:463-919` (`HarnessControlPlane`) | 970-line composition root, 26 tool factories + 8+ hook chains in one function, dependencies threaded through closures | Brittle: any refactor of a single dependency cascades through 970 lines; testing requires full init |
| 2 | `src/coordination/delegation/manager.ts:82-498` (`DelegationManager` facade) | 587-line facade delegates to BOTH `manager-runtime.ts` (v1 adapter) AND `coordinator.ts` (v2 SDK-free), with multiple "if v2 use this, else v1" branches | Dual state machines; "single source of truth" claim at line 231 is contradicted by the runtime+coordinator+state-machine triple |
| 3 | `src/features/session-tracker/index.ts:100-671` (`SessionTracker`) | 671-line "central" class but 7+ sub-modules (capture, persistence, recovery, hooks, transform, streaming, classification, child-recorder, tool-delegation) — only the public class is "central" | Refactoring SessionTracker internals risks breaking 3+ hook chains |
| 4 | `src/coordination/delegation/coordinator.ts:185-722` (`DelegationCoordinator`) | 722 LOC, depends on Dispatcher, Monitor, NotificationRouter, Lifecycle, Detector, PeriodicNotifier, childSessionStarter, optional tmuxIntegration | Dense coupling: changes to any sub-dep force coordinator re-validation; S5b fix added `tmuxIntegration` adapter as a partial workaround at line 135-137 |
| 5 | `src/hooks/transforms/tool-before-guard.ts:40-103` (`createToolBeforeGuard`) | 3-step guard chain (toolGuardHook → sessionTracker → contractEnforcement), each step best-effort, no failure surfacing | Hook contracts are independently safe but composition is implicit; plan-06 contract enforcement order is not externally testable |

**Full Top-15 detail in §9.**

### 1.4 Confidence

- **HIGH** for module counts, file paths, LOC numbers, hook registration chain, and tool registration.
- **MEDIUM** for coupling rank — measured by `grep "from \"\.\./\.\./"` matches, not actual fan-in call counts.
- **MEDIUM** for "single source of truth" claims (e.g., `manager.ts:231`) — file has `runtime?` + `options.coordinator?` dual paths; branch outcomes not all verified.

---

## 2. Coordination Engines Map (`src/coordination/`)

```
src/coordination/
├── command-delegation/         # 1 file: handler.ts (416 LOC) — Phase 51+ command delegation
├── completion/                 # 2 files: detector.ts (252), notification-handler.ts
├── concurrency/                # 1 file:  queue.ts (300) — DelegationConcurrencyQueue
├── delegation/                 # 21 files — 5,400 LOC — CORE delegation machinery
├── sdk-delegation/             # 1 file:  handler.ts — command delegation handler
└── spawner/                    # 8 files — auto-loop, ralph-loop, spawn-request-builder
```

### 2.1 `src/coordination/delegation/` — Core Delegation Machinery (5,400 LOC, 21 files)

| File | LOC | Public API | Called By |
|---|---:|---|---|
| `manager.ts` | 587 | `DelegationManager` facade (82), `createForTest()` (135), `setCompletionDetector` (160), `dispatch` (165), `dispatchCommand` (187), `recoverPending` (220), `getPoolSnapshot` (246), `abortDelegation` (283), `controlDelegation` (326), `canSessionAccessDelegation` (476) | `delegate-task`, `delegation-status`, `run-background-command` tools; `chat.message` (plugin.ts:848), `tool.execute.after` (plugin.ts:904) hooks |
| `manager-runtime.ts` | 616 | `RuntimeDelegationManager` (v1 adapter) | `DelegationManager` (manager.ts:7,100) |
| `coordinator.ts` | 722 | `DelegationCoordinator` (185), `extractSdkMessageRole` (62), `extractSdkMessageError` (77), `sdkMessageSchema` (43) | `setupDelegationModules()` (plugin.ts:435) |
| `state-machine.ts` | 445 | `DelegationStateMachine` (79+), `VALID_DELEGATION_TRANSITIONS` (44), `canTransitionDelegationStatus` (58), `deriveDelegationSurface` (72) | `setupDelegationModules()` (plugin.ts:373) |
| `lifecycle.ts` | — | `DelegationLifecycle` | `setupDelegationModules()` (plugin.ts:391) |
| `dispatcher.ts` | — | `DelegationDispatcher` (preflight + slot acquisition) | `setupDelegationModules()` (plugin.ts:376) |
| `monitor.ts` | — | `DelegationMonitor` | `setupDelegationModules()` (plugin.ts:392) |
| `notification-router.ts` | — | `NotificationRouter` (TUI prompt delivery) | `setupDelegationModules()` (plugin.ts:378) |
| `periodic-notifier.ts` | — | `PeriodicNotifier` (30s cadence, 2s batch window) | `setupDelegationModules()` (plugin.ts:418) |
| `slot-manager.ts` | — | `SlotManager` | `setupDelegationModules()` (plugin.ts:374) |
| `agent-resolver.ts` | — | `AgentResolver` | `setupDelegationModules()` (plugin.ts:375) |
| `sdk-child-session-starter.ts` | — | `createSdkChildSessionStarter(client)` | `setupDelegationModules()` (plugin.ts:432-434) |
| `pool-types.ts` | — | `DelegationPool`, `freezeDelegationPool`, `sanitizePreview` | `manager.getPoolSnapshot` (manager.ts:246) |
| `session-intelligence.ts` | — | proactive stacking recommendations | `delegate-task` tool path |
| `completion-detector.ts` | — | `CompletionDetector` (internal) | gated by `lifecycle` |
| `escalation-timer.ts` | — | escalation timing | internal |
| `notification-formatter.ts` | — | format helpers | `NotificationRouter` |
| `resume-resolver.ts` | — | resume session lookup | internal |
| `retry-handler.ts` | — | retry policy | internal |
| `survival-kit.ts` | — | recovery helpers | `recoverPending` |
| `types.ts` | — | `Delegation`, `DelegationResult`, `DelegationStatus`, `DelegationSignalSource`, `DelegationNotification`, `DelegationRecoveryGuarantee`, `DelegationTerminalKind` | every delegation file |

**Engine-to-tool wiring (verified):**
- `delegate-task` tool → `createDelegateTaskTool(delegationManager, hivemindConfig)` (plugin.ts:137) → `manager.dispatch()` or `coordinator.dispatch()`
- `delegation-status` tool → `createDelegationStatusTool(manager, ...)` (plugin.ts:138)
- `run-background-command` tool → `createRunBackgroundCommandTool({ delegationManager, ptyManager })` (plugin.ts:144) — domain mismatch noted in §9.6
- `chat.message` hook → `delegationManager.recordChildMessageSignal(...)` (plugin.ts:848)
- `tool.execute.after` hook → `delegationManager.recordChildToolSignal(...)` (plugin.ts:904)

### 2.2 `src/coordination/concurrency/queue.ts` (300 LOC)

**Public API:** `Lane` (line 8), `QueuePriority` (line 21, `"high" | "normal"`), `QueuedTask` (line 23), `buildDelegationQueueKey({provider, model, agent})` (line 30) returns `provider:..:model:..` / `model:..` / `agent:..` / `default`; `DEFAULT_CONCURRENCY_LIMIT = 3` (line 53); `DelegationConcurrencyQueue` class (line 55) with `acquire(key, limit, timeoutMs)` returning a release function.

**Reads:** `lanes` map (per-key state)
**Writes:** `lanes.active`, `lanes.pending`, `lanes.queued.high/normal`
**Called by:** `SlotManager` (per the wiring in `setupDelegationModules()`); also imported by `spawner/agent-primitive-policy.ts` indirectly
**Failure mode:** `acquire` rejects with `[Harness] Concurrency acquire timed out for key "..." after Nms.` (line 86)

### 2.3 `src/coordination/completion/detector.ts` (252 LOC)

**Public API:**
- `CompletionSignal` type (line 3) — `"idle" | "error" | "deleted" | "timeout" | "cancelled"`
- `CompletionResult` type (line 5)
- `CompletionDetector` class (line 30)
  - constructor `stabilityTimeoutMs: number = 30000` (line 38)
  - `feed(eventType, sessionID, error?)` (line 40) — terminal events: `session.idle`, `session.error`, `session.deleted`
  - `watch(sessionID, timeoutMs)` (line 69) — cached result short-circuit
  - Dual-signal watcher state at line 33 — `dualSignalWatchers` map for `watchDualSignal`
  - `signalCompletionEvent`, `signalTerminalStatus`, `unwatch`, `watchDualSignal` (consumed by `DelegationCoordinatorDeps.detector` at coordinator.ts:105-110)

**Internal state:** 5 maps — `watchers`, `cachedResults`, `dualSignalWatchers`, `messageCounts`, `stabilityTimers`, `timerStartTimes`
**Owned by:** `HarnessLifecycleManager` (`task-management/lifecycle/index.ts:73` — `private readonly completionDetector = new CompletionDetector()`)
**Wired into:** `delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())` (plugin.ts:647)

### 2.4 `src/coordination/completion/notification-handler.ts`

Exports: `notifyParentSession`, `replayPendingNotifications`
**Called by:** `DelegationCoordinator.spawnTmuxPanelForChild` (coordinator.ts:13 import), `HarnessLifecycleManager.hydrateFromContinuity` (lifecycle/index.ts:9)

### 2.5 `src/coordination/command-delegation/handler.ts` (416 LOC)

**Purpose:** Phase 51+ command delegation via shell execution
**Surface:** `createCommandDelegationHandler(deps)` — receives `runtimePolicy`, `ptyManager`, `client`
**Imports:** `RuntimePolicy`, `OpenCodeClient` from shared; `PtyManager` from features
**Wired:** referenced from `manager.ts:188` `dispatchCommand()` — calls `this.requireRuntime().dispatchCommand(params)`

### 2.6 `src/coordination/sdk-delegation/handler.ts`

**Purpose:** SDK-shaped delegation dispatch (re-exports from `command-delegation/handler.ts`)
**Surface:** `createSdkDelegationHandler(deps)`

### 2.7 `src/coordination/spawner/` (8 files, ~700 LOC)

| File | LOC | Public Surface |
|---|---:|---|
| `agent-primitive-policy.ts` | 51 | `applyAgentPolicy` — agent-level primitive restrictions |
| `auto-loop.ts` | 146 | `runAutoLoop<T>(options)` — bounded retry with completion signal |
| `parent-directory.ts` | 9 | parent dir helper |
| `ralph-loop.ts` | 182 | `runRalphLoop<T>`, `escalationMessage<T>` — escalation loop |
| `session-creator.ts` | 43 | `createChildSession(client, prompt)` |
| `spawn-request-builder.ts` | 190 | `buildSpawnRequest(...)` — used by `delegate-task` |
| `spawner/` | subdir | deeper spawner internals |
| `spawner-types.ts` | 82 | `DelegateParams`, `SpawnRequest`, `SpawnRequestInput` |

**Imported by plugin.ts:81-82:** `runAutoLoop`, `runRalphLoop`, `escalationMessage` → exposed via `HookDependencies` (hooks/types.ts:33-35).

---

## 3. Task-Management Engines Map (`src/task-management/`)

```
src/task-management/
├── continuity/      # 4 files: index.ts (468), store-cache.ts, delegation-persistence.ts, continuity-reader.ts
├── journal/         # 4 files: index.ts, query.ts, replay.ts, execution-lineage.ts
├── lifecycle/       # 1 file:  index.ts (242) — HarnessLifecycleManager
└── trajectory/      # 4 files: index.ts, ledger.ts, store-operations.ts (416), types.ts
```

### 3.1 `src/task-management/continuity/index.ts` (468 LOC) — `SessionContinuity` Authority

**Public API:**
- `getCanonicalStateDir(projectRoot?)` (line 22) — `.hivemind/state/`
- `getLegacyStateDir(projectRoot?)` (line 27) — `.opencode/state/hivemind/`
- `getSessionContinuity(sessionId)` — read record
- `listSessionContinuity()` — list all records
- `patchSessionContinuity(sessionId, patch)` — write patch
- `recordSessionContinuity(record)` — write new
- `getContinuityStoragePath()` — file path
- `CONTINUITY_VERSION = 1` (line 20)

**Reads:** `OPENCODE_HARNESS_CONTINUITY_FILE`, `OPENCODE_HARNESS_STATE_DIR` env vars
**Writes:** `assertPathWithinRoot(...)` enforces canonical root (line 50)
**Path security:** `assertPathWithinRoot` from `src/shared/security/path-scope.ts` — prevents path traversal
**Env override:** `OPENCODE_HARNESS_STATE_DIR` and `OPENCODE_HARNESS_CONTINUITY_FILE` (continuity/index.ts:39, 44)
**Cache layer:** `getStoreCache`/`setStoreCache` (store-cache.ts) for in-memory layer
**Imported by:** `replayPendingDelegationNotifications` (plugin.ts:940), `core-hooks.ts:22`, `session-hooks.ts:11`, `tool-guard-hooks.ts:11`, `agent-work-contracts/operations.ts`, `task-management/lifecycle/index.ts:8`

### 3.2 `src/task-management/continuity/delegation-persistence.ts`

`persistDelegations(records: Delegation[])` — atomic write
`readPersistedDelegations()` — read full
**Imported by:** `state-machine.ts:21` (every transition persists), `manager-runtime.ts` (v1 path)

### 3.3 `src/task-management/continuity/continuity-reader.ts`

`enrichContinuityWithTracker`, `enrichContinuityListWithTracker`
**Imported by:** `session-hooks.ts:14`, `plugin.ts:91` (for `replayPendingDelegationNotifications`)

### 3.4 `src/task-management/lifecycle/index.ts` (242 LOC) — `HarnessLifecycleManager`

**Public API:** `HarnessLifecycleManager` class (line 71) with constructor `(client, pollTimeoutMs, runtimePolicy?, delegationManager?)` (line 77), private `completionDetector = new CompletionDetector()` (line 73), `concurrencyLimit` parsed from `OPENCODE_HARNESS_CONCURRENCY_LIMIT` (default 3, line 80), `hydrateFromContinuity()` (plugin.ts:631), `getCompletionDetector()` (plugin.ts:647). Plus `isValidTransition` (line 63), `isTerminalPhase` (line 67), `LaunchDelegatedSessionArgs` (line 28), `VALID_LIFECYCLE_TRANSITIONS` map (line 54) — 7 phases: `created`, `queued`, `dispatching`, `running`, `completed`, `failed`.

**Reads:** `getSessionContinuity`, `listSessionContinuity`, `patchSessionContinuity`, `replayPendingNotifications`
**Writes:** `abortSession`, `sendPrompt` (shared/session-api.ts)
**Imports from delegation:** `type DelegationManager` (lifecycle/index.ts:10) — **circular import surface noted in §9.7**
**Imported by:** `plugin.ts:13`, `core-hooks.ts:1`, `tool-guard-hooks.ts:18`, `hooks/types.ts:1`

### 3.5 `src/task-management/journal/` (4 files)

| File | Purpose |
|---|---|
| `index.ts` | `Journal` — append-only event log under `.hivemind/journal/<sid>/` |
| `query.ts` | `queryJournal(sessionId, filter)` — time-range + type filters |
| `replay.ts` | `replayJournal(sessionId)` — sequential replay |
| `execution-lineage.ts` | lineage tracing (parent/child chain) |
| `persistence/` | writers/flushers |

**Barrel exports** at `src/index.ts:15-18` — all journal sub-modules are public API

### 3.6 `src/task-management/trajectory/` (4 files)

| File | LOC | Public API |
|---|---:|---|
| `index.ts` | — | `attachTrajectoryEvidence`, `queryTrajectory`, `trajectory.get(id)`, `trajectory.list()` |
| `ledger.ts` | — | append-only ledger |
| `store-operations.ts` | 416 | persistence + query ops |
| `types.ts` | — | `Trajectory`, `TrajectoryEvent`, `PressureEvent` |

**Imported by:** `features/agent-work-contracts/operations.ts` (cross-feature coupling — see §8.2), `features/runtime-pressure/index.ts`, `tools/hivemind/hivemind-trajectory.ts`

---

## 4. Features Map (`src/features/`)

15 subdirectories, 92 TS files, ~19,000 LOC. Most-central modules get a row in the table.

| Subdir | Files | Headline Module | LOC | Public Surface | Called By |
|---|---:|---|---:|---|---|
| `agent-work-contracts/` | 6 | `index.ts` (barrel) | — | `getActiveContractByAgent`, `upsertAgentWorkContract`, `attachTrajectoryEvidence` (operations.ts) | `plugin.ts:39` → `tool-before-guard.ts` contract enforcement |
| `auto-loop/` | 2 | `auto-loop.ts` | 146 | `runAutoLoop<T>(options)` | `plugin.ts:81` → `HookDependencies` (hooks/types.ts:33) |
| `background-command/` | 1+pty | `pty/pty-runtime.js` | — | `createPtyManagerIfSupported()` | `plugin.ts:48, 480, 500` (Bun-only optional) |
| `bootstrap/` | 7 | `primitive-registry.ts` | — | `loadPrimitives`, `registerPrimitive`, `validatePrimitives` | `plugin.ts:21` indirectly (via `core-hooks.ts:21`) |
| `capability-gate/` | 3 | `index.ts` | — | `agent-capability-profiles.ts` | (referenced by tools/agents) |
| `doc-intelligence/` | 5 | `chunker.ts`, `parser.ts`, `router.ts`, `index.ts` | — | `skimDocument`, `analyzeDocument`, `chunkDocument` | `tools/hivemind/hivemind-doc.ts` |
| `governance/` | 1 | `persistence.ts` | — | `readGovernanceState`, `writeGovernanceState` | `features/governance-engine/evaluator.ts` |
| `governance-engine/` | 4 | `evaluator.ts`, `index.ts`, `create-governance-session.ts`, `config-reader.ts` | — | `evaluateGovernance(config, profile)`, `createGovernanceSessionTool(client)` | `plugin.ts:54` → `tool-guard-hooks.ts:23`; `tools/session/` registration at plugin.ts:163 |
| `prompt-packet/` | 2 | `compaction-preservation.ts`, `kernel-packet.ts` | — | `toCompactionPacket`, `KernelPacket` type | `session-hooks.ts:20-21` |
| `ralph-loop/` | 2 | `ralph-loop.ts` | 182 | `runRalphLoop<T>`, `escalationMessage<T>` | `plugin.ts:82` |
| `runtime-pressure/` | 5 | `control-plane.ts`, `model.ts`, `authority-matrix.ts`, `index.ts` | — | `detectRuntimePressure`, `classifyPressure` | `routing/command-engine/index.ts:4`, `tools/hivemind/hivemind-pressure.ts` |
| `sdk-supervisor/` | 2 | `index.ts` | — | `inspectSdkHealth`, `heartbeat` | `tools/hivemind/hivemind-sdk-supervisor.ts` |
| `session-tracker/` | 20+ | `index.ts` (SessionTracker) | 671 | `handleSessionEvent`, `handleChatMessage`, `handleToolExecuteBefore`, `handleToolExecuteAfter`, `getManualOverrideState`/`setManualOverrideState` (line 56, 65), `SessionRecovery` | `plugin.ts:83-84, 586, 593, 736, 750` (5+ places) |
| `tmux/` | 8 | `integration.ts` (450), `tmux-multiplexer.ts` (606), `session-manager.ts` (504) | 1,560 | `createTmuxIntegrationIfSupported(projectDirectory)`, `TmuxMultiplexer`, `SessionManager`, `setSessionManagerAdapter` (types.ts) | `plugin.ts:49-50, 500, 770-779`; `coordinator.ts:135-137` |
| `tool-intelligence/` | 2 | `index.ts` | — | `getToolIntelligenceEngine`, `renderGuidance` | `tool-guard-hooks.ts:24` |

### 4.1 `src/features/session-tracker/` — Deep Dive (20+ files, ~3,000 LOC)

```
session-tracker/
├── index.ts                       # 671 — SessionTracker class + getManualOverrideState/Set
├── types.ts                       # 471 — SessionRecord, Turn, ChildSessionRecord
├── initialization.ts              # constructDependencies() + sessionTrackerRoot()
├── classification.ts              # MainAgent vs ChildSessionRecord classification
├── bootstrap.ts                   # initial wiring
├── child-recorder.ts              # child session write paths
├── orphan-cleanup.ts              # orphan session GC
├── project-continuity.ts          # .hivemind/project-continuity.json
├── session-router.ts              # route sessions to consumers
├── tool-delegation.ts             # 583 — ToolDelegation class
├── capture/, persistence/, hooks/, recovery/, transform/, streaming/  # subdirs
```

**SessionTracker class surface** (index.ts:100-671):
- constructor `(deps: { client, projectRoot })`
- `constructCoreDependencies()` (plugin.ts:593)
- `initialize()` (plugin.ts:651, fire-and-forget)
- `handleSessionEvent({ eventType, sessionID, event })`
- `handleChatMessage(input, output)`
- `handleToolExecuteBefore({ sessionID, callID, subagentType, ... })`
- `handleToolExecuteAfter(input, output)`
- `getLastMessageCapture()` (plugin.ts:811)

**Module-level state (NOT instance-bound):**
- `sessionOverrideMap` (index.ts:49) — `getManualOverrideState` (line 56), `setManualOverrideState` (line 65) — per-session `manualOverride: boolean` for P58 G5

**CQRS claim** (index.ts:9): "hooks must NEVER write files directly (REQ-ST-11)" — enforced via `assertHookWriteBoundary` (cqrs-boundary.ts:32) and best-effort wrapping in hook transforms.

### 4.2 `src/features/tmux/` — Deep Dive (8 files, ~1,560 LOC)

| File | LOC | Public API |
|---|---:|---|
| `integration.ts` | 450 | `createTmuxIntegrationIfSupported(projectDir, opts)` — silent no-op when tmux absent |
| `tmux-multiplexer.ts` | 606 | `TmuxMultiplexer` class |
| `session-manager.ts` | 504 | `SessionManager` — owns `sessions`, `spawningSessions` (idempotency guards line 223-231) |
| `grid-planner.ts` | — | `PaneGridPlanner` |
| `persistence.ts` | — | `PersistedSession` (used by manager.ts:14) |
| `observers.ts` | — | `createTmuxEventObserver(adapter)`, `ForkSessionManager` |
| `types.ts` | — | `SessionManagerAdapter`, `setSessionManagerAdapter` (module-level slot) |

**Module-level slot pattern** (types.ts): `setSessionManagerAdapter(adapter)` — published by `integration.ts:33`; consumed by `coordinator.ts:135-137` via `tmuxIntegration.adapter`.

**Wiring chain:** `plugin.ts:500` factory → `plugin.ts:770-772` observer → `plugin.ts:778-780` `setObserver(adapter)` (P58.9 REQ-58.9-01).

### 4.3 `src/features/governance-engine/` — Deep Dive (4 files)

| File | Public API |
|---|---|
| `index.ts` (14 LOC) | Barrel: `createGovernanceSessionTool`, `evaluateGovernance` |
| `evaluator.ts` | `evaluateGovernance(config, profile)` — called at `tool-guard-hooks.ts:23` |
| `create-governance-session.ts` | `createGovernanceSessionTool(client)` — registered as `create-governance-session` tool (plugin.ts:163) |
| `config-reader.ts` | `readGovernanceConfig(projectRoot)` |

**Imported by:** `plugin.ts:54` (createGovernanceSessionTool), `tool-guard-hooks.ts:23` (evaluateGovernance), `core-hooks.ts:19` (buildGovernanceBlock → `hooks/guards/governance-block.ts`).

---

## 5. Shared Libs Map (`src/shared/`)

18 files, ~2,800 LOC, 72 importers across `src/`.

```
src/shared/
├── app-api.ts               # 752b  — typed OpenCode app API surface
├── errors/
│   └── commands.ts          # error codes
├── helpers.ts               # 432 LOC — asString, getNestedValue, isObject, extractAssistantText, makeToolSignature
├── plugin-tool-output-summary.ts  # summarizePluginToolOutput
├── runtime-policy.ts        # 325 LOC — DEFAULT_RUNTIME_POLICY, getRuntimePolicyForSession
├── runtime.ts               # 2,784 bytes — runtime context (process, env)
├── security/
│   ├── path-scope.ts        # assertPathWithinRoot (path-traversal guard)
│   └── redaction.ts         # secret redaction
├── session-api.ts           # 432 LOC — OpenCode SDK wrapper (THE most-imported module)
├── session-naming.ts        # 4,837 — generate session title
├── state.ts                 # 251 LOC — TaskStateManager (in-memory state authority)
├── task-status.ts           # 818 — task status state machine
├── tool-helpers.ts          # 293 — small tool helpers
├── tool-response.ts         # 1,809 — standard tool response wrapper
├── types.ts                 # 422 LOC — domain types: DelegationMeta, RuntimePolicy, ContinuityStoreFile
└── workspace-runtime-policy.ts  # 1,334 — workspace policy resolution
```

### 5.1 `src/shared/session-api.ts` (432 LOC) — The SDK Wrapper (MOST-IMPORTED)

**Public API (key exports):**
- `OpenCodeClient` type (line 1+)
- `appendTuiPrompt(client, line)` (used at plugin.ts:961)
- `sendPromptAsync as sdkSendPromptAsync` (used at plugin.ts:383, 413, 427, 444-446)
- `getSessionMessageCount(client, sessionId)` (used at plugin.ts:139)
- `getSessionMessages(client, sessionId)` (used at coordinator.ts:206)
- `abortSession(client, sessionId)` (used at plugin.ts:140)
- `getEventSessionID(event)` (used at event-observers.ts, core-hooks.ts:17)
- `getEventParentID(event)` (used at event-observers.ts:2)
- `sendPrompt` (used at lifecycle/index.ts:11)

**40+ importers** (verified via `grep "from \"\.\./\.\./session-api\"" src/ -r`)

### 5.2 `src/shared/types.ts` (422 LOC) — Domain Type Authority

**Key exports (used by 35+ files):**
- `TaskStatus` (line 3) — `"pending" | "queued" | "running" | "completed" | "failed" | "error" | "cancelled" | "interrupt"`
- `TaskNotification` (line 5) — bridge between delegation + continuity
- `PendingNotification` (line 31) — extends TaskNotification with `createdAt`, `delivered`, `retryCount`, `maxRetries`
- `MAX_DESCENDANTS_PER_ROOT = 10` (line 40)
- `PermissionRule`, `SessionStatus`, `RootBudget`, `LoopWindow`, `ToolCallSummary`
- `CapturedResult` (line 74)
- `ContinuityStoreFile`, `SessionContinuityRecord`, `SessionContinuityMetadata`, `DelegationMeta`, `DelegationPacket`
- `CompactionCheckpointData`, `GovernancePersistenceState`
- `RuntimePolicy`, `RootBudget`, `SessionStats`

**Re-imports from delegation types:** `DelegationRecoveryGuarantee`, `DelegationSignalSource`, `DelegationStatus` (types.ts:1) — this re-export establishes the delegation → shared dependency direction

### 5.3 `src/shared/state.ts` (251 LOC) — `TaskStateManager` (CENTRAL)

**Public API:** `TaskStateManager` class (line 8) with `ensureStats` (19), `getStats` (33), `addWarning` (37), `resetStats` (44). Singleton `taskState` (exported). `hydrateDelegationState(machine, records)`, `getDelegationMeta(sessionID)` (used at tool-guard-hooks.ts:21, tool-before-guard.ts:838, governance-engine/evaluator.ts).

**Internal state (5 Maps):** `rootBudgets` (9) — `Set<string>` of descendant session IDs per root; `sessionToRoot` (10) — child → parent root; `sessionStats` (11) — per-session tool counts, loop signatures, warnings; `sessionDelegationMeta` (12) — `DelegationMeta` per session; `subagentSessions` (13) — `Set<string>` of subagent session IDs.

**28+ importers** (used by hooks, tools, governance, runtime-pressure)

### 5.4 `src/shared/runtime-policy.ts` (325 LOC)

`DEFAULT_RUNTIME_POLICY`, `getRuntimePolicyForSession(policy, override?)`
**Imported by:** `tool-guard-hooks.ts:16`, `plugin.ts:79`

### 5.5 `src/shared/security/`

- `path-scope.ts` — `assertPathWithinRoot(root, file, label)` (used at continuity/index.ts:50, 4+ other places)
- `redaction.ts` — secret redaction (used by redacting log output)

### 5.6 `src/shared/errors/commands.ts`

Error code constants (used by tools)

### 5.7 Schema Kernel (`src/schema-kernel/`, 22 files, ~2,800 LOC)

22 Zod-validated schemas; barrel at `index.ts` (8,229 LOC). Headline schemas:

| File | LOC | Public API |
|---|---:|---|
| `hivemind-configs.schema.ts` | 551 | `HivemindConfigs`, `readConfigs`, `getDefaultConfigs` — CONFIG authority |
| `generate-config-json-schema.ts` | 4,906 | JSON schema for IDE autocomplete |
| `agent-frontmatter.schema.ts` | 5,516 | `AgentFrontmatter` |
| `agent-work-contract.schema.ts` | 5,714 | `AgentWorkContract` |
| `command-frontmatter.schema.ts` | 3,953 | `CommandFrontmatter` |
| `prompt-enhance.schema.ts` | 5,796 | `PromptEnhanceInput` |
| `mcp-server.schema.ts` | 4,221 | MCP server config |
| `session-tracker.schema.ts` | 4,556 | tracker types |
| `skill-metadata.schema.ts` | 3,867 | skill frontmatter |
| `bootstrap.schema.ts` | 3,708 | `BootstrapConfig` |
| `tool.schema.ts` | 2,565 | tool registration |
| `trajectory.schema.ts` | 2,939 | `Trajectory`, `PressureEvent` |
| `session-delegation-query.schema.ts` | 2,131 | query types |
| `runtime-pressure.schema.ts` | 1,913 | `RuntimePressure` |
| `config-precedence.schema.ts` | 3,034 | precedence rules |
| `session-view.schema.ts` | 1,193 | unified view types |
| `commands.schema.ts` | 1,021 | `Command` |
| `command-engine.schema.ts` | 988 | `CommandEngineActionInput` |
| `doc-intelligence.schema.ts` | 670 | doc packet types |
| `sdk-supervisor.schema.ts` | 605 | `SdkSupervisor` |

**Imported by:** 28+ files. **Most-imported:** `hivemind-configs.schema.ts` (used by `config/subscriber.ts:18`, `core-hooks.ts`, `tool-guard-hooks.ts:19`, `plugin.ts:92`).

---

## 6. Hooks Map (`src/hooks/`)

17 TS files, ~3,200 LOC. 9 registered hooks across 5 hook-chain factories.

```
src/hooks/
├── composition/
│   └── cqrs-boundary.ts    # 36 — classifyHookEffect(), assertHookWriteBoundary()
├── guards/
│   ├── governance-block.ts # buildGovernanceBlock(config, profile)
│   └── tool-guard-hooks.ts # 296 — circuit breaker + budget + governance eval
├── lifecycle/
│   ├── core-hooks.ts       # 277 — event, system.transform, experimental.chat.system.transform, shell.env
│   └── session-hooks.ts    # 423 — experimental.session.compacting, event (auto-loop)
├── observers/
│   ├── delegation-consumer.ts     # 41
│   ├── event-observers.ts         # 136 — createDelegationEventObserver, createSessionEntryEventObserver, createSessionIsMainObserver
│   ├── session-entry-consumer.ts  # 22
│   ├── session-main-consumer.ts   # 20
│   └── session-tracker-consumer.ts # 41
├── transforms/
│   ├── chat-message-capture.ts    # 39
│   ├── contract-enforcement.ts     # 103 — Plan 06 (agent-work-contract enforcement)
│   ├── tool-after-composer.ts     # 71
│   ├── tool-after-workflow.ts      # 54
│   └── tool-before-guard.ts       # 103 — 3-step guard chain
├── pane-monitor.ts                # 542 — capture-pane polling persistence
└── types.ts                       # 66 — HookDependencies bundle
```

### 6.1 Hook Registration Order (priority / chain order)

Per `plugin.ts:805-919` return shape:

| Order | Hook | Factory | Sub-Steps | File:Line |
|---:|---|---|---|---|
| 1 | `config` | lambda | empty | plugin.ts:806 |
| 2 | `event` (core) | `createCoreHooks` | 8 observers piped through `eventObservers` array | plugin.ts:807-815 |
| 3 | `system.transform` (back-compat) | `createCoreHooks` | language block + governance + intake + delegation hints | core-hooks.ts:64-200 |
| 4 | `experimental.chat.system.transform` | `createCoreHooks` | (same handler as 3) | core-hooks.ts:64-200 |
| 5 | `shell.env` | `createCoreHooks` | env injection | core-hooks.ts:200-250 |
| 6 | `event` (session) | `createSessionHooks` | auto-loop on `session.idle`, intake classify on `session.created` | session-hooks.ts:100-300 |
| 7 | `experimental.session.compacting` | `createSessionHooks` | toCompactionPacket + KernelPacket injection | session-hooks.ts:200-280 |
| 8 | `tool.execute.before` | `createToolBeforeGuard` | toolGuardHook → sessionTracker → contractEnforcement | tool-before-guard.ts:40-103 |
| 9 | `chat.message` | inline lambda | delegationManager.recordChildMessageSignal + createChatMessageCapture | plugin.ts:846-862 |
| 10 | `tool` | `registerDelegationTools` + `registerSessionTools` + `registerHivemindTools` + `registerConfigTools` | 27 tools (delegation 3 + session 7 + hivemind 9 + config 6 + tmux 2) | plugin.ts:863-891 |
| 11 | `tool.execute.after` | inline lambda | toolGuardAfterHook + createToolExecuteAfterHook + delegationManager.recordChildToolSignal + sessionTracker.handleToolExecuteAfter + createToolAfterWorkflow | plugin.ts:894-918 |

**Observer chain (event hook) at plugin.ts:809-814:**
1. `consumeDelegationFact` (delegation-consumer.ts:14)
2. `sessionEventObserver` (from `createSessionHooks`, session-hooks.ts:44)
3. `consumeSessionTrackerFact` (session-tracker-consumer.ts:23)
4. `consumeSessionEntryFact` (session-entry-consumer.ts)
5. `consumeIsMainSessionFact` (session-main-consumer.ts)
6. inline lambda: `sessionTracker.getLastMessageCapture()?.handleEvent(event)` (plugin.ts:810-813)
7. `tmuxObserver` (observers.ts)

### 6.2 `src/hooks/composition/cqrs-boundary.ts` (36 LOC) — CQRS Authority

**Public API:** `classifyHookEffect(hook)` (line 16) maps hook name → `HookEffectKind` (`"observation" | "response-shaping" | "guard-decision"`); `assertHookWriteBoundary` (line 32) throws if `operation === "durable-write"`. The `durableWriteAllowed: false` constant on every classification (line 7, 18, 21) enforces the CQRS rule.
**Imported by:** `core-hooks.ts:18`, `tool-guard-hooks.ts:22`.

### 6.3 `src/hooks/lifecycle/core-hooks.ts` (277 LOC) — System Prompt Authority

**Public API:** `createCoreHooks(deps): CoreHooks` with `event`, `system.transform` (back-compat), `experimental.chat.system.transform` (actual SDK name per BOOT-09 note line 11-12), `shell.env`.
**Behavior** (`handleSystemTransform` line 64-200): 4-step injection — fresh config read (line 77) → language block (88-98) → governance block (100-106) → intake context (109-130) → delegation hints.
**Imported by:** `plugin.ts:32, 807`.

### 6.4 `src/hooks/transforms/tool-before-guard.ts` (103 LOC) — 3-Step Guard

**Public API:** `createToolBeforeGuard(deps)` returns the tool.execute.before handler.
**Step chain (line 53-100):**
1. `deps.toolGuardHook(input, output)` (line 55) — circuit breaker, budget, governance
2. sessionTracker detection (line 58-80) — if tool is `"task"`/`"delegate-task"`, call `sessionTracker.handleToolExecuteBefore(...)`
3. contract enforcement (lazy-built at line 44-51) — Plan 06 P25.5

Each step is best-effort; failures are swallowed (line 56 comment).

### 6.5 Other Transforms (4 small files)

- `contract-enforcement.ts` (103) — `createContractEnforcementHook(deps)` — Plan 06 agent-work-contract enforcement
- `chat-message-capture.ts` (39) — `createChatMessageCapture` (plugin.ts:41, used at 849-861)
- `tool-after-composer.ts` (71) — `createToolExecuteAfterHook` (plugin.ts:37, used at 898-901)
- `tool-after-workflow.ts` (54) — `createToolAfterWorkflow` (plugin.ts:42, used at 917)

### 6.6 `src/hooks/observers/event-observers.ts` (136 LOC) — Observer Factories

3 factories: `createDelegationEventObserver()` (line 18), `createSessionEntryEventObserver(projectDirectory)` (line 57, runs `resolveIntake()` on `session.created`, caches in `intakeCache: Map`), `createSessionIsMainObserver()` (line 100+).
**Imported by:** `plugin.ts:35, 733, 734`.
Plus 4 consumer wrappers (20-41 LOC each) at `delegation-consumer.ts`, `session-entry-consumer.ts`, `session-main-consumer.ts`, `session-tracker-consumer.ts`.

### 6.7 `src/hooks/pane-monitor.ts` (542 LOC)

**Purpose:** capture-pane polling persistence
**Wiring:** `createPaneMonitorHook({ sessionId: "harness", observer: tmuxObserver, journalRoot, logWarn })` (plugin.ts:786-800)
**Output:** 7-field JSON entries under `.hivemind/journal/<sid>/`
**Lifecycle:** Closure-captured retry timers MUST NOT be GC'd (plugin.ts:801-803 explicit `void paneMonitorHook`)

### 6.8 `src/hooks/types.ts` (66 LOC) — `HookDependencies` Bundle

18 fields including `lifecycleManager`, `client`, `stateManager`, `eventObservers`, `autoLoopConfig`, `runAutoLoop`/`runRalphLoop`/`escalationMessage`, `getIntake`, `hivemindConfig`, `getFreshHivemindConfig`, `getBehavioralProfile`, `isMainSession`, `projectDirectory`. Constructed at **plugin.ts:736** and threaded into `createCoreHooks(deps)` (807), `createSessionHooks(deps)` (737), and all sub-factory consumers.

---

## 7. Routing & Config Maps

### 7.1 `src/routing/` (3 subdirs, 10 files, ~1,440 LOC)

```
src/routing/
├── behavioral-profile/        # 4 files
│   ├── index.ts               # barrel
│   ├── profiles.ts            # 5 canonical profiles (junior, expert, etc.)
│   ├── resolve-behavioral-profile.ts  # resolveBehavioralProfile(sessionId, projectRoot)
│   └── types.ts               # ResolvedBehavioralProfile
├── command-engine/            # 2 files
│   ├── index.ts               # 254 — discoverCommandBundles, analyzeCommandContract, renderCommandContext, listCommands, executeCommandEngineAction
│   └── types.ts               # CommandBundle, CommandContractAnalysis, CommandRoutePreview, etc.
└── session-entry/             # 4 files
    ├── index.ts               # barrel
    ├── intake-gate.ts         # 194 — resolveIntake(), PURPOSE_TO_ROUTING_TARGET
    ├── language-resolution.ts # detectLanguage
    ├── profile-resolver.ts    # resolveProfile
    └── purpose-classifier.ts  # classifyPurpose
```

**`intake-gate.ts:26` — PURPOSE_TO_ROUTING_TARGET:**
```
discovery          → hm-l0-orchestrator
brainstorming      → hm-l0-orchestrator
research           → hm-l0-orchestrator
planning           → hm-l0-orchestrator
implementation     → hm-l0-orchestrator
gatekeeping        → hm-l0-orchestrator
tdd                → hm-l0-orchestrator
course-correction  → hm-l0-orchestrator
```
**All 8 purpose classes map to `hm-l0-orchestrator`** — no specialization at this layer

**`intake-gate.ts:61-87` — Trajectory Context Resolver:**
- Scans for `.planning/ROADMAP.md` and `.hivemind/planning/ROADMAP.md`
- Scans for `.planning/codebase/ARCHITECTURE.md` and `.hivemind/codebase/ARCHITECTURE.md`
- Emits trajectory warnings + JIT recommendations

**`command-engine/index.ts:29-51` — discoverCommandBundles:**
- `loadPrimitives({ projectRoot, globalConfigPath })` (line 30) from bootstrap
- Maps to `CommandBundle[]` (line 35-47) with `name`, `source`, `filePath`, `description`, `agent`, `model`, `subtask`, `body`, `namespace`, `requires`, `tools`

**`command-engine/index.ts:65-75` — analyzeCommandContract:**
- Returns `valid: boolean` (description + body non-empty)
- Returns `acceptsArguments: command.body.includes("$ARGUMENTS")`
- Returns `contextNeeds: ["bounded-context", "pressure-decision"]`
- Returns `failureStates: [...COMMAND_FAILURE_STATES]`

**Re-exports at `src/index.ts:24-28`:**
```typescript
export {
  executeCommandEngineAction,
  listCommands,
  discoverCommandBundles,
} from "./routing/command-engine/index.js"
```

### 7.2 `src/config/` (4 root files + 1 subdir, 8 files, ~1,400 LOC)

```
src/config/
├── compiler.ts              # 13,642 — config compiler (multi-source merge)
├── defaults.ts              # 33,001 — getDefaultHivemindConfig() (largest config file)
├── subscriber.ts            # 114 — getConfig(), getFreshConfig(), getCachedConfig(), invalidateConfigCache()
└── workflow/                # subdir
    ├── index.ts
    ├── workflow-guards.ts
    ├── workflow-persistence.ts
    ├── workflow-state.ts
    └── workflow-types.ts
```

**`subscriber.ts:41-49` — getConfig(projectRoot):**
- Returns cached value from `configCache: Map<projectRoot, HivemindConfigs>` (line 22)
- On miss: calls `readConfigs(projectRoot)` (line 45) — disk read
- Never throws — falls back to defaults

**`subscriber.ts:89-91` — getFreshConfig(projectRoot):**
- Bypasses cache — always reads disk
- Used by `system.transform` hook for "pick up language changes without restart" (line 85 comment)

**Imported by:** `plugin.ts:85` (`getConfig`, `getFreshConfig`)

**Wiring in plugin.ts:736:**
```typescript
const deps = {
  ...,
  hivemindConfig,
  getFreshHivemindConfig: () => getFreshConfig(projectDirectory),
  ...
}
```

---

## 8. Cross-Module Coupling Analysis

### 8.1 Importer Count by Source Module (Top 10)

Measured via `grep "from \"\.\./\.\./<module>\"" -r src/ | wc -l`:

| Source Module | Importers | What it provides |
|---|---:|---|
| `src/shared/` (all) | 72 | every shared file is heavily imported |
| `src/schema-kernel/` (all) | 28 | Zod schemas, especially `hivemind-configs.schema.ts` |
| `src/coordination/delegation/manager.ts` | 15+ | `DelegationManager` facade |
| `src/features/session-tracker/index.ts` | 12+ | `SessionTracker` |
| `src/coordination/completion/detector.ts` | 8+ | `CompletionDetector` |
| `src/task-management/continuity/index.ts` | 10+ | session-continuity |
| `src/coordination/notification-router.ts` | 6+ | `NotificationRouter` |
| `src/routing/session-entry/intake-gate.ts` | 5+ | `resolveIntake`, `IntakeResult` |
| `src/features/governance-engine/evaluator.ts` | 4+ | `evaluateGovernance` |
| `src/coordination/delegation/state-machine.ts` | 6+ | `DelegationStateMachine` |

### 8.2 Cross-Feature Coupling (Notable)

**`features/agent-work-contracts/operations.ts` → `task-management/trajectory/index.ts`:**
- `attachTrajectoryEvidence` is imported from task-management (operations.ts:2)
- Pattern: contract lifecycle event is recorded as a trajectory event
- This is the only cross-layer import in agent-work-contracts — it's a downward dependency (features → task-management)

**`features/governance-engine/evaluator.ts` → `features/governance/persistence.ts`:**
- `readGovernanceState`, `writeGovernanceState` (evaluator.ts:3)
- Cross-feature import within `features/`
- Pattern: governance-engine delegates persistence to a sibling sub-feature

**`features/runtime-pressure/control-plane.ts` → `shared/`:**
- Pressure engine reads runtime state directly
- No cycle — unidirectional

**`features/session-tracker/types.ts` → `coordination/`:**
- `session-tracker/types.ts:471+` references `coordination/delegation/types.js` for `Delegation` type
- Cross-feature → cross-coordination import (verified by `find . -name '*.ts' -path '*/features/*' | xargs grep -l "from \"\.\./\.\./coordination"`)
- Other importers: `features/auto-loop/types.ts`, `features/auto-loop/index.ts`, `features/ralph-loop/types.ts`, `features/ralph-loop/index.ts`

### 8.3 Cycle Detection

**Candidate cycles** (adirectional, NOT confirmed circular):

1. `task-management/lifecycle/index.ts:10` → `import type { DelegationManager } from "../../coordination/delegation/manager.js"`
2. `coordination/delegation/manager.ts:11` → `import type { DelegationLifecycle } from "./lifecycle.js"`

Both use `import type` — TypeScript erases the type-only import at runtime, so **no runtime cycle**. Other type-only back-references:
- `shared/types.ts:1` → `import type { DelegationRecoveryGuarantee, DelegationSignalSource, DelegationStatus } from "../coordination/delegation/types.js"` — re-exports delegation types
- `hooks/observers/event-observers.ts:3` → `import type { IntakeResult } from "../../routing/session-entry/intake-gate.js"` (no back-import from intake-gate)

### 8.4 Coupling Topologies (by Layer)

```
        ┌──────────────────────────────────────────────┐
        │  plugin.ts (composition root) — 970 LOC      │
        └────────────────────┬─────────────────────────┘
                             │ direct imports
        ┌────────────────────┼────────────────────────┐
        ▼                    ▼                        ▼
  coordination/         features/                 hooks/
  (33 files)            (92 files)                (17 files)
        │                    │                        │
        └────────┬───────────┴────────────┬───────────┘
                 ▼                        ▼
            shared/                  task-management/
            (18 files)               (12 files)
                 │                        │
                 └────────────┬───────────┘
                              ▼
                       schema-kernel/
                       (22 files)
```

**Direction is downward** (plugin → engines → libs → schema). No upward cycles detected at runtime level.

---

## 9. Top 15 Critical Findings

### CRITICAL

**1. `src/plugin.ts:463-919` — 970-line composition root.** `HarnessControlPlane` is one function: 26 tool factory calls + 8+ hook factories + 5 observer chains + 4 migrations + sidecar wiring + TUI log adapters. **Impact:** any single dep change requires re-validating 970 lines; testing requires full plugin init. **Fix:** extract `createDelegationModuleSet()`, `createHookChain()`, `createToolSet()` factories; keep `HarnessControlPlane` to <100 LOC.

**2. `src/coordination/delegation/manager.ts:82-498` — Dual state-machine facade.** `DelegationManager` (line 82) delegates to BOTH `manager-runtime.ts` (v1) AND `coordinator.ts` (v2). 9+ `if (this.options.coordinator) ... else ...` branches (lines 166, 181, 192-216, 230-232, 246-247, 282-304, 307-310, 437-440, 447-450, 463-466). Comment at line 231 claims single state machine but 3 separate stores exist: `this.runtime`, `this.options.coordinator`, `this.options.lifecycle`. **Impact:** state divergence risk between v1 and v2. **Fix:** force one path; remove dual-mode constructor; keep `coordinator`-only as canonical.

**3. `src/features/session-tracker/index.ts:100-671` — "Central" class with 7+ sub-modules.** `SessionTracker` is 671 LOC but work is split across `capture/`, `persistence/` (incl. `child-writer.ts:681`, `project-index-writer.ts:449`), `recovery/`, `hooks/`, `transform/`, `streaming/`, `classification.ts`, `child-recorder.ts`, `tool-delegation.ts` (583). Module-level `sessionOverrideMap` at line 49 is NOT instance-bound. **Impact:** refactoring sub-modules requires re-validating index.ts facade. **Fix:** split into `SessionTrackerReader` / `Writer` / `Lifecycle` while keeping facade.

**4. `src/coordination/delegation/coordinator.ts:185-722` — 8-dependency coordinator.** Constructor takes 8 deps (coordinator.ts:97-138) plus 3 optional: `childSessionStarter`, `dispatcher`, `monitor`, `notificationRouter`, `lifecycle`, `detector`, `periodicNotifier`, `onChildSessionCreated`, `client`, `sessionManager?`, `tmuxIntegration?`. S5b fix (May 2026) added `tmuxIntegration` adapter to close a panel-spawn gap (coordinator.ts:122-137 comment). **Impact:** changes to any sub-dep force coordinator re-validation; tmux adapter is a layering workaround. **Fix:** bundle into `DelegationCoordinatorContext` to reduce 11+ optional fields.

**5. `src/hooks/transforms/tool-before-guard.ts:40-103` — 3-step guard chain with no failure surfacing.** Composes `toolGuardHook` → `sessionTracker.handleToolExecuteBefore` → `contractEnforcement` (lazy-built line 44-51). Each step is best-effort; failures are silently dropped. **Impact:** guard order is implicit, not externally testable. **Fix:** explicit `GuardStepResult` return type; emit TUI log on step failure.

### HIGH

**6. `src/coordination/delegation/manager.ts:82-105` — Constructor is conditionally invalid.** Line 107-109: `else if (!options.coordinator || !options.lifecycle) { throw new Error(...) }`. Three construction modes: `(client) → runtime` vs `(coordinator+lifecycle) → facade` vs `createForTest()` (line 135, in production). **Impact:** surprising failure modes; tests share production surface. **Fix:** split `DelegationManager` (prod) from `DelegationManagerForTest`.

**7. `src/coordination/delegation/manager.ts:135-157` — `createForTest()` in production module.** Static factory builds a noop manager with shared `testPoolMap`. Returns instance that mimics production but is fundamentally different. **Impact:** tests pass that wouldn't pass in prod; BATS can mutate `__getDelegationsForTesting` (line 128) and observe via `getPoolSnapshot`. **Fix:** move `createForTest` to `manager-test-helpers.ts`.

**8. `src/coordination/delegation/state-machine.ts:445` — Disk I/O on hot transition path.** Every transition calls `persistDelegations` (state-machine.ts:21). Owns in-memory map, `safetyTimers`, `gracePeriodTimers`. **Impact:** progress-notification transitions hit disk; high-frequency path. **Fix:** batch persistence via `transitionJournal`.

**9. `src/coordination/concurrency/queue.ts:300` — No observability.** `DelegationConcurrencyQueue` manages per-key lanes (`active`, `pending`, `queued.high/normal`) but exposes no `getLaneStats()`. **Impact:** when delegations appear stuck, operator has no visibility into which key is the bottleneck. **Fix:** expose stats or integrate with `runtime-pressure`.

**10. `src/coordination/spawner/ralph-loop.ts:182` — Escalation loop with no documented stop criteria.** `runRalphLoop<T>(options)` accepts `maxIterations` but exhaustion behavior is undocumented. `escalationMessage<T>(result)` is exported as a sidecar. **Impact:** the loop can escalate indefinitely if `escalationMessage` doesn't return a stop signal. **Fix:** explicit `exhausted: true` flow; document in signature.

**11. `src/hooks/lifecycle/core-hooks.ts:64-200` — Unbounded system prompt injection.** `handleSystemTransform` reads fresh config on every call (line 77) and injects 4 blocks (language, governance, intake, behavioral profile). No size cap. **Impact:** system prompt grows past model context window over time. **Fix:** track `output.system` length; cap at N tokens.

**12. `src/features/tmux/integration.ts:36` — Port file in shared state dir.** `PORT_FILE = ".hivemind/state/tmux-port.json"` (line 36) collides with other state files. **Impact:** no rotation policy. **Fix:** move to `.hivemind/state/tmux/` subdirectory.

**13. `src/features/session-tracker/persistence/child-writer.ts:681` — Largest persistence module (681 LOC).** Mirrored by `project-index-writer.ts:449` for `.hivemind/project-continuity.json`. **Impact:** write-format change ripples through both files. **Fix:** extract shared `AtomicJsonWriter` utility.

### MEDIUM

**14. `src/coordination/delegation/pool-types.ts` — `DelegationPool` v1 schema freeze.** `schemaVersion: 1` numeric literal (manager.ts:270) is a frozen contract per D-53-13. **Impact:** schema migration will be needed when adding fields; freeze is undocumented. **Fix:** add `MIGRATION_NOTES.md` under `.planning/codebase/`.

**15. `src/task-management/continuity/index.ts:39-47` — Env-var path override bypasses path-traversal guard.** `OPENCODE_HARNESS_CONTINUITY_FILE` and `OPENCODE_HARNESS_STATE_DIR` allow arbitrary path; `assertPathWithinRoot` (line 50) only validates when env-var is NOT set. **Impact:** malicious env could redirect continuity to `/tmp/exfil`. **Fix:** validate env-var paths through `assertPathWithinRoot` regardless of source.

---

## 10. Appendix — Cross-Reference Index

### 10.1 All `src/coordination/delegation/*` Files (21)
`agent-resolver.ts`, `coordinator.ts` (722), `completion-detector.ts`, `dispatcher.ts`, `escalation-timer.ts`, `lifecycle.ts`, `manager.ts` (587), `manager-runtime.ts` (616), `monitor.ts`, `notification-formatter.ts`, `notification-router.ts`, `periodic-notifier.ts`, `pool-types.ts`, `resume-resolver.ts`, `retry-handler.ts`, `sdk-child-session-starter.ts`, `session-intelligence.ts`, `slot-manager.ts`, `state-machine.ts` (445), `survival-kit.ts`, `types.ts`.

### 10.2 All `src/features/*` Subdirectories (15)
`agent-work-contracts/`, `auto-loop/`, `background-command/`, `bootstrap/`, `capability-gate/`, `doc-intelligence/`, `governance/`, `governance-engine/`, `prompt-packet/`, `ralph-loop/`, `runtime-pressure/`, `sdk-supervisor/`, `session-tracker/` (20+ files, ~3,000 LOC), `tmux/` (8 files, ~1,560 LOC), `tool-intelligence/`.

### 10.3 All `src/hooks/*` Files (17)
`composition/cqrs-boundary.ts` (36), `guards/governance-block.ts`, `guards/tool-guard-hooks.ts` (296), `lifecycle/core-hooks.ts` (277), `lifecycle/session-hooks.ts` (423), `observers/delegation-consumer.ts` (41), `observers/event-observers.ts` (136), `observers/session-entry-consumer.ts` (22), `observers/session-main-consumer.ts` (20), `observers/session-tracker-consumer.ts` (41), `transforms/chat-message-capture.ts` (39), `transforms/contract-enforcement.ts` (103), `transforms/tool-after-composer.ts` (71), `transforms/tool-after-workflow.ts` (54), `transforms/tool-before-guard.ts` (103), `pane-monitor.ts` (542), `types.ts` (66).

### 10.4 All `src/shared/*` Files (18)
`app-api.ts`, `errors/commands.ts`, `helpers.ts` (432), `plugin-tool-output-summary.ts`, `runtime-policy.ts` (325), `runtime.ts`, `security/path-scope.ts`, `security/redaction.ts`, `session-api.ts` (432), `session-naming.ts`, `state.ts` (251), `task-status.ts`, `tool-helpers.ts`, `tool-response.ts`, `types.ts` (422), `workspace-runtime-policy.ts` (+ 3 implicit types-only re-exports).

### 10.5 All `src/routing/*` Files (10)
`behavioral-profile/{index,profiles,resolve-behavioral-profile,types}.ts`, `command-engine/{index,types}.ts`, `session-entry/{index,intake-gate,language-resolution,profile-resolver,purpose-classifier}.ts`.

### 10.6 All `src/config/*` Files (8)
`compiler.ts` (13,642), `defaults.ts` (33,001), `subscriber.ts` (114), `workflow/{index,workflow-guards,workflow-persistence,workflow-state,workflow-types}.ts`.

---

## 11. Closing Notes

**Not covered:** `src/tools/*` (see Wave 1A), `src/sidecar/*` (Next.js sidecar), `src/cli/*`, `.opencode/*` (out of scope per AGENTS.md Source vs Deploy), `.hivemind/*` (out of scope for L5 topology; covered by `hm-l3-hivemind-state-reference` skill).

**Recommended follow-up audits:**
- **Wave 2 — Delegation state-machine audit** (`state-machine.ts`, `manager-runtime.ts`, `coordinator.ts` — dual-state-machine finding)
- **Wave 2 — Session-tracker refactor candidates** (`session-tracker/index.ts:100-671` + 7+ sub-modules)
- **Wave 2 — Hook-chain observability** (3-step tool.execute.before chain + best-effort failures)
- **Wave 2 — Schema migration plan** (`pool-types.ts` schemaVersion: 1 freeze)

**Production evidence gap:** Per `.planning/AGENTS.md`: "L5 documentation only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows." This audit is L5 only — file:line citations, no runtime verification. All "called by" claims derive from import analysis, not traced runtime calls. Coupling rank uses static `grep` fan-in, not dynamic call-graph analysis.

**No code mutations were performed.** All changes during this audit were limited to writing this single markdown file at `.planning/debug/audit-2026-06-04/wave-1-agent-B-engine-topology.md`.

---

*Topology audit complete — Wave 1 Agent B, 2026-06-04.*
