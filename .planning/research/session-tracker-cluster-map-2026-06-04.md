<!-- refreshed: 2026-06-05 -->
# Session-Tracker Cluster Map

**Analysis Date:** 2026-06-05
**Author:** subagent (codebase-mapper role) delegated by `hm-l0-orchestrator`
**Context:** Deep-research prerequisite for TODO-2 (`delegationType` discriminator design) per audit TODO-1
**Evidence level:** L5 documentation (read-only research; no runtime claim)

---

## 0. Executive Summary

The session-tracker cluster is a **9,990-LOC, 38-file stateful subsystem** under `src/features/session-tracker/` that owns durable session knowledge in `.hivemind/session-tracker/`. It is composed of 7 distinct subsystems (persistence, capture, classification, recovery, project-continuity, streaming, transform) and is wired into **6 read-side tools, 3 write-side paths, 2 hook observers, 2 coordination layer managers, and 1 lifecycle manager**.

**Total LOC:** 9,990 (excluding 3 `.gitkeep` placeholders and 1 empty `hooks/` directory)
**Total files:** 38 TypeScript modules
**Disk artifacts produced:** main `.md` (with YAML frontmatter), child `.json`, per-session `session-continuity.json`, per-session `hierarchy-manifest.json`, project `project-continuity.json`, retry-degraded `retry-degraded.json`, `quarantine/<ses_id>/`
**Runtime directory:** 29 session subdirs (sampled); sizes range from 4 KB to 30+ MB; typical root 30–80 child .json files
**Schema versions:** `SessionRecord` v2.0 / `HierarchyManifest` v1.0 / `ChildSessionRecord` v1.0 (no version bump between v2.0 schema file format and runtime)

### 0.1 Top 5 Most-Coupled Modules (by import count)

| Rank | Module | Path | Import Count | Coupling Direction |
|------|--------|------|--------------|---------------------|
| **1** | `safeSessionPath` / `atomicWriteJson` | `src/features/session-tracker/persistence/atomic-write.ts:33,141` | **19** | both read (tools) and write (persistence) |
| **2** | `SessionTracker` / `SessionRecovery` | `src/features/session-tracker/index.ts:100` | **6** (tools read), **1** (hook writes) | 6 tool consumers, 1 hook consumer |
| **3** | `HierarchyIndex` | `src/features/session-tracker/persistence/hierarchy-index.ts:48` | **8** internal + **5** tools (read manifest) | 8 internal callers (classifier, router, bootstrap, tool-delegation, recovery) + 5 tools read `hierarchy-manifest.json` |
| **4** | `ChildWriter` | `src/features/session-tracker/persistence/child-writer.ts:30` | **7** internal + **2** external (delegation-persistence dual-write) | 7 internal callers + 1 write-tool (legacy reader) |
| **5** | `SessionIndexWriter` (per-session `session-continuity.json`) | `src/features/session-tracker/persistence/session-index-writer.ts:31` | **5** internal + **3** tools read `.json` files via `resolveSessionFile()` | 5 internal callers + tools read indirectly |

### 0.2 Complexity Score

**9/10** (intricate). Reasoning:
- 4 overlapping identifier systems: `SessionRecord.sessionID`, `ChildRef.sessionID`, `HierarchyManifestChild.sessionID`, `Delegation.childSessionId` (legacy)
- 3 sub-indexes: per-session `session-continuity.json`, per-session `hierarchy-manifest.json`, project-wide `project-continuity.json`
- 4 lifecycle classifications: `root` / `child` / `unknownSub` / pending-dispatch
- 4 write paths converging on `child-writer`: `ToolDelegation.recordChildTaskDelegation`, `SessionCreatedHandler.writeImmediateChildFile`, `ToolCapture.handleTask`, `delegation-persistence.persistDelegations` (dual-write), `continuity/index.ts:347,425` (dual-write)
- 2 competing "child" definitions: `hierarchy-manifest.json` (D-07 authoritative per the manifest writer) vs `session-continuity.json` (canonical tree per G-1) — see TODO-4 mirror-vs-owner audit
- 1 in-memory child event bus (P58.8) that subscribes to `client.session.subscribe` and feeds `delegation-status progress` action

---

## 1. Session-Tracker Core

### 1.1 Public API Surface

**File:** `src/features/session-tracker/index.ts`

The barrel re-exports 4 type-groups + 1 factory class:

| Export | File:Line | Type | Purpose |
|--------|-----------|------|---------|
| `SessionTracker` | `index.ts:100` | class | Main composition root, instantiated once in `plugin.ts` |
| `SessionTracker.handleSessionEvent(event)` | `index.ts:184` | method | Routes `session.created/idle/deleted/error/compacted/text.ended` to handler classes |
| `SessionTracker.handleChatMessage(input, output)` | `index.ts:274` | method | Captures user/assistant messages; routes to `child-recorder` for child sessions |
| `SessionTracker.handleToolExecuteAfter(input, output)` | `index.ts:331` | method | Captures tool metadata; triggers child `.json` creation on `task`/`delegate-task` |
| `SessionTracker.handleToolExecuteBefore(params)` | `index.ts:486` | method | Proactive child session discovery via polling (200ms × 5) |
| `SessionTracker.constructCoreDependencies()` | `index.ts:519` | method | Synchronous DI for `onChildSessionCreated` race window (D-01) |
| `SessionTracker.initialize()` | `index.ts:540` | method | Async init: builds hierarchy index, starts retry loop, runs cleanup |
| `SessionTracker.cleanup()` | `index.ts:626` | method | Clears retry interval on plugin shutdown |
| `SessionTracker.getLastMessageCapture()` | `index.ts:148` | method | Wires `LastMessageCapture` to event observer pipeline |
| `getManualOverrideState(sid)` | `index.ts:56` | function | tmux-copilot take-over/release state read (P58 G5) |
| `setManualOverrideState(sid, state)` | `index.ts:65` | function | tmux-copilot manualOverride flag writer |
| `SessionRecovery` | `recovery/session-recovery.ts:67` | class | `initialize()`, `reconsumeSession()`, `rebuildSessionContext()` |
| `ReconsumptionResult`, `SessionContext` | `recovery/session-recovery.ts:32,48` | types | Recovery return shapes |
| `SessionRecord`, `ChildSessionRecord`, `HierarchyManifest`, `SessionContinuityIndex`, `ProjectContinuityIndex`, `HierarchyManifestChild`, `ChildHierarchyEntry`, `ChildRef`, `DelegatedBy`, `MainAgent`, `Turn`, `ToolRecord`, `JourneyEntry`, `ProjectSessionEntry`, `SessionTrackerEvent`, `DelegationLifecycleStatus`, `DelegationEventBase` | `types.ts:51, 95, 119, 208, 278, 325, 341, 361, 385, 409, 143, 157, 226, 238` | types | Domain models |
| `isValidSessionID(id)` | `types.ts:444` | function | Path-traversal guard |
| `isValidHookPayload(payload)` | `types.ts:464` | function | Hook payload shape check |

### 1.2 Internal Data Structures

**File:** `src/features/session-tracker/types.ts`

**Root main `.md` (`SessionRecord`, types.ts:119-140):**
- `sessionID, created, updated, parentSessionID, delegationDepth, children, continuityIndex, status, title?, lastMessage?`

**Child `.json` (`ChildSessionRecord`, types.ts:278-318):**
- Core: `sessionID, parentSessionID, delegationDepth, delegatedBy, created, updated, status, mainAgent, turns, children, lastMessage?`
- Audit: `journey?: JourneyEntry[]` (CP-ST-05-01)
- P41-B gap fields (types.ts:303-317): `pendingNotifications?, queueKey?, terminalKind?, recoveryGuarantee?, executionMode?: "sdk"|"pty"|"headless", compactionCheckpoint?, lifecycle?`

**Per-session index (`SessionContinuityIndex`, types.ts:361-379):**
- `version: "2.0", sessionID, lastUpdated, hierarchy: { root, children: Record<childID, ChildHierarchyEntry> }, turnCount, toolSummary`

**Per-session manifest (`HierarchyManifest`, types.ts:208-221):**
- `version: "1.0", rootMainSessionID, lastUpdated, children: Record<childID, HierarchyManifestChild>, totalChildren, maxDepth`
- D-07 authoritative: child records with status, depth, delegatedBy, subagentType, childFile

**Project index (`ProjectContinuityIndex`, types.ts:409-420):**
- `version: "2.0", projectRoot, lastUpdated, sessions: Record<sessionID, ProjectSessionEntry>, chronologicalOrder: string[]`

**Lifecycle event union (`SessionTrackerEvent`, types.ts:95-98):**
- 3-event discriminated union: `delegation-queued` / `delegation-dispatched` / `delegation-terminal` (P58 G6 REQ-58-06)
- Carries `emittedAt: number` epoch for monotonic ordering (BATS slot 66)

### 1.3 Module File Map (LOC descending)

| LOC | File | One-line |
|-----|------|----------|
| 681 | `persistence/child-writer.ts` | Child `.json` lifecycle (createChildFile, updateChildStatus, appendChildTurn, appendJourneyEntry, backfill*) |
| 671 | `index.ts` | SessionTracker class + manualOverride map |
| 583 | `tool-delegation.ts` | Child delegation handler (recordChildTaskDelegation, polling, journey, trajectory/contract creation) |
| 502 | `capture/tool-capture.ts` | Per-tool pruning for `skill`, `read`, `task` |
| 471 | `types.ts` | Domain types + isValidSessionID |
| 449 | `persistence/project-index-writer.ts` | `project-continuity.json` serial-queue writer |
| 444 | `capture/message-capture.ts` | User/assistant message capture (per-tool, turn counters, SDK backfill) |
| 415 | `recovery/session-recovery.ts` | `reconsumeSession`, `rebuildSessionContext`, child context rendering |
| 382 | `persistence/hierarchy-index.ts` | In-memory `childToParent`/`childToRootMain` + `buildFromDisk` |
| 378 | `persistence/pending-dispatch-registry.ts` | In-flight dispatch TTL tracker (30s) |
| 378 | `orphan-cleanup.ts` | Quarantine orphan child directories (preserves hierarchy before move) |
| 370 | `persistence/retry-queue.ts` | Child-write retry with exp-backoff (1s/2s/4s/8s/16s, MAX_RETRIES=5) |
| 341 | `capture/handlers/types.ts` | HandlerDeps + `resolveChildLifecycleRoute` + `writeImmediateChildFile` + `findCompactionText` + `resolveCompactionFromMessages` |
| 334 | `persistence/session-writer.ts` | Main `.md` writer (YAML frontmatter + body append) |
| 334 | `persistence/session-index-writer.ts` | Per-session `session-continuity.json` serial-queue writer |
| 320 | `persistence/hierarchy-manifest.ts` | `HierarchyManifestWriter` (cache + regenerate-from-continuity) |
| 280 | `initialization.ts` | DI constructor for 20 deps |
| 240 | `capture/last-message-capture.ts` | Bounded FIFO cache (5 entries) for `message.updated`/`message.part.updated` |
| 220 | `streaming/child-event-stream.ts` | In-memory ring buffer (100 events/session) for `client.session.subscribe` |
| 180 | `persistence/atomic-write.ts` | Crash-safe write helpers + path safety |
| 167 | `bootstrap.ts` | `ensureSessionReady`, `getSessionSafely`, `copyForkedChildren` |
| 166 | `persistence/orphan-quarantine.ts` | Move-to-quarantine (no delete) |
| 164 | `capture/event-capture.ts` | Event router (dispatches to 7 handler classes) |
| 162 | `classification.ts` | `SessionClassifier` 3-gate fallback (SDK → hierarchy → pending) |
| 158 | `capture/handlers/session-idle-handler.ts` | Update status="completed", capture lastMessage |
| 149 | `capture/child-backfiller.ts` | SDK → child `.json` turn backfill |
| 148 | `tool-delegation-utils.ts` | Pure helpers: `pruneToolInput/Output`, `extractTaskID/Result`, `deriveSubagentType` |
| 145 | `child-recorder.ts` | Child message capture (skips ensureSessionReady) |
| 129 | `project-continuity.ts` | Walks disk to ensure `project-continuity.json` completeness |
| 119 | `transform/agent-transform.ts` | Assistant metadata extraction |
| 115 | `capture/handlers/session-created-handler.ts` | Dual write-path: child or main directory |
| 103 | `session-router.ts` | `RoutingDecision` (child/main/unknownSub) |
| 94 | `capture/handlers/session-deleted-handler.ts` | Status="cancelled" + backfill |
| 82 | `capture/handlers/session-error-handler.ts` | Status="error" + backfill |
| 66 | `capture/handlers/session-compacted-handler.ts` | Compaction block + child journey entry |
| 50 | `capture/handlers/session-next-text-ended-handler.ts` | lastMessage update |

**Total:** 9,990 LOC across 38 files

---

## 2. Atomic Writer

**File:** `src/features/session-tracker/persistence/atomic-write.ts` (180 LOC)

### 2.1 Public Helpers

| Helper | Line | Pattern | Edge Cases |
|--------|------|---------|------------|
| `atomicWriteJson(filePath, data)` | 33-56 | `write-to-tmp.{timestamp}.{random} → fs.rename` | Cross-volume detection (G-5 / REQ-21-02): emits warning but does NOT throw. Post-rename `unlink` cleanup (F-01 / REQ-21-01) is best-effort. |
| `atomicAppendMarkdown(filePath, content)` | 74-97 | read existing → merge with `\n` separator → write-tmp → rename → unlink | If existing file is unreadable, starts fresh (line 82-85). |
| `ensureDirectory(dirPath)` | 105-107 | `mkdir { recursive: true }` | None. |
| `sanitizeSessionID(sessionID)` | 117-125 | Strip non-`[a-zA-Z0-9_-]`. Throws if `< 3 chars` after sanitize. | Throws on intentionally short IDs. |
| `safeSessionPath(projectRoot, sessionID, filename)` | 141-170 | Path-traversal guard BEFORE sanitize. Resolves under `.hivemind/session-tracker/`. Validates resolved path starts with `trackerRoot + sep`. | Throws on `..`, `/`, `\\` in inputs (line 147-156). |
| `sessionTrackerRoot(projectRoot)` | 178-180 | `resolve(projectRoot, ".hivemind/session-tracker")` | None. |

### 2.2 Pattern Observations

- **No `fsync()`** is performed before rename. The pattern is: write tmp → rename → best-effort unlink. On power-loss, the data file is either complete or untouched (no torn writes), but the tmp file may be orphaned.
- **Cross-volume rename** is detected via `stat().dev` mismatch and only emits a warning (atomic-write.ts:42-48). It does NOT fall back to copy+unlink — the user is left to know that cross-volume is not atomic on this kernel.
- **No file locking.** Concurrent writers to the same `.json` rely on the per-file/per-session serial queue (see child-writer.ts:196, session-index-writer.ts:107, project-index-writer.ts:427) for ordering.
- **`.tmp.{timestamp}.{random}`** is the only pattern used; no `.swp` or `.bak`. The `session-writer.ts:104` and `updateFrontmatter` (line 249) use a SLIGHTLY different pattern (`${filePath}.tmp.${Date.now()}` without the random suffix) — this is a minor inconsistency.

### 2.3 Consumers of Atomic Writer

| Consumer | File:Line | Operation |
|----------|-----------|-----------|
| `HierarchyManifestWriter.writeManifest` | `hierarchy-manifest.ts:309-319` | `atomicWriteJson` |
| `SessionWriter.append*Turn` | `session-writer.ts:118, 139, 159, 188, 220, 320` | `atomicAppendMarkdown` |
| `SessionWriter.updateFrontmatter` | `session-writer.ts:235-253` | direct `writeFile` + `rename` (NOT atomicWriteJson — DEFECT-06) |
| `SessionWriter.addChildRef` | `session-writer.ts:283-308` | direct `writeFile` + `rename` |
| `SessionWriter.initializeSessionFile` | `session-writer.ts:71-108` | direct `writeFile` + `rename` |
| `ChildWriter.createChildFile/updateChildStatus/appendChildTurn/appendJourneyEntry/backfillChildMetadata/backfillChildTurns` | `child-writer.ts:413, 450, 493, 548, 592, 635` | `atomicWriteJson` (via internal helper) |
| `SessionIndexWriter.initializeIndex/addChild/updateChildStatus/incrementTurnCount/updateToolSummary` | `session-index-writer.ts:174, 196, 275, 301, 319` | `atomicWriteJson` |
| `ProjectIndexWriter.initializeIndex/addSession/updateSession/incrementChildCount/removeSession/cleanupStaleEntries` | `project-index-writer.ts:134, 212, 271, 335, 362, 166` | `atomicWriteJson` |
| `RetryQueue.persistDegradedRecord` | `retry-queue.ts:303-331` | `atomicWriteJson` |
| `OrphanCleanup.preserveOrphanHierarchy` | `orphan-cleanup.ts:271-272` | `atomicWriteJson` |

**Total consumers: 11 internal modules use atomicWriteJson or atomicAppendMarkdown.**

---

## 3. Logics (Decision Points)

The "logics" modules are `classification.ts`, `session-router.ts`, `orphan-cleanup.ts`, and the 3-gate fallback in `index.ts:152-220`. These encapsulate all session-lifecycle decision logic.

### 3.1 Classification (the central decision point)

**File:** `src/features/session-tracker/classification.ts`

```typescript
// classification.ts:24
export type ClassificationResult =
  | { kind: "root"; gate: "sdk" }
  | { kind: "child"; parentID: string; gate: "sdk" | "hierarchy" | "pending" | "none" }
  | { kind: "unknownSub"; gate: "none" }
```

**3-gate fallback (`SessionClassifier.classify`, classification.ts:84-131):**
1. **Gate 1: SDK parentID** (line 92-101). Fastest. If SDK returns `parentID !== undefined` → `{ kind: "child", gate: "sdk" }`.
2. **Gate 2: Hierarchy index** (line 107-113). Fallback when SDK doesn't report. If `hierarchyIndex.getParent(sessionID)` is truthy → `{ kind: "child", gate: "hierarchy" }`.
3. **Gate 3: Pending dispatch registry** (line 115-121). Race-condition guard. If `pendingRegistry.has(sessionID)` and entry has parentSessionID → `{ kind: "child", gate: "pending" }`.
4. **Final:** If SDK said "root" (line 122-125), return `{ kind: "root", gate: "sdk" }`. Otherwise (line 130) return `{ kind: "unknownSub", gate: "none" }` — **RC-3 LOCKED**: unknown sessions become default-sub, never root.

**Decision tree:**
```
SDK parentID?
├── YES ──> child (gate: "sdk")
└── NO
    ├── hierarchyIndex.has(parent)?
    │   ├── YES ──> child (gate: "hierarchy")
    │   └── NO
    │       ├── pendingRegistry.has(sessionID)?
    │       │   ├── YES ──> child (gate: "pending")
    │       │   └── NO
    │       │       ├── SDK said root (parentID === null/undefined)?
    │       │       │   ├── YES ──> root (gate: "sdk")
    │       │       │   └── NO ──> unknownSub (gate: "none")  ← never root
```

### 3.2 Router (decision consumer)

**File:** `src/features/session-tracker/session-router.ts:79-93`

```typescript
switch (classification.kind) {
  case "child":      return { route: "child", parentID, classification }
  case "root":       return { route: "main", classification }
  case "unknownSub": return { route: "unknownSub", classification }
}
```

**Route semantics (consumed by `index.ts:286` and `index.ts:298`):**
- `route: "child"` → skip `ensureSessionReady`, route to `childRecorder`
- `route: "main"` → call `ensureSessionReady`, proceed with main capture
- `route: "unknownSub"` → only proceed if `hasMainSessionFile` (i.e., directory was bootstrapped by a prior write path); else drop

### 3.3 Ancestor Resolution

**File:** `src/features/session-tracker/index.ts:438-471` (`ensureAncestorRoute`)

Recursively walks the SDK parent chain, registers each ancestor in the in-memory `HierarchyIndex`, and **caps recursion at `MAX_DEPTH = 20`** (line 443) to prevent stack overflow on corrupt SDK data (F-13 / REQ-21-07).

### 3.4 Hierarchy Depth Cap

**File:** `src/features/session-tracker/persistence/hierarchy-index.ts:295-315` (`getDepth`)

```typescript
const capped = Math.min(depth, 2)
// G-7 guardrail (REQ-21-15): Log warning when depth exceeds the cap.
if (depth > 2) {
  process.emitWarning(
    `[Harness] Session tracker: delegation depth ${depth} exceeds max 2 — truncating to ${capped}. Session: "${sessionID}"`,
  )
}
```

**LOCKED GA-2**: max delegation depth = 2. Warning emitted for observability.

### 3.5 Orphan Cleanup

**File:** `src/features/session-tracker/orphan-cleanup.ts:97-197`

Decisions:
1. `hierarchyIndex.isChild(sessionID)` → orphan (line 135-138)
2. No `session-continuity.json` + classified as child → orphan (line 141-157)
3. **G-6 guardrail** (line 163-172): warn if quarantining a session that has a valid continuity tree (may be legitimate child)
4. **Preserve hierarchy before move** (line 175-178): orphan's `session-continuity.json` children are merged into root main's index and manifest (CP-ST-05-03)

### 3.6 Status Precedence (Race-window guard)

**File:** `src/features/session-tracker/persistence/child-writer.ts:466-473` (`updateChildStatus`)

```typescript
const terminalStates = new Set(["completed", "error", "aborted", "cancelled"])
if (terminalStates.has(record.status) && !terminalStates.has(status)) {
  return // Preserve terminal state
}
```

This prevents `session.idle` (after `recordChildTaskDelegation` set "completed") from reverting to "active".

---

## 4. Event Tracker

The "event tracker" in this cluster is `src/features/session-tracker/capture/event-capture.ts` (164 LOC) — a **thin router** reduced from 1,050 LOC per REQ-C6-01. It dispatches 7 event types to dedicated handler classes.

### 4.1 Event Sources (upstream)

| Source | File:Line | Routes to | Notes |
|--------|-----------|-----------|-------|
| OpenCode `event` hook | `src/hooks/observers/session-tracker-consumer.ts:34` | `sessionTracker.handleSessionEvent({eventType, sessionID, event})` | **The ONLY write entrypoint from hooks.** |
| OpenCode `chat.message` hook | (called by plugin.ts) | `sessionTracker.handleChatMessage(input, output)` | Captures user/assistant messages |
| OpenCode `tool.execute.after` hook | (called by plugin.ts) | `sessionTracker.handleToolExecuteAfter(input, output)` | Captures tool metadata, child `.json` creation |
| OpenCode `tool.execute.before` hook | (called by plugin.ts) | `sessionTracker.handleToolExecuteBefore(params)` | Proactive child session polling (200ms × 5) |
| OpenCode `message.updated` / `message.part.updated` | (called by plugin.ts via `getLastMessageCapture()`) | `LastMessageCapture.handleEvent(event)` | Streamed text + thinking cache |

### 4.2 Event Types (downstream handlers)

**File:** `src/features/session-tracker/capture/event-capture.ts:71-79`

```typescript
this.handlers = {
  "session.created":                new SessionCreatedHandler(this.deps),  // handlers/session-created-handler.ts:14
  "session.idle":                   new SessionIdleHandler(this.deps),     // handlers/session-idle-handler.ts:17
  "session.deleted":                new SessionDeletedHandler(this.deps),  // handlers/session-deleted-handler.ts:15
  "session.error":                  new SessionErrorHandler(this.deps),    // handlers/session-error-handler.ts:13
  "session.compacted":              new SessionCompactedHandler(this.deps),// handlers/session-compacted-handler.ts:14
  "session.next.compaction.ended":  new SessionCompactedHandler(this.deps),// same handler
  "session.next.text.ended":        new SessionNextTextEndedHandler(this.deps),// handlers/session-next-text-ended-handler.ts:14
}
```

| Event Type | Handler | Status Set | File:Line |
|------------|---------|------------|-----------|
| `session.created` | SessionCreatedHandler | n/a (creates files) | `session-created-handler.ts:21-114` |
| `session.idle` | SessionIdleHandler | `completed` | `session-idle-handler.ts:24-126` |
| `session.deleted` | SessionDeletedHandler | `cancelled` | `session-deleted-handler.ts:22-93` |
| `session.error` | SessionErrorHandler | `error` | `session-error-handler.ts:20-81` |
| `session.compacted` | SessionCompactedHandler | n/a (writes compaction block) | `session-compacted-handler.ts:21-65` |
| `session.next.text.ended` | SessionNextTextEndedHandler | n/a (lastMessage) | `session-next-text-ended-handler.ts:21-49` |

Unknown event types are logged at warn level and dropped (event-capture.ts:107-113).

### 4.3 Handler Decision Flow (per `session.created`)

**File:** `src/features/session-tracker/capture/handlers/session-created-handler.ts`

1. **Gate 0 — pending dispatch check** (line 23-39): if `pendingRegistry.getAnyActiveEntry()` exists, immediately call `writeImmediateChildFile` with parent's sessionID. Closes the race where child data was lost between `session.created` and `PostToolUse`.
2. **SDK parentID** (line 42-61): try twice with 100ms backoff. If `parentID != null`, call `writeImmediateChildFile`.
3. **Hierarchy index** (line 63-69): if `hierarchyIndex.isChild(sessionID)`, use `getParent()` and call `writeImmediateChildFile`.
4. **Pending registry (direct)** (line 71-78): if `pendingRegistry.has(sessionID)`, use the entry's `parentSessionID` and call `writeImmediateChildFile`.
5. **Default — create root main** (line 80-103): call `sessionWriter.createSessionDir` + `initializeSessionFile` + `projectIndexWriter.addSession`.

**Branch coverage:** every child `.json` write goes through `writeImmediateChildFile` (`handlers/types.ts:105-202`), which writes the child, registers in `sessionIndexWriter.addChild`, increments project index, adds to manifest, and updates root's `children` array.

---

## 5. Child Event Tracker (the "child event stream")

**File:** `src/features/session-tracker/streaming/child-event-stream.ts` (220 LOC, P58.8 S4 REQ-58-10)

This is the **in-memory child event bus** that the user calls "the child event tracker". It is **distinct** from `event-capture.ts` (which captures session-lifecycle events) — it captures **child session SDK events** in real-time.

### 5.1 What Makes It "Child"

- It subscribes to `client.session.subscribe(childSessionId, handler)` (line 92, 104) — per-child subscription.
- Stores per-session **ring buffer capped at 100 events** (line 69, 183-186).
- Module-singleton `childEventStream` (line 220) shared across all child sessions.
- **Counter aggregation** (line 149-160): derives `actionCount`, `messageCount` (from `message`/`message.part` event types), `toolCallCount` (from `tool.call`/`tool.execute`).

### 5.2 Event Shape

```typescript
// child-event-stream.ts:32-37
export interface ChildEvent {
  eventType: string    // extracted from raw.type / raw.eventType / raw.kind
  sessionId: string
  emittedAt: number    // Date.now() ms epoch
  payload: Record<string, unknown>  // opaque — SDK shape varies
}
```

### 5.3 Consumer (single)

`delegation-status.ts:861-891` (`handleProgress`):
- `deps.getLastChildEvent(delegation.childSessionId)` returns the last event for live "what is the child doing" display.
- Counter-based `progressPct` is the fallback when the bus is unavailable.

### 5.4 Failure Modes

- `subscribe` returns silently if `client.session.subscribe` is not a function (line 99-102) — R2 mitigation from the 58-PLAN.
- All SDK subscribe/unsubscribe errors are caught (line 108-110, 122-126) and logged at warn.
- Counter-based progress is the fallback (line 100 comment).

---

## 6. Parent-Child Relationships

### 6.1 Schema (in-memory data structures)

**File:** `src/features/session-tracker/persistence/hierarchy-index.ts:48-79`

```typescript
export class HierarchyIndex {
  // childID → parentID map
  private childToParent: Map<string, string> = new Map()
  // parentID → Set<childID> (reverse index for descendant propagation)
  private parentToChildren: Map<string, Set<string>> = new Map()
  // childID → rootMainSessionID map (D-03, D-08)
  private childToRootMain: Map<string, string> = new Map()
}
```

### 6.2 Public API

| Method | Line | Returns | Notes |
|--------|------|---------|-------|
| `buildFromDisk()` | 94-143 | Promise<void> | 3-pass scan: (1) read all `session-continuity.json` files, (2) resolve rootMain for non-orphan children, (3) G-2 REQ-21-05 rebuild pass |
| `registerChildrenFromTree(parentID, children)` | 155-174 | void | Recursive register |
| `registerChild(parentID, childID)` | 188-207 | void | Sets `childToParent`, propagates `rootMain` to all descendants (RC-1) |
| `propagateRootMain(childID, rootMain)` | 219-227 | void | Walks reverse index |
| `getParent(childID)` | 235-237 | `string \| null` | O(1) |
| `getRootMain(childID)` | 251-253 | `string \| undefined` | O(1) — returns `childToRootMain.get` |
| `resolveRootMain(childID)` | 265-274 | `string \| undefined` | Walks `childToParent` chain with cycle detection (T-04-05) |
| `isChild(sessionID)` | 282-284 | `boolean` | O(1) |
| `getDepth(sessionID)` | 295-315 | `number` | Walks chain, **capped at 2** (GA-2), warns if exceeds |
| `rebuildChildToRootMain()` | 332-341 | void | First-found-wins for DAG |
| `getChildCountForSession(sessionID)` | 350-352 | `number` | O(1) via reverse index |
| `getMaxDepthForSession(sessionID)` | 361-374 | `number` | Recursive walk |
| `size` (getter) | 379-381 | `number` | O(1) |

### 6.3 On-disk Schema (`hierarchy-manifest.json`)

**File:** `src/features/session-tracker/types.ts:175-221` + `persistence/hierarchy-manifest.ts:62-95`

```typescript
// D-07 authoritative: per-session hierarchy-manifest.json
interface HierarchyManifest {
  version: "1.0"
  rootMainSessionID: string
  lastUpdated: string
  children: Record<string, HierarchyManifestChild>  // FLAT map, not tree
  totalChildren: number
  maxDepth: number
}

interface HierarchyManifestChild {
  sessionID: string
  parentSessionID: string
  rootMainSessionID: string
  delegationDepth: number
  delegatedBy: string
  subagentType: string
  createdAt: string
  updatedAt: string
  status: string       // active | idle | completed | error | aborted | cancelled
  turnCount: number
  childFile: string
}
```

### 6.4 On-disk Schema (`session-continuity.json`)

**File:** `src/features/session-tracker/types.ts:341-379`

```typescript
// Nested tree (not flat)
interface SessionContinuityIndex {
  version: "2.0"
  sessionID: string
  lastUpdated: string
  hierarchy: {
    root: string
    children: Record<string, ChildHierarchyEntry>  // RECURSIVE
  }
  turnCount: number
  toolSummary: Record<string, number>
}

interface ChildHierarchyEntry {
  file: string
  depth: number
  status: string
  delegatedBy: string
  subagentType?: string
  children: Record<string, ChildHierarchyEntry>  // recursive
}
```

### 6.5 The Manifest vs Continuity Tension (CRITICAL FOR TODO-4)

**Per G-1 in `hierarchy-manifest.ts:180-200`**: "The continuity tree is the canonical hierarchy source. The manifest is a derivative cache — generated from the tree at read time to eliminate drift."

BUT in practice:
- `hierarchy-manifest.ts:62-95` (`addChild`): directly writes to the manifest without regenerating from the tree.
- `child-writer.ts:413-438` (`createChildFile`): writes child `.json`, then `tool-delegation.ts:385-402` updates the manifest.
- `session-index-writer.ts:196-237` (`addChild`): writes `session-continuity.json`.
- The two stores can drift if a write succeeds in one but fails in the other.

**Mitigation:** `hierarchy-manifest.ts:285-297` regenerates the manifest from the continuity tree on cache miss.

### 6.6 Query Patterns for Tools

| Tool | Read pattern | File:Line |
|------|-------------|-----------|
| `session-tracker.ts` | Direct `readFile` of `hierarchy-manifest.json` per session | `session-tracker.ts:357-371` |
| `session-hierarchy.ts` | Reads `hierarchy-manifest.json` then `session-continuity.json` fallback | `session-hierarchy.ts:209-282` |
| `session-delegation-query.ts` | `readdir(rootDir)` → `hierarchy-manifest.json` for each | `session-delegation-query.ts:264-284` |
| `delegation-status.ts` | Per-invocation cache (5s TTL, 10 entries max) of `hierarchy-manifest.json` | `delegation-status.ts:19-21, 191-207` |
| `hivemind-session-view.ts` | First tries session-tracker, then `delegations.json` | `hivemind-session-view.ts:69-102` |
| `session-context.ts` | Reads `project-continuity.json` (flat) for cross-session queries | `session-context.ts:69-76, 252-300` |
| `session-resolver.ts` | Three-step: project index → directory scan → manifest lookup | `session-resolver.ts:48-112` |

---

## 7. Tool Interactions (Read/Write Map)

### 7.1 READ-ONLY Tools (consume session-tracker data)

| Tool | File | Read Pattern | Key Files Touched | Notes |
|------|------|--------------|--------------------|-------|
| `delegation-status` | `src/tools/delegation/delegation-status.ts:891` | In-process `DelegationManager` + `getSessionTrackerChildren` (line 210) + per-invocation `manifestCache` | `hierarchy-manifest.json`, child `.json` | 891 LOC, the most complex tool. Actions: `status`, `list`, `control`, `find-stackable`, `pool`, `peek`, `progress`. |
| `session-tracker` | `src/tools/session/session-tracker.ts:423` | 6 actions: `export-session`, `get-status`, `get-summary`, `list-sessions`, `search-sessions`, `filter-sessions` | `.md` frontmatter, `session-continuity.json`, `hierarchy-manifest.json`, child `.json` (search only) | Search uses `searchChildJsonFiles` (line 65) which scans child .json for `lastMessage`/`turn.content`/`journey[].content`/`delegatedBy.subagentType` (D-02). |
| `session-hierarchy` | `src/tools/session/session-hierarchy.ts:283` | 4 actions: `get-children`, `get-parent-chain`, `get-delegation-depth`, `get-manifest` | `session-continuity.json`, `hierarchy-manifest.json` | `getManifest` has a continuity-tree fallback (line 256-281). |
| `session-delegation-query` | `src/tools/session/session-delegation-query.ts:284` | 2 actions: `list`, `get` | `hierarchy-manifest.json`, child `.json` | 1000-result cap (line 97). "Reads exclusively from session-tracker files" (line 9 comment, REQ-P41E-03). |
| `hivemind-session-view` | `src/tools/hivemind/hivemind-session-view.ts:155` | 1 action: `get` (cross-root: 3 data roots) | `session-continuity.json` + child `.json` + `hierarchy-manifest.json` + `delegations.json` (fallback) + `trajectory-ledger.json` | "Tries session-tracker first, falls back to delegations.json" (line 70). |
| `session-context` | `src/tools/session/session-context.ts:301` | 4 actions: `find-related`, `cross-reference`, `synthesize-context`, `aggregate` | `project-continuity.json`, `session-continuity.json`, child `.json`, `hierarchy-manifest.json` | `aggregate by subagentType` walks every root's `hierarchy-manifest.json` (line 268-285). |
| `tmux-copilot` | `src/tools/tmux-copilot.ts` | Reads `getManualOverrideState(sid)` from session-tracker index (line 42) | (in-memory) | Only the `take-over` / `release` actions touch session-tracker (write, see 7.2). |
| `session-journal-export` | `src/tools/session/session-journal-export.ts` | (no direct read) | (n/a) | Reads `.hivemind/state/journal/` not session-tracker. |
| `tmux-state-query` | `src/tools/tmux-state-query.ts` | (no direct read) | (n/a) | Tmux state query, not session-tracker. |
| `execute-slash-command` | `src/tools/session/execute-slash-command.ts:17` | Imports `isValidSessionID` for ID validation | (none) | Path validation only. |
| `bootstrap-init`, `bootstrap-recover`, `configure-primitive`, `validate-restart`, `configure-primitive-paths` | `src/tools/config/*` | (no direct read) | (n/a) | Bootstrap and config tools don't read session-tracker. |

### 7.2 WRITE PATHS to session-tracker (only via persistence layer, NEVER via tools)

Tools do NOT write directly to session-tracker (per CQRS REQ-ST-11). Writes happen through:
1. **Hooks** (`session-tracker-consumer.ts`, `chat-message-capture.ts`, `tool-before-guard.ts`)
2. **Coordination layer** (`src/coordination/delegation/manager.ts:15` imports `ToolDelegation`)
3. **Persistence layer** (`continuity/delegation-persistence.ts:6-8` imports `ChildWriter` + `HierarchyManifestWriter` for dual-write)
4. **Lifecycle** (`src/task-management/lifecycle/index.ts`)

| Write Path | Source | Trigger | File:Line |
|------------|--------|---------|-----------|
| `ToolCapture.handleTask` → `childWriter.createChildFile` + manifest write | `capture/tool-capture.ts:228-394` | `task` tool completes | `child-writer.ts:413-438` |
| `ToolDelegation.recordChildTaskDelegation` → manifest + index + project | `tool-delegation.ts:292-454` | `task`/`delegate-task` tool | `child-writer.ts:413`, `hierarchy-manifest.ts:62`, `session-index-writer.ts:196`, `project-index-writer.ts:335` |
| `SessionCreatedHandler.writeImmediateChildFile` | `capture/handlers/session-created-handler.ts:32-77` → `handlers/types.ts:105-202` | `session.created` event | `child-writer.ts:413`, `hierarchy-manifest.ts:62`, `session-index-writer.ts:196`, `project-index-writer.ts:212` |
| `delegation-persistence.persistDelegations` (dual-write) | `task-management/continuity/delegation-persistence.ts:56-101` | DelegationManager persists | `child-writer.ts:413`, `hierarchy-manifest.ts:62` |
| `continuity/index.ts` dual-write paths | `task-management/continuity/index.ts:347, 425` | Continuity load | `child-writer.ts:413` |
| `tmux-copilot` take-over/release | `tools/tmux-copilot.ts:413, 427` | take-over/release | `setManualOverrideState` (in-memory) |
| `EventCapture.recordJourneyEntry` | `capture/event-capture.ts:127-163` | journey event | `child-writer.ts:548`, `session-writer.ts:320` |
| `LastMessageCapture` streaming updates | `capture/last-message-capture.ts:158-181` | `message.part.updated` | `session-writer.ts:235` (via callback) |

### 7.3 WRITE-LIKE Operations (Lifecycle / Recovery)

| Path | File:Line | Notes |
|------|-----------|-------|
| `OrphanCleanup.cleanupOrphanDirectories` | `orphan-cleanup.ts:97-197` | Moves directories to `quarantine/` |
| `OrphanQuarantine.cleanupOld` | `persistence/orphan-quarantine.ts:110-150` | Removes old quarantined dirs |
| `ProjectIndexWriter.cleanupStaleEntries` | `persistence/project-index-writer.ts:166-200` | Removes entries whose dirs no longer exist |
| `ProjectContinuityChecker.ensureCompleteness` | `project-continuity.ts:63-128` | Walks disk, registers missing sessions |
| `HierarchyIndex.buildFromDisk` | `persistence/hierarchy-index.ts:94-143` | Rebuilds in-memory index on init |
| `RetryQueue.flush` | `persistence/retry-queue.ts:266-293` | 30s periodic flush |

### 7.4 Hot-Path Tools (in-process)

| Tool | Hot? | Why |
|------|------|-----|
| `delegation-status` | YES | Called every ~5s for stack discovery; 5s manifest cache |
| `hivemind-trajectory` | YES | Reads `trajectory-ledger.json` (not session-tracker but related) |
| `hivemind-session-view` | YES | 3-root fan-out per call |

---

## 8. Continuity Relationships

### 8.1 The Two Continuities

There are **two distinct "continuity" files** in this codebase that are NOT the same thing:

| File | Path | Owner | Purpose |
|------|------|-------|---------|
| **`.hivemind/session-tracker/{sessionID}/session-continuity.json`** | `types.ts:361` | `SessionIndexWriter` | Per-session tree of children |
| **`.hivemind/session-tracker/project-continuity.json`** | `types.ts:409` | `ProjectIndexWriter` | Flat index of all sessions |
| **`.hivemind/state/session-continuity.json`** (LEGACY) | `task-management/continuity/index.ts:46-50` | `continuity/index.ts` | Old single-file continuity (session summary, not hierarchy) |

The legacy file is still written by `src/task-management/continuity/index.ts` but is read by `continuity-reader.ts` (which prefers session-tracker data, per P41-C).

### 8.2 Continuity-Reader Integration

**File:** `src/task-management/continuity/continuity-reader.ts:1-150`

- **P41-C**: "All 5 readers now prefer session-tracker data over old files." (line 4)
- Uses `resolveSessionFile()` to load the child record (line 11 comment)
- "Does NOT import features/session-tracker/persistence/" (line 11) — only types, to avoid coupling

### 8.3 Project-Continuity Completeness Walk

**File:** `src/features/session-tracker/project-continuity.ts:63-128` (`ProjectContinuityChecker.ensureCompleteness`)

Triggered once during `SessionTracker.initialize()` (index.ts:600). Walks:
1. Every `ses_*` subdirectory → registers the main session in `project-continuity.json`
2. Every `.json` file in each subdir (except `session-continuity.json` and `hierarchy-manifest.json`) → registers as a child session

This is the **boot-time reconciliation** that catches orphans from crashed writes.

### 8.4 Dual-Write to Legacy

**File:** `src/task-management/continuity/delegation-persistence.ts:56-101` (`persistDelegations`)

```typescript
// P41-B: Dual-write to session-tracker (fire-and-forget, best-effort)
try {
  const childWriter = new ChildWriter({ projectRoot })
  const manifestWriter = new HierarchyManifestWriter({ projectRoot })
  for (const d of delegations) {
    // ... createChildFile + addChild
  }
} catch { /* fire-and-forget */ }
```

**And reading** (line 103-227): `readPersistedDelegations()` ignores `delegations.json` (REQ-P41D-01) and instead reads every `hierarchy-manifest.json` + every `*.json` child file in the session-tracker root.

**Net effect:** session-tracker is the **canonical** source per P41-D-01. `delegations.json` is **legacy-only**, not written, not read.

---

## 9. Trajectory + Agent-Work-Contract Relationships

### 9.1 Trajectory Wiring

**File:** `src/features/session-tracker/tool-delegation.ts:494-580` (`createDelegationTrajectoryAndContract`)

Called from `recordChildTaskDelegation` (line 423-425). On every successful child session creation:

```typescript
const trajectoryId = `traj-${childSessionID}`  // line 502
const contractId = `awc-${childSessionID}`     // line 503

// Trajectory
attachTrajectoryEvidence({ trajectoryId, rootSessionId: rootMain, ... })  // line 510
eventTrajectory({ trajectoryId, eventType: "delegation_dispatch", ... })  // line 518

// Contract
createAgentWorkContract({ id: contractId, owner: { agent, sessionId, parentSessionId }, ... })  // line 541
```

### 9.2 Trajectory Back-Wiring

**File:** `src/features/session-tracker/capture/handlers/session-idle-handler.ts:134-157` (`recordTrajectoryCompletion`)

When a child session goes idle:
```typescript
eventTrajectory({
  projectRoot: this.deps.projectRoot,
  trajectoryId: `traj-${sessionID}`,
  eventType: "delegation_completed",
  summary: `Child session ${sessionID} completed`,
  evidenceRef: `session-tracker:idle:${sessionID}`,
})
```

### 9.3 The 3-Event Lifecycle (P58 G6 REQ-58-06)

**File:** `src/features/session-tracker/tool-delegation.ts:32-47` + `types.ts:95-98`

In-memory `delegationEventLog: SessionTrackerEvent[]` with 3 events:
- `delegation-queued` (line 317-326) — emitted when `recordChildTaskDelegation` is called
- `delegation-dispatched` (line 411-420) — emitted after SDK child-session creation
- `delegation-terminal` (line 466-481) — emitted when status transitions to terminal

Exposed via `getDelegationEventLog()` (line 35) and `recordDelegationTerminal()` module function (line 66) for BATS test seam slot 66.

### 9.4 Agent-Work-Contract Storage

**File:** `.hivemind/state/agent-work-contracts.json`

Sampled 1 file, 10 KB (small). Created by `createAgentWorkContract` (delegation.ts:541). Read by `hivemind-agent-work.ts:78-95` (the `hivemind-agent-work-export` tool).

### 9.5 Trajectory Storage

**File:** `.hivemind/state/trajectory-ledger.json`

Writes go via `eventTrajectory` and `attachTrajectoryEvidence` from `src/task-management/trajectory/index.ts`. Reads via `hivemind-trajectory.ts:80-127` (the `hivemind-trajectory` tool).

### 9.6 Coupling Summary

| Direction | Files |
|-----------|-------|
| session-tracker → trajectory | `tool-delegation.ts:506-534`, `session-idle-handler.ts:134-157` (import `trajectory/index.js` dynamically) |
| session-tracker → agent-work-contracts | `tool-delegation.ts:539-579` (import `features/agent-work-contracts/index.js` dynamically) |
| trajectory → session-tracker | (no inbound) — trajectory is **consumer of session-tracker events** |
| agent-work-contracts → session-tracker | (no inbound) — contracts are stored separately at `.hivemind/state/agent-work-contracts.json` |

**Key insight:** session-tracker is the **producer** of trajectory events and agent-work-contracts. Trajectory and contracts are read-side only from session-tracker's perspective.

---

## 10. Sample of `.hivemind/session-tracker/` Directory Structure

### 10.1 Top-level structure (sampled 2026-06-05)

```
.hivemind/session-tracker/
├── project-continuity.json                  (115 KB, single root index)
├── quarantine/                              (4 quarantined session dirs)
│   ├── ses_16d063bc8ffeTWnpKqqnWDfmVT/
│   ├── ses_177191049ffex2SX6zz4IwPIoZ/
│   ├── ses_17cf18755ffeTMejp1qbL43h3A/
│   └── ses_18064fed0ffe6bJgq6xiIUsb6t/
└── ses_*/                                   (29 root main session dirs)
```

**29 root main session directories** (as listed in §0.4 directory listing). Sizes range from 4 KB (empty) to 30+ MB (high-activity).

### 10.2 Per-session file composition

**Sampled 3 root sessions** (one minimal, one typical, one large):

| Session ID | Files in dir | Size pattern |
|------------|-------------|--------------|
| `ses_16a7b4487ffeBZ12xqaWkx7d1k` | 4 files: `hierarchy-manifest.json` (700 B), `ses_*.json` (138 KB child), `ses_*.md` (71 KB main), `session-continuity.json` (583 B) | **Minimal + 1 child** |
| `ses_16d6c2575ffeZH4qZetUqOoZkB` | 18 files: `hierarchy-manifest.json` (7.4 KB), 12 child `.json` (5 KB–145 KB), `ses_*.md` (402 KB), `session-continuity.json` (3.2 KB) | **Typical root with 12+ L1 children** |
| `ses_17c1b5b41ffe3D6kdDn8fcc4Mk` | 87 files: `hierarchy-manifest.json` (39 KB), ~80 child `.json` (3 KB–382 KB), `ses_*.md` (**30 MB**!), `session-continuity.json` (17 KB), **4 orphaned `.tmp.*` files** (11–26 MB each) | **Large root with sticky tmp files** |

### 10.3 File Naming Conventions

| Pattern | Example | Meaning |
|---------|---------|---------|
| `{sessionID}/{sessionID}.md` | `ses_xyz/ses_xyz.md` | Root main markdown with YAML frontmatter |
| `{sessionID}/{childSessionID}.json` | `ses_xyz/ses_abc.json` | Child delegation record |
| `{sessionID}/session-continuity.json` | `ses_xyz/session-continuity.json` | Per-session tree index |
| `{sessionID}/hierarchy-manifest.json` | `ses_xyz/hierarchy-manifest.json` | Per-session D-07 manifest |
| `quarantine/{sessionID}/` | `quarantine/ses_abc/` | Quarantined orphan (with `.quarantined-at` timestamp file) |
| `project-continuity.json` | `project-continuity.json` | Project-wide flat index |
| `retry-degraded.json` | (when present) | Persistent retry records (no current file in sample) |
| `{sessionID}.md.tmp.{timestamp}.{random}` | `ses_xyz.md.tmp.1780395965977.r7lt16e1` | **Stale atomic-write intermediates** (the large session has 4) |

### 10.4 Are these mirrors of OpenCode SDK state, or Hivemind's own state?

**Hivemind's own state** with **selective mirroring** of OpenCode SDK:
- `session-continuity.json.hierarchy.children` = `parentID` from SDK + local L0/L1 detection
- `hierarchy-manifest.json` = Hivemind-derived (status, turnCount, childFile)
- `ChildSessionRecord` = mix of SDK fields (created, updated, lastMessage) + Hivemind fields (delegationDepth, journey, status, executionMode)
- `project-continuity.json` = Hivemind-only (chronologicalOrder, childCount, totalDelegationDepth)

**Hivemind's mirror model (per D-1 corrected via TODO-1 D1):** the session-tracker **mirrors OpenCode session events** (via hooks) and **adds Hivemind-specific discriminators** (status, subagentType, delegation depth, journey, manifest).

**Per TODO-4 (open audit):** This needs to be re-lensed per track, with the new framing that the previous "abolish duplicated state" was over-applied. The current architecture is correct in keeping session-tracker as a Hivemind-owned state that mirrors and annotates.

### 10.5 Stale `.tmp.*` Files — Failure Mode Observed

`ses_17c1b5b41ffe3D6kdDn8fcc4Mk/` has 4 `.tmp.*` files totalling **~64 MB**:
- `ses_17c1b5b41ffe3D6kdDn8fcc4Mk.md.tmp.1780395965977.r7lt16e1` (11.6 MB, 2026-06-03)
- `ses_17c1b5b41ffe3D6kdDn8fcc4Mk.md.tmp.1780398944088.fb0e8upx` (11.7 MB, 2026-06-03)
- `ses_17c1b5b41ffe3D6kdDn8fcc4Mk.md.tmp.1780490005994.f2toxkik` (26.0 MB, 2026-06-04)
- `ses_17c1b5b41ffe3D6kdDn8fcc4Mk.md.tmp.1780491134608.3y5afrjt` (26.0 MB, 2026-06-04)

These are atomic-write intermediates orphaned by a crash. The `OrphanCleanup.cleanupOrphanedTmpFiles` (`orphan-cleanup.ts:358-377`) is designed to remove them at next init, but it only runs `if (entry.name.includes(".tmp."))` on **root-level** files (line 365), not recursively. **BUG: nested `.tmp.*` files in subdirs are NOT cleaned up by the current logic.** The user's `ses_xyz/{sessionID}.md.tmp.*` files would need a recursive scan.

---

## 11. `delegationType` Design Implications

### 11.1 What is `delegationType`?

Per TODO-1 / TODO-2, the field should differentiate:
- `delegate-task` (Hivemind async WaiterModel, returns immediately with delegation ID)
- `task` (OpenCode native sync, in main session)
- `execute-slash-command` (Hivemind orchestrated command, may recurse)
- `sdk-direct` (raw OpenCode SDK call bypassing Hivemind)

### 11.2 Where the Field Would Need to Be Added

**11.2.1 Write Side (session-tracker producer)**

| File | Change | Risk |
|------|--------|------|
| `src/features/session-tracker/types.ts` (HierarchyManifestChild) | Add optional `delegationType?: "delegate-task" \| "task" \| "execute-slash-command" \| "sdk-direct"` | LOW — new optional field |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts:75-87` (HierarchyManifestChild entry) | Add `delegationType` to the entry builder | LOW |
| `src/features/session-tracker/persistence/child-writer.ts:312-349` (createChildFile metadata) | Pass through `delegationType` from caller | LOW |
| `src/features/session-tracker/tool-delegation.ts:296-454` (recordChildTaskDelegation) | Add `delegationType` parameter, default to `input.tool` ("task" or "delegate-task"), set to "execute-slash-command" or "sdk-direct" if applicable | MEDIUM — parameter threading |
| `src/features/session-tracker/capture/handlers/types.ts:105-202` (writeImmediateChildFile) | Pass through `delegationType` | LOW |
| `src/features/session-tracker/capture/handlers/session-created-handler.ts:32-77` | Pass through | LOW |
| `src/features/session-tracker/capture/tool-capture.ts:228-394` (handleTask) | Pass through | LOW |
| `src/features/session-tracker/task-management/continuity/delegation-persistence.ts:23-54` (buildChildRecordFromDelegation) | Add `delegationType` to `ChildSessionRecord` builder | MEDIUM — needs new field on `Delegation` type |
| `src/shared/types.ts` (Delegation) | Add `delegationType?: "delegate-task" \| ...` | MEDIUM — type chain extends |
| `src/coordination/delegation/types.ts` | Add `delegationType` to Delegation pool-types | MEDIUM — affects 7-literal superset (P58 G6) |

**11.2.2 Read Side (tool consumers)**

| File | Change | Risk |
|------|--------|------|
| `src/tools/delegation/delegation-status.ts:80-114` (renderDelegation) | Add `delegationType: delegation.delegationType` to response | LOW |
| `src/tools/delegation/delegation-status.ts:126-132` (renderDelegationV2) | Add `delegationType` | LOW |
| `src/tools/delegation/delegation-status.ts:34-44` (Zod schema) | Add `delegationType` to filter | LOW |
| `src/tools/delegation/readers/session-tracker-reader.ts:36` (hierarchyChildToDelegation) | Pass through | LOW |
| `src/tools/delegation/readers/types.ts:56-67` (HierarchyManifestChildSchema) | Add `delegationType: z.string().optional()` | LOW |
| `src/tools/session/session-delegation-query.ts:127-141` (DelegationSummary) | Add `delegationType` field | LOW |
| `src/tools/session/session-hierarchy.ts:209-282` (getManifest) | Add `delegationType` to children listing | LOW |
| `src/tools/hivemind/hivemind-session-view.ts:74-86` (readDelegationsForSession) | Pass through | LOW |
| `src/task-management/continuity/continuity-reader.ts` (5 readers) | If exposed, pass through | LOW |
| `src/features/agent-work-contracts/*` | Optional — extend contract schema | OPTIONAL |

**11.2.3 Filter Plumbing (TODO-3)**

| File | Change | Risk |
|------|--------|------|
| `src/schema-kernel/session-tracker.schema.ts` (if `delegationType` filter added) | Add to Zod | LOW |
| `src/schema-kernel/session-hierarchy.schema.ts` (if same) | Add to Zod | LOW |
| `src/schema-kernel/session-delegation-query.schema.ts` (line 41-54) | Already has filter; add `delegationType` to input | LOW |

### 11.3 Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| **R1** | **Backward compat**: existing manifest/child `.json` files lack `delegationType`. Tools that filter on it will return empty sets. | MEDIUM | Default filter behavior = "return all" if no filter set. Document as opt-in discriminator. |
| **R2** | **Schema migration**: the `HierarchyManifestChildSchema` in `readers/types.ts:56-67` is a Zod `.parse()` that REJECTS unknown fields by default. Adding a field requires `passthrough` or `.optional()` for both schema and persisted JSON. | MEDIUM | Use `.optional()` on `delegationType` field — `.safeParse` already supports missing fields. |
| **R3** | **Type chain fragility**: `Delegation` type in `src/coordination/delegation/types.ts` is the source of truth for 7-literal `DelegationLifecycleStatus` (P58 G6). Adding `delegationType` is a non-union change but requires care. | LOW | Add as optional `string` literal union, not as part of discriminated union. |
| **R4** | **Test seams**: `delegationEventLog` (tool-delegation.ts:32) is a module-singleton test seam with strict types. BATS slot 66 may break. | MEDIUM | Add `delegationType` to `SessionTrackerEvent` metadata, don't add to the 3-event discriminated union. |
| **R5** | **Dual-write drift**: `delegation-persistence.persistDelegations` (delegation-persistence.ts:65-101) does a fire-and-forget dual-write. If `delegationType` is added to one writer but not the other, the manifests will diverge. | MEDIUM | Add to BOTH `buildChildRecordFromDelegation` (line 23-54) AND the `manifestWriter.addChild` (line 84-95) call site. |
| **R6** | **Stale tmp files**: existing session dirs already have orphans (see §10.5). A new field on `HierarchyManifestChild` is forward-compatible, so no migration of old files is required. | LOW | None. |
| **R7** | **Hook chain contamination**: `delegationType` should be set by the WRITER, not derived. If hooks try to infer it from event payloads, the field becomes unreliable. | MEDIUM | Pass `delegationType` as a constructor parameter to all writers; never derive from event payloads. |
| **R8** | **Quarantined session handling**: when a session is quarantined (orphan-cleanup.ts:174-178), its `delegationType` is preserved (read-only move). | LOW | None. |
| **R9** | **Manifest vs continuity drift**: if `delegationType` is only on the manifest and not the continuity tree, the regeneration (`hierarchy-manifest.ts:285-297`) will drop it. | MEDIUM | Add to `ChildHierarchyEntry` (types.ts:341-354) so regeneration propagates. |
| **R10** | **Trajectory event surface**: `eventTrajectory` is called for delegation dispatch. Adding `delegationType` to the trajectory `summary` or `metadata` requires changes in 3 call sites. | LOW | None — optional metadata. |

### 11.4 Test Seam Impacts

- `BATS slot 66` (monotonicity assertions on `delegationEventLog`) — no break if `delegationType` is added to metadata only.
- `P41-G` (tool-capture.ts:228+ turn capture regression) — no impact.
- `continuity-reader.ts:1-150` (5 readers) — must `pick` `delegationType` into the response shape.

---

## 12. Recommended Minimal Viable Design (MVD)

### 12.1 MVD Principles

1. **Optional field, never required.** All existing on-disk files remain valid.
2. **Set at WRITE time, never derived from event payloads.**
3. **Single source of truth on the writer.** Pass through every writer path.
4. **Default behavior is "return all"** — tools don't filter unless asked.
5. **Mirror to both `ChildSessionRecord` and `HierarchyManifestChild`** to prevent regeneration drift (R9).

### 12.2 Field Definition

```typescript
// types.ts — add to HierarchyManifestChild (line 175) AND ChildSessionRecord (line 278)
export type DelegationType = "delegate-task" | "task" | "execute-slash-command" | "sdk-direct"

// On HierarchyManifestChild (line 175-198):
delegationType?: DelegationType

// On ChildSessionRecord (line 278-318):
delegationType?: DelegationType
```

### 12.3 Setter Convention

```typescript
// tool-delegation.ts:296 (recordChildTaskDelegation):
const delegationType: DelegationType =
  input.tool === "delegate-task" ? "delegate-task" :
  input.tool === "task" ? "task" :
  "sdk-direct"  // fallback for unrecognised tool
```

### 12.4 Minimal File Changes (MVD)

**Required (5 files, ~30 lines):**
1. `src/features/session-tracker/types.ts:175-198` — add `delegationType?: DelegationType` to `HierarchyManifestChild`
2. `src/features/session-tracker/types.ts:278-318` — add `delegationType?: DelegationType` to `ChildSessionRecord`
3. `src/features/session-tracker/types.ts:341-354` — add `delegationType?: string` to `ChildHierarchyEntry` (R9 mitigation)
4. `src/features/session-tracker/persistence/hierarchy-manifest.ts:75-87` — add `delegationType` to entry builder
5. `src/features/session-tracker/persistence/child-writer.ts:328-349` (createChildFile merge) — preserve `delegationType`

**Wiring (4 files, ~40 lines):**
6. `src/features/session-tracker/tool-delegation.ts:296-454` — compute `delegationType` from `input.tool` and pass through
7. `src/features/session-tracker/capture/handlers/types.ts:105-202` (writeImmediateChildFile) — pass through
8. `src/features/session-tracker/capture/tool-capture.ts:228-394` (handleTask) — pass through
9. `src/features/session-tracker/task-management/continuity/delegation-persistence.ts:23-101` (buildChildRecordFromDelegation + dual-write) — derive from `Delegation.tool` field (which exists) and pass to both child and manifest writers

**Read-side enrichment (1 file, ~10 lines):**
10. `src/tools/delegation/readers/session-tracker-reader.ts:36` (hierarchyChildToDelegation) — add `delegationType: child.delegationType`

**Total: 10 files, ~80 lines of changes.** Zero file deletions. Zero schema-breaking changes. All existing on-disk data remains valid (R1 mitigated).

### 12.5 What This MVD Does NOT Touch (out of scope for v1)

- **Filter UI in tools** (TODO-3) — separate change
- **Agent-work-contract schema** — could extend later
- **Trajectory event payload** — optional enhancement
- **Dormant `delegations.json` legacy** — already ignored (REQ-P41D-01)
- **Mirror-vs-owner audit (TODO-4)** — independent decision

---

## 13. Open Questions for L0

1. **`DelegationType` enum extension** — should `execute-slash-command` be a first-class value, or should we use `"harness-command"` to be consistent with the existing `surface: "agent-delegation"` terminology? The current `surface` field on `Delegation` (delegation-persistence.ts:46) is the only existing discriminator; `delegationType` is new.

2. **Default for `task` tool** — the OpenCode native `task` tool is used by BOTH Hivemind-orchestrated sub-agents (which should be `task`) AND user-issued tasks (which should be...?). If a user uses `task` directly without `delegate-task`, what is the `delegationType`?

3. **`execute-slash-command` and child session tracking** — the `execute-slash-command` tool (`src/tools/session/execute-slash-command.ts`) may or may not create a child session depending on the command. Should `delegationType = "execute-slash-command"` be set ONLY when the command produces a tracked delegation? Or always, to distinguish command-driven from `task`/`delegate-task`-driven?

4. **Quarantined session migration** — old quarantined session dirs (4 in the sample) lack `delegationType`. Should the next `OrphanCleanup` pass attempt to backfill from `Delegation` records (cross-store lookup), or accept the gap?

5. **Cycle detection in 100-event ring buffer** — `child-event-stream.ts:180-186` drops the OLDEST event on overflow at 100. For long-lived child sessions, the bus may evict events before the parent's `delegation-status progress` polls. Should we increase to 200 or 500, or move the buffer to disk?

6. **Manifest write atomicity gap** — `hierarchy-manifest.ts:309-319` uses `atomicWriteJson` for the manifest file, but the child `.json` is written by a SEPARATE call in `child-writer.ts:430`. A crash between the two writes leaves the manifest pointing to a non-existent child file. Should the pair be wrapped in a single `atomicWriteJsonPair` helper? (Or is the existing `cleanupOrphanDirectories` enough?)

7. **Stale tmp file cleanup scope** — `orphan-cleanup.ts:358-377` only removes root-level `*.tmp.*` files. The sampled `ses_17c1b5b41ffe3D6kdDn8fcc4Mk/` has 4 nested `*.tmp.*` files (11–26 MB each, total 64 MB). Should the cleanup be recursive?

8. **`hierarchy-manifest.json` `version: "1.0"` vs `session-continuity.json` `version: "2.0"`** — different versions for the two related stores. The user's "delegationType" field may need a schema bump. Should both be unified to `"1.0"` or `"2.0"`?

9. **Effective difference between "stale `*.tmp.*`" and a real `delegationType`-tagged write** — once we have a `delegationType`, we can filter cleanup by it. But the atomic-write pattern doesn't tag `.tmp.*` files. Is that a future improvement, or out of scope?

10. **The "abort" vs "cancelled" status** — the `updateChildStatus` precedence guard (child-writer.ts:466-473) lists `["completed", "error", "aborted", "cancelled"]` as terminal. The `Delegation` type has `aborted` and `cancelled` (legacy-reader.ts:178). Are these mapping 1:1 to `delegationType`? Or is `delegationType` orthogonal to status?

---

## 14. Summary Statistics

| Metric | Value |
|--------|-------|
| Total session-tracker LOC | 9,990 |
| Total files | 38 |
| Total test seams (BATS / module singletons) | 4 (`delegationEventLog`, `childEventStream`, `getManualOverrideState`/`setManualOverrideState`, `manifestCache` in delegation-status.ts:19) |
| Persistence file types | 5 (`.md`, `.json`, `session-continuity.json`, `hierarchy-manifest.json`, `project-continuity.json`, plus `retry-degraded.json` and `quarantine/`) |
| Writer classes | 6 (`SessionWriter`, `ChildWriter`, `SessionIndexWriter`, `ProjectIndexWriter`, `HierarchyManifestWriter`, `OrphanQuarantine`) |
| Reader tools | 8 (`session-tracker`, `session-hierarchy`, `session-delegation-query`, `hivemind-session-view`, `session-context`, `delegation-status`, `session-resolver`, `delegation-persistence`) |
| Hook writers | 3 (`session-tracker-consumer`, `chat-message-capture`, `tool-before-guard`) |
| Coordination integrations | 3 (`manager.ts:15`, `coordinator.ts:10`, `manager-runtime.ts`) |
| Sample session dirs in `.hivemind/session-tracker/` | 29 |
| Total `delegationType` MVD files to change | 10 |
| Total `delegationType` MVD lines to change | ~80 |
| Risk register entries | 10 |
| Open questions for L0 | 10 |

---

## 15. Citations Index (file:line)

- Atomic writer pattern: `src/features/session-tracker/persistence/atomic-write.ts:33-56, 74-97`
- SessionTracker class: `src/features/session-tracker/index.ts:100-671`
- Public types: `src/features/session-tracker/types.ts:51-471`
- Hierarchy index in-memory: `src/features/session-tracker/persistence/hierarchy-index.ts:48-382`
- Hierarchy manifest writer: `src/features/session-tracker/persistence/hierarchy-manifest.ts:35-320`
- Child writer: `src/features/session-tracker/persistence/child-writer.ts:30-681`
- Session writer: `src/features/session-tracker/persistence/session-writer.ts:31-334`
- Session index writer: `src/features/session-tracker/persistence/session-index-writer.ts:31-334`
- Project index writer: `src/features/session-tracker/persistence/project-index-writer.ts:38-449`
- Retry queue: `src/features/session-tracker/persistence/retry-queue.ts:97-370`
- Pending dispatch registry: `src/features/session-tracker/persistence/pending-dispatch-registry.ts:64-378`
- Orphan quarantine: `src/features/session-tracker/persistence/orphan-quarantine.ts:22-166`
- Classification: `src/features/session-tracker/classification.ts:58-162`
- Session router: `src/features/session-tracker/session-router.ts:55-103`
- Event capture router: `src/features/session-tracker/capture/event-capture.ts:45-164`
- 7 handler classes: `src/features/session-tracker/capture/handlers/*-handler.ts`
- HandlerDeps + helpers: `src/features/session-tracker/capture/handlers/types.ts:33-341`
- Message capture: `src/features/session-tracker/capture/message-capture.ts:64-444`
- Tool capture: `src/features/session-tracker/capture/tool-capture.ts:57-502`
- Last message capture: `src/features/session-tracker/capture/last-message-capture.ts:46-240`
- Child backfiller: `src/features/session-tracker/capture/child-backfiller.ts:32-149`
- Child event stream: `src/features/session-tracker/streaming/child-event-stream.ts:71-220`
- Child recorder: `src/features/session-tracker/child-recorder.ts:56-145`
- Tool delegation: `src/features/session-tracker/tool-delegation.ts:103-583`
- Tool delegation utils: `src/features/session-tracker/tool-delegation-utils.ts:1-148`
- Bootstrap: `src/features/session-tracker/bootstrap.ts:23-167`
- Initialization: `src/features/session-tracker/initialization.ts:96-280`
- Orphan cleanup: `src/features/session-tracker/orphan-cleanup.ts:35-378`
- Project continuity checker: `src/features/session-tracker/project-continuity.ts:42-129`
- Session recovery: `src/features/session-tracker/recovery/session-recovery.ts:67-415`
- Agent transform: `src/features/session-tracker/transform/agent-transform.ts:1-119`
- Hook consumer: `src/hooks/observers/session-tracker-consumer.ts:1-41`
- Coordination (manager): `src/coordination/delegation/manager.ts:15` (imports `ToolDelegation`)
- Coordination (coordinator): `src/coordination/delegation/coordinator.ts:10` (imports `childEventStream`)
- Delegation persistence: `src/task-management/continuity/delegation-persistence.ts:1-227`
- Continuity reader: `src/task-management/continuity/continuity-reader.ts:1-150`
- Tools (read): `src/tools/delegation/delegation-status.ts:1-891`, `src/tools/session/session-tracker.ts:1-423`, `src/tools/session/session-hierarchy.ts:1-283`, `src/tools/session/session-delegation-query.ts:1-284`, `src/tools/session/session-context.ts:1-301`, `src/tools/session/session-resolver.ts:1-116`, `src/tools/hivemind/hivemind-session-view.ts:1-155`
- Tool readers: `src/tools/delegation/readers/session-tracker-reader.ts:15-88`, `src/tools/delegation/readers/types.ts:25-188`
- TMUX tool: `src/tools/tmux-copilot.ts:42, 400-432`
- Sample on-disk evidence: `.hivemind/session-tracker/{ses_16a7b4487ffeBZ12xqaWkx7d1k, ses_16d6c2575ffeZH4qZetUqOoZkB, ses_17c1b5b41ffe3D6kdDn8fcc4Mk}/` (4 files, 17 files, 87 files respectively)
- Stale tmp files: `.hivemind/session-tracker/ses_17c1b5b41ffe3D6kdDn8fcc4Mk/ses_17c1b5b41ffe3D6kdDn8fcc4Mk.md.tmp.{4 files}`

---

*Cluster map analysis: 2026-06-05 | L5 evidence (read-only) | ready for TODO-2 (`delegationType` discriminator design) and TODO-3 (filter plumbing)*
