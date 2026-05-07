---
name: hm-l3-hivemind-state-reference
description: Documents the complete `.hivemind/` state root structure — session continuity, delegation records, event journals, workflow config, planning persistence, and recovery paths. Use when navigating `.hivemind/` directories, reading/writing state files, recovering from interrupted sessions, understanding delegation records, or consuming Hivemind runtime state. NOT for mutating state directly — this is a read-only reference for hm-* agents.
metadata:
  layer: "3"
  role: "reference"
  pattern: P2
  version: "1.0.0"
  context-bomb: true
  requires: Q6-state-root
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

## Overview

Complete reference for the `.hivemind/` state root — the canonical deep module persistence layer defined by **Q6 State Root Separation** (locked 2026-04-25). All Hivemind runtime state (session journals, delegation records, continuity, planning artifacts) writes to `.hivemind/` at project root. `.opencode/` is ONLY for OpenCode primitives (agents, commands, skills) — no runtime state is stored there.

This skill is **read-only reference** for hm-* agents. You consume state, you don't mutate it. For mutation, use the Hivemind tools (delegate-task, delegation-status, session-journal-export, configure-primitive, session-patch).

## `.hivemind/` Directory Structure

```
.hivemind/
├── archive/                  # Archived session artifacts
├── cycle2/                   # Cycle 2 persistent data
├── daily-notes/              # Session daily notes
├── event-tracker/            # Session event journals (JSON + Markdown)
│   └── ses_XXXX.{json,md}    # One pair per session
├── journal/                  # Session journals (YYYY-MM-DD.jsonl)
├── lineage/                  # Execution lineage records
├── research/                 # Deep research cached artifacts
└── state/                    # Core state persistence ← PRIMARY
    ├── session-continuity.json   # Cross-session state (ContinuityStoreFile)
    ├── delegations.json          # Active/completed delegation records
    ├── config-workflows.json     # Workflow configuration state
    ├── SESSION-STATE.md          # WAL-protocol session state (markdown)
    ├── task_plan.md              # Planning-with-files task plan
    ├── findings.md               # Planning-with-files findings
    ├── progress.md               # Planning-with-files progress
    ├── session-context-prompt.md # Session context prompt storage
    ├── baseline-*.md             # Audit baselines (timestamped)
    ├── planning/                 # Task persistence (hm-planning-persistence)
    │   └── stack-skill-reset-*/  # Per-reset planning state
    └── .patches/                 # Patch history
```

## Core State Files — Contracts

### 1. `session-continuity.json` — Cross-Session State

**Format:** `ContinuityStoreFile` (versioned JSON object)

**Schema:**
```typescript
ContinuityStoreFile = {
  version: number           // Schema version (currently 1)
  updatedAt: number         // Unix timestamp (ms) of last write
  sessions: Record<string, SessionContinuityRecord>
  governance: GovernancePersistenceState
}

SessionContinuityRecord = {
  sessionID: string         // OpenCode session ID (ses_XXXX)
  promptParams: object      // Prompt creation parameters
  toolProfile?: object      // Allowed/denied tools
  metadata: {
    status: TaskStatus      // pending | queued | running | completed | failed | error | cancelled | interrupt
    description: string
    delegation: DelegationMeta | null
    category?: string
    constraints: string[]
    lifecycle?: SessionLifecycleState  // current phase + transition history
    pendingNotifications: PendingNotification[]  // Queued parent-session notifications
    resultCapture?: CapturedResult
    compactionCheckpoint?: CompactionCheckpointData
    delegationPacket?: DelegationPacket
    route?: string
    lastToolActivityAt?: number
    updatedAt: number
  }
}

SessionLifecycleState = {
  phase: SessionLifecyclePhase  // created | queued | dispatching | running | completed | failed
  observation?: { source: string; observedAt: number; detail: string }
  error?: string
  transitionHistory?: Array<{ from: SessionLifecyclePhase; to: SessionLifecyclePhase; at: number }>
}

PendingNotification = {
  sessionID: string
  description: string
  agent: string
  status: "started" | "completed" | "failed" | "cancelled"
  error?: string
  resultPreview?: string
  briefSummary?: string
  outputLink?: string
  duration?: number
  metadata?: {
    delegationId: string
    terminalState: DelegationStatus
    recoveryGuarantee?: "resumable" | "best-effort" | "non-resumable-after-restart"
    summaryPreview?: string
  }
  createdAt: number
  delivered: boolean
}
```

**Read contract:**
- Deep-clone-on-read via `cloneSessionContinuity()` / `getSessionContinuity(sessionID)` — prevents mutation aliasing
- Single-record read: `getSessionContinuity(sessionID)` → `SessionContinuityRecord | undefined`
- Bulk read: `listSessionContinuity()` → `SessionContinuityRecord[]`
- Always use the read functions through the `continuity.ts` module — never read the raw file directly

**Write contract (for tools only, not agents):**
- `patchSessionContinuity(sessionID, partial)` — shallow merge into existing record
- `recordSessionContinuity(record)` — full upsert
- All writes go to `.hivemind/state/session-continuity.json`
- Write-before-respond: always persist state changes before returning tool results

**Recovery paths:**
- `hydrateFromContinuity()` — loads all sessions from disk, rehydrates delegation state into in-memory Maps
- `recoverPending()` — called on plugin init, replays delegation polling for sessions not yet terminal
- `replayPendingNotificationsForEvent(sessionID, eventType)` — delivers queued parent-session notifications on `session.created` or `session.updated` events

### 2. `delegations.json` — Delegation Records

**Format:** Array of `Delegation` objects (persisted by `delegation-persistence.ts`)

**Schema:**
```typescript
Delegation = {
  id: string                          // UUID delegation ID
  parentSessionId: string             // Caller session
  childSessionId: string              // Spawned child session
  agent: string                       // Agent name dispatched
  status: DelegationStatus            // dispatched | running | completed | error | timeout
  createdAt: number                   // Unix timestamp (ms)
  safetyCeilingMs: number             // Max duration (default: 30 min)
  lastMessageCount: number            // For dual-signal completion detection
  stablePollCount: number             // Consecutive stable polls
  lastMessageCountChangeAt: number    // Timestamp of last message change
  nestingDepth: number                // Delegation chain depth (max: 3)
  executionMode: "sdk" | "pty"        // Dispatch mechanism
  workingDirectory: string            // Working directory for child
  queueKey: string                    // Concurrency lane key
  surface: "agent-delegation" | "command-process"
  recoveryGuarantee: "resumable" | "best-effort" | "non-resumable-after-restart"
  explicitCancellation: boolean       // User explicitly cancelled
  completedAt?: number
  error?: string
  terminalDetail?: string
  resultBriefSummary?: string
  gracePeriodExpiresAt?: number
}
```

**Read contract:**
- `readPersistedDelegations()` — reads the full array from disk
- Always use through the persistence helper — never read the raw file directly
- File may be empty after pruning (empty array, not missing)

**Write contract (tools only):**
- `persistDelegations(delegations: Delegation[])` — overwrites the full array
- Pruning: when delegations exceed `MAX_DELEGATIONS_BEFORE_PRUNE` (50), oldest completed/error records exceeding `DEFAULT_PRUNE_MAX_AGE_MS` (30 min) are removed

**Recovery paths:**
- On plugin init: `recoverPending()` scans for non-terminal delegations and resumes polling
- `handleSessionIdle(sessionID)` — triggered by `session.idle` event, transitions to completed
- `handleSessionDeleted(sessionID)` — triggered by `session.deleted` event, transitions to error with cleanup

### 3. `event-tracker/` — Session Event Journals

**Format:** One JSON + one Markdown file per session (`ses_XXXX.json`, `ses_XXXX.md`)

**JSON record:**
```typescript
EventTrackerRecord = {
  sessionId: string
  events: Array<{
    type: string
    source: string          // Hook source (session, tool, plugin)
    timestamp: number       // Unix timestamp (ms)
    data?: Record<string, unknown>
  }>
}
```

**Read contract:**
- `createEventTrackerArtifactsFromHook()` — writes events to `.hivemind/event-tracker/`
- Controlled by `shouldTrackEventTrackerEvent(event)` — filters relevant event types
- Sessions are identified by the last 4 hex chars of the session ID (e.g., `ses_2252`)
- Best-effort audit projection: failures are silently ignored, never block canonical event handling

**File naming:** `ses_{last4hex}{json|md}` — both JSON and Markdown versions are generated for each tracked session.

### 4. `config-workflows.json` — Workflow Configuration State

**Format:** Versioned JSON object tracking batch-config workflow progress

**Schema:**
```typescript
ConfigWorkflowsStore = {
  version: number
  updatedAt: number
  workflows: Record<string, ConfigWorkflow>
}

ConfigWorkflow = {
  id: string
  type: string                    // e.g., "batch-config"
  currentTurn: number             // Current workflow turn (0-indexed)
  turns: Record<string, {         // Turn number → status
    status: "pending" | "complete" | "failed"
    output: object | null
    completedAt?: number
  }>
  targetPrimitives: Array<{       // Primitives being configured
    type: "agent" | "command" | "skill" | "tool"
    name: string
  }>
  scope: "project" | "user"
  mode: string
  startedAt: number
  updatedAt: number
}
```

**Read contract:**
- `readWorkflow(id)` — reads a single workflow record
- `advanceTurn(workflow, turnNumber)` — marks a turn as complete
- `persistWorkflow(workflow)` — writes updated state to disk

**Write contract (tools only):**
- Auto-persisted by `configure-primitive` tool's `tool.execute.after` hook
- Best-effort: failures are silently ignored — does not affect the tool call result

### 5. `planning/` — Task Persistence (hm-planning-persistence)

**Format:** Subdirectories containing `task_plan.md`, `findings.md`, and `progress.md`

**Structure:**
```
.hivemind/state/planning/
└── {reset-name}-YYYY-MM-DD/    # Per-reset planning directory
    ├── task_plan.md            # Task breakdown and status
    ├── findings.md             # Research findings and evidence
    └── progress.md             # Session progress tracking
```

**Read contract:**
- These files follow the hm-planning-persistence template format
- Read for cross-session context recovery
- Written by agents using Manus-style file-based planning

### 6. `SESSION-STATE.md` — Session State (WAL Protocol)

**Format:** Markdown with WAL (Write-Ahead Log) protocol

**Structure:**
```markdown
# SESSION-STATE.md — Title
**WAL Protocol: Write BEFORE responding. Survives compaction.**

## Current Task
[Task description]

## Key Context
[Context bullets]

## Pending Actions
- [ ] [Checklist items]

## Recent Decisions
| Decision | Rationale | When |
|----------|-----------|------|
```

**Read contract:**
- WAL protocol: always read BEFORE responding to maintain context
- Survives context compaction — this is cross-session durable state
- Write-before-respond: update status before returning results

## Agent Access Boundaries

| Agent Depth | `.hivemind/state/` Read | `.hivemind/state/` Write | Notes |
|-------------|------------------------|--------------------------|-------|
| **L0 (orchestrator)** | Full read access | Conditional write via tools | May dispatch sessions, read all state for coordination |
| **L1 (coordinator)** | Read current session records | Write via delegation tools only | `delegate-task`, `delegation-status` tools proxy writes |
| **L2 (specialists)** | Read-only | No direct write | Consume state, don't mutate. Use tools for mutations |
| **L3 (reference)** | Read-only | No direct write | This skill level — reference only |
| **Human user** | Full read access | Direct `.hivemind/` edit (not recommended) | Prefer tool-mediated access |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Direct Muter** | Agent reads and writes state files directly | Use Hivemind tools (`delegate-task`, `delegation-status`, etc.) for all mutations. Direct file manipulation bypasses concurrency control and notification delivery. |
| **The Stale Reader** | Agent caches state without hydrate refresh | State is durable but in-memory Maps must be hydrated. Call `hydrateFromContinuity()` or re-read disk. |
| **The Path Guesser** | Hardcoded paths | `.hivemind/state/` is canonical per Q6. Legacy `.opencode/state/` paths are migration-only. Always reference canonical paths. |
| **The Notification Ignorer** | Agent spawns a child session but never checks parent notifications | Parent sessions receive `pendingNotifications` on child completion. Check `session-continuity.json` for undelivered notifications. |
| **The Nesting Violator** | Agent delegates beyond depth 3 | `MAX_DELEGATION_DEPTH = 3`. Use result retrieval pattern (poll existing delegation status) instead of further delegation. |

## Self-Correction

### When State Files Are Missing

[Detection] If `.hivemind/state/session-continuity.json` is missing, the store hasn't been initialized. This is normal for first-run sessions — the file is created on first `persistStore()` call. If `delegations.json` is missing, no delegations have been recorded yet — empty array `[]` is the correct state.

[Recovery] For first-run: proceed — the file will be created automatically. For unexpected disappearance after prior work: check `.hivemind/state/` permissions and disk space. The continuity store has no backup mechanism — lost state requires session restart.

### When State Appears Stale

[Detection] If `updatedAt` timestamp in `session-continuity.json` is more than 30 minutes old but active sessions exist, hydration may be out of sync. Compare in-memory state vs disk: in-memory Maps (`state.ts`) hydrate from continuity at plugin init but don't auto-refresh.

[Recovery] Re-read `session-continuity.json` from disk. Agent-level rehydration is not available — the plugin must restart to trigger `hydrateFromContinuity()`.

### When Delegation Records Conflict With Session State

[Detection] If `delegations.json` shows `completed` but `session-continuity.json` shows `running`, the delegation terminal handler completed but session continuity wasn't patched. This is a known race condition in WaiterModel dispatch.

[Recovery] Trust `delegations.json` for delegation state (it's the write-side authority). Trust `session-continuity.json` for session lifecycle state (it's the read-side projection). If they diverge, report as a state drift issue but don't attempt manual reconciliation.

### When Recovery Fails

[Detection] If `recoverPending()` fails on plugin init (child sessions that existed before restart are gone), the parent session receives `failed` notifications with `Child session not found on recovery` error. These are delivered as `pendingNotifications` on the next parent session event.

[Recovery] Check `pendingNotifications` in the parent's session-continuity record. Failed recovery notifications include the original `delegationId` for cross-referencing with delegation records.

### When the User Contradicts Skill Guidance

[Detection] If the user asks to directly modify `.hivemind/` state files, warn that bypassing the tool layer breaks concurrency control, notification delivery, and WAL protocol guarantees. If the user insists, proceed with the modification but document the bypass.

[Recovery] Prefer tool-mediated access. If forced to direct-edit, note the bypass in SESSION-STATE.md for audit trail.

---

**Canonical state root:** `.hivemind/` (Q6, locked 2026-04-25)
**Legacy compatibility:** `.opencode/state/opencode-harness/` — migration bridge only, one-way to `.hivemind/`
**Cross-reference:** See `hm-l3-hivemind-engine-contracts` for tool registration, hook composition, and lifecycle phases that produce and consume this state.
