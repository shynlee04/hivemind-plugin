# Deep Synthesis Report: Phases 21, 21.1, 21.2, 22

**Synthesized:** 2026-05-22
**Domains:** Session-tracker persistence, execute-slash-command SDK redesign, front-agent switching, coordination status/error unification
**Files consumed:** 70+ `.md` files across 4 phase directories
**Source:** `.planning/phases/21-session-tracker-design-fix/`, `21.1-*/`, `21.2-*/`, `22-*/`

---

## Phase-by-Phase Summary

| Phase | Name | Status | Plans | Files Modified | Requirements | Duration |
|-------|------|--------|-------|----------------|--------------|----------|
| **21** | Session-Tracker Design Fix | ✅ COMPLETE | 6 plans (01-06) | 19 files (10 src, 8 test, 1 integration) | 15 (REQ-21-01 to REQ-21-15) | ~56 min |
| **21.1** | Execute-Slash-Command SDK Redesign | ✅ COMPLETE | 3 plans (01-03) | 8 files (3 src, 2 test, 3 command-engine) | 7 (REQ-01 to REQ-07) | ~20 min |
| **21.2** | Front-Agent Switch One-Shot Override | ✅ SUPPORTED | 2 plans (01-02) | 4 files (prototype + governance) | 7 (AC-01 to AC-07) | ~15 min |
| **22** | Coordination Status + Error Unification | ✅ COMPLETE | 3 plans (01-03) | 7 files (4 src, 3 test + 2 Rule-3 fixups) | 9 (P22-01 to P22-09) | ~32 min |

### Verification Totals

| Phase | Test Count | Typecheck | Gate Status |
|-------|-----------|-----------|-------------|
| 21 | 2359/2361 pass (2 pre-existing skips) | ✅ | ✅ Passed (15/15 truths) |
| 21.1 | 2371 pass, 2 skipped | ✅ | ✅ L2 unit/build; L1 UAT pending restart |
| 21.2 | 7/7 tool tests, typecheck ✅ | ✅ | ✅ **L1 SUPPORTED** via live UAT |
| 22 | 176/176 coordination tests | ✅ | ✅ Triad: Lifecycle/Spec/Evidence all PASS |

---

## 1. Phase 21: Session-Tracker Design Fix (F-01 through F-22)

### What Was Built/Delivered

**6 flaw categories surgically fixed:**

| Flaw | Severity | Fix | Key Files |
|------|----------|-----|-----------|
| **F-01** (temp leak) | CRITICAL | `unlink(tmpPath)` after every `rename()` in ALL 3 write-tmp-rename sites | `atomic-write.ts`, `hierarchy-manifest.ts` |
| **F-02/F-17** (manifest asymmetry) | HIGH | Manifest becomes derivative cache: `generateFromContinuity()` walks continuity tree | `hierarchy-manifest.ts` |
| **F-07** (recovery blindness) | HIGH | `rebuildChildToRootMain()` called from `buildFromDisk()` as 3rd pass | `hierarchy-index.ts` |
| **F-13** (MAX_DEPTH guard) | MEDIUM | `MAX_DEPTH=20` guard in `ensureAncestorRoute()` | `session-tracker/index.ts` |
| **F-18** (anonymous children) | CRITICAL | `backfillChildMetadata()`, explicit agentName params in `writeImmediateChildFile()` | `child-writer.ts`, `event-capture.ts` |
| **F-19** (childCount=0) | HIGH | `computeChildCount()`/`computeMaxDepth()` in `updateSession()` | `project-index-writer.ts`, `hierarchy-index.ts` |

**8 gray-area decisions applied:**
- G-1: Manifest = derivative cache (generate from continuity tree on read)
- G-2: childToRootMain = reconstruct from continuity tree (no new file format)
- G-3: project-continuity.json = canonical status authority
- G-4: Remove commit_docs gate from delegation-persistence
- G-5: Clean temp after EVERY write + volume validation
- G-6: No parent in continuity = orphan (warning-only guardrail)
- G-7: Keep depth=2 cap with runtime warning
- G-8: Defer per-session timestamps to P22

### Key Functions/Types/Signatures Added

1. **`atomic-write.ts`**: `unlink(tmpPath)` after rename; cross-volume `stat().dev` comparison
2. **`hierarchy-index.ts`**: `getChildCountForSession()`, `getMaxDepthForSession()`, `rebuildChildToRootMain()`
3. **`project-index-writer.ts`**: `computeChildCount()`, `computeMaxDepth()`, status preservation
4. **`hierarchy-manifest.ts`**: `generateFromContinuity()` — walks continuity tree producing flat manifest
5. **`child-writer.ts`**: `backfillChildMetadata()` — reuses enqueueWrite pipeline
6. **`event-capture.ts`**: `writeImmediateChildFile()` accepts `explicitAgentName`, `explicitModel`; backfill calls on `session.deleted`/`session.error`
7. **`orphan-cleanup.ts`**: `checkContinuityTree()` guardrail
8. **`session-tracker/index.ts`**: MAX_DEPTH=20 guard
9. **`delegation-persistence.ts`**: Removed `commit_docs` gate

### Integration Test (phase-21.test.ts) — 5 phases

```
Phase 1: 100 atomic writes → 0 .tmp.* files          (F-01)
Phase 2: root + 3 children → childCount=3, maxDepth=2 (F-19)
Phase 3: child file shows real agent name              (F-18)
Phase 4: buildFromDisk → getRootMain works for all     (F-07)
Phase 5: status preserved across repeated addSession   (G-3)
```

### Hotfix Applied (after verification)

- **Gate 0 pendingCount > 1 bail** (double classification bug): Removed `pendingCount > 1` ternary guard, replaced with single `getAnyActiveEntry()` call
- Commit: `5690b670`
- Status: PENDING LIVE VERIFICATION

---

## 2. Phase 21.1: Execute-Slash-Command SDK Redesign

### Complete Execute-Slash-Command Dispatch Flow

```
                                        execute-slash-command tool
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
         [Non-subtask path]           [Subtask path]              [Synthetic parent prompt]
         (default)                    (subtask:true)              (subtask:false + agent)
                    │                           │                           │
                    ▼                           ▼                           ▼
    TUI clearPrompt →         Expand $ARGUMENTS              Expand $ARGUMENTS
    appendPrompt("/cmd")      in command body                in command body
    submitPrompt()             │                             │
                               ▼                             ▼
                    Defer client.session.           Defer client.session.
                    prompt({                        prompt({
                      agent,                          agent,
                      parts: [{                       parts: [{
                        type: "subtask",                 type: "text",
                        agent,                           text: expandedBody
                        prompt: expandedBody,           }]
                        description                    })
                      }]                    metadata: mode:
                    })                    "synthetic-parent-prompt"
                    metadata: mode:        (bypasses native
                    "subtask"              command parsing)
```

### New Dispatch Paths

| Path | Trigger | Mechanism |
|------|---------|-----------|
| **SDK session.command()** | Non-subtask command | `client.session.command({ path: { id }, body: { command, arguments, agent?, model? } })` |
| **TUI append+submit** | Fallback when SDK fails | `client.tui.clearPrompt()` → `appendPrompt()` → `submitPrompt()` |
| **SubtaskPartInput** | Frontmatter `subtask: true` | `client.session.prompt({ agent, parts: [{ type: "subtask", agent, prompt, description }] })` |
| **Synthetic parent prompt** | `subtask: false + agent` | `client.session.prompt({ agent, parts: [{ type: "text", text }] })` |

### Agent Switching: Two Mechanisms

**Mechanism (a)** — simple agent switch via SDK:
```typescript
const effectiveAgent = args.agent || frontmatterAgent
await client.session.command({
  path: { id: sessionID },
  body: { command: args.command, arguments, agent: effectiveAgent, model: effectiveModel },
  query: { directory: ctx.directory },
})
```

**Mechanism (b)** — run-as-then-restore:
```typescript
const currentAgent = ctx.agent  // cache for restore
// Dispatch under target agent
await client.session.command({ path: { id: sessionID }, body: { command, arguments, agent: targetAgent } })
// Restore prior agent
await client.session.command({ path: { id: sessionID }, body: { command: "", arguments: "", agent: currentAgent } })
```

### Key Design Correction (Live UAT Disproved Original Design)

**The original SDK-await design was rejected by live behavior:**
- `session-ses_1b48.md:12903-12918`: `execute-slash-command` hung until user aborted
- `session-ses_1b48.md:12932-12947`: Subtask payload appeared only after cancellation
- **Root cause:** Awaiting `client.session.prompt()` from inside tool execution hangs because the active session is still running the tool

**Corrected design:** Deferred scheduling — tool returns immediately, `client.session.prompt()` runs after tool return via `setTimeout` callback. Errors caught and logged with `[Harness]` prefix.

### What Changed

| File | Change |
|------|--------|
| `src/tools/session/execute-slash-command.ts` | Complete rewrite: SDK-first + TUI fallback + 2 agent mechanisms + subtask routing + preflight + standard envelope |
| `src/routing/command-engine/types.ts` | Extended `CommandBundle` with `model?: string`, `subtask?: boolean` |
| `src/routing/command-engine/index.ts` | `discoverCommandBundles()` propagates model/subtask from frontmatter |
| `tests/tools/execute-slash-command.test.ts` | Rewritten: 7 tests covering all REQs |

### Tool Args Schema (After)

```typescript
args: {
  command: tool.schema.string().describe("Command name (without leading slash)"),
  arguments: tool.schema.string().optional().describe("Arguments string"),
  agent: tool.schema.string().optional().describe("Agent to dispatch under"),
  model: tool.schema.string().optional().describe("Model override"),
  restore: tool.schema.boolean().optional().describe("Restore prior agent after dispatch"),
}
```

---

## 3. Phase 21.2: Front-Agent Switching — Synthetic Parent Prompts

### How Synthetic Parent Prompts Work

The prototype path for `subtask:false + agent`:

1. **Command discovery:** Load command via existing command discovery (or SDK `command.list()`)
2. **Agent resolution:** `args.agent || frontmatterAgent` (explicit > frontmatter precedence)
3. **Body expansion:** Replace `$ARGUMENTS` in command body with actual arguments
4. **Deferred dispatch:** Schedule `client.session.prompt()` after tool return:
   ```typescript
   // Deferred — NOT awaited (avoids busy-session deadlock)
   setTimeout(() => {
     client.session.prompt({
       path: { id: sessionID },
       body: {
         agent: resolvedAgent,
         parts: [{ type: "text", text: expandedBody }],
       },
     }).catch((err) => {
       console.error("[Harness] Deferred slash command prompt dispatch failed:", err)
     })
   }, 50)
   ```
5. **Metadata:** `mode: "synthetic-parent-prompt"` — explicitly labeled as non-native
6. **Tool returns immediately** — no waiting for SDK response

### Agent Override

- Tool provides `agent` and optionally `subtask` as one-shot overrides
- No command or agent configuration files are mutated
- Frontmatter is read at runtime but not persisted

### Live UAT Outcome

| Case | Input | Verdict |
|------|-------|---------|
| **Synthetic parent prompt** | `subtask:false, agent:gsd-executor` | ✅ **SUPPORTED** — OpenCode accepts subagent-mode agent for direct parent prompt |
| Baseline subtask | `subtask:true, agent:gsd-executor` | ✅ SUPPORTED |
| TUI control | No overrides | ✅ SUPPORTED |

**Key discovery from UAT:** OpenCode does NOT reject subagent-mode agents for direct `session.prompt()` calls. The `gsd-executor` agent responded in the parent session successfully.

### UAT 1 Failure Root Cause

First UAT attempt failed because `dist/` was stale — prototype code only existed in `src/`, not `dist/`. After rebuild (`npm run build`), the prototype path was active and worked.

---

## 4. Phase 22: Coordination Status + Error Unification

### Notification Delivery Chain — COMPLETE

The exact flow from delegation completion through notification to parent session:

```
Delegation completes (completion/error/timeout)
        │
        ▼
DelegationCoordinator / StateMachine
  → transitionToTerminal(status)
        │
        ▼
CompletionDetector
  → NotifyCompletion(completionSignal)
  → Converts session events to CompletionSignal (idle/error/deleted/timeout/cancelled)
  → TERMINAL_EVENTS = { "session.idle": "idle", "session.error": "error", "session.deleted": "deleted" }
        │
        ▼
NotificationRouter.register(delegationId, parentSessionId)
  → Creates routing entry: this.routes.set(delegationId, { parentSessionId, notifications: [] })
        │
        ▼
NotificationRouter.route(notification)
  → Checks shouldQueuePending() [Phase 22 new]:
      ├── retryCount >= maxRetries? → DROP silently
      ├── expiresAt <= Date.now()? → DROP silently
      └── Passes → queuePending()
  → queuePending(delegationId, notification):
      ├── Checks TTL (expiresAt <= Date.now()) → DROP
      ├── Checks retry count (retryCount >= maxRetries) → DROP
      ├── Increments retryCount
      ├── Checks idempotencyKey against deliveredKeys
      └── Pushes to route.notifications[]
  → Calls persistAllPending() → serializes to PendingNotificationRecord[]
        │
        ▼
[On session.created/updated — LifecycleManager]
  → notificationRouter.replayPending(parentSessionId)
      ├── Iterates this.routes.entries()
      ├── Filters expired (expiresAt <= Date.now()) → PURGE from Map
      ├── Filters exhausted (retryCount >= maxRetries) → PURGE from Map
      └── Returns valid DelegationNotification[] sorted by timestamp
        │
        ▼
[How notifications reach parent session]
  → sendPrompt() / session.prompt() is called by LifecycleManager
  → NOT awaited directly in Phase 22 — the notification is placed into the
    pending queue, and replayPending() returns it when the parent session
    lifecycle triggers a replay

NOT in Phase 22 scope: The actual session.prompt() call that delivers the
notification to the parent session. This is owned by LifecycleManager and
plugin.ts orchestration. Phase 22 only ensures reliable queuing with
retry/TTL.
```

### The Exact SDK Method Calls

None of the Phase 22 changes involve direct SDK method calls. The notification delivery to the parent session works through **pending notification replay**, not through direct `sendPrompt()` calls. The Phase 22 research confirms:

1. `NotificationRouter` maintains an in-memory `routes` Map with `PendingNotificationRecord[]`
2. When a delegation completes, `route()` queues a notification with retryState tracking
3. `replayPending()` is called by LifecycleManager when the parent session is ready
4. The actual `session.prompt()` or `sendPrompt()` call is **NOT inside notification-router.ts** — it happens in `plugin.ts` orchestration or LifecycleManager

### Difference from "Append System Message to Session History and Reactivate Stream"

The current Phase 22 notification design is fundamentally different from an "append system message + reactivate stream" model:

| Aspect | Append+Reactivate Model | Phase 22 Notification-Router Model |
|--------|------------------------|-----------------------------------|
| **Mechanism** | Write to session message history, signal stream to continue | Queue `DelegationNotification` for replay on parent lifecycle |
| **When delivered** | Immediately after completion | On next `replayPending()` call by LifecycleManager |
| **Reliability** | Fire-and-forget | Retry (maxRetries=1) + TTL (5min) + idempotency |
| **Persistence** | In-memory only | Via `persistAllPending()` → `PendingNotificationRecord[]` |
| **Parent session impact** | Active interruption of parent stream | Passive — parent reads from queue when ready |
| **Delivery guarantee** | Best-effort (send once) | At-least-once with retry, dropped only on exhaustion/expiry |
| **Schema type** | None (raw message) | `DelegationNotification` / `PendingNotification` / `PendingNotificationRecord` |

### DelegationErrorCode — The 12 Codes

```typescript
export const DelegationErrorCode = {
  SLOT_LIMIT_REACHED: "SLOT_LIMIT_REACHED",
  SLOT_ACQUIRE_TIMEOUT: "SLOT_ACQUIRE_TIMEOUT",
  PER_KEY_LIMIT_REACHED: "PER_KEY_LIMIT_REACHED",
  UNKNOWN_AGENT: "UNKNOWN_AGENT",
  CHILD_SESSION_FAILED: "CHILD_SESSION_FAILED",
  CANNEL_TERMINAL: "CANNEL_TERMINAL",
  ADJUST_PROMPT_NO_SESSION: "ADJUST_PROMPT_NO_SESSION",
  CHANGE_AGENT_NO_SESSION: "CHANGE_AGENT_NO_SESSION",
  RESUME_NO_PROMPT: "RESUME_NO_PROMPT",
  RUNTIME_NOT_CONFIGURED: "RUNTIME_NOT_CONFIGURED",
  QUEUE_KEY_DRIFT: "QUEUE_KEY_DRIFT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const
```

### DelegationError — The Struct

```typescript
export interface DelegationError {
  code: DelegationErrorCode    // Machine-readable error code
  message: string               // Human-readable description
  sessionId?: string            // Optional: which session caused the error
  timestamp: number             // Unix epoch milliseconds (Date.now())
}
```

### delegationStatusToHarnessStatus — The Mapping

```typescript
export function delegationStatusToHarnessStatus(status: DelegationStatus): HarnessStatus {
  const map: Record<DelegationStatus, HarnessStatus> = {
    dispatched: "pending",
    running: "running",
    completed: "completed",
    error: "error",
    timeout: "error",  // No "timeout" in HarnessStatus
  }
  return map[status]
}
```

### Notification Retry/TTL Design

```typescript
// RetryState tracked per-delegation
private readonly retryState = new Map<string, {
  retryCount: number    // Starts at 1 on first failure
  maxRetries: number    // Default: 1
  expiresAt: number     // Default: Date.now() + 5 * 60 * 1000 (5 min)
}>()

// Gate method: called BEFORE queuePending() in both sync route() and async finalizeDelivery()
shouldQueuePending(delegationId: string): boolean {
  const state = this.retryState.get(delegationId)
  if (!state) return true  // No retry state → always allow first queue
  if (state.expiresAt <= Date.now()) {
    this.retryState.delete(delegationId)  // Purge expired
    return false  // Silently drop
  }
  if (state.retryCount >= state.maxRetries) {
    this.retryState.delete(delegationId)  // Purge exhausted
    return false  // Silently drop
  }
  state.retryCount++
  return true
}
```

### PendingNotificationRecord Schema (After Plan 22-02)

```typescript
export interface PendingNotificationRecord {
  parentSessionId: string
  notification: DelegationNotification
  stateRoot: ".hivemind"
  retryCount: number
  maxRetries: number
  expiresAt: number
}
```

### PendingNotification Schema (After Plan 22-03)

```typescript
export type PendingNotification = TaskNotification & {
  createdAt: number
  delivered: boolean
  retryCount: number      // NEW: track retry attempts across restarts
  maxRetries: number      // NEW: configurable retry limit
}
```

### Status Universe Map (5 enums, kept separate)

| Enum | Values | Location | Phase 22 Action |
|------|--------|----------|-----------------|
| `TaskStatus` | 8: pending, queued, running, completed, failed, error, cancelled, interrupt | `src/shared/task-status.ts` | No change |
| `DelegationStatus` | 5: dispatched, running, completed, error, timeout | `src/coordination/delegation/types.ts` | Input to mapping function |
| `HarnessStatus` | 9: pending, queued, dispatching, running, completed, error, cancelled, interrupt, failed | `src/shared/types.ts` | Output of mapping function |
| `DelegationPacketStatus` | 4: pending, running, completed, failed | `src/shared/types.ts` | No change (tool envelope only) |
| `CompletionSignal` | 5: idle, error, deleted, timeout, cancelled | `src/coordination/completion/detector.ts` | TERMINAL_EVENTS verified |

---

## 5. All Skill Files Referenced or Created

**None.** No `.claude/skills/` or `.opencode/skills/` files were created or modified by any of the 4 phases. All changes are in `src/` (hard harness) and `.planning/` (governance).

---

## 6. Cross-Phase Dependencies

```
Phase 21  ───► Phase 21.1  ───► Phase 21.2  ───► Phase 22
(6 plans)      (3 plans)        (2 plans)        (3 plans)
                    │                │
                    │                └── Live UAT proved front-agent switching SUPPORTED
                    │
                    └── L1 UAT pending restart (non-subtask + subtask paths)

Phase 21 → Phase 22:
  - G-3 precondition (status preservation) enables P22 status trust in project-continuity.json
  - G-4 precondition (delegation always persisted) enables P22 notification retry persistence
  - F-19 (childCount populated) enables P22 to make decisions based on delegation depth/count

Phase 21.1 → Phase 21.2:
  - execute-slash-command rewrite provides the subtask dispatch path
  - CommandBundle type extension (model/subtask) enables frontmatter awareness
  - The synthetic parent prompt path is built on top of 21.1's deferred dispatch pattern
```

---

## Metadata

**Total artifacts consumed:** 75 `.md` files
**Confidence:** HIGH — all claims verified from primary planning artifacts
**Synthesized:** 2026-05-22
