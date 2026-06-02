# Hivemind — Architecture Reference

> Generated: 2026-06-02
> Source: hm-codebase-mapper (deep analysis)

---

## 1. System Overview

Hivemind is a **runtime composition engine** for OpenCode. It is shipped as the npm package `hivemind` and loaded as an OpenCode plugin via `@opencode-ai/plugin`. It provides:

- **Multi-agent delegation** (WaiterModel with dual-signal completion)
- **Session continuity** (durable JSON persistence with in-memory Maps)
- **Concurrency control** (slot-based, keyed queues)
- **Runtime guardrails** (circuit breakers, tool budgets, governance)
- **Session knowledge capture** (tracker, journal, trajectory)
- **Prompt enhancement** (skim, analyze, compaction preservation)
- **PTY integration** (optional `bun-pty` for background commands)
- **Tmux orchestration** (optional visual layer for session management)

### Two Halves (Never Confuse)

| Half | What | Where | Lines |
|------|------|-------|-------|
| **Hard Harness** | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf), Task-Management (state), Coordination (delegation), Features (runtime), Config, Routing | `src/` | ~262 TS files |
| **Soft Meta-Concepts** | Skills, Agents, Commands, Rules, Permissions — NEVER development implementation, NEVER runtime state | `.opencode/` | ~1,225 files |
| **Internal State** | Session journals, execution lineage, runtime state, vector/graph memory — NEVER stored in `.opencode/` | `.hivemind/` | ~374 files |
| **Meta-Authoring** | Lab environment for authoring primitives before reflection to `.opencode/` | `.hivefiver-meta-builder/` | Authoring-only |
| **Governance** | Requirements, roadmaps, architecture maps, phase authorization — never runtime code | `.planning/` | ~1,920 files |

---

## 2. CQRS Model — Command Query Responsibility Segregation

The harness enforces strict CQRS separation between read-side and write-side operations.

### Read-Side (Hooks)

| Surface | Module | Authority | Classification |
|---------|--------|-----------|----------------|
| `event` | `hooks/lifecycle/core-hooks.ts` | Observe lifecycle events | Observation |
| `shell.env` | `hooks/lifecycle/core-hooks.ts` | Inject env vars | Response-shaping |
| `system.transform` | `hooks/lifecycle/core-hooks.ts` | Inject system prompt | Response-shaping |
| `experimental.chat.system.transform` | `hooks/lifecycle/core-hooks.ts` | Inject system prompt (actual SDK hook) | Response-shaping |
| `experimental.session.compacting` | `hooks/lifecycle/session-hooks.ts` | Inject compaction context | Response-shaping |
| `tool.execute.before` | `hooks/transforms/tool-before-guard.ts` | Guard/track tool execution | Guard-decision |
| `tool.execute.after` | `hooks/transforms/tool-after-composer.ts` | Capture tool metadata | Response-shaping |
| `chat.message` | `hooks/transforms/chat-message-capture.ts` | Capture messages | Observation |

**CQRS Rules (enforced by `assertHookWriteBoundary()`):**
- Hooks must NEVER perform durable writes directly (no file system mutations from hook callbacks).
- Hooks classify their effect via `classifyHookEffect()`: `observation`, `response-shaping`, or `guard-decision`.
- All hook handlers are best-effort — they catch errors internally and never throw to the OpenCode runtime.

### Write-Side (Tools)

| Surface | Tool Name | Module | Purpose |
|---------|-----------|--------|---------|
| **Delegation** | `delegate-task` | `tools/delegation/delegate-task.ts` | Dispatch subagent |
| | `delegation-status` | `tools/delegation/delegation-status.ts` | Poll/control delegation |
| | `run-background-command` | `tools/hivemind/run-background-command.ts` | PTY command execution |
| **Session** | `execute-slash-command` | `tools/session/execute-slash-command.ts` | Slash command dispatch |
| | `session-patch` | `tools/session/session-patch/` | Patch session files |
| | `session-journal-export` | `tools/session/session-journal-export.ts` | Export journal |
| | `session-tracker` | `tools/session/session-tracker.ts` | Query session tracker |
| | `session-hierarchy` | `tools/session/session-hierarchy.ts` | Session tree navigation |
| | `session-context` | `tools/session/session-context.ts` | Cross-session aggregation |
| | `session-delegation-query` | `tools/session/session-delegation-query.ts` | Delegation query |
| | `create-governance-session` | `features/governance-engine/index.ts` | Governance session |
| **Hivemind** | `hivemind-doc` | `tools/hivemind/hivemind-doc.ts` | Doc intelligence |
| | `hivemind-trajectory` | `tools/hivemind/hivemind-trajectory.ts` | Trajectory inspection |
| | `hivemind-pressure` | `tools/hivemind/hivemind-pressure.ts` | Pressure classification |
| | `hivemind-sdk-supervisor` | `tools/hivemind/hivemind-sdk-supervisor.ts` | SDK health |
| | `hivemind-command-engine` | `tools/hivemind/hivemind-command-engine.ts` | Command route preview |
| | `hivemind-session-view` | `tools/hivemind/hivemind-session-view.ts` | Unified session view |
| | `hivemind-agent-work-create` | `tools/hivemind/hivemind-agent-work.ts` | Create work contract |
| | `hivemind-agent-work-export` | `tools/hivemind/hivemind-agent-work.ts` | Export work contract |
| **Config** | `configure-primitive` | `tools/config/configure-primitive.ts` | Configure primitives |
| | `validate-restart` | `tools/config/validate-restart.ts` | Validate post-restart |
| | `bootstrap-init` | `tools/config/bootstrap-init.ts` | Bootstrap initialization |
| | `bootstrap-recover` | `tools/config/bootstrap-recover.ts` | Bootstrap recovery |
| **Prompt** | `prompt-skim` | `tools/prompt/prompt-skim/` | Fast prompt scan |
| | `prompt-analyze` | `tools/prompt/prompt-analyze/` | Deep prompt analysis |
| **Tmux** | `tmux-copilot` | `tools/tmux-copilot.ts` | Tmux pane orchestration |
| | `tmux-state-query` | `tools/tmux-state-query.ts` | Session metadata query |

---

## 3. Plugin Composition Root

**File:** `src/plugin.ts` (756 lines)

The `HarnessControlPlane` is the entry point, exported as an OpenCode plugin:

```typescript
export const HarnessControlPlane: Plugin = async ({ client, directory }) => { ... }
```

### Initialization Sequence

1. **Startup diagnostic** — Log plugin load to OpenCode app log
2. **Load runtime policy** — `loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))`
3. **Load Hivemind config** — `getConfig(projectDirectory)` (lazy-cached, never crashes)
4. **Create PTY manager** — `createPtyManagerIfSupported()` (optional, Bun-only)
5. **Create tmux integration** — `createTmuxIntegrationIfSupported(projectDirectory)` (optional)
6. **Create SessionTracker** — `new SessionTracker({ client, projectRoot })`
7. **Wire delegation modules** — `setupDelegationModules({...})` → returns {coordinator, manager, detector, lifecycle, notifier, slotManager, monitor}
8. **Construct lifecycle manager** — `createHarnessLifecycleManager({...})` → hydrates from continuity
9. **Recover pending delegations** — `delegationManager.recoverPending()` (fire-and-forget)
10. **Drain pending notifications** — `replayPendingDelegationNotifications()` (fire-and-forget)
11. **Complete dual-signal wiring** — `delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())`
12. **Initialize session tracker** — `sessionTracker.initialize()` (fire-and-forget)
13. **Run legacy migrations** — Remove event-tracker, legacy state files (fire-and-forget)
14. **Build hook factories** — Create session hooks, tool guards, event observers
15. **Register 26 custom tools** — Delegation (3) + Session (7) + Hivemind (9) + Config (6) + Tmux (2) = 27
16. **Return plugin hooks** — event, system.transform, tool.execute.before, tool.execute.after, chat.message

### Dependency Graph

```
plugin.ts (composition root)
  ├── config/subscriber.ts ──────────→ schema-kernel/hivemind-configs.schema.ts
  ├── shared/session-api.ts ─────────→ @opencode-ai/sdk
  ├── shared/state.ts ─────────────── → in-memory Maps
  ├── shared/helpers.ts, runtime-policy.ts, workspace-runtime-policy.ts
  │
  ├── task-management/lifecycle/
  │   └── index.ts ───────────────── → HarnessLifecycleManager
  │       ├── completion/detector.ts
  │       └── continuity/index.ts
  │
  ├── coordination/delegation/ ───── → setupDelegationModules()
  │   ├── coordinator.ts ─────────── → DelegationCoordinator
  │   ├── manager.ts ─────────────── → DelegationManager (facade)
  │   ├── dispatcher.ts ──────────── → DelegationDispatcher
  │   ├── lifecycle.ts ───────────── → DelegationLifecycle
  │   ├── state-machine.ts ───────── → DelegationStateMachine
  │   ├── monitor.ts ─────────────── → DelegationMonitor
  │   ├── slot-manager.ts ────────── → SlotManager
  │   ├── agent-resolver.ts ──────── → AgentResolver
  │   ├── notification-router.ts ─── → NotificationRouter
  │   ├── periodic-notifier.ts ───── → PeriodicNotifier
  │   ├── sdk-child-session-starter.ts
  │   └── types.ts ───────────────── → Delegation, DelegationStatus, etc.
  │
  ├── features/session-tracker/
  │   └── index.ts ───────────────── → SessionTracker
  │       ├── capture/
  │       ├── persistence/
  │       ├── recovery/
  │       ├── hooks/
  │       └── transform/
  │
  ├── hooks/ ─────────────────────── → Read-side factories
  │   ├── lifecycle/core-hooks.ts ─── → event, system.transform, shell.env
  │   ├── lifecycle/session-hooks.ts ─ → event (auto-loop), compacting
  │   ├── observers/event-observers.ts
  │   ├── guards/tool-guard-hooks.ts
  │   ├── transforms/
  │   │   ├── tool-before-guard.ts
  │   │   ├── tool-after-composer.ts
  │   │   ├── tool-after-workflow.ts
  │   │   ├── chat-message-capture.ts
  │   │   └── contract-enforcement.ts
  │   └── consumers/
  │       ├── delegation-consumer.ts
  │       ├── session-entry-consumer.ts
  │       ├── session-main-consumer.ts
  │       └── session-tracker-consumer.ts
  │
  ├── tools/ ─────────────────────── → Write-side entrypoints (26 factories + 2 prebuilt)
  └── features/agent-work-contracts/ → Contract store
```

---

## 4. Delegation Architecture (WaiterModel + Dual-Signal)

The delegation system implements a **WaiterModel** — background dispatch with async monitoring — and **dual-signal completion** (doer + verifier must agree).

### Delegation Subsystem Components

```
DelegationManager (facade)
  └── DelegationCoordinator (orchestrator)
      ├── DelegationDispatcher ─────── → slot-managed dispatch
      │   ├── AgentResolver ────────── → agent name → SDK resolution
      │   └── SlotManager ──────────── → concurrency slots
      │
      ├── DelegationLifecycle ──────── → state transition tracking
      │   └── DelegationStateMachine ─ → status FSM
      │       Statuses: dispatched → running → completed|error|timeout|aborted|cancelled
      │
      ├── DelegationMonitor ────────── → failure checkpoints & escalation
      │   ├── Failure levels: 0→1→2→3→4
      │   ├── 60s: L0 check
      │   ├── 120s: L1 check
      │   ├── 180s: L2 check
      │   ├── 300s: L3 check → auto-abort
      │   └── Progress injection on no-action
      │
      ├── CompletionDetector ───────── → dual-signal completion
      │   ├── SDK terminal signal (session.idle/error/deleted)
      │   ├── Stability detection (3 stable polls, 10s between)
      │   └── Message count threshold tracking
      │
      ├── NotificationRouter ───────── → route results to parent session
      ├── PeriodicNotifier ─────────── → periodic progress reports (30s cadence)
      ├── SDKChildSessionStarter ───── → create child sessions via SDK
      ├── EscalationTimer ──────────── → timeout escalation
      ├── RetryHandler ─────────────── → retry logic
      └── ResumeResolver ───────────── → resume session resolution
```

### Delegation Status Machine

```
dispatched ──→ running ──→ completed (dual-signal OK)
                │  │  │
                │  │  └───→ error (SDK error, session deleted)
                │  │
                │  └──────→ timeout (MAX runtime ceiling)
                │
                └─────────→ aborted (user or recovery failure)
                            └──→ cancelled (explicit or connection drop)
```

### Dual-Signal Completion Protocol

1. **SDK signal:** `session.idle` / `session.error` / `session.deleted` event from OpenCode runtime
2. **Stability signal:** Message count unchanged for 3 consecutive polls (10s interval each)
3. Both signals must agree on terminal state before marking as `completed`

### Concurrency Model

```
SlotManager
  ├── Global max delegation slots
  ├── Per-key concurrency limits
  ├── Queue-based acquisition with timeout
  └── MAX_DELEGATION_DEPTH = 3 (hard limit on nesting)
```

---

## 5. Hook System Architecture

Hooks are the **read-side** of the CQRS boundary. They observe OpenCode lifecycle events and inject context — they never write files directly.

### Hook Wiring (from plugin.ts)

```typescript
return {
  // Core event routing
  ...createCoreHooks({ ... }),         // event, system.transform, shell.env
  ...sessionReadHooks,                  // event (auto-loop), compacting

  // Tool execution guards
  "tool.execute.before": createToolBeforeGuard({ ... }),  // circuit breaker + budget

  // Chat message capture
  "chat.message": async (input, output) => { ... },       // session tracker + delegation

  // Tool registry (26 custom tools)
  tool: { ... },

  // Tool post-execution
  "tool.execute.after": async (input, output) => { ... }, // metadata capture + workflow
}
```

### Hook Classification (from cqrs-boundary.ts)

| Hook | Kind | Durable Write? |
|------|------|----------------|
| `messages.transform` | response-shaping | ❌ Forbidden |
| `shell.env` | response-shaping | ❌ Forbidden |
| `tool.execute.after` | response-shaping | ❌ Forbidden |
| `tool.execute.before` | guard-decision | ❌ Forbidden |
| All others | observation | ❌ Forbidden |

### Event Observer Chain

The `event` hook routes lifecycle events through a chain of observers:

```
OpenCode Event
  → core-hooks.ts: lifecycleManager.handleEvent()
  → delegation-consumer: delegation session signals
  → session-hooks: auto-loop trigger on session.idle
  → session-tracker-consumer: session knowledge capture
  → session-entry-consumer: intake classification
  → session-main-consumer: main/child session tracking
  → last-message-capture: assistant message capture
  → tmux-observer: tmux pane state sync (optional)
```

---

## 6. Session Knowledge Architecture

### Session Tracker (`features/session-tracker/`)

The session tracker owns session knowledge under `.hivemind/session-tracker/`. It is a typed owning module — not a service layer.

**Persistence Layout:**

```
.hivemind/session-tracker/
├── project-continuity.json          # Project-level index of all sessions
└── {sessionID}/
    ├── {sessionID}.md               # Main session file (frontmatter + knowledge)
    ├── session-continuity.json      # Session-local hierarchy index
    ├── hierarchy-manifest.json      # Flattened child registry (D-07)
    └── {childSessionID}.json        # Child session records
```

**Data Flow:**

```
Hook (event/chat.message/tool.execute.*)
  → SessionTracker.handleSessionEvent()
  → EventCapture (classification)
  → ToolCapture (tool metadata)
  → MessageCapture (message content)
  → Persistence layer (retry queue, atomic writes)
  → .hivemind/session-tracker/{sessionID}/
```

### Continuity Store (`task-management/continuity/`)

Dual-layer state persistence:

| Layer | Location | Type | Purpose |
|-------|----------|------|---------|
| Durable | `project-continuity.json` | Serialized JSON | Permanent session records |
| In-memory | `Map<string, SessionContinuityRecord>` | Runtime cache | Fast access during session |

**Functions:** `getSessionContinuity()`, `listSessionContinuity()`, `patchSessionContinuity()`, `recordSessionContinuity()`

### Journal (`task-management/journal/`)

Append-only event timeline for each session, independent of the continuity store. Provides session history replay and execution lineage tracking.

### Trajectory (`task-management/trajectory/`)

Execution trajectory ledger — tracks phase progression, checkpoint events, and evidence references. Used by `hivemind-trajectory` tool and `hivemind-agent-work` contract tracking.

---

## 7. Configuration Architecture

### Config Loading

```
opencode.json (repo root)
  └── schema-kernel/hivemind-configs.schema.ts
      └── config/subscriber.ts (lazy-cache)
          ├── getConfig(projectRoot) → HivemindConfigs
          ├── getFreshConfig(projectRoot) → HivemindConfigs
          └── invalidateConfigCache()
```

**Pattern:** Lazy-load + cache-per-project + fallback defaults. Missing/invalid config files return defaults (never crashes plugin init).

### Config Keys

From `hivemind-configs.schema.ts`:
- `conversation_language` — Language for agent responses
- `documents_and_artifacts_language` — Language for `.md` output
- `document_paths` — Paths for document language enforcement
- `delegation_systems` — Toggle for delegate-task tool
- Mode, workflow flags
- Behavioral profile overrides

### Schema Kernel

21 Zod schema files under `src/schema-kernel/` define validation for:
- Agent/command frontmatter, bootstrap, MCP servers
- Session tracker, session view, delegation queries
- Runtime pressure, SDK supervisor, trajectory
- Prompt enhance, doc intelligence, tool responses
- Config precedence, agent work contracts

---

## 8. Routing Architecture

### Session Entry (`routing/session-entry/`)

```
Session Created Event
  → resolveIntake(userMessage)
      ├── purpose-classifier.ts ───── → Purpose classification
      ├── language-resolution.ts ──── → Language detection
      └── profile-resolver.ts ─────── → Developer profile resolution
  → intakeCache.set(sessionId, intake)
```

### Behavioral Profile (`routing/behavioral-profile/`)

```
resolveBehavioralProfile(sessionId, projectRoot)
  → Load profile from Hivemind config
  → Merge with runtime overrides
  → Return ResolvedBehavioralProfile
    ├── guardrailLevel (strict/normal/relaxed)
    ├── delegationMode (waiter/auto)
    ├── toolAccessPattern (restricted/open)
    ├── skillFilter (curated/all)
    └── language (conversation + documents)
```

### Command Engine (`routing/command-engine/`)

```
Command string
  → executeCommandEngineAction()
  → Command route resolution
  → Bundle discovery
  → listCommands()
```

---

## 9. Key Design Patterns

### Pattern 1: Factory Functions

All hooks and tools are created via factory functions with explicit dependency injection:

```typescript
// Hook factory
export function createCoreHooks(deps: HookDependencies): CoreHooks

// Tool factory
export function createExecuteSlashCommandTool(
  client: OpenCodeClient,
  sessionTracker: SessionTracker
): ReturnType<typeof tool>
```

### Pattern 2: Domain-Specific Dependency Bundles

Plugin.ts defines narrow dependency bundles for each tool domain:

```typescript
interface DelegationToolDeps { delegationManager, hivemindConfig, ptyManager, ... }
interface SessionToolDeps { client, sessionTracker, projectDirectory }
interface HivemindToolDeps { projectDirectory }
interface ConfigToolDeps { projectDirectory }
```

### Pattern 3: Facade + Runtime Decomposition

`DelegationManager` acts as a thin facade, delegating to `RuntimeDelegationManager` (in `manager-runtime.ts`). This keeps the public API stable while the runtime moves toward the v2 coordinator.

### Pattern 4: Observer Chain with Consumer Separation

Observers extract facts from events (read-side), then consumer modules pass these facts to write-side handlers. E.g., `createDelegationEventObserver()` extracts `DelegationEventFact` → `delegation-consumer.ts` routes to `DelegationManager`.

### Pattern 5: Best-Effort Everywhere

All hook handlers and background tasks use fire-and-forget with internal try/catch. No hook callback ever throws to the OpenCode runtime. Fallback to defaults for missing configs.

### Pattern 6: Compaction Preservation

On `session.compacting`, a `KernelPacket` is serialized with intake context, continuity snapshot, and lifecycle state, ensuring session context survives context window compaction.

### Pattern 7: Status Mapping Enum Bridge

Three overlapping status enums exist (`TaskStatus`, `SessionLifecyclePhase`, `DelegationPacketStatus`). The mapping table in `types.ts` bridges them via `HarnessStatus` as the canonical superset.

| HarnessStatus | SessionLifecyclePhase | DelegationPacketStatus |
|--------------|----------------------|----------------------|
| pending | created | pending |
| queued | queued | pending |
| dispatching | dispatching | pending |
| running | running | running |
| completed | completed | completed |
| failed/error | failed | failed |
| cancelled | failed | failed |
| interrupt | (preserves) | (preserves) |

### Pattern 8: Dual-Layer State

State is persisted durably as JSON files (for recovery across restarts) AND cached in-memory as Maps (for fast runtime access). `deep-clone-on-read` prevents mutation leaks between layers.

### Pattern 9: Error Object Pattern (Not Error Subclasses)

Delegation errors are plain data structures, not `Error` subclasses:

```typescript
interface DelegationError {
  code: DelegationErrorCode   // Machine-readable, e.g., "SLOT_LIMIT_REACHED"
  message: string             // Human-readable
  sessionId?: string
  timestamp: number
}
```

### Pattern 10: Progressive Delegation Monitoring

The `DelegationMonitor` uses incremental failure checkpoints:
- **Level 0** (60s): First action deadline — inject progress prompt
- **Level 1** (120s): Still no action — escalate urgency
- **Level 2** (180s): Repeated no-action — critical escalation
- **Level 3** (300s): Auto-abort threshold — terminate delegation

---

## 10. Runtime Architecture

### Plugin Execution Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| **SDK mode** | Standard OpenCode session | Child session created via `session.prompt()` / `task` tool |
| **PTY mode** | `bun-pty` available (Bun only) | Background shell commands in pseudo-terminal |
| **Headless mode** | `bun-pty` unavailable | Falls back to `node:child_process` |

### Runtime Policy (`shared/runtime-policy.ts`)

```typescript
type RuntimePolicy = {
  concurrency: {
    globalLimit: number
    perKey?: Record<string, PerKeyConcurrencyPolicy>
  }
  budget: {
    maxToolCallsPerSession: number
    repeatedSignatureThreshold: number
    warningCap: number
    resetOnCompact: boolean
  }
  trustedRuntime: {
    builtinAsyncBackgroundChildSessions: boolean  // deprecated — always async now
  }
  maxDelegationDepth?: number
}
```

### PtY Integration (`features/background-command/pty/`)

- **Lazy loading:** `createPtyManagerIfSupported()` only creates PTY manager when `bun-pty` is available
- **Graceful fallback:** On Node.js or when `bun-pty` is absent, returns `null`
- **Signal handling:** PTY signal forwarding with proper cleanup

### Tmux Integration (`features/tmux/`)

- **Optional visual layer:** Requires OpenCode server mode (`opencode.json` → `server.port`)
- **Fork plugin:** Separate `@hivemind/tmux` npm package for the orchestration UI
- **Pane management:** Session multiplexer with grid planning

---

## 11. Agent Work Contracts (`features/agent-work-contracts/`)

Provides durable contract-based work tracking:

```typescript
interface AgentWorkContract {
  id: string
  ownerAgent: string
  taskBoundary: string        // Bounded task scope
  allowedSurfaces: string[]   // Files/surfaces agent may touch
  nonGoals: string[]          // Explicitly out of scope
  requiredProof: string[]     // Evidence expected for completion
  minimumEvidenceLevel: string // L1-L5 evidence hierarchy
  verificationCommands: string[]
}
```

**Contract Lifecycle:** Created via `hivemind-agent-work-create` tool → tracked in contract store → verified during `tool.execute.before` guard → evidence attached to trajectory.

---

## 12. Feature Module Overview

| Feature | Module | Files | Key Classes |
|---------|--------|-------|-------------|
| Session Tracker | `features/session-tracker/` | 17 | `SessionTracker`, `EventCapture`, `MessageCapture`, `ToolCapture` |
| Agent Work Contracts | `features/agent-work-contracts/` | 6 | Contract store, lifecycle, bounds |
| Governance Engine | `features/governance-engine/` | 4 | Config reader, evaluator, session creator |
| Background Command | `features/background-command/pty/` | 5 | `PtyManager`, `PtyRuntime`, `PtyBuffer` |
| Auto Loop | `features/auto-loop/` | 2 | Auto-loop engine |
| Ralph Loop | `features/ralph-loop/` | 2 | Correction cycle engine |
| Prompt Packet | `features/prompt-packet/` | 2 | `KernelPacket`, compaction preservation |
| Bootstrap | `features/bootstrap/` | 2 | Control plane, primitive registry |
| Runtime Pressure | `features/runtime-pressure/` | 1 | Pressure classification |
| SDK Supervisor | `features/sdk-supervisor/` | 1 | SDK health monitoring |
| Doc Intelligence | `features/doc-intelligence/` | 1 | Document skim/read/search |
| Tmux | `features/tmux/` | 4 | `SessionManager`, `TmuxMultiplexer` |
| Capability Gate | `features/capability-gate/` | - | Capability gates (TBD) |
| Tool Intelligence | `features/tool-intelligence/` | - | Tool intelligence (TBD) |

---

## 13. State Roots Summary

| Data Root | Format | Authority | Read/Write |
|-----------|--------|-----------|------------|
| `src/config/subscriber.ts` | In-memory Map + JSON | Config schema | Read at init, cache |
| `src/shared/state.ts` | In-memory Map | TaskStateManager | Runtime in-memory |
| `src/task-management/continuity/` | JSON file + Map | Continuity store | Read/Write with deep-clone |
| `.hivemind/session-tracker/` | JSON files | SessionTracker | Write only by SessionTracker |
| `.hivemind/state/` | JSON files | Legacy | Read by migration |
| `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/` | `.md`/`.yaml` | Primitive filesystem | Read by bootstrap |
| `assets/` | Mixed | Source of truth | Read during `sync-assets.js` |

---

## 14. Architectural Constraints (Non-Negotiable)

1. **CQRS Separation:** Hooks (read-side) must NEVER write files. Tools (write-side) perform all durable mutations.
2. **500 LOC Limit:** Modules should stay under 500 lines. Exceptions require documented justification in the module header.
3. **No Circular Dependencies:** Cross-module import chains must be acyclic.
4. **Best-Effort Hooks:** All hook handlers must catch errors internally. Never throw to the OpenCode runtime.
5. **Dual-Layer State:** Every state change must update both the in-memory cache and the durable file.
6. **`[Harness]` Prefix:** All thrown errors must use the `[Harness]` prefix.
7. **verbatimModuleSyntax:** Use `import type` for type-only imports.
8. **Factory Pattern:** All hooks and tools must be created via factory functions with explicit dependency injection.
9. **Deep-Clone-on-Read:** Continuity store returns deep-cloned records to prevent in-memory mutation leaks.
10. **MAX_DELEGATION_DEPTH:** Hard limit of 3 on delegation nesting depth.

---

## 15. Test Architecture

- **Framework:** Vitest v4 (ESM-native)
- **Coverage:** `src/**/*.ts` (excludes `src/index.ts`)
- **Test location:** `tests/lib/` mirrors `src/` structure; `tests/tools/` for tool tests
- **In-memory client:** `tests/lib/helpers/in-memory-client.ts` for SDK-free testing
- **Dual-mode testing:** Tests use both real and mock SDK clients
- **Plugin-level tests:** `tests/plugin/` tests the full `HarnessControlPlane` composition root
- **Integration tests:** `tests/integration/` covers cross-module interaction
- **CI gate:** `npm test` runs all 2,963 tests (per AGENTS.md claim)
