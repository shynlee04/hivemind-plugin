# Codebase Concerns Analysis

**Analysis Date:** 2026-04-11
**Scope:** Post-Phases 08, 09, 09.1, 09.2 — architectural concerns scan
**Total LOC:** 9,405 across 53 source files (`src/**/*.ts`)

---

## 1. Coupling Matrix

### Import Dependency Graph (by module)

| Module | Imports From | Imported By | Fan-In | Fan-Out | Coupling |
|--------|-------------|-------------|--------|---------|----------|
| `types.ts` | `task-status.ts`, `pending-notifications.ts` | 24 modules | **24** | 2 | **HIGH (hub)** |
| `helpers.ts` | `types.ts` | 10 modules | 10 | 1 | Medium |
| `continuity.ts` | 5 modules (`delegation-export`, `session-recovery`, `continuity-clone`, `continuity-normalizers`, `node:fs/path`) | 13 modules | **13** | 5 | **HIGH (god)** |
| `lifecycle-manager.ts` | **14 modules** (concurrency, background-manager, completion-detector, compaction-checkpoint, delegation-packet, execution-mode, continuity, lifecycle-process-runner, lifecycle-tmux-runner, state, runtime, session-api, lifecycle-queue, lifecycle-state, lifecycle-runtime-policy) | 6 modules | 6 | **14** | **VERY HIGH (god object)** |
| `state.ts` | `types.ts` | 9 modules | **9** | 1 | Medium-High |
| `session-api.ts` | `helpers.ts`, `@opencode-ai/sdk` | 8 modules | 8 | 2 | Medium |
| `governance-engine.ts` | `continuity.ts` | 3 modules | 3 | 1 | Low |
| `injection-engine.ts` | `session-recovery.ts`, `types.ts` | 2 modules | 2 | 2 | Low |
| `notification-handler.ts` | `session-api.ts`, `types.ts` | 5 modules | 5 | 2 | Medium |
| `pending-notifications.ts` | `continuity.ts`, `notification-handler.ts` | 4 modules | 4 | 2 | Medium |
| `background-manager.ts` | `execution-mode.ts`, `node:child_process` | 4 modules | 4 | 2 | Medium |
| `execution-mode.ts` | (leaf) | 3 modules | 3 | 0 | **LOW (leaf)** |
| `specialist-router.ts` | `categories.ts`, `types.ts` | 2 modules | 2 | 2 | Low |
| `categories.ts` | `types.ts` | 2 modules | 2 | 1 | Low |
| `concurrency.ts` | `state.ts`, `types.ts` | 3 modules | 3 | 2 | Low |
| `lifecycle-state.ts` | `helpers.ts`, `types.ts` | 4 modules | 4 | 2 | Low |
| `lifecycle-queue.ts` | `concurrency.ts`, `lifecycle-state.ts` | 2 modules | 2 | 2 | Low |
| `lifecycle-runtime-policy.ts` | `runtime-policy.ts`, `types.ts` | 1 module | 1 | 2 | Low |
| `lifecycle-process-runner.ts` | **9 modules** (background-manager, completion-detector, execution-mode, lifecycle-background-observer, lifecycle-state, notification-handler, pending-notifications, session-api, types) | 2 modules | 2 | **9** | **HIGH** |
| `lifecycle-tmux-runner.ts` | 6 modules (background-manager, execution-mode, notification-handler, pending-notifications, session-api, types) | 2 modules | 2 | 6 | Medium-High |
| `lifecycle-background-observer.ts` | **7 modules** (completion-detector, session-api, notification-handler, pending-notifications, types, lifecycle-queue, helpers) | 2 modules | 2 | **7** | **HIGH** |
| `continuity-normalizers.ts` | `types.ts` (24 type imports + VALID_DELEGATION_CATEGORIES) | 1 module (`continuity.ts`) | 1 | 1 | Low (but 706 LOC) |
| `continuity-clone.ts` | `types.ts` (13 type imports) | 1 module (`continuity.ts`) | 1 | 1 | Low (but 170 LOC) |
| `compaction-checkpoint.ts` | `state.ts`, `types.ts` | 2 modules | 2 | 2 | Low |
| `runtime.ts` | `helpers.ts`, `types.ts` | 2 modules | 2 | 2 | Low |
| `runtime-policy.ts` | `types.ts` | 3 modules | 3 | 1 | Low |
| `session-recovery.ts` | `types.ts` | 3 modules | 3 | 1 | Low |
| `delegation-packet.ts` | `types.ts` | 4 modules | 4 | 1 | Low |
| `delegation-export.ts` | `delegation-packet.ts`, `types.ts` | 1 module | 1 | 2 | Low |
| `delegate-task.ts` | **9 modules** (continuity, concurrency, execution-mode, specialist-router, helpers, lifecycle-manager, session-api, state, types) | 0 (tool) | 0 | **9** | **HIGH (tool)** |
| `create-core-hooks.ts` | 6 modules (helpers, injection-engine, continuity, governance-engine, pending-notifications, session-api, messages-transform, types) | 1 module | 1 | **7** | Medium-High |
| `create-tool-guard-hooks.ts` | 6 modules (continuity, governance-engine, helpers, runtime-policy, types, lifecycle-manager, state) | 1 module | 1 | 6 | Medium-High |
| `create-session-hooks.ts` | 6 modules (compaction-checkpoint, continuity, helpers, injection-engine, governance-engine, session-api, types) | 1 module | 1 | 6 | Medium-High |
| `plugin.ts` | **11 modules** (background-manager, lifecycle-manager, state, core-hooks, session-hooks, tool-guard-hooks, 4 tools, runtime-policy) | 1 module (index.ts) | 1 | **11** | **HIGH (assembly root — expected)** |

### Tight Coupling Hotspots

**T-01: `lifecycle-manager.ts` → 14 direct imports (734 LOC)**
- This is the primary coupling concern. The manager imports from: concurrency, background-manager, completion-detector, compaction-checkpoint, delegation-packet, execution-mode, continuity (6 exports), lifecycle-process-runner, lifecycle-tmux-runner, state, runtime, session-api, lifecycle-queue, lifecycle-state, lifecycle-runtime-policy.
- **Impact:** Any change to any of these 14 modules potentially requires re-testing lifecycle-manager. Module is untestable in isolation.
- **Files:** `src/lib/lifecycle-manager.ts`
- **Phase 11 relevance:** Must be split into tasking-coordinator, tasking-dispatcher, tasking-observer per D-02.

**T-02: `types.ts` as central hub — 24 modules import from it**
- Every module in `src/lib/` imports from `types.ts`. It imports from `task-status.ts` and `pending-notifications.ts`, creating a soft dependency cycle risk.
- **Impact:** Any type change ripples across 24 modules. The file is 324 LOC and growing.
- **Files:** `src/lib/types.ts`
- **Phase 11 relevance:** Should be split into domain-specific type files (lifecycle-types.ts, delegation-types.ts, governance-types.ts).

**T-03: `continuity.ts` → coupled to delegation-export, session-recovery, continuity-clone, continuity-normalizers (310 LOC but drives 13 downstream consumers)**
- The continuity module is the persistence layer. It reads/writes the JSON store and calls `exportDelegationArtifacts` on every `persistStore()`, creating a write-time side-effect coupling to `delegation-export.ts`.
- **Impact:** Every continuity write triggers a filesystem export scan. Performance concern for high-frequency operations.
- **Files:** `src/lib/continuity.ts` → `src/lib/delegation-export.ts`

**T-04: `lifecycle-process-runner.ts` → 9 imports (456 LOC)**
- Imports from background-manager, completion-detector, execution-mode, lifecycle-background-observer, lifecycle-state, notification-handler, pending-notifications, session-api, types.
- **Impact:** Process runner knows about notifications, pending notifications, completion detection, background observation, execution modes, session API, lifecycle state, and types. Too many responsibilities.

**T-05: `lifecycle-background-observer.ts` → 7 imports (336 LOC)**
- Imports completion-detector, session-api (3 exports), notification-handler, pending-notifications, types, lifecycle-queue, helpers.
- **Impact:** Polling observer is coupled to notification system, completion detection, queue management, and session API. If any of these change, observer may break.

---

## 2. Cohesion Assessment

### High Cohesion (good)

| Module | Purpose | Assessment |
|--------|---------|------------|
| `helpers.ts` (119 LOC) | Pure utility functions | **Good** — `isObject`, `getNestedValue`, `asString`, `stableStringify`, `makeToolSignature`, `buildPromptText`. All are stateless, pure utilities. |
| `execution-mode.ts` (195 LOC) | Execution mode classifier | **Good** — single responsibility: classify task characteristics → execution family + submode. Pure function. |
| `specialist-router.ts` (179 LOC) | Route delegation to specialist agents | **Good** — keyword scoring, preset resolution, category→agent mapping. |
| `categories.ts` (18 LOC) | Category configuration lookup | **Good** — tiny config module. |
| `concurrency.ts` (298 LOC) | Keyed semaphore + spawn reservation | **Good** — queue lanes, priority enqueue/dequeue, spawn reservation. All delegation concurrency concerns. |
| `continuity-clone.ts` (170 LOC) | Deep-clone for continuity records | **Good** — single responsibility. 13 specialized clone functions. |
| `continuity-normalizers.ts` (706 LOC) | Normalize raw JSON→typed records | **Moderate** — cohesive purpose but 706 LOC of repetitive normalization. Should be split by domain (delegation, lifecycle, notification, execution). |
| `delegation-packet.ts` (254 LOC) | Delegation packet factory/mutators | **Good** — CRUD operations on DelegationPacket. |
| `delegation-export.ts` (88 LOC) | Export delegation artifacts to disk | **Good** — manifest building, JSON serialization. |
| `notification-handler.ts` (163 LOC) | Build and deliver task notifications | **Good** — notification formatting, parent session prompting. |
| `pending-notifications.ts` (52 LOC) | Persist/replay offline notifications | **Good** — tiny persistence bridge. |
| `runtime-policy.ts` (213 LOC) | Runtime policy resolution | **Good** — workspace policy loading, per-session override resolution. |
| `session-recovery.ts` (173 LOC) | Recovery risk assessment | **Good** — staleness detection, risk scoring, resume state building. |
| `lifecycle-state.ts` (96 LOC) | Lifecycle state builders + mappers | **Good** — transition validation, phase↔status mapping. |
| `lifecycle-queue.ts` (139 LOC) | Lifecycle queue management | **Good** — enqueue, acquire, priority handling. |
| `lifecycle-runtime-policy.ts` (20 LOC) | Concurrency resolution from policy | **Good** — tiny bridge module. |
| `compaction-checkpoint.ts` (151 LOC) | Capture/restore compaction checkpoints | **Good** — checkpoint capture, state restore, context formatting. |
| `completion-detector.ts` (66 LOC) | Two-signal completion detection | **Good** — event feeding, stability detection. |
| `runtime.ts` (73 LOC) | Event→status mapping | **Good** — `inferContinuityStatusFromEvent`. Single function. |
| `state.ts` (251 LOC) | In-memory TaskStateManager | **Moderate** — stats, budget tracking, session-to-root mapping, delegation metadata, subagent registry. Related but could be split. |

### Moderate Cohesion (acceptable but could improve)

| Module | Issue |
|--------|-------|
| `state.ts` (251 LOC) | Mixes session stats, root budgets, session-to-root mapping, delegation metadata, subagent registry, AND exposes a module-level singleton `taskState`. Four related but separable concerns. |
| `governance-engine.ts` (275 LOC) | Rule CRUD + evaluation + violation tracking + injection governance — all governance but rule persistence is coupled to `continuity.ts`. |

### Poor Cohesion (needs splitting)

| Module | Problems |
|--------|----------|
| `lifecycle-manager.ts` (734 LOC) | **God object.** Contains: (1) session creation and continuity recording, (2) event handling and status inference, (3) lifecycle state management, (4) queue acquisition and management, (5) tmux task dispatch, (6) process task dispatch, (7) subsession task dispatch, (8) cancellation, (9) compaction checkpoint recording, (10) auto-loop retry requests, (11) continuity hydration, (12) recovery state queries, (13) activity observation, (14) delegation packet status sync. At least 4 modules' worth of responsibility. |
| `lifecycle-process-runner.ts` (456 LOC) | Combines: (1) builtin-process execution, (2) subsession execution, (3) notification delivery, (4) lifecycle state patching, (5) queue release. The subsession execution code (runLifecycleSubsessionTask) at 200+ LOC is arguably a separate module from the process runner. |
| `continuity-normalizers.ts` (706 LOC) | 30+ normalization functions, each 10-40 LOC. Should be split into: `normalize-delegation.ts`, `normalize-lifecycle.ts`, `normalize-notification.ts`, `normalize-execution.ts`, `normalize-route.ts`. |
| `create-session-hooks.ts` (364 LOC) | Combines: (1) compaction checkpoint injection, (2) auto-loop retry logic, (3) injection evaluation, (4) lifecycle snapshot formatting. The auto-loop logic (~150 LOC) could be extracted. |

---

## 3. Separation of Concerns Violations

### SoC-1: Business Logic in Hooks

**Files:** `src/hooks/create-session-hooks.ts`, `src/hooks/create-tool-guard-hooks.ts`

- `create-session-hooks.ts` contains auto-loop state management (iteration counting, exhaustion tracking, retry logic) — this is business logic that belongs in a domain service, not a hook factory.
- `create-tool-guard-hooks.ts` contains governance evaluation, policy resolution, invocation key management, and circuit breaker logic — all business logic.
- **Impact:** Hook factories are hard to test in isolation. Business logic is entangled with OpenCode's hook interface.
- **Phase 11 fix:** Extract auto-loop logic to `src/lifecycle/auto-loop.ts` and governance/circuit-breaker to `src/control-plane/circuit-breaker.ts`.

### SoC-2: Persistence Calls Inside Read Operations

**File:** `src/lib/continuity.ts` — `persistStore()` called from `ensureStoreLoaded()`, `recordSessionContinuity()`, `patchSessionContinuity()`, `deleteSessionContinuity()`, and critically from `getGovernancePersistenceState()` indirectly.

- `recordSessionContinuity()` both records AND persists (disk write + delegation export). No read/write separation.
- **Impact:** Every continuity read potentially triggers writes. Delegation export runs synchronously on every persist.
- **Phase 11 fix:** CQRS separation — read-only continuity reader vs write-side continuity writer with batched persistence.

### SoC-3: Notification Logic Duplicated Across 3 Files

**Files:** `src/lib/notification-handler.ts`, `src/lib/lifecycle-process-runner.ts`, `src/lib/lifecycle-tmux-runner.ts`, `src/lib/lifecycle-background-observer.ts`

- Notification delivery pattern (build→notify→persist if failed) is copy-pasted across lifecycle-process-runner, lifecycle-tmux-runner, and lifecycle-background-observer. Each has its own `notifyParentWithFallback` or equivalent inline code.
- **Impact:** Shotgun surgery — any change to notification format requires edits in 3-4 files.
- **Fix:** Centralize into `notification-handler.ts` with a single `notifyParentWithFallback()` function.

### SoC-4: `formatRuntimeInjectionBlock` Duplicated

**Files:** `src/hooks/create-core-hooks.ts` and `src/hooks/create-session-hooks.ts` both define identical `formatRuntimeInjectionBlock()` functions (~30 LOC each).

- **Impact:** Maintenance burden. If injection block format changes, must update both copies.
- **Fix:** Move to `src/lib/injection-engine.ts` and export.

### SoC-5: `plugin.ts` Contains Tool Permission Logic

**File:** `src/tools/delegate-task.ts` (not plugin.ts, but still a concern)

- `AGENT_TOOLS` permission profiles and `getPermissionRulesForAgent()` (80+ LOC) live in the tool file. This is authorization logic that should be in a dedicated `src/control-plane/permissions.ts` module.
- **Impact:** Adding a new agent requires editing the tool file. Authorization is mixed with tool execution.

### SoC-6: Lifecycle State Patching Exposed as Callback

**Files:** `src/lib/lifecycle-manager.ts` passes `patchLifecycle: (args) => this.patchLifecycle(args)` as a callback to `runLifecycleTmuxTask`, `runLifecycleProcessTask`, `runLifecycleSubsessionTask`, and `observeBackgroundCompletion`.

- The patch callback exposes internal lifecycle state mutation to external runner modules. This is intentional (dependency injection) but means the runners can trigger arbitrary lifecycle transitions.
- **Impact:** No guard at the callback level — runners could transition to invalid phases (though `patchLifecycle` validates transitions internally).

---

## 4. Anti-Patterns

### AP-1: God Object — `lifecycle-manager.ts` (734 LOC, 14 imports)

The single biggest concern. The `HarnessLifecycleManager` class is responsible for:
1. Concurrency limit management
2. Continuity hydration from disk
3. Event→status mapping
4. Session creation and continuity recording
5. Queue acquisition and release
6. Tmux task dispatch (sync + async)
7. Process task dispatch (sync + async)
8. Subsession task dispatch (sync + async)
9. Cancellation
10. Auto-loop retry requests
11. Compaction checkpoint recording
12. Recovery state queries
13. Activity observation
14. Delegation packet status sync

**Files:** `src/lib/lifecycle-manager.ts`

### AP-2: Feature Envy — Lifecycle Runners

`lifecycle-process-runner.ts` and `lifecycle-tmux-runner.ts` both call `args.getSessionContinuity()`, `args.patchLifecycle()`, `args.getLifecycleSnapshot()`, `args.releaseQueue()` — they are deeply coupled to the lifecycle manager's internal API. They "envy" the manager's state access.

**Files:** `src/lib/lifecycle-process-runner.ts`, `src/lib/lifecycle-tmux-runner.ts`

### AP-3: Shotgun Surgery Risk — Notification Delivery

Changing notification format requires edits in:
- `src/lib/notification-handler.ts` (primary)
- `src/lib/lifecycle-process-runner.ts` (inline notification)
- `src/lib/lifecycle-tmux-runner.ts` (inline notification)
- `src/lib/lifecycle-background-observer.ts` (inline notification via `notifyParentWithFallback`)
- `src/hooks/create-core-hooks.ts` (toast notification replay)

### AP-4: Data Clump — `PatchLifecycleArgs` Type

The same `PatchLifecycleArgs` type shape appears in 3 files:
- `src/lib/lifecycle-tmux-runner.ts`
- `src/lib/lifecycle-process-runner.ts`
- `src/lib/lifecycle-background-observer.ts`

These are defined locally in each file rather than shared. While they share the same shape, they are not imported from a common source.

### AP-5: Large Module — `continuity-normalizers.ts` (706 LOC)

30+ normalization functions in a single file. Most follow the same pattern: type guard → field extraction → validation → return. This is mechanical repetition that should be generated or split.

**Files:** `src/lib/continuity-normalizers.ts`

### AP-6: Singleton Anti-Pattern

**File:** `src/lib/state.ts` — `export const taskState = new TaskStateManager()`

Module-level singleton prevents isolated unit testing. Tests that modify `taskState` share state across test files. No reset mechanism exported.

**File:** `src/lib/continuity.ts` — `let storeCache: ContinuityStoreFile | undefined`

Same issue. Module-level cache means tests share continuity state.

### AP-7: Switch Statement Proliferation

Multiple switch statements across the codebase for the same domain:
- `getPermissionRulesForAgent()` in `src/tools/delegate-task.ts` — 7-case switch
- `mapStatusToLifecyclePhase()` in `src/lib/lifecycle-state.ts` — 6-case switch
- `mapPhaseToDelegationPacketStatus()` in `src/lib/lifecycle-state.ts` — 4-case switch
- `normalizeSpecialistAgent()` in `src/lib/continuity-normalizers.ts` — 7-case switch
- `normalizeStatus()` in `src/lib/continuity-normalizers.ts` — 7-case switch
- `normalizeLifecyclePhase()` in `src/lib/continuity-normalizers.ts` — 6-case switch

**Fix:** Use lookup tables (`Record<EnumType, Value>`) instead of switches where possible.

---

## 5. Technical Debt Inventory

### No TODO/FIXME Comments Found

The codebase contains zero `TODO`, `FIXME`, `HACK`, `XXX`, or `TEMPORARY` markers in source files. This is unusual — either the code is pristine, or issues are tracked externally (in `.planning/` files).

### Known External Tracking

Issues are tracked in `.planning/` markdown files rather than inline comments. Key open items:

| Item | Tracked In | Status |
|------|-----------|--------|
| `system.transform` wiring removal | `ROADMAP.md` Phase 1 item 8 | Pending |
| `hivefiver-orchestrator.md` phantom references | `ROADMAP.md` Phase 1 item 9 | Pending |
| Context-budget heuristic replacement | `ROADMAP.md` Phase 1 item 10 | Pending |
| `session-patch` heading corruption | CONCERNS.md BUG-2 | Possibly fixed, unverified |
| Cross-line contradiction noise | CONCERNS.md BUG-5 | Still O(n²), unverified |
| `route.warnings` not deep-cloned | CONCERNS.md AR5 | Still unfixed |
| `noteObservedActivity` phase bypass | CONCERNS.md AR6 | Still unfixed |

### Commented-Out Code

No commented-out code blocks found in `src/`. The codebase is clean in this regard.

### Debt Items

**DEBT-1: `continuity.ts` silently swallows errors**
- `loadStoreFromDisk()` returns `emptyStore()` on any parse error — all continuity history lost with no warning.
- `persistStore()` silently swallows I/O errors — in-memory and on-disk diverge.
- **Files:** `src/lib/continuity.ts:85-96`
- **Fix:** Add `console.warn` or return Result type.

**DEBT-2: `types.ts` deceptive union type**
- `SessionStatusType = "idle" | "busy" | "retry" | string` — the `| string` union absorbs the literals, making it equivalent to `string`.
- **Files:** `src/lib/types.ts:28`
- **Fix:** Remove `| string` or use just `string`.

**DEBT-3: Duplicate `formatRuntimeInjectionBlock`**
- Same ~30 LOC function in `create-core-hooks.ts` and `create-session-hooks.ts`.
- **Files:** `src/hooks/create-core-hooks.ts:44-67`, `src/hooks/create-session-hooks.ts:50-73`
- **Fix:** Extract to shared module.

**DEBT-4: Duplicate `asString` in continuity-normalizers**
- `continuity-normalizers.ts` defines its own `asString` (line 7) despite `helpers.ts` exporting one.
- **Files:** `src/lib/continuity-normalizers.ts:7`
- **Fix:** Import from `./helpers.js`.

---

## 6. Known Bugs from Prior Sessions

### BUG-1: Delegation Sync Crash (Resolved — Phase 08)

- **Symptom:** Child sessions deleted when parent's turn ended because `session.prompt()` (synchronous) was used instead of `session.promptAsync()`.
- **Fix:** Migrated to `sendPromptAsync()` in `src/lib/lifecycle-process-runner.ts` and `runLifecycleSubsessionTask`.
- **Status:** ✅ Resolved. `sendPromptAsync` is used for async delegation.

### BUG-2: Async Silent Failure (Resolved — Phase 09.1)

- **Symptom:** Background delegation appeared to succeed but child sessions never ran. `checkSessionExists()` returned `{ type: "busy" }` as default even when session lookup failed.
- **Fix:** `checkSessionExists()` now returns `undefined` on failure, with status-map fallback.
- **Files:** `src/lib/lifecycle-background-observer.ts`
- **Status:** ✅ Resolved in Phase 09.1.

### BUG-3: Notification Delivery Gap (Partially Resolved)

- **Symptom:** Parent sessions don't receive notifications when child sessions complete because OpenCode has no "stand by" mechanism — parent session moves on before child completes.
- **Mitigation:** `persistPendingNotification()` stores notifications for replay on session resume. `replayPendingNotificationsForEvent()` in `create-core-hooks.ts` replays on `session.created`/`session.updated`.
- **Gap:** Parent auto-loop polling (D-14) is NOT YET IMPLEMENTED. Phase 09.2-02-PLAN.md defines it but it remains unexecuted.
- **Status:** ⚠️ Partially mitigated. Pending notifications persist but require session restart to deliver. Real-time delivery needs D-14 parent coordinator.

### BUG-4: Auto-Loop Infinite Context Consumption (Mitigated)

- **Symptom:** Auto-loop retries without iteration cap could consume unlimited context window.
- **Fix:** `maxIterations: 5` in `create-session-hooks.ts`, `retryPending` flag prevents concurrent retries.
- **Status:** ✅ Mitigated.

### BUG-5: `runtimePolicyOverride` Write Persistence Gap (Resolved — Phase 08)

- **Symptom:** Runtime policy overrides were written in-memory but not persisted to continuity store.
- **Fix:** `patchSessionContinuity` now correctly clones and persists `runtimePolicyOverride`.
- **Status:** ✅ Resolved.

---

## 7. Integration Risks for Phase 11 Clean Architecture Refactor

### RISK-1: Import Breakage Cascade

Phase 11 plans to restructure `src/lib/` (31 flat files) into 8-10 domain modules (`lifecycle/`, `delegation/`, `continuity/`, `shared/`, `control-plane/`, etc.). With 24 modules importing from `types.ts` and 13 from `continuity.ts`, a single mis-categorized import will cascade.

**Mitigation:** Use barrel re-exports during transition. `src/lib/types.ts` → `src/shared/types/` with re-export shim.

### RISK-2: `lifecycle-manager.ts` Split Is High-Risk

Splitting a 734-LOC, 14-import god object into 3 modules (tasking-coordinator, tasking-observer, tasking-dispatcher) requires precise dependency mapping. Any missed import will break the entire delegation pipeline.

**Mitigation:** Extract leaf modules first (notification delivery, compaction checkpoint, recovery queries) before attempting the main split.

### RISK-3: Test Suite Dependency on Current Structure

Tests in `tests/lib/` import from current `src/lib/` paths. Phase 11 file moves will break all test imports unless a systematic rename is applied.

**Mitigation:** Use TypeScript path aliases during transition period.

### RISK-4: Continuity File Format Migration

If `continuity.ts` is restructured, the JSON file format may change. Existing continuity data on disk would become unreadable.

**Mitigation:** Version the continuity file format. Add migration logic in `loadStoreFromDisk()`.

### RISK-5: Plugin Composition Root Breakage

`plugin.ts` imports from 11 modules. If any module moves, the plugin wiring breaks and the entire harness fails to load.

**Mitigation:** Plugin should import from barrel re-exports, not leaf modules directly.

### RISK-6: Circular Dependency Introduction

Phase 11 introduces new module boundaries (`lifecycle/`, `delegation/`, `continuity/`). If `lifecycle/` imports from `delegation/` which imports from `continuity/` which imports from `lifecycle/`, a circular dependency is created.

**Current state:** No circular dependencies (verified by acyclic import graph).

---

## 8. Phase 09.2 D-14 Parent Coordination Gap Assessment

### What D-14 Specifies

D-14 defines the **parent coordination** requirement: the main (parent) session should close only when ALL delegated child sessions AND ALL user tasks are complete. The mechanism is auto-loop polling — parent session polls the continuity store for child session lifecycle phases.

### Current Implementation Status

**NOT YET IMPLEMENTED.** Phase 09.2-02-PLAN.md defines the implementation but has NOT been executed. The plan calls for:

1. `src/lib/tasking/completion/failure-handler.ts` — failure handling with 180s timeout, 2 retries, resume-first
2. `src/lib/tasking/completion/parent-coordinator.ts` — `ParentCoordinator` class that tracks child sessions
3. Extended `src/hooks/create-session-hooks.ts` — parent auto-loop mode alongside existing child auto-loop
4. New types in `src/hooks/types.ts` — `ParentAutoLoopConfig`
5. Tests for both modules

### Gap Analysis

**What exists:**
- `src/lib/lifecycle-background-observer.ts` — polls child session status via `checkSessionExists()` + status map. Detects completion/deletion/failure for individual sessions.
- `src/lib/notification-handler.ts` — sends notifications to parent when child completes.
- `src/lib/pending-notifications.ts` — persists notifications for offline delivery.
- `src/hooks/create-session-hooks.ts` — child auto-loop (waits for `<promise>DONE</promise>` signal).

**What's missing (the D-14 gap):**

| Gap | Impact | Severity |
|-----|--------|----------|
| No `ParentCoordinator` class | Parent has no systematic way to track all child delegations | **HIGH** |
| No parent auto-loop mode | Parent session goes idle and moves on before children complete | **HIGH** |
| No `DelegationCompletionSnapshot` | No aggregate view of delegation status | **MEDIUM** |
| No `buildParentAutoLoopPrompt` | Cannot prompt LLM to wait for delegations | **MEDIUM** |
| No `buildParentSynthesisPrompt` | Cannot prompt LLM to synthesize results after all complete | **MEDIUM** |
| No `canCloseMainSession` logic | Parent may close while children still running | **HIGH** |
| `failure-handler.ts` not implemented | No 180s idle timeout, no retry logic, no resume-first | **HIGH** |

### Existing Workarounds (Insufficient)

1. **Fire-and-forget delegation:** `delegate-task` with `async_dispatch=true` returns immediately. Parent continues work. Child notifies via `session.prompt()` when done. But parent may have already moved on.

2. **Pending notification replay:** If parent is unavailable, notification persists and replays on next `session.created` or `session.updated` event. But this requires a session restart.

3. **Child auto-loop:** Child sessions poll for `<promise>DONE</promise>`. This keeps the child alive but does nothing for the parent.

### Recommendation

D-14 is the **highest priority gap** because without parent coordination, delegated sessions complete but the parent never knows to synthesize results. The current notification system is best-effort — it works when the parent is actively processing, but fails when the parent has moved on.

Phase 09.2-02-PLAN.md should be executed before Phase 11 restructuring, because the `tasking/completion/` sub-module becomes part of the Phase 11 `lifecycle/` or `delegation/` domain.

---

## 9. Priority Summary

### P0 — Blocks Correct Operation

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 1 | `lifecycle-manager.ts` god object (734 LOC, 14 imports) | `src/lib/lifecycle-manager.ts` | Large — split into 3+ modules |
| 2 | Notification delivery duplicated across 4 files | `notification-handler.ts`, `lifecycle-process-runner.ts`, `lifecycle-tmux-runner.ts`, `lifecycle-background-observer.ts` | Medium — centralize |
| 3 | D-14 parent coordination not implemented | Phase 09.2-02-PLAN.md | Medium — execute plan |

### P1 — Functional Bugs

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 4 | `route.warnings` not deep-cloned | `src/lib/continuity-clone.ts` | Trivial |
| 5 | `noteObservedActivity` hardcodes phase to "running" | `src/lib/lifecycle-manager.ts:164` | Small |
| 6 | `continuity.ts` silent error swallowing | `src/lib/continuity.ts:85-96` | Small |
| 7 | `types.ts` deceptive union type | `src/lib/types.ts:28` | Trivial |
| 8 | Duplicate `formatRuntimeInjectionBlock` | `create-core-hooks.ts`, `create-session-hooks.ts` | Small |
| 9 | Duplicate `asString` in continuity-normalizers | `src/lib/continuity-normalizers.ts:7` | Small |

### P2 — Structural

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 10 | `continuity-normalizers.ts` 706 LOC | `src/lib/continuity-normalizers.ts` | Medium — split by domain |
| 11 | Module-level singletons (`taskState`, `storeCache`) | `state.ts`, `continuity.ts` | Medium — injectable instances |
| 12 | `create-session-hooks.ts` business logic in hooks | `src/hooks/create-session-hooks.ts` | Medium — extract auto-loop |
| 13 | `delegate-task.ts` authorization logic in tool | `src/tools/delegate-task.ts` | Medium — extract permissions |

### P3 — Test Coverage

| # | Issue | Target | Effort |
|---|-------|--------|--------|
| 14 | Zero tests for `lifecycle-manager.ts` | 734 LOC | Large |
| 15 | Zero tests for `continuity.ts` | 310 LOC | Large |
| 16 | Zero tests for `governance-engine.ts` | 275 LOC | Medium |
| 17 | Zero tests for `injection-engine.ts` | 267 LOC | Medium |

---

*Concerns analysis: 2026-04-11 — post-Phases 08/09/09.1/09.2 scan*
