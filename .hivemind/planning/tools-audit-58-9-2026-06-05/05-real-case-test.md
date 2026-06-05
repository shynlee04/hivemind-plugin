[LANGUAGE: Write this file in en per Language Governance.]
# Session Management Tools Audit — Findings

> Authored: 2026-06-05 | Phase 58.9 G3 | From source files

---

## 1. delegate-task.ts (Tool Entrypoint)

**File:** `src/tools/delegation/delegate-task.ts` (110 lines)

### Schema

```typescript
const DelegateTaskV2Schema = z.object({
  agent: z.string().min(1, { error: "agent is required" }),
  prompt: z.string().min(1, { error: "prompt is required" }),
  context: z.string().optional(),
  stackOnSessionId: z.string().optional(),
})
```

### Required Args

| Arg | Type | Required | Description |
|-----|------|----------|-------------|
| `agent` | `string` | Yes | Target agent name |
| `prompt` | `string` | Yes | Task prompt |
| `context` | `string` | No | Legacy JSON stacking payload or free-text prepend |
| `stackOnSessionId` | `string` | No | FQ session ID to stack onto (overrides context) |

### Actions

Zero actions — this is a fire-and-forget dispatch tool. No sub-actions, no branching. Returns delegation ID immediately (WaiterModel).

### Dispatch Flow

1. Parse + validate via `DelegateTaskV2Schema.safeParse`
2. Guard: `config.delegation_systems.delegate_task` flag check
3. Session resolution: `stackOnSessionId` > `context.parentSessionId` > `context.sessionID`
4. Call `coordinator.dispatch({ agent, currentDepth: 0, parentSessionId, prompt, queueKey, surface, workingDirectory })`
5. Return delegation result or error envelope

### Integration Points

- `coordinator.dispatch()` → `src/coordination/delegation/coordinator.ts`
- `renderToolResult()` / `error()` / `success()` → `src/shared/tool-response.ts`
- `DelegateTaskV2Schema` exported as `DelegateTaskInputSchema`

### Notes

- Tool description explicitly mentions stacking policy (P58, G1).
- Policy comment (line 6-9): **must NEVER bypass `coordinator.dispatch`**.
- Context stacking supports legacy `{"parentSessionId": "ses_xxx"}` format in addition to the first-class `stackOnSessionId` arg.

---

## 2. delegation-status.ts (Read-side Query Tool)

**File:** `src/tools/delegation/delegation-status.ts` (906 lines)

### Schema (Input)

```typescript
const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional(),
  status: z.string().optional(),
  action: z.enum(["status", "get", "list", "control", "find-stackable", "pool", "peek", "progress"]).default("status"),
  control: DelegationControlSchema.optional(),
  agentFilter: z.string().optional(),
  paneId: z.string().min(1).optional(),
  maxBytes: z.number().int().positive().optional(),
})
```

### Actions

| Action | Purpose | Required Args |
|--------|---------|--------------|
| `status` (default) | Single delegation detail by ID or list all | `delegationId` (optional — without it, lists all) |
| `list` | List delegations filtering by status | `status` (optional filter) |
| `get` | Same as status via ID | `delegationId` |
| `control` | Lifecycle control: abort/cancel/restart/resume/chain/adjust-prompt/change-agent | `delegationId` + `control` |
| `find-stackable` | Discover terminal sessions available for stacking | (optional `agentFilter`) |
| `pool` | Frozen DelegationPool JSON snapshot | None |
| `peek` | Latest capture-pane content for a tmux pane | `paneId` (or `delegationId` with future wiring) |
| `progress` | Live counters + last event from child event bus | `delegationId` |

### Control Action Schema

```typescript
const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain", "adjust-prompt", "change-agent"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
  agent: z.string().optional(),
}).refine(...)  // restartPrompt required for restart/resume, chainParentSessionId for chain, agent for change-agent
```

### Status Values (Type System)

`DelegationStatus` (7 literals from `coordination/delegation/types.ts`):

| Status | Meaning |
|--------|---------|
| `dispatched` | Just dispatched, child session created |
| `running` | Child processing, dual-signal active |
| `completed` | Dual-signal confirmed, result extracted |
| `error` | Error occurred (deleted, SDK error, etc.) |
| `timeout` | Safety ceiling reached |
| `aborted` | Explicit user abort |
| `cancelled` | Cancelled explicitly or connection drop |

### TerminalKind Values (8 literals from types.ts)

`DelegationTerminalKind`: `completed | error | timeout | cancelled | restarted | runtime-dispatch-unsupported | interrupted-by-signal | non-resumable-after-restart`

### find-stackable Logic

1. `mergeAllDelegations()` collects from 3 sources: manager (in-memory), persisted (disk), session-tracker children
2. Filters to accessible (lineage check via `canAccessDelegation`)
3. Calls `findStackableSessions(accessible, agentFilter)` from `session-intelligence.ts`
4. Stackable statuses: `completed | error | timeout | aborted | cancelled` (all terminal)
5. Resumable statuses: `dispatched | running` (active)
6. Results sorted by recency, capped at 15 stackable / 10 resumable

### Integration Points

- **readPersistedDelegations** — `task-management/continuity/delegation-persistence.ts`
- **getSessionTrackerDelegation / getSessionTrackerChildren** — session-tracker via `resolveSessionFile()`
- **findStackableSessions / findResumableSessions / getRetryRecommendation / buildStackingGuidanceBanner** — `coordination/delegation/session-intelligence.ts`
- **canSessionAccessDelegation / controlDelegation / getAllDelegations / getStatus / getPoolSnapshot** — DelegationManager
- **getPaneContent / getLastChildEvent** — optional deps for peek/progress

---

## 3. Status Value Inconsistencies (DETAILED)

### 3a. DelegationStatus vs DelegationTerminalKind Mismatch

The `DelegationStatus` union has **7 members** but `DelegationTerminalKind` has **8 members** — and they are NOT subsets of each other:

| Value | In DelegationStatus? | In DelegationTerminalKind? |
|-------|---------------------|---------------------------|
| `dispatched` | ✅ | ❌ |
| `running` | ✅ | ❌ |
| `completed` | ✅ | ✅ |
| `error` | ✅ | ✅ |
| `timeout` | ✅ | ✅ |
| `aborted` | ✅ | ❌ |
| `cancelled` | ✅ | ✅ |
| `restarted` | ❌ | ✅ |
| `runtime-dispatch-unsupported` | ❌ | ✅ |
| `interrupted-by-signal` | ❌ | ✅ |
| `non-resumable-after-restart` | ❌ | ✅ |

**Consequence:** When `status` is `"aborted"`, the coordinator sets `terminalKind` to `"cancelled"` (see `coordinator.ts:456`). This **loses the distinction** between abort and cancel — downstream consumers cannot tell which one happened by reading `terminalKind` alone. They must check `explicitCancellation` to disambiguate.

### 3b. Tool Description Truncates Valid Status Values

The `status` filter argument in `delegation-status.ts:480` only documents 5 of 7 valid statuses:

```typescript
status: s.string().optional().describe("Filter by status: dispatched, running, completed, error, timeout"),
```

Omits: `aborted`, `cancelled`

A caller passing `status="aborted"` or `status="cancelled"` to the `list` action will filter correctly at runtime (the `renderList` function does a direct `d.status === args.status` comparison), but this is undocumented behavior.

### 3c. validateDelegationStatus Has Silent Fallback

Line 137: `function validateDelegationStatus(raw: string): DelegationStatus`

Falls back to `"running"` for any unknown status string. This means a malformed or corrupted delegation record from session-tracker could silently change a terminal status to `"running"`, making it appear active when it is not. The fallback should either:
- Return `"error"` (safer — overrides to terminal instead of active)
- Or throw/log the mismatch

### 3d. `status` Filter in `list` Action is Unvalidated

In `renderList` (line 665):
```typescript
const filtered = args.status && args.status !== "all"
  ? accessible.filter((d) => d.status === args.status)
  : accessible
```

The `status` argument is `z.string().optional()` — no enum constraint. A caller can pass `status="nonexistent"` and get an empty list without error. Contrast this with the `action` field which IS properly constrained via `z.enum([...])`.

### 3e. Terminal Action Descriptions vs Runtime Behavior

The tool description says: `"Filter by status: dispatched, running, completed, error, timeout"` — but the internal `VALID_DELEGATION_STATUSES` set on line 134 correctly includes all 7: `dispatched, running, completed, error, timeout, aborted, cancelled`.

This is a pure documentation-in-code gap.

---

## 4. coordinator.ts (Dispatch Engine)

**File:** `src/coordination/delegation/coordinator.ts` (726 lines)

### Class: `DelegationCoordinator`

### Dispatch Flow (`dispatch()` method, line 192)

```
dispatch(params)
├── preflightCheck(params)                  → slot + queue validation
├── createDelegationId()                    → "dt-{timestamp}-{random}"
├── createRecord(...)                        → Delegation with status "dispatched"
├── active.set(delegationId, { record, slotHandle })
├── lifecycle.register(record)
├── lifecycle.transition(delegationId, "dispatched")
├── notificationRouter.register(delegationId, parentSessionId)
├── parent model resolution (inherited model from SDK messages)
├── childSessionStarter.start(...)           → SDK child session
│   ├── attachChildSession(delegationId, childSessionId)
│   ├── lifecycle.transition(delegationId, "running")
│   ├── onChildSessionCreated?.(childSessionId, parentSessionId)  → session-tracker
│   ├── spawnTmuxPanelForChild(...)         → tmux pane projection (S5b fix)
│   ├── sessionManager.startPolling()       → capture-pane polling (P58.8 S1)
│   └── notifyParentSession(...)            → toast + context injection
├── monitor.start(delegationId, parentSessionId)
├── periodicNotifier.register(...)
├── detector.watchDualSignal(delegationId, childSessionId, callback)
└── return { childSessionId, delegationId, status, ... }
```

### spawnTmuxPanelForChild (line 680)

Synthesizes an `EnrichedSessionEvent` and calls `adapter.onSessionCreated(enriched)` directly. This is a **fallback** for when the SDK does not fire `session.created` events for SDK-created child sessions. The event shape matches what `tmuxObserver` (`observers.ts:196-213`) would have produced from a real SDK event.

The SessionManager's `sessions` / `spawningSessions` guards make this **idempotent** — if the SDK event fires later, the second call is a no-op.

### Terminal Paths

| Method | Status | TerminalKind | Cleanup |
|--------|--------|-------------|---------|
| `handleCompletion` | from result | from result | deregister notifier, monitor.onCompletion, merge result, lifecycle transition, route notification, unsubscribe child event bus, cleanup |
| `handleTimeout` | `"timeout"` | from lifecycle | same pattern |
| `failDispatch` | `"error"` | — | same pattern |
| `abortDelegation` | `"aborted"` | `"cancelled"` | same pattern (NOTE: terminalKind=cancelled despite status=aborted) |
| `cancelDelegation` | `"cancelled"` | `"cancelled"` | same pattern |

### Integration Points

- **DelegationDispatcher.preflightCheck** — slot/queue validation
- **DelegationLifecycle** — register, transition, markTimeout, getStatus
- **DelegationMonitor** — start, stop, onCompletion
- **NotificationRouter** — register, deregister, route
- **CompletionDetector** — watchDualSignal, signalCompletionEvent, signalTerminalStatus
- **PeriodicNotifier** — register, deregister
- **SDK client** — `getSessionMessages` for parent model inheritance
- **SessionManager** (tmux) — `startPolling` for capture-pane
- **TmuxIntegration adapter** — `onSessionCreated` for panel spawn

---

## 5. tmux/persistence.ts (Session State Persistence)

**File:** `src/features/tmux/persistence.ts` (406 lines)

### SessionState Type

```typescript
export type SessionState = "active" | "ready" | "paused" | "detached" | "failed"
```

Exactly 5 string literals. No other members (D-54-04 enforcement).

### PersistedSession Interface (9 fields)

```typescript
export interface PersistedSession {
  schemaVersion: 1           // numeric literal — future migration support
  sessionId: string
  agent: string
  delegationId: string
  directory: string
  paneId: string
  spawnTime: number
  state: SessionState
  lastTransitionAt: number
}
```

### persist() Behavior

1. Validates `sessionId` against path-traversal chars (`/`, `\`, `..`, `\0`)
2. Validates `state` is one of the 5 literals
3. Atomic write: tries `wx` flag first (exclusive create), falls back to `w` on EEXIST
4. All errors caught and logged (D-04 silent-fallback)
5. Sets `lastTransitionAt = Date.now()` and `schemaVersion = 1` defensively

### remove() Behavior

1. Path-traversal guard on `sessionId`
2. `unlink` with ENOENT/EEXIST handling (idempotent)
3. All errors logged silently

### restoreAll() Behavior

1. Scans `<projectDir>/.hivemind/state/tmux-sessions/*.json`
2. Filters to ALIVE_STATES only: `paused | detached` (NOT active/ready/failed)
3. Validates 9-field shape via `isValidPersistedSession` type predicate
4. Malformed records skipped with `logWarn`
5. Sorted by `spawnTime` ascending
6. Fresh-project case (missing directory) resolves to `[]`

### State Machine

```
active → ready → paused → detached → failed
                   ↑                      
                   └──── (no reverse)      
```

Disk records are cross-process state channel for kill-parent-restart-recovery (D-54-12 contract). In-memory `Map<sessionId, TrackedSession>` in SessionManager is source of truth during process lifetime.

### Integration Points

- Consumed by: `SessionManager` (7th optional constructor parameter)
- Output: `.hivemind/state/tmux-sessions/<sessionId>.json`
- UUIDv7: `generateUuidV7()` — RFC 9562, 48-bit timestamp + 80 random bits, no `uuid` package (P20 invariant)

---

## 6. session-intelligence.ts (Stacking Logic)

**File:** `src/coordination/delegation/session-intelligence.ts` (280 lines)

### Stackable Statuses

```typescript
const STACKABLE_STATUSES: ReadonlySet<DelegationStatus> = new Set([
  "completed", "error", "timeout", "aborted", "cancelled",
])
```

All 5 terminal `DelegationStatus` values. Note: session-intelligence imports from `./types.js` (coordination layer), which is the canonical `DelegationStatus` type definition.

### Resumable Statuses

```typescript
const RESUMABLE_STATUSES: ReadonlySet<DelegationStatus> = new Set([
  "dispatched", "running",
])
```

### Key Functions

| Function | Returns | Logic |
|----------|---------|-------|
| `findStackableSessions(delegations, agentFilter?, parentFilter?)` | `StackableSession[]` | Filters terminal sessions, builds ready-to-use task/delegate-task commands, sorts by recency |
| `findResumableSessions(delegations, parentFilter?)` | `StackableSession[]` | Filters active sessions (dispatched/running) |
| `getRetryRecommendation(delegation, customPrompt?)` | `RetryRecommendation \| null` | Builds retry prompt with error context, produces stack commands |
| `buildStackingGuidanceBanner(count, resumableCount)` | `string` | Human-readable banner with emoji hints |

### StackableSession Type (public)

| Field | Type | Description |
|-------|------|-------------|
| `childSessionId` | `string` | Target session ID for stacking |
| `agent` | `string` | Agent that ran the session |
| `status` | `DelegationStatus` | Terminal status |
| `createdAt` | `number` | Creation timestamp |
| `completedAt?` | `number` | Terminal timestamp |
| `delegationId` | `string` | Original delegation ID |
| `taskCommand` | `string` | Ready-to-use `task(...)` invocation |
| `delegateTaskCommand` | `string` | Ready-to-use `delegate-task(...)` invocation |
| `reason` | `string` | Human-readable why stackable |
| `error?` | `string` | Error message if failed |
| `finalMessageExcerpt?` | `string` | Last output snippet |
