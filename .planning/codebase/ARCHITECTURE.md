# Architecture

**Analysis Date:** 2026-06-06

## System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                  OpenCode Host Process (User / TUI)                          │
└───────────────┬────────────────────────────────────────────┬───────────────┘
                │ @opencode-ai/plugin SDK calls              │ SDK event stream
                │ (client.session, client.app, etc.)         │ (event, chat.message,
                ▼                                             │ tool.execute.before/after)
┌────────────────────────────────────────────────────────────────────────────┐
│  src/plugin.ts  (HarnessControlPlane: Plugin)  — composition root            │
│  • instantiates shared deps   • wires hook factories  • registers 26 tools │
└────┬─────────┬──────────┬──────────┬───────────┬──────────┬─────────┬───────┘
     │         │          │          │           │          │         │
     ▼         ▼          ▼          ▼           ▼          ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Tools  │ │ Hooks  │ │ Coord. │ │Task-Mgmt │ │Features│ │Routing │ │Config  │
│  write │ │  read  │ │delegat.│ │continuity│ │bootstrap│ │command │ │subscrib│
│  side  │ │  side  │ │ + queue│ │+ journal │ │+ tmux   │ │-engine │ │+ workfl│
└────┬───┘ └────┬───┘ └────┬───┘ └────┬─────┘ └────┬───┘ └────┬───┘ └────┬───┘
     │          │          │          │             │          │          │
     ▼          ▼          ▼          ▼             ▼          ▼          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  src/shared/  (leaf utilities + SDK wrappers + runtime policy + CQRS types) │
│  types.ts, helpers.ts, state.ts, session-api.ts, runtime.ts, runtime-policy │
└────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  State & Persistence (CQRS — hooks never write directly)                     │
│  .hivemind/state/       (configs.json, sidecar-port.json, tmux-port.json)     │
│  .hivemind/session-tracker/<sid>/<sid>.md  (per-session knowledge capture)   │
│  .hivemind/journal/<sid>/                  (append-only event timeline)      │
│  .hivemind/state/trajectory-ledger.json    (phase trajectory ledger)         │
│  in-memory Maps in shared/state.ts (TaskStateManager, sessionOverrideMap)    │
└────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  Soft Meta-Concepts — `.opencode/` (NOT shipped as runtime; configurable)   │
│  agents/ (33 gsd-* + 31 hm-* + 11 hf-*)  commands/ (249 files)              │
│  skills/ (67 gsd-* + 36 hm-* + 13 hf-* + 6 stack-* + 3 gate-* + 2 hivemind*)│
│  workflows/, references/, gsd-core/, hooks/, templates/, plugins/            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Composition root | Wires hook factories, registers 26 tools, runs startup migrations, loads runtime policy, hydrates continuity | `src/plugin.ts` |
| Public API barrel | Re-exports continuity, queue, helpers, journal, doc-intelligence, pressure, contracts, command engine | `src/index.ts` |
| Shared leaf | Type contracts, SDK wrappers (`session-api.ts`), runtime policy, in-process state (`TaskStateManager`), error helpers | `src/shared/` |
| Coordination | Delegation state machine, dispatcher, concurrency queue (per-model/per-agent lanes), completion detector (dual-signal) | `src/coordination/` |
| Task management | Session continuity store, session lifecycle manager, journal (append-only), trajectory ledger | `src/task-management/` |
| Tools (write side) | `tool()` factory wrappers: delegation, session, hivemind, config, prompt tool entries | `src/tools/` |
| Hooks (read side) | Lifecycle, guard, observer, transform hook factories composed by the plugin | `src/hooks/` |
| Features | Standalone runtime features: bootstrap, control-plane gatekeeper, session-tracker, tmux, runtime-pressure, governance-engine, agent-work-contracts, auto/ralph-loop, doc-intelligence, sdk-supervisor, background-command PTY | `src/features/` |
| Routing | Behavioral profile resolution, command engine (primitive discovery + transform), session entry intake gate | `src/routing/` |
| Config | Config subscriber (lazy-load + cache), compiler, defaults, workflow persistence/guards | `src/config/` |
| Schema kernel | Zod schemas for all config/command/agent/tool/contract envelopes; generates `configs.schema.json` at build | `src/schema-kernel/` |
| CLI substrate | `runCli(argv)` for `bin/hivemind.cjs`; routes to `help`, `init`, `doctor`, `recover`, `version`, plus discovered commands | `src/cli/` |
| Sidecar | HTTP server factory on `127.0.0.1:0`, route catalog (state/sessions/tools/events), SSE pool, JSON-render catalog, tool proxy, WS delegation | `src/sidecar/` |

## Pattern Overview

**Overall:** Runtime composition engine with CQRS (Command-Query Responsibility Segregation) + WaiterModel delegation + dual-signal completion.

**Key Characteristics:**
- **CQRS split**: tools are the write side (exposed to the LLM via the `tool()` factory); hooks are the read side (passive observers of OpenCode SDK events). Hooks MUST NOT write files directly — `src/features/session-tracker/index.ts` is the typed owning module that all write paths flow through.
- **9-surface model**: The codebase is intentionally divided into 9 mutation surfaces (Plugin, Tools, Hooks, Coordination, Task-Management, Features, Config, Routing, Schema-Kernel) — see `src/hooks/composition/cqrs-boundary.ts` for the classifier that decides whether a hook may mutate.
- **WaiterModel delegation**: `delegate-task` returns a delegation ID immediately (true-fire-and-forget) rather than blocking until completion; progress is delivered via a notification router + periodic notifier, completion is detected via dual signals (native completion event + terminal status).
- **Composition root with thin wiring**: `src/plugin.ts` (1076 LOC) imports 90+ modules and wires them; all real logic lives in hook factory modules under `src/hooks/` and tool implementations under `src/tools/`.
- **Session stacking (PREFERRED)**: New work attaches to existing sessions via `stackOnSessionId`/`task_id` rather than spawning fresh — preserves full context from completed/failed/aborted/cancelled/active sessions.
- **Dependency injection per surface**: Hook factories and tool factories receive a `deps` bag (stateManager, lifecycleManager, runtimePolicy, hivemindConfig, projectRoot, sessionTracker) so unit tests can swap individual surfaces.
- **Schema-first contracts**: Every config, tool arg, command, agent frontmatter is a Zod schema in `src/schema-kernel/`. `npm run build` runs `generate-config-json-schema.js` to emit `.hivemind/configs.schema.json` for cross-language validation.
- **Two-halves project layout**: Hard Harness (`src/`) ships as the npm package; Soft Meta-Concepts (`.opencode/`) are runtime-configurable. Internal state (`.hivemind/`) is canonically separate from `.opencode/`.

## Layers

**Plugin Composition Layer:**
- Purpose: Single entry point exposed to the OpenCode host — registers tools, hooks, config, and runtime policy.
- Contains: `HarnessControlPlane: Plugin` factory, four domain tool-registration functions (`registerDelegationTools`, `registerSessionTools`, `registerHivemindTools`, `registerConfigTools`).
- Location: `src/plugin.ts` (also re-exported as default from `src/index.ts`)
- Depends on: every layer below (wires the full dependency graph).
- Used by: `bin/hivemind.cjs` is unrelated to plugin loading — plugin loads via `.opencode/plugins/harness-control-plane.ts` (a thin wrapper re-exporting `dist/plugin.js`).

**Tool Layer (Write Side):**
- Purpose: Expose 26 typed LLM-callable tools via the OpenCode `tool()` factory. Each tool validates input with Zod and returns the standard envelope (`{ ok, data | error }`).
- Contains: `src/tools/delegation/`, `src/tools/session/`, `src/tools/hivemind/`, `src/tools/config/`, `src/tools/prompt/`, plus standalone `src/tools/tmux-copilot.ts` and `src/tools/tmux-state-query.ts`.
- Depends on: Coordination, Task-Management, Features (SessionTracker, Tmux, RuntimePressure, AgentWorkContracts), Config.
- Used by: `src/plugin.ts` → spread into the `tool:` record of the `Plugin` return value.

**Hook Layer (Read Side):**
- Purpose: Passively observe OpenCode SDK events (`event`, `chat.message`, `tool.execute.before`, `tool.execute.after`, `system.transform` / `experimental.chat.system.transform`, `shell.env`) and translate them into side effects on the shared state.
- Contains: lifecycle factories (`core-hooks.ts`, `session-hooks.ts`), guards (`tool-guard-hooks.ts`, `governance-block.ts`), observers (event-observers, delegation/session/session-tracker consumers), transforms (chat-message-capture, tool-after-composer, tool-before-guard, contract-enforcement, tool-after-workflow), composition (`cqrs-boundary.ts`).
- Depends on: Task-Management (lifecycle, continuity), Coordination (monitor, state machine), Features (SessionTracker, RuntimePressure, GovernanceEngine, ToolIntelligence), Shared.
- Used by: `src/plugin.ts` → spread into the hook-named fields of the `Plugin` return value.

**Coordination Layer:**
- Purpose: Own delegation semantics — concurrency limits, lifecycle state machine, dual-signal completion detection, notification routing, monitor escalation, slot management, agent resolution, dispatcher preflight, command/SDK delegation handlers, auto-loop / ralph-loop spawners.
- Contains: `delegation/` (manager facade + 18 supporting modules), `concurrency/queue.ts` (per-model/per-agent lanes with `acquire/release` + timeout), `completion/detector.ts` (dual-signal WaiterModel), `command-delegation/handler.ts`, `sdk-delegation/handler.ts`, `spawner/` (auto-loop, ralph-loop, session-creator, parent-directory).
- Depends on: Shared (SDK wrappers, types, state), Features (Tmux, SessionTracker), Task-Management.
- Used by: Tools (delegate-task, delegation-status, run-background-command, execute-slash-command, governance-session), Hooks (delegation observer consumer), Plugin composition.

**Task-Management Layer:**
- Purpose: Persistence and event timeline. Continuity = durable per-session JSON store; journal = append-only event timeline; trajectory = phase trajectory ledger; lifecycle = state machine for delegation.
- Contains: `continuity/` (store, cache, reader, persistence), `journal/` (index, query, replay, execution-lineage), `lifecycle/index.ts` (`HarnessLifecycleManager`), `trajectory/` (index, ledger, store-operations).
- Depends on: Shared, Coordination.
- Used by: Tools (session-continuity, session-journal-export, hivemind-trajectory, session-tracker), Hooks (core-hooks hydrate continuity on init), Plugin (init-time `hydrateFromContinuity`), Sidecar (state extension).

**Features Layer:**
- Purpose: Standalone runtime features that don't fit the coordination/task-management spine. Each subdirectory is self-contained with its own index.ts and types.ts.
- Contains: `bootstrap/` (primitive-loader, primitive-registry, framework-detector, runtime-validator, control-plane gatekeeper), `session-tracker/` (CQRS read-side observer → SessionTracker → persistence; largest feature, 16+ submodules), `tmux/` (integration, multiplexer, observers, persistence, session-manager, types), `runtime-pressure/` (authority-matrix, control-plane, model), `agent-work-contracts/` (store, bounds, lifecycle, operations), `governance-engine/` (config-reader, evaluator, create-governance-session), `governance/` (persistence), `auto-loop/`, `ralph-loop/`, `doc-intelligence/` (chunker, parser, router), `prompt-packet/`, `background-command/pty/` (bun-pty optional dep with node:child_process fallback), `sdk-supervisor/`, `capability-gate/`, `tool-intelligence/`.
- Depends on: Shared, Coordination (some), Task-Management (session-tracker reads continuity).
- Used by: Tools, Hooks, Plugin composition.

**Routing Layer:**
- Purpose: Classify user intent and resolve routing decisions. The command engine is a primitive-discovery + transform layer used by tools and the control plane. Behavioral profile + session entry gate determine the per-session L0/L1 orchestrator target.
- Contains: `behavioral-profile/` (resolve, profiles, types), `command-engine/` (discover, analyze, transform, render_context, list_commands), `session-entry/` (intake-gate, language-resolution, profile-resolver, purpose-classifier).
- Depends on: Shared, Schema-Kernel, Features (primitive-loader, runtime-pressure).
- Used by: Tools (hivemind-command-engine), Hooks (session-entry observer), Plugin (behavioral profile resolution).

**Config Layer:**
- Purpose: Load, cache, compile, and validate Hivemind configs. Workflow subdirectory handles turn-order enforcement for multi-turn workflows.
- Contains: `subscriber.ts` (lazy-load + cache per project), `compiler.ts`, `defaults.ts`, `workflow/` (index, guards, persistence, state, types).
- Depends on: Schema-Kernel, Shared.
- Used by: Plugin, Tools, Hooks (via `deps.hivemindConfig` injection).

**Schema-Kernel Layer:**
- Purpose: Single source of truth for every Zod schema the project uses. Generates `configs.schema.json` at build for cross-tool validation.
- Contains: 19 schemas (hivemind-configs, agent-frontmatter, agent-work-contract, bootstrap, command-engine, command-frontmatter, commands, config-precedence, doc-intelligence, mcp-server, prompt-enhance, runtime-pressure, sdk-supervisor, session-delegation-query, session-tracker, session-view, skill-metadata, tool, trajectory) + `generate-config-json-schema.ts` + `index.ts` barrel.
- Depends on: Zod, Shared (deepMerge helper).
- Used by: Everything that parses runtime data (config, command frontmatter, tool args, persistence stores).

**Shared Layer:**
- Purpose: Leaf-like utilities and SDK wrappers. New code that adds deep runtime imports here must have a source-backed decision.
- Contains: `types.ts` (TaskStatus, PendingNotification, SessionStats, DelegationMeta, etc.), `helpers.ts` (`asString`, `getNestedValue`, `isObject`, `makeToolSignature`, deepMerge), `state.ts` (`TaskStateManager` singleton), `session-api.ts` (typed wrappers around `client.session.*`), `runtime.ts`, `runtime-policy.ts`, `workspace-runtime-policy.ts`, `session-naming.ts`, `task-status.ts`, `tool-helpers.ts`, `tool-response.ts` (standard `{ ok, data | error }` envelope), `plugin-tool-output-summary.ts`, `app-api.ts`, `errors/commands.ts`, `security/path-scope.ts` (`assertPathWithinRoot`), `security/redaction.ts`.
- Depends on: Node built-ins, Zod (rarely), `@opencode-ai/sdk` types only.
- Used by: Every other layer.

**CLI Substrate Layer:**
- Purpose: Optional `hivemind` binary that exposes `help`, `init`, `doctor`, `recover`, `version` and any discovered command bundles. Independent from the OpenCode plugin runtime.
- Contains: `src/cli/index.ts` (`runCli`), `src/cli/commands/`, `src/cli/router.ts`, `src/cli/renderer.ts`, `src/cli/discovery.ts`, `src/cli/ui/prompts.ts`.
- Depends on: Routing, Schema-Kernel.
- Used by: `bin/hivemind.cjs` (CommonJS shim forwarding to `dist/cli/index.js`).

**Sidecar Layer:**
- Purpose: Lightweight HTTP server on `127.0.0.1:0` (random OS-assigned port) that exposes read-only state + tool proxy + SSE for the (future) Next.js dashboard. Port is published to `.hivemind/state/sidecar-port.json` for discovery.
- Contains: `src/sidecar/server/factory.ts` (createSidecarServer), `handler.ts` (SidecarRouter + Route), `registry.ts` (SidecarDependencyRegistry), `cache.ts`, `routes/{state,sessions,tools,events,catalog,types}.ts`, `sse/pool.ts` (SseConnectionPool), `ws/{pool,delegation,types.d}.ts`, `tool-proxy/{router,handlers}/`, `catalog/{tool,json-render}-catalog.{json,ts}`, `readonly-state.ts`, `readonly-state-extensions.ts`, `types.ts`.
- Depends on: Shared, Tools (proxy), Session-Tracker.
- Used by: Plugin composition (started at `HarnessControlPlane` init, fire-and-forget with warning on failure).

## Data Flow

### Primary Plugin Init Flow

1. OpenCode host loads `dist/plugin.js` via `.opencode/plugins/harness-control-plane.ts`.
2. The `HarnessControlPlane: Plugin` async factory is invoked with `{ client, directory }` (`src/plugin.ts:465`).
3. Project root = `directory ?? process.cwd()`. Startup diagnostic logged via `client?.app?.log?.` (line 469).
4. Runtime policy loaded from disk via `loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))` (line 478).
5. Hivemind config lazy-cached via `getConfig(projectDirectory)` (line 481). PTY manager constructed via `createPtyManagerIfSupported()` (line 482, no-op fallback if `bun-pty` is absent or fails to load).
6. Tmux integration constructed via `createTmuxIntegrationIfSupported(projectDirectory, { log: buildTuiTmuxLogger(client) })` (line 502). ENABLED/DISABLED banner emitted to TUI.
7. Module-level `setSendPrompt` and `setGetSessionMessages` wired (lines 518, 553) so tmux-copilot take-over and peek can inject context and fetch activity summaries.
8. Sidecar HTTP server created via `createSidecarServer({ registry, ssePool, projectDirectory })` (line 646, fire-and-forget — failure logs warning but does not block init).
9. `SessionTracker` constructed and core dependencies hydrated (line 680, line 687). `sessionTracker.constructCoreDependencies()` runs synchronously BEFORE delegation wiring so `onChildSessionCreated` callbacks find `eventCapture` available.
10. `setupDelegationModules({ client, projectDirectory, ptyManager, runtimePolicy, tmuxIntegration, onChildSessionCreated })` (line 689) constructs the full delegation v2 graph: `DelegationStateMachine`, `SlotManager`, `AgentResolver`, `DelegationDispatcher`, `CompletionDetector`, `NotificationRouter`, `PeriodicNotifier`, `DelegationLifecycle`, `DelegationMonitor`, `DelegationCoordinator`, `DelegationManager`.
11. `HarnessLifecycleManager` constructed with `createHarnessLifecycleManager({ client, pollTimeoutMs: WATCH_TIMEOUT_MS, runtimePolicy, delegationManager })` (line 719) and `hydrateFromContinuity()` loads prior state.
12. `delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())` (line 741) closes the dual-signal wiring loop.
13. `sessionTracker.initialize()` fire-and-forget; legacy migration sentinels removed for `.hivemind/event-tracker/` (CP-ST-03) and `.hivemind/state/delegations.json + session-continuity.json` (P41-D).
14. Session-entry observer + session-is-main observer factories constructed (line 827).
15. `registerDelegationTools`, `registerSessionTools`, `registerHivemindTools`, `registerConfigTools` build the four tool-record groups; `tmuxCopilotTool` and `tmuxStateQueryTool` spread directly as pre-constructed `tool()` instances; `hivemind-steer` constructed inline.
16. Plugin returns `{ config, ...createCoreHooks(deps), ...sessionReadHooks, "tool.execute.before", "chat.message", tool: { ...4 tool groups + 2 pre-constructed + steer }, "tool.execute.after" }` (lines 907-1025).

### Primary Request Path: `delegate-task` → child session completion

1. LLM calls `delegate-task` tool (registered via `registerDelegationTools` → `createDelegateTaskTool(deps.delegationManager, deps.hivemindConfig)`, `src/tools/delegation/delegate-task.ts`).
2. Tool parses args with `DelegateTaskV2Schema` (Zod). `stackOnSessionId` takes precedence over `args.context` JSON.
3. Tool calls `coordinator.dispatch({ agent, prompt, ... })` (line 79) — coordinator is `DelegationCoordinator` (constructed in `setupDelegationModules`, `src/plugin.ts:437`).
4. `DelegationCoordinator` runs `delegationManager.dispatch` which fans out to:
   - `DelegationDispatcher.preflightCheck({ agent, currentDepth, parentSessionId, prompt, queueKey, surface, workingDirectory })` — checks `MAX_DELEGATION_DEPTH` (3), acquires a `SlotHandle` from `SlotManager` keyed by `parentSessionId + queueKey`, resolves agent via `AgentResolver`.
   - `DelegationConcurrencyQueue.acquire(queueKey, limit, timeoutMs)` (`src/coordination/concurrency/queue.ts`) — per-model/per-agent lane; if at limit, the acquire promise queues.
   - State machine transitions `created → queued → dispatching` via `DelegationLifecycle` (`src/coordination/delegation/lifecycle.ts`).
5. `sdkChildSessionStarter.start()` (or `createSdkChildSessionStarter(client)`) creates a child OpenCode session and sends the initial prompt.
6. The WaiterModel completes here — the tool returns the delegation ID immediately.
7. Child session streams events back. `chat.message` hook (`src/plugin.ts:948`) extracts `childSessionId` and `extractAssistantExcerpt`, calls `delegationManager.recordChildMessageSignal`. `tool.execute.after` records `recordChildToolSignal`.
8. `DelegationMonitor` (line 394) drives: notification routing (`progress`), `periodicNotifier.handlePollTick` every 30 s with 2 s batch window, escalation on `firstActionDeadline` (via `coordinatorRef.markExecutionUnconfirmed`).
9. `CompletionDetector.watchDualSignal(delegationId, childSessionId, callback)` waits for BOTH a native completion event AND a terminal status (e.g., `session.idle` + `stateMachine` status `completed`/`error`/`timeout`). One signal alone does NOT close the delegation.
10. Terminal callback triggers `NotificationRouter.route({ delegationId, type: "success" | "failure" | "timeout" | "cancelled", message })` which delivers to parent TUI via `sdkSendPromptAsync(client, parentSessionId, { parts: [{ type: "text", text: line }], noReply: true })` and persists pending notification for offline parents.
11. State machine transitions to terminal phase. `notifyDelegationTerminal` in `coordination/completion/notification-handler.ts` flushes any pending notification records.

### Secondary Flow: `tool.execute.before` guard

1. LLM calls any tool. OpenCode invokes the `tool.execute.before` hook.
2. `createToolBeforeGuard({ toolGuardHook, sessionTracker, contractEnforcement, logWarn })` runs.
3. `toolGuardHook(input, output)` checks: governance evaluate, tool budget, circuit breaker (per-session), session stats. On circuit-breaker trip, returns block decision to OpenCode which cancels the call.
4. `sessionTracker.handleToolExecuteBefore(input, output)` registers the pending dispatch and starts fire-and-forget polling.
5. `contractEnforcement.getActiveContractByAgent(sessionID)` looks up the active contract; if the called tool is outside the allowed surface, blocks.
6. Hook returns; OpenCode proceeds to tool execution.

### Secondary Flow: Session Tracker Event Capture

1. `createCoreHooks` returns `event` hook that walks an `eventObservers` chain (line 911 of `src/plugin.ts`).
2. Observers: `consumeDelegationFact` (delegation event observer), `sessionEventObserver` (session entry), `consumeSessionTrackerFact` (session tracker), `consumeSessionEntryFact` (intake), `consumeIsMainSessionFact` (is-main detection), `lastMessageCapture.handleEvent`, `tmuxObserver`.
3. `consumeSessionTrackerFact` (from `src/hooks/observers/session-tracker-consumer.ts`) routes into `sessionTracker.handleSessionEvent({ eventType, sessionID, event })`.
4. `SessionTracker.handleSessionEvent` (`src/features/session-tracker/index.ts`) classifies the event (`session.created`, `session.idle`, `session.error`, `session.deleted`), creates the per-session knowledge directory `.hivemind/session-tracker/{sessionID}/`, and dispatches to the appropriate capture handler (`message-capture`, `tool-capture`, `event-capture`, `last-message-capture`).
5. Capture handlers run on a debounced flush; the persistence layer (`src/features/session-tracker/persistence/session-writer.ts`) writes YAML-frontmatter markdown via atomic rename, and the session-index-writer maintains a flat index for O(1) `list()` queries.
6. CQRS boundary: `src/hooks/composition/cqrs-boundary.ts → classifyHookEffect` decides which observers may persist; everything else is a read.

### Secondary Flow: Tmux Pane Capture → Polling → Journal

1. `tmuxIntegration` is constructed and (when enabled) wires `setSessionManagerAdapter` to publish a `SessionManagerAdapter` (`src/features/tmux/integration.ts`).
2. The plugin constructs `tmuxObserver = createTmuxEventObserver(tmuxIntegration.adapter)` (line 864).
3. P58.9 wiring (line 877): `tmuxIntegration.adapter.onPaneCaptured = (event) => void tmuxObserver({ event })` — replaces the no-op so pane-captured events reach registered listeners.
4. The `SessionManager.startPolling(intervalMs)` invokes `tmux capture-pane` periodically and emits `onPaneCaptured` per hash change.
5. The `pane-monitor` hook (`src/hooks/pane-monitor.ts`, line 888) subscribes to `tmuxObserver` and writes 7-field JSON entries to `.hivemind/journal/<sid>/`. The handle is closure-captured to keep retry timers alive.
6. `tmux-copilot` and `tmux-state-query` tools (pre-constructed in `src/tools/`) read from the same pane-capture stream to power peek, take-over, release, and forward-prompt.

**State Management:**
- **Dual-layer**: Durable JSON files in `.hivemind/state/` and `.hivemind/session-tracker/{sid}/` (atomic rename via `tmpFile.${pid}.${uuid}.tmp` then `renameSync`); in-memory `Map`s in `TaskStateManager` (`src/shared/state.ts`), `sessionOverrideMap` (manual take-over flag), `configCache` (per-project Hivemind configs).
- **CQRS read-side observability**: `.hivemind/journal/{sid}/` is an append-only event timeline (time-machine), independent of the continuity store — see `src/task-management/journal/index.ts` and the `session-journal-export` tool.
- **Trajectory ledger**: `.hivemind/state/trajectory-ledger.json` records phase events for `hivemind-trajectory` tool queries.
- **Deep-clone-on-read**: All continuity reads go through `cloneStore` / `deepMerge` boundaries; no live reference is shared across module boundaries.

## Key Abstractions

**DelegationManager (Facade):**
- Purpose: Thin public facade for delegation operations. Stays a stable import surface while the heavy runtime lives in `manager-runtime.ts`.
- Examples: `src/coordination/delegation/manager.ts` (facade), `src/coordination/delegation/manager-runtime.ts` (runtime impl, registered conditionally when `client` is supplied).
- Pattern: Facade with optional `RuntimeDelegationManager` delegate; accepts narrow `Pick<>` types for coordinator/lifecycle/monitor/notificationRouter so tests can inject minimal surfaces.

**DelegationStateMachine:**
- Purpose: In-memory delegation store + terminal state-transition + timer machinery. Owns `delegations`, `delegationsBySession`, `safetyTimers`, `gracePeriodTimers`.
- Examples: `src/coordination/delegation/state-machine.ts`. Transitions: `dispatched → running | completed | error | timeout | aborted | cancelled`; terminal states are absorbing.
- Pattern: Pure data class with timer discipline (safety ceiling `DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000`).

**CompletionDetector (Dual-Signal WaiterModel):**
- Purpose: Resolve a child session as complete only when BOTH the native completion event (`session.idle`/`session.error`/`session.deleted`) AND the terminal status from the state machine arrive. Caches `error`/`deleted` results, NOT `idle` results (idle is "stable" not "terminal" until the state machine agrees).
- Examples: `src/coordination/completion/detector.ts`. Methods: `feed(eventType, sessionID, error)`, `watch(sessionID, timeoutMs) → Promise<CompletionResult>`, `watchDualSignal(delegationId, childSessionId, callback)`, `markStatusTerminal(delegationId)`.
- Pattern: Watcher map + cached-results map; one-shot timers via `clearTimeout` in `feed`.

**DelegationConcurrencyQueue (Per-Lane):**
- Purpose: Bound concurrent delegations per provider/model/agent lane. Builds the queue key from `provider:model > model > agent > "default"`. Default limit = 3 (overridable per lane; process env `OPENCODE_HARNESS_CONCURRENCY_LIMIT`).
- Examples: `src/coordination/concurrency/queue.ts`. `acquire(key, limit, timeoutMs) → Promise<() => void>` returns a release function. `timeoutMs > 0` is required to enable the per-acquire rejection path.
- Pattern: Promise queue with lane-level active count + FIFO pending list + per-acquire timeout.

**SessionTracker (CQRS Read-Side Owning Module):**
- Purpose: Owns session knowledge capture under `.hivemind/session-tracker/`. Hooks observe OpenCode events and route to this module; the module owns persistence and error handling. Never bypassed by hooks (REQ-ST-11).
- Examples: `src/features/session-tracker/index.ts` (class `SessionTracker` + barrel), 16 submodules under `capture/`, `persistence/`, `streaming/`, `transform/`, `hooks/`, `recovery/`.
- Pattern: Read-side observer (hooks) → SessionTracker → persistence layer. Constructed before delegation wiring so `onChildSessionCreated` callbacks find `eventCapture` available.

**HarnessLifecycleManager:**
- Purpose: Session lifecycle state machine — transition guards, activity tracking, event routing for delegated session lifecycle. Owns its own `CompletionDetector` instance.
- Examples: `src/task-management/lifecycle/index.ts`. Phase transitions: `created → queued → dispatching → running → completed | failed` (see `VALID_LIFECYCLE_TRANSITIONS` constant). `isTerminalPhase` and `isValidTransition` exported.
- Pattern: Constructor injection; `hydrateFromContinuity()` recovers prior state on init.

**TaskStateManager (In-Process Singleton):**
- Purpose: Encapsulates all in-process session/budget state. Also tracks the subagent registry (OMO Pattern 10).
- Examples: `src/shared/state.ts`. Five internal `Map`s: `rootBudgets`, `sessionToRoot`, `sessionStats`, `sessionDelegationMeta`, `subagentSessions`. Methods: `ensureStats`, `reserveDescendant`, `getDelegationMeta`, `setDelegationMeta`, `getStats`, `resetStats`, `addWarning`.
- Pattern: Singleton (`export const taskState = new TaskStateManager()`); `getDelegationMeta` is the hot path for runtime-policy resolution per session.

**ToolResponse Envelope:**
- Purpose: Standard `{ ok, data | error }` response shape for every LLM-facing tool.
- Examples: `src/shared/tool-response.ts` (`success`, `error` factories), `src/shared/tool-helpers.ts` (`renderToolResult`).
- Pattern: Tagged-union; consumers use `if (response.ok) ...` discrimination.

**Plugin Module (Plugin shape):**
- Purpose: The `Plugin` interface from `@opencode-ai/plugin` — `async ({ client, directory }) => { config, hook1, hook2, tool: { ... } }`.
- Examples: `src/plugin.ts:465` exports `HarnessControlPlane` as a `Plugin`. The returned object spreads `createCoreHooks(deps)`, session-read-hooks, `tool.execute.before`, `chat.message`, `tool: { ...4 groups + 2 pre-constructed + steer }`, `tool.execute.after`.
- Pattern: Composition root with explicit lifecycle (sync wiring → fire-and-forget async init → final hook wiring).

**OpenCodeClient (SDK Wrapper Type):**
- Purpose: Type alias `ReturnType<typeof createOpencodeClient>` for the injected SDK client. The wrapper layer (`src/shared/session-api.ts`) provides typed `createSession`, `getSession`, `getSessionMessages`, `sendPrompt`, `sendPromptAsync`, `appendTuiPrompt`, `abortSession`, `getSessionMessageCount`.
- Examples: `src/shared/session-api.ts`. Session IDs must start with `ses` (test seam allows `child-*`/`parent-*` in `NODE_ENV === "test"`).
- Pattern: Thin typed wrappers that normalize SDK shape variants (`info.role` vs top-level `role`) — see Zod schemas in `coordinator.ts` `sdkMessageSchema`.

## Entry Points

**Plugin Entry (Hivemind runtime):**
- Location: `src/plugin.ts` (compiled to `dist/plugin.js`), re-exported as default from `src/index.ts`.
- Triggers: OpenCode host loads the plugin via `.opencode/plugins/harness-control-plane.ts` (a thin wrapper re-exporting `dist/plugin.js`).
- Responsibilities: Construct shared dependencies, wire hook factories, register 26 tools, run startup migrations, hydrate continuity, publish tmux port + sidecar port, emit init banners to TUI.

**CLI Entry (`hivemind` binary):**
- Location: `bin/hivemind.cjs` (CommonJS shim) → `dist/cli/index.js` (compiled ESM) → `runCli(argv)`.
- Triggers: User runs `hivemind <command>` or `npx hivemind <command>`.
- Responsibilities: Forward argv into `runCli`, propagate exit code, surface a `[Harness]`-prefixed message on startup failure (exit code 70 = `EX_SOFTWARE`).

**Tool Entry (per tool):**
- Location: `src/tools/{delegation,session,hivemind,config,prompt,tmux-copilot,tmux-state-query}/`.
- Triggers: OpenCode host invokes the tool via the `tool()` factory (registered in `src/plugin.ts`).
- Responsibilities: Validate input with Zod, call the appropriate Coordination/Task-Management/Features function, return the standard envelope via `renderToolResult`.

**Hook Entry (per hook):**
- Location: `src/hooks/{lifecycle,guards,observers,transforms,composition,pane-monitor}.ts` (factories).
- Triggers: OpenCode host invokes the hook on the corresponding event (`event`, `chat.message`, `tool.execute.before`, `tool.execute.after`, `system.transform` / `experimental.chat.system.transform`, `shell.env`).
- Responsibilities: Translate the SDK event into side effects on shared state, never persist files directly (CQRS REQ-ST-11).

**Library Entry (consumers of the npm package):**
- Location: `src/index.ts` re-exports the public API: continuity, queue, helpers, journal, doc-intelligence, pressure, contracts, command engine, runtime policy, SDK supervisor, primitive registry, control plane.
- Triggers: `import { ... } from "hivemind"` (per `package.json` exports `.` and `./plugin` and `./cli`).
- Responsibilities: Provide a stable public surface that does NOT require consumers to know the internal layer split.

## Error Handling

**Strategy:** Three-layer — `[Harness]`-prefixed thrown Errors → per-layer try/catch with structured logging → fire-and-forget recovery at the boundary. Plugin init is non-blocking: sidecar start failure, tmux integration absence, session-tracker init failure, recovery interruption, AND one-shot migration failures all log a warning but never crash the plugin.

**Patterns:**

- **Validation errors at the tool boundary**: Every tool entry parses input with a Zod schema and returns `renderToolResult(error("[Harness] Invalid <tool> input: ${z.prettifyError(parsed.error)}"))` (see `src/tools/delegation/delegate-task.ts:48`).
- **Disabled-by-config graceful error**: `delegate-task` checks `config.delegation_systems?.delegate_task === false` and returns `error("[Harness] delegate-task is disabled by config ...")` instead of throwing — the tool stays callable but signals unavailability.
- **SDK error shape normalization**: `extractSdkErrorMessage` in `src/shared/helpers.ts` walks all known SDK error shapes (Named errors, `BadRequestError` arrays, fallback to error name) before stringifying — JSON.stringify on complex error objects produces unreadable long strings, so manual extraction is preferred.
- **Session ID validation**: `assertValidSessionID` in `src/shared/session-api.ts:31` rejects non-`ses`-prefixed IDs at the boundary; test seam allows `child-*` / `parent-*` only when `NODE_ENV === "test"`.
- **Per-acquire timeout in the concurrency queue**: `DelegationConcurrencyQueue.acquire` with `timeoutMs > 0` registers a `setTimeout` that removes the pending entry and rejects with `[Harness] Concurrency acquire timed out for key "${key}" after ${timeoutMs}ms` (line 87 of `src/coordination/concurrency/queue.ts`).
- **Circuit breaker**: `CIRCUIT_BREAKER_THRESHOLD` (defined in `src/plugin.ts`; per AGENTS.md) + `MAX_TOOL_CALLS_PER_SESSION` enforced by `src/hooks/guards/tool-guard-hooks.ts` in `tool.execute.before` — block decision returned to OpenCode.
- **Tool budget**: `MAX_TOOL_CALLS_PER_SESSION` enforced at the same guard.
- **Notification retry**: `PendingNotification` has `retryCount < maxRetries` (default 3) gate; persistence layer (`src/features/agent-work-contracts/store.ts`) uses `tmpFile.${pid}.${uuid}.tmp` then `renameSync` for atomic writes.
- **Path security**: `assertPathWithinRoot` in `src/shared/security/path-scope.ts` validates every filesystem path the persistence layer writes to; `redaction.ts` covers log output.
- **Init-time migration safety**: Each one-shot migration writes a sentinel file in `.hivemind/state/` so subsequent plugin loads skip the work. Failure to migrate is logged but does not block init.

## Cross-Cutting Concerns

**Logging:**
- OpenCode TUI log envelope: every internal log uses `void client?.app?.log?.({ body: { service, level, message, extra } })` (e.g., `service: "hivemind"`, `service: "session-tracker"`, `service: "tmux-integration"`, `service: "pane-monitor"`, `service: "migration"`).
- TUI level mapping: `info` and `warn` → "info" (visible by default); `debug` → "debug" (hidden by default, visible in verbose); `error` → "error".
- Best-effort: every log call uses `void client?.app?.log?.(...)` so a missing or partial SDK never throws.

**Validation:**
- Zod everywhere. Schemas live in `src/schema-kernel/`. The most-used envelope is `DelegateTaskV2Schema` (`src/tools/delegation/delegate-task.ts:10`).
- `HivemindConfigs` is parsed by `HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"` (`src/schema-kernel/hivemind-configs.schema.ts:5`).
- `AgentWorkContractStoreSchema`, `ConfigStoreSchema`, `BootstrapSchema`, etc. each parse on read; corrupt files are quarantined to `.hivemind/state/quarantine/`.
- `npm run build` runs `node dist/schema-kernel/generate-config-json-schema.js` to emit `.hivemind/configs.schema.json` for cross-language validation.

**Authentication / Authorization:**
- Authorization surface = permission rules loaded from `opencode.json` and (in the future) Hivemind configs.
- `PermissionRule = { permission, pattern, action: "allow" | "ask" }` lives in `src/shared/types.ts`.
- Governance evaluation: `evaluateGovernance()` in `src/features/governance-engine/index.ts` is invoked from `tool-guard-hooks.ts` on every `tool.execute.before` and can emit warnings, escalations, or blocks.
- The runtime does not implement OpenCode user auth — that is the host's responsibility. Hivemind adds governance blocks on top.

**State Lifecycle / Hydration:**
- Continuity store: deep-clone-on-read in `src/task-management/continuity/store-cache.ts`.
- `HarnessLifecycleManager.hydrateFromContinuity()` runs on plugin init to load prior state into in-memory `TaskStateManager`.
- `sessionTracker.initialize()` is fire-and-forget — it must never block plugin init. `recoverPending()` runs asynchronously for delegation state that wasn't terminal at last shutdown.
- Manual take-over: `getManualOverrideState` / `setManualOverrideState` per session — when set, auto-injection of orchestrator notifications is suppressed (P58 G5, D-58-11).

**SDK Surface Compliance:**
- The plugin MUST use the documented `tool()` and `hook()` factories from `@opencode-ai/plugin`. The 9-surface model enforces this: `classifyHookEffect("tool.execute.before")` in `src/hooks/guards/tool-guard-hooks.ts:75` and `src/hooks/composition/cqrs-boundary.ts` is the canonical classifier.

**Dependency Rules (non-negotiable):**
- `src/shared/types.ts` is leaf-like shared contract authority; avoid adding deep runtime imports without a source-backed decision.
- `src/shared/helpers.ts`, `src/coordination/concurrency/queue.ts`, `src/coordination/completion/detector.ts` — leaf or near-leaf.
- `src/task-management/lifecycle/index.ts` is the lifecycle manager surface.
- No circular dependencies. Max module size: 500 LOC.
- `src/task-management/continuity/delegation-persistence.ts` — delegation record I/O.

---

*Architecture analysis: 2026-06-06*
*Update when major patterns change (9-surface authority, CQRS boundary, dual-signal completion, plugin composition root)*
