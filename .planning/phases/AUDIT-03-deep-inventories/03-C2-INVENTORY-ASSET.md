# C2 Cluster Deep Inventory: Session & Task Management Runtime

**Type:** Internal Programmatic Modules (C2)
**Analysis Date:** 2026-06-06
**Inventory Base:** Source files in `src/task-management/`, `src/features/session-tracker/`, `src/features/agent-work-contracts/`, `src/features/sdk-supervisor/`, `src/tools/session/`, and `tests/features/` + `tests/task-management/`

---

## 1. C2 Overview

### Scope Summary

| Sub-cluster | Directory | Source Files | Test Files | Total |
|------------|-----------|-------------|------------|-------|
| Continuity | `src/task-management/continuity/` | 4 | 1 | 5 |
| Journal | `src/task-management/journal/` | 4 | 0 | 4 |
| Lifecycle | `src/task-management/lifecycle/` | 1 | 0 | 1 |
| Trajectory | `src/task-management/trajectory/` | 4 | 4 | 8 |
| Session Tracker | `src/features/session-tracker/` | 36 | 48 | 84 |
| Agent Work Contracts | `src/features/agent-work-contracts/` | 6 | 2 | 8 |
| SDK Supervisor | `src/features/sdk-supervisor/` | 2 | 0 | 2 |
| C2 Tools | `src/tools/session/` | 8 | 0 | 8 |
| C2 Task Mgmt Tests | `tests/task-management/` | — | 5 | 5 |
| C2 Feature Tests (filtered) | `tests/features/` | — | 54 | 54 |
| **Total** | | **65** | **114** | **179** |

### Sub-groupings

C2 divides into 8 natural sub-groupings:

1. **Continuity Store** — In-memory + JSON persistence for session continuity records. Dual-writes to session-tracker.
2. **Session Journal** — Append-only JSONL event log with time-machine replay and query filters.
3. **Session Lifecycle** — State machine (`created→queued→dispatching→running→completed/failed`) with `HarnessLifecycleManager`.
4. **Trajectory Ledger** — Per-phase resumability ledger with 5-state lifecycle (`planning→executing→verifying→completed→closed`).
5. **Session Tracker** — Knowledge capture engine (36 files) with hook observers, persistence layer, classification, recovery, and streaming. The largest C2 module.
6. **Agent Work Contracts** — Durable contract store with lifecycle transitions, evidence gating, and compaction.
7. **SDK Supervisor** — Readiness/heartbeat/health/diagnostics for the OpenCode SDK wrapper layer.
8. **C2 Tools** — 8 tool entrypoints exposing session-tracker, session-hierarchy, session-context, session-delegation-query, session-journal-export, session-patch, and session-resolver to agents.

### Design Patterns Used

- **CQRS** — Tools are read-only (CQRS read-side). Hooks + lifecycle are write-side. Violations noted below.
- **Dual-Write** — Continuity store dual-writes to session-tracker (REQ-P41B). Non-atomic (CONCERNS.md).
- **State Machine** — Both lifecycle (`VALID_LIFECYCLE_TRANSITIONS`) and trajectory (`TRAJECTORY_TRANSITIONS`) use explicit transition tables.
- **Observer Pattern** — SessionTracker class receives hook callbacks from plugin.ts (`handleSessionEvent`, `handleChatMessage`, `handleToolExecuteAfter`, `handleToolExecuteBefore`).
- **Three-Gate Classification** — `SessionClassifier` uses SDK parentID → hierarchy index → pending dispatch registry (3-gate fallback).
- **Progressive Disclosure** — Trajectory traversal supports `summary`, `detailed`, `full` depth levels.
- **Quarantine Protocol** — Corrupt files are renamed to `.corrupt-{timestamp}-{pid}-{uuid}` rather than deleted.
- **Fire-and-Forget** — Multiple dual-write paths use `.catch()` without awaiting, making them best-effort.

---

## 2. Per-Module Inventory

### 2.1 Continuity Store (`src/task-management/continuity/`)

| File | Purpose | Sub-grouping | Cross-cutting (from imports) | Flaws/Notes |
|------|---------|-------------|------------------------------|-------------|
| `index.ts` | SessionContinuity CRUD: read/write/patch/delete JSON store with inline deep-clone. Dual-writes to session-tracker. | Continuity Storage | C1 (`shared/types.ts`, `shared/security/path-scope`), C2 session-tracker (`ChildWriter`) | 468 LOC. 4 `console.error` calls. Non-atomic dual-write (REQ-P41D-01/02). REQ-P41D-01 disabled file I/O entirely. |
| `delegation-persistence.ts` | Delegations I/O via session-tracker hierarchy manifest instead of delegations.json. Reads child .json files and manifests. | Delegation Persistence | C1 (`shared/types.ts`), C2 session-tracker (`ChildWriter`, `HierarchyManifestWriter`, types) | 236 LOC. 4 `console.error` calls. Fire-and-forget dual-write. `TODO-2` markers at L53, L98. |
| `store-cache.ts` | Module-level Map cache for continuity store. Export/reset helpers for test isolation. | Continuity Caching | C1 (`shared/types.ts`) | 48 LOC. Simple leaf utility. |
| `continuity-reader.ts` | Enriches continuity records with session-tracker gap fields (lifecycle, pendingNotifications, compactionCheckpoint). Never throws. | Continuity Enrichment | C1 (`shared/types.ts`), C2 tools (`session-resolver.ts`) | 110 LOC. Clean design — imports resolver, not continuity/index (avoids circular dep). |

### 2.2 Session Journal (`src/task-management/journal/`)

| File | Purpose | Sub-grouping | Cross-cutting (from imports) | Flaws/Notes |
|------|---------|-------------|------------------------------|-------------|
| `index.ts` | Append-only JSONL journal. Idempotency-keyed writes. Redaction of summary fields. | Journal Writer | C1 (`shared/security/redaction.ts`) | 119 LOC. Clean single-writer design. |
| `execution-lineage.ts` | Derived projection combining continuity + delegation + journal records into lineage table. | Journal Lineage | C1 (`shared/types.ts`), C2 journal (`index.ts`) | 122 LOC. Pure projection, no I/O. |
| `query.ts` | Read-side: `readJournalEntries`, `queryBySession`, `queryByEventType`, `queryByTimeRange`, `queryJournal`. | Journal Query | C2 journal (`index.ts`) | 168 LOC. Self-contained — no continuity imports. |
| `replay.ts` | Time-machine replay: `replayChronological`, `reconstructStateAt`, `reduceJournalEntries`. Fold-based, schema-agnostic. | Journal Replay | C2 journal (`index.ts`) | 131 LOC. Clean fold-based design. |

### 2.3 Session Lifecycle (`src/task-management/lifecycle/`)

| File | Purpose | Sub-grouping | Cross-cutting (from imports) | Flaws/Notes |
|------|---------|-------------|------------------------------|-------------|
| `index.ts` | `HarnessLifecycleManager` class: lifecycle state machine, completion detector wiring, delegation launch, notification replay, compaction checkpoint. | Lifecycle Manager | C1 (`shared/session-api.ts`, `shared/state.ts`, `shared/types.ts`), C2 continuity (`index.ts`), C3 coordination (`completion/detector.ts`, `completion/notification-handler.ts`, `delegation/manager.ts`) | 242 LOC. References C3 completion + delegation. Most cross-cutting of all C2 modules. |

### 2.4 Trajectory Ledger (`src/task-management/trajectory/`)

| File | Purpose | Sub-grouping | Cross-cutting (from imports) | Flaws/Notes |
|------|---------|-------------|------------------------------|-------------|
| `types.ts` | Trajectory types: `TrajectoryRecord`, `PhaseTrajectoryRecord`, `TrajectoryLedger`, `TrajectoryStatus`, auto-transition table, depth levels. | Trajectory Types | None (standalone) | 226 LOC. Well-typed with progressive disclosure types. |
| `ledger.ts` | File I/O: read/write/quarantine the trajectory ledger JSON. Path construction via `assertPathWithinRoot`. | Trajectory Storage | C1 (`shared/security/path-scope`) | 93 LOC. Compact I/O layer. |
| `store-operations.ts` | CRUD + transitions: `createPhaseTrajectory`, `transitionTrajectory`, `addTrajectoryEvent`, `attachTrajectoryEvidence`, `checkpointTrajectory`, `eventTrajectory`, `closeTrajectory`, `traverseTrajectory`. | Trajectory Operations | C2 trajectory (`ledger.ts`, `types.ts`) | 416 LOC. Largest trajectory file. 3 status values in error messages without `[Harness]` prefix (L85, L95, L260). |
| `index.ts` | Barrel re-export. | Trajectory Barrel | C2 trajectory types + ledger + operations | 3 LOC. |

### 2.5 Session Tracker (`src/features/session-tracker/` — 36 files)

#### 2.5.1 Core / Entry Points

| File | Purpose | Sub-grouping | Cross-cutting (from imports) | Flaws/Notes |
|------|---------|-------------|------------------------------|-------------|
| `index.ts` | `SessionTracker` class: central orchestrator. Handles hook callbacks, constructs deps, manages retry flush loop, orphan cleanup, turn counter seeding. | Core Orchestrator | C1 (`shared/session-api.ts`), C2 session-tracker sub-modules | 671 LOC. Near the 500 LOC cap. Dual-write race. |
| `types.ts` | All session-tracker type definitions: `SessionRecord`, `ChildSessionRecord`, `SessionContinuityIndex`, `ProjectContinuityIndex`, `HierarchyManifest`, `DelegationType`, type guards. | Core Types | C1 (`shared/types.ts`), C2 coordination (`coordination/delegation/types.ts`) | 517 LOC. 4 `TODO-2` markers (L61, L225, L351, L394). `DelegationType` is optional everywhere (R1 backward compat). |
| `bootstrap.ts` | Lazy session initialization, SDK session lookup, forked child copying. | Core Bootstrap | C1 (`shared/session-api.ts`), C2 persistence writers + types | 167 LOC. Clean extraction from index.ts. |

#### 2.5.2 Classification & Routing

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `classification.ts` | 3-gate session classifier (SDK parentID → hierarchy index → pending dispatch registry). Discriminated `ClassificationResult`. | Session Classification | C2 persistence (`hierarchy-index.ts`, `pending-dispatch-registry.ts`) | 162 LOC. Circular deprecation comment at L33: "Use `kind` discriminator instead" describes the field `kind` which it IS. |
| `session-router.ts` | `SessionRouter` — classify-before-I/O routing. Returns `RoutingDecision` (child/main/unknownSub). | Session Routing | C2 classification | 103 LOC. Small, focused. |

#### 2.5.3 Capture Module

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `capture/event-capture.ts` | Handles session lifecycle events: created, idle, error, deleted, compacted. Routes to writers. | Session Capture | C2 persistence writers + classification | Core capture handler. |
| `capture/message-capture.ts` | Captures chat messages, backfills user turns from SDK, seeds turn counters. | Session Capture | C1 (`shared/session-api.ts`), C2 writers + transform | Core capture handler. |
| `capture/last-message-capture.ts` | Tracks last message text per session for frontmatter streaming update. | Session Capture | C2 writers | Used by `initialization.ts` for streaming assistant text. |
| `capture/tool-capture.ts` | Captures tool executions (tool.execute.after hook). Records tool metadata in sessions. | Session Capture | C2 writers + classification | `TODO-2` marker at L298. |
| `capture/child-backfiller.ts` | Backfills child session data from SDK. | Session Capture | C1 (`shared/session-api.ts`) | Small utility. |
| `capture/handlers/types.ts` | Handler type definitions for event capture. | Session Capture | — | 4 `TODO-2` markers (L112, L129, L168, L205). |
| `capture/handlers/session-created-handler.ts` | Event handler for `session.created`. | Session Capture | C2 writers + indices | — |
| `capture/handlers/session-idle-handler.ts` | Event handler for `session.idle`. | Session Capture | C2 writers | — |
| `capture/handlers/session-error-handler.ts` | Event handler for `session.error`. | Session Capture | C2 writers | — |
| `capture/handlers/session-deleted-handler.ts` | Event handler for `session.deleted`. | Session Capture | C2 writers | — |
| `capture/handlers/session-compacted-handler.ts` | Event handler for `session.compacted`. | Session Capture | C2 writers | — |
| `capture/handlers/session-next-text-ended-handler.ts` | Event handler for `session.next.text.ended`. | Session Capture | C2 writers | — |

#### 2.5.4 Persistence Sub-Module

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `persistence/child-writer.ts` | Writes child session `.json` files. Records delegation journeys, updates manifest. | Session Persistence | C2 hierarchy index, retry queue | 685 LOC — LARGEST file in C2. 1 `TODO-2` marker (L331). Dual-write race risk. |
| `persistence/session-writer.ts` | Writes main session `.md` files (frontmatter + turns). | Session Persistence | C1 (session-naming) | Core main session writer. |
| `persistence/session-index-writer.ts` | Writes session-level continuity index. | Session Persistence | — | — |
| `persistence/project-index-writer.ts` | Writes project-level continuity index. | Session Persistence | C1 (`shared/session-api.ts`) | — |
| `persistence/hierarchy-index.ts` | In-memory parent-child hierarchy index. | Session Persistence | — | — |
| `persistence/hierarchy-manifest.ts` | D-07 manifest writer — flattened delegation tree for quick lookup. | Session Persistence | — | 1 `TODO-2` marker (L72). |
| `persistence/pending-dispatch-registry.ts` | Race condition guard: tracks pending tool dispatch before child session creation. | Session Persistence | — | — |
| `persistence/retry-queue.ts` | Retry queue for failed child writes. Periodic flush loop. | Session Persistence | — | `console` call in hot path (CONCERNS.md L177). |
| `persistence/orphan-quarantine.ts` | Quarantine protocol for orphan directories (move, don't delete). | Session Persistence | — | — |
| `persistence/atomic-write.ts` | Atomic temp-file-rename write. `safeSessionPath` function. | Session Persistence | — | Path safety enforcement. |

#### 2.5.5 Other Session Tracker Modules

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `initialization.ts` | `constructDependencies()` — creates all SessionTracker sub-dependencies in order. | Session Init | C1 (`shared/session-api.ts`), all C2 session-tracker sub-modules | 280 LOC. Clean DI assembly. |
| `tool-delegation.ts` | Child-session task delegation, polling, tool journey recording. P58 G6 event log. | Session Delegation | C1 (`shared/session-api.ts`, `shared/session-naming.ts`), C2 types | 597 LOC. 3 `TODO-2` markers. Near 500 LOC cap. |
| `tool-delegation-utils.ts` | Pure utility functions for tool delegation: pruning inputs/outputs, extracting task IDs. | Session Delegation | C1 (`shared/session-naming.ts`) | 148 LOC. Stateless. |
| `child-recorder.ts` | Records child session turns + journey entries without creating directories. | Session Children | C1 (`shared/session-naming.ts`), C2 child-writer | 145 LOC. |
| `session-router.ts` | See 2.5.2 — classify-before-I/O. | Session Routing | — | 103 LOC. |
| `classification.ts` | See 2.5.2 — 3-gate classifier. | Session Classification | — | 162 LOC. |
| `orphan-cleanup.ts` | Scans + quarantines orphan child session directories. | Session Maintenance | C1 (`shared/session-api.ts`), C2 persistence | 378 LOC. |
| `project-continuity.ts` | Ensures `project-continuity.json` contains ALL sessions. | Session Indexing | C2 persistence + index | 129 LOC. |
| `streaming/child-event-stream.ts` | Streaming event updates for child sessions. | Session Streaming | — | Stream wiring. |
| `recovery/session-recovery.ts` | Session recovery from disk on restart. Reads + hydrates persisted state. | Session Recovery | C1 (`shared/session-api.ts`) | Recovery module. |
| `transform/agent-transform.ts` | Agent name transformation for session records. | Session Transform | — | Pure transform. |

### 2.6 Agent Work Contracts (`src/features/agent-work-contracts/`)

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `index.ts` | Barrel re-export. | Contracts Barrel | C2 contracts sub-modules | 4 LOC. |
| `types.ts` | Input/output types for contract CRUD. Re-exports from schema-kernel. | Contract Types | C1 (`schema-kernel/agent-work-contract.schema.ts`) | 71 LOC. |
| `store.ts` | File I/O for contracts: read/write/upsert/get. Zod-validated. Corrupt quarantine. | Contract Store | C1 (`schema-kernel/agent-work-contract.schema.ts`, `shared/security/path-scope.ts`) | 164 LOC. |
| `operations.ts` | `createAgentWorkContract`, `exportAgentWorkContract` (JSON/Markdown). Links to trajectory. | Contract Operations | C2 trajectory (`store-operations.ts`), C2 contract store | 159 LOC. |
| `lifecycle.ts` | Status transition state machine (`created→running→blocked→completed/cancelled`). Evidence gating on complete. | Contract Lifecycle | C1 (`schema-kernel/agent-work-contract.schema.ts`), C2 contract store | 134 LOC. Clean transition table. |
| `bounds.ts` | Compaction field size limits (BRIEFING_LIMIT, SUMMARY_LIMIT, etc.) | Contract Bounds | — (constants only) | 21 LOC. |

### 2.7 SDK Supervisor (`src/features/sdk-supervisor/`)

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `index.ts` | `SdkSupervisor` class: health/heartbeat/diagnostics/readiness. `inspectSdkWrappers`. | SDK Supervision | C3 (`runtime-pressure/index.ts`), C2 sdk-supervisor types | 202 LOC. Small but imports C3 pressure. |
| `types.ts` | All supervisor types: health, heartbeat, diagnostics, readiness, client shape. | SDK Supervision Types | C3 (`runtime-pressure/types.ts`) | 110 LOC. |

### 2.8 C2 Tools (`src/tools/session/`)

| File | Purpose | Sub-grouping | Cross-cutting | Flaws/Notes |
|------|---------|-------------|---------------|-------------|
| `session-tracker.ts` | Read-only: export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions. | Tool: Session Query | C2 session-tracker persistence + resolver, C1 (schema, tool-response) | 423 LOC. Gray-matter dependency. |
| `session-hierarchy.ts` | Read-only: get-children, get-parent-chain, get-delegation-depth, get-manifest. | Tool: Hierarchy | C2 session-tracker types + resolver | 283 LOC. |
| `session-context.ts` | Read-only: find-related, cross-reference, synthesize-context, aggregate. | Tool: Context | C2 session-tracker persistence + resolver | 301 LOC. Gray-matter dependency. |
| `session-delegation-query.ts` | Read-only: list (paginated), get (drill-down). Progressive disclosure. | Tool: Delegation Query | C2 session-tracker types + resolver | 284 LOC. |
| `session-journal-export.ts` | Read-only: export journal + lineage as JSON/Markdown. | Tool: Journal Export | C2 continuity + delegation-persistence + execution-lineage | 117 LOC. |
| `session-patch/index.ts` | Barrel export for session-patch. | Tool: Patch | — | 6 LOC. |
| `session-patch/types.ts` | Type re-exports for patch tool. | Tool: Patch Types | C1 (`schema-kernel/prompt-enhance.schema.ts`) | 19 LOC. |
| `session-patch/tools.ts` | Section patching in session files with backup + validation. | Tool: Patch Execute | C1 (`shared/security/path-scope.ts`, `shared/tool-helpers.ts`, `schema-kernel/prompt-enhance.schema.ts`) | 136 LOC. |
| `session-resolver.ts` | Shared resolver: resolves any session ID (main or child) to filesystem paths. | Tool: Resolver | C2 session-tracker persistence + types | 116 LOC. Used by most other C2 tools. |

### 2.9 C2 Test Files

#### Tests: `tests/task-management/` (5 files)

| File | Purpose | Tests What |
|------|---------|-----------|
| `trajectory/types.test.ts` | Trajectory type validation | Trajectory types |
| `trajectory/store-operations.test.ts` | Store operations CRUD | Trajectory ops |
| `trajectory/ledger.test.ts` | Ledger I/O | Trajectory ledger |
| `trajectory/index.test.ts` | Index barrel | Trajectory barrel |
| `continuity/store-cache.test.ts` | Cache reset + isolation | Store cache |

#### Tests: `tests/features/session-tracker/` (48 files)

Covers: types, transform, tools/tool-safety, tool-delegation, tool-delegation-integration, tool-capture, session-tracker, runtime-preservation-regressions, recovery, persistence (8 sub-files), orphan-cleanup, orphan-cleanup-preserve, nyquist-gaps, journey-recording-routing, journey-recording-child, integration (12 files), index, ensure-session-ready-classification, capture (7 files).

#### Other Feature Tests (6 files relevant to C2)

`tests/features/agent-work-contracts/lifecycle.test.ts`, `tests/features/agent-work-contracts/cross-linking.test.ts`

---

## 3. Cross-Cutting Dependencies

### C2 → C1 (Shared Infrastructure)

| C2 Module | C1 Targets |
|-----------|-----------|
| `continuity/index.ts` | `shared/types.ts`, `shared/security/path-scope.ts` |
| `continuity/delegation-persistence.ts` | `shared/types.ts` |
| `continuity/store-cache.ts` | `shared/types.ts` |
| `continuity/continuity-reader.ts` | `shared/types.ts` |
| `journal/index.ts` | `shared/security/redaction.ts` |
| `journal/execution-lineage.ts` | `shared/types.ts` |
| `lifecycle/index.ts` | `shared/session-api.ts`, `shared/state.ts`, `shared/types.ts` |
| `trajectory/ledger.ts` | `shared/security/path-scope.ts` |
| `session-tracker/index.ts` | `shared/session-api.ts` |
| `session-tracker/types.ts` | `shared/types.ts` |
| `session-tracker/bootstrap.ts` | `shared/session-api.ts` |
| `session-tracker/capture/child-backfiller.ts` | `shared/session-api.ts` |
| `agent-work-contracts/types.ts` | `schema-kernel/agent-work-contract.schema.ts` |
| `agent-work-contracts/store.ts` | `schema-kernel/agent-work-contract.schema.ts`, `shared/security/path-scope.ts` |
| `agent-work-contracts/lifecycle.ts` | `schema-kernel/agent-work-contract.schema.ts` |
| `session-patch/tools.ts` | `shared/security/path-scope.ts`, `shared/tool-helpers.ts`, `schema-kernel/prompt-enhance.schema.ts` |
| All C2 tools | `shared/tool-helpers.ts`, `shared/tool-response.ts` |

### C2 → C3 (Coordination)

| C2 Module | C3 Targets |
|-----------|-----------|
| `lifecycle/index.ts` | `coordination/completion/detector.ts`, `coordination/completion/notification-handler.ts`, `coordination/delegation/manager.ts` |
| `sdk-supervisor/index.ts` | `runtime-pressure/index.ts` |
| `sdk-supervisor/types.ts` | `runtime-pressure/types.ts` |
| `session-tracker/types.ts` | `coordination/delegation/types.ts` |

### C2 Internal Dependencies (between C2 sub-modules)

| Source | Target |
|--------|--------|
| `continuity/index.ts` | `features/session-tracker/persistence/child-writer.ts` |
| `continuity/delegation-persistence.ts` | `features/session-tracker/persistence/child-writer.ts`, `features/session-tracker/persistence/hierarchy-manifest.ts`, `features/session-tracker/types.ts` |
| `continuity/continuity-reader.ts` | `tools/session/session-resolver.ts` |
| `lifecycle/index.ts` | `task-management/continuity/index.ts` |
| `lifecycle/index.ts` | `coordination/completion/detector.ts`, `coordination/delegation/manager.ts`, `coordination/completion/notification-handler.ts` |
| `operations.ts` (contracts) | `task-management/trajectory/store-operations.ts` |
| `session-journal-export.ts` | `task-management/continuity/index.ts`, `task-management/continuity/delegation-persistence.ts`, `task-management/journal/execution-lineage.ts` |
| All C2 tools | `tools/session/session-resolver.ts` |

---

## 4. Conflicts, Gaps, Misconducts, Overlapping, Flaws

### 4.1 Dual-Write Non-Atomicity (CONCERNS.md Ref: C2 Dual-Write)

**Files:** `continuity/delegation-persistence.ts:79-108`, `continuity/index.ts:363-445`, `session-tracker/persistence/child-writer.ts`

**Issue:** Child file + manifest are written as two sequential `await` calls with no temp-file-rename, no WAL, no idempotency key. If the second write fails, the first write stands — state is half-applied.

**Mitigation:** Retry queue only retries child-writer, not the manifest.

**Impact:** Medium — under normal load, failures are rare. But race conditions during concurrent dispatches could leave orphaned manifest entries.

### 4.2 TODO-2 Markers (19 unresolved)

**Files:** 
- `continuity/delegation-persistence.ts:53, 98` — discriminator not set at write time
- `session-tracker/types.ts:61, 225, 351, 394` — 4 markers
- `session-tracker/tool-delegation.ts:309, 358, 413` — 3 markers
- `session-tracker/capture/tool-capture.ts:298` — handler reach restricted
- `session-tracker/capture/handlers/types.ts:112, 129, 168, 205` — 4 markers
- `session-tracker/persistence/hierarchy-manifest.ts:72` — manifest discriminator
- `session-tracker/persistence/child-writer.ts:331` — preserve across merges

**Issue:** These mark pending R7/R9 mitigations for the Minimum Viable Discriminator (MVD) feature. `DelegationType` is optional everywhere for backward compatibility but the "set at write time" requirement is not fully implemented.

**Tracking:** Not in ROADMAP or STATE.md.

### 4.3 Circular Deprecation Comment

**File:** `session-tracker/classification.ts:33`

**Issue:** The `@deprecated` JSDoc says "Use `kind` discriminator instead" on the field named `kind`. This is self-referential — the deprecation target IS the `kind` code path it's describing.

### 4.4 Unprefixed Error Messages

**Files:** 
- `continuity/index.ts:302` — missing `[Harness]` prefix
- `journal/query.ts:125` — missing `[Harness]` prefix
- `trajectory/store-operations.ts:95` — missing `[Harness]` prefix
- `trajectory/ledger.ts:50` — missing `[Harness]` prefix

### 4.5 Large Files Near/Exceeding 500 LOC Cap

**File:** `session-tracker/persistence/child-writer.ts` — 685 LOC (37% over)
**File:** `session-tracker/index.ts` — 671 LOC (34% over)
**File:** `session-tracker/tool-delegation.ts` — 597 LOC (19% over)
**File:** `continuity/index.ts` — 468 LOC (within cap, but close at 94%)

### 4.6 `console.*` in Production Paths (CONCERNS.md §2.2)

**Files:** 
- `continuity/index.ts` — 4 `console.error`/`console.warn` calls (L363, L366, L442, L445)
- `continuity/delegation-persistence.ts` — 4 `console.error`/`console.warn` calls (L79, L86, L103, L108)
- `session-tracker/persistence/retry-queue.ts` — `console.warn` in hot retry path

**Issue:** `console.*` calls bypass structured logging and don't go through `client.app.log()`. Under load, these can spam terminal output.

### 4.7 Overlapping Continuity State Sources

**Files:** `continuity/index.ts` (in-memory JSON) vs `session-tracker/persistence/child-writer.ts` (session-tracker files)

**Issue:** P41-B/C introduced dual-write as a migration path. `continuity/index.ts` no longer does file I/O (REQ-P41D-01). But `readPersistedDelegations()` (L112-236) reads from session-tracker files directly, creating two parallel data sources. The "canonical" source is ambiguous.

### 4.8 Session-tracker Classification / Router Duplication

**Files:** `session-tracker/classification.ts` (classifier) + `session-tracker/session-router.ts` (router) + inline routing in `session-tracker/index.ts`

**Issue:** Classification is implemented in the classifier, wrapped by the router, then re-invoked in index.ts handlers. The abstraction boundary between classifier, router, and index.ts is blurry — all three contain routing logic that references the classification decision.

### 4.9 Missing Tests Coverage (CONCERNS.md §6.3)

**Issues:**
- No dedicated tests for `session-tracker/persistence/hierarchy-manifest.ts`
- No E2E test covering the full LLM provider → session-tracker → completion → status polling cycle
- Session-patch tool has no tests
- SDK supervisor has no tests
- Agent-work-contracts store operations are covered only by 2 cross-linking tests
- `continuity-reader.ts` has no direct tests

### 4.10 `as any` Casts in Sidecar Routes (CONCERNS.md §3)

**Files:** `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:37`, `hivemind-trajectory.ts:48`, `routes/state.ts:37`, `routes/sessions.ts:29`

**Issue:** 5+ occurrences of `(registry as any).sessionTracker` / `(registry as any).trajectory` in sidecar code. These bypass the CQRS boundary and access C2 state directly from UI routes. Not a C2 source issue but C2 is the leaking surface.

### 4.11 `session-patch` Tool Scope

**File:** `session-patch/tools.ts`

**Issue:** The tool patches session files directly (not through any CQRS boundary). While it has path validation (`assertPathWithinRoot`), it bypasses all session-tracker hooks and writes can break frontmatter consistency.

---

## 5. Phase References

| Phase | Scope | C2 Files Touched |
|-------|-------|-----------------|
| **Phase 21** | Session-tracker design fix | `features/session-tracker/*` (entire module created/refactored) |
| **Phase 36.1** | Completion detector wiring | `lifecycle/index.ts` (L93, L142 — completion detector feed) |
| **Phase 41** | Session Journal (JOURNAL-01/02/03) + P41-B/C gap fields | `journal/` (all 4 files), `continuity/continuity-reader.ts`, `continuity/index.ts` (dual-write), `continuity/delegation-persistence.ts` (P41B-04), `session-tracker/types.ts` (gap fields) |
| **Phase 58** | Tmux orchestration (G5/G6) | `session-tracker/index.ts` (manualOverride map), `session-tracker/types.ts` (SessionTrackerEvent, DelegationLifecycleStatus, DelegationType), `session-tracker/tool-delegation.ts` (event log, P58 G6) |
| **Phase 58.9** | Sticky bug busting | `session-tracker/types.ts` (MVD discriminators), `session-tracker/tool-delegation.ts`, `continuity/delegation-persistence.ts` |
| **Phase 59** | Session backchannel + tmux-copilot rework | `session-tracker/index.ts` (manualOverride state), `session-patch/*` |
| **D-01 to D-44** | Trajectory + Contract design decisions | `trajectory/`, `agent-work-contracts/` |

---

## 6. Sub-grouping Summary

```
C2: Session & Task Management Runtime
│
├── 2.1 Continuity Store (4 files)
│   ├── index.ts                — CRUD + deep-clone + dual-write
│   ├── delegation-persistence.ts — Delegation I/O via session-tracker
│   ├── store-cache.ts          — Module-level in-memory cache
│   └── continuity-reader.ts    — Tracker enrichment (no circular dep)
│
├── 2.2 Session Journal (4 files)
│   ├── index.ts                — Append-only JSONL + idempotency
│   ├── execution-lineage.ts    — Derived projection
│   ├── query.ts                — Read-side query filters
│   └── replay.ts               — Time-machine + fold-based replay
│
├── 2.3 Session Lifecycle (1 file)
│   └── index.ts                — HarnessLifecycleManager + state machine
│
├── 2.4 Trajectory Ledger (4 files)
│   ├── types.ts                — Types + transition tables
│   ├── ledger.ts               — File I/O + quarantine
│   ├── store-operations.ts     — CRUD + transitions + traversal
│   └── index.ts                — Barrel
│
├── 2.5 Session Tracker (36 files)
│   ├── Core (3):               index.ts, types.ts, bootstrap.ts
│   ├── Classification (2):     classification.ts, session-router.ts
│   ├── Capture (11):           event-capture, message-capture, last-message-capture,
│   │                           tool-capture, child-backfiller, 6 handlers
│   ├── Persistence (10):       child-writer, session-writer, session-index-writer,
│   │                           project-index-writer, hierarchy-index, hierarchy-manifest,
│   │                           pending-dispatch-registry, retry-queue, orphan-quarantine,
│   │                           atomic-write
│   ├── Other (6):              initialization.ts, tool-delegation.ts, tool-delegation-utils.ts,
│   │                           child-recorder.ts, orphan-cleanup.ts, project-continuity.ts
│   ├── Streaming (1):          child-event-stream.ts
│   ├── Recovery (1):           session-recovery.ts
│   └── Transform (1):          agent-transform.ts
│
├── 2.6 Agent Work Contracts (6 files)
│   ├── index.ts, types.ts, store.ts, operations.ts, lifecycle.ts, bounds.ts
│
├── 2.7 SDK Supervisor (2 files)
│   ├── index.ts, types.ts
│
└── 2.8 C2 Tools (8 files)
    ├── session-tracker.ts       — Query/export tool
    ├── session-hierarchy.ts     — Hierarchy navigation
    ├── session-context.ts       — Cross-session synthesis
    ├── session-delegation-query.ts — Progressive delegation query
    ├── session-journal-export.ts — Journal + lineage export
    ├── session-patch/{index,types,tools}.ts — Section patching
    └── session-resolver.ts      — Shared path resolver
```

---

*C2 Inventory: 2026-06-06 — 179 files total (65 source, 114 test)*
