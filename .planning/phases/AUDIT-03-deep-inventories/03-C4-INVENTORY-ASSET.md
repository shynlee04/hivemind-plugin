# C4 Cluster Inventory: Hooks [AUDIT-03 - Deep Inventory]

**Cluster:** C4 — Hooks (OpenCode SDK event observers, transforms, lifecycle, composition, pane monitor)
**Analysis Date:** 2026-06-06
**Inventory Base:** `src/hooks/` (17 source files), `tests/hooks/` (28 test files), `tests/lib/hooks/` (2 test files)

---

## 1. Cluster Overview

C4 is the hooks layer that bridges the OpenCode SDK runtime to the Hivemind harness. Every interaction an LLM agent takes with OpenCode (event firing, system-prompt transformation, tool execution, chat message, environment setup) passes through one of the C4 factories. The cluster is responsible for:

- Routing SDK events to the lifecycle manager and event observers.
- Composing response-shaping, guard-decision, and observation transforms in a CQRS-compliant way.
- Enforcing per-session runtime policy: tool-call budgets, circuit-breaker on repeated tool signatures, governance rules, and contract allowedSurfaces.
- Persisting pane-captured tmux events to a per-session journal with exponential backoff and rate capping.
- Building the governance / language / behavioral / agent-profile system-prompt block that frames every LLM turn.

The cluster is invoked by exactly one orchestrator: `src/plugin.ts` (composition root). 14 distinct `create*` factories from C4 are imported by `plugin.ts` and instantiated during plugin load (per `CONCERNS.md:347` — 60+ module imports).

The cluster's distinguishing architectural property is **CQRS separation via the `classifyHookEffect()` classifier**: every hook effect is tagged as `observation`, `response-shaping`, `guard-decision`, or `durable-write`. Hook contexts are explicitly forbidden from durable writes (`assertHookWriteBoundary` throws) — all durability must be routed through C2's session-tracker.

**Total Files Scanned:** 17 source files + 30 test files = **47 files**

| Sub-Group | Source Files | Test Files | Total |
|-----------|--------------|------------|-------|
| Types | 1 | 1 | 2 |
| Composition (CQRS) | 1 | 1 | 2 |
| Lifecycle | 2 | 3 | 5 |
| Observers | 5 | 5 | 10 |
| Transforms | 5 | 4 | 9 |
| Guards | 2 | 1 | 3 |
| Pane Monitor | 1 | 2 | 3 |
| Other test files (smoke/top-level) | — | 13 | 13 |
| **Total** | **17** | **30** | **47** |

---

## 2. Sub-Groupings

C4 naturally divides into 7 sub-groupings (matching the on-disk directory layout):

| # | Sub-Group | Files | Purpose |
|---|-----------|-------|---------|
| 1 | **Types** | `src/hooks/types.ts` (66 LOC) | `HookDependencies` bundle — the single dependency contract injected into every hook factory. Defines `AutoLoopConfig` + `ParentAutoLoopConfig`. |
| 2 | **Composition (CQRS)** | `src/hooks/composition/cqrs-boundary.ts` (36 LOC) | `classifyHookEffect()` / `assertHookWriteBoundary()` — the CQRS classifier that forbids durable writes from hook contexts. |
| 3 | **Lifecycle** | `src/hooks/lifecycle/core-hooks.ts` (277 LOC) + `session-hooks.ts` (423 LOC) | `createCoreHooks` (event + system.transform + shell.env) and `createSessionHooks` (event auto-loop + experimental.session.compacting). |
| 4 | **Observers** | `src/hooks/observers/` (5 files, 360 LOC total) | Pure read-side SDK event → fact extraction. Five consumers wrap the three observer factories. |
| 5 | **Transforms** | `src/hooks/transforms/` (5 files, 370 LOC total) | Response-shaping + chat capture + tool before/after pipelines. Includes contract enforcement and workflow persistence. |
| 6 | **Guards** | `src/hooks/guards/` (2 files, 419 LOC total) | Hard enforcement — `createToolGuardHooks` (budget + circuit-breaker + governance + tool-intelligence + document-language) and `buildGovernanceBlock` (system-prompt governance block). |
| 7 | **Pane Monitor** | `src/hooks/pane-monitor.ts` (542 LOC) | Standalone observer for P52 tmux `pane-captured` events with backoff + rate cap. |

### Design Patterns Used

- **Factory (Constructor with DI)** — Every hook is a `create*Factory(deps)` function that returns a closure-captured handler. All 14 factories follow this pattern, enabling test-time stubbing via dependency mocking (e.g., `vi.fn<[input: ...], Promise<void>>()`).
- **CQRS Boundary** — `classifyHookEffect()` is the gatekeeper. Hooks tagged `response-shaping` or `guard-decision` can read but never write. `assertHookWriteBoundary()` throws on attempt (though never called at runtime — see §6.14).
- **Best-Effort / Silent-Fallback (D-04 pattern)** — Most consumers wrap their body in `try { ... } catch {}` or `try { ... } catch (err) { logWarn?.(...) }`. The hook layer should never throw to the OpenCode runtime (pane-monitor explicitly documents D-04, L7-8).
- **Closure-Captured State** — `createSessionHooks` keeps `autoLoopStates: Map<string, AutoLoopState>` in closure. `createPaneMonitorHook` keeps `pendingRetries: Map<number, RetryContext>` in closure.
- **Backoff Retry** — `pane-monitor.ts` uses `BACKOFF_SCHEDULE_MS = [5_000, 10_000, 30_000]` with `MAX_RETRIES = 3`. D-53-05.
- **Rate Capping** — `pane-monitor.ts` enforces `RATE_LIMIT_PER_HOUR = 100` per session per UTC hour (top-of-hour reset). D-53-06, T-53-03.
- **In-Memory Cache with Edge-Case Default** — `createSessionIsMainObserver` defaults `isMainSession` to `true` for uncached sessions to avoid blocking language injection. D-01, D-04 (session-hooks).
- **Three-Step Tool-Before Chain** — `createToolBeforeGuard` chains: (1) tool guard, (2) session-tracker child discovery, (3) optional contract enforcement. Per Plan 06.
- **Exclusive-Create Journal Writes** — `pane-monitor.ts` uses `flag: "wx"` file write mode to prevent clobber of existing journal entries (REQ-53-02). Sibling `-pane-content.txt` files follow the same pattern (P58.9 REQ-58.9-01).

---

## 3. File Inventory

### 3.1 Types — `src/hooks/types.ts`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `types.ts` | `HookDependencies` interface — single dependency bundle. Defines `AutoLoopConfig`, `ParentAutoLoopConfig`. Imports `HarnessLifecycleManager`, `OpenCodeClient`, `TaskStateManager`, `AutoLoopOptions/Result`, `RalphLoopOptions/Result`, `IntakeResult`, `HivemindConfigs`, `ResolvedBehavioralProfile`. | Types | C2 lifecycle, C1 session-api/state, C3 spawner/auto-loop/ralph-loop, C1 routing/intake, C1 schema-kernel, C1 routing/behavioral-profile | 66 LOC. `AutoLoopConfig` + `ParentAutoLoopConfig` are exported but **never imported by anything outside `src/hooks/types.ts` and `src/hooks/lifecycle/session-hooks.ts`** (verified: zero external `from "./hooks/types"` imports). These types are effectively unused exports — only their properties are consumed via `deps.autoLoopConfig?.XXX`. |

### 3.2 Composition (CQRS) — `src/hooks/composition/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `cqrs-boundary.ts` | `classifyHookEffect(hook)` returns `{ hook, kind, durableWriteAllowed: false }`. `assertHookWriteBoundary({hook, operation})` throws when `operation === "durable-write"`. | CQRS Boundary | None (leaf module) | 36 LOC. `HookEffectKind`, `HookOperation`, `HookEffectClassification` types are exported but **never imported externally** (only the two functions are used by C4 internals). Test coverage is thin (20 LOC, 3 cases) — `tool.execute.after` classification (line 17) is not tested. `assertHookWriteBoundary` is never called at runtime (see §6.14). |

### 3.3 Lifecycle — `src/hooks/lifecycle/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `core-hooks.ts` | `createCoreHooks(deps)` returns `{ event, "system.transform", "experimental.chat.system.transform", "shell.env" }`. The `event` hook routes to `lifecycleManager.handleEvent` + `replayPendingNotificationsForEvent` + iterates `eventObservers`. The `system.transform` hook injects: language block (position 0), governance block, intake context, behavioral profile, dynamic agent profile from `.opencode/agents/{name}.md`. `shell.env` sets `CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1`, `TERM=dumb`. | Lifecycle | C2 lifecycle, C1 shared helpers, C1 session-api, C4 cqrs-boundary, C4 governance-block, C1 bootstrap (loadPrimitive), C2 continuity, C1 state | 277 LOC. Returns BOTH `system.transform` (back-compat) and `experimental.chat.system.transform` (the actual OpenCode SDK hook name). Both routes share `handleSystemTransform()` — if OpenCode ever dispatches both in the same turn, the handler runs twice. `resolveAgentNameForSession` (L197-230) has a 3-step fallback chain (state → continuity → main session default "hm-l0-orchestrator"). The mapping of agent name "build" → "hm-l0-orchestrator" (L225-227) is a hardcoded alias. |
| `session-hooks.ts` | `createSessionHooks(deps)` returns `{ event, "experimental.session.compacting" }`. The `event` hook drives auto-loop retries on `session.idle` for sessions with `delegationPacket`. Terminal events (`session.deleted`, `session.error`) permanently disable auto-loop. Ratchets into `runRalphLoop` on `failed` outcome. The `compacting` hook serializes lifecycle + auto-loop state + continuity + intake compaction packet into `output.context`. | Lifecycle | C2 continuity, C2 continuity-reader, C1 helpers, C1 session-api, C5 prompt-packet/compaction-preservation + kernel-packet, C4 types | 423 LOC. `DEFAULT_AUTO_LOOP_CONFIG.completionSignal = "<promise>DONE</promise>"` is a magic string duplicated across clusters (auto-loop defaults). `experimental.session.compacting` input has type `sessionID?: unknown` (L24) — should be `string`. |

### 3.4 Observers — `src/hooks/observers/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `event-observers.ts` | Three pure observer factories: `createDelegationEventObserver()` (returns DelegationEventFact: idle/error/deleted/ignored), `createSessionEntryEventObserver(projectDirectory)` (intake cache + getIntake lookup), `createSessionIsMainObserver()` (isMain cache with true default for uncached). | Observer Factories | C1 helpers, C1 session-api, C1 routing/session-entry/intake-gate | 136 LOC. **In-memory caches that are never invalidated** — `intakeCache` and `mainSessionCache` only grow. The `isMainSession` default-to-true (L132) is documented but represents a timing-edge-case implicit coupling with `system.transform`. |
| `session-entry-consumer.ts` | `createSessionEntryConsumer(observer)` — pass-through wrapper around session-entry observer. | Observer Consumer | C4 event-observers (`SessionEntryEventFact` type) | 22 LOC. **Silently swallows errors** (`catch {}` empty block, L20). No logging path, unlike `session-tracker-consumer`. See §6.9. |
| `session-main-consumer.ts` | `createSessionMainConsumer(observer)` — pass-through wrapper for is-main-session observer. | Observer Consumer | None | 20 LOC. Same silent-catch pattern as `session-entry-consumer.ts`. No logging. See §6.9. |
| `delegation-consumer.ts` | `createDelegationConsumer(deps)` — routes `DelegationEventFact` to `handleSessionIdle`/`handleSessionError?`/`handleSessionDeleted` (DelegationManager methods). | Observer Consumer | C4 event-observers (`DelegationEventFact` type) | 41 LOC. **Does NOT wrap body in try/catch** — any throw from `handleSessionIdle`/`handleSessionDeleted` propagates to the OpenCode runtime (unique among the 5 consumers). Test file (58 LOC, 4 tests) does not test error paths. See §6.5. |
| `session-tracker-consumer.ts` | `createSessionTrackerConsumer(deps)` — extracts `eventType` + `sessionID` and calls `sessionTracker.handleSessionEvent`. Logs via `logWarn` on failure. | Observer Consumer | C1 session-api (`getEventSessionID`), C2 session-tracker | 41 LOC. Catches + logs. Type-assertion chain `as Record<string, unknown> | undefined` (L31) for `event` is loose. |

### 3.5 Transforms — `src/hooks/transforms/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `chat-message-capture.ts` | `createChatMessageCapture(deps)` — delegates `chat.message` hook to `sessionTracker.handleChatMessage`. AC-19 mirror of plugin.ts:238-254. | Transform | C2 session-tracker | 39 LOC. Uses `Pick<SessionTracker, "handleChatMessage">` for narrow surface — clean. |
| `tool-after-composer.ts` | `createToolExecuteAfterHook(deps)` — composes tool guard's after hook with `summarizeOutput`, then projects a `ToolAfterProjectionFact` (kind: "tool-execute-after" | "ignored"). Returns the fact to OpenCode. | Transform | C1 helpers (`asString`, `getNestedValue`) | 71 LOC. The `ToolAfterProjectionFact` type is **never imported externally** (zero hits outside this file). The function returns a structured fact that is discarded by plugin.ts. See §6.12. |
| `tool-after-workflow.ts` | `createToolAfterWorkflow(deps)` — for `configure-primitive` tool calls, dynamically imports `config/workflow/index.js` and advances the workflow turn. AC-20 mirror of plugin.ts:301-317. | Transform | C1 config/workflow (dynamic import inside try/catch) | 54 LOC. **The `logWarn` dep is unused** (L9) — dead parameter. `_deps` is prefixed underscore (L33) acknowledging the dep is unneeded. The `catch {}` on L50 is silent — no logging. See §6.3. |
| `contract-enforcement.ts` | `createContractEnforcementHook(deps)` — `tool.execute.before` enforcement: extracts file paths from `write`/`edit` tools, looks up active contract, throws on `allowedSurfaces` violation. D-06/D-07/D-08/D-23/D-26. | Transform | C1 (path.resolve), C2 agent-work-contracts/types | 103 LOC. **The `isPathAllowed()` check has a path-traversal weakness** (L97-102): both the `startsWith` branch and `includes` fallback are vulnerable to prefix attacks. See §6.4. |
| `tool-before-guard.ts` | `createToolBeforeGuard(deps)` — chains 3 steps: (1) tool guard, (2) session-tracker child discovery (task/delegate-task only), (3) optional contract enforcement. Re-throws `[Harness] contract violation` errors. AC-18 mirror of plugin.ts:194-235. | Transform | C2 agent-work-contracts/types, C4 contract-enforcement | 103 LOC. The contract-enforcement throw-rethrow pattern (L96-99) is the only `try { ... } catch` that intentionally re-throws — this is the one exception to the silent-fallback pattern. |

### 3.6 Guards — `src/hooks/guards/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `tool-guard-hooks.ts` | `createToolGuardHooks(deps)` returns `{ "tool.execute.before", "tool.execute.after" }`. The before-hook enforces: budget (maxToolCallsPerSession), circuit-breaker (repeatedSignatureThreshold), tool intelligence engine (P44-04), governance rules, and document-language reminder (D-11/D-12). The after-hook injects `_harness` metadata (rootSessionID, delegationDepth, governance warnings, tool-intelligence decision, continuity snapshot). | Guard | C2 continuity, C2 continuity-reader, C1 helpers, C1 runtime-policy, C1 shared types, C2 lifecycle, C1 schema-kernel, C1 state, C4 cqrs-boundary, C1 governance-engine, C5 tool-intelligence | 296 LOC. **Single `any[]` type at L63** (`escalations` field) — the only `any` in the C4 cluster. `lastGovResult` Map is populated on every `tool.execute.before` and deleted on `tool.execute.after` — if `after` is dropped, the entry leaks unbounded. See §6.6, §6.7. |
| `governance-block.ts` | `buildGovernanceBlock(config, profile?)` — pure function that assembles the `--- Governance ---` system-prompt block. Combines mode instruction + expertise instruction + language instruction + optional field:value context + P25.5 trajectory/contract tool instructions. | Guard | C1 schema-kernel, C1 routing/behavioral-profile/types | 123 LOC. Two `Record<string, string>` lookup tables: `MODE_INSTRUCTIONS` (3 entries) and `EXPERTISE_INSTRUCTIONS` (5 entries). Unknown values fall back to hardcoded defaults. The P25.5 trajectory instructions (L49-58) reference `.opencode/rules/universal-rules.md` but are static strings. |

### 3.7 Pane Monitor — `src/hooks/pane-monitor.ts`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `pane-monitor.ts` | `createPaneMonitorHook(opts)` returns `{ dispose, counters, __waitForPendingRetries }`. Subscribes to P52 `TmuxEventObserver.onPaneCaptured`. Per-event: (1) path-traversal guard on sessionId, (2) rate-cap (100/session/hour), (3) exponential backoff (5s/10s/30s, max 3 retries), (4) exclusive `flag: "wx"` journal write. Phase 53 + P58.9 added sibling `*-pane-content.txt` file. | Pane Monitor | C3 features/tmux/observers (`PaneCapturedEvent`, `TmuxEventObserver`) | 542 LOC. Largest single C4 file (8% over 500-LOC cap). Has 2 dedicated test files in `tests/lib/hooks/` (347 LOC combined). `__testing.seedCapCount` (L499-507) is a **no-op stub** — documented as "No-op by design" (D-53-07). The cap test (`pane-monitor-cap.test.ts`) **does not use it** — instead it fires 100 real events. The backoff test (`pane-monitor-backoff.test.ts`) uses fake timers with `vi.advanceTimersByTimeAsync`. 7-field `JournalEntry` shape: `schemaVersion: 1` (number), `retryCount` is the 7th field. |

---

## 4. Test File Inventory

All 30 test files covering C4. Grouped by `tests/hooks/` (28 files) and `tests/lib/hooks/` (2 files).

### `tests/hooks/` (28 files, 4385 LOC)

| Test File | LOC | Coverage |
|-----------|-----|----------|
| `tests/hooks/governance-evaluator.test.ts` | 293 | Governance evaluation rules |
| `tests/hooks/continuity.test.ts` | 32 | Continuity integration (minimal) |
| `tests/hooks/task-management.test.ts` | 46 | Task-management surface |
| `tests/hooks/auth.test.ts` | 124 | Auth-related hook paths |
| `tests/hooks/governance-integration.test.ts` | 298 | Governance + hook integration |
| `tests/hooks/types.test.ts` | 22 | HookDependencies type test |
| `tests/hooks/contract-enforcement.test.ts` | 166 | `contract-enforcement.ts` |
| `tests/hooks/completion.test.ts` | 32 | Completion-detector integration |
| `tests/hooks/plugin-event-observers.test.ts` | 30 | Plugin-level event observer wiring |
| `tests/hooks/governance-block.test.ts` | 175 | `buildGovernanceBlock` |
| `tests/hooks/create-core-hooks.test.ts` | 1118 | `createCoreHooks` (largest test file) |
| `tests/hooks/hook-cqrs-boundary.test.ts` | 20 | `cqrs-boundary` (3 test cases, thin) |
| `tests/hooks/tool-after-composer.test.ts` | 32 | `tool-after-composer.ts` |
| `tests/hooks/session.test.ts` | 84 | Session-level hook integration |
| `tests/hooks/delegation.test.ts` | 102 | Delegation-event consumer / observer |
| `tests/hooks/tools.test.ts` | 91 | Tool-guard integration |
| `tests/hooks/session-tracker.test.ts` | 87 | Session-tracker consumer |
| `tests/hooks/create-session-hooks.test.ts` | 452 | `createSessionHooks` |
| `tests/hooks/create-tool-guard-hooks.test.ts` | 497 | `createToolGuardHooks` |
| `tests/hooks/transforms/chat-message-capture.test.ts` | 47 | `chat-message-capture` |
| `tests/hooks/transforms/tool-before-guard.test.ts` | 92 | `tool-before-guard` |
| `tests/hooks/transforms/tool-after-workflow.test.ts` | 83 | `tool-after-workflow` |
| `tests/hooks/observers/event-observers.test.ts` | 102 | event-observers factories |
| `tests/hooks/observers/session-tracker-consumer.test.ts` | 76 | session-tracker-consumer |
| `tests/hooks/observers/session-entry-consumer.test.ts` | 36 | session-entry-consumer |
| `tests/hooks/observers/session-main-consumer.test.ts` | 35 | session-main-consumer |
| `tests/hooks/observers/delegation-consumer.test.ts` | 58 | delegation-consumer (4 tests, no error-path) |
| `tests/hooks/guards/tool-guard-hooks.capability.test.ts` | 155 | Tool-guard capability tests |
| **Subtotal** | **4385** | |

### `tests/lib/hooks/` (2 files, 347 LOC)

| Test File | LOC | Coverage |
|-----------|-----|----------|
| `tests/lib/hooks/pane-monitor-backoff.test.ts` | 191 | Exponential backoff (REQ-53-03): retries on failure, drops after 4 failures, retryCount in journal entry |
| `tests/lib/hooks/pane-monitor-cap.test.ts` | 156 | Rate cap (REQ-53-04): 100/session/hour enforcement, UTC top-of-hour cap reset |
| **Subtotal** | **347** | |

**Total C4 test LOC: 4732** (4385 + 347)

---

## 5. Cross-Cutting Dependencies

### C4 → C1 (Governance + CLI + Config + Routing + Schema + Bootstrap)

| C4 Module | C1 Target |
|-----------|-----------|
| `types.ts` | `task-management/lifecycle`, `shared/session-api`, `shared/state`, `coordination/spawner/auto-loop`, `coordination/spawner/ralph-loop`, `routing/session-entry/intake-gate`, `schema-kernel/hivemind-configs.schema`, `routing/behavioral-profile/types` |
| `core-hooks.ts` | `shared/helpers`, `shared/session-api`, `features/bootstrap/primitive-loader`, `shared/state` |
| `session-hooks.ts` | `shared/helpers`, `shared/session-api` |
| `tool-after-composer.ts` | `shared/helpers` |
| `governance-block.ts` | `schema-kernel/hivemind-configs.schema`, `routing/behavioral-profile/types` |
| `tool-guard-hooks.ts` | `shared/helpers`, `shared/runtime-policy`, `shared/types`, `schema-kernel/hivemind-configs.schema`, `shared/state`, `features/governance-engine`, `features/tool-intelligence` |
| `tool-after-workflow.ts` | `config/workflow` (dynamic import) |
| `session-tracker-consumer.ts` | `shared/session-api` |
| `event-observers.ts` | `shared/helpers`, `shared/session-api`, `routing/session-entry/intake-gate` |
| `contract-enforcement.ts` | (only `path.resolve` from `node:path`) |

### C4 → C2 (Session & Task Management Runtime)

| C4 Module | C2 Target |
|-----------|-----------|
| `types.ts` | `task-management/lifecycle/index` (`HarnessLifecycleManager`) |
| `core-hooks.ts` | `task-management/continuity/index` (`getSessionContinuity`) |
| `session-hooks.ts` | `task-management/continuity/index`, `task-management/continuity/continuity-reader` |
| `tool-guard-hooks.ts` | `task-management/continuity/index`, `task-management/continuity/continuity-reader`, `task-management/lifecycle/index` |
| `chat-message-capture.ts` | `features/session-tracker/index` (`SessionTracker.handleChatMessage`) |
| `session-tracker-consumer.ts` | `features/session-tracker/index` (`SessionTracker.handleSessionEvent`) |
| `tool-before-guard.ts` | `features/session-tracker/index` (sessionTracker.handleToolExecuteBefore) |
| `contract-enforcement.ts` | `features/agent-work-contracts/types` |

### C4 → C3 (Delegation + Coordination)

| C4 Module | C3 Target |
|-----------|-----------|
| `types.ts` | `coordination/spawner/auto-loop` (`AutoLoopOptions/Result`), `coordination/spawner/ralph-loop` |
| `delegation-consumer.ts` | `coordination/delegation/manager` (handleSessionIdle/Error/Deleted — via plugin.ts DI) |
| `pane-monitor.ts` | `features/tmux/observers` (`PaneCapturedEvent`, `TmuxEventObserver`) |

### C4 → C5 (Tool Surfaces)

| C4 Module | C5 Target |
|-----------|-----------|
| `session-hooks.ts` | `features/prompt-packet/compaction-preservation` (`toCompactionPacket`, `CompactionExtras`), `features/prompt-packet/kernel-packet` (`KernelPacket` type) |
| `tool-guard-hooks.ts` | `features/tool-intelligence` (`getToolIntelligenceEngine`, `renderGuidance`) |

### C4 External Importers

| Consumer | Symbols Used | Entity |
|---------|--------------|--------|
| `src/plugin.ts:32-53` | All 14 `create*` factories + `buildGovernanceBlock` + `classifyHookEffect` + `assertHookWriteBoundary` | C8 composition root |
| `tests/plugins/plugin-lifecycle.test.ts:17-18` | `createCoreHooks`, `createSessionHooks` | C8 test |
| `tests/lib/hooks/pane-monitor-backoff.test.ts:32` | `createPaneMonitorHook` | C4 test |
| `tests/lib/hooks/pane-monitor-cap.test.ts:32` | `createPaneMonitorHook` | C4 test |

### C4 Internal Dependencies (between C4 sub-modules)

| Source | Target |
|--------|--------|
| `core-hooks.ts` | `composition/cqrs-boundary.ts`, `guards/governance-block.ts`, `types.ts` |
| `session-entry-consumer.ts` | `event-observers.ts` (type only) |
| `delegation-consumer.ts` | `event-observers.ts` (type only) |
| `session-tracker-consumer.ts` | (no internal C4 deps) |
| `session-main-consumer.ts` | (no internal C4 deps) |
| `tool-before-guard.ts` | `transforms/contract-enforcement.ts` |
| `tool-guard-hooks.ts` | `composition/cqrs-boundary.ts` |
| `createPaneMonitorHook` | (no internal C4 deps — only C3) |

---

## 6. Gaps & Flaws

### 6.1 Unused Type Exports (Dead Code)

**Files:** `src/hooks/types.ts:10, 16`, `src/hooks/composition/cqrs-boundary.ts:1-8`

**Issue:** `AutoLoopConfig`, `ParentAutoLoopConfig`, `HookEffectKind`, `HookOperation`, `HookEffectClassification` are all `export`ed but **zero** external imports reference them (verified by `grep -rn` for each symbol across the entire `src/` tree outside `src/hooks/`).

**Impact:** Zero runtime cost, but documentation drift. The types exist to describe a contract that the runtime reads via `deps.autoLoopConfig?.maxIterations` directly, not via the named type. Maintainers may be confused about whether these types are part of the public API.

**Fix:** Either (a) make the types `internal` (drop `export`), or (b) start using them in `plugin.ts` to lock the contract.

### 6.2 `__testing.seedCapCount` No-Op Stub

**File:** `src/hooks/pane-monitor.ts:499-507`

**Issue:** The exported `__testing.seedCapCount(countersRef, count)` function is an empty body — an explicit no-op. The JSDoc admits "No-op by design — see D-53-07 in-memory implementation rationale." The cap test (`tests/lib/hooks/pane-monitor-cap.test.ts`) **does not use this function** — it fires 100 real events instead (L84-86).

**Impact:** Trap for test contributors. The export remains in the production code with no callers, inviting future maintainers to wire tests against a function that does nothing. The cap test runs 100 sequential async writes, which takes measurable wall-clock time.

**Fix:** Either implement a real `__seedCap` seam (by lifting the closure's `capState`), or remove the export entirely.

### 6.3 Unused `logWarn` Parameter

**File:** `src/hooks/transforms/tool-after-workflow.ts:9, 33`

**Issue:** `ToolAfterWorkflowDeps` declares `logWarn?: (message: string, error: unknown) => void` and the factory destructures it as `_deps` (L33) — but the function body never references it. The `catch {}` on L50 silently swallows errors with no logging. This is inconsistent with the other transforms (which all receive a `logWarn` and use it).

**Impact:** Silent failures from workflow turn persistence are invisible at production time. The dep was clearly intended for logging but the implementation was incomplete.

**Fix:** Either call `deps.logWarn?.(...)` in the `catch` block, or drop the parameter from `ToolAfterWorkflowDeps`.

### 6.4 `isPathAllowed` Path-Traversal Weakness

**File:** `src/hooks/transforms/contract-enforcement.ts:97-102`

**Issue:** The `isPathAllowed` function uses two checks:
```typescript
normalized.startsWith(normalizedSurface) || normalized.includes(surface)
```
**Both branches are vulnerable:**
1. **`startsWith` false positive:** If `allowedSurfaces = ["/tmp/safe"]` and the file path is `/tmp/safEvil/foo.md`, `normalized.startsWith("/tmp/safe")` returns `true` — the path `/tmp/safEvil/` is NOT under `/tmp/safe/` but passes the check.
2. **`includes` false positive:** The fallback `normalized.includes(surface)` is a substring match. If `surface = ".hivemind/"` (a relative prefix) and the file path is `/home/user/project/src/.hivemind-helper/foo.ts`, the check passes even though the file is not under `.hivemind/`.

**Impact:** Medium. Per D-23, contract enforcement is supposed to be a hard block. The path check is bypassable with carefully crafted paths. The `includes` fallback was likely intended for relative surfaces but introduces false-positive matches.

**Fix:** Drop the `|| normalized.includes(surface)` branch. For absolute surfaces, only use `startsWith`. For relative surfaces, use `path.relative()` and check the result doesn't start with `..`. Add a trailing path separator to both `normalized` and `normalizedSurface` before matching to prevent prefix collisions.

### 6.5 `delegation-consumer.ts` Missing Error Handling

**File:** `src/hooks/observers/delegation-consumer.ts:26-40`

**Issue:** The consumer body (L29-40) has **no try/catch at all**. If `deps.observer()` rejects (e.g., on malformed event data), the error propagates to the OpenCode runtime. This is unique among the 5 C4 consumers — the other 4 all have `try { ... } catch { log }` or `catch {}`.

**Impact:** Any throw from `handleSessionIdle`, `handleSessionError`, or `handleSessionDeleted` (DelegationManager methods) ripples through the event observer chain, potentially blocking other observers. The test file (58 LOC, 4 tests) covers only the happy path — no error-propagation test.

**Fix:** Wrap the body in `try { ... } catch (err) { logWarn?.(...) }` — but note `DelegationConsumerDeps` currently has no `logWarn` field. Either add one or accept silent catch.

### 6.6 `lastGovResult` Memory Leak

**File:** `src/hooks/guards/tool-guard-hooks.ts:63, 241`

**Issue:** `lastGovResult: Map<string, { warnings, escalations, blocks }>` is populated on every `tool.execute.before` (L160) and `delete( )`d on every `tool.execute.after` (L241). If a session's `.after` event is dropped (e.g., by OpenCode runtime filtering), the entry leaks. Over a long-running session with many tool calls, the map grows unbounded.

**Impact:** Slow memory growth on misbehaving sessions. Not catastrophic but unbounded.

**Fix:** Add a TTL eviction (e.g., evict entries older than 5 minutes from check time), or scope to `WeakRef` keyed by sessionID.

### 6.7 Single `any` Type in Tool-Guard-Hooks

**File:** `src/hooks/guards/tool-guard-hooks.ts:63`

**Issue:** `escalations: any[]` is the only `any` in the C4 cluster. The type leaks from `evaluateGovernance()` in C1 governance-engine, which returns `{ escalations: any[] }`.

**Impact:** The `_harness` metadata injected in `output.metadata` (L276) propagates this `any[]` to every tool's metadata — any consumer reading `_harness.governance.escalations` gets untyped data.

**Fix:** Tighten the type to `Escalation[]` once C1 governance-engine exports a proper escalation type, or use `unknown[]` with a runtime assertion.

### 6.8 Unbounded In-Memory Observer Caches

**File:** `src/hooks/observers/event-observers.ts:61 (intakeCache), 108 (mainSessionCache)`

**Issue:** Both caches are `Map<string, T>` that are inserted into on every `session.created` event but **never evicted**. For a long-running OpenCode instance serving thousands of sessions, both grow without bound.

**Impact:** Memory pressure on the OpenCode host process. `mainSessionCache` stores one boolean per session — minimal per-entry, but the number of entries is unbounded.

**Fix:** Add a TTL (e.g., 1 hour) with a periodic sweep, or use the existing C2 session-tracker storage as the source of truth rather than an in-memory cache.

### 6.9 Inconsistent Silent-Catch Patterns Across Consumers

**Files:** `session-entry-consumer.ts:20`, `session-main-consumer.ts:17`, `delegation-consumer.ts` (none), `session-tracker-consumer.ts:37`

**Issue:** Four different error handling patterns across 4 observer consumers:
| Consumer | Error Pattern | Logging |
|----------|---------------|---------|
| `session-entry-consumer` | `catch {}` | None |
| `session-main-consumer` | `catch {}` | None |
| `delegation-consumer` | **No try/catch** | N/A (throws) |
| `session-tracker-consumer` | `catch (err) { logWarn?.(...) }` | Yes |

**Impact:** Debugging failures in entry/main/delegation consumers requires reproducing the scenario — there is no log trail. The delegation consumer can break the entire event chain.

**Fix:** Standardize on the `logWarn` pattern across all 4 consumers. Add `logWarn` to `DelegationConsumerDeps`.

### 6.10 Loose `unknown` Type in CompactingInput

**File:** `src/hooks/lifecycle/session-hooks.ts:24`

**Issue:** `type CompactingInput = { sessionID?: unknown }`. The `sessionID` is typed as `unknown` when it should be `string | undefined`. The body uses `asString(getNestedValue(input, ["sessionID"]))` (L307) as the actual type guard.

**Impact:** Mild type-safety regression. Consumers of the hook can't rely on the input shape from the type.

**Fix:** Tighten to `sessionID?: string`.

### 6.11 `__testing.seedCapCount` Unused No-Op (with workaround tests)

**File:** `src/hooks/pane-monitor.ts:499-507`  
**Tests:** `tests/lib/hooks/pane-monitor-backoff.test.ts` (191 LOC), `tests/lib/hooks/pane-monitor-cap.test.ts` (156 LOC)

**Issue:** The `__testing.seedCapCount` export is a no-op stub that no test calls. The cap test (`pane-monitor-cap.test.ts`) works around the missing seam by firing 100 real events — this takes measurable wall-clock time and is coupled to the mock's `writeFile` always succeeding. The backoff test (`pane-monitor-backoff.test.ts`) uses `vi.useFakeTimers()` with `vi.advanceTimersByTimeAsync()`.

**Note (corrected):** Both test files **do exist** and are functional. The cap test fires 100 sequential synchronous-like events then awaits `__waitForPendingRetries`. The backoff test advances fake timers in 5s/10s/30s increments and asserts on `retryCount` in the journal. The tests are comprehensive for backoff (2 tests) and cap (2 tests). The gap is the dangling no-op stub, not the absence of tests.

**Fix:** Either implement `__testing.seedCapCount` by lifting the closure's `capState` variable, or delete the export.

### 6.12 `ToolAfterProjectionFact` Unused Type

**File:** `src/hooks/transforms/tool-after-composer.ts:3-17`

**Issue:** The `ToolAfterProjectionFact` type is exported via the function return type (`createToolExecuteAfterHook` returns `Promise<ToolAfterProjectionFact>`) but is never imported by any other file (verified by `grep -rn` across `src/` and `tests/`). The consumer (`plugin.ts:1004`) assigns the result to `const fact` but never reads it — the true result comes from `output.metadata` mutation performed by the tool guard's after-hook.

**Impact:** Dead type. Either an unreleased feature or a design oversight from when `tool-after-composer.ts` was extracted from `plugin.ts`.

**Fix:** Either (a) wire the fact into the session-tracker journey log, (b) return `void` and remove the type, or (c) document the type as reserved.

### 6.13 Dual `system.transform` Return Shape

**File:** `src/hooks/lifecycle/core-hooks.ts:34-39, 249-261`

**Issue:** `createCoreHooks` returns **both** `"system.transform"` (legacy) and `"experimental.chat.system.transform"` (actual), both backed by the same `handleSystemTransform` function (L64). The JSDoc (L9-12): "BOOT-09 note: The OpenCode plugin SDK hook name is `experimental.chat.system.transform` (NOT `system.transform`). Both are returned for backward compatibility with tests, but only `experimental.chat.system.transform` is dispatched by the OpenCode runtime."

**Impact:** If OpenCode ever dispatches both hook names in the same turn (e.g., a future SDK version), the handler runs twice per turn — injecting two copies of every system block. The `system.transform` key is shipped to the OpenCode runtime but silently ignored.

**Fix:** Drop the legacy `"system.transform"` key once all tests are updated. The test `create-core-hooks.test.ts` (1118 LOC) may be the blocker — it likely references the legacy key.

### 6.14 `assertHookWriteBoundary` Never Called at Runtime

**File:** `src/hooks/composition/cqrs-boundary.ts:32` (definition) — only caller: `tests/hooks/hook-cqrs-boundary.test.ts:16`

**Issue:** `assertHookWriteBoundary()` is defined to prevent hooks from performing durable writes, but it is **never called at runtime**. `classifyHookEffect()` IS called at runtime (3 call sites), but the actual write-boundary enforcement relies entirely on the type system (factories receive narrowed `Pick<>` interfaces).

**Impact:** The boundary is invisible to code review — a future developer adding a `writeFileSync` call inside a hook would not be caught by any runtime check. The CQRS boundary exists only as documentation and a test artifact.

**Fix:** Either (a) call `assertHookWriteBoundary` in every hook factory's body as a runtime assertion, or (b) document that the boundary is enforced via DI shape and rename the function accordingly.

### 6.15 `delegation-consumer.ts` Inconsistent Error Surface (re: §6.5)

(See §6.5 — same root cause: no try/catch, no logWarn dep. Listed here separately for completeness because it is the most impactful inconsistency among the 4 consumer patterns.)

### 6.16 `createCoreHooks` `eventObservers` Iteration Order

**File:** `src/hooks/lifecycle/core-hooks.ts:53, 244-246`

**Issue:** `const eventObservers = deps.eventObservers ?? []` is iterated in array order (L244-246). The 4 consumer factories are created in `plugin.ts` in a fixed order. If two observers both react to the same event (e.g., `session.idle` triggers both delegation and tracker consumers), the order is determined by plugin.ts arrangement — no explicit ordering contract.

**Impact:** Hidden ordering coupling. A future maintainer rearranging `plugin.ts` could change behavior silently.

**Fix:** Document the expected observer order in `HookDependencies.eventObservers` type, or use explicit phase ordering instead of array iteration.

---

## 7. Conflicts

### 7.1 C4 Cluster Boundary Conflict (Governance Guards)

**Source:** `.planning/codebase/CLUSTER-INVENTORY-2026-06-06.md:27, 47, 80-88`

**Conflict:** CLUSTER-INVENTORY-2026-06-06.md states (rule #3): "Governance guards → C1: Hooks whose PURPOSE is governance enforcement (tool-guard-hooks, governance-block, tool-before-guard, contract-enforcement) belong to C1, not C4. C4 is for pure read-side observers only."

The current AUDIT-03 task treats all 17 `src/hooks/` files as C4. This inventory follows the orchestrator's task scope.

**Impact:** Documents disagree. The CLUSTER-INVENTORY was finalized 2026-06-06; AUDIT-03 started 2026-06-06. The 4 governance-enforcement files (tool-guard-hooks.ts, governance-block.ts, tool-before-guard.ts, contract-enforcement.ts) are inventoried as C4 here. The CLUSTER-INVENTORY rule #3 should be treated as authoritative for any future re-organization.

**Resolution:** Pending — escalate to the orchestrator for boundary resolution.

### 7.2 `system.transform` Naming Conflict

**File:** `src/hooks/lifecycle/core-hooks.ts:36, 256-260`

**Conflict:** Two different hook names map to the same handler. The actual OpenCode SDK hook name is `experimental.chat.system.transform` (per BOOT-09 JSDoc). The `system.transform` key is kept for test backward compatibility only. Both are returned by `createCoreHooks`.

**Impact:** If OpenCode ever dispatches both keys in the same turn, the handler runs twice. Currently only the `experimental.chat` prefixed name is dispatched.

**Resolution:** Drop the legacy key after verifying no tests depend on it.

### 7.3 Auto-Loop Completion Signal Duplication

**Files:** `src/hooks/lifecycle/session-hooks.ts:37`, `src/coordination/spawner/auto-loop.ts` (referenced via type import)

**Conflict:** `DEFAULT_AUTO_LOOP_CONFIG.completionSignal = "<promise>DONE</promise>"` is hardcoded in `session-hooks.ts`. The same magic string may exist in C3's auto-loop module. If C3's `AutoLoopOptions.completionSignal` ever changes, the session-hooks default drifts silently.

**Impact:** Session-hooks and auto-loop could use different completion signals without any compiler or runtime warning.

**Resolution:** Centralize the default in C1 schema-kernel (`HivemindConfigs`) or in C3 `auto-loop.ts` and have `session-hooks.ts` reference it.

### 7.4 C4/C1 Cluster-Labeling Conflict for `tool-after-workflow.ts`

**File:** `src/hooks/transforms/tool-after-workflow.ts`

**Conflict:** The file handles workflow persistence (a C1 config concern) through an AC-20 transform hook. It dynamically imports `config/workflow/index.js` inside its handler. If the workflow config module belongs to C1, the persistence path is a C4→C1 cross-cluster dependency at runtime (dynamic import), not just at composition time.

**Impact:** The config/workflow module cannot be removed or refactored independently of C4 — the hook references it by path at runtime.

**Resolution:** Document this dependency explicitly in the config/workflow module's ownership contract.

---

## 8. Key Findings

1. **`pane-monitor.ts` has dedicated tests (2 files, 347 LOC) — contrary to the prior inventory's claim of "zero tests."** The cap test (`tests/lib/hooks/pane-monitor-cap.test.ts`) enforces the 100/session/hour rate cap with UTC top-of-hour reset; the backoff test (`tests/lib/hooks/pane-monitor-backoff.test.ts`) verifies exponential backoff (5s/10s/30s, drop on 4th failure) and `retryCount` journal field. However, the `__testing.seedCapCount` export remains a no-op stub that no test calls — the cap test works around it by firing 100 real events.

2. **The CQRS boundary is enforced entirely by the DI type system, not by the runtime classifier.** `classifyHookEffect` is called at 3 runtime sites as a documentation/tagging mechanism. `assertHookWriteBoundary` is never called at runtime — it exists only in the test file. This means the boundary is invisible to code review: any future `writeFileSync` inside a hook would not be caught.

3. **Inconsistent error handling across the 5 observer consumers is the C4 cluster's most impactful operational gap.** Three different error handling patterns exist (silent-catch, logWarn-catch, and no-catch-throw). The `delegation-consumer.ts` has no try/catch at all — if `DelegationManager` methods throw, the entire event observer chain halts. The `session-entry-consumer` and `session-main-consumer` silently swallow errors with no log trail.

4. **The C4/C1 cluster boundary conflict is unresolved.** The CLUSTER-INVENTORY-2026-06-06.md rule #3 assigns 4 C4 governance-enforcement files to C1, but this AUDIT-03 inventories them as C4 per the orchestrator's task. Resolution requires cross-cluster synchronization.

5. **`isPathAllowed` in contract-enforcement.ts has a path-traversal weakness** — both the `startsWith` and `includes` branches are vulnerable to prefix-confusion attacks. Contract allowedSurfaces enforcement is supposed to be a hard block (D-23), but the file-path check can be bypassed with paths like `/tmp/safEvil/foo.md` when the allowed surface is `/tmp/safe/`.

---

*C4 Inventory: 2026-06-06 — 47 files total (17 source, 30 test)*
