# C3 Cluster Inventory: Delegation + Coordination + Intelligence

**Analysis Date:** 2026-06-06
**Phase:** AUDIT-03 (Deep Inventory)
**Cluster:** C3 — Delegation, Coordination, Intelligence (runtime orchestration)

---

## Cluster Overview

C3 is the delegation and coordination backbone of the Hivemind harness. It owns child session creation, lifecycle management, dual-signal completion detection, concurrency control, slot management, notification routing, session stacking intelligence, auto-loop/ralph-loop orchestration, command delegation (PTY/headless), and the tmux visual orchestration layer. It also encompasses runtime pressure management, capability gates, and background command execution.

C3 is the largest and most structurally complex cluster due to its three-phase evolution history (phases 14-24 for delegation, phases 42-59 for tmux, phases 16-28 for features).

**Total Files Scanned:** 33 coordination modules + 24 feature modules + 15 tools + ~60 test files = **~132 files**

---

## Sub-Groupings

| # | Sub-Group | Files | LOC Range | Purpose |
|---|-----------|-------|-----------|---------|
| 1 | **Delegation Core (Types + Managers)** | 5 | 50-600 | Core delegation types, manager facade, runtime implementation, coordinator |
| 2 | **Delegation State Machine** | 1 | 445 | In-memory store + transition validation + safety ceiling + pruning |
| 3 | **Delegation Dispatcher** | 1 | 63 | Concurrency + depth + agent preflight checks |
| 4 | **Delegation Lifecycle** | 1 | 94 | Thin adapter over state machine for lifecycle consumers |
| 5 | **Delegation Monitor** | 1 | 248 | Progressive polling, failure checkpoint detection, status injection |
| 6 | **Delegation Pool Types** | 1 | 126 | Frozen JSON-serializable delegation pool snapshot contract |
| 7 | **Agent Resolution** | 1 | 58 | Agent registry lookup + validation |
| 8 | **Slot Management** | 1 | 107 | Per-session + per-key concurrency slot enforcement |
| 9 | **Session Initiation** | 2 | 71+43 | SDK child session starter + session creator for spawned sessions |
| 10 | **Session Intelligence** | 1 | 280 | Stacking recommendations, session discovery, find-stackable |
| 11 | **Resume + Retry** | 2 | 132+50 | Session resume strategy + persistence retry with backoff |
| 12 | **Survival Kit** | 1 | 129 | Compact context injection for compaction resilience |
| 13 | **Notification System** | 4 | 40-200 | Formatters, router, periodic notifier, notification handler |
| 14 | **Failure Detection** | 2 | 86+273 | Escalation timer + semantic completion detector |
| 15 | **Spawner** | 7 | 9-190 | Session creation, primitive policy, parent directory, auto/ralph-loop primitives |
| 16 | **Completion Detection** | 2 | 252+426 | Event-driven completion detector + parent notification handler |
| 17 | **Concurrency Queue** | 1 | 300 | Per-model/provider/agent queue with priority lanes |
| 18 | **Command Delegation** | 1 | 416 | PTY + headless command process lifecycle |
| 19 | **SDK Delegation** | 1 | 324 | SDK polling + stability logic for child sessions |
| 20 | **Tmux Integration** | 7 | 40-606 | Grid planner, session manager, multiplexer, observers, persistence |
| 21 | **Runtime Pressure** | 5 | 40-332 | Pressure classification, authority matrix, control plane |
| 22 | **Capability Gate** | 3 | 43-98 | Tool capability mapping, agent profiles |
| 23 | **Auto-Loop** | 2 | 24-42 | Sequential delegation loop engine |
| 24 | **Ralph-Loop** | 2 | 24-38 | Multi-agent round-robin delegation engine |
| 25 | **Background Command (PTY)** | 5 | 30-145 | PTY buffer, manager, runtime, type declarations |
| 26 | **Delegation Tools** | 3 | 25-906 | delegate-task, delegation-status, types |
| 27 | **Session Tools (C3-owned)** | 3 | 40-863 | execute-slash-command, dispatch-command, semantic-agent-selector |
| 28 | **Hivemind Tools (C3-owned)** | 7 | 40-228 | trajectory, pressure, session-view, agent-work, steer, sdk-supervisor, run-background-command |
| 29 | **Tmux Tools** | 2 | 40-596 | tmux-copilot, tmux-state-query |

---

## Per-Module Inventory

### 1. Delegation Core — `src/coordination/delegation/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `types.ts` | 260 | Canonical delegation types: DelegationStatus, Delegation interface, DelegationSurface, DelegationRecoveryGuarantee, DelegationTerminalKind, polling cadence, failure checkpoint thresholds | None internal; consumed by every C3 module |
| `manager.ts` | 587 | **DelegationManager facade** — composes coordinator, lifecycle, monitor, notification router, state machine, PTY manager, session manager. Primary public surface for delegation orchestration | C2: `shared/session-api`, `shared/types`, `shared/runtime-policy`; C4: `config/subscriber`; C5: `session-tracker/streaming`, `session-tracker/tool-delegation`; tmux/persistence |
| `manager-runtime.ts` | 616 | **DelegationManager runtime** — actual dispatch logic including dual-mode dispatch (SDK + command), queue resolution, session spawning, primitive enrichment | C1: `shared/app-api`, `shared/session-api`, `shared/types`, `shared/runtime-policy`; C5: `session-tracker/streaming/child-event-stream`; C4: `config/subscriber`; C4: `continuity/delegation-persistence` |
| `coordinator.ts` | 746 | **DelegationCoordinator** — largest file in C3. Owns child session lifecycle (dispatch → monitor → complete), dual-signal handling, event routing, abort/cancel, slot management integration. Contains inline SDK message type definitions | C1: `shared/session-api`, `shared/state`; C5: `session-tracker/streaming/child-event-stream`, `tmux/observers`; C4: `continuity/state` |
| `pool-types.ts` | 126 | Frozen DelegationPool snapshot contract with schema versioning. Used by tmux-copilot, SC-01 SSE pool, SC-04/SC-05 dashboards. Deep-frozen via `Object.freeze` | `types.ts` only |

**Design Patterns:** Facade (manager.ts composes all sub-modules), Strategy (dual-mode SDK vs command dispatch), Observer (state machine → event routing)

### 2. Delegation State Machine — `state-machine.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `state-machine.ts` | 445 | **DelegationStateMachine** — in-memory delegation store with `transition()`, `transitionToTerminal()`, safety ceiling timer (30 min), grace period cleanup, pruning (max-age + max-count). Pure helpers: `canTransitionDelegationStatus`, `deriveDelegationSurface`, `deriveRecoveryGuarantee`, `buildDelegationResult` | C4: `continuity/delegation-persistence`; C1: `shared/types`, `shared/session-api` |

**Design Patterns:** State Machine (explicit VALID_DELEGATION_TRANSITIONS table), Store (in-memory Maps with periodic persistence)

### 3. Delegation Dispatcher — `dispatcher.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `dispatcher.ts` | 63 | Preflight checks before native Task execution: concurrency slot acquisition, depth limit validation, agent resolution | C1: `shared/types`; `slot-manager.ts`; `agent-resolver.ts`; `spawn-request-builder.ts` |

**Design Patterns:** Chain of Responsibility (preflight steps executed in sequence)

### 4. Delegation Lifecycle — `lifecycle.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `lifecycle.ts` | 94 | Thin lifecycle adapter over DelegationStateMachine transitions. Provides `register()`, `getStatus()`, `list()`, `childSessionId()` | `types.ts`, `state-machine.ts` |

**Design Patterns:** Adapter (thin wrapper over state machine)

### 5. Delegation Monitor — `monitor.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `monitor.ts` | 248 | Progressive polling (30→45→60→90→120→180s), failure checkpoint detection at 60/120/180/300s, thin-line status injection into parent session, first-action deadline tracking, auto-abort | `types.ts`, `completion-detector.ts`, `escalation-timer.ts`, `notification-formatter.ts` |

**Design Patterns:** Observer (polling → status injection → parent notification)

### 6. Agent Resolution — `agent-resolver.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `agent-resolver.ts` | 58 | Agent registry lookup via SDK `getAppAgents()`, permission profile resolution, recursive delegation tool blocking | C1: `shared/app-api`, `shared/session-api`; `agent-primitive-policy.ts`; `spawn-request-builder.ts` |

### 7. Session Initiation (2 files)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `sdk-child-session-starter.ts` | 71 | Creates SDK child session via `createSession()`, sends prompt with permission profile and disabled recursive tools | C1: `shared/session-api`, `shared/session-naming`; `spawn-request-builder.ts` |
| `session-creator.ts` | 43 | Lower-level `spawnDelegatedSession()` - creates child session and returns ID + allowed tools | C1: `shared/session-api`, `shared/session-naming`; C1: `spawner-types.ts` |

### 8. Session Intelligence — `session-intelligence.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `session-intelligence.ts` | 280 | Read-only find-stackable/find-resumable session discovery. Builds `taskCommand`, `retryCommand`, `stackingGuidanceBanner` for front-facing agents | `types.ts` |

### 9. Resume + Retry (2 files)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `resume-resolver.ts` | 132 | Resume strategy: reuse (non-terminal) → stack-on (terminal) → fresh (absent). REQ-RC-01 | `types.ts` |
| `retry-handler.ts` | 50 | Bounded retry with exponential backoff (1s→2s→4s→8s→16s) around delegation persistence. Degraded fallback path | C4: `continuity/delegation-persistence`; `types.ts` |

### 10. Notification System (4 files)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `notification-formatter.ts` | 149 | Pure formatting functions for delegation completion notifications. Compact line, toast display, full system reminder block | `types.ts` |
| `notification-router.ts` | 201 | Routes notifications to parent sessions with retry logic, persistence of pending notifications | `types.ts`, `notification-formatter.ts` |
| `periodic-notifier.ts` | 178 | 2-second batch window, single combined `<system_reminder>` block, fire-and-forget injection | `notification-formatter.ts`; C1: `shared/session-api` |
| `notification-handler.ts` | 426 | SDK prompt delivery for terminal-state notifications. TUI toast, progress percentage computation, delegation result formatting | C1: `shared/session-api`, `shared/types`; C4: `continuity/index` |

### 11. Failure Detection + Completion (5 files)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `escalation-timer.ts` | 86 | `FailureCheckpointTracker` — checks action count at 60/120/180/300s levels, increments failure level | `types.ts` |
| `completion-detector.ts` (delegation/) | 273 | Semantic completion detection: tool activity stall detection, assistant message presence, file change detection, total tool activity duration | C1: `shared/helpers` |
| `detector.ts` (completion/) | 252 | Event-driven `CompletionDetector` class — watches for `session.idle`/`error`/`deleted` events, dual-signal completion pattern (event + stability timer), stability window (30s) | `delegation/types.ts` |
| `notification-handler.ts` (completion/) | 426 | Fire-and-forget parent notification delivery via `sendPromptAsync` + `showTuiToast`. Formats durations, progress %, result previews | C1: `shared/session-api`, `shared/types`; C4: `continuity/index` |

**Design Patterns:** Event-Driven (CompletionDetector feeds from session events), Dual-Signal (event + stability timer)

### 12. Spawner — `src/coordination/spawner/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `spawner-types.ts` | 82 | Canonical spawner contracts: `DelegationSpawnRequest`, `DelegationPermissionProfile` | C1: `pty-types.ts` |
| `spawn-request-builder.ts` | 190 | Builds SDK spawn requests, resolves delegation permission profiles from agent metadata, derives read-only/review/write-capable profile | C1: `session-naming`; `capability-gate/index` |
| `session-creator.ts` | 43 | Creates child session via SDK and returns ID | C1: `shared/session-api`, `shared/session-naming` |
| `agent-primitive-policy.ts` | 51 | Enriches SDK agent metadata with local `.opencode/agents` primitive policy (description, permission, tools) | C1: `bootstrap/primitive-loader` |
| `parent-directory.ts` | 9 | Resolves working directory for child sessions | C1: `process.cwd()` |
| `auto-loop.ts` | 146 | Phase 39 PH39-01: pure async auto-loop driver with injected dispatcher + verifier. Outcomes: completed/needs_continuation/failed. No side effects | None |
| `ralph-loop.ts` | 182 | Phase 39 PH39-02/PH39-03: validate-fix-redispatch cycle up to configurable cap (default 3). Injected validator + fixer | None |

**Design Patterns:** Dependency Injection (auto-loop, ralph-loop inject dispatcher + verifier), Strategy (permission profile based on task intent)

### 13. Concurrency Queue — `src/coordination/concurrency/queue.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `queue.ts` | 300 | Per-model/provider/agent queue with priority lanes (high/normal). Capacity limits, descendant-per-root limit, pending + queued tracked by lane | C1: `shared/state.ts`, `shared/types.ts` |

**Design Patterns:** Queue (multi-lane with priority), Bounded Resource

### 14. Command Delegation — `src/coordination/command-delegation/handler.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `handler.ts` | 416 | PTY + headless command process lifecycle. Owns command poll timers, headless process tracking, output buffering (64K cap). Dual mode: PTY (via bun-pty) + headless (via `child_process.spawn`) | C1: `shared/helpers`, `shared/types`; C1: `pty-manager.ts` |

### 15. SDK Delegation — `src/coordination/sdk-delegation/handler.ts`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `handler.ts` | 324 | SDK delegation lifecycle handler. Adaptive polling (active/base/idle/deep-idle intervals), stability detection (STABLE_POLLS_REQUIRED = 3, MIN_STABILITY_TIME_MS = 10s), result extraction (assistant text + file evidence), recovery trust model | C1: `shared/helpers`, `shared/session-api`, `shared/types`; C3: `completion/detector.ts` |

### 16. Runtime Pressure — `src/features/runtime-pressure/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `types.ts` | 156 | PressureTier (0-9), PressureBand, PressureDecisionOutcome, ToolAuthorityLevel, ToolStateSurface (4-way taxonomy) | None |
| `model.ts` | 52 | `classifyRuntimePressure()` — score/tier → band classification | `types.ts` |
| `authority-matrix.ts` | 332 | Per-tool authority matrix: 4 surface types × 4 band levels = 16 behavior entries. HIVEMIND_STATE_WRITER, OPENCODE_PRIMITIVE_WRITER, READ_ONLY_INSPECTOR, EXTERNAL_COMMAND_RUNNER | `types.ts` |
| `control-plane.ts` | 161 | `detectRuntimePressure()` — classify → resolve tool authority → derive outcome, severity, recommended action, blocking rationale | `authority-matrix.ts`, `model.ts`, `types.ts` |
| `index.ts` | 4 | Barrel re-export | All |

**Design Patterns:** Strategy (per-surface-type pressure behavior), Taxonomy (4-way state-surface classification)

### 17. Capability Gate — `src/features/capability-gate/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `types.ts` | 43 | ToolCategory (Read/Write/Delegate/Govern/Session/Config) + ToolCapabilityRecord + CapabilitySnapshot | None |
| `agent-capability-profiles.ts` | 86 | Agent capability profiles for known agents: resolveSeedProfileForAgent, resolveToolsForSeedProfile. READ_ONLY_TOOLS = 3, WRITE_CAPABLE_TOOLS = 7 | `types.ts` |
| `index.ts` | 98 | TOOL_CAPABILITY_MAP (28 entries covering all built-in + harness tools), CapabilityGate class (canExecute, filterTools, seedForAgent) | `types.ts`, `agent-capability-profiles.ts` |

### 18. Auto-Loop + Ralph-Loop — `src/features/auto-loop/`, `src/features/ralph-loop/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `auto-loop/types.ts` | 24 | AutoLoopCoordinator, AutoLoopOpts, AutoLoopResult types | C3: `delegation/types.ts` |
| `auto-loop/index.ts` | 42 | AutoLoopEngine: sequential delegations for one agent, max iteration cap, stop condition | C3: `delegation/types.ts` |
| `ralph-loop/types.ts` | 24 | RalphLoopCoordinator, RalphLoopOpts, RalphLoopResult types | C3: `delegation/types.ts` |
| `ralph-loop/index.ts` | 38 | RalphLoopEngine: round-robin delegation across agent list, per-cycle context builder | C3: `delegation/types.ts` |

**Design Patterns:** Template Method (injected coordinator + context builder)

### 19. Background Command (PTY) — `src/features/background-command/pty/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `pty-types.ts` | 110 | PtyExecutionMode ("pty"|"headless"), PtySpawnRequest, PtySessionRecord, PtyReadResult | None |
| `pty-manager.ts` | 145 | PtyManager — PTY session lifecycle (spawn, read, write, resize, terminate), exit signal extraction. Uses bun-pty `IPty` interface | `pty-buffer.ts`, `pty-types.ts` |
| `pty-buffer.ts` | 67 | Ring buffer for PTY output, max chars limit, truncation detection | None |
| `pty-runtime.ts` | ~30 | Runtime PTY session management | `pty-manager.ts` |
| `bun-pty.d.ts` | 55 | Type declarations for bun-pty optional dependency | None |

**Design Patterns:** Proxy (PTY session via bun-pty), Ring Buffer (output accumulation)

### 20. Tmux Integration — `src/features/tmux/`

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `types.ts` | 318 | Pane tree primitives (PaneTreeNode, SplitDirection), SessionManagerAdapter interface, PaneState, setSessionManagerAdapter singleton | `observers.ts` |
| `integration.ts` | 553 | Factory module: binary resolution, version detection, port persistence, server URL detection. Wires Multiplexer + SessionManager + planner. Silent null fallback | `grid-planner.ts`, `persistence.ts`, `session-manager.ts`, `tmux-multiplexer.ts`, `types.ts` |
| `tmux-multiplexer.ts` | 606 | TmuxMultiplexer — tmux command execution (send-keys, list-panes, split-window, select-pane, kill-pane, resize-pane, capture-pane). Logger, pane state caching, error handling | `types.ts` |
| `session-manager.ts` | 525 | SessionManager — tmux pane lifecycle per session. onSessionCreated → find/create layout slot, register pane. respawnIfKnown for post-restart recovery. Configurable layout modes | `observers.ts`, `tmux-multiplexer.ts`, `persistence.ts`, `types.ts` |
| `observers.ts` | 232 | ForkSessionManager interface, PaneObserver, EnrichedSessionEvent type. Wires session.created events into session manager | `tmux-multiplexer.ts`, `types.ts` |
| `persistence.ts` | 406 | SessionPersistence for `.hivemind/state/tmux-sessions.json`. PersistedSession record format, read/write/delete operations | C1: `shared/state` |
| `grid-planner.ts` | 148 | PaneGridPlanner — split grid computation for pane layout, SplitDirection, SplitCommand derivation | `types.ts` |

**Design Patterns:** Factory (createTmuxIntegration), Singleton (SessionManagerAdapter bridge), Observer (session events → pane lifecycle)

### 21. C3-Owned Tools

#### Delegation Tools (`src/tools/delegation/`)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `delegate-task.ts` | 110 | **delegate-task** tool — Zod schema v2 with agent/prompt/context/stackOnSessionId. Routes via coordinator.dispatch (Policy: P58 G1 — must not bypass coordinator) | C3: `coordination/delegation/manager`; C1: `shared/tool-helpers`, `shared/tool-response` |
| `delegation-status.ts` | 906 | **delegation-status** tool — largest tool file in C3. 8 actions (status/get/list/control/find-stackable/pool/peek/progress). Control actions: abort/cancel/restart/resume/chain/adjust-prompt/change-agent | C3: `session-intelligence`, `coordination/delegation/types`; C1: `shared/types`, `shared/security/redaction`; C4: `continuity/delegation-persistence`; C5: `session-tracker/persistence`, `session-tracker/types` |
| `types.ts` | 25 | DelegateTaskV2 input types, DelegationControlAction, DelegationStatusV2Output | C3: `coordination/delegation/types` |

#### Session Tools (`src/tools/session/`)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `execute-slash-command.ts` | 863 | **execute-slash-command** tool — command resolution + validation + agent selection + delegation dispatch. Error taxonomy (CommandNotFound, AgentNotFound, DelegationTimeout, InvalidCommand, DelegationContext). Sub-command delegation support | C1: `shared/app-api`, `shared/helpers`, `shared/session-api`, `shared/errors/commands`; C2: `schema-kernel/commands.schema`; C4: `features/governance-engine/config-reader`; C5: `session-tracker/types` |
| `dispatch-command.ts` | 118 | Agent validation (format + existence) + command dispatch via deferred setTimeout + SDK prompt injection | C1: `shared/app-api`, `shared/session-api`, `shared/errors/commands` |
| `semantic-agent-selector.ts` | 342 | Agent selection by semantic matching (word stems, synonyms), best-match scoring, fallback chain | None |

#### Hivemind Tools (`src/tools/hivemind/`)

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `hivemind-trajectory.ts` | 129 | Trajectory ledger tool: inspect/traverse/attach/checkpoint/event/close/create | C4: `task-management/trajectory/index`; C2: `schema-kernel/trajectory.schema` |
| `hivemind-pressure.ts` | ~80 | Runtime pressure tool: classify/detect/inspect_tool_catalog/attach_event | C1: `shared/tool-helpers`, `shared/tool-response`; C3: `runtime-pressure/control-plane` |
| `hivemind-session-view.ts` | ~80 | Unified session view across 3 data roots: session-tracker, delegations, trajectory | C5: `session-tracker/*` |
| `hivemind-agent-work.ts` | ~80 | Agent work contract tool: create/export contracts | C4: `task-management/*` |
| `hivemind-steer.ts` | ~80 | Steering message injection into root session | C1: `shared/session-api` |
| `hivemind-sdk-supervisor.ts` | ~80 | SDK wrapper health: health/heartbeat/diagnostics/readiness | C4: `task-management/*` |
| `run-background-command.ts` | 228 | **run-background-command** tool: run/output/input/list/terminate actions. Routes through DelegationManager | C3: `delegation/manager`; C1: `pty-manager`, `shared/types`, `shared/tool-helpers`, `config/subscriber` |

#### Tmux Tools

| File | LOC | Purpose | Cross-Cutting Dependencies |
|------|-----|---------|---------------------------|
| `tmux-copilot.ts` | 596 | **tmux-copilot** tool: send-keys/list-panes/compute-grid/respawn/take-over/release/peek. Permission-gated (orchestrator-tier + user-tier). Graceful unavailable fallback. Multiple phase references (P43, P51, P58.8) | C3: `features/tmux/types` (SessionManagerAdapter) |
| `tmux-state-query.ts` | ~60 | **tmux-state-query** tool: list-sessions/get-session/get-summary. Read-only | C3: `features/tmux/session-manager` |

---

## Cross-Cutting Dependencies

### C3 imports from C1 (Shared/State/Types)
| C1 Module | Used By |
|-----------|---------|
| `shared/types.ts` | Delegation types, queue, state-machine, command-delegation, SDK-delegation, all tools |
| `shared/session-api.ts` | Delegation manager, coordinator, SDK handler, session starter, all session tools |
| `shared/helpers.ts` | SDK delegation handler, semantic completion, delegation-status tool |
| `shared/app-api.ts` | Agent resolver, dispatch-command, execute-slash-command |
| `shared/state.ts` | Coordinator (getDelegationMeta), concurrency queue |
| `shared/runtime-policy.ts` | Manager-runtime |
| `shared/session-naming.ts` | Session creator, SDK child session starter, spawn request builder |
| `shared/tool-helpers.ts` | All C3 tools |
| `shared/tool-response.ts` | All C3 tools |
| `shared/errors/commands.ts` | Dispatch-command, execute-slash-command |
| `shared/security/redaction.ts` | Delegation-status tool |
| `shared/logger.ts` | Tmux integration |

### C3 imports from C2 (Schema + Config)
| C2 Module | Used By |
|-----------|---------|
| `schema-kernel/commands.schema.ts` | execute-slash-command |
| `schema-kernel/trajectory.schema.ts` | hivemind-trajectory |
| `config/subscriber.ts` | Manager-runtime, run-background-command |

### C3 imports from C4 (Task Management)
| C4 Module | Used By |
|-----------|---------|
| `task-management/continuity/delegation-persistence.ts` | State-machine, retry-handler, manager-runtime, delegation-status |
| `task-management/continuity/index.ts` | Notification handlers |
| `task-management/trajectory/index.ts` | hivemind-trajectory |

### C3 imports from C5 (Session Tracker)
| C5 Module | Used By |
|-----------|---------|
| `features/session-tracker/streaming/child-event-stream.ts` | Coordinator, manager-runtime |
| `features/session-tracker/tool-delegation.ts` | Delegation manager |
| `features/session-tracker/persistence/atomic-write.ts` | Delegation-status tool |
| `features/session-tracker/types.ts` | Delegation-status tool, execute-slash-command |

### C3 imports from C4 (Governance)
| C4 Module | Used By |
|-----------|---------|
| `features/governance-engine/config-reader.ts` | execute-slash-command |
| `routing/behavioral-profile/types.ts` | Manager-runtime |

**Total cross-cutting dependency edges:** ~25 distinct import paths across C1-C5

---

## Design Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| **State Machine** | `state-machine.ts` | Explicit VALID_DELEGATION_TRANSITIONS table, 7 states, 2 terminal |
| **Facade** | `manager.ts` | DelegationManager composes coordinator, lifecycle, monitor, notification router, state machine |
| **Observer** | `observers.ts`, `monitor.ts` | Session events → pane lifecycle; polling → status injection |
| **Event-Driven** | `completion/detector.ts` | Session events (idle/error/deleted) drive completion resolution |
| **Dual-Signal** | `completion/detector.ts` | Completion requires event + stability timer (30s) |
| **Factory** | `tmux/integration.ts` | Conditional construction of tmux subsystem |
| **Singleton** | `tmux/types.ts` (SessionManagerAdapter) | Module-level mutable bridge populated at plugin-init |
| **Queue** | `concurrency/queue.ts` | Multi-lane with priority, bounded capacity |
| **Chain of Responsibility** | `dispatcher.ts` | Sequential preflight checks |
| **Adapter** | `lifecycle.ts` | Thin wrapper over state machine |
| **Template Method** | `auto-loop/index.ts`, `ralph-loop/index.ts` | Injected coordinator + context builder |
| **Strategy** | `spawn-request-builder.ts` | Permission profile based on task intent |
| **Dependency Injection** | `auto-loop.ts`, `ralph-loop.ts` | Dispatcher + verifier injected |
| **Proxy** | `pty-manager.ts` | PTY session via bun-pty optional dependency |
| **Ring Buffer** | `pty-buffer.ts` | Fixed-capacity output accumulation |
| **Taxonomy** | `runtime-pressure/types.ts` | 4-way state-surface classification |
| **Store** | `state-machine.ts` | In-memory Maps with periodic persistence |

---

## Phase References

| Phase(s) | Subject | Files Affected |
|----------|---------|----------------|
| P14-P24 | Coordination/delegation phases | All `src/coordination/` files |
| P16.2 | Delegation notification re-activation | `completion/notification-handler.ts` |
| P36 PH36-03 | Max 500 LOC decomposition | `state-machine.ts` (split from `delegation-manager.ts`) |
| P36.1 | SDK polling re-wiring | `sdk-delegation/handler.ts` |
| P39 PH39-01/02/03 | Auto-loop + ralph-loop | `spawner/auto-loop.ts`, `spawner/ralph-loop.ts` |
| P42-P59 | Tmux phases | All `features/tmux/` files |
| P43 | Tmux tool design (D-43-02) | `tmux-copilot.ts` |
| P51 | Fork-bridge → in-tree migration | `features/tmux/` (types, integration) |
| P57 | Pressure taxonomy + authority matrix | `features/runtime-pressure/` |
| P58 (G1-G3) | Delegation pool, slot limits, tmux session abort | `pool-types.ts`, `slot-manager.ts`, `manager.ts` |
| P58.8 (S1-S2) | Capture-pane polling, user-tier tmux access | `manager.ts`, `tmux-copilot.ts` |
| P59 (B4) | Tool idle threshold raised 60s→300s | `completion-detector.ts` |
| CP-DT-01 | Delegation tool design | `tools/delegation/` |

---

## Conflicts, Gaps, and Flaws

### Conflicts

| # | Type | Description | Impact |
|---|------|-------------|--------|
| CF-01 | **DUAL-FILE DETECTOR** | Two `completion-detector.ts` files exist: `delegation/completion-detector.ts` (semantic completion) and `completion/detector.ts` (event-driven). Different interfaces, different consumers, same conceptual purpose | Confusion risk. The semantic detector (273 LOC) analyzes tool activity patterns; the event detector (252 LOC) watches lifecycle events. Could be merged under a unified `detector/` surface |
| CF-02 | **OVERLAPPING NOTIFICATION** | `coordination/completion/notification-handler.ts` (426 LOC) and `delegation/notification-router.ts` + `periodic-notifier.ts` both deliver notifications to parent sessions. One uses `sendPromptAsync` + toast, the other routes through DelegationManager | Two notification delivery mechanisms with similar purpose but different interfaces |
| CF-03 | **DUAL SESSION CREATION** | `spawner/session-creator.ts` (43 LOC) and `delegation/sdk-child-session-starter.ts` (71 LOC) both create child sessions via `createSession()` + `getSessionID()`. Different callers but duplicated SDK interaction logic | 43 LOC of near-identical session creation logic could be unified |
| CF-04 | **COORDINATOR BLOAT** | `coordinator.ts` at 746 LOC exceeds the project's 500 LOC max module rule. Contains inline SDK message type definitions, dispatch logic, dual-signal handling, abort/cancel orchestration | Architectural rule violation. Should be split similar to how state-machine was extracted |

### Gaps

| # | Type | Description | Severity |
|---|------|-------------|----------|
| GA-01 | **NO UNIFIED INDEX** | Unlike C1 (which has clear barrel exports), C3 has no top-level `src/coordination/index.ts` barrel file. Consumers must know exact import paths | Medium — every consumer needs to navigate deep module paths |
| GA-02 | **MISSING INTERFACE DOCUMENTATION** | Several delegation files (agent-resolver, slot-manager, escalation-timer, resume-resolver) have no JSDoc module-level descriptions | Low |
| GA-03 | **NO CONFIGURABLE SAFETY CEILING** | Safety ceiling is hardcoded at 30 min (`state-machine.ts:37`). REQ-58-01 likely needs this configurable | Low-Medium |

### Design Flaws

| # | Type | Description | Impact |
|---|------|-------------|--------|
| FL-01 | **SEPARATION OF CONCERNS** | `coordinator.ts` (746 LOC) contains both orchestration logic AND inline SDK message type definitions (lines 21-50). SDK types should be extracted to `shared/types.ts` or a dedicated module | Bloat |
| FL-02 | **CIRCULAR DEPENDENCY RISK** | `state-machine.ts` imports `delegation-persistence.ts`, which is also imported by `manager-runtime.ts` and `retry-handler.ts`. No circular dependency currently, but the persistence dependency in the state machine creates tight coupling for what should be a pure state manager | Tight coupling |
| FL-03 | **EVOLVING DETECTOR INTERFACES** | `completion/detector.ts` has `DualSignalWatcher` but `completion-detector.ts` (delegation/) has `SemanticCompletionOptions` with different default values (DEFAULT_TOOL_IDLE_MS = 300_000). Two detectors with two different completion models | Potential behavioral inconsistency |
| FL-04 | **HARDCODED TIMING CONSTANTS** | Multiple files define their own timing constants: `state-machine.ts:37` (30 min safety), `completion/completion-detector.ts:38` (30s stability), `delegation/completion-detector.ts:21` (300s idle), `delegation/types.ts` (POLLING_CADENCE), `background-command/handler.ts:35` (250ms poll) | Scattered timing configuration — no centralized timing policy |

---

## Sub-Grouping Summary

| Sub-Group | Files | LOC | Key Role |
|-----------|-------|-----|----------|
| Delegation Core | 5 | ~2,000 | Types, manager facade, runtime, coordinator |
| State Machine | 1 | 445 | In-memory store + transition validation |
| Dispatcher + Lifecycle | 2 | 157 | Preflight + lifecycle adapter |
| Monitor + Detection | 4 | 607 | Polling, failure checkpoints, semantic completion |
| Session Initiation | 2 | 114 | SDK child session creation |
| Session Intelligence | 1 | 280 | Stacking recommendations |
| Resume + Retry | 2 | 182 | Session resume + persistence retry |
| Notification | 4 | ~950 | Formatting, routing, periodic, SDK delivery |
| Spawner | 7 | ~650 | Session creation, primitive policy, auto/ralph-loop primitives |
| Concurrency | 1 | 300 | Multi-lane queue |
| SDK Delegation | 1 | 324 | Adaptive polling + stability detection |
| Command Delegation | 1 | 416 | PTY/headless process lifecycle |
| Tmux | 7 | ~2,800 | Multiplexer, session-manager, grid-planner, observers, persistence |
| Runtime Pressure | 5 | ~700 | Classification, matrix, control plane |
| Capability Gate | 3 | ~230 | Tool mapping + agent profiles |
| Auto-Loop | 2 | 66 | Sequential delegation loops |
| Ralph-Loop | 2 | 62 | Multi-agent round-robin loops |
| Background Command | 5 | ~400 | PTY buffer, manager, runtime |
| C3 Tools (all) | 15 | ~3,500 | delegate-task, delegation-status, execute-slash-command, hivemind-*, tmux tools |

**Total sub-groupings:** 19
**Total files (src only):** 72
**Total LOC (src only):** ~14,500
**Largest file:** `delegation-status.ts` (906 LOC) — tool
**Largest module:** `coordinator.ts` (746 LOC) — exceeds 500 LOC rule
**Most complex sub-system:** Tmux integration (7 files, ~2,800 LOC)
**Test coverage:** ~60 test files across tests/coordination/, tests/lib/, tests/integration/, tests/tools/, tests/features/, tests/hooks/

---

## Tool Overlap with C5 (Session Tracker)

C3 tools that overlap with or depend on C5:

| C3 Tool | C5 Dependency | Overlap Description |
|---------|---------------|---------------------|
| `delegation-status.ts` | `session-tracker/persistence/atomic-write.ts`, `session-tracker/types.ts` | Reads session-tracker data for status queries |
| `execute-slash-command.ts` | `session-tracker/types.ts` | Validates session IDs via session-tracker |
| `delegation-status.ts` | `session-tracker/persistence/`, `session-tracker/types.ts` | Reads HierarchyManifest from session-tracker |
| `coordinator.ts` | `session-tracker/streaming/child-event-stream.ts` | Consumes child event stream for dual-signal detection |
| `manager-runtime.ts` | `session-tracker/streaming/child-event-stream.ts` | Streams delegation events to session-tracker |
| `manager.ts` | `session-tracker/tool-delegation.ts` | Delegation persistence in session-tracker format |

**Overlap assessment:** The tool delegation surface (`src/tools/delegation/` — delegate-task, delegation-status) is the C3-owned tooling layer. The C5-owned tools (`src/tools/session/` — session-tracker, session-hierarchy, session-context) focus on session exploration. Both depend on `session-tracker/types.ts` and event streams. No direct duplication, but the `delegation-status` tool (906 LOC) is unusually large because it integrates both delegation status polling AND session-tracker manifest reading — a potential candidate for splitting.
