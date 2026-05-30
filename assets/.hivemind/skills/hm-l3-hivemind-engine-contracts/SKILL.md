---
name: hm-l3-hivemind-engine-contracts
description: Documents the Hivemind engine integration contracts — plugin load order, custom tool registration, hook composition, session lifecycle phases, circuit breaker thresholds, budget policies, concurrency model, completion detection, and session API wrappers. Use when integrating with Hivemind runtime, understanding tool/hook registration contracts, debugging lifecycle issues, configuring budget/concurrency policies, or building harness-compatible extensions. NOT for direct code implementation — this is a reference for understanding engine boundaries.
metadata:
  layer: "3"
  role: "reference"
  pattern: P2
  version: "1.0.0"
  context-bomb: true
  requires: Q1-Q6-validation-decisions
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

## Overview

Complete reference for Hivemind engine integration contracts. Documents the wiring order, plugin assembly, tool registration contracts, hook composition rules, session lifecycle phases, budget/concurrency policy defaults, completion detection protocol, and session API wrappers. Sourced from `src/plugin.ts` (composition root) and all `src/lib/` modules (verified against source 2026-04-30).

This skill is **read-only reference** for hm-* agents and hf-* agents. You use this to understand how the harness works — not to modify engine behavior directly. Engine modifications must go through the plugin code, not through skill guidance.

## Plugin Load Order (must-never-deviate)

The `HarnessControlPlane` plugin (`src/plugin.ts`) wires components in this exact order. Deviations produce runtime failures.

```
1. Load Runtime Policy       — resolveWorkspaceRuntimePolicy() → loadRuntimePolicy()
2. Create PTY Manager         — createPtyManagerIfSupported() (lazy-loaded, graceful null fallback)
3. Initialize DelegationManager  — new DelegationManager(client, { ptyManager, runtimePolicy })
4. Async Recovery              — delegationManager.recoverPending() (fire-and-forget, must not block init)
5. Create LifecycleManager     — createHarnessLifecycleManager({ client, pollTimeoutMs, runtimePolicy, delegationManager })
6. Hydrate Continuity          — lifecycleManager.hydrateFromContinuity()
7. Create Hook Factories        — sessionHooks, toolGuardHooks, event observers
8. Wire Event Observers         — delegation → handleSessionIdle/handleSessionDeleted, journey → event tracker
9. Wire Tool Execute After      — tool.execute.after: summarize output, audit projection, workflow persistence
10. Return Plugin Object        — ...coreHooks, ...sessionReadHooks, ...toolGuardHooks, tool: { ... }, tool.execute.after
```

**Key constraint:** Steps 1-6 are blocking initialization. Steps 7-10 construct the plugin shape. No tool or hook registration occurs before lifecycle manager and delegation manager are initialized.

## Custom Tool Registration Contract

### Tool Registration Shape

All tools registered through the plugin must conform to:

```typescript
type HarnessTool = {
  description: string           // Human-readable description (shown in tool list)
  parameters: ZodSchema         // Zod v4 schema for tool arguments
  execute: ({ context }: { context: ToolContext }) => Promise<ToolResult>
}
```

**Currently registered tools (8 tools in plugin.ts):**

| Tool | Source | Purpose |
|------|--------|---------|
| `delegate-task` | `createDelegateTaskTool(delegationManager)` | WaiterModel dispatch to specialist agents |
| `delegation-status` | `createDelegationStatusTool(delegationManager)` | Poll delegation status, retrieve results |
| `run-background-command` | `createRunBackgroundCommandTool(...)` | PTY-backed background command execution |
| `prompt-skim` | `createPromptSkimTool(projectDirectory)` | Fast scan of prompt content |
| `prompt-analyze` | `createPromptAnalyzeTool(projectDirectory)` | Deep prompt analysis |
| `session-patch` | `createSessionPatchTool(projectDirectory)` | Patch session file sections with backup |
| `session-journal-export` | `createSessionJournalExportTool()` | Export session journals as JSON/Markdown |
| `configure-primitive` | `createConfigurePrimitiveTool()` | Configure OpenCode primitives (agent/command/skill) |
| `validate-restart` | `createValidateRestartTool()` | Validate primitive discoverability post-restart |

### Tool Registration Contract

1. **Factories only:** Tools are created via factory functions, never inline in plugin.ts. Each factory receives its dependencies via constructor injection.
2. **No circular deps:** Factories may depend on `DelegationManager`, `LifecycleManager`, or `projectDirectory`. No mutual dependencies.
3. **Zod validation:** All tool arguments validated through Zod schemas. Invalid args are rejected before execution.
4. **Error prefix:** All tool errors throw with `[Harness]` prefix for flow control identification.

## Hook Composition Contract

### Registered Hooks

The plugin registers these hook categories:

| Hook Category | Source | Purpose |
|--------------|--------|---------|
| **Core hooks** | `createCoreHooks(deps)` | Session lifecycle events, event observers, compaction handling |
| **Session hooks** | `createSessionHooks(deps)` | Read-side session state projection, session event observation |
| **Tool guard hooks** | `createToolGuardHooks({ stateManager, lifecycleManager, runtimePolicy })` | Pre-tool-execution guards: tool budget, repeated signature detection, warning cap |
| **Event observers** | `createDelegationEventObserver()` / `createSessionJourneyEventObserver()` | Delegation terminal detection, journey event tracking |
| **Tool execute after** | Inline `tool.execute.after` | Output summarization, audit projection, workflow persistence |

### Hook Composition Rules

1. **Write-side: tools only.** Hooks are read-side and guard-side. No hook mutates session state directly — mutations go through delegation manager or lifecycle manager.
2. **Event observers are cascaded:** `consumeDelegationFact` processes delegation events first, then `sessionEventObserver` processes session events, then `consumeJourneyFact` processes journey events.
3. **Tool guard hooks fire before every tool execution.** Budget checks, signature detection, and warning caps are enforced at this layer.
4. **`tool.execute.after` is best-effort only.** Failures in the after-hook are silently ignored — they never affect tool call results.
5. **Event tracker projection is best-effort.** `createEventTrackerArtifactsFromHook` failures are caught and ignored — audit projections never block canonical event handling.

### Hook Execution Order

```
tool.execute.before (tool guard hooks)
  ↓
tool.execute (actual tool call)
  ↓
tool.execute.after (output summary + audit + workflow persistence)
```

## Session Lifecycle Phases

### Phase State Machine

```
┌──────────┬──────────────────────────────────────────────────┐
│ From     │ To                                               │
├──────────┼──────────────────────────────────────────────────┤
│ created  │ queued, dispatching, running, failed             │
│ queued   │ dispatching, running, failed                     │
│ dispatching │ running, completed, failed                    │
│ running  │ completed, failed                                │
│ completed │ (terminal)                                      │
│ failed    │ (terminal)                                      │
└──────────┴──────────────────────────────────────────────────┘
```

**Implemented in:** `lifecycle-manager.ts` — `VALID_LIFECYCLE_TRANSITIONS` constant
**Validation function:** `isValidTransition(from, to)` — boolean guard
**Terminal check:** `isTerminalPhase(phase)` — true for `completed` and `failed`

### Phase Transitions in Practice

| Trigger | From → To | Handler |
|---------|-----------|---------|
| Plugin init | (none) → created | `recordSessionContinuity()` |
| Delegation dispatched | created → queued | `DelegationManager.dispatch()` → concurrency queue |
| Concurrency slot acquired | queued → dispatching | `DelegationConcurrencyQueue.acquire()` |
| Child session spawned | dispatching → running | `DelegationManager` spawn complete |
| Session idle detected | running → completed | `CompletionDetector.feed("session.idle")` |
| Session error | any → failed | `lifecycleManager.handleEvent()` |

### Session Status Types (OpenCode Runtime)

OpenCode runtime uses a simpler 3-value status model:

| Status | Meaning |
|--------|---------|
| `idle` | No activity — completion signal |
| `busy` | Active tool/model calls in progress |
| `retry` | Auto-loop retry trigger pending |

**Mapping:** `retry` → Harness lifecycle `running` with auto-loop retry. `idle` + stability timer → `CompletionDetector` fires completion.

## Completion Detection Protocol

### Dual-Signal Model

The `CompletionDetector` (`src/lib/completion-detector.ts`) uses two signals for reliable completion detection:

1. **Signal 1: `session.idle` event** — OpenCode fires this when the model stops generating and tool calls complete.
2. **Signal 2: Stability timer** — After the last message count change, a 10-second timer must expire with no new messages.

Both signals must fire for completion. Either alone is insufficient.

### API

```typescript
class CompletionDetector {
  feed(eventType: string, sessionID: string, error?: string): void
  watch(sessionID: string, timeoutMs: number): Promise<CompletionResult>
  cancel(sessionID: string): void
  feedMessageCount(sessionID: string, count: number): void
}

type CompletionResult = {
  signal: "idle" | "error" | "deleted" | "timeout" | "cancelled"
  sessionID: string
  error?: string
}
```

### Configurable Parameters

| Parameter | Default | Source |
|-----------|---------|--------|
| Stability timeout | 10,000 ms (10s) | Constructor parameter (`stabilityTimeoutMs`) |
| Watch timeout | 1,800,000 ms (30 min) | `WATCH_TIMEOUT_MS` in `plugin.ts` |
| Safety ceiling | 1,800,000 ms (30 min) | `DEFAULT_SAFETY_CEILING_MS` in `types.ts` |

## Concurrency Model

### Keyed Semaphore

`DelegationConcurrencyQueue` (`src/lib/concurrency.ts`) implements a keyed FIFO semaphore:

- **Default limit:** 3 concurrent operations per key (`DEFAULT_CONCURRENCY_LIMIT`)
- **Queue keys** built from `provider`, `model`, `agent`, or `category` in priority order
- **Priority:** `high` and `normal` queues per lane
- **Acquire with timeout:** optional `timeoutMs` rejects with `[Harness]` error on timeout
- **Release chain:** released slots are offered to next pending acquirer in FIFO order

### Concurrency Policy Defaults

| Parameter | Default | Source |
|-----------|---------|--------|
| Global limit | 3 | `DEFAULT_RUNTIME_POLICY.concurrency.globalLimit` |
| Per-key limit | Same as global (unless overridden) | `runtimePolicy.concurrency.perKey` |
| Acquire timeout | None (waits indefinitely) unless per-key override | `runtimePolicy.concurrency.perKey[key].acquireTimeoutMs` |
| Override | `OPENCODE_HARNESS_CONCURRENCY_LIMIT` env var | `lifecycle-manager.ts` |

### Descendant Budget

`SpawnReservation` (`src/lib/concurrency.ts`) enforces per-root-session descendant limits:

- **Max descendants per root:** 10 (`MAX_DESCENDANTS_PER_ROOT`)
- **Reservation lifecycle:** `reserveSubagentSpawn()` → `release()` on success or `rollback()` on failure
- **Budget exhaustion:** throws `[Harness]` error, handled by caller

### Delegation Limits

| Constraint | Value | Source |
|-----------|-------|--------|
| Max nesting depth | 3 | `MAX_DELEGATION_DEPTH` in `types.ts` |
| Max delegations before prune | 50 | `MAX_DELEGATIONS_BEFORE_PRUNE` in `types.ts` |
| Prune max age | 30 min | `DEFAULT_PRUNE_MAX_AGE_MS` in `types.ts` |
| Task cleanup delay | 10 min | `TASK_CLEANUP_DELAY_MS` in `types.ts` |

## Budget Policy

### Default Budget

```typescript
budget: {
  maxToolCallsPerSession: 400,
  repeatedSignatureThreshold: 16,
  warningCap: 25,
  resetOnCompact: true,
}
```

| Parameter | Default | What it does |
|-----------|---------|-------------|
| `maxToolCallsPerSession` | 400 | Hard limit on tool calls per session |
| `repeatedSignatureThreshold` | 16 | Number of repeated tool signatures before flagging |
| `warningCap` | 25 | Max warnings stored per session in `taskState` |
| `resetOnCompact` | true | Whether budget resets on context compaction |

### Policy Resolution

1. Workspace-level policy loaded from workspace config via `resolveWorkspaceRuntimePolicy()`
2. Merged with `DEFAULT_RUNTIME_POLICY` via `loadRuntimePolicy()`
3. Per-session overrides resolved via `getRuntimePolicyForSession()` — overrides come from trusted continuity/delegation metadata only (not arbitrary tool args)
4. All policies validated: positive limits, valid ranges, non-nullable fields

## Session API Wrappers

`session-api.ts` provides typed wrappers around the OpenCode SDK. All wrappers enforce:

| Rule | Enforcement |
|------|-------------|
| Session ID validation | `assertValidSessionID()` — must start with `ses_` (or test prefix for NODE_ENV=test) |
| Error prefix | All errors prefixed with `[Harness]` |
| Deep-clone safety | No — caller must handle immutability |
| Sync prompt fallback | If `session.prompt` returns empty string, polls for assistant response (30s timeout, 1s interval) |

### Available Wrappers

| Function | Signature | Purpose |
|----------|-----------|---------|
| `createSession` | `(client, opts) → SessionRecord` | Create child session with parentID |
| `getSession` | `(client, sessionID) → SessionRecord` | Retrieve session by ID |
| `getSessionStatusMap` | `(client) → Record<string, {type}>` | Get idle/busy/retry status for all sessions |
| `abortSession` | `(client, sessionID) → unknown` | Abort a running session |
| `getSessionMessages` | `(client, sessionID, opts?) → unknown[]` | Retrieve session messages |
| `getSessionMessageCount` | `(client, sessionID) → number\|null` | Count messages (returns null on error) |
| `sendPrompt` | `(client, sessionID, body) → unknown` | Send prompt with sync fallback |
| `sendPromptAsync` | `(client, sessionID, body) → void` | Send prompt asynchronously (returns 204) |
| `getSessionID` | `(session) → string\|undefined` | Extract session ID from session object |
| `getParentID` | `(session) → string\|undefined` | Extract parent ID from session object |
| `getEventSessionID` | `(event) → string\|undefined` | Extract session ID from event |
| `getEventParentID` | `(event) → string\|undefined` | Extract parent ID from event |
| `walkParentChain` | `(client, sessionID) → SessionRecord[]` | Walk session parent chain with cycle detection |

## Trusted Runtime Policy

```typescript
trustedRuntime: {
  builtinAsyncBackgroundChildSessions: false,  // Default: disabled
}
```

- When `true`: allows `sendPromptAsync()` for background delegation tasks (WaiterModel)
- When `false`: all prompts use synchronous `sendPrompt()` with fallback polling
- Set at workspace level, validated by `validateTrustedRuntimePolicy()`

## Task Status Transitions

```typescript
type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "error" | "cancelled" | "interrupt"

VALID_TRANSITIONS = {
  pending:    [queued, cancelled],
  queued:     [running, failed, cancelled],
  running:    [completed, failed, error, cancelled, interrupt],
  completed:  [],
  failed:     [],
  error:      [],
  cancelled:  [],
  interrupt:  [running, queued],
}
```

**Terminal statuses:** `completed`, `failed`, `error`, `cancelled` — validated by `isTerminal(status)`.

## Delegation Status (separate from Task Status)

```typescript
type DelegationStatus = "dispatched" | "running" | "completed" | "error" | "timeout"

VALID_DELEGATION_TRANSITIONS = {
  dispatched: [running, completed, error, timeout],
  running:    [completed, error, timeout],
  completed:  [],
  error:      [],
  timeout:    [],
}
```

**Key distinction:** `TaskStatus` tracks the session-level work state. `DelegationStatus` tracks the delegation dispatch lifecycle. A session can complete (`TaskStatus: completed`) while its delegation record shows a different terminal state.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Plug-n-Play** | Adding a tool without registering it in the plugin's `tool:` map | Tools must be registered in `src/plugin.ts` return object. No dynamic tool registration. |
| **The Hook Mutator** | Hook modifies session state directly (bypassing delegation/lifecycle manager) | Hooks are read-side/guard-side only. Use `DelegationManager` or `LifecycleManager` for mutations. |
| **The Order Violator** | Initializing lifecycle manager before delegation manager | Follow the exact plugin load order. `delegationManager.recoverPending()` must run before `hydrateFromContinuity()`. |
| **The Sync Blocker** | Making tool calls synchronous when async is appropriate | Use `sendPromptAsync()` for background tasks when `builtinAsyncBackgroundChildSessions: true`. |
| **The Budget Buster** | Ignoring tool budget limits in tool implementation | `tool.execute.before` hooks enforce budgets. Tools that bypass hooks (direct SDK calls) won't be counted. |
| **The Depth Violator** | Delegating beyond nesting depth 3 | `MAX_DELEGATION_DEPTH = 3`. Poll existing delegation results instead. |

## Self-Correction

### When Tool Registration Fails

[Detection] If a tool throws at runtime about unknown tools, check `src/plugin.ts` — the tool must be listed in the `tool:` return map. Factory functions must be called with correct dependencies.

[Recovery] Verify the tool is in the `tool:` map. Check that the factory function exists and is imported. Check that factory dependencies are passed in the correct order.

### When Lifecycle Phase Transition Is Rejected

[Detection] If `isValidTransition()` returns false or a transition silently fails, check the `VALID_LIFECYCLE_TRANSITIONS` table against the current phase. The phase state machine is strict — only documented transitions are allowed.

[Recovery] The current phase must be one of: created, queued, dispatching, running, completed, failed. If the phase is not in this set, it's corrupted state — check `session-continuity.json` for the current `lifecycle.phase` value.

### When Completion Detection Never Fires

[Detection] If a session stays in `running` phase indefinitely, the dual-signal completion protocol may not have both signals. Check: (1) Did `session.idle` event fire? (2) Did the 10-second stability timer expire? Both are required.

[Recovery] If `session.idle` is not firing, the OpenCode runtime hasn't detected idle state — model may still be generating or a tool call may be hanging. If stability timer isn't expiring, messages may still be arriving — check `feedMessageCount()` calls. Default watch timeout (30 min) will trigger `timeout` if neither signal fires.

### When Concurrency Acquire Hangs

[Detection] If `DelegationConcurrencyQueue.acquire()` never resolves, the semaphore lane may be saturated. Check `snapshot(key)` for active count vs limit. Check if any active holders have released.

[Recovery] If `acquireTimeoutMs` is set in the policy, the acquire will reject after the timeout. If not set, it waits indefinitely. Pruning (at 50 delegations, 30 min age) eventually cleans up stale holders.

### When Budget Is Exceeded

[Detection] If tool calls are being rejected with budget errors, check `getRuntimePolicyForSession()` — the per-session policy may have been overridden to a lower value. Also check if `resetOnCompact` is false — budget won't reset on context compaction.

[Recovery] Budget resets require either: (1) `resetOnCompact: true` + context compaction, or (2) workspace-level policy update via `resolveWorkspaceRuntimePolicy()`. Per-session overrides can only lower the budget, never raise it beyond the workspace default.

### When the User Wants to Add a New Tool

[Detection] If the user asks to "add a tool to the harness" — this is an engine modification, not a reference lookup. Redirect to the plugin code: create a factory function in `src/tools/`, register the tool in `src/plugin.ts` `tool:` map, add Zod validation for args, wire dependencies.

[Recovery] Reference this skill for the tool registration contract. The user must modify `src/plugin.ts` and create the tool factory — skills cannot add tools dynamically.

---

**Cross-reference:** See `hm-l3-hivemind-state-reference` for the `.hivemind/` state structure that engines produce and consume.
**Source verification:** All contracts verified against `src/plugin.ts` and `src/lib/` source code (2026-04-30).
**Q1-Q6 Validation:** Engine contracts conform to Q1 (runtime taxonomy), Q3 (session journal), Q5 (RICH gate quality), Q6 (`.hivemind/` state root).
