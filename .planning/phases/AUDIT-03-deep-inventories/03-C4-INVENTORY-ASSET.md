# C4 Cluster Inventory: Hooks [AUDIT-03 - Deep Inventory]

**Cluster:** C4 — Hooks (OpenCode SDK event observers, transforms, lifecycle, composition, pane monitor)
**Analysis Date:** 2026-06-06
**Inventory Base:** `src/hooks/` (17 source files) and `tests/hooks/` (28 test files)

---

## 1. Cluster Overview

C4 is the hooks layer that bridges the OpenCode SDK runtime to the Hivemind harness. Every interaction an LLM agent takes with OpenCode (event firing, system-prompt transformation, tool execution, chat message, environment setup) passes through one of the C4 factories. The cluster is responsible for:
- Routing SDK events to the lifecycle manager and event observers.
- Composing response-shaping, guard-decision, and observation transforms in a CQRS-compliant way.
- Enforcing per-session runtime policy: tool-call budgets, circuit-breaker on repeated tool signatures, governance rules, and contract allowedSurfaces.
- Persisting pane-captured tmux events to a per-session journal with exponential backoff.
- Building the governance / language / behavioral / agent-profile system-prompt block that frames every LLM turn.

The cluster is invoked by exactly one orchestrator: `src/plugin.ts` (composition root). 14 distinct `create*` factories from C4 are imported by `plugin.ts` and instantiated during plugin load (per `CONCERNS.md:347` — 60+ module imports).

The cluster's distinguishing architectural property is **CQRS separation via the `classifyHookEffect()` classifier**: every hook effect is tagged as `observation`, `response-shaping`, `guard-decision`, or `durable-write`. Hook contexts are explicitly forbidden from durable writes (`assertHookWriteBoundary` throws) — all durability must be routed through C2's session-tracker.

**Total Files Scanned:** 17 source files + 28 test files = **45 files**

| Sub-Group | Source Files | Test Files | Total |
|-----------|--------------|------------|-------|
| Types | 1 | 1 | 2 |
| Composition (CQRS) | 1 | 1 | 2 |
| Lifecycle | 2 | 3 | 5 |
| Observers | 5 | 5 | 10 |
| Transforms | 5 | 4 | 9 |
| Guards | 2 | 1 | 3 |
| Pane Monitor | 1 | 0 | 1 |
| Other test files (smoke/top-level) | — | 13 | 13 |
| **Total** | **17** | **28** | **45** |

---

## 2. Sub-Groupings

C4 naturally divides into 7 sub-groupings (matching the on-disk directory layout):

| # | Sub-Group | Directory | Purpose |
|---|-----------|-----------|---------|
| 1 | **Types** | `src/hooks/types.ts` | `HookDependencies` bundle — the single dependency contract injected into every hook factory. Defines `AutoLoopConfig` + `ParentAutoLoopConfig`. |
| 2 | **Composition (CQRS)** | `src/hooks/composition/cqrs-boundary.ts` | `classifyHookEffect()` / `assertHookWriteBoundary()` — the CQRS classifier that forbids durable writes from hook contexts. |
| 3 | **Lifecycle** | `src/hooks/lifecycle/` | `createCoreHooks` (event + system.transform + shell.env) and `createSessionHooks` (event auto-loop + experimental.session.compacting). |
| 4 | **Observers** | `src/hooks/observers/` | Pure read-side SDK event → fact extraction. Five consumers wrap the three observer factories. |
| 5 | **Transforms** | `src/hooks/transforms/` | Response-shaping + chat capture + tool before/after pipelines. Includes contract enforcement and workflow persistence. |
| 6 | **Guards** | `src/hooks/guards/` | Hard enforcement — `createToolGuardHooks` (budget + circuit-breaker + governance + tool-intelligence + document-language) and `buildGovernanceBlock` (system-prompt governance block). |
| 7 | **Pane Monitor** | `src/hooks/pane-monitor.ts` | Standalone observer for P52 tmux `pane-captured` events with backoff + rate cap. |

### Design Patterns Used

- **Factory (Constructor with DI)** — Every hook is a `create*Factory(deps)` function that returns a closure-captured handler. All 14 factories follow this pattern, enabling test-time stubbing via dependency mocking (e.g., `vi.fn<[input: ...], Promise<void>>()`).
- **CQRS Boundary** — `classifyHookEffect()` is the gatekeeper. Hooks tagged `response-shaping` or `guard-decision` can read but never write. `assertHookWriteBoundary()` throws on attempt.
- **Best-Effort / Silent-Fallback (D-04 contract)** — Every consumer wraps its body in `try { ... } catch {}` (silent) or `try { ... } catch (err) { logWarn?.(...) }` (logged). The hook layer **never** throws to the OpenCode runtime.
- **Closure-Captured State** — `createSessionHooks` keeps `autoLoopStates: Map<string, AutoLoopState>` in closure. `createPaneMonitorHook` keeps `pendingRetries: Map<number, RetryContext>` in closure.
- **Backoff Retry** — `pane-monitor.ts` uses `BACKOFF_SCHEDULE_MS = [5_000, 10_000, 30_000]` with `MAX_RETRIES = 3`. D-53-05.
- **Rate Capping** — `pane-monitor.ts` enforces `RATE_LIMIT_PER_HOUR = 100` per session per UTC hour (top-of-hour reset). D-53-06, T-53-03.
- **In-Memory Cache with Edge-Case Default** — `createSessionIsMainObserver` defaults `isMainSession` to `true` for uncached sessions to avoid blocking language injection. D-01, D-04 (session-hooks).
- **Three-Step Tool-Before Chain** — `createToolBeforeGuard` chains: (1) tool guard, (2) session-tracker child discovery, (3) optional contract enforcement. Per Plan 06.

---

## 3. File Inventory

### 3.1 Types — `src/hooks/types.ts`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `types.ts` | `HookDependencies` interface — single dependency bundle. Defines `AutoLoopConfig`, `ParentAutoLoopConfig`. Imports `HarnessLifecycleManager`, `OpenCodeClient`, `TaskStateManager`, `AutoLoopOptions/Result`, `RalphLoopOptions/Result`, `IntakeResult`, `HivemindConfigs`, `ResolvedBehavioralProfile`. | Types | C2 lifecycle, C1 session-api/state, C3 spawner/auto-loop/ralph-loop, C1 routing/intake, C1 schema-kernel, C1 routing/behavioral-profile | 66 LOC. `AutoLoopConfig` + `ParentAutoLoopConfig` are **exported but never imported externally** (verified: zero `from ".*hooks/types"` hits outside `src/hooks/`). The runtime reads `deps.autoLoopConfig?.maxIterations` etc. directly — the named types are effectively dead exports. |

### 3.2 Composition (CQRS) — `src/hooks/composition/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `cqrs-boundary.ts` | `classifyHookEffect(hook)` returns `{ hook, kind, durableWriteAllowed: false }`. `assertHookWriteBoundary({hook, operation})` throws when `operation === "durable-write"`. | CQRS Boundary | None (leaf module) | 36 LOC. Clean leaf — but `HookEffectKind`, `HookOperation`, `HookEffectClassification` exports are **never imported externally** (only the two functions are). Could be marked `internal`. Test `tests/hooks/hook-cqrs-boundary.test.ts` is thin (20 LOC) — only 3 test cases. |

### 3.3 Lifecycle — `src/hooks/lifecycle/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `core-hooks.ts` | `createCoreHooks(deps)` returns `{ event, "system.transform", "experimental.chat.system.transform", "shell.env" }`. The `event` hook routes to `lifecycleManager.handleEvent` + `replayPendingNotificationsForEvent` + iterates `eventObservers`. The `system.transform` hook injects: language block (position 0), governance block, intake context, behavioral profile, dynamic agent profile from `.opencode/agents/{name}.md`. `shell.env` sets `CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1`, `TERM=dumb`. | Lifecycle | C2 lifecycle, C1 shared helpers, C1 session-api, C4 cqrs-boundary, C4 governance-block, C1 bootstrap (loadPrimitive), C2 continuity, C1 state | 277 LOC. Returns BOTH `system.transform` (back-compat) and `experimental.chat.system.transform` (the actual OpenCode SDK hook name). Both routes share `handleSystemTransform()` — so deprecation risk if OpenCode ever removes the back-compat name. `resolveAgentNameForSession` (L197-230) has a 3-step fallback chain (stateManager.getDelegationMeta → continuity → main session "hm-l0-orchestrator"). |
| `session-hooks.ts` | `createSessionHooks(deps)` returns `{ event, "experimental.session.compacting" }`. The `event` hook drives auto-loop retries on `session.idle` for sessions with `delegationPacket`. Terminal events (`session.deleted`, `session.error`) permanently disable auto-loop. Ratchets into `runRalphLoop` on `failed` outcome. The `compacting` hook serializes lifecycle + auto-loop state + continuity + intake compaction packet into `output.context`. | Lifecycle | C2 continuity, C2 continuity-reader, C1 helpers, C1 session-api, C5 prompt-packet/compaction-preservation + kernel-packet, C4 types | 423 LOC. Largest hook file. `DEFAULT_AUTO_LOOP_CONFIG.completionSignal = "<promise>DONE</promise>"` is a magic string encoded in `lifecycleManager` auto-loop + session-hooks — duplicated risk (grep for the string returned 1 hit here). `experimental.session.compacting` input has type `sessionID?: unknown` (L24) — `unknown` instead of `string` is loose. |

### 3.4 Observers — `src/hooks/observers/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `event-observers.ts` | Three pure observer factories: `createDelegationEventObserver()` (returns DelegationEventFact: idle/error/deleted/ignored), `createSessionEntryEventObserver(projectDirectory)` (intake cache + getIntake lookup), `createSessionIsMainObserver()` (isMain cache with true default for uncached). | Observer Factories | C1 helpers, C1 session-api, C1 routing/session-entry/intake-gate | 136 LOC. **In-memory caches that are never invalidated** — `intakeCache` and `mainSessionCache` only grow. The `isMainSession` default-to-true (L132) is documented but represents a timing-edge-case implicit coupling with `system.transform`. |
| `session-entry-consumer.ts` | `createSessionEntryConsumer(observer)` — pass-through wrapper. Catches all errors silently. | Observer Consumer | C4 event-observers (`SessionEntryEventFact` type) | 22 LOC. **Silently swallows errors** (`catch {}` empty block, L20). No log path. |
| `session-main-consumer.ts` | `createSessionMainConsumer(observer)` — pass-through wrapper for is-main-session observer. Catches all errors silently. | Observer Consumer | None (no type-only imports) | 20 LOC. Same silent-catch pattern as `session-entry-consumer.ts`. |
| `delegation-consumer.ts` | `createDelegationConsumer(deps)` — routes `DelegationEventFact` to `handleSessionIdle`/`handleSessionError?`/`handleSessionDeleted` (DelegationManager methods). | Observer Consumer | C4 event-observers (`DelegationEventFact` type) | 41 LOC. **Does NOT catch errors** — any throw from `handleSessionIdle`/etc. propagates to the runtime. Inconsistent with the other 4 consumers which all catch. |
| `session-tracker-consumer.ts` | `createSessionTrackerConsumer(deps)` — extracts `eventType` + `sessionID` and calls `sessionTracker.handleSessionEvent`. Logs via `logWarn` on failure. | Observer Consumer | C1 session-api (`getEventSessionID`), C2 session-tracker | 41 LOC. Catches + logs. Type-assertion chain `as Record<string, unknown> | undefined` (L31) for `event` is loose. |

### 3.5 Transforms — `src/hooks/transforms/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `chat-message-capture.ts` | `createChatMessageCapture(deps)` — delegates `chat.message` hook to `sessionTracker.handleChatMessage`. AC-19 mirror of plugin.ts:238-254. | Transform | C2 session-tracker | 39 LOC. Uses `Pick<SessionTracker, "handleChatMessage">` for narrow surface — clean. |
| `tool-after-composer.ts` | `createToolExecuteAfterHook(deps)` — composes tool guard's after hook with `summarizeOutput`, then projects a `ToolAfterProjectionFact` (kind: "tool-execute-after" | "ignored"). Returns the fact to OpenCode. | Transform | C1 helpers (`asString`, `getNestedValue`) | 71 LOC. The `ToolAfterProjectionFact` type is **never imported externally** (only within this file). The function returns a structured fact rather than mutating the output — true response-shaping pattern. |
| `tool-after-workflow.ts` | `createToolAfterWorkflow(deps)` — for `configure-primitive` tool calls, dynamically imports `config/workflow/index.js` and advances the workflow turn. AC-20 mirror of plugin.ts:301-317. | Transform | C1 config/workflow (dynamic import inside try/catch) | 54 LOC. **The `logWarn` dep is unused** (L9) — dead parameter. The dynamic import (`await import("../../config/workflow/index.js")`, L41) is wrapped in `try {} catch {}` — best-effort persistence never throws. `_deps` is prefixed underscore (L33) — convention signal that nothing in the bag is consumed. |
| `contract-enforcement.ts` | `createContractEnforcementHook(deps)` — `tool.execute.before` enforcement: extracts file paths from `write`/`edit` tools, looks up active contract, throws on `allowedSurfaces` violation. D-06/D-07/D-08/D-23/D-26. | Transform | C1 schema-kernel (path.resolve), C2 agent-work-contracts/types | 103 LOC. **The `isPathAllowed()` check is broken** (L97-102): `normalized.startsWith(normalizedSurface) || normalized.includes(surface)` is path-traversal-vulnerable. If `allowedSurfaces = ["/tmp/safe"]` and an attacker writes `/tmp/safEvil/foo.md`, `normalized.startsWith("/tmp/safe")` returns false but `normalized.includes("/tmp/safe")` returns false too — but if `allowedSurfaces = [".hivemind/"]` (relative prefix), then ANY path containing the substring matches. This is a known false-positive risk. |
| `tool-before-guard.ts` | `createToolBeforeGuard(deps)` — chains 3 steps: (1) tool guard, (2) session-tracker child discovery (task/delegate-task only), (3) optional contract enforcement. Re-throws `[Harness] contract violation` errors. AC-18 mirror of plugin.ts:194-235. | Transform | C2 agent-work-contracts/types, C4 contract-enforcement | 103 LOC. The contract-enforcement throw-rethrow pattern (L96-99) is the only `try { ... } catch` that intentionally re-throws — this is the **one** exception to the D-04 silent-fallback contract. |

### 3.6 Guards — `src/hooks/guards/`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `tool-guard-hooks.ts` | `createToolGuardHooks(deps)` returns `{ "tool.execute.before", "tool.execute.after" }`. The before-hook enforces: budget (maxToolCallsPerSession), circuit-breaker (repeatedSignatureThreshold), tool intelligence engine (P44-04), governance rules, and document-language reminder (D-11/D-12). The after-hook injects `_harness` metadata (rootSessionID, delegationDepth, governance warnings, tool-intelligence decision, continuity snapshot). | Guard | C2 continuity, C2 continuity-reader, C1 helpers, C1 runtime-policy, C1 shared types, C2 lifecycle, C1 schema-kernel, C1 state, C4 cqrs-boundary, C1 governance-engine, C5 tool-intelligence | 296 LOC. **The `escalations: any[]` field at L63 is the only `any` in the entire C4 cluster** — strict typing elsewhere. `lastGovResult` is a closure-local Map keyed by sessionID — leak risk if many concurrent sessions never get `lastGovResult.delete(sessionID)` (L241). L92 mutates `args` via `argsObj!["_languageReminder"] = ...` (line 193 in tool-guard-hooks) — this is a non-null assertion on an already-typed `Record<string, unknown>` for the side-effect. |
| `governance-block.ts` | `buildGovernanceBlock(config, profile?)` — pure function that assembles the `--- Governance ---` system-prompt block. Combines mode instruction + expertise instruction + language instruction + optional field:value context + P25.5 trajectory/contract tool instructions. | Guard | C1 schema-kernel, C1 routing/behavioral-profile/types | 123 LOC. Two `Record<string, string>` lookup tables: `MODE_INSTRUCTIONS` (3 entries) and `EXPERTISE_INSTRUCTIONS` (5 entries). If a config value doesn't match, falls back to hardcoded defaults (`"You are operating in expert-advisor mode."`, `"Communicate at intermediate-high level."`). The trajectory instructions (L49-58) are baked in — they reference `.opencode/rules/universal-rules.md` and `hm-l2-test-driven-execution/SKILL.md`-style paths but with no actual file linking. |

### 3.7 Pane Monitor — `src/hooks/pane-monitor.ts`

| File | Purpose | Sub-Group | Cross-Cutting Deps | Flaws/Notes |
|------|---------|-----------|-------------------|-------------|
| `pane-monitor.ts` | `createPaneMonitorHook(opts)` returns `{ dispose, counters, __waitForPendingRetries }`. Subscribes to P52 `TmuxEventObserver.onPaneCaptured`. Per-event: (1) path-traversal guard on sessionId, (2) rate-cap (100/hr), (3) exponential backoff (5s/10s/30s, max 3 retries), (4) exclusive `flag: "wx"` journal write. Phase 53 + P58.9 added sibling `*-pane-content.txt` file. | Pane Monitor | C3 features/tmux/observers (`PaneCapturedEvent`, `TmuxEventObserver`) | 542 LOC. **Largest single file in C4** (8% over the 500-LOC cap). `__testing.seedCapCount` (L499-507) is a **no-op stub** that explicitly does nothing — documented in JSDoc as "intentional no-op by design" but is dead code that future maintainers will mistake for a real seam. 7-field `JournalEntry` shape is locked by CONTEXT — `schemaVersion: 1` (number not string), `retryCount` is the 7th field. |

---

## 4. Test File Inventory

All 28 test files under `tests/hooks/`. LOC listed for non-trivial files.

| Test File | LOC | Coverage |
|-----------|-----|----------|
| `tests/hooks/governance-evaluator.test.ts` | 293 | Governance evaluation rules (C1 governance-engine integration) |
| `tests/hooks/continuity.test.ts` | 32 | Continuity integration in hooks (minimal smoke) |
| `tests/hooks/task-management.test.ts` | 46 | Task-management surface in hooks (smoke) |
| `tests/hooks/auth.test.ts` | 124 | Auth-related hook paths |
| `tests/hooks/governance-integration.test.ts` | 298 | End-to-end governance + hook integration |
| `tests/hooks/types.test.ts` | 22 | HookDependencies type test |
| `tests/hooks/contract-enforcement.test.ts` | 166 | contract-enforcement.ts |
| `tests/hooks/completion.test.ts` | 32 | Completion-detector integration in hooks |
| `tests/hooks/plugin-event-observers.test.ts` | 30 | Plugin-level event observer wiring |
| `tests/hooks/governance-block.test.ts` | 175 | buildGovernanceBlock |
| `tests/hooks/create-core-hooks.test.ts` | 1118 | createCoreHooks (largest test file in C4) |
| `tests/hooks/hook-cqrs-boundary.test.ts` | 20 | cqrs-boundary (3 cases only) |
| `tests/hooks/tool-after-composer.test.ts` | 32 | tool-after-composer.ts |
| `tests/hooks/session.test.ts` | 84 | Session-level hook integration |
| `tests/hooks/delegation.test.ts` | 102 | Delegation-event consumer / observer |
| `tests/hooks/tools.test.ts` | 91 | Tool-guard integration |
| `tests/hooks/session-tracker.test.ts` | 87 | Session-tracker consumer |
| `tests/hooks/create-session-hooks.test.ts` | 452 | createSessionHooks |
| `tests/hooks/create-tool-guard-hooks.test.ts` | 497 | createToolGuardHooks |
| `tests/hooks/transforms/chat-message-capture.test.ts` | 47 | chat-message-capture |
| `tests/hooks/transforms/tool-before-guard.test.ts` | 92 | tool-before-guard |
| `tests/hooks/transforms/tool-after-workflow.test.ts` | 83 | tool-after-workflow |
| `tests/hooks/observers/event-observers.test.ts` | 102 | event-observers factories |
| `tests/hooks/observers/session-tracker-consumer.test.ts` | 76 | session-tracker-consumer |
| `tests/hooks/observers/session-entry-consumer.test.ts` | 36 | session-entry-consumer |
| `tests/hooks/observers/session-main-consumer.test.ts` | 35 | session-main-consumer |
| `tests/hooks/observers/delegation-consumer.test.ts` | 58 | delegation-consumer |
| `tests/hooks/guards/tool-guard-hooks.capability.test.ts` | 155 | Tool-guard capability tests |
| **Total LOC** | **4281** | |

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
| `contract-enforcement.ts` | `schema-kernel` (path.resolve from `node:path` only) |

### C4 → C2 (Session & Task Management Runtime)

| C4 Module | C2 Target |
|-----------|-----------|
| `types.ts` | `task-management/lifecycle/index` (`HarnessLifecycleManager`) |
| `core-hooks.ts` | `task-management/continuity/index` (`getSessionContinuity`) |
| `session-hooks.ts` | `task-management/continuity/index`, `task-management/continuity/continuity-reader` |
| `tool-guard-hooks.ts` | `task-management/continuity/index`, `task-management/continuity/continuity-reader`, `task-management/lifecycle/index` |
| `chat-message-capture.ts` | `features/session-tracker/index` (`SessionTracker.handleChatMessage`) |
| `session-tracker-consumer.ts` | `features/session-tracker/index` (`SessionTracker.handleSessionEvent`) |
| `tool-before-guard.ts` | `features/session-tracker/index` (sessionTracker.handleToolExecuteBefore via plugin.ts) |
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

### C4 External Importers (every consumer is in C8 `plugin.ts`)

| Consumer | Symbols Used |
|---------|--------------|
| `src/plugin.ts:32-53` | All 14 `create*` factories + `buildGovernanceBlock` + `classifyHookEffect` + `assertHookWriteBoundary` |
| `src/features/tmux/persistence.ts:223` | JSDoc-only reference to `createPaneMonitorHook(opts)` shape |
| `tests/plugins/plugin-lifecycle.test.ts:17-18` | `createCoreHooks`, `createSessionHooks` |

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
| `createPaneMonitorHook` (pane-monitor.ts) | (no internal C4 deps — only C3) |

---

## 6. Gaps & Flaws

### 6.1 Unused Type Exports (Dead Code)

**Files:** `src/hooks/types.ts:10, 16`, `src/hooks/composition/cqrs-boundary.ts:1-8`

**Issue:** `AutoLoopConfig`, `ParentAutoLoopConfig`, `HookEffectKind`, `HookOperation`, `HookEffectClassification` are all `export`ed but **zero** external imports reference them. (Verified by `grep -rn` for each symbol across the entire `src/` tree outside `src/hooks/`.)

**Impact:** Zero runtime cost, but documentation drift. The types exist to describe a contract that the runtime reads via `deps.autoLoopConfig?.maxIterations` directly, not via the named type.

**Fix:** Either (a) make the types `internal` (drop `export`), or (b) start using them in `plugin.ts` to lock the contract.

### 6.2 `__testing.seedCapCount` No-Op Stub

**File:** `src/hooks/pane-monitor.ts:499-507`

**Issue:** The exported `__testing.seedCapCount(countersRef, count)` function has an empty body. The JSDoc admits "No-op by design — see D-53-07 in-memory implementation rationale." Yet the export remains in the production code, inviting future maintainers to wire tests against a function that does nothing.

**Impact:** Trap for test contributors. The cap test in `tests/hooks/` is missing because of this design choice (no public seam to seed cap count without firing 100 real events).

**Fix:** Remove the export entirely, or expose a real `__seedCap` seam by lifting the closure.

### 6.3 Unused `logWarn` Parameter

**File:** `src/hooks/transforms/tool-after-workflow.ts:9, 33`

**Issue:** `ToolAfterWorkflowDeps` declares `logWarn?: (message: string, error: unknown) => void` and the factory destructures it as `_deps` (L33) but the function body never calls it. Every other transform receives a `logWarn` and uses it. This is inconsistent with the other transforms' best-effort-with-log pattern.

**Impact:** Silent failures (e.g., `advanceTurn` throws) are silently swallowed by `catch {}` (L50) — but the dep was clearly intended to log. The JSDoc says "Best-effort — errors are caught silently" (L26) which is the documentation, but the *type* still requires the parameter.

**Fix:** Either call `deps.logWarn?.(...)` in the `catch` or drop the parameter from the type.

### 6.4 Path Traversal Vulnerability in `isPathAllowed`

**File:** `src/hooks/transforms/contract-enforcement.ts:97-102`

**Issue:** The implementation:
```typescript
return allowedSurfaces.some((surface) => {
  const normalizedSurface = resolve(surface)
  return normalized.startsWith(normalizedSurface) || normalized.includes(surface)
})
```

The `|| normalized.includes(surface)` fallback is the failure mode. If an agent config sets `allowedSurfaces = [".hivemind/"]` (a relative path), the `includes` check will match ANY absolute path containing that substring. The startsWith check is correct, but the OR-fallback is a path-injection hole.

**Impact:** Medium. Contract enforcement is intended to be a hard block (D-23) — if the path check is bypassable by an attacker crafting a path with the right substring, the contract becomes advisory. The issue is exacerbated because `resolve(surface)` only normalizes absolute surfaces — relative surfaces stay relative and never become a prefix of an absolute path.

**Fix:** Drop the `|| normalized.includes(surface)` branch. Only use the `startsWith` check, and `path.relative()` to ensure the result doesn't start with `..`.

### 6.5 `delegation-consumer.ts` Inconsistent Error Handling

**File:** `src/hooks/observers/delegation-consumer.ts:26-40`

**Issue:** All 4 other consumers wrap their body in `try { ... } catch { /* log */ }`. This file does NOT — any throw from `handleSessionIdle`/`handleSessionError`/`handleSessionDeleted` propagates to the OpenCode runtime. The D-04 silent-fallback contract is violated in exactly one place.

**Impact:** If `DelegationManager.handleSessionIdle` throws (e.g., on a missing session record), the entire session observer chain halts.

**Fix:** Wrap the body in `try { ... } catch (err) { deps.logWarn?.(...) }` to match the other consumers.

### 6.6 `tool-guard-hooks.ts` `lastGovResult` Memory Leak

**File:** `src/hooks/guards/tool-guard-hooks.ts:63, 241`

**Issue:** `lastGovResult: Map<string, { warnings, escalations, blocks }>` is populated on every `tool.execute.before` (L160) and deleted on every `tool.execute.after` (L241). If a session's `after` event is dropped (e.g., due to OpenCode runtime filter), the entry leaks. Over a long session with many tools, the map grows unbounded.

**Impact:** Slow memory growth on misbehaving sessions. Not catastrophic but unbounded.

**Fix:** Add a TTL or LRU eviction (e.g., evict entries older than 5 minutes), or scope to `WeakRef` keyed by sessionID.

### 6.7 `tool-guard-hooks.ts` Single `any` Type

**File:** `src/hooks/guards/tool-guard-hooks.ts:63`

**Issue:** `escalations: any[]` is the only `any` in the C4 cluster. Everything else is strictly typed. The type for `govResult.escalations` from `evaluateGovernance` is exported as `any[]` from the C1 governance-engine.

**Impact:** Loss of type-safety on escalation objects propagated to `output.metadata._harness.governance.escalations`.

**Fix:** Tighten the type to `Escalation[]` once C1 governance-engine exposes a proper type.

### 6.8 `event-observers.ts` Unbounded In-Memory Caches

**File:** `src/hooks/observers/event-observers.ts:61 (intakeCache), 108 (mainSessionCache)`

**Issue:** Both caches are `Map<string, T>` that are only ever inserted, never evicted. For a long-running OpenCode instance serving thousands of sessions, both grow unbounded.

**Impact:** Memory pressure on the OpenCode host process. `intakeCache` is bounded only by the number of unique sessionIDs ever seen. `mainSessionCache` is the same.

**Fix:** Add a TTL (e.g., 1 hour) with a periodic sweep, or use the existing C2 session-tracker storage.

### 6.9 Inconsistent Silent-Catch Pattern in Observers

**Files:** `session-entry-consumer.ts:20`, `session-main-consumer.ts:17`, `delegation-consumer.ts` (missing), `session-tracker-consumer.ts:37`

**Issue:** `session-entry-consumer` and `session-main-consumer` use `catch {}` (empty — no logging). `session-tracker-consumer` uses `catch (err) { logWarn?.(...) }`. `delegation-consumer` uses no try/catch at all.

**Impact:** Inconsistent observability. Silent failures from session-entry/main can't be debugged; tracker failures can; delegation failures break the chain.

**Fix:** Standardize on the `logWarn` pattern across all 4 consumers. The empty `catch {}` blocks should at least log.

### 6.10 `session-hooks.ts` Loose `unknown` Type

**File:** `src/hooks/lifecycle/session-hooks.ts:24`

**Issue:** `type CompactingInput = { sessionID?: unknown }`. The `sessionID` is typed as `unknown` when it should be `string | undefined`. The body then does `asString(getNestedValue(input, ["sessionID"]))` (L307) — the `asString` call is the actual type guard, so the loose `unknown` widens the input type unnecessarily.

**Impact:** Mild type-safety regression. Consumers of the hook (only OpenCode runtime) won't be able to rely on the input shape from the type.

**Fix:** Tighten to `sessionID?: string`. If OpenCode sends other shapes, narrow with a runtime guard.

### 6.11 Missing Test: `pane-monitor.ts`

**File:** `src/hooks/pane-monitor.ts` — 542 LOC, **0 dedicated test files in `tests/hooks/`**.

**Issue:** Despite being the largest single hook file (8% over LOC cap) and handling critical tmux persistence (D-53), there is no test file. The CLUSTER-INVENTORY-2026-06-06.md mentions `tests/lib/hooks/pane-monitor-cap.test.ts` (referenced in JSDoc at L493) but the file does not exist in `tests/hooks/`.

**Impact:** The pane monitor is responsible for rate-capping, backoff retry, path-traversal guarding, and content sibling writes — all untested. Any regression in this file will only be caught at integration time.

**Fix:** Create `tests/hooks/pane-monitor.test.ts` covering: rate-cap (100/hr), backoff retry (3 attempts), path-traversal guard (`hasUnsafeSessionIdChars`), exclusive-create (`flag: "wx"`) rejection, dispose cleanup, sibling content write.

### 6.12 `tool-after-composer.ts` `ToolAfterProjectionFact` Unused

**File:** `src/hooks/transforms/tool-after-composer.ts:3-17`

**Issue:** The `ToolAfterProjectionFact` type is exported via the function return type but is never imported by any other file (verified by `grep`). The runtime just returns a value; the consumer (OpenCode via plugin.ts:1004) discards the structured fact and doesn't forward it anywhere.

**Impact:** Dead type. Either an unreleased feature or a design oversight.

**Fix:** Either drop the type or wire it into the session-tracker journey log.

### 6.13 `core-hooks.ts` Dual `system.transform` Return Shape

**File:** `src/hooks/lifecycle/core-hooks.ts:34-39, 249-261`

**Issue:** Returns BOTH `system.transform` (legacy) and `experimental.chat.system.transform` (actual). The JSDoc says (L9-12): "BOOT-09 note: The OpenCode plugin SDK hook name is `experimental.chat.system.transform` (NOT `system.transform`). Both are returned for backward compatibility with tests, but only `experimental.chat.system.transform` is dispatched by the OpenCode runtime."

**Impact:** OpenCode runtime will silently ignore `system.transform`. If a future OpenCode release removes the legacy name entirely, the harness will still work (because the new name is present). If OpenCode ever decides to dispatch BOTH (e.g., due to a bug), the handler will run twice per turn. The deprecation is implicit, not enforced.

**Fix:** Drop the legacy key explicitly when all tests are updated, or add a one-shot warning if the legacy key is invoked.

### 6.14 CQRS Boundary Classifier is Bypassable

**File:** `src/hooks/composition/cqrs-boundary.ts:16-24`

**Issue:** `classifyHookEffect(hook)` only knows 4 hook names: `messages.transform`, `shell.env`, `tool.execute.after` (response-shaping), `tool.execute.before` (guard-decision). Everything else is classified as `observation`. But `assertHookWriteBoundary` is **only called at module entry** — and looking at the C4 code, **nothing actually calls `assertHookWriteBoundary()` at runtime** outside the test file. The function is purely advisory; the boundary is enforced by the factories' DI shape (e.g., `createChatMessageCapture` only receives `Pick<SessionTracker, "handleChatMessage">`).

**Impact:** The boundary relies on the **type system**, not the runtime function. If a future developer adds a `writeFile` call inside a hook without realizing it's CQRS-illegal, `assertHookWriteBoundary` would not catch it.

**Fix:** Either (a) call `assertHookWriteBoundary` in every hook factory's body as a runtime assertion, or (b) rename `assertHookWriteBoundary` to `assertHookWriteBoundary_NOT_USED` and document the DI-enforced approach.

### 6.15 `delegation-consumer.ts` Inconsistent Surface (no try/catch vs others)

(See 6.5 — same item, listed under gaps because it's a missing test/error-handle pattern, not a "design alternative".)

### 6.16 `createCoreHooks` `eventObservers` Iteration Order

**File:** `src/hooks/lifecycle/core-hooks.ts:53, 244-246`

**Issue:** `const eventObservers = deps.eventObservers ?? []` is iterated in array order (L244-246). The 4 consumer factories (`sessionEntryConsumer`, `sessionMainConsumer`, `delegationConsumer`, `sessionTrackerConsumer`) are all created in `plugin.ts` in the same order they appear in `deps.eventObservers`. The order is thus plugin-defined. If two observers both touch the same session state (e.g., delegation and tracker both consume the same `session.idle` event), the order matters but is not enforced.

**Impact:** Hidden ordering coupling. If a future maintainer rearranges the array, behavior changes silently.

**Fix:** Document the order, or use a tagged-union observer set with explicit phases.

---

## 7. Conflicts

### 7.1 C4 Cluster Boundary Conflict (Governance Guards)

**Source:** `.planning/codebase/CLUSTER-INVENTORY-2026-06-06.md:27, 47, 80-88`

**Conflict:** CLUSTER-INVENTORY-2026-06-06.md states (rule #3): "Governance guards → C1: Hooks whose PURPOSE is governance enforcement (tool-guard-hooks, governance-block, tool-before-guard, contract-enforcement) belong to C1, not C4. C4 is for pure read-side observers only."

But the current orchestration treats all 17 `src/hooks/` files as C4. This AUDIT-03 task explicitly inventories `tool-guard-hooks.ts`, `governance-block.ts`, `tool-before-guard.ts`, and `contract-enforcement.ts` as C4.

**Impact:** Documents disagree. The CLUSTER-INVENTORY was finalized 2026-06-06, AUDIT-03 was started 2026-06-06. Resolution pending.

**Resolution:** This AUDIT-03 inventory covers all 17 files as C4 (per the orchestrator's task scope). The CLUSTER-INVENTORY rule #3 should be treated as authoritative for future re-organization but is not binding for this audit.

### 7.2 `system.transform` Naming Conflict

**File:** `src/hooks/lifecycle/core-hooks.ts:36, 256-260`

**Conflict:** Two different hook names map to the same handler. The hook is dispatched only by `experimental.chat.system.transform` (per BOOT-09), but the `system.transform` key remains for test back-compat (per the JSDoc at L9-12).

**Impact:** Confusion about which name to wire in `plugin.ts`. Currently `plugin.ts:909` spreads BOTH via `...createCoreHooks(...)`.

**Resolution:** Document the legacy key explicitly. Consider adding a `// DEPRECATED: remove after test migration` comment.

### 7.3 Auto-Loop Completion Signal Duplication

**Files:** `src/hooks/lifecycle/session-hooks.ts:37`, `src/coordination/spawner/auto-loop.ts` (referenced via type import)

**Conflict:** `DEFAULT_AUTO_LOOP_CONFIG.completionSignal = "<promise>DONE</promise>"` is hardcoded in `session-hooks.ts`. The `runAutoLoop` from C3 may use a different default or accept overrides.

**Impact:** If C3's `AutoLoopOptions.completionSignal` changes, the session-hooks default drifts. The string is a magic value passed between two clusters.

**Resolution:** Centralize the default in C1 schema-kernel (`HivemindConfigs`) or in C3 `auto-loop.ts` and have `session-hooks.ts` read from there.

---

## 8. Key Findings

1. **C4 is the only cluster where the CQRS boundary is enforced entirely by the type system.** `classifyHookEffect` and `assertHookWriteBoundary` exist but `assertHookWriteBoundary` is never called at runtime outside the test file. The actual enforcement is structural: hook factories receive narrowed `Pick<>` interfaces. This works but is invisible to code review without tracing every factory's deps.

2. **`pane-monitor.ts` is the largest single file (542 LOC) and has zero dedicated tests.** The cap test referenced in the JSDoc (`tests/lib/hooks/pane-monitor-cap.test.ts`) does not exist. The `__testing.seedCapCount` export is an explicit no-op. This is the highest-risk unverified surface in C4.

3. **5+ silent-catch error handlers with no logging** (`session-entry-consumer.ts:20`, `session-main-consumer.ts:17`, `delegation-consumer.ts` missing entirely, `tool-after-workflow.ts:50`, `pane-monitor.ts` writes). The D-04 silent-fallback contract is honored (no throws leak), but failures are invisible. Combined with the consistent `console.warn` pattern in C2, C4 is the least-observable cluster.

4. **The C4/C1 boundary is documented to be split** in `CLUSTER-INVENTORY-2026-06-06.md` (rule #3), but this AUDIT-03 inventory treats all 17 `src/hooks/` files as C4 per the orchestrator's task. The 4 governance-enforcement files (`tool-guard-hooks.ts`, `governance-block.ts`, `tool-before-guard.ts`, `contract-enforcement.ts`) are inventoried as C4 here, with the boundary conflict documented in §7.1.

5. **The plugin composition root is the single consumer of C4** — `src/plugin.ts:32-53` imports 14 `create*` factories, `buildGovernanceBlock`, `classifyHookEffect`, and `assertHookWriteBoundary`. The `tests/plugins/plugin-lifecycle.test.ts` is the only external test consumer. This tight coupling means any change to C4's exported surface ripples directly into `plugin.ts` and one test file.

---

*C4 Inventory: 2026-06-06 — 45 files total (17 source, 28 test)*
