# Architecture

> Generated: 2026-04-21
> Agent: gsd-codebase-mapper (arch-focus)

## Pattern Overview

**Overall:** Plugin-based runtime composition engine for OpenCode

**Key Characteristics:**
- Thin plugin assembly — `plugin.ts` is a pure composition root (77 LOC)
- Two halves: Hard Harness (`src/`) and Soft Meta-Concepts (`.opencode/`)
- Dual-layer state: durable JSON file + in-memory Maps
- WaiterModel delegation (always-background, fire-and-forget dispatch)
- CQRS separation: tools are write-side, hooks are read-side
- Leaf-first dependency graph (max chain depth: 2)

## Two Halves

| Half | What | Where |
|------|------|-------|
| **Hard Harness** | TypeScript npm package: tools, hooks, plugin, shared, lib | `src/` |
| **Soft Meta-Concepts** | User-configurable skills, agents, commands, rules | `.opencode/` |

The hard harness provides the runtime engine. The soft meta-concepts provide user-configurable behavior templates. The plugin assembly in `src/plugin.ts` wires them together at load time.

## Layers

### Plugin Assembly (`src/plugin.ts`)
- Purpose: Composition root — instantiates shared dependencies, wires hook factories, registers tools
- Location: `src/plugin.ts`
- Contains: Plugin entry point, dependency injection
- Depends on: All hook factories, all tool factories, `DelegationManager`, `lifecycle-manager`, `state`, `runtime-policy`
- Used by: OpenCode runtime (loaded via `.opencode/plugins/`)

### Core Library (`src/lib/`)
- Purpose: Business logic modules — no OpenCode plugin API awareness
- Location: `src/lib/*.ts`
- Contains: State management, delegation orchestration, persistence, SDK wrappers, concurrency
- Depends on: Each other (per dependency graph), `@opencode-ai/sdk`
- Used by: `src/plugin.ts`, `src/hooks/`, `src/tools/`

### Hooks — Read Side (`src/hooks/`)
- Purpose: Event-reactive hooks that observe and transform OpenCode runtime events
- Location: `src/hooks/*.ts`
- Contains: Core event routing, session lifecycle hooks, tool guard hooks, message transform
- Depends on: `src/lib/` modules
- Used by: `src/plugin.ts` (hook registration)

### Tools — Write Side (`src/tools/`)
- Purpose: Plugin tools exposed to agents for delegation, status polling, prompt analysis, session patching
- Location: `src/tools/**/*.ts`
- Contains: `delegate-task`, `delegation-status`, `prompt-skim`, `prompt-analyze`, `session-patch`
- Depends on: `src/lib/`, `src/shared/`, `@opencode-ai/plugin/tool`, `zod`
- Used by: `src/plugin.ts` (tool registration)

### Shared (`src/shared/`)
- Purpose: Cross-cutting utilities used by tools
- Location: `src/shared/*.ts`
- Contains: Tool response envelope, tool result rendering
- Depends on: Nothing
- Used by: All tools in `src/tools/`

### Schema Kernel (`src/schema-kernel/`)
- Purpose: Zod schemas for the prompt-enhance pipeline contracts
- Location: `src/schema-kernel/*.ts`
- Contains: Schema definitions for `PromptSkimResult`, `PromptAnalysisResult`, `SessionPatchRecord`, etc.
- Depends on: `zod`
- Used by: Prompt-enhance tools, schema validation tests

## Core Modules

### `src/lib/types.ts` (378 LOC) — LEAF
- **Role:** Shared type definitions and constants — the canonical type authority
- **Key exports:** `TaskStatus`, `HarnessStatus`, `SessionLifecyclePhase`, `DelegationMeta`, `Delegation`, `RuntimePolicy`, all continuity types, governance types
- **Constants:** `MAX_DESCENDANTS_PER_ROOT` (10), `VALID_DELEGATION_CATEGORIES`, `DEFAULT_SAFETY_CEILING_MS` (30 min), `STABILITY_THRESHOLD` (3), `STABILITY_POLL_INTERVAL_MS` (3000ms), `MAX_DELEGATION_DEPTH` (1)
- **Dependency rule:** Imports nothing — this is the leaf node

### `src/lib/delegation-manager.ts` (450 LOC)
- **Role:** Core delegation orchestrator — WaiterModel execution pattern
- **Key class:** `DelegationManager`
- **Pattern:** D-02 (always-background dispatch), D-04 (dual-signal completion: `session.idle` + message count stability), D-13 (safety ceiling, not deadline)
- **Public API:** `dispatch()`, `handleSessionIdle()`, `handleSessionDeleted()`, `recoverPending()`, `getStatus()`, `getAllDelegations()`
- **State:** In-memory Maps (`delegations`, `delegationsBySession`, `safetyTimers`, `stabilityTimers`)
- **Persistence:** JSON file at `.opencode/state/opencode-harness/delegations.json`
- **Flow:** dispatch → fire-and-forget prompt → session.idle triggers stability polling → STABILITY_THRESHOLD consecutive stable polls → finalize (extract assistant text) → persist
- **Depends on:** `concurrency.ts`, `continuity.ts`, `helpers.ts`, `types.ts`

### `src/lib/continuity.ts` (401 LOC)
- **Role:** Durable JSON persistence — deep-clone-on-read store
- **Key exports:** `getSessionContinuity`, `recordSessionContinuity`, `patchSessionContinuity`, `patchSessionDelegationPacket`, `deleteSessionContinuity`, `listSessionContinuity`, `getContinuityStoragePath`, governance helpers
- **Storage:** `.opencode/state/opencode-harness/session-continuity.json`
- **Pattern:** Module-level `storeCache` singleton — loads on first access, persists on every write
- **Clone strategy:** Every read deep-clones to prevent mutation aliasing; every patch clones the incoming values before persisting
- **Depends on:** `types.ts` only

### `src/lib/concurrency.ts` (298 LOC)
- **Role:** Keyed semaphore with priority queue — FIFO concurrency control
- **Key class:** `DelegationConcurrencyQueue`
- **Key exports:** `buildDelegationQueueKey()`, `SpawnReservation`, `reserveSubagentSpawn()`
- **Pattern:** Per-key lanes with active count + pending queue + high/normal priority queues
- **SpawnReservation:** Budget-aware reservation with release/rollback lifecycle
- **Depends on:** `types.ts`, `state.ts`

### `src/lib/state.ts` (251 LOC)
- **Role:** In-memory Maps — process-wide state store
- **Key class:** `TaskStateManager`
- **Key exports:** `taskState` singleton + backward-compatible wrapper functions
- **Maps:** `rootBudgets`, `sessionToRoot`, `sessionStats`, `sessionDelegationMeta`, `subagentSessions`
- **Pattern:** Singleton class with thin function wrappers for backward compatibility
- **Warning cap:** 25 warnings per session
- **Depends on:** `types.ts`

### `src/lib/runtime-policy.ts` (237 LOC)
- **Role:** Runtime policy loading, validation, and per-session resolution
- **Key exports:** `DEFAULT_RUNTIME_POLICY`, `loadRuntimePolicy()`, `getRuntimePolicyForSession()`, `resolveConcurrencyForKey()`, `resolveBudgetForSession()`
- **Defaults:** `globalLimit: 3`, `maxToolCallsPerSession: 400`, `repeatedSignatureThreshold: 16`, `warningCap: 25`, `resetOnCompact: true`
- **Pattern:** Workspace policy → validate → merge with session overrides → validate again
- **Depends on:** `types.ts`

### `src/lib/session-api.ts` (230 LOC)
- **Role:** Typed wrappers around OpenCode SDK client calls
- **Key exports:** `createSession`, `getSession`, `getSessionStatusMap`, `abortSession`, `getSessionMessages`, `sendPrompt`, `sendPromptAsync`, `getSessionID`, `getParentID`, `getEventSessionID`, `getEventParentID`, `walkParentChain`
- **Type:** `OpenCodeClient` = `ReturnType<typeof createOpencodeClient>`
- **Pattern:** Canonical call shapes, assertValidSessionID guard, unwrapData for error handling
- **Depends on:** `helpers.ts`, `@opencode-ai/sdk`

### `src/lib/helpers.ts` (175 LOC)
- **Role:** Pure utilities only — no agent config, no state
- **Key exports:** `isObject`, `asString`, `getNestedValue`, `unwrapData`, `stableStringify`, `makeToolSignature`, `buildPromptText`, `getPromptToolCompatibility`, `extractSdkErrorMessage` (internal)
- **Pattern:** All functions are pure — no side effects, no state mutation
- **Depends on:** `types.ts`

### `src/lib/notification-handler.ts` (169 LOC)
- **Role:** Async completion notification — builds and delivers messages to parent sessions
- **Key exports:** `buildNotificationMessage()`, `formatToastMessage()`, `buildTaskNotificationFromContinuity()`, `notifyParentSession()`
- **Pattern:** Formats XML-tagged system reminders, delivers via `client.session.prompt` with `noReply: true`
- **Depends on:** `session-api.ts`, `types.ts`

### `src/lib/lifecycle-manager.ts` (135 LOC) — STUB
- **Role:** Session lifecycle state machine — currently minimal stub after clean slate
- **Key class:** `HarnessLifecycleManager`
- **Key exports:** `createHarnessLifecycleManager()`, `isValidTransition()`, `hydrateFromContinuity()`, `handleEvent()`, `cancelDelegatedSession()`, `requestAutoLoopRetry()`, `recordCompactionCheckpoint()`
- **Status:** Stripped to compile; `launchDelegatedSession()` throws with "not yet restored" error
- **Depends on:** `completion-detector.ts`, `continuity.ts`, `session-api.ts`, `state.ts`, `types.ts`

### `src/lib/completion-detector.ts` (126 LOC) — SELF-CONTAINED
- **Role:** Two-signal completion detection — session.idle + stability timer
- **Key class:** `CompletionDetector`
- **Key exports:** `feed()`, `watch()`, `cancel()`, `feedMessageCount()`
- **Pattern:** Watchers register for a session; when terminal event arrives, watcher resolves. Cached results for events that arrive before watch() is called.
- **Depends on:** Nothing (self-contained)

### `src/lib/runtime.ts` (95 LOC)
- **Role:** Event→status inference only — maps transport signals to continuity statuses
- **Key exports:** `inferContinuityStatusFromEvent()`
- **Pattern:** Multi-path signal extraction from event objects, evidence-gated running inference
- **Depends on:** `helpers.ts`, `types.ts`

### `src/lib/task-status.ts` (22 LOC) — LEAF
- **Role:** Task status type system + transition guard table
- **Key exports:** `VALID_TASK_STATUSES`, `VALID_TRANSITIONS`, `canTransition()`, `isTerminal()`
- **Terminal states:** `completed`, `failed`, `error`, `cancelled`
- **Depends on:** `types.ts`

## Hook Factories

### `src/hooks/create-core-hooks.ts` (136 LOC)
- **Produces:** `event`, `system.transform`, `experimental.chat.system.transform`, `messages.transform`, `shell.env`
- **Behavior:** Routes events to lifecycle manager, delegates message transform, sets non-interactive shell env vars (`CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1`, `TERM=dumb`)

### `src/hooks/create-session-hooks.ts` (295 LOC)
- **Produces:** `event` (session.idle auto-loop), `experimental.session.compacting`
- **Behavior:** Auto-loop retry on `session.idle` when delegation packet exists (checks for `<promise>DONE</promise>` signal, max 5 iterations, 1s backoff). Compacting hook injects lifecycle/continuity context.

### `src/hooks/create-tool-guard-hooks.ts` (153 LOC)
- **Produces:** `tool.execute.before`, `tool.execute.after`
- **Behavior:** Before: circuit breaker (repeated signature detection), tool call budget enforcement. After: injects `_harness` metadata into tool output.

### `src/hooks/messages-transform.ts` (92 LOC)
- **Produces:** `transformMessages()` function (used by core hooks)
- **Behavior:** Detects prompt-enhance trigger phrases in messages, injects context packet (session ID, status, agent, category) before first user message.

### `src/hooks/types.ts` (28 LOC)
- **Role:** Shared hook dependency types
- **Key type:** `HookDependencies` — lifecycleManager, client, stateManager, eventObservers, autoLoopConfig

## Tools

### `src/tools/delegate-task.ts` (60 LOC)
- **API:** `agent` (string, required), `prompt` (string, required), `title` (optional), `safetyCeilingMs` (optional, 60s–60min)
- **Returns:** Immediate `{ status: "dispatched", delegationId }` via WaiterModel

### `src/tools/delegation-status.ts` (71 LOC)
- **API:** `delegationId` (optional), `status` (optional filter)
- **Returns:** Specific delegation state or filtered list of all delegations

### `src/tools/prompt-skim/` (tools.ts: 85 LOC + types.ts: 18 LOC + index.ts: 6 LOC)
- **API:** `content` (string), `workspaceRoot` (string)
- **Returns:** Word/line/token counts, URL extraction, file path verification, complexity score

### `src/tools/prompt-analyze/` (tools.ts: 155 LOC + types.ts: 17 LOC + index.ts: 6 LOC)
- **API:** `content` (string)
- **Returns:** Contradiction/vagueness/missing-scope/clarity analysis

### `src/tools/session-patch/` (tools.ts: 103 LOC + types.ts: 19 LOC + index.ts: 6 LOC)
- **API:** `sessionFilePath` (string), `section` (string), `newContent` (string)
- **Returns:** Patched session file content

## Data Flow

### Delegation Flow (WaiterModel)
```
Agent calls delegate-task tool
  → DelegationManager.dispatch()
    → validateAgent() (SDK call to list available agents)
    → semaphore.acquire() (concurrency slot)
    → client.session.create() (child session)
    → registerDelegation() (in-memory maps + safety timer)
    → persistAllDelegations() (JSON file)
    → client.session.prompt() (fire-and-forget, .then() transitions to "running")
  → Returns immediately: { status: "dispatched", delegationId }

Later: session.idle event arrives via hooks
  → DelegationManager.handleSessionIdle()
    → Transitions "dispatched" → "running"
    → scheduleStabilityPoll() (3s intervals)
    → After STABILITY_THRESHOLD (3) consecutive stable polls:
      → finalizeDelegation()
        → client.session.messages() (fetch output)
        → extractAssistantText()
        → Mark "completed", persist, cleanup timers

Safety ceiling timer fires (30 min default):
  → handleSafetyCeiling()
    → Mark "timeout", abort child session, persist, cleanup
```

### Lifecycle Flow
```
Plugin loads:
  → loadRuntimePolicy() (workspace policy)
  → new DelegationManager(client)
  → delegationManager.recoverPending() (rehydrate from disk)
  → createHarnessLifecycleManager() (concurrency limit from env or default 3)
  → lifecycleManager.hydrateFromContinuity() (load delegation state for tracked sessions)

Event arrives:
  → createCoreHooks.event()
    → lifecycleManager.handleEvent()
      → CompletionDetector.feed() (idle/error/deleted signals)
    → replayPendingNotificationsForEvent()
    → Observers: delegationEventObserver (routes idle→DM, deleted→DM), sessionEventObserver (auto-loop)

session.idle + delegation packet:
  → createSessionHooks.event()
    → Auto-loop: check for completion signal, retry with backoff, max 5 iterations

Compacting:
  → createSessionHooks.compacting()
    → Inject lifecycle state + continuity snapshot into context
```

### Continuity Flow (Dual-Layer State)
```
Read path:
  ensureStoreLoaded() → loadStoreFromDisk() if cache miss
  getSessionContinuity(id) → cloneContinuityRecord() (deep clone)

Write path:
  recordSessionContinuity(record) → normalize + clone → store in cache → persistStore() (JSON file)
  patchSessionContinuity(id, patch) → merge with clone → persistStore()

Hydration path:
  lifecycleManager.hydrateFromContinuity()
    → listSessionContinuity() (all records)
    → For each with delegation metadata: hydrateDelegationState() → populate in-memory maps

Tool call tracking (in-memory only):
  tool.execute.before → stateManager.ensureStats() → increment total, track loop signature
  tool.execute.after → inject _harness metadata into output
```

## Dependency Graph

```
types.ts (LEAF — no imports)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── continuity.ts → types.ts
├── concurrency.ts → types.ts, state.ts
├── session-api.ts → helpers.ts, @opencode-ai/sdk
├── runtime.ts → helpers.ts, types.ts
├── completion-detector.ts → (SELF-CONTAINED)
├── notification-handler.ts → session-api.ts, types.ts
├── runtime-policy.ts → types.ts
└── lifecycle-manager.ts → completion-detector.ts, continuity.ts, session-api.ts, state.ts, types.ts

delegation-manager.ts → concurrency.ts, continuity.ts, helpers.ts, types.ts, @opencode-ai/sdk

hooks/ → lib/ modules (no cross-hook imports)
tools/ → lib/ modules, shared/, @opencode-ai/plugin/tool, zod
shared/ → (no imports)
schema-kernel/ → zod
```

**Max dependency chain:** 2 levels. `types.ts` changes ripple to most modules.

## Design Patterns

### Dual-Layer State
Durable JSON file (`continuity.ts`) provides persistence; in-memory Maps (`state.ts`) provide fast access. Hydrated on startup, deep-cloned on read.

### CQRS Tools
Tools (`delegate-task`, `delegation-status`) are write-side / query-side. Hooks are read-side (observe events, transform messages). No tool writes to hook state and no hook directly invokes tools.

### WaiterModel (Always-Background)
`delegate-task` dispatches and returns immediately with a delegation ID. Completion is detected asynchronously via dual-signal (session.idle + stability). Parent agent polls `delegation-status` to get results.

### Dual-Signal Completion Detection
Two independent signals confirm completion:
1. `session.idle` event — the session stopped producing output
2. Message count stability — 3 consecutive polls with unchanged message count

### Safety Ceiling (Not Deadline)
`DEFAULT_SAFETY_CEILING_MS` (30 min) is a MAX runtime, not a target. Tasks complete when dual-signal confirms. Safety ceiling only fires if the session hangs.

### Deep-Clone-on-Read
Every `getSessionContinuity()` call returns a deep clone. Every `patchSessionContinuity()` clones incoming values before persisting. Prevents mutation aliasing across the codebase.

### Circuit Breaker
Tool guard hook detects repeated identical tool calls (same tool name + same args). Trips after `repeatedSignatureThreshold` (default: 16) consecutive calls.

### SpawnReservation Budget
`reserveSubagentSpawn()` reserves a descendant slot before session creation. `release()` confirms spawn; `rollback()` returns the slot on failure. Idempotent — double-call is a no-op.

---

*Architecture analysis: 2026-04-21*
