# Harness Plugin Rebuild Design v3

**Date:** 2026-04-02
**Branch:** harness-experiment
**Status:** Ready for execution

---

## Verified SDK Facts

| Claim | Verified | Evidence |
|---|---|---|
| `session.prompt()` blocks until assistant response | ✅ YES | `/session/{id}/message` POST returns `AssistantMessage` (200) only when AI finishes |
| `session.promptAsync()` fires and forgets | ✅ YES | `/session/{id}/prompt_async` POST returns `void` (204) |
| `session.idle` event exists | ✅ YES | `types.gen.d.ts:413-418` — `EventSessionIdle` with `properties.sessionID` |
| `noReply: true` prevents AI response | ❌ NO | AI STILL processes the message; `noReply` just returns `UserMessage` without waiting. NOT safe for notification injection. |
| Agent `.md` files set temperature/model/permissions | ✅ YES | Agent docs confirm frontmatter-driven config |

## What the Platform Already Does (Don't Reimplement)

| Capability | Platform mechanism | What we should NOT build |
|---|---|---|
| Agent permissions | `.opencode/agents/*.md` `permission:` frontmatter | `getPermissionRulesForAgent()`, `RESTRICTED_TOOLS_PER_AGENT` |
| Temperature routing | `.opencode/agents/*.md` `temperature:` frontmatter | `AGENT_TEMPERATURES` |
| Model selection | `.opencode/agents/*.md` `model:` frontmatter | `CATEGORY_CONFIGS` model overrides |
| Tool restriction | `.opencode/agents/*.md` `permission: edit: deny` | `isToolRestrictedForAgent()` |
| Prompt blocking | `session.prompt()` returns `AssistantMessage` when done | No need for completion detection in sync mode |

## What the Plugin Adds That the Platform Does NOT

1. **BackgroundManager** — Task lifecycle state machine: `created → queued → dispatching → running → completed/error/cancelled/interrupt`
2. **Completion detection** — Two signals: `session.idle` event + stability detection (message count unchanged for configurable time)
3. **Notification flow** — Write completion metadata to `.harness/state/` instead of injecting into parent session (avoids triggering AI response)
4. **Task status types** — Replaces `SessionContinuityMetadata.status` (old 4-value) with 7-value system
5. **Stability detection** — After `session.idle`, waits for message count to stabilize before declaring completion
6. **ConcurrencyManager** — FIFO queue per model+agent+category key, limits concurrent tasks
7. **Circuit breaker** — Tool signature loop detection (16 repeated calls)
8. **Descendant budget** — MAX_DESCENDANTS_PER_ROOT=10
9. **Delegation depth limit** — MAX_DEPTH=3
10. **Continuity persistence** — Durable JSON for delegation metadata
11. **Shell hardening** — CI=true, NO_COLOR=1, TERM=dumb
12. **Tool call budget** — MAX_TOOL_CALLS_PER_SESSION=400
13. **Metadata enrichment** — `tool.execute.after` adds harness context

## Architecture

### Design Patterns

- **Factory**: `createHarnessLifecycleManager(options)` — composition root
- **Composition**: Separate concerns into focused modules, compose in lifecycle-manager
- **Handler**: Each lifecycle phase transition is a handler function
- **State machine**: Task status types with defined transitions and guards

### Notification Flow (revised — no noReply injection)

Since `noReply: true` still triggers AI processing, the notification flow writes completion metadata to the continuity store. The parent conductor discovers completion through:
1. Continuity store status updates (the parent can query it)
2. The `event` hook updates the continuity record
3. The conductor's `tool.execute.after` hook includes harness metadata showing which background tasks completed

This avoids any message injection and works correctly with the platform.

## Files to DELETE

| File | LOC | Reason |
|---|---|---|
| `routing.ts` | 113 | Agent `.md` files define temperature/model |
| `runtime.ts` | 154 | Platform tracks effective agent/model/temperature |
| `session-completion-tracker.ts` | 81 | Replace with `completion-detector.ts` with stability |
| `src/lib/AGENTS.md` | 60 | Will be rewritten |

## Files to REWRITE

### `session-api.ts` (212 → ~90 LOC)
**Keep:** 10 typed wrapper functions
**Delete:** `sendPromptAsync`, `extractAssistantText`, `waitForAssistantText`
**Delete:** Completion detection (moves to `completion-detector.ts`)

### `helpers.ts` (141 → ~60 LOC)
**Keep:** `isObject`, `getNestedValue`, `asString`, `unwrapData`, `stableStringify`, `makeToolSignature`, `getPromptToolCompatibility`
**Delete:** `RESTRICTED_TOOLS_PER_AGENT`, `AGENT_REQUIRED_TOOLS`, `AGENT_MUST_NOT`, `buildPromptText()`, `isToolRestrictedForAgent()`, `sleep()`

### `lifecycle-manager.ts` (688 → ~350 LOC)
**Keep and IMPROVE:** Budget tracking, concurrency queue, continuity recording, event hydration, lifecycle state machine, `cancelDelegatedSession`
**Rewrite:** `launchDelegatedSession` — sync uses blocking `sendPrompt`, async uses `sendPrompt` with detached background + completion-detector
**Add:** Completion detection via new `CompletionDetector` with stability
**Add:** Completion metadata written to continuity store (notification flow)
**Delete:** `pollIntervalMs` from options
**Rename:** `pollTimeoutMs` → `watchTimeoutMs` (still needed for async observation)

### `plugin.ts` (481 → ~320 LOC)
**Keep:** `tool.execute.before` (circuit breaker + tool budget), `tool.execute.after` (metadata), `event` hook, `compacting` hook, `shell.env` hook, `delegate-task` tool, `chat.params` hook
**Delete:** `getPermissionRulesForAgent()`, `normalizeCategory()`, routing imports, runtime imports
**Simplify:** delegate-task → validate depth+budget → create session → prompt (sync) or fire-and-forget (async) → return

## New Modules

### `task-status.ts` (~100 LOC)

Task status type system with transition guards. REPLACES the old 4-value `SessionContinuityMetadata.status` (created/running/completed/failed) with 7-value system:

```typescript
type TaskStatus = "pending" | "queued" | "running" | "completed" | "error" | "cancelled" | "interrupt"

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending:    ["queued", "cancelled"],
  queued:     ["running", "cancelled"],
  running:    ["completed", "error", "cancelled", "interrupt"],
  completed:  [],
  error:      [],
  cancelled:  [],
  interrupt:  ["running", "queued"],
}

function canTransition(from: TaskStatus, to: TaskStatus): boolean
```

### `completion-detector.ts` (~120 LOC)

Handler that detects session completion through two signals:

```typescript
type CompletionResult = {
  signal: "idle" | "error" | "deleted" | "timeout" | "cancelled"
  sessionID: string
  error?: string
}

class CompletionDetector {
  private watchers = new Map<string, Watcher>()
  private cachedResults = new Map<string, CompletionResult>()

  // Feed events into the detector (called by lifecycle-manager handleEvent)
  feed(eventType: string, sessionID: string, error?: string): void

  // Watch for completion (called by lifecycle-manager for async tasks)
  watch(sessionID: string, timeoutMs: number): Promise<CompletionResult>

  // Cancel observation
  cancel(sessionID: string): void
}
```

Stability detection: On `session.idle`, start a timer (default 10s). If no new messages arrive before timer fires, emit `idle`. If new messages arrive, reset timer.

### New `SessionContinuityMetadata.status` type

Changes from 4-value to 7-value:

```typescript
status: "pending" | "queued" | "running" | "completed" | "error" | "cancelled" | "interrupt"
```

This is a BREAKING CHANGE to the continuity JSON format. Version bump from 1 to 2.

## New `delegate-task` Flow

### Sync (run_in_background=false)
1. Validate depth via `walkParentChain` + budget via `reserveDescendant`
2. Create child session via `createSession(client, { parentID, title })`
3. Call `sendPrompt(client, sessionID, body)` — **blocks until assistant completes, returns AssistantMessage**
4. Extract text from response parts
5. Record continuity with status "completed"
6. Return text to conductor

### Async (run_in_background=true)
1. Same validation
2. Create child session
3. Set task status to "running"
4. Call `sendPrompt()` — **detached, does NOT await** (the prompt blocks server-side)
5. Set status to "running" in continuity store
6. Return JSON metadata to conductor immediately
7. Event hook receives `session.idle` → feeds to completion-detector
8. Completion-detector waits for stability → emits `idle` signal
9. Lifecycle manager updates continuity status to "completed"
10. Parent conductor sees completion via metadata in `tool.execute.after`

## Test Strategy

| Module | Tests |
|---|---|
| `task-status.ts` | Status type tests, transition guards, all valid transitions |
| `completion-detector.ts` | Feed idle/error/deleted, watch returns Promise, stability detection, cancel, timeout |
| `session-api.ts` | Typed wrappers, mock client, verify call shapes |
| `helpers.ts` | Pure function tests for all 7 utilities |
| `state.ts` | Budget tracking, stats, delegation meta |
| `lifecycle-manager.ts` | Budget + concurrency + continuity + lifecycle state |
| `concurrency.ts` | FIFO queue, acquire/release, snapshot |

## Execution Order

1. Delete `routing.ts`, `runtime.ts`, `session-completion-tracker.ts`
2. Create `task-status.ts` with transition guards + tests
3. Rewrite `helpers.ts` — remove agent config maps, keep utilities
4. Rewrite `session-api.ts` — remove completion detection, keep typed wrappers
5. Create `completion-detector.ts` with stability detection + tests
6. Rewrite `lifecycle-manager.ts` — use new detector, simplify launch
7. Rewrite `plugin.ts` — remove permission factory, simplify delegate-task
8. Rewrite tests for all modules
9. Verify typecheck + tests + build
