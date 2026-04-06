# Architecture

**Analysis Date:** 2026-04-06

## Pattern Overview

**Overall:** CQRS (Command Query Responsibility Segregation) with Plugin Hook Assembly

The codebase enforces a strict CQRS boundary:
- **Tools** (`src/tools/`) own write-side operations — they mutate session state, create child sessions, patch files
- **Hooks** (`src/hooks/`) own read-side context injection — they transform system prompts and message history without durable writes
- **Plugin** (`src/plugin.ts`) is the composition layer — it assembles tools + hooks + event handlers with zero business logic

**Key Characteristics:**
- Dual-layer state: in-memory Maps (`src/lib/state.ts`) for fast access + durable JSON file (`src/lib/continuity.ts`) for persistence
- Event-driven lifecycle: OpenCode SDK events flow through `HarnessLifecycleManager` to drive session state machines
- Keyed concurrency queues: per-model/agent/category lanes with configurable limits
- Schema-validated tool outputs: all prompt-enhance tool results validated against Zod contracts in `src/schema-kernel/`

## Layers

**Composition Layer (Plugin):**
- Purpose: Assembly of tools, hooks, event handlers, and lifecycle management
- Location: `src/plugin.ts` (~450 LOC)
- Contains: Plugin export, hook registrations, tool definitions, circuit breaker logic
- Depends on: All `src/lib/*` modules, all `src/tools/*` modules, `src/hooks/*`
- Used by: OpenCode runtime via `@opencode-ai/plugin` interface

**Core Library Layer:**
- Purpose: Shared business logic for delegation, continuity, concurrency, and lifecycle
- Location: `src/lib/`
- Contains: 11 modules (types, state, continuity, lifecycle-manager, concurrency, completion-detector, session-api, runtime, notification-handler, helpers, task-status, agent-registry)
- Depends on: OpenCode SDK (`@opencode-ai/sdk`), Node.js fs/path
- Used by: Plugin layer, tools, hooks

**Tool Layer (Write-Side):**
- Purpose: LLM-facing operations that perform actions
- Location: `src/tools/` (4 prompt-enhance tools + 1 delegation tool in plugin)
- Contains: `prompt-skim`, `prompt-analyze`, `context-budget`, `session-patch`, `delegate-task`
- Depends on: `src/lib/helpers.ts`, `src/shared/tool-helpers.ts`, `src/shared/tool-response.ts`, `src/schema-kernel/`
- Used by: LLM agents via OpenCode tool interface

**Hook Layer (Read-Side):**
- Purpose: Context injection into OpenCode's prompt/message pipeline
- Location: `src/hooks/`
- Contains: `system-transform.ts`, `messages-transform.ts`
- Depends on: `src/lib/state.ts`, `src/lib/continuity.ts`
- Used by: OpenCode plugin hooks (`system.transform`, `messages.transform`)

**Schema Kernel:**
- Purpose: Machine-authoritative Zod contracts for tool outputs and pipeline state
- Location: `src/schema-kernel/`
- Contains: `prompt-enhance.schema.ts` (6 Zod schemas), `index.ts` (barrel re-export)
- Depends on: `zod`
- Used by: All prompt-enhance tools for output validation

**Shared Utilities:**
- Purpose: Pure helper functions and response envelopes
- Location: `src/shared/`
- Contains: `tool-helpers.ts` (result rendering), `tool-response.ts` (success/error/pending envelope)
- Depends on: Nothing (leaf modules)
- Used by: All tools

## Data Flow

### Session Delegation Flow (parent → child)

1. **Initiation**: LLM calls `delegate-task` tool in parent session (`src/plugin.ts` lines 228-310)
2. **Validation**: Agent name validated against `VALID_AGENTS` ("researcher", "builder", "critic"), category normalized against `VALID_DELEGATION_CATEGORIES`
3. **Parent Chain Resolution**: `walkParentChain()` in `src/lib/session-api.ts` traverses parent→root, detecting cycles
4. **Depth Check**: `childDepth = chain.length - 1`, rejected if > `MAX_DEPTH` (3)
5. **Budget Reservation**: `reserveDescendant(rootID, MAX_DESCENDANTS_PER_ROOT)` in `src/lib/state.ts` checks against limit of 10
6. **Permission Computation**: `getPermissionRulesForAgent()` generates allow/deny rules per agent type
7. **Session Creation**: `createSession()` via OpenCode SDK with parentID, title, permission rules
8. **Continuity Recording**: `recordSessionContinuity()` writes durable JSON with toolProfile, promptParams, metadata
9. **Queue Acquisition**: `DelegationConcurrencyQueue.acquire()` waits for lane slot (keyed by model/agent/category)
10. **Prompt Dispatch**: `sendPrompt()` fires in background (async) or blocks (sync)
11. **Completion Detection**: `CompletionDetector.watch()` monitors terminal events
12. **Parent Notification**: `notifyParentSession()` injects `<system_reminder>` into parent session

### State Tracking Flow

1. **Tool Call Tracking**: `tool.execute.before` hook increments `SessionStats.total` and per-tool counts in `src/lib/state.ts`
2. **Circuit Breaker Check**: Repeated tool signature detection — if same tool+args called ≥16 times, throws error
3. **Tool Budget Check**: If `total > 400`, throws error
4. **Lifecycle Patching**: Every tool event calls `noteObservedActivity()` → `patchSessionContinuity()` updates durable JSON
5. **Event Processing**: `event` hook feeds `lifecycleManager.handleEvent()` which maps SDK events to continuity status
6. **Compaction Context**: `experimental.session.compacting` hook injects full harness state snapshot into compaction prompt

### Continuity Hydration Flow

1. **Startup**: `lifecycleManager.hydrateFromContinuity()` reads all records from `session-continuity.json`
2. **State Rebuild**: For each record, `hydrateDelegationState()` restores in-memory Maps (sessionToRoot, rootBudgets, sessionDelegationMeta)
3. **Event Replay**: Subsequent SDK events (`session.created`, `session.updated`) call `inheritRootFromParent()` to restore parent-child links

## State Management

### Dual-Layer Architecture

**Layer 1: In-Memory Maps** (`src/lib/state.ts`)
- `rootBudgets: Map<string, RootBudget>` — tracks descendant sets and reservations per root
- `sessionToRoot: Map<string, string>` — maps any session to its root ID
- `sessionStats: Map<string, SessionStats>` — tool call counts, loop detection, warnings
- `sessionDelegationMeta: Map<string, DelegationMeta>` — agent, depth, category, model, queueKey

**Layer 2: Durable JSON** (`src/lib/continuity.ts`)
- File: `.opencode/state/opencode-harness/session-continuity.json` (configurable via `OPENCODE_HARNESS_CONTINUITY_FILE` or `OPENCODE_HARNESS_STATE_DIR`)
- Schema: `ContinuityStoreFile` with `version: 1`, `updatedAt`, `sessions: Record<string, SessionContinuityRecord>`
- Each record: `sessionID`, `toolProfile`, `promptParams`, `metadata` (full delegation chain, lifecycle state)
- Deep-clone-on-read: `cloneContinuityRecord()` prevents mutation of cached objects
- Write-through: `persistStore()` serializes to disk on every mutation

**Synchronization Strategy:**
- In-memory Maps are the fast-path for hot reads (tool.execute.before/after hooks)
- Durable JSON is the source of truth for continuity across restarts
- On startup, Maps are hydrated from JSON via `hydrateFromContinuity()`
- SDK events (`session.created`, `session.updated`) trigger `inheritRootFromParent()` to keep Maps in sync

## Lifecycle Model

### Session Phases

Defined in `src/lib/types.ts` as `SessionLifecyclePhase`:

| Phase | Trigger | Next Possible |
|-------|---------|---------------|
| `created` | `recordSessionContinuity()` called during `launchDelegatedSession()` | `queued`, `dispatching` |
| `queued` | Queue lane full (`active >= limit`) | `dispatching` |
| `dispatching` | Queue lane acquired, prompt about to fire | `running` |
| `running` | Prompt dispatched (sync or async) | `completed`, `failed` |
| `completed` | Assistant response ready (sync) or idle detected (async) | terminal |
| `failed` | Error, timeout, cancellation, or deletion | terminal |

### Status → Phase Mapping

`mapStatusToPhase()` in `src/lib/lifecycle-manager.ts`:

| Continuity Status | Mapped Phase |
|-------------------|--------------|
| `pending` | `created` (or previous phase) |
| `queued` | `queued` |
| `running` | `running` (or previous phase if queued/dispatching) |
| `completed` | `completed` |
| `error` | `failed` |
| `cancelled` | `failed` |
| `interrupt` | `running` (or previous phase if queued/dispatching) |

### Event Handling

Events flow through `HarnessLifecycleManager.handleEvent()` in `src/lib/lifecycle-manager.ts`:

1. **Terminal Events**: `session.idle`, `session.error`, `session.deleted` fed to `CompletionDetector.feed()`
2. **Session Created/Updated**: `inheritRootFromParent()` restores root mapping, `hydrateDelegationState()` restores delegation meta
3. **Session Deleted**: `forgetSession()` cleans all in-memory Maps, `deleteSessionContinuity()` removes from JSON
4. **Status Inference**: `inferContinuityStatusFromEvent()` in `src/lib/runtime.ts` maps SDK event signals to continuity status
5. **Lifecycle Patch**: `patchSessionContinuity()` updates phase, timestamps, observation, and queue state

### Run Modes

- **Sync** (`run_in_background: false`): `sendPrompt()` blocks until assistant completes, returns assistant text directly
- **Async** (`run_in_background: true`): `sendPrompt()` fires in background, returns task metadata immediately, `observeBackgroundCompletion()` polls for completion

## Completion Detection Mechanism

**Location:** `src/lib/completion-detector.ts`

**Two-Signal Detection:**

1. **Terminal Event Signal**: Listens for OpenCode SDK events:
   - `session.idle` → `"idle"` (completed successfully)
   - `session.error` → `"error"` (failed with error)
   - `session.deleted` → `"deleted"` (session removed)

2. **Message Stability Signal**: Monitors message count changes:
   - On first message count or count change: starts `stabilityTimeoutMs` (10s) timer
   - If count unchanged for 10s: resolves as `"idle"`
   - If count changes during timer: resets timer

**Watch Pattern:**
- `watch(sessionID, timeoutMs)`: Returns promise that resolves with `CompletionResult`
- Pre-cached results: If terminal event arrived before `watch()` called, returns cached immediately
- Timeout: After `timeoutMs` (180000ms from plugin config), resolves as `"timeout"`
- Cancel: `cancel(sessionID)` resolves as `"cancelled"`

**Background Completion Flow:**
```
sendPrompt() fires (background)
  → observeBackgroundCompletion() calls completionDetector.watch()
    → Terminal event arrives → patchLifecycle(completed/failed)
    → notifyParentSession() injects <system_reminder> into parent
    → releaseQueue("background-complete")
```

## Circuit Breaker and Tool Budget System

**Location:** `src/plugin.ts` (lines 110-145, `tool.execute.before` hook)

**Circuit Breaker:**
- Threshold: `CIRCUIT_BREAKER_THRESHOLD = 16`
- Detection: `makeToolSignature(toolName, args)` creates stable hash of tool+args
- Window: Consecutive identical signatures increment `stats.loop.count`
- Trip: When `count >= 16`, throws `[Harness] Circuit breaker tripped...`
- Reset: Different tool or different args resets `count` to 1 and updates `signature`

**Tool Budget:**
- Limit: `MAX_TOOL_CALLS_PER_SESSION = 400`
- Tracking: `stats.total` incremented on every `tool.execute.before`
- Enforcement: When `total > 400`, throws `[Harness] Session exceeded the tool call budget`

**Warning Accumulation:**
- `addWarning(sessionID, message)` stores up to 25 warnings per session
- Warnings surface in `tool.execute.after` metadata and compaction context

## Delegation Chain

**Location:** `src/plugin.ts` (delegate-task tool), `src/lib/state.ts` (budget tracking)

**Chain Structure:**
```
Root Session (depth 0)
  └── Child Session (depth 1) — researcher/builder/critic
        └── Grandchild Session (depth 2)
              └── Great-Grandchild Session (depth 3) ← MAX_DEPTH
```

**Constraints:**
- `MAX_DEPTH = 3`: Maximum delegation depth
- `MAX_DESCENDANTS_PER_ROOT = 10`: Maximum total descendants per root session
- `VALID_AGENTS = ["researcher", "builder", "critic"]`: Allowed specialist agents
- `VALID_DELEGATION_CATEGORIES = ["research", "implementation", "review", "visual-engineering"]`: Routing categories

**Permission Scoping by Agent:**

| Permission | researcher | builder | critic |
|------------|-----------|---------|--------|
| edit | deny | allow | deny |
| write | deny | allow | deny |
| bash | deny | allow | allow |
| read | allow | allow | allow |
| grep | allow | allow | allow |
| glob | allow | allow | allow |
| task | deny | deny | deny |
| delegate-task | deny | deny | deny |

**Tool Compatibility by Agent:**
- **Researcher**: `required: [read, glob, grep, webfetch]`, `mustNot: [edit, write, bash, task]`
- **Builder**: `required: [read, glob, grep, edit, write, bash]`, `mustNot: [task]`
- **Critic**: `required: [read, glob, grep, bash]`, `mustNot: [edit, write, task]`

**Queue Key Resolution** (`buildDelegationQueueKey()` in `src/lib/concurrency.ts`):
1. If `model` specified: `model:<model>` (per-model lane)
2. If `agent` + `category`: `agent:<agent>:category:<category>`
3. If only `agent`: `agent:<agent>`
4. If only `category`: `category:<category>`
5. Default: `"default"`

## Error Handling

**Strategy:** Fail-fast with context preservation

**Patterns:**
- All errors prefixed with `[Harness]` for identification
- Circuit breaker and budget violations throw immediately (no graceful degradation)
- Session creation failures rollback reservation via `rollbackReservation(rootID)`
- Notification failures are best-effort (caught and swallowed in `notifyParentSession()`)
- Continuity load failures return empty store (no crash on corrupted JSON)
- Cycle detection in `walkParentChain()` throws on parent loop

## Cross-Cutting Concerns

**Logging:**
- `client.app.log()` for structured logging (per OpenCode SDK convention)
- Warnings accumulated in `SessionStats.warnings` (max 25 per session)
- Errors surfaced in tool metadata (`_harness.recentWarnings`)

**Validation:**
- Zod schemas in `src/schema-kernel/prompt-enhance.schema.ts` validate all tool outputs
- Agent names validated against `VALID_AGENTS` enum
- Categories validated against `VALID_DELEGATION_CATEGORIES` enum
- Tool signatures use `stableStringify()` for deterministic comparison

**Environment Configuration:**
- `OPENCODE_HARNESS_STATE_DIR`: Override continuity state directory
- `OPENCODE_HARNESS_CONTINUITY_FILE`: Override continuity file path directly
- `OPENCODE_HARNESS_CONCURRENCY_LIMIT`: Override concurrency limit (default: 3)

---

*Architecture analysis: 2026-04-06*