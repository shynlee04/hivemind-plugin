# Phase P41-A: Investigate Field Mapping for Merging delegations.json + session-continuity.json into Session-Tracker

**Researched:** 2026-05-31
**Domain:** State cluster consolidation — merging two standalone state files into session-tracker per-session file schema
**Confidence:** HIGH (all source code + on-disk data verified)
**Mode:** Read-only investigation — no files modified

---

## Summary

**What this research answers:** What are the exact field-level schemas of `delegations.json` and `session-continuity.json` under `.hivemind/state/`, which fields have equivalents in session-tracker's per-session schema, which fields are unique gaps, and what breaks if both files are deleted after migration.

**Key finding:** Both files contain **zero production data** — 35 delegation records and 18 continuity records, all with test session IDs (`child-*`, `parent-*`, `ses-parent-*`) that do not match any of the **123 live session-tracker sessions** (`ses_*` format). Every reader handles missing files gracefully (returns `[]`, empty store, or `undefined`). No BLOCKING breakage exists.

**Primary recommendation:** Migrate delegation data to session-tracker's existing `ChildSessionRecord` + `HierarchyManifestChild` schemas (~60% field coverage), add 6 MEDIUM-risk gap fields to session-tracker types, and redirect writer code paths from old files to session-tracker persistence.

---

## User Constraints (from CONTEXT.md)

> **Note:** No CONTEXT.md exists yet for this sub-phase. The SPEC.md decisions apply directly.

### Locked Decisions (from SPEC.md Key Decision Log)

| Decision | Status |
|----------|--------|
| MERGE `delegations.json` data into session-tracker | LOCKED |
| MERGE `state/session-continuity.json` data into session-tracker | LOCKED |
| DELETE both files after merge | LOCKED |
| This phase is INVESTIGATION only — no file modifications | LOCKED |
| Prior P41.01 research "KEEP all three" conclusion is overruled | SUPERSEDED |

### Agent's Discretion

- **Governance state destination:** Whether `governance.rules` and `governance.violations` merge into session-tracker or stay as a separate `.hivemind/state/governance.json` file. SPEC Open Question #2 flags this as a design decision.
- **Schema extension design:** The gap report proposes field name + type + target interface for each gap field, but final schema design is decided during P41-B.
- **Test artifact disposal plan:** Whether to silently drop the 35 test delegation records on merge or run a cleanup script.

### Deferred Ideas (OUT OF SCOPE)

- `.hivemind/state/agent-work-contracts.json` — not part of merge decision
- `.hivemind/state/config-workflows.json` — not part of merge decision
- `.hivemind/state/trajectory-ledger.json` — not part of merge decision
- `.hivemind/state/version.json` — not part of merge decision
- `.opencode/state/` legacy paths — pre-Q6 migration concern only
- Third-party state stores (n8n, Datadog, etc.)
- Test file modifications

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-P41A-01 | Delegations.json field inventory — complete map of all `Delegation` interface fields to session-tracker equivalents | ✅ Complete table below — 32 fields mapped, 19 persisted, 13 ephemeral |
| REQ-P41A-02 | Session-continuity.json field inventory — complete map of `ContinuityStoreFile` / `SessionContinuityRecord` / `SessionContinuityMetadata` / `GovernancePersistenceState` fields | ✅ Complete table below — 22 fields mapped across 4 schemas |
| REQ-P41A-03 | Unique-field gap report — consolidated list of fields with NO session-tracker equivalent | ✅ Gap report with recommendations and risk ratings below |
| REQ-P41A-04 | Full actor/consumer map — every code location that reads or writes each file | ✅ Complete maps below with file:line references |
| REQ-P41A-05 | Breakage impact analysis — what breaks if we delete each file | ✅ Full analysis — no BLOCKING, ~6 DEGRADED, rest SILENT/TEST-ONLY |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Delegation persistence (write) | API/Backend (`src/coordination/delegation/state-machine.ts`) | Config/State (`src/task-management/continuity/delegation-persistence.ts`) | State machine owns delegation lifecycle; persistence module handles file I/O |
| Delegation persistence (read) | API/Backend (`src/tools/delegation/`) | Config/State (`delegation-persistence.ts`, `readers/`) | `delegation-status` tool is the primary consumer; readers are data-access layer |
| Session continuity (CRUD) | API/Backend (`src/task-management/continuity/index.ts`) | — | Full CRUD surface for session lifecycle, notifications, governance |
| Session-tracker delegation storage | Session Tracker (`src/features/session-tracker/`) | — | ChildWriter, SessionIndexWriter, ProjectIndexWriter, HierarchyManifestWriter |
| Notification delivery | Plugin (`src/plugin.ts`) | Continuity (`continuity/index.ts`) | Plugin replays notifications at startup; continuity stores pending queue |
| Governance state | Governance Engine (`src/features/governance-engine/`) | Continuity (`continuity/index.ts`) | Governance evaluator writes violations; continuity provides long-term storage |

---

## Standard Stack

No new libraries required. Migration uses existing infrastructure:

| Module | Purpose | Why Standard |
|--------|---------|--------------|
| `src/features/session-tracker/types.ts` | Schema authority for session-tracker files | Target schema for all merged data |
| `src/features/session-tracker/persistence/child-writer.ts` | Writes child `.json` files | Target destination for delegation data |
| `src/features/session-tracker/persistence/session-index-writer.ts` | Writes per-session `session-continuity.json` | Target destination for continuity data |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts` | Writes `hierarchy-manifest.json` | Source of truth for delegation tree |
| `src/features/session-tracker/persistence/project-index-writer.ts` | Writes `project-continuity.json` | Project-level session index |

**Version verification:** These are in-repo modules (no external packages). Verified by reading source files.

---

## Package Legitimacy Audit

> No external packages are installed by this phase. This is a data-migration and code-redirection phase using only existing in-repo modules.

---

## Complete Field Mapping Matrix

### 1A. Delegations.json Field Inventory (REQ-P41A-01)

Source interface: `Delegation` (`src/coordination/delegation/types.ts:26-73`)
Actual on-disk data: 35 records in `.hivemind/state/delegations.json` (23 KB) [VERIFIED: on-disk]

| # | Field | Type | Persisted? | Session-Tracker Equivalent | Risk if Removed |
|---|-------|------|-----------|----------------------------|-----------------|
| 1 | `id` | `string` | YES | `ChildSessionRecord.sessionID` / `HierarchyManifestChild.sessionID` | SILENT — all live delegations already have session-tracker entries |
| 2 | `parentSessionId` | `string` | YES | `ChildSessionRecord.parentSessionID` / `HierarchyManifestChild.parentSessionID` | SILENT |
| 3 | `childSessionId` | `string` | YES | Same as `id` — redundant in session-tracker since `sessionID` IS the child | SILENT |
| 4 | `agent` | `string` | YES | `ChildSessionRecord.mainAgent.name` / `HierarchyManifestChild.subagentType` | SILENT |
| 5 | `prompt` | `string?` | NO (redacted) | `delegatedBy.description` (partial — truncated by server) | SILENT — already redacted before persist |
| 6 | `status` | `DelegationStatus` | YES | `ChildSessionRecord.status` / `HierarchyManifestChild.status` but **TYPE MISMATCH** — delegation uses `dispatched\|running\|completed\|error\|timeout`, session-tracker uses `active\|idle\|completed\|error` | **DEGRADED** — status mapping at read boundary (`delegation-status.ts:218-219`) uses lossy cast |
| 7 | `result` | `string?` | NO (redacted) | `ChildSessionRecord.lastMessage` (for completed sessions) | SILENT — already redacted |
| 8 | `resultTruncated` | `boolean?` | NO (never persisted) | No equivalent | SILENT |
| 9 | `error` | `string?` | NO (redacted) | `ChildSessionRecord.lastMessage` (for error sessions) | SILENT — already redacted |
| 10 | `createdAt` | `number` | YES | `ChildSessionRecord.created` (ISO string) **FORMAT MISMATCH** — ms epoch vs ISO 8601 | **DEGRADED** — read-side normalization needed |
| 11 | `completedAt` | `number?` | YES (1 record) | `ChildSessionRecord.updated` (ISO string, set on status change) — no explicit `completedAt` | SILENT — derivable from `updated` on terminal status |
| 12 | `lastMessageCount` | `number` | YES (always 0) | Derivable from `turns.length` | SILENT |
| 13 | `stablePollCount` | `number` | YES (always 0) | No equivalent | SILENT — polling metadata, not useful after completion |
| 14 | `nestingDepth` | `number` | YES | `ChildSessionRecord.delegationDepth` / `HierarchyManifestChild.delegationDepth` | SILENT |
| 15 | `gracePeriodExpiresAt` | `number?` | YES (1 record) | No equivalent | SILENT — cleanup scheduling metadata |
| 16 | `lastMessageCountChangeAt` | `number?` | YES (all records) | No equivalent | SILENT — adaptive polling timestamp |
| 17 | `executionMode` | `"sdk" \| "pty" \| "headless"` | YES | `ChildSessionRecord.delegatedBy.tool` (partial — "task" vs "delegate-task") | SILENT — derivable from tool name |
| 18 | `surface` | `DelegationSurface?` | YES (derived) | No equivalent | SILENT — derivable from `executionMode` |
| 19 | `recoveryGuarantee` | `DelegationRecoveryGuarantee?` | YES (derived) | No equivalent | **DEGRADED** — affects delegation-status tool's resumption info |
| 20 | `workingDirectory` | `string` | YES | No equivalent | SILENT — always `process.cwd()` |
| 21 | `ptySessionId` | `string?` | YES (always absent) | No equivalent | SILENT |
| 22 | `fallbackReason` | `string?` | NO (redacted) | No equivalent | SILENT — already redacted |
| 23 | `queueKey` | `string` | YES | No equivalent in session-tracker | **DEGRADED** — used for concurrency diagnostics |
| 24 | `terminalKind` | `DelegationTerminalKind?` | YES (via normalization) | No equivalent | **DEGRADED** — important for delegation-status tool |
| 25 | `terminationSignal` | `string?` | NO (never persisted) | No equivalent | SILENT |
| 26 | `explicitCancellation` | `boolean?` | YES (always false) | No equivalent | SILENT |
| 27 | `redirectedFrom` | `string?` | NO (never persisted) | No equivalent | SILENT — edge case chain metadata |
| 28 | `restartedFrom` | `string?` | NO (never persisted) | No equivalent | SILENT |
| 29 | `resumedFrom` | `string?` | NO (never persisted) | No equivalent | SILENT |
| 30 | `chainedFrom` | `string?` | NO (never persisted) | No equivalent | SILENT |
| 31 | `executionState` | `DelegationExecutionState?` | NO (never persisted) | No equivalent | SILENT |
| 32 | `firstActionAt` | `number?` | NO (never persisted) | `ChildSessionRecord.created` (approximate) | SILENT |
| 33 | `signalSource` | `DelegationSignalSource?` | NO (never persisted) | No equivalent | SILENT |
| 34 | `actionCount` | `number?` | NO (never persisted) | `Turn[].tools.length` sum (can derive) | SILENT |
| 35 | `messageCount` | `number?` | NO (never persisted) | `Turn[]` length (can derive) | SILENT |
| 36 | `toolCallCount` | `number?` | NO (never persisted) | `Turn[].tools.length` sum (can derive) | SILENT |
| 37 | `evidenceLevel` | `DelegationEvidenceLevel?` | NO (never persisted) | No equivalent | SILENT |
| 38 | `finalMessageExcerpt` | `string?` | NO (never persisted) | `ChildSessionRecord.lastMessage` (full message) | SILENT — session-tracker has richer data |
| 39 | `v2` | `boolean?` | NO (never persisted) | No equivalent | SILENT — internal routing flag |

**Key finding:** Of 32 Delegation interface fields, only 19 are actually persisted. The remaining 13+ fields (`prompt`, `result`, `error`, `fallbackReason` are redacted; others are optional/transient) are in-memory-only state that migration doesn't need to handle. [CITED: `delegation-persistence.ts:129-131` — redaction, `normalizePersistedDelegation()` lines 136-222 — reconstruction logic]

### 1B. Session-Continuity.json Field Inventory (REQ-P41A-02)

Source interfaces: `ContinuityStoreFile`, `SessionContinuityRecord`, `SessionContinuityMetadata`, `GovernancePersistenceState` (all in `src/shared/types.ts:275-358`)
Actual on-disk data: 18 records in `.hivemind/state/session-continuity.json` (14 KB) [VERIFIED: on-disk]

#### ContinuityStoreFile (top-level)

| # | Field | Type | Persisted? | Session-Tracker Equivalent | Risk if Removed |
|---|-------|------|-----------|----------------------------|-----------------|
| 1 | `version` | `number` | YES (always 1) | `SessionContinuityIndex.version` / `ProjectContinuityIndex.version` (string `"2.0"`) — **FORMAT MISMATCH** | SILENT |
| 2 | `updatedAt` | `number` | YES | `ProjectContinuityIndex.lastUpdated` (ISO string) — **FORMAT MISMATCH** | SILENT |
| 3 | `sessions` | `Record<string, SessionContinuityRecord>` | YES (18 entries, all test) | `ProjectContinuityIndex.sessions` (123 live entries) — different schema | SILENT — all continuity sessions are test artifacts |
| 4 | `governance` | `GovernancePersistenceState` | YES (0 rules, 1 test violation) | No equivalent in session-tracker | **DESIGN DECISION** — governance should get own file |

#### SessionContinuityRecord (per-session wrapper)

| # | Field | Type | Persisted? | Session-Tracker Equivalent | Risk if Removed |
|---|-------|------|-----------|----------------------------|-----------------|
| 5 | `sessionID` | `string` | YES | `ProjectSessionEntry` key | SILENT |
| 6 | `promptParams` | `SessionPromptParams` | YES (always `{}`) | No equivalent | SILENT — always empty |
| 7 | `toolProfile` | `SessionToolProfile?` | NO (never persisted) | No equivalent | SILENT |

#### SessionContinuityMetadata (the important section)

| # | Field | Type | Persisted? | Session-Tracker Equivalent | Risk if Removed |
|---|-------|------|-----------|----------------------------|-----------------|
| 8 | `status` | `TaskStatus` | YES (18/18 records) | `ChildSessionRecord.status` / `ProjectSessionEntry.status` — **TYPE MISMATCH** (`TaskStatus` has 8 values: `pending\|queued\|running\|completed\|failed\|error\|cancelled\|interrupt` vs session-tracker `active\|idle\|completed\|error`) | **DEGRADED** — partial mapping possible |
| 9 | `description` | `string` | YES (17/18 records) | `ChildSessionRecord.delegatedBy.description` | SILENT |
| 10 | `title` | `string?` | NO (0/18 records) | `SessionRecord.title` | SILENT |
| 11 | `delegation` | `DelegationMeta \| null` | YES (18/18 records, always `null`) | `ChildSessionRecord.delegatedBy` + `mainAgent` | SILENT — was always null |
| 12 | `category` | `string?` | NO (0/18 records) | No equivalent | SILENT |
| 13 | `constraints` | `string[]` | YES (18/18 records, always `[]`) | No equivalent | SILENT — always empty |
| 14 | `lifecycle` | `SessionLifecycleState?` | NO (0/18 records) | Partial: `ChildSessionRecord.status` + `updated` | SILENT — never populated on disk |
| 15 | `pendingNotifications` | `PendingNotification[]` | YES (7/18 records have data, all test `fake-ses-*` IDs) | No equivalent in session-tracker | **DEGRADED** if production notifications exist (none do today) |
| 16 | `resultCapture` | `CapturedResult?` | NO (0/18 records) | `ChildSessionRecord.lastMessage` (partial) | SILENT |
| 17 | `compactionCheckpoint` | `CompactionCheckpointData?` | NO (0/18 records) | No equivalent in session-tracker | SILENT — never populated on disk |
| 18 | `delegationPacket` | `DelegationPacket?` | NO (0/18 records) | `ChildSessionRecord.delegatedBy` (partial) | SILENT |
| 19 | `route` | `string?` | NO (0/18 records) | No equivalent | SILENT |
| 20 | `lastToolActivityAt` | `number?` | NO (0/18 records) | `SessionRecord.updated` (partial) | SILENT |
| 21 | `updatedAt` | `number` | YES (18/18 records) | `ChildSessionRecord.updated` / `ProjectSessionEntry.updated` (ISO string) — **FORMAT MISMATCH** | SILENT |

#### GovernancePersistenceState

| # | Field | Type | Persisted? | Session-Tracker Equivalent | Risk if Removed |
|---|-------|------|-----------|----------------------------|-----------------|
| 22 | `rules` | `GovernanceRule[]` | YES (0 rules) | No equivalent | **DESIGN DECISION** |
| 23 | `violations` | `GovernanceViolation[]` | YES (1 test violation) | No equivalent | **DESIGN DECISION** |

**Key finding:** Of 22 ContinuityStoreFile fields, only 10 are actually populated on disk. 5 fields (`constraints`, `promptParams`, `delegation`, `pendingNotifications`, `updatedAt`) exist as present entries; `description` and `status` are commonly populated. Fields like `lifecycle`, `resultCapture`, `compactionCheckpoint`, `delegationPacket`, `route`, `lastToolActivityAt`, `title`, `category` are all absent from on-disk data — they exist only as type definitions. [VERIFIED: on-disk]

---

## Gap Analysis (Fields NOT in Session-Tracker)

### HIGH Risk

| Gap Field | Source File | Why HIGH | Proposed Extension | Can Add? |
|-----------|------------|----------|-------------------|----------|
| `pendingNotifications` | session-continuity.json | Notification persistence and replay depend on this data. 7 of 18 test records have actual notification data (all test `fake-ses-*` child IDs). If production notifications were real, loss would mean silent notification drop. | Add `PendingNotification[]` to `ChildSessionRecord` or create per-session `notifications.json` | ✅ YES — add optional `pendingNotifications?: PendingNotification[]` to `ChildSessionRecord` |

### MEDIUM Risk

| Gap Field | Source File | Why MEDIUM | Proposed Extension | Can Add? |
|-----------|------------|-----------|-------------------|----------|
| `queueKey` | delegations.json | Used for concurrency diagnostics. `HierarchyManifestChild` doesn't track which queue a delegation runs on. Without it, concurrency debugging loses specificity. | Add optional `queueKey?: string` to `ChildSessionRecord.delegatedBy` | ✅ YES |
| `terminalKind` | delegations.json | Important for `delegation-status` tool — tells callers whether a delegation is resumable (`completed`), failed permanently (`error`), or crashed (`non-resumable-after-restart`). | Add optional `terminalKind?: string` to `ChildSessionRecord` | ✅ YES |
| `recoveryGuarantee` | delegations.json | Affects resumption semantics displayed by `delegation-status` tool. Without it, the tool loses the ability to distinguish "can resume" vs "must restart". | Add optional `recoveryGuarantee?: string` to `ChildSessionRecord` | ✅ YES |
| `executionMode` | delegations.json | Tells whether a delegation was SDK-based, PTY-based, or headless. Partially tracked via `delegatedBy.tool` but not as a first-class field. | Add optional `executionMode?: "sdk" \| "pty" \| "headless"` to `ChildSessionRecord.delegatedBy` | ✅ YES |
| `compactionCheckpoint` (if ever populated) | session-continuity.json | Needed for compaction recovery — stores where a session was last compacted so the engine can restart from that point. Currently NEVER populated on disk (0/18 records). | Add optional `compactionCheckpoint` to `ChildSessionRecord` | ✅ YES (low priority — never used today) |
| `lifecycle` (if ever populated) | session-continuity.json | Provides fine-grained lifecycle phase (`created`/`queued`/`dispatching`/`running`/`completed`/`failed`) beyond the simple `ChildSessionRecord.status` (`active`/`completed`/`error`). Currently NEVER populated on disk (0/18 records). | Add optional `lifecycle` to `ChildSessionRecord` | ✅ YES (low priority — never used today) |
| `governance` (rules + violations) | session-continuity.json | Currently holds 0 rules and 1 test violation. Governance is logically distinct from session tracking. Per SPEC Open Question #2, should be a separate store. | Create `.hivemind/state/governance-state.json` as standalone file | ✅ YES — but create separate file, don't merge into session-tracker |

### LOW Risk (no action needed)

The following gap fields are all LOW risk because they are either:
- Never persisted (in-memory only): `resultTruncated`, `terminationSignal`, `redirectedFrom`, `restartedFrom`, `resumedFrom`, `chainedFrom`, `executionState`, `signalSource`, `evidenceLevel`, `v2`
- Redacted before persist: `result`, `error`, `fallbackReason`
- Always zero/empty/default: `stablePollCount`, `gracePeriodExpiresAt`, `lastMessageCountChangeAt`, `surface`, `ptySessionId`, `explicitCancellation`, `promptParams`, `constraints`, `category`, `route`, `lastToolActivityAt`, `title`, `toolProfile`
- Always null on disk: `delegation` (DelegationMeta), `delegationPacket`, `resultCapture`
- Derivative from other fields: `workingDirectory`, `firstActionAt`, `actionCount`, `messageCount`, `toolCallCount`, `finalMessageExcerpt`

### Summary

- **HIGH gaps:** 1 (`pendingNotifications`) — needed for notification persistence
- **MEDIUM gaps:** 6 (`queueKey`, `terminalKind`, `recoveryGuarantee`, `executionMode`, `compactionCheckpoint`, `lifecycle`)
- **LOW gaps:** ~20+ (all safe to ignore — either never persisted, always empty, or derivable)

---

## Actor/Consumer Map (Who Reads What)

### `delegations.json` Consumers (`.hivemind/state/delegations.json`)

| # | File | Line(s) | Role | Type | What Happens on Delete |
|---|------|---------|------|------|----------------------|
| 1 | `src/task-management/continuity/delegation-persistence.ts` | 55 | PATH RESOLVER | PATH-READ | `getDelegationsFilePath()` returns path. Callers would write to nonexistent path. |
| 2 | `src/task-management/continuity/delegation-persistence.ts` | 58-134 | WRITER | WRITE | `persistDelegations()` writes to `delegations.json`. After delete: recreates file with new data (empty array if no delegations active). |
| 3 | `src/task-management/continuity/delegation-persistence.ts` | 224-250 | READER | READ | `readPersistedDelegations()` returns `[]` if file missing (line 226-228: `!existsSync` check) |
| 4 | `src/coordination/delegation/state-machine.ts` | 218, 394 | CALLER of WRITER | WRITE | Calls `persistDelegations()` — write goes to delegations.json path |
| 5 | `src/coordination/delegation/retry-handler.ts` | 4, 23 | CALLER of WRITER | WRITE | Constructor assigns `this.persist = persistDelegations` |
| 6 | `src/coordination/delegation/manager-runtime.ts` | 318 | CALLER of READER | READ | Calls `readPersistedDelegations()` during `recoverPending()` startup |
| 7 | `src/tools/delegation/delegation-status.ts` | 5, 429, 464 | CALLER of READER + READ | READ | Imports `readPersistedDelegations`. Line 429: reads from file. Line 464-468: falls back to `getSessionTrackerDelegation()` |
| 8 | `src/tools/delegation/readers/legacy-reader.ts` | 41 | DIRECT READER | READ | Hardcoded path to `.hivemind/state/delegations.json`. Returns `[]` on error (try/catch at lines 23, 36) |
| 9 | `src/tools/delegation/readers/types.ts` | 72, 76, 106, 152 | SCHEMA | READ | Zod schemas + conversion functions for legacy format |
| 10 | `src/tools/hivemind/hivemind-session-view.ts` | 68-78 | DIRECT READER | READ | Line 71: hardcoded path. Returns `[]` on error (try/catch) |
| 11 | `src/tools/session/session-journal-export.ts` | 5, 84 | CALLER of READER | READ | Imports `readPersistedDelegations` |
| 12 | `src/features/bootstrap/control-plane/gate-decision.ts` | 120 | PATH VALIDATOR | VALIDATE | `isStateFilePath()` checks if path ends with `delegations.json` |
| 13 | `src/shared/security/path-scope.ts` | 39 | JSDOC EXAMPLE | DOC | `assertPathWithinRoot()` example in comment |
| 14 | `src/sidecar/readonly-state.ts` | 83 | JSDOC EXAMPLE | DOC | Example in JSDoc |

### `session-continuity.json` Consumers (`.hivemind/state/session-continuity.json`)

| # | File | Line(s) | Role | Type | What Happens on Delete |
|---|------|---------|------|------|----------------------|
| 1 | `src/task-management/continuity/index.ts` | 51 | PATH RESOLVER | PATH-READ | `resolveContinuityFilePath()` returns canonical path under `.hivemind/state/` |
| 2 | `src/task-management/continuity/index.ts` | 55 | PATH RESOLVER | PATH-READ | `resolveLegacyFilePath()` returns `.opencode/state/hivemind/session-continuity.json` |
| 3 | `src/task-management/continuity/index.ts` | 259-309 | LOADER | READ | `loadStoreFromDisk()` — tries canonical then legacy path. Returns `emptyStore()` if neither exists (line 309) |
| 4 | `src/task-management/continuity/index.ts` | 312-322 | WRITER | WRITE | `writeStoreToDisk()` — atomic write |
| 5 | `src/task-management/continuity/index.ts` | 324-340 | `persistStore()` | WRITE | Writes if `config.atomic_commit` is true |
| 6 | `src/task-management/continuity/index.ts` | 346-348 | `listSessionContinuity()` | READ | Returns `[]` from empty store |
| 7 | `src/task-management/continuity/index.ts` | 350-353 | `getSessionContinuity(id)` | READ | Returns `undefined` from empty store |
| 8 | `src/task-management/continuity/index.ts` | 367-378 | `recordSessionContinuity()` | WRITE | Creates new entry, writes to file |
| 9 | `src/task-management/continuity/index.ts` | 381-422 | `patchSessionContinuity()` | WRITE | Updates existing entry, writes to file |
| 10 | `src/task-management/continuity/index.ts` | 446-454 | `deleteSessionContinuity()` | WRITE | Removes entry, writes to file |
| 11 | `src/task-management/continuity/index.ts` | 460-462 | `getGovernancePersistenceState()` | READ | Returns default empty governance |
| 12 | `src/task-management/continuity/index.ts` | 464-474 | `recordGovernancePersistenceState()` | WRITE | Writes governance to store |
| 13 | `src/plugin.ts` | 79, 232-237 | CALLER (notification persistence) | READ/WRITE | Notification persistence during delegation dispatch |
| 14 | `src/plugin.ts` | 630-645 | CALLER (notification replay) | READ/WRITE | `listSessionContinuity()` for replay, `patchSessionContinuity()` to clear after replay |
| 15 | `src/task-management/lifecycle/index.ts` | 8, 108-217 | CALLER | READ/WRITE | Multiple `listSessionContinuity`, `getSessionContinuity`, `patchSessionContinuity` calls for lifecycle phase transitions and compaction |
| 16 | `src/hooks/lifecycle/session-hooks.ts` | 12, 151, 308 | HOOK READER | READ | Reads continuity for auto-loop decisions, compaction context |
| 17 | `src/hooks/guards/tool-guard-hooks.ts` | 11, 193 | HOOK READER | READ | Reads continuity for metadata injection into tool output |
| 18 | `src/coordination/completion/notification-handler.ts` | 13, 219-229 | CALLER | READ/WRITE | Records delegation results as `PendingNotification` entries |
| 19 | `src/features/governance-engine/evaluator.ts` | 2, 97-99 | CALLER | READ/WRITE | Writes governance violations via `recordGovernancePersistenceState()` |
| 20 | `src/tools/session/session-journal-export.ts` | 4, 80 | CALLER of READER | READ | Calls `listSessionContinuity()` for journal export |
| 21 | `src/features/bootstrap/control-plane/gate-decision.ts` | 119 | PATH VALIDATOR | VALIDATE | `isStateFilePath()` checks if path ends with `session-continuity.json` |

### Important Distinction: Per-Session vs State-Level

There are **two files named `session-continuity.json`** in different paths:

| Path | Purpose | Status |
|------|---------|--------|
| `.hivemind/state/session-continuity.json` | Legacy standalone store (18 test sessions) | **TO BE DELETED** |
| `.hivemind/session-tracker/{id}/session-continuity.json` | Per-session file in session-tracker | **TO BE KEPT** |

The grep results for `session-continuity.json` in `src/` include **both** references. The per-session path references (in `session-tracker/types.ts`, `session-tracker/persistence/session-index-writer.ts`, etc.) reference the session-tracker path — these are NOT affected by the deletion.

References to `.hivemind/state/session-continuity.json` are:
- `continuity/index.ts:51` — the `resolveContinuityFilePath()` canonical path
- `continuity/index.ts:55` — the legacy path resolver
- `gate-decision.ts:119` — path validator

All other grep matches reference the per-session file path under `session-tracker/` and are safe.

---

## Migration Plan (Skeleton)

### Phase P41-B: Add Gap Fields to Session-Tracker Types, Update Writers
**Effort:** MEDIUM (5-8 files modified)
**Tasks:**
1. [ ] Add optional gap fields to `ChildSessionRecord` in `session-tracker/types.ts`:
   - `pendingNotifications?: PendingNotification[]`
   - `queueKey?: string` (in `DelegatedBy`)
   - `terminalKind?: string`
   - `recoveryGuarantee?: string`
   - `executionMode?: "sdk" | "pty" | "headless"` (in `DelegatedBy`)
2. [ ] Create separate `.hivemind/state/governance-state.json` store (per SPEC Open Question #2)
3. [ ] Redirect `persistDelegations()` in `state-machine.ts` to write delegation metadata to session-tracker's `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()` instead of `delegations.json`
4. [ ] Redirect `notification-handler.ts` to write pending notifications to `ChildSessionRecord.pendingNotifications` instead of `state/session-continuity.json`
5. [ ] Redirect `lifecycle/index.ts` continuity writers to session-tracker

### Phase P41-C: Update Readers, Add Redirect from Old Paths
**Effort:** MEDIUM (8-12 files modified)
**Tasks:**
1. [ ] Update `delegation-status.ts` to read exclusively from session-tracker (remove `readPersistedDelegations` fallback)
2. [ ] Update `hivemind-session-view.ts` `readDelegationsForSession()` to read from hierarchy-manifest + child files
3. [ ] Update `session-journal-export.ts` to build execution lineage from session-tracker
4. [ ] Keep `listSessionContinuity()`, `getSessionContinuity()` function signatures but change backing store to session-tracker (minimizes 39+ call sites across 10+ files)
5. [ ] Remove or deprecate `LegacyPersistenceStatusReader` — `SessionTrackerStatusReader` already exists and reads from hierarchy-manifest
6. [ ] Update `gate-decision.ts` — remove dead path checks for these exact files (`.hivemind/state/` prefix check already blocks dir writes)

### Phase P41-D: Delete Old Files + Tools Cleanup
**Effort:** SMALL (2-3 files)
**Tasks:**
1. [ ] Delete `.hivemind/state/delegations.json` and `.hivemind/state/session-continuity.json`
2. [ ] Remove `getDelegationsFilePath()`, `persistDelegations()`, `readPersistedDelegations()` from `delegation-persistence.ts` (or keep as no-ops for backward compat)
3. [ ] Remove `resolveContinuityFilePath()`, `loadStoreFromDisk()`, `persistStore()`, all CRUD functions from `continuity/index.ts` (or keep as session-tracker wrappers)
4. [ ] Remove P41 research artifact notes about "KEEP all three" (superseded)

### Phase P41-E: Progressive Disclosure Tool
**Effort:** SMALL (1 file)
**Tasks:**
1. [ ] Add runtime check at plugin startup: if `state/delegations.json` or `state/session-continuity.json` still exist, log a deprecation warning with migration status
2. [ ] Optional: add auto-migration tool that reads old files and writes data to session-tracker (if any production data is later found)

---

## Risk Assessment

### BLOCKING: None Found
No consumer crashes with a hard error when either file is missing. All readers have graceful fallbacks:
- `readPersistedDelegations()` returns `[]` (line 226-228: `!existsSync` check) — SILENT
- `loadStoreFromDisk()` returns `emptyStore()` (line 309) — SILENT
- `LegacyPersistenceStatusReader` returns `[]` on error (try/catch at lines 23, 36) — SILENT
- `hivemind-session-view.ts` returns `[]` on error (try/catch at line 78) — SILENT

**However:** The **writer code** (`persistDelegations()`, `persistStore()`) continues to write to old file paths after deletion. This means:
- `state-machine.ts` recreates `delegations.json` with empty/partial data on next delegation event
- `plugin.ts` recreates `session-continuity.json` with new notification data
- `lifecycle/index.ts` recreates `session-continuity.json` with lifecycle state
- `notification-handler.ts` recreates `session-continuity.json` with pending notifications

**These re-created files would need to be re-deleted or the writer code must be redirected.** This is the primary operational risk.

### DEGRADED: 6 Categories

| Consumer | What Degrades | Severity | Mitigation |
|----------|--------------|----------|------------|
| `plugin.ts` notification replay | `listSessionContinuity()` returns `[]` — no notifications replayed at startup | MEDIUM | Add notification storage to session-tracker `ChildSessionRecord.pendingNotifications` |
| `lifecycle/index.ts` | `getSessionContinuity(id)` returns `undefined` — no lifecycle state for phase transitions | MEDIUM | Migrate lifecycle readers to session-tracker; `ChildSessionRecord.status` + `updated` provides partial info |
| `notification-handler.ts` | `getSessionContinuity` returns `undefined` — can't enqueue notification for parent session | MEDIUM | Write to session-tracker's new `pendingNotifications` field instead |
| `DelegationStateMachine.persistDelegations()` | Writes to `delegations.json` — must write to session-tracker instead | MEDIUM | Redirect to `ChildWriter.createChildFile()` |
| `manager-runtime.ts recoverPending()` | No persisted delegations to recover at startup | LOW | Currently 0 production delegations to recover; in-memory state suffices |
| `governance-engine/evaluator.ts` | `getGovernancePersistenceState()` returns empty defaults | LOW | Governance is test-only today; create separate `governance-state.json` store |

### SILENT: ~15 Consumers
All remaining consumers (listed in the actor/consumer map) return empty/graceful results on missing files. Key examples:
- `delegation-status.ts` falls back to session-tracker data (already reads hierarchy-manifest + child files)
- `LegacyPersistenceStatusReader` returns `[]` (session-tracker reader already exists as primary)
- `hivemind-session-view.ts` returns empty delegations array
- `session-journal-export.ts` returns empty for continuity + delegation sections
- `gate-decision.ts` becomes dead code for exact paths but still blocks `.hivemind/state/` prefix

### TEST-ONLY: ~10 Test Files
| Test File | Impact |
|-----------|--------|
| `tests/lib/continuity.test.ts` | Validates state/session-continuity.json CRUD — must be updated |
| `tests/lib/delegation-persistence.test.ts` | Validates delegations.json write/read — must be updated |
| `tests/lib/delegation-manager.test.ts` | Validates delegation lifecycle with persistence — must be updated |
| `tests/lib/delegation/readers/legacy-reader.test.ts` | Validates legacy delegations.json parsing — legacy reader deprecated |
| `tests/tools/session-journal-export.test.ts` | Writes both files to temp dir — must be updated |
| `tests/lib/state-root-migration.test.ts` | Path assertions must be updated |
| `tests/lib/control-plane/gatekeeper.test.ts` | Path guard assertions must be updated |
| `tests/lib/agent-work-contracts/store.test.ts` | Asserts files don't exist after contract creation |
| `tests/tools/hivemind-pressure.test.ts` | Asserts files don't exist |
| `tests/lib/trajectory/ledger.test.ts` | Asserts files don't exist in certain scenarios |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Writing child session data | Custom JSON writer | `ChildWriter` from `session-tracker/persistence/child-writer.ts` | Has atomic-write, retry queue, per-child serial queues, stale queue detection |
| Writing hierarchy tree | Custom hierarchy writer | `SessionIndexWriter` + `HierarchyManifestWriter` | Already maintains full parent-child tree with nested L2+ support |
| Reading delegation status | Custom status reader | `SessionTrackerStatusReader` in `delegation/readers/` | Already implemented and wired as the primary reader |
| Writing project index | Custom project index | `ProjectIndexWriter` | Already has serialized concurrent writes, hierarchy index integration |

---

## Common Pitfalls

### Pitfall 1: Writer Code Recreates Deleted Files
**What goes wrong:** After deleting `delegations.json` and `session-continuity.json`, the writer code continues to call `persistDelegations()` and `persistStore()` which write to the same paths — recreating the files.

**Why it happens:** The writer code is in the producer modules (`state-machine.ts`, `plugin.ts`, `lifecycle/index.ts`, `notification-handler.ts`), not in the persistence module. Deleting the file doesn't stop the code from writing to the path.

**How to avoid:** Redirect writer code in the same phase that deletes the files. Use `Depends on` to ensure P41-B (redirect writers) runs before P41-D (delete files).

**Warning signs:** Files reappear after deletion during testing.

### Pitfall 2: Two Files Named `session-continuity.json`
**What goes wrong:** Developers and tools may confuse `.hivemind/state/session-continuity.json` (being deleted) with `.hivemind/session-tracker/{id}/session-continuity.json` (being kept).

**Why it happens:** Same filename, different path. The session-tracker code references the per-session path, while the continuity code references the state/ path.

**How to avoid:** After deleting the state/ version, add a code comment at `continuity/index.ts` clarifying the distinction. No naming collision exists after deletion.

### Pitfall 3: Status Type Mismatch Between System and Destination
**What goes wrong:** `Delegation.status` uses `"dispatched" | "running" | "completed" | "error" | "timeout"` while session-tracker `ChildSessionRecord.status` uses `"active" | "completed" | "error"`. The `delegation-status.ts:218-219` cast is lossy.

**How to avoid:** Normalize at the read boundary — session-tracker stores its own status values, and the `delegation-status` tool maps them on read (as it already does at line 218-219).

### Pitfall 4: Timestamp Format Mismatch
**What goes wrong:** `Delegation.createdAt` is a Unix millisecond epoch (`number`). `ChildSessionRecord.created` is ISO 8601 string. Direct assignment would break type expectations.

**How to avoid:** Use `new Date(delegation.createdAt).toISOString()` when writing to session-tracker, and `new Date(child.created).getTime()` when reading back.

---

## Code Examples

### Redirecting `persistDelegations()` to Session-Tracker Child Writer

```typescript
// Current (in state-machine.ts:218)
persistDelegations(Array.from(this.delegations.values()))

// Future — write to session-tracker instead
// Using existing ChildWriter + HierarchyManifestWriter
await childWriter.createChildFile(parentSessionID, childSessionID, {
  sessionID: childSessionID,
  parentSessionID,
  delegationDepth: delegation.nestingDepth,
  delegatedBy: {
    agentName: delegation.agent,
    model: "unknown", // from delegation context
    tool: delegation.executionMode === "sdk" ? "task" : "delegate-task",
    description: delegation.prompt?.slice(0, 500) ?? "",
    subagentType: delegation.agent,
  },
  created: new Date(delegation.createdAt).toISOString(),
  updated: new Date(delegation.completedAt ?? Date.now()).toISOString(),
  status: mapDelegationStatus(delegation.status), // "dispatched" → "active", "completed" → "completed", "timeout" → "error"
  mainAgent: { name: delegation.agent, model: "unknown" },
  turns: [],
  children: [],
  // New optional fields (added in P41-B):
  queueKey: delegation.queueKey,
  terminalKind: delegation.terminalKind,
  recoveryGuarantee: delegation.recoveryGuarantee,
  executionMode: delegation.executionMode,
})
```

### Status Mapping Function (from `delegation-status.ts:218-219`)

```typescript
// Existing mapping — keep this boundary
function mapDelegationStatus(status: Delegation["status"]): string {
  // DelegationStatus → session-tracker status
  const map: Record<Delegation["status"], string> = {
    dispatched: "active",
    running: "active",
    completed: "completed",
    error: "error",
    timeout: "error",
  }
  return map[status]
}
```

### Reading Notifications from Session-Tracker (Instead of Continuity)

```typescript
// Current (in plugin.ts:232-237)
const continuity = getSessionContinuity(parentSessionID)
continuity?.metadata.pendingNotifications.push(notification)

// Future — read from session-tracker ChildSessionRecord
// Using existing method:
const childRecord = await childWriter.readChildData(parentSessionID)
if (childRecord) {
  childRecord.pendingNotifications = childRecord.pendingNotifications ?? []
  childRecord.pendingNotifications.push(notification)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `persistDelegations()` writes flat array to `delegations.json` | `ChildWriter` + `HierarchyManifestWriter` writes per-child `.json` + `hierarchy-manifest.json` | P41-B | Structured delegation tree instead of flat array |
| `SessionContinuityRecord` as standalone JSON file | `SessionContinuityIndex` per session in session-tracker directory | Already done | Per-session scoping eliminates file contention |
| `LegacyPersistenceStatusReader` parses `delegations.json` | `SessionTrackerStatusReader` reads `hierarchy-manifest.json` | Already done | SessionTrackerStatusReader is the primary; legacy is fallback |
| `getSessionContinuity()` / `listSessionContinuity()` from flat file | Per-session `session-continuity.json` in session-tracker | P41-C | Function signatures preserved, backing store changed |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `delegations.json` (35 records) contains ZERO production data — all fake `child-*` / `parent-*` / `ses-parent-*` IDs that do not match any of the 123 live `ses_*` session-tracker sessions | Field Inventory | If ANY record IS production data, migration would lose it. Verified by on-disk comparison: zero overlap across 35 + 123 IDs. |
| A2 | `session-continuity.json` (18 records) contains ZERO production data — session IDs like `ses_parent`, `parent-1`, `parent-c` don't match `ses_*` format | Field Inventory | Same as A1. Verified by on-disk comparison: zero overlap of 18 continuity IDs with 123 live session IDs. |
| A3 | Only 5 continuity metadata fields are actually populated on disk: `status`, `description`, `delegation`, `constraints`, `pendingNotifications`, `updatedAt` | Session-Continuity Field Inventory | If production sessions populated `lifecycle`, `resultCapture`, `compactionCheckpoint`, etc., those would be missing from session-tracker. Verified: 0/18 records have those fields. |
| A4 | 7 of 18 continuity test sessions have `pendingNotifications` data (all test `fake-ses-*` child IDs) — highest-risk gap field | Gap Analysis | If production notifications were added to the old file before migration, they'd be lost. Currently all notification targets are test sessions. |
| A5 | All readers handle missing files gracefully — none throw BLOCKING errors | Risk Assessment | If a code path without try/catch is discovered, deletion could crash. Verified all known readers: ~15 paths all have graceful handling. |
| A6 | Writer code (`persistDelegations`, `persistStore`) will recreate deleted files unless redirected | Risk Assessment | The most likely operational failure — writer code runs on every delegation event / lifecycle transition. |
| A7 | `LegacyPersistenceStatusReader` is a FALLBACK reader; `SessionTrackerStatusReader` already exists as the primary | Actor/Consumer Map | If session-tracker reader is incomplete, removing legacy reader would lose delegation data. Verified: `delegation-status.ts:397` already reads `getSessionTrackerChildren()`. |
| A8 | The 10+ continuity CRUD functions (`getSessionContinuity`, `listSessionContinuity`, etc.) have ~39 call sites across 10+ files | Migration Plan | Changing all 39 call sites would be LARGE effort. Strategy: keep function signatures, change backing store to session-tracker. |
| A9 | `DelegatedBy` model field is always `"unknown"` for session-tracker child records | Code Examples | Session-tracker doesn't track the delegating agent's model. Verified via `tool-delegation.ts:264` where model is hardcoded to `"unknown"`. |

---

## Open Questions

1. **Governance state destination — merge into session-tracker or separate file?**
   - What we know: `governance.rules` (0 rules) and `governance.violations` (1 test violation) live in `state/session-continuity.json`
   - What's unclear: The SPEC flags this as Open Question #2 — governance is logically distinct from session tracking
   - Recommendation: Create separate `.hivemind/state/governance-state.json` as standalone file. Governance is a cross-cutting concern (applies to all sessions), not a per-session concern.

2. **Disposal plan for 35 test-artifact delegation records?**
   - What we know: Fake session IDs (`child-*`, `parent-*`) can't be mapped to any real session
   - What's unclear: Should they be silently dropped, or is a cleanup script needed?
   - Recommendation: **Silently drop** on merge. No session-tracker entries match these IDs, so no migration is possible or meaningful.

3. **Should `PendingNotification[]` go into `ChildSessionRecord` or a separate per-session file?**
   - What we know: `ChildSessionRecord` is already written as per-session `.json` files. Adding `pendingNotifications` would increase file size.
   - Recommendation: Add as optional field to `ChildSessionRecord`. Graceful if undefined. No separate I/O needed.

4. **Should `persistDelegations()` function be removed entirely or kept as no-op?**
   - What we know: 25+ imports reference `persistDelegations` and `readPersistedDelegations`
   - Recommendation: Keep as no-ops that log deprecation warnings. Remove in a later cleanup phase after all callers have been migrated.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All runtime code | ✓ | ≥20.0.0 (project req) | — |
| TypeScript | Type-checking | ✓ | — | — |
| Vitest | Test suite | ✓ | — | — |

**No external dependencies** are required for this migration. All changes use existing in-repo infrastructure.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run -t "delegation\|continuity\|session-tracker" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-P41A-01 | Delegation field inventory verified | documentation | Manual review of RESEARCH.md | ✅ RESEARCH.md |
| REQ-P41A-02 | Continuity field inventory verified | documentation | Manual review of RESEARCH.md | ✅ RESEARCH.md |
| REQ-P41A-03 | Gap report with recommendations | documentation | Manual review of RESEARCH.md | ✅ RESEARCH.md |
| REQ-P41A-04 | Full actor/consumer map | documentation | Manual review of RESEARCH.md | ✅ RESEARCH.md |
| REQ-P41A-05 | Breakage impact analysis complete | documentation | Manual review of RESEARCH.md | ✅ RESEARCH.md |

### Wave 0 Gaps

- [ ] Gap analysis is documentation-only — no automated tests verify field inventory completeness (acceptance criteria are manual review).

---

## Security Domain

> `security_enforcement` is not explicitly disabled (absent = enabled). However, this phase is investigation-only with no file modifications. Security domain applies to the P41-B migration execution phase, not this investigation.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |

**Note:** This investigation phase reads source code and on-disk files only. No ASVS controls apply. Migration execution (P41-B) should add path traversal guards for session-tracker file writes (already handled by `safeSessionPath()` in `atomic-write.ts`).

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: on-disk] `.hivemind/state/delegations.json` — 35 records, all test data, zero overlap with live sessions
- [VERIFIED: on-disk] `.hivemind/state/session-continuity.json` — 18 records, 7 with pending notifications (all test), zero overlap with live sessions
- [VERIFIED: on-disk] `.hivemind/session-tracker/project-continuity.json` — 123 live sessions, `ses_*` format IDs
- [CITED: src/coordination/delegation/types.ts:26-73] Delegation interface — all 32 fields
- [CITED: src/features/session-tracker/types.ts] ChildSessionRecord, SessionContinuityIndex, HierarchyManifestChild, ProjectSessionEntry interfaces
- [CITED: src/shared/types.ts:275-358] ContinuityStoreFile, SessionContinuityRecord, SessionContinuityMetadata, GovernancePersistenceState
- [CITED: src/task-management/continuity/delegation-persistence.ts:58-134, 224-250] persistDelegations (writer) and readPersistedDelegations (reader) — handles missing files gracefully
- [CITED: src/task-management/continuity/index.ts:259-309] loadStoreFromDisk — returns emptyStore() on missing file
- [CITED: src/tools/delegation/delegation-status.ts:389-422] mergeAllDelegations — reads from 3 sources including session-tracker

### Secondary (MEDIUM confidence)
- [CITED: src/tools/delegation/readers/legacy-reader.ts:41] Hardcoded path to delegations.json
- [CITED: src/tools/hivemind/hivemind-session-view.ts:69-78] Direct reader of delegations.json
- [CITED: src/features/bootstrap/control-plane/gate-decision.ts:119-120] Path validators for both files
- [CITED: src/tools/delegation/readers/types.ts:56-104] Zod schemas for HierarchyManifestChild + LegacyDelegationRecord
- [CITED: src/features/session-tracker/tool-delegation.ts:258-370] recordChildTaskDelegation — writes to ChildWriter + SessionIndexWriter + HierarchyManifestWriter + ProjectIndexWriter

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules are existing in-repo code
- Architecture: HIGH — verified by grep + source code reading
- Pitfalls: HIGH — verified against source code analysis
- Gap analysis: HIGH — verified on-disk data

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (30-day window — schema changes in flight could alter findings)
