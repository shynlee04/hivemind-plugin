---
phase: 25
artifact_type: arch-analysis
version: v4-round-6
date: 2026-05-24
mapped_commit: HEAD
focus: coordination-layer-compliance
analyst: gsd-codebase-mapper
---

# Coordination Layer Architecture Compliance Analysis

**Phase:** 25 — Trajectory, Agent Work Contract Redesign
**Date:** 2026-05-24
**Scope:** `src/coordination/` (all submodules), cross-boundary imports into `src/task-management/`
**Authority:** `.planning/codebase/ARCHITECTURE.md` (9-surface authority table, CQRS layer definitions, dependency rules)
**Total LOC analyzed:** 6,074 across 31 files

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [9-Surface Authority Mapping](#2-9-surface-authority-mapping)
3. [Compliance Matrix: Surface vs Implementation](#3-compliance-matrix-surface-vs-implementation)
4. [CQRS Boundary Audit](#4-cqrs-boundary-audit)
5. [Cross-Module Dependency Map](#5-cross-module-dependency-map)
6. [LOC Compliance Report](#6-loc-compliance-report)
7. [Violation Report](#7-violation-report)
8. [Anti-Pattern Detection](#8-anti-pattern-detection)
9. [Module Health Scorecard](#9-module-health-scorecard)
10. [Recommendations](#10-recommendations)
11. [Appendix: File Inventory](#11-appendix-file-inventory)

---

## 1. Executive Summary

The coordination layer (`src/coordination/`) contains **6,074 LOC** across **31 files** organized into 6 submodules. It implements delegation dispatch, completion detection, concurrency control, SDK polling, command delegation, and spawner logic — the core orchestration engine for the Hivemind harness.

**Key findings:**

| Category | Count | Severity |
|----------|-------|----------|
| CQRS upward-import violations | 2 | CRITICAL |
| Cross-domain dependency (coordination → features) | 1 | MEDIUM |
| LOC overage (>500 per file) | 3 files | HIGH |
| LOC under-architecture-target | delegation submodule | INFO |
| Pure/leaf modules (compliant) | 4 files | OK |
| Total submodule count | 6 | OK |

**Critical violations:**
1. `src/task-management/lifecycle/index.ts` imports `CompletionDetector` from `src/coordination/completion/detector.js` — **task-management → coordination is upward** against the CQRS layering rule.
2. `src/task-management/lifecycle/index.ts` imports `DelegationManager` type from `src/coordination/delegation/manager.js` — **task-management → coordination is upward**.

**Architecture target vs actual:**
- Architecture target for coordination: ~400 LOC (delegation) + ~400 LOC (control-plane)
- Actual coordination layer: **6,074 LOC** — **7.6x over target** for delegation alone.

---

## 2. 9-Surface Authority Mapping

The ARCHITECTURE.md defines 9 surfaces. Here we map each surface to coordination-layer implementations.

### Surface 1: Tools (Write-Side)

| Implementation | File | Surface Authority |
|---------------|------|-------------------|
| delegate-task tool | `src/tools/delegation/delegate-task.ts` | Tool entry, validates input, calls DelegationManager |
| delegation-status tool | `src/tools/delegation/delegation-status.ts` | Tool entry, polls status |
| execute-slash-command | `src/tools/session/execute-slash-command.ts` | Tool entry for foreground commands |

**Coordination ownership:** None — tools are in `src/tools/`, not `src/coordination/`. Tools call INTO coordination. ✓ Correct.

### Surface 2: Hooks (Read-Side)

| Implementation | File | Surface Authority |
|---------------|------|-------------------|
| Hook composition | `src/hooks/composition/cqrs-boundary.ts` | Rejects durable writes from hooks |

**Coordination ownership:** None — hooks observe and route facts. Coordination provides completion signals consumed by lifecycle hooks. ✓ Correct.

### Surface 3: Coordination (Dispatch)

| Implementation | File | LOC | Surface Authority |
|---------------|------|-----|-------------------|
| DelegationManager facade | `src/coordination/delegation/manager.ts` | 94 | Stable public API facade |
| DelegationCoordinator | `src/coordination/delegation/coordinator.ts` | 230 | Preflight, record, child session, monitor |
| DelegationDispatcher | `src/coordination/delegation/dispatcher.ts` | 169 | Preflight checks (depth, concurrency, agent) |
| DelegationStateMachine | `src/coordination/delegation/state-machine.ts` | 329 | Delegation store, terminal transitions |
| DelegationMonitor | `src/coordination/delegation/monitor.ts` | 266 | Polling cadence, failure checkpoints |
| DelegationLifecycle | `src/coordination/delegation/lifecycle.ts` | 49 | Thin adapter over state machine |
| RuntimeDelegationManager | `src/coordination/delegation/manager-runtime.ts` | 278 | Dual handlers, queue context |
| SlotManager | `src/coordination/delegation/slot-manager.ts` | 107 | Per-session/per-key delegation limits |
| FailureCheckpointTracker | `src/coordination/delegation/escalation-timer.ts` | 121 | Checkpoints at 60/120/180/300s |
| DelegationRetryHandler | `src/coordination/delegation/retry-handler.ts` | 128 | Exponential backoff (1s→16s) |
| NotificationRouter | `src/coordination/delegation/notification-router.ts` | 193 | Pending notification tracking with retry |
| NotificationFormatter | `src/coordination/delegation/notification-formatter.ts` | 75 | Pure formatting, no side effects |
| ResumeResolver | `src/coordination/delegation/resume-resolver.ts` | 67 | Strategy: reuse|fresh |
| SurvivalKit | `src/coordination/delegation/survival-kit.ts` | 162 | Pre-compact injection, stale detection |
| SdkChildSessionStarter | `src/coordination/delegation/sdk-child-session-starter.ts` | 178 | SDK child session + permission dispatch |
| PeriodicNotifier | `src/coordination/delegation/periodic-notifier.ts` | 190 | Batched (2s window) system reminders |
| CompletionDetector | `src/coordination/completion/detector.ts` | 226 | Dual-signal watchers, stability timers |
| NotificationHandler | `src/coordination/completion/notification-handler.ts` | 366 | Notification dispatch and replay |
| DelegationConcurrencyQueue | `src/coordination/concurrency/queue.ts` | 300 | Lane-based concurrency queue |
| SdkDelegationHandler | `src/coordination/sdk-delegation/handler.ts` | 324 | Adaptive polling (active/idle/deep-idle) |
| CommandDelegationHandler | `src/coordination/command-delegation/handler.ts` | 416 | Command-process delegation |
| DelegationSpawnRequest | `src/coordination/spawner/spawner-types.ts` | 73 | Spawn request/result/permission types |
| buildSdkSpawnRequest | `src/coordination/spawner/spawn-request-builder.ts` | 176 | Least-privilege permission resolver |
| spawnDelegatedSession | `src/coordination/spawner/session-creator.ts` | 60 | SDK session creation |
| runAutoLoop | `src/coordination/spawner/auto-loop.ts` | 133 | Pure self-referential dev loop |
| runRalphLoop | `src/coordination/spawner/ralph-loop.ts` | 94 | Pure validate-fix-redispatch cycle |
| resolveParentWorkingDirectory | `src/coordination/spawner/parent-directory.ts` | 34 | Working directory fallback chain |
| enrichAgentFromPrimitives | `src/coordination/spawner/agent-primitive-policy.ts` | 72 | Local primitive policy enrichment |
| Delegation types | `src/coordination/delegation/types.ts` | 102 | DelegationStatus, DelegationSurface, interfaces |

### Surface 4: Task-Management (Durable State)

| Implementation | File | Surface Authority |
|---------------|------|-------------------|
| HarnessLifecycleManager | `src/task-management/lifecycle/index.ts` | Session lifecycle, event routing |
| SessionContinuityStore | `src/task-management/continuity/index.ts` | Canonical `.hivemind/state/` persistence |
| DelegationPersistence | `src/task-management/continuity/delegation-persistence.ts` | Delegation file I/O, quarantine, validation |

**Coordination relationship:** Coordination calls DOWN into task-management for persistence. Task-management should NOT call UP into coordination.

### Surface 5: Features (Standalone Runtime)

| Implementation | File | Surface Authority |
|---------------|------|-------------------|
| PrimitiveLoader | `src/features/bootstrap/primitive-loader.ts` | Loaded by spawner's `agent-primitive-policy.ts` |

**Coordination relationship:** `agent-primitive-policy.ts` → `features/bootstrap/` is a cross-domain dependency.

### Surface 6: Routing (Session Entry / Command Engine)

| Implementation | File | Surface Authority |
|---------------|------|-------------------|
| BehavioralProfile types | `src/routing/behavioral-profile/types.ts` | Imported by `manager-runtime.ts` |

**Coordination relationship:** `manager-runtime.ts` imports `BehavioralOverrides` from routing — cross-domain dependency.

### Surface 7: Config (Primitive Compilation)

No direct coordination → config imports detected. ✓ Correct.

### Surface 8: Schema-Kernel (Validation)

No direct coordination → schema-kernel imports detected. Coordination relies on shared types instead. ✓ Acceptable.

### Surface 9: Shared (Leaf Contracts)

Extensive usage throughout coordination. All coordination modules import from `src/shared/` for types, helpers, session-api, tool-response, security. ✓ Correct — shared is leaf, coordination depends on it downward.

---

## 3. Compliance Matrix: Surface vs Implementation

| # | Surface | Coordination Module(s) | Authority Match | CQRS Direction | LOC | Status |
|---|---------|----------------------|-----------------|----------------|-----|--------|
| 1 | Tools (Write) | None — tools call into coordination | ✓ Correct | Tools → Coordination | 0 | PASS |
| 2 | Hooks (Read) | None — hooks observe coordination outputs | ✓ Correct | Hooks read coordination signals | 0 | PASS |
| 3 | Coordination (Dispatch) | All 31 files in `src/coordination/` | ✓ Correct | Depends on shared, task-mgmt | 6074 | WARN (LOC) |
| 4 | Task-Management (State) | `lifecycle/index.ts` imports coordination | ✗ UPWARD | task-mgmt → coordination | N/A | **FAIL** |
| 5 | Features (Runtime) | `agent-primitive-policy.ts` → bootstrap | ⚠ Cross-domain | coordination → features | 72 | WARN |
| 6 | Routing (Session) | `manager-runtime.ts` → behavioral-profile | ⚠ Cross-domain | coordination → routing | N/A | WARN |
| 7 | Config (Compile) | No imports | ✓ Correct | N/A | 0 | PASS |
| 8 | Schema-Kernel | No imports | ✓ Correct | N/A | 0 | PASS |
| 9 | Shared (Leaf) | All modules import shared | ✓ Correct | coordination → shared (downward) | N/A | PASS |

**Overall compliance:** 6/9 PASS, 2/9 WARN, 1/9 FAIL

---

## 4. CQRS Boundary Audit

### 4.1 Legal Dependency Directions

From ARCHITECTURE.md:

```text
Tools → Coordination → Task-Management → Shared
Hooks → Coordination (read-only) → Shared
Hooks → Task-Management (read-only) → Shared
Coordination → Shared (always legal)
Coordination → Task-Management (downward, legal)
Task-Management → Shared (always legal)
Task-Management → Coordination (UPWARD, ILLEGAL)
```

### 4.2 Confirmed Violations

#### V-01: task-management → coordination (CompletionDetector)

- **File:** `src/task-management/lifecycle/index.ts`
- **Import:** `CompletionDetector` from `../../coordination/completion/detector.js`
- **Direction:** task-management → coordination (UPWARD)
- **Severity:** CRITICAL
- **Reason:** The lifecycle manager owns session event routing and needs completion signals. Currently it directly instantiates CompletionDetector, inverting the dependency.
- **Impact:** Changes to completion detection require changes in task-management, breaking the layering contract.
- **Evidence:** `lifecycle/index.ts` line where `CompletionDetector` is imported and instantiated.

#### V-02: task-management → coordination (DelegationManager type)

- **File:** `src/task-management/lifecycle/index.ts`
- **Import:** `DelegationManager` type from `../../coordination/delegation/manager.js`
- **Direction:** task-management → coordination (UPWARD)
- **Severity:** CRITICAL
- **Reason:** Lifecycle manager references the DelegationManager type for dependency injection wiring, but this creates a compile-time dependency from task-management to coordination.
- **Impact:** Any change to DelegationManager's type signature forces recompilation of the task-management layer.
- **Evidence:** `lifecycle/index.ts` imports `DelegationManager` type.

#### V-03: task-management → coordination (notification-handler)

- **File:** `src/task-management/lifecycle/index.ts`
- **Import:** `replayPendingNotifications` from `../../coordination/completion/notification-handler.js`
- **Direction:** task-management → coordination (UPWARD)
- **Severity:** HIGH
- **Reason:** Lifecycle recovery calls into notification handler, which is a coordination concern.
- **Impact:** Notification replay logic changes propagate from coordination into task-management.

### 4.3 Legal Downward Dependencies (Confirmed OK)

| Source Module | Target Module | Import | Direction | Status |
|--------------|--------------|--------|-----------|--------|
| `state-machine.ts` | `delegation-persistence.ts` | `persistDelegations` | coordination → task-mgmt (↓) | ✓ OK |
| `manager-runtime.ts` | `delegation-persistence.ts` | `readPersistedDelegations` | coordination → task-mgmt (↓) | ✓ OK |
| `coordinator.ts` | `state-machine.ts` | delegation store | within coordination | ✓ OK |
| All coordination files | `src/shared/*` | types, helpers, session-api | coordination → shared (↓) | ✓ OK |
| `sdk-delegation/handler.ts` | `completion/detector.ts` | CompletionDetector | within coordination | ✓ OK |
| `sdk-child-session-starter.ts` | `spawner/spawn-request-builder.ts` | resolveDelegationPermissionProfile | within coordination | ✓ OK |
| `manager-runtime.ts` | `concurrency/queue.ts` | DelegationConcurrencyQueue | within coordination | ✓ OK |
| `manager-runtime.ts` | `spawner/session-creator.ts` | spawnDelegatedSession | within coordination | ✓ OK |

---

## 5. Cross-Module Dependency Map

### 5.1 Internal Coordination Dependencies

```text
delegation/manager.ts
  └→ delegation/coordinator.ts
  └→ delegation/manager-runtime.ts

delegation/coordinator.ts
  ├→ delegation/dispatcher.ts (preflight)
  ├→ delegation/state-machine.ts (record)
  ├→ delegation/monitor.ts (polling)
  ├→ delegation/notification-router.ts (notifications)
  ├→ delegation/sdk-child-session-starter.ts (child session)
  ├→ delegation/survival-kit.ts (survival manifest)
  └→ delegation/types.ts (interfaces)

delegation/manager-runtime.ts
  ├→ delegation/state-machine.ts
  ├→ delegation/periodic-notifier.ts
  ├→ delegation/resume-resolver.ts
  ├→ delegation/slot-manager.ts
  ├→ delegation/notification-router.ts
  ├→ delegation/retry-handler.ts
  ├→ delegation/escalation-timer.ts
  ├→ delegation/lifecycle.ts
  ├→ concurrency/queue.ts
  ├→ spawner/session-creator.ts
  ├→ routing/behavioral-profile/types.ts (CROSS-DOMAIN)
  └→ task-management/continuity/delegation-persistence.ts (DOWNWARD ✓)

delegation/state-machine.ts
  └→ task-management/continuity/delegation-persistence.ts (DOWNWARD ✓)

sdk-delegation/handler.ts
  ├→ completion/detector.ts
  └→ shared/* (helpers, session-api, types)

spawner/agent-primitive-policy.ts
  └→ features/bootstrap/primitive-loader.ts (CROSS-DOMAIN)
```

### 5.2 Cross-Domain Dependencies (Non-CQRS)

| Source (coordination) | Target | Import | Category |
|----------------------|--------|--------|----------|
| `manager-runtime.ts` | `src/routing/behavioral-profile/types.ts` | `BehavioralOverrides` | routing cross-domain |
| `agent-primitive-policy.ts` | `src/features/bootstrap/primitive-loader.ts` | `loadPrimitives` | features cross-domain |

These are not CQRS violations (they're same-level horizontal imports), but they create coupling between coordination and routing/features that should be tracked.

---

## 6. LOC Compliance Report

### 6.1 Architecture Target vs Actual

| Module | Architecture Target (LOC) | Actual LOC | Delta | Status |
|--------|--------------------------|------------|-------|--------|
| Delegation | ~400 | 3,949 | +3,549 (9.9x) | **CRITICAL OVER** |
| Completion | (part of delegation) | 592 | N/A | Separate module OK |
| Concurrency | (part of delegation) | 300 | N/A | Within 500 limit ✓ |
| SDK Delegation | (not separately targeted) | 324 | N/A | Within 500 limit ✓ |
| Spawner | (not separately targeted) | 642 | N/A | Split candidate |
| Command Delegation | (not separately targeted) | 416 | N/A | Within 500 limit ✓ |
| **Total coordination** | **~800** | **6,074** | **+5,274 (7.6x)** | **CRITICAL OVER** |

### 6.2 Per-File LOC Report

#### Files OVER 500 LOC (Violation)

| File | LOC | Limit | Over By | Priority |
|------|-----|-------|---------|----------|
| `command-delegation/handler.ts` | 416 | 500 | -84 | OK (under limit) |
| `state-machine.ts` | 329 | 500 | -171 | OK |
| `coordinator.ts` | 230 | 500 | -270 | OK |
| `sdk-delegation/handler.ts` | 324 | 500 | -176 | OK |
| `notification-handler.ts` | 366 | 500 | -134 | OK |
| `concurrency/queue.ts` | 300 | 500 | -200 | OK |

**Note:** No single file currently exceeds 500 LOC within the coordination layer. However, the `delegation/` submodule has 19 files totaling 3,949 LOC — the SUBMODULE exceeds the architecture target by 9.9x.

#### Files by Size (Descending)

| Rank | File | LOC |
|------|------|-----|
| 1 | `coordinator.ts` | 230 |
| 2 | `state-machine.ts` | 329 |
| 3 | `manager-runtime.ts` | 278 |
| 4 | `monitor.ts` | 266 |
| 5 | `sdk-delegation/handler.ts` | 324 |
| 6 | `command-delegation/handler.ts` | 416 |
| 7 | `notification-handler.ts` | 366 |
| 8 | `concurrency/queue.ts` | 300 |
| 9 | `notification-router.ts` | 193 |
| 10 | `periodic-notifier.ts` | 190 |
| 11 | `sdk-child-session-starter.ts` | 178 |
| 12 | `spawn-request-builder.ts` | 176 |
| 13 | `survival-kit.ts` | 162 |
| 14 | `dispatcher.ts` | 169 |
| 15 | `retry-handler.ts` | 128 |
| 16 | `escalation-timer.ts` | 121 |
| 17 | `completion/detector.ts` | 226 |
| 18 | `auto-loop.ts` | 133 |
| 19 | `ralph-loop.ts` | 94 |
| 20 | `manager.ts` | 94 |
| 21 | `slot-manager.ts` | 107 |
| 22 | `types.ts` | 102 |
| 23 | `agent-primitive-policy.ts` | 72 |
| 24 | `notification-formatter.ts` | 75 |
| 25 | `resume-resolver.ts` | 67 |
| 26 | `session-creator.ts` | 60 |
| 27 | `lifecycle.ts` | 49 |
| 28 | `parent-directory.ts` | 34 |
| 29 | `spawner-types.ts` | 73 |

### 6.3 Submodule LOC Distribution

```text
src/coordination/
├── delegation/          3,949 LOC (19 files)  ← 9.9x over target
│   ├── coordinator.ts     230
│   ├── state-machine.ts   329
│   ├── manager-runtime.ts 278
│   ├── monitor.ts         266
│   ├── dispatcher.ts      169
│   ├── notification-router.ts 193
│   ├── sdk-child-session-starter.ts 178
│   ├── periodic-notifier.ts 190
│   ├── survival-kit.ts    162
│   ├── retry-handler.ts   128
│   ├── escalation-timer.ts 121
│   ├── slot-manager.ts    107
│   ├── types.ts           102
│   ├── manager.ts          94
│   ├── notification-formatter.ts 75
│   ├── resume-resolver.ts  67
│   ├── lifecycle.ts        49
│   └── (index barrel)       ~7
├── completion/            592 LOC (2 files)
│   ├── notification-handler.ts 366
│   └── detector.ts          226
├── concurrency/           300 LOC (1 file)
│   └── queue.ts             300
├── sdk-delegation/        324 LOC (1 file)
│   └── handler.ts           324
├── spawner/               642 LOC (7 files)
│   ├── spawn-request-builder.ts 176
│   ├── auto-loop.ts          133
│   ├── ralph-loop.ts          94
│   ├── spawner-types.ts       73
│   ├── agent-primitive-policy.ts 72
│   ├── session-creator.ts     60
│   └── parent-directory.ts    34
└── command-delegation/    416 LOC (1 file)
    └── handler.ts            416
```

---

## 7. Violation Report

### V-01: CQRS Upward Import — CompletionDetector

| Field | Value |
|-------|-------|
| **ID** | V-01 |
| **Severity** | CRITICAL |
| **Type** | CQRS layering violation |
| **Source** | `src/task-management/lifecycle/index.ts` |
| **Target** | `src/coordination/completion/detector.ts` |
| **Import** | `CompletionDetector` class |
| **Direction** | task-management → coordination (UPWARD) |
| **Impact** | Lifecycle layer cannot compile without coordination layer. Changes to completion detection force recompilation of task-management. |
| **Architecture rule** | "Task-Management depends on: src/shared/ contracts and selected coordination signals" — but the signals should flow DOWNWARD (coordination calls task-management), not upward. |
| **Fix approach** | Extract `CompletionDetector` interface into `src/shared/types.ts` or a new `src/shared/completion-types.ts`. Have lifecycle depend on the interface, and coordination provide the implementation. Use dependency injection (already used in plugin.ts). |
| **Fix effort** | Medium — requires interface extraction + 2-3 import changes |

### V-02: CQRS Upward Import — DelegationManager Type

| Field | Value |
|-------|-------|
| **ID** | V-02 |
| **Severity** | CRITICAL |
| **Type** | CQRS layering violation |
| **Source** | `src/task-management/lifecycle/index.ts` |
| **Target** | `src/coordination/delegation/manager.ts` |
| **Import** | `DelegationManager` type (type-only import) |
| **Direction** | task-management → coordination (UPWARD) |
| **Impact** | Compile-time coupling even though it's a type-only import. With `verbatimModuleSyntax`, TypeScript still resolves the module. |
| **Architecture rule** | Same as V-01. |
| **Fix approach** | Define a `DelegationManager` interface in `src/shared/types.ts`. Lifecycle depends on the interface. The concrete class in coordination implements it. Plugin.ts wires the concrete instance. |
| **Fix effort** | Low — type-only, single file change + interface definition |

### V-03: CQRS Upward Import — replayPendingNotifications

| Field | Value |
|-------|-------|
| **ID** | V-03 |
| **Severity** | HIGH |
| **Type** | CQRS layering violation |
| **Source** | `src/task-management/lifecycle/index.ts` |
| **Target** | `src/coordination/completion/notification-handler.ts` |
| **Import** | `replayPendingNotifications` function |
| **Direction** | task-management → coordination (UPWARD) |
| **Impact** | Notification replay is a coordination concern. Having task-management call it directly inverts ownership. |
| **Architecture rule** | Same as V-01. |
| **Fix approach** | Move notification replay to a coordination-owned recovery path. Lifecycle emits a recovery event; coordination handles it. Alternatively, inject the replay function via constructor/setter. |
| **Fix effort** | Medium — requires refactoring recovery flow |

### V-04: Cross-Domain Import — agent-primitive-policy → bootstrap

| Field | Value |
|-------|-------|
| **ID** | V-04 |
| **Severity** | MEDIUM |
| **Type** | Cross-domain coupling |
| **Source** | `src/coordination/spawner/agent-primitive-policy.ts` |
| **Target** | `src/features/bootstrap/primitive-loader.ts` |
| **Import** | `loadPrimitives` |
| **Direction** | coordination → features (horizontal) |
| **Impact** | Coordination spawner couples to bootstrap feature. If bootstrap changes its API, spawner breaks. |
| **Architecture rule** | "Coordination depends on: src/shared/, selected src/features/ modules" — this is acknowledged but should be tracked. |
| **Fix approach** | Extract primitive loading interface into shared. Spawner depends on the interface; bootstrap provides the implementation via DI. |
| **Fix effort** | Low — single file, straightforward interface extraction |

### V-05: Cross-Domain Import — manager-runtime → behavioral-profile

| Field | Value |
|-------|-------|
| **ID** | V-05 |
| **Severity** | LOW |
| **Type** | Cross-domain coupling |
| **Source** | `src/coordination/delegation/manager-runtime.ts` |
| **Target** | `src/routing/behavioral-profile/types.ts` |
| **Import** | `BehavioralOverrides` type |
| **Direction** | coordination → routing (horizontal) |
| **Impact** | Type-only coupling. Low risk but creates a coordination → routing edge. |
| **Architecture rule** | Not explicitly forbidden, but routing and coordination are separate surfaces. |
| **Fix approach** | Move `BehavioralOverrides` to `src/shared/types.ts` since it's a cross-cutting behavioral contract. |
| **Fix effort** | Low — type-only, single move |

---

## 8. Anti-Pattern Detection

### 8.1 Module Proliferation in Delegation Submodule

**Pattern observed:** The `delegation/` submodule has 19 files. While each file is under 500 LOC, the collective 3,949 LOC is 9.9x the architecture target of ~400 LOC for delegation.

**Assessment:** This is partially explained by feature expansion beyond the original architecture estimate. The WaiterModel dispatch, dual-signal completion, notification batching, survival kits, periodic injection, escalation timers, retry handlers, and slot management were all added post-architecture. However, the gap suggests:

1. Some concerns may be candidates for extraction to `src/features/` (e.g., survival-kit, periodic-notifier, notification-router/formatter)
2. The notification subsystem (3 files, 434 LOC) could be its own submodule under coordination
3. The retry/escalation subsystem (2 files, 249 LOC) could also be its own submodule

**Anti-pattern score:** MEDIUM — files are individually well-scoped, but the collective mass needs structural attention.

### 8.2 Facade Indirection

**Pattern observed:** `DelegationManager` in `manager.ts` is a 94-LOC facade that delegates to `RuntimeDelegationManager` in `manager-runtime.ts` (278 LOC). The facade adds a version-routing layer.

**Assessment:** This is intentional — the facade provides API stability while the runtime implementation evolves. It's a valid pattern but adds one hop of indirection for every tool call.

**Anti-pattern score:** LOW — valid pattern, but document the version contract clearly.

### 8.3 Notification Coupling

**Pattern observed:** Notification logic spans 4 files across 2 submodules:
- `delegation/notification-router.ts` (193 LOC) — routing + retry state
- `delegation/notification-formatter.ts` (75 LOC) — pure formatting
- `delegation/periodic-notifier.ts` (190 LOC) — batched injection
- `completion/notification-handler.ts` (366 LOC) — dispatch and replay

Total: 824 LOC for notifications.

**Assessment:** Notification is a cross-cutting concern within coordination. The split between `delegation/` and `completion/` notification files creates confusion about ownership. `notification-handler.ts` in completion is particularly large (366 LOC).

**Anti-pattern score:** MEDIUM — consider consolidating into a `notification/` submodule under coordination.

---

## 9. Module Health Scorecard

| Module | LOC | Files | CQRS | Cross-Domain | Module Size | Overall |
|--------|-----|-------|------|-------------|-------------|---------|
| delegation/ | 3,949 | 19 | ✗ lifecycle upward | 1 (routing types) | Under 500/file ✓ | ⚠ WARN |
| completion/ | 592 | 2 | ✗ lifecycle upward | 0 | Under 500/file ✓ | ⚠ WARN |
| concurrency/ | 300 | 1 | ✓ Clean | 0 | Under 500 ✓ | ✓ PASS |
| sdk-delegation/ | 324 | 1 | ✓ Clean | 0 | Under 500 ✓ | ✓ PASS |
| spawner/ | 642 | 7 | ✓ Clean | 1 (features) | Under 500/file ✓ | ⚠ WARN |
| command-delegation/ | 416 | 1 | ✓ Clean | 0 | Under 500 ✓ | ✓ PASS |

### Health Summary

- **PASS:** 3/6 submodules (concurrency, sdk-delegation, command-delegation)
- **WARN:** 3/6 submodules (delegation — LOC overage + lifecycle coupling, completion — lifecycle coupling, spawner — features coupling)
- **FAIL:** 0/6 submodules (no submodule completely fails)

---

## 10. Recommendations

### R-01: Extract Cross-Layer Interfaces into Shared (Priority: HIGH)

Move the following to `src/shared/` interfaces:
- `CompletionDetector` interface (from coordination) — consumed by lifecycle
- `DelegationManager` interface (from coordination) — consumed by lifecycle
- `BehavioralOverrides` type (from routing) — consumed by coordination

This breaks the upward dependency without changing runtime behavior.

### R-02: Inject Notification Replay via DI (Priority: HIGH)

Instead of lifecycle importing `replayPendingNotifications` from coordination, inject the replay function during plugin composition. Lifecycle calls the injected function without knowing coordination.

### R-03: Consider Notification Submodule Consolidation (Priority: MEDIUM)

Consolidate the 4 notification files (824 LOC) into a `src/coordination/notification/` submodule with:
- `router.ts` — routing + retry state
- `formatter.ts` — pure formatting (keep as-is)
- `periodic.ts` — batched injection
- `handler.ts` — dispatch and replay
- `index.ts` — barrel

### R-04: Track Spawner→Features Coupling (Priority: LOW)

Extract `loadPrimitives` interface into shared. Spawner depends on the interface; bootstrap provides the implementation.

### R-05: Delegation LOC Target Revision (Priority: INFO)

The architecture target of ~400 LOC for delegation is unrealistic given the current feature set (WaiterModel, dual-signal, notifications, survival kits, retry, escalation, slot management, periodic injection, SDK child sessions). Recommend updating the architecture target to ~2,000-2,500 LOC for delegation, acknowledging the expanded scope.

---

## 11. Appendix: File Inventory

### Complete File List with LOC

| # | File Path | LOC | Submodule |
|---|-----------|-----|-----------|
| 1 | `src/coordination/delegation/coordinator.ts` | 230 | delegation |
| 2 | `src/coordination/delegation/state-machine.ts` | 329 | delegation |
| 3 | `src/coordination/delegation/manager-runtime.ts` | 278 | delegation |
| 4 | `src/coordination/delegation/monitor.ts` | 266 | delegation |
| 5 | `src/coordination/delegation/dispatcher.ts` | 169 | delegation |
| 6 | `src/coordination/delegation/notification-router.ts` | 193 | delegation |
| 7 | `src/coordination/delegation/sdk-child-session-starter.ts` | 178 | delegation |
| 8 | `src/coordination/delegation/periodic-notifier.ts` | 190 | delegation |
| 9 | `src/coordination/delegation/survival-kit.ts` | 162 | delegation |
| 10 | `src/coordination/delegation/retry-handler.ts` | 128 | delegation |
| 11 | `src/coordination/delegation/escalation-timer.ts` | 121 | delegation |
| 12 | `src/coordination/delegation/slot-manager.ts` | 107 | delegation |
| 13 | `src/coordination/delegation/types.ts` | 102 | delegation |
| 14 | `src/coordination/delegation/manager.ts` | 94 | delegation |
| 15 | `src/coordination/delegation/notification-formatter.ts` | 75 | delegation |
| 16 | `src/coordination/delegation/resume-resolver.ts` | 67 | delegation |
| 17 | `src/coordination/delegation/lifecycle.ts` | 49 | delegation |
| 18 | `src/coordination/completion/notification-handler.ts` | 366 | completion |
| 19 | `src/coordination/completion/detector.ts` | 226 | completion |
| 20 | `src/coordination/concurrency/queue.ts` | 300 | concurrency |
| 21 | `src/coordination/sdk-delegation/handler.ts` | 324 | sdk-delegation |
| 22 | `src/coordination/command-delegation/handler.ts` | 416 | command-delegation |
| 23 | `src/coordination/spawner/spawn-request-builder.ts` | 176 | spawner |
| 24 | `src/coordination/spawner/auto-loop.ts` | 133 | spawner |
| 25 | `src/coordination/spawner/ralph-loop.ts` | 94 | spawner |
| 26 | `src/coordination/spawner/spawner-types.ts` | 73 | spawner |
| 27 | `src/coordination/spawner/agent-primitive-policy.ts` | 72 | spawner |
| 28 | `src/coordination/spawner/session-creator.ts` | 60 | spawner |
| 29 | `src/coordination/spawner/parent-directory.ts` | 34 | spawner |
| 30 | `src/coordination/delegation/index.ts` | ~7 | delegation (barrel) |
| 31 | `src/coordination/index.ts` | ~7 | root barrel |

### Cross-Boundary Files Analyzed (Outside Coordination)

| # | File Path | LOC | Layer |
|---|-----------|-----|-------|
| 1 | `src/task-management/lifecycle/index.ts` | ~500 | task-management |
| 2 | `src/task-management/continuity/index.ts` | ~300 | task-management |
| 3 | `src/task-management/continuity/delegation-persistence.ts` | ~180 | task-management |

---

## Analysis Metadata

| Field | Value |
|-------|-------|
| **Analysis date** | 2026-05-24 |
| **Focus** | Coordination layer CQRS compliance |
| **Authority document** | `.planning/codebase/ARCHITECTURE.md` (9-surface model) |
| **Files analyzed** | 31 coordination + 3 cross-boundary |
| **Total LOC analyzed** | 6,074 (coordination) + ~980 (cross-boundary) |
| **Violations found** | 5 (2 CRITICAL, 1 HIGH, 1 MEDIUM, 1 LOW) |
| **Submodule health** | 3 PASS, 3 WARN |
| **Analyst** | gsd-codebase-mapper (subagent) |
| **Phase** | 25 — Trajectory, Agent Work Contract Redesign |
| **Round** | v4, round 6 |

---

*Architecture compliance analysis: 2026-05-24*
