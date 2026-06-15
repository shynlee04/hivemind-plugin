# Delegation Manifest + Notification Mediation Architecture Design

## Version: 1.0.0
## Date: 2026-04-24
## Author: Delegation Manifest Architect (subagent)
## Status: DESIGN — Ready for Implementation Review

---

## Executive Summary

This document specifies the concrete architecture to close INC-01, INC-03, and INC-06 from debug session `ses_2413`. The design introduces two new subsystems:

1. **DelegationManifest** — Session-scoped registry of all delegations with retrieval tracking and pipeline grouping.
2. **NotificationMediation** — Buffered, batched, and deferred notification delivery with turn-start briefing synthesis.

Both subsystems are implemented as **library modules + hook integrations + tool enhancements**, requiring zero changes to OpenCode core. They leverage existing `continuity.ts` persistence and `delegation-manager.ts` orchestration.

---

## 1. Data Model

### 1.1 Core Types (additions to `src/lib/types.ts`)

```typescript
// ---------------------------------------------------------------------------
// Delegation Manifest Types (Phase 17)
// ---------------------------------------------------------------------------

export type ManifestEntryStatus = 
  | "dispatched"
  | "running" 
  | "completed"
  | "error"
  | "timeout"
  | "retrieved"    // Terminal + agent has acknowledged

export interface DelegationManifestEntry {
  /** Delegation ID (foreign key to DelegationManager) */
  delegationId: string
  /** Agent name */
  agent: string
  /** Pipeline or purpose grouping (e.g., "research-wave-1", "code-review") */
  pipeline?: string
  /** Human-readable purpose */
  purpose?: string
  /** Conversation turn number when launched */
  launchedAtTurn: number
  /** Timestamp when launched */
  launchedAt: number
  /** Current status in manifest lifecycle */
  manifestStatus: ManifestEntryStatus
  /** Whether agent has retrieved/acknowledged this result */
  retrieved: boolean
  /** Timestamp when retrieved */
  retrievedAt?: number
  /** Brief summary of result (populated on terminal) */
  resultSummary?: string
  /** Error message if terminal state is error/timeout */
  errorSummary?: string
  /** Terminal timestamp */
  completedAt?: number
  /** Execution mode */
  executionMode: "sdk" | "pty" | "headless"
  /** Queue key for concurrency context */
  queueKey: string
  /** Nesting depth */
  nestingDepth: number
}

export interface DelegationManifest {
  /** Session ID this manifest belongs to */
  sessionId: string
  /** Monotonically increasing turn counter */
  currentTurn: number
  /** All delegation entries */
  entries: DelegationManifestEntry[]
  /** Pipeline groups → delegation IDs */
  pipelines: Record<string, string[]>
  /** Timestamp of last manifest update */
  updatedAt: number
  /** Schema version for migrations */
  version: number
}

// ---------------------------------------------------------------------------
// Notification Mediation Types
// ---------------------------------------------------------------------------

export type NotificationDeliveryMode = 
  | "immediate"      // Fire system_reminder immediately (legacy, default off)
  | "batched"        // Hold until turn start, then synthesize briefing
  | "deferred"       // Hold until explicit flush or specific event
  | "pipeline"       // Aggregate by pipeline, deliver pipeline summary

export interface BufferedNotification {
  /** Unique notification ID */
  id: string
  /** Delegation ID reference */
  delegationId: string
  /** Notification payload */
  task: TaskNotification
  /** When this was buffered */
  bufferedAt: number
  /** Intended delivery mode */
  deliveryMode: NotificationDeliveryMode
  /** Pipeline group (if any) */
  pipeline?: string
  /** Whether this has been delivered */
  delivered: boolean
  /** Whether delivery was attempted but failed */
  deliveryFailed: boolean
}

export interface NotificationBuffer {
  /** Session ID */
  sessionId: string
  /** Buffered items */
  items: BufferedNotification[]
  /** Whether the parent session is currently in active exchange */
  isInActiveExchange: boolean
  /** Last flush timestamp */
  lastFlushAt?: number
  /** Pending pipeline summaries waiting for pipeline completion */
  pendingPipelineSummaries: string[]
}

export interface DelegationBriefing {
  /** Turn number this briefing is for */
  turnNumber: number
  /** New delegations launched since last briefing */
  newDelegations: DelegationManifestEntry[]
  /** Terminal delegations awaiting retrieval */
  pendingResults: DelegationManifestEntry[]
  /** Pipelines with status overview */
  pipelineStatus: PipelineStatus[]
  /** Notifications being delivered in this briefing */
  notifications: BufferedNotification[]
  /** Formatted briefing text */
  briefingText: string
}

export interface PipelineStatus {
  name: string
  total: number
  running: number
  completed: number
  failed: number
  retrieved: number
  /** Whether all delegations in pipeline are terminal */
  isComplete: boolean
  /** Summary text if complete */
  summary?: string
}
```

### 1.2 Schema Constants

```typescript
export const MANIFEST_VERSION = 1
export const MAX_MANIFEST_ENTRIES_PER_SESSION = 200
export const MAX_BUFFERED_NOTIFICATIONS = 100
export const DEFAULT_NOTIFICATION_MODE: NotificationDeliveryMode = "batched"
```

---

## 2. Lifecycle Flow

### 2.1 Dispatch → Manifest Update

```
[Agent calls delegate-task tool]
    ↓
[Tool validates args + extracts pipeline/purpose from prompt metadata]
    ↓
[DelegationManager.dispatch() creates child session]
    ↓
[ManifestManager.recordDispatch()]  ← NEW
    - Increment currentTurn
    - Create ManifestEntry with retrieved: false
    - Add to pipeline group if specified
    - Persist to continuity store
    ↓
[Return DelegationResult to agent]
```

### 2.2 Terminal Transition → Notification Buffering

```
[Child session reaches terminal state]
    ↓
[DelegationManager.transitionToTerminal()]
    ↓
[NotificationMediator.onDelegationTerminal()]  ← NEW (replaces direct notify)
    - Build TaskNotification from Delegation
    - Check parent session exchange state
    - If in active exchange → buffer to NotificationBuffer
    - If not in active exchange + mode=batched → buffer (flush at next turn)
    - Update manifest entry: manifestStatus → completed/error/timeout
    - Persist manifest + buffer to continuity
    ↓
[If mode=immediate (legacy opt-in), also fire direct notification]
```

### 2.3 Turn Start → Briefing Injection

```
[OpenCode starts new turn for parent session]
    ↓
[hooks.messages.transform fires]
    ↓
[ManifestManager.getBriefingForTurn()]  ← NEW
    - Read manifest entries with retrieved: false
    - Read NotificationBuffer items with delivered: false
    - Group by pipeline
    - Synthesize DelegationBriefing
    ↓
[If briefing has content]
    - Inject system message at start of messages array:
      "<system_reminder>[Delegation Briefing] Turn N: ...</system_reminder>"
    - Mark buffered notifications as delivered
    - Update buffer in continuity
    ↓
[Agent processes turn with full context]
```

### 2.4 Retrieval → Manifest Update

```
[Agent calls delegation-status with markRetrieved=true]
    ↓
[Tool updates manifest entry retrieved: true, retrievedAt: now]
    ↓
[ManifestManager.updateEntry()]
    - Validate entry exists
    - Set retrieved = true
    - Optionally prune old retrieved entries
    - Persist manifest
    ↓
[Return updated status to agent]
```

### 2.5 Stream End / Session Close Reconciliation

```
[Parent session stream ends or session closes]
    ↓
[hooks.event: session.idle with no pending messages]
    ↓
[LifecycleManager checks manifest]
    - If manifest has non-retrieved terminal entries:
      - Create compact checkpoint with delegation status
      - Include in session.compacting output
    ↓
[Next session instance hydrates]
    - Manifest loaded from continuity
    - Briefing generated at first turn start
```

---

## 3. Hook Integration

### 3.1 Modified `create-core-hooks.ts`

```typescript
export interface CoreHooks {
  event: (input: EventInput) => Promise<void>
  "system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
  "experimental.chat.system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
  "messages.transform": (input: MessagesInput, output: MessagesOutput) => Promise<void>
  "shell.env": (input: Record<string, unknown>, output: ShellEnvOutput) => Promise<void>
}
```

**`event` hook changes:**
- On `session.created`: Load manifest + buffer from continuity. If manifest has pending terminal entries, set `hasPendingBriefing = true`.
- On `session.updated` (turn start): If `hasPendingBriefing`, trigger briefing generation.
- On `session.idle`: Update `isInActiveExchange = false` in buffer state.
- On `session.message` (user message): Set `isInActiveExchange = true` in buffer state.

**`messages.transform` hook changes:**
- After existing `transformMessages` call:
  ```typescript
  const briefing = manifestManager.synthesizeBriefing(sessionID)
  if (briefing && briefing.briefingText) {
    output.messages.unshift({
      role: "system",
      content: briefing.briefingText,
    })
  }
  ```

**`system.transform` hook changes (optional enhancement):**
- Inject manifest summary into system context:
  ```typescript
  const manifestSummary = manifestManager.getManifestSummary(sessionID)
  if (manifestSummary) {
    output.system = appendSystemContext(output.system, manifestSummary)
  }
  ```

### 3.2 Modified `create-session-hooks.ts`

**`experimental.session.compacting` hook changes:**
- Include manifest snapshot in compacting context:
  ```typescript
  const manifest = manifestManager.getManifest(sessionID)
  if (manifest) {
    contextLines.push(`- delegation_manifest_version: ${manifest.version}`)
    contextLines.push(`- active_delegations: ${manifest.entries.filter(e => !isTerminal(e.manifestStatus)).length}`)
    contextLines.push(`- pending_results: ${manifest.entries.filter(e => isTerminal(e.manifestStatus) && !e.retrieved).length}`)
  }
  ```

### 3.3 Hook Firing Summary Table

| Event | Hook | Action | Priority |
|-------|------|--------|----------|
| Turn starts | `messages.transform` | Inject briefing if pending | Must be first message |
| User message | `event` (session.message) | Set `isInActiveExchange = true` | — |
| Assistant reply complete | `event` (session.idle) | Set `isInActiveExchange = false` | — |
| Session created | `event` (session.created) | Hydrate manifest, check pending | — |
| Session compacting | `experimental.session.compacting` | Include manifest snapshot | — |
| Child terminal | DelegationManager callback | Buffer notification, update manifest | Fire-and-forget |

---

## 4. Tool Changes

### 4.1 `delegate-task` tool enhancements

**New optional arguments:**
```typescript
const DelegateTaskInputSchema = z.object({
  agent: z.string().min(1),
  prompt: z.string().min(1),
  title: z.string().min(1).optional(),
  safetyCeilingMs: z.number().min(60000).max(3600000).optional(),
  pipeline: z.string().optional().describe("Pipeline group name for organizing related delegations"),
  purpose: z.string().optional().describe("Human-readable purpose/description for this delegation"),
  notificationMode: z.enum(["batched", "deferred", "pipeline"]).optional().describe("How to deliver completion notification"),
})
```

**Behavior changes:**
- After successful dispatch, call `manifestManager.recordDispatch()` with pipeline/purpose.
- Return includes `manifestEntryId` (same as delegationId) and `pipeline`.

### 4.2 `delegation-status` tool enhancements

**New optional arguments:**
```typescript
const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional(),
  status: z.string().optional(),
  markRetrieved: z.boolean().optional().describe("Mark specified delegation(s) as retrieved"),
  pipeline: z.string().optional().describe("Filter or operate on a pipeline group"),
  includeManifest: z.boolean().optional().describe("Include manifest metadata in response"),
})
```

**Behavior changes:**
- If `markRetrieved=true` + `delegationId`: Update manifest entry `retrieved: true`.
- If `markRetrieved=true` + `pipeline`: Mark all terminal entries in pipeline as retrieved.
- If `includeManifest=true`: Include full manifest entry in response.
- New response fields: `manifestStatus`, `retrieved`, `pipeline`, `purpose`.

### 4.3 New tool: `delegation-manifest` (optional, can be absorbed into delegation-status)

**Purpose:** Explicit manifest operations.

```typescript
args: {
  action: z.enum(["list", "get", "mark-retrieved", "prune", "get-pipeline-status"]),
  delegationId: z.string().optional(),
  pipeline: z.string().optional(),
}
```

**Recommendation:** Absorb into `delegation-status` to avoid tool proliferation. Use `action` parameter or context-dependent behavior.

---

## 5. Persistence Strategy

### 5.1 Continuity Store Schema Extension

Add two new top-level fields to `SessionContinuityMetadata`:

```typescript
export type SessionContinuityMetadata = {
  // ... existing fields ...
  delegationManifest?: DelegationManifest
  notificationBuffer?: NotificationBuffer
}
```

### 5.2 `continuity.ts` Changes

**New clone helper:**
```typescript
function cloneDelegationManifest(manifest: DelegationManifest | undefined): DelegationManifest | undefined {
  if (!manifest) return undefined
  return {
    ...manifest,
    entries: manifest.entries.map(e => ({ ...e })),
    pipelines: Object.fromEntries(
      Object.entries(manifest.pipelines).map(([k, v]) => [k, [...v]])
    ),
  }
}

function cloneNotificationBuffer(buffer: NotificationBuffer | undefined): NotificationBuffer | undefined {
  if (!buffer) return undefined
  return {
    ...buffer,
    items: buffer.items.map(i => ({
      ...i,
      task: { ...i.task, metadata: i.task.metadata ? { ...i.task.metadata } : undefined },
    })),
    pendingPipelineSummaries: [...buffer.pendingPipelineSummaries],
  }
}
```

**Update `cloneContinuityRecord`:**
```typescript
function cloneContinuityRecord(record: SessionContinuityRecord): SessionContinuityRecord {
  return {
    ...record,
    metadata: {
      ...record.metadata,
      // ... existing clones ...
      delegationManifest: cloneDelegationManifest(record.metadata.delegationManifest),
      notificationBuffer: cloneNotificationBuffer(record.metadata.notificationBuffer),
    },
  }
}
```

**Update `normalizeContinuityRecord`:**
```typescript
// In normalizeContinuityRecord, add:
delegationManifest: isDelegationManifest(meta.delegationManifest) 
  ? cloneDelegationManifest(meta.delegationManifest as DelegationManifest)
  : undefined,
notificationBuffer: isNotificationBuffer(meta.notificationBuffer)
  ? cloneNotificationBuffer(meta.notificationBuffer as NotificationBuffer)
  : undefined,
```

**Update `patchSessionContinuity`:**
Add handling for `delegationManifest` and `notificationBuffer` patches using the clone helpers.

### 5.3 Separate File Option (Rejected)

Alternative: Store manifest in a separate `delegation-manifests.json` file.
**Rejected** because:
- Breaks atomicity with session continuity
- Adds another file to manage/corrupt
- Continuity store already handles concurrency via atomic rename
- Manifest is intrinsically tied to session lifecycle

### 5.4 Pruning Strategy

- Manifest entries older than 24h and `retrieved: true` are pruned on manifest update.
- Notification buffer items older than 24h and `delivered: true` are pruned on flush.
- Hard caps: `MAX_MANIFEST_ENTRIES_PER_SESSION` (200), `MAX_BUFFERED_NOTIFICATIONS` (100).
- Pruning is best-effort; if caps exceeded, oldest retrieved/delivered items removed first.

---

## 6. Migration Path

### 6.1 Zero-Breaking-Changes Guarantee

The design is **purely additive**. Existing behavior continues unless:
1. The `pipeline` or `purpose` argument is passed to `delegate-task`, OR
2. The `notificationMode` is explicitly set to non-legacy mode.

### 6.2 Phase-by-Phase Migration

**Phase 1: Types + Continuity (no runtime impact)**
- Add types to `types.ts`
- Add clone/normalize helpers to `continuity.ts`
- Add constants
- **Verification:** All existing tests pass. Store schema is backward-compatible.

**Phase 2: Manifest Manager Module (no runtime impact)**
- Create `src/lib/manifest-manager.ts`
- Implement CRUD + briefing synthesis
- Unit tests
- **Verification:** Module can be instantiated but is not wired into hooks/tools.

**Phase 3: Notification Mediator Module (no runtime impact)**
- Create `src/lib/notification-mediator.ts`
- Implement buffering + flush logic
- Unit tests
- **Verification:** Module can be instantiated but is not wired.

**Phase 4: Hook Integration (opt-in behavior)**
- Update `create-core-hooks.ts` to call manifest manager
- Update `create-session-hooks.ts` for compacting context
- Add `pipeline`, `purpose`, `notificationMode` to `delegate-task` schema
- **Default:** `notificationMode` defaults to `undefined` (legacy immediate mode)
- **Verification:** Existing flows unchanged. New args can be passed manually.

**Phase 5: Default Cutover**
- Change default `notificationMode` to `"batched"`
- Update `delegation-status` with `markRetrieved` and manifest fields
- Remove legacy immediate notify path (or keep as opt-in)
- **Verification:** Full integration tests.

### 6.3 Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| Old delegation, no manifest | `delegation-status` works normally. Manifest query returns empty. |
| New delegation without pipeline/purpose | Manifest entry created with empty pipeline/purpose. Batched mode active. |
| Plugin upgrade mid-conversation | Existing continuity loads without manifest → manifest initialized empty on next dispatch. |
| Downgrade after manifest created | Extra fields ignored by old normalize. Manifest data preserved in JSON but not read. |

---

## 7. Implementation Order

### Build 1: Foundation (types + continuity + manager modules)
**Files:**
1. `src/lib/types.ts` — Add manifest + buffer types
2. `src/lib/continuity.ts` — Add clone/normalize/patch for new fields
3. `src/lib/manifest-manager.ts` — NEW (~250 LOC)
4. `src/lib/notification-mediator.ts` — NEW (~200 LOC)
5. `tests/lib/manifest-manager.test.ts` — Unit tests
6. `tests/lib/notification-mediator.test.ts` — Unit tests

**Estimated effort:** 1 session
**Dependencies:** None (leaf modules)

### Build 2: Hook Wiring (integration)
**Files:**
1. `src/hooks/create-core-hooks.ts` — Inject briefing in messages.transform
2. `src/hooks/create-session-hooks.ts` — Manifest in compacting context
3. `src/plugin.ts` — Instantiate manifestManager + notificationMediator, inject into deps
4. `tests/hooks/create-core-hooks.test.ts` — Hook behavior tests

**Estimated effort:** 1 session
**Dependencies:** Build 1

### Build 3: Tool Enhancement (user-facing)
**Files:**
1. `src/tools/delegate-task.ts` — Add pipeline/purpose/notificationMode args
2. `src/tools/delegation-status.ts` — Add markRetrieved, includeManifest, pipeline filter
3. `tests/tools/delegate-task.test.ts` — Updated tests
4. `tests/tools/delegation-status.test.ts` — Updated tests

**Estimated effort:** 1 session
**Dependencies:** Build 1 + Build 2

### Build 4: Cutover + Cleanup
**Files:**
1. `src/lib/delegation-manager.ts` — Replace direct notify with NotificationMediator call
2. `src/lib/notification-handler.ts` — Mark as deprecated, redirect to mediator
3. Update AGENTS.md documentation
4. End-to-end integration test

**Estimated effort:** 1 session
**Dependencies:** Build 3

---

## 8. Code Skeleton

### 8.1 `src/lib/manifest-manager.ts`

```typescript
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./continuity.js"
import type { DelegationManifest, DelegationManifestEntry, PipelineStatus, DelegationBriefing } from "./types.js"
import type { Delegation, DelegationStatus } from "./types.js"

export class ManifestManager {
  private readonly inMemoryManifests = new Map<string, DelegationManifest>()

  /** Initialize or load manifest for session */
  ensureManifest(sessionId: string): DelegationManifest {
    const cached = this.inMemoryManifests.get(sessionId)
    if (cached) return cached

    const continuity = getSessionContinuity(sessionId)
    const manifest = continuity?.metadata.delegationManifest ?? this.createEmptyManifest(sessionId)
    this.inMemoryManifests.set(sessionId, manifest)
    return manifest
  }

  /** Record a new delegation dispatch in the manifest */
  recordDispatch(args: {
    sessionId: string
    delegation: Delegation
    pipeline?: string
    purpose?: string
    turnNumber?: number
  }): DelegationManifestEntry {
    const manifest = this.ensureManifest(args.sessionId)
    const turnNumber = args.turnNumber ?? manifest.currentTurn + 1
    manifest.currentTurn = turnNumber

    const entry: DelegationManifestEntry = {
      delegationId: args.delegation.id,
      agent: args.delegation.agent,
      pipeline: args.pipeline,
      purpose: args.purpose,
      launchedAtTurn: turnNumber,
      launchedAt: args.delegation.createdAt,
      manifestStatus: args.delegation.status,
      retrieved: false,
      executionMode: args.delegation.executionMode,
      queueKey: args.delegation.queueKey,
      nestingDepth: args.delegation.nestingDepth,
    }

    manifest.entries.push(entry)
    if (args.pipeline) {
      manifest.pipelines[args.pipeline] = manifest.pipelines[args.pipeline] ?? []
      manifest.pipelines[args.pipeline].push(args.delegation.id)
    }
    manifest.updatedAt = Date.now()

    this.persistManifest(args.sessionId, manifest)
    return entry
  }

  /** Update entry status when delegation transitions */
  updateEntryStatus(delegationId: string, status: DelegationStatus, sessionId: string, resultSummary?: string, errorSummary?: string): void {
    const manifest = this.ensureManifest(sessionId)
    const entry = manifest.entries.find(e => e.delegationId === delegationId)
    if (!entry) return

    entry.manifestStatus = status === "completed" ? "completed" : status === "error" ? "error" : status === "timeout" ? "timeout" : entry.manifestStatus
    entry.resultSummary = resultSummary
    entry.errorSummary = errorSummary
    if (status === "completed" || status === "error" || status === "timeout") {
      entry.completedAt = Date.now()
    }
    manifest.updatedAt = Date.now()
    this.persistManifest(sessionId, manifest)
  }

  /** Mark entry as retrieved by agent */
  markRetrieved(delegationId: string, sessionId: string): boolean {
    const manifest = this.ensureManifest(sessionId)
    const entry = manifest.entries.find(e => e.delegationId === delegationId)
    if (!entry) return false
    entry.retrieved = true
    entry.retrievedAt = Date.now()
    manifest.updatedAt = Date.now()
    this.persistManifest(sessionId, manifest)
    return true
  }

  /** Synthesize briefing for current turn */
  synthesizeBriefing(sessionId: string): DelegationBriefing | null {
    const manifest = this.ensureManifest(sessionId)
    const pendingResults = manifest.entries.filter(e => 
      (e.manifestStatus === "completed" || e.manifestStatus === "error" || e.manifestStatus === "timeout") && 
      !e.retrieved
    )
    const running = manifest.entries.filter(e => e.manifestStatus === "dispatched" || e.manifestStatus === "running")
    
    if (pendingResults.length === 0 && running.length === 0) return null

    const pipelineStatus = this.buildPipelineStatus(manifest)
    const briefingText = this.formatBriefingText(manifest.currentTurn, pendingResults, running, pipelineStatus)

    return {
      turnNumber: manifest.currentTurn,
      newDelegations: [], // Could track since last briefing
      pendingResults,
      pipelineStatus,
      notifications: [], // Populated by NotificationMediator
      briefingText,
    }
  }

  private buildPipelineStatus(manifest: DelegationManifest): PipelineStatus[] {
    // ... implementation ...
    return []
  }

  private formatBriefingText(turn: number, pending: DelegationManifestEntry[], running: DelegationManifestEntry[], pipelines: PipelineStatus[]): string {
    // ... formatting logic ...
    return ""
  }

  private persistManifest(sessionId: string, manifest: DelegationManifest): void {
    const continuity = getSessionContinuity(sessionId)
    if (continuity) {
      patchSessionContinuity(sessionId, { delegationManifest: manifest })
    } else {
      recordSessionContinuity({
        sessionID: sessionId,
        promptParams: {},
        metadata: {
          status: "running",
          description: "Manifest-only session record",
          delegation: null,
          constraints: [],
          pendingNotifications: [],
          delegationManifest: manifest,
          updatedAt: Date.now(),
        },
      })
    }
    this.inMemoryManifests.set(sessionId, manifest)
  }

  private createEmptyManifest(sessionId: string): DelegationManifest {
    return {
      sessionId,
      currentTurn: 0,
      entries: [],
      pipelines: {},
      updatedAt: Date.now(),
      version: 1,
    }
  }
}
```

### 8.2 `src/lib/notification-mediator.ts`

```typescript
import type { OpenCodeClient } from "./session-api.js"
import type { 
  NotificationBuffer, 
  BufferedNotification, 
  Delegation, 
  TaskNotification,
  NotificationDeliveryMode 
} from "./types.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./continuity.js"
import { buildDelegationTaskNotification } from "./notification-handler.js"

export class NotificationMediator {
  private readonly buffers = new Map<string, NotificationBuffer>()
  private readonly exchangeState = new Map<string, boolean>()

  constructor(private readonly client: OpenCodeClient) {}

  /** Call when parent session starts a turn (user message or tool call) */
  onExchangeStart(sessionId: string): void {
    this.exchangeState.set(sessionId, true)
    const buffer = this.ensureBuffer(sessionId)
    buffer.isInActiveExchange = true
    this.persistBuffer(sessionId, buffer)
  }

  /** Call when parent session goes idle */
  onExchangeEnd(sessionId: string): void {
    this.exchangeState.set(sessionId, false)
    const buffer = this.ensureBuffer(sessionId)
    buffer.isInActiveExchange = false
    this.persistBuffer(sessionId, buffer)
    // Optionally auto-flush if mode allows
  }

  /** Call from DelegationManager when delegation reaches terminal state */
  onDelegationTerminal(delegation: Delegation, mode: NotificationDeliveryMode = "batched"): BufferedNotification | null {
    const buffer = this.ensureBuffer(delegation.parentSessionId)
    const task = buildDelegationTaskNotification(delegation)
    
    const notification: BufferedNotification = {
      id: crypto.randomUUID(),
      delegationId: delegation.id,
      task,
      bufferedAt: Date.now(),
      deliveryMode: mode,
      pipeline: undefined, // Could extract from manifest
      delivered: false,
      deliveryFailed: false,
    }

    buffer.items.push(notification)
    this.persistBuffer(delegation.parentSessionId, buffer)

    // If not in active exchange and mode is immediate-ish, could flush now
    // But standard behavior is to hold for messages.transform
    return notification
  }

  /** Call from messages.transform hook to get pending notifications for briefing */
  flushPending(sessionId: string): BufferedNotification[] {
    const buffer = this.ensureBuffer(sessionId)
    const pending = buffer.items.filter(i => !i.delivered && !i.deliveryFailed)
    
    // Mark as delivered (they will be included in briefing)
    for (const item of pending) {
      item.delivered = true
    }
    buffer.lastFlushAt = Date.now()
    this.persistBuffer(sessionId, buffer)
    
    return pending
  }

  /** Get count of pending notifications (for compacting context) */
  getPendingCount(sessionId: string): number {
    const buffer = this.ensureBuffer(sessionId)
    return buffer.items.filter(i => !i.delivered && !i.deliveryFailed).length
  }

  private ensureBuffer(sessionId: string): NotificationBuffer {
    const cached = this.buffers.get(sessionId)
    if (cached) return cached

    const continuity = getSessionContinuity(sessionId)
    const buffer = continuity?.metadata.notificationBuffer ?? this.createEmptyBuffer(sessionId)
    this.buffers.set(sessionId, buffer)
    return buffer
  }

  private persistBuffer(sessionId: string, buffer: NotificationBuffer): void {
    const continuity = getSessionContinuity(sessionId)
    if (continuity) {
      patchSessionContinuity(sessionId, { notificationBuffer: buffer })
    } else {
      recordSessionContinuity({
        sessionID: sessionId,
        promptParams: {},
        metadata: {
          status: "running",
          description: "Buffer-only session record",
          delegation: null,
          constraints: [],
          pendingNotifications: [],
          notificationBuffer: buffer,
          updatedAt: Date.now(),
        },
      })
    }
    this.buffers.set(sessionId, buffer)
  }

  private createEmptyBuffer(sessionId: string): NotificationBuffer {
    return {
      sessionId,
      items: [],
      isInActiveExchange: false,
      pendingPipelineSummaries: [],
    }
  }
}
```

### 8.3 `src/hooks/create-core-hooks.ts` — Briefing Injection Snippet

```typescript
// In createCoreHooks factory:
export function createCoreHooks(deps: HookDependencies & { 
  manifestManager: ManifestManager 
  notificationMediator: NotificationMediator 
}): CoreHooks {
  
  // ... existing setup ...

  return {
    // ... event hook updated ...
    
    "messages.transform": async (input, output) => {
      const sessionID = input.sessionID
      if (!sessionID) return
      
      const messages = input.messages ?? []
      const transformed = transformMessages(messages, sessionID)
      
      // NEW: Inject delegation briefing at turn start
      const briefing = deps.manifestManager.synthesizeBriefing(sessionID)
      const pendingNotifications = deps.notificationMediator.flushPending(sessionID)
      
      if (briefing && (briefing.pendingResults.length > 0 || pendingNotifications.length > 0)) {
        // Enrich briefing with notifications
        const enrichedBriefing = {
          ...briefing,
          notifications: pendingNotifications,
          briefingText: briefing.briefingText + "\n" + pendingNotifications.map(n => 
            `- [${n.task.status}] ${n.task.description} (${n.task.agent})`
          ).join("\n"),
        }
        
        transformed.unshift({
          role: "system",
          content: `<system_reminder>[Delegation Briefing]\n${enrichedBriefing.briefingText}</system_reminder>`,
        })
      }
      
      output.messages = transformed
    },
    
    // ... other hooks ...
  }
}
```

### 8.4 `src/lib/delegation-manager.ts` — Transition Modification Snippet

```typescript
// In DelegationManager constructor, add manifestManager and notificationMediator deps

// Replace transitionToTerminal notification block:
private transitionToTerminal(
  delegationId: string,
  newState: DelegationStatus,
  error?: string,
  terminalDetail?: { ... }
): void {
  // ... existing status update logic ...
  
  // NEW: Update manifest
  if (this.manifestManager) {
    this.manifestManager.updateEntryStatus(
      delegationId, 
      newState, 
      delegation.parentSessionId,
      delegation.result,
      error
    )
  }

  // NEW: Buffer notification instead of immediate fire
  if (this.notificationMediator) {
    this.notificationMediator.onDelegationTerminal(delegation)
  } else {
    // Fallback to legacy immediate notify
    void notifyDelegationTerminal(this.client, delegation)
  }
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**`manifest-manager.test.ts`:**
- `ensureManifest` creates empty manifest for new session
- `recordDispatch` increments turn and creates entry
- `updateEntryStatus` updates terminal state
- `markRetrieved` sets retrieved flag
- `synthesizeBriefing` returns null when no pending
- `synthesizeBriefing` includes pending results
- Pipeline grouping works correctly
- Pruning removes old retrieved entries

**`notification-mediator.test.ts`:**
- `onExchangeStart` sets active flag
- `onExchangeEnd` clears active flag
- `onDelegationTerminal` buffers notification
- `flushPending` marks items delivered
- `flushPending` returns empty array when nothing pending
- Persistence round-trip via continuity mock

### 9.2 Integration Tests

**Hook integration:**
- `messages.transform` injects briefing when manifest has pending
- `messages.transform` does not inject when no pending
- `event` (session.created) hydrates manifest from continuity
- `experimental.session.compacting` includes manifest summary

**Tool integration:**
- `delegate-task` with `pipeline` creates grouped manifest entries
- `delegation-status` with `markRetrieved` updates manifest
- `delegation-status` with `includeManifest` returns manifest fields

### 9.3 Migration Tests

- Old continuity without manifest fields loads gracefully
- Downgrade scenario: manifest fields preserved but ignored
- Mixed old/new delegations in same session

---

## 10. Open Questions & Decisions

### Decision Log

| ID | Question | Decision | Rationale |
|----|----------|----------|-----------|
| D-01 | Store manifest in continuity.json or separate file? | In continuity.json | Atomicity, single source of truth, simpler backup |
| D-02 | Default notification mode? | `"batched"` after cutover | Prevents mid-conversation interruption; aligns with INC-03 |
| D-03 | Should briefing be system message or injected prompt? | System message in `messages.transform` | Clean separation; agent sees it as context, not user input |
| D-04 | Pipeline groups mutable after dispatch? | Immutable | Simplicity; if mis-categorized, cancel and re-dispatch |
| D-05 | Should `markRetrieved` be automatic on `delegation-status` call? | No, explicit flag | Agent may check status without acknowledging result |
| D-06 | Turn counter source of truth? | ManifestManager increments on each dispatch | Simple; could integrate with OpenCode turn API if available |

---

## 11. Success Criteria

- [ ] **SC-01:** Delegation launched in turn N is recorded in manifest with `retrieved: false`
- [ ] **SC-02:** Next agent instance at turn N+1 receives briefing of pending delegations at turn start
- [ ] **SC-03:** No raw `system_reminder` interrupts active user-agent exchange (batched mode)
- [ ] **SC-04:** `delegation-status` with `markRetrieved=true` updates manifest and suppresses future briefing
- [ ] **SC-05:** Pipeline grouping allows aggregate status queries
- [ ] **SC-06:** All existing tests pass without modification during Phase 1-3
- [ ] **SC-07:** Graceful degradation when manifest fields are absent from continuity

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Continuity store bloat from large manifests | Medium | Pruning of old retrieved entries; hard caps |
| Briefing system message too large | Medium | Truncate/summarize when > 2000 chars; pipeline-level aggregation |
| Hook ordering conflict | Low | `messages.transform` appends to start; other hooks should preserve |
| Agent confusion from new briefing format | Medium | Clear `[Delegation Briefing]` prefix; include action instructions |
| Race condition between flush and new notification | Low | Single-threaded event loop; flush happens at turn start before new dispatches |

---

*End of Design Document*
