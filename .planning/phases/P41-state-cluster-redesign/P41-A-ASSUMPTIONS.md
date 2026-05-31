# P41-A: Investigate Field Mapping + Affected Tools — Assumptions

**Researched:** 2026-05-31
**Domain:** State cluster consolidation (delegations.json + session-continuity.json → session-tracker)
**Confidence:** HIGH (all on-disk + in-code evidence verified)
**Mode:** Read-only analysis — no files modified

---

## 1. Assumptions Table

Each assumption below represents a finding with direct evidence. All are tagged with their source and confidence level per the provenance protocol.

| # | Assumption | Evidence Source | Confidence | Risk if Wrong |
|---|-----------|----------------|------------|---------------|
| A1 | `delegations.json` (23 KB) contains 35 records, ALL of which are test artifacts with fake session IDs (`child-*`, `parent-*`) that do NOT match the live `ses_*` format | [VERIFIED: on-disk file] — field-by-field analysis shows `childSessionId` values like `child-e2e`, `child-integration`, not matching `isValidSessionID()` format which requires `ses` prefix | HIGH | If any record IS real production data, it would be lost on delete. However, the fake IDs (`child-*`, `parent-*`) and test-sounding `queueKey` values (`agent:builder`) confirm these are test artifacts. |
| A2 | `session-continuity.json` (14 KB) contains 18 records, ALL of which are test artifacts. Only 6 of 28+ possible `SessionContinuityMetadata` fields are actually populated. | [VERIFIED: on-disk file] — metadata fields present: `status`, `description`, `delegation`, `constraints`, `pendingNotifications`, `updatedAt`. Fields like `title`, `category`, `lifecycle`, `resultCapture`, `compactionCheckpoint`, `delegationPacket`, `route`, `lastToolActivityAt` are absent. | HIGH | Same as A1 — if any record is production data, the missing fields are not an issue (they were never written). But the session IDs (`ses_parent`, `parent-1`, `parent-c`) don't match live `ses_*` format. |
| A3 | The `delegations.json` parent session IDs overlap partially with `session-continuity.json` session IDs (5 of 5 parent IDs appear in session-continuity) | [VERIFIED: on-disk comparison] — delegations parent IDs: `ses-parent-monitor-notify`, `ses-parent-monitor-fail`, `ses-parent-session`, `ses-parent-sdk`, `parent-1`. First 4 appear as session IDs in session-continuity. `parent-1` appears in both. | HIGH | If the overlap is meaningful, the data could be cross-referenced. But since all are test artifacts, the overlap is coincidental. |
| A4 | `delegations.json` fields `result`, `error`, and `fallbackReason` are REDACTED before being written to disk | [VERIFIED: source code] — `delegation-persistence.ts:129-131`: `redactBoundaryFields(mergedList, { redactFieldNames: ["result", "error", "fallbackReason"] })` | HIGH | No risk — redaction is intentional. These fields would need to be populated from in-memory state, not disk, after migration. |
| A5 | `session-continuity.json` fields `prompt`, `result`, `error`, `output`, `resultSummary`, `summary`, `lastMessageOutput`, `description` are REDACTED before writing | [VERIFIED: source code] — `continuity/index.ts:317-319`: `redactBoundaryFields(store, { redactFieldNames: ["prompt", "result", "error", "output", "resultSummary", "summary", "lastMessageOutput", "description"] })` | HIGH | Same as A4 — redacted fields must be sourced from in-memory equivalents, not the persisted file, after migration. |
| A6 | Neither `delegations.json` nor `session-continuity.json` has ANY session ID overlap with the 121 live session-tracker sessions | [VERIFIED: on-disk comparison] — delegations uses `child-*` + `parent-*` + `ses-parent-*` (test). session-continuity uses `ses_parent` (underscore, not dash) + `parent-*` + `ses-parent-*`. Session-tracker uses `ses_186c54f...` format. Zero matching IDs. | HIGH | If an overlap somehow exists, the merge would need conflict resolution. None found across 35 + 18 + 121 records. |
| A7 | `delegation-status` tool reads from THREE sources: (1) in-memory manager, (2) `delegations.json` via `readPersistedDelegations()`, and (3) session-tracker via `getSessionTrackerDelegation()` / `getSessionTrackerChildren()` | [VERIFIED: source code] — `delegation-status.ts:389-422`: `mergeAllDelegations()` collects from `manager.getAllDelegations()`, `readPersisted()`, and `getSessionTrackerChildren()`. Then at line 462-486, individual lookups also try `getSessionTrackerDelegation()`. | HIGH | If session-tracker already contains the same data as delegations.json, the merge may produce duplicates. Currently no overlap exists (A6). |
| A8 | `Delegation` interface has 32 fields (lines 26-73 in types.ts). Of these, ONLY 19 fields are actually persisted to `delegations.json`. 13 fields are never persisted: `prompt`, `resultTruncated`, `redirectedFrom`, `restartedFrom`, `resumedFrom`, `chainedFrom`, `executionState`, `firstActionAt`, `signalSource`, `actionCount`, `messageCount`, `toolCallCount`, `evidenceLevel`, `finalMessageExcerpt`, `v2`. | [VERIFIED: code + on-disk] — `normalizePersistedDelegation()` (delegation-persistence.ts:136-222) only reconstructs 19 fields. All optional fields with `?` in the interface are absent from the persisted file if not explicitly saved. | HIGH | Migration only needs to handle the 19 persisted fields. The other 13+ fields are ephemeral in-memory state. |
| A9 | `hivemind-session-view` tool reads `delegations.json` directly (hardcoded path at line 71) to provide unified session + delegations + trajectory view. It does NOT read session-tracker for delegation data. | [VERIFIED: source code] — `hivemind-session-view.ts:69-78`: hardcoded `resolve(projectRoot, ".hivemind", "state", "delegations.json")` | HIGH | If `delegations.json` is deleted, this tool would silently return empty delegations for all sessions. |
| A10 | `LegacyPersistenceStatusReader` reads `delegations.json` via hardcoded path and is used as a FALLBACK reader. The primary reader is `SessionTrackerStatusReader` which reads from `hierarchy-manifest.json`. | [VERIFIED: source code] — `legacy-reader.ts:41`: hardcoded `join(projectRoot, ".hivemind", "state", "delegations.json")`. This class implements `DelegationStatusReader` interface alongside a session-tracker-based implementation. | HIGH | If `delegations.json` is deleted, the legacy reader silently returns empty arrays (try/catch at all call sites). |
| A11 | `gate-decision.ts` line 119-120 checks BOTH `session-continuity.json` and `delegations.json` in path validation to block direct user writes to state files. This is a CONFIGURATION guard, not a data consumer. | [VERIFIED: source code] — `gate-decision.ts:115-121`: `isStateFilePath()` checks path endings. | HIGH | After deletion, the path guard for these exact paths becomes dead code — no file exists at those paths anymore. But state/ dir remains, and the guard ALSO matches `.hivemind/state/` prefix (line 118), so it still blocks writes to the directory. |
| A12 | `path-scope.ts:39` references `delegations.json` only as a JSDoc example, not as a runtime path. | [VERIFIED: source code] — `path-scope.ts:38-39`: `assertPathWithinRoot('/repo/.hivemind/state', 'delegations.json', 'continuity')` in example comment only. | HIGH | No runtime impact. The example becomes misleading after deletion. |
| A13 | `session-journal-export` tool reads BOTH `listSessionContinuity()` and `readPersistedDelegations()` to build execution lineage. | [VERIFIED: source code] — `session-journal-export.ts:80-84`: imports both `listSessionContinuity` and `readPersistedDelegations`. | HIGH | After deletion, `readPersistedDelegations()` returns `[]` (see A20), so the journal export loses delegation context. But since the data is all test artifacts (A1), functional degradation is zero for production. |
| A14 | `state-machine.ts` (DelegationStateMachine) calls `persistDelegations()` at lines 218 and 394. This is the PRIMARY writer of `delegations.json`. | [VERIFIED: source code] — `state-machine.ts:21`: imports `persistDelegations`. Lines 218 and 394 call it with `Array.from(this.delegations.values())`. | HIGH | After migration, these calls should write to session-tracker instead. |
| A15 | `retry-handler.ts` uses `getDelegationsFilePath()` (path resolution) and `persistDelegations` (delegated at construction). | [VERIFIED: source code] — `retry-handler.ts:4`: imports both functions. Line 23: `this.persist = options.persist ?? persistDelegations` | HIGH | Same as A14 — needs to write to session-tracker. |
| A16 | `manager-runtime.ts:318` calls `readPersistedDelegations()` during `recoverPending()` to rehydrate in-memory state at startup. | [VERIFIED: source code] — `manager-runtime.ts:4,318`: imports and calls `readPersistedDelegations()` during startup recovery. | HIGH | If delegations.json is deleted before migration, `recoverPending()` finds zero persisted delegations. Currently all records are test artifacts (A1), so no production impact. |
| A17 | `plugin.ts` reads/writes `session-continuity.json` for notification replay on startup (line 630-645) and notification persistence during delegation dispatch (lines 232-237). | [VERIFIED: source code] — `plugin.ts:79`: imports continuity functions. Lines 630-645: `listSessionContinuity()` for replay, `patchSessionContinuity()` to clear notifications after replay. Lines 232-237: `getSessionContinuity` + `patchSessionContinuity` for notification persistence. | HIGH | This is the MOST CRITICAL consumer — NOTIFICATION REPLAY depends on this file for production sessions. However, current data is all test artifacts. |
| A18 | `lifecycle/index.ts` reads/writes `session-continuity.json` for lifecycle state (phase transitions, compaction checkpoints — lines 108-217). | [VERIFIED: source code] — `lifecycle/index.ts:8`: imports continuity functions. Lines 108-217: multiple `listSessionContinuity`, `getSessionContinuity`, `patchSessionContinuity` calls for lifecycle phase transitions and compaction. | HIGH | Lifecycle state for production sessions would need to be sourced from session-tracker after migration. |
| A19 | `notification-handler.ts` writes `session-continuity.json` when recording delegation results as pending notifications for parent sessions. | [VERIFIED: source code] — `notification-handler.ts:13,219-229`: imports continuity functions and writes delegation results as `PendingNotification` entries. | HIGH | Post-migration, this must write to session-tracker to preserve notification delivery semantics. |
| A20 | `readPersistedDelegations()` returns empty array `[]` when `delegations.json` does not exist (line 226-228). It does NOT throw. | [VERIFIED: source code] — `delegation-persistence.ts:225-228`: `if (!existsSync(filePath)) { return [] }`. | HIGH | Deletion is safe — no crash occurs. Consumers that depend on this returning live data get zero delegations. |
| A21 | `loadStoreFromDisk()` in `continuity/index.ts` returns an empty store (`emptyStore()`) when neither canonical nor legacy `session-continuity.json` exists (line 309). It does NOT throw. | [VERIFIED: source code] — `continuity/index.ts:259-309`: iterates both paths, and if none exist, returns `emptyStore()` with `version: 1`, empty sessions, empty governance. | HIGH | Deletion is safe — no crash. But any code that depends on this file for notification replay (A17) or lifecycle state (A18) loses data. |
| A22 | The `GovernancePersistenceState` section in `session-continuity.json` has 0 rules and 1 test violation on disk. Governance evaluation writes through `governance-engine/evaluator.ts` which calls `recordGovernancePersistenceState()`. | [VERIFIED: on-disk + source] — on-disk governance has `rules: []`, `violations: [1 test entry]`. `evaluator.ts:97-99` reads/writes governance via continuity functions. | MEDIUM | Governance state is currently test-only. Production governance would need a new home after deletion. The SPEC flags this as a design decision (Open Question #2). |
| A23 | The session-tracker already captures the CORE delegation metadata needed for the delegation-status tool: child session ID, parent session ID, status, agent name, timestamps, delegation depth. Missing fields are `executionMode`, `recoveryGuarantee`, `queueKey`, and some terminal-state details. | [VERIFIED: code comparison] — `ChildSessionRecord` has `sessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy` (agentName, model, tool, description, subagentType), `created`, `updated`, `status`, `mainAgent`. `HierarchyManifestChild` adds `delegatedBy`, `subagentType`, `turnCount`. | HIGH | The gap fields are enumerated in the field inventory below. Migration effort is MEDIUM — most delegation data is already in session-tracker. |
| A24 | The `hierarchy-manifest.json` `status` field uses values like "active", "idle", "completed", "error" while `Delegation.status` uses "dispatched", "running", "completed", "error", "timeout". There is a TYPE MISMATCH that must be reconciled during merge. | [VERIFIED: code + on-disk] — `delegation-status.ts:218-219` maps `childMeta.status as DelegationStatus` via assertion. The types are incompatible but the code uses a runtime fallback (`validateDelegationStatus` at line 126-129). | MEDIUM | The cast at line 219 is lossy: "idle" and "active" (from session-tracker) fall back to "running" in `validateDelegationStatus()`. Post-migration, a proper mapping would be needed. |
| A25 | Two files named `session-continuity.json` exist in different paths: `.hivemind/state/session-continuity.json` (standalone, to be deleted) and `.hivemind/session-tracker/{id}/session-continuity.json` (per-session, to be kept). No naming collision after deletion. | [VERIFIED: on-disk paths] — both files exist. The state/ one has a different schema from per-session one. | HIGH | After deleting state/session-continuity.json, the naming conflict with per-session files is resolved. The @file references in session-tracker code all point to .../session-tracker/{id}/ paths, not the state/ path. |

---

## 2. Cross-Reference with SPEC Requirements

### REQ-P41A-01: Delegations.json Field Inventory

Mapping of `Delegation` interface (src/coordination/delegation/types.ts:26-73) to session-tracker equivalents:

| Delegation Field | Type | Persisted? | Session-Tracker Equivalent | Gap? |
|---|---|---|---|---|
| `id` | `string` | YES | `ChildSessionRecord.sessionID` | No gap |
| `parentSessionId` | `string` | YES | `ChildSessionRecord.parentSessionID` | No gap |
| `childSessionId` | `string` | YES | `ChildSessionRecord.sessionID` (same as id) | No gap |
| `agent` | `string` | YES | `ChildSessionRecord.mainAgent.name` / `delegatedBy.agentName` | No gap |
| `prompt` | `string?` | NO (redacted) | `delegatedBy.description` (partial — truncated) | Gap: full prompt not tracked |
| `status` | `DelegationStatus` | YES | `ChildSessionRecord.status` but TYPE MISMATCH | Gap: type mapping needed |
| `result` | `string?` | NO (redacted) | `ChildSessionRecord.lastMessage` (for completed) | Gap: no explicit result field |
| `resultTruncated` | `boolean?` | NO (never persisted) | No equivalent | Gap (LOW risk) |
| `error` | `string?` | NO (redacted) | `ChildSessionRecord.lastMessage` (for error) | Gap: no explicit error field |
| `createdAt` | `number` | YES | `ChildSessionRecord.created` (ISO string) | Gap: format mismatch (ms epoch vs ISO 8601) |
| `completedAt` | `number?` | YES (1 record) | `ChildSessionRecord.updated` (ISO string, set on status change) | Gap: format mismatch + no explicit `completedAt` |
| `lastMessageCount` | `number` | YES (but always 0) | `ChildSessionRecord.turns.length` | No gap — can derive |
| `stablePollCount` | `number` | YES (but always 0) | No equivalent | Gap (LOW — polling metadata) |
| `nestingDepth` | `number` | YES | `ChildSessionRecord.delegationDepth` / `HierarchyManifestChild.delegationDepth` | No gap |
| `gracePeriodExpiresAt` | `number?` | YES (1 record) | No equivalent | Gap (LOW — cleanup scheduling) |
| `lastMessageCountChangeAt` | `number?` | YES (all records) | No equivalent | Gap (LOW — adaptive polling) |
| `executionMode` | `"sdk" \| "pty" \| "headless"` | YES | `ChildSessionRecord.delegatedBy.tool` (partial — "task" vs "delegate-task") | Gap: no explicit execution mode |
| `surface` | `DelegationSurface?` | YES (derived) | No equivalent | Gap (LOW — derived from executionMode) |
| `recoveryGuarantee` | `DelegationRecoveryGuarantee?` | YES (derived) | No equivalent | Gap (MEDIUM — affects resumption semantics) |
| `workingDirectory` | `string` | YES | No equivalent | Gap (LOW — always projectRoot in practice) |
| `ptySessionId` | `string?` | YES (always absent) | No equivalent | Gap (LOW — PTY not integrated with session-tracker) |
| `fallbackReason` | `string?` | NO (redacted) | No equivalent | Gap (LOW) |
| `queueKey` | `string` | YES | No equivalent | Gap (MEDIUM — needed for concurrency diagnostics) |
| `terminalKind` | `DelegationTerminalKind?` | YES (via normalization) | No equivalent | Gap (MEDIUM — important for status tool) |
| `terminationSignal` | `string?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `explicitCancellation` | `boolean?` | YES (always false) | No equivalent | Gap (LOW) |
| `redirectedFrom` | `string?` | NO (never persisted) | No equivalent | Gap (LOW — edge case) |
| `restartedFrom` | `string?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `resumedFrom` | `string?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `chainedFrom` | `string?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `executionState` | `DelegationExecutionState?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `firstActionAt` | `number?` | NO (never persisted) | ChildSessionRecord.created | No gap — approximate |
| `signalSource` | `DelegationSignalSource?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `actionCount` | `number?` | NO (never persisted) | `Turn[].tools.length` sum | Can derive |
| `messageCount` | `number?` | NO (never persisted) | `Turn[]` length | No gap — can derive |
| `toolCallCount` | `number?` | NO (never persisted) | `Turn[].tools.length` sum | No gap — can derive |
| `evidenceLevel` | `DelegationEvidenceLevel?` | NO (never persisted) | No equivalent | Gap (LOW) |
| `finalMessageExcerpt` | `string?` | NO (never persisted) | `ChildSessionRecord.lastMessage` (full message) | No gap — richer data |
| `v2` | `boolean?` | NO (never persisted) | No equivalent | Gap (LOW — internal routing flag) |

**Total gaps (unique delegation fields not in session-tracker):** 5 MEDIUM-risk, ~15 LOW-risk

### REQ-P41A-02: Session-Continuity.json Field Inventory

| Continuity Field | Type | Persisted? | Session-Tracker Equivalent | Gap? |
|---|---|---|---|---|
| `ContinuityStoreFile.version` | `number` | YES | `SessionContinuityIndex.version` (string) | No gap (both track version) |
| `ContinuityStoreFile.updatedAt` | `number` | YES | `SessionContinuityIndex.lastUpdated` (ISO string) | Gap: format mismatch |
| `ContinuityStoreFile.sessions` | `Record<string, SessionContinuityRecord>` | YES | `ProjectContinuityIndex.sessions` | Gap: different schema |
| `ContinuityStoreFile.governance` | `GovernancePersistenceState` | YES (empty) | No equivalent in session-tracker | Gap: DESIGN DECISION (see Open Question 2 in SPEC) |
| `SessionContinuityRecord.sessionID` | `string` | YES | `ProjectSessionEntry` key | No gap |
| `SessionContinuityRecord.promptParams` | `SessionPromptParams` | YES (empty `{}`) | No equivalent | Gap (LOW — were always empty) |
| `SessionContinuityRecord.toolProfile` | `SessionToolProfile?` | NO (not persisted) | No equivalent | Gap (LOW) |
| `SessionContinuityMetadata.status` | `TaskStatus` | YES | `ChildSessionRecord.status` / `ProjectSessionEntry.status` | Gap: type mismatch (TaskStatus vs string) |
| `SessionContinuityMetadata.description` | `string` | YES | `ChildSessionRecord.delegatedBy.description` | No gap |
| `SessionContinuityMetadata.title` | `string?` | NO | `SessionRecord.title` | No gap |
| `SessionContinuityMetadata.delegation` | `DelegationMeta \| null` | YES (always null) | `ChildSessionRecord.delegatedBy` + `mainAgent` | Gap: different schema (DelegationMeta vs DelegatedBy+MainAgent) |
| `SessionContinuityMetadata.category` | `string?` | NO | No equivalent | Gap (LOW — was always absent) |
| `SessionContinuityMetadata.constraints` | `string[]` | YES (always `[]`) | No equivalent | Gap (LOW) |
| `SessionContinuityMetadata.lifecycle` | `SessionLifecycleState?` | NO | `ChildSessionRecord.status` + `SessionRecord.status` | Gap: partial — lifecycle has `phase`, `launchedAt`, `completedAt`, `runMode`, etc. |
| `SessionContinuityMetadata.pendingNotifications` | `PendingNotification[]` | YES (2 records have data) | No equivalent in session-tracker schema | Gap: HIGH if notifications need preservation |
| `SessionContinuityMetadata.resultCapture` | `CapturedResult?` | NO | `ChildSessionRecord.lastMessage` | Gap (partial — session-tracker has less detail) |
| `SessionContinuityMetadata.compactionCheckpoint` | `CompactionCheckpointData?` | NO | No equivalent | Gap (MEDIUM — needed for compaction recovery) |
| `SessionContinuityMetadata.delegationPacket` | `DelegationPacket?` | NO | `ChildSessionRecord.delegatedBy` (partial) | Gap (LOW — packet has plan, artifacts, commits, parentChain) |
| `SessionContinuityMetadata.route` | `string?` | NO | No equivalent | Gap (LOW) |
| `SessionContinuityMetadata.lastToolActivityAt` | `number?` | NO | `SessionRecord.updated` (partial) | Gap (LOW) |
| `GovernancePersistenceState.rules` | `GovernanceRule[]` | YES (0 rules) | No equivalent | Gap: DESIGN DECISION |
| `GovernancePersistenceState.violations` | `GovernanceViolation[]` | YES (1 violation) | No equivalent | Gap: DESIGN DECISION |

**Total gaps (unique continuity fields not in session-tracker):** 1 HIGH (`pendingNotifications`), 2 MEDIUM (`compactionCheckpoint`, `lifecycle`), ~10 LOW

### REQ-P41A-03: Unique-Field Gap Report (Consolidated)

Ordered by risk (HIGH first):

| Gap Field | Source File | Risk | Proposed Session-Tracker Extension |
|---|---|---|---|
| `pendingNotifications` | session-continuity.json | HIGH | Add `PendingNotification[]` array to `ChildSessionRecord` or a new `notifications.json` per-session file |
| `compactionCheckpoint` (CheckpointData) | session-continuity.json | MEDIUM | Add optional `compactionCheckpoint` field to `ChildSessionRecord` |
| `lifecycle` (SessionLifecycleState) | session-continuity.json | MEDIUM | Add optional `lifecycle` field to `ChildSessionRecord` with `{ phase, launchedAt, completedAt, runMode }` |
| `governance.rules` + `governance.violations` | session-continuity.json | MEDIUM | Create `governance-state.json` under `.hivemind/state/` — separate from session-tracker (per SPEC Open Question #2) |
| `queueKey` | delegations.json | MEDIUM | Add optional `queueKey` field to `ChildSessionRecord.delegatedBy` |
| `terminalKind` | delegations.json | MEDIUM | Add optional `terminalKind` field to `ChildSessionRecord` |
| `recoveryGuarantee` | delegations.json | MEDIUM | Add optional `recoveryGuarantee` field to `ChildSessionRecord` |
| `executionMode` | delegations.json | MEDIUM | Add optional `executionMode` field to `ChildSessionRecord.delegatedBy` (or extend `delegatedBy.tool`) |
| `prompt` | delegations.json | LOW | Add optional `description` expansion (already partially tracked) |
| `result` / `error` | delegations.json | LOW | Already partially available via `lastMessage`; no extension needed |
| `resultTruncated` | delegations.json | LOW | No extension needed |
| `stablePollCount` | delegations.json | LOW | No extension needed (polling metadata, not useful after delegation completes) |
| `gracePeriodExpiresAt` | delegations.json | LOW | No extension needed |
| `lastMessageCountChangeAt` | delegations.json | LOW | No extension needed |
| `surface` | delegations.json | LOW | Derivable from `executionMode`; no extension needed |
| `workingDirectory` | delegations.json | LOW | Derivable from project root; no extension needed |
| `ptySessionId` | delegations.json | LOW | PTY uses `command-process` mode; no extension needed |
| `fallbackReason` | delegations.json | LOW | Redacted; no extension needed |
| `terminationSignal` | delegations.json | LOW | No extension needed |
| `explicitCancellation` | delegations.json | LOW | No extension needed |
| `redirectedFrom` / `restartedFrom` / `resumedFrom` / `chainedFrom` | delegations.json | LOW | No extension needed (never persisted) |
| `executionState` / `signalSource` / `evidenceLevel` / `v2` | delegations.json | LOW | No extension needed (never persisted) |
| `promptParams` | session-continuity.json | LOW | Was always `{}`; no extension needed |
| `toolProfile` | session-continuity.json | LOW | Was never persisted; no extension needed |
| `constraints` | session-continuity.json | LOW | Was always `[]`; no extension needed |
| `category` | session-continuity.json | LOW | Was never present; no extension needed |
| `route` | session-continuity.json | LOW | Was never present; no extension needed |
| `lastToolActivityAt` | session-continuity.json | LOW | Was never present; no extension needed |

---

## 3. Actor/Consumer Map (REQ-P41A-04)

### `delegations.json` consumers (`.hivemind/state/delegations.json`)

| File | Line(s) | Role | Type | Action on Delete |
|---|---|---|---|---|
| `src/task-management/continuity/delegation-persistence.ts` | 55 | PATH RESOLVER | WRITE → WRITER | `readPersistedDelegations()` returns `[]` (A20); `persistDelegations()` writes to path that no longer matters |
| `src/task-management/continuity/delegation-persistence.ts` | 58-134 | WRITER | WRITE | `persistDelegations()` writes delegations to file. After migration, writes to session-tracker. |
| `src/task-management/continuity/delegation-persistence.ts` | 224-250 | READER | READ | Returns `[]` if file missing (graceful) |
| `src/coordination/delegation/state-machine.ts` | 218, 394 | CALLER of WRITER | WRITE | Calls `persistDelegations()` — write goes to nonexistent path, creates new file with no data (empty array) |
| `src/coordination/delegation/retry-handler.ts` | 4, 23 | CALLER of WRITER | WRITE | Same as above |
| `src/coordination/delegation/manager-runtime.ts` | 318 | CALLER of READER | READ | No persisted delegations on recovery — `recoverPending()` finds 0 delegations |
| `src/tools/delegation/delegation-status.ts` | 5, 429 | CALLER of READER | READ | Falls back to session-tracker data only (line 468: `getSessionTrackerDelegation`) |
| `src/tools/delegation/readers/legacy-reader.ts` | 2, 41 | LEGACY READER | READ | Returns `[]` silently (try/catch at line 23, 37) |
| `src/tools/hivemind/hivemind-session-view.ts` | 68-78 | DIRECT READER | READ | Returns empty `{ total: 0, active: 0, entries: [] }` (try/catch at line 78) |
| `src/tools/session/session-journal-export.ts` | 5, 84 | CALLER of READER | READ | No delegations in journal export — `readPersistedDelegations()` returns `[]` |
| `src/features/bootstrap/control-plane/gate-decision.ts` | 120 | PATH VALIDATOR | VALIDATE | Path check becomes dead code for this exact path; `.hivemind/state/` prefix check still catches directory writes |
| `src/shared/security/path-scope.ts` | 39 | JSDOC EXAMPLE | DOC | Just an example — no runtime impact |
| `src/sidecar/readonly-state.ts` | 83 | DOC EXAMPLE | DOC | Example in JSDoc — comment-only |

### `session-continuity.json` consumers (`.hivemind/state/session-continuity.json`)

| File | Line(s) | Role | Type | Action on Delete |
|---|---|---|---|---|
| `src/task-management/continuity/index.ts` | 39-52 | PATH RESOLVER | READ | `resolveContinuityFilePath()` resolves path. `loadStoreFromDisk()` handles missing file gracefully (returns `emptyStore()`) |
| `src/task-management/continuity/index.ts` | 259-309 | LOADER | READ | Returns `emptyStore()` with 0 sessions |
| `src/task-management/continuity/index.ts` | 324-340 | WRITER | WRITE | `persistStore()` writes to file. After migration, writes to session-tracker. |
| `src/task-management/continuity/index.ts` | 346-348 | `listSessionContinuity()` | READ | Returns `[]` (empty sessions) |
| `src/task-management/continuity/index.ts` | 350-353 | `getSessionContinuity()` | READ | Returns `undefined` for any session |
| `src/task-management/continuity/index.ts` | 367-378 | `recordSessionContinuity()` | WRITE | Creates new session entry, persistStore writes empty data |
| `src/task-management/continuity/index.ts` | 381-422 | `patchSessionContinuity()` | WRITE | Patches in-memory, persistStore writes — but file has no pre-existing sessions |
| `src/task-management/continuity/index.ts` | 446-454 | `deleteSessionContinuity()` | WRITE | No-op (session not found) |
| `src/task-management/continuity/index.ts` | 460-462 | `getGovernancePersistenceState()` | READ | Returns default empty governance |
| `src/task-management/continuity/index.ts` | 464-474 | `recordGovernancePersistenceState()` | WRITE | Writes governance to in-memory store, persistStore to file |
| `src/plugin.ts` | 79, 232-237 | CALLER | READ/WRITE | NO critical: notification persistence AND replay |
| `src/plugin.ts` | 630-645 | CALLER (replay) | READ/WRITE | NO critical: notification replay at startup |
| `src/task-management/lifecycle/index.ts` | 8, 108-217 | CALLER | READ/WRITE | NO critical (but graceful): lifecycle phase transitions rely on continuity state |
| `src/hooks/lifecycle/session-hooks.ts` | 12, 151, 308 | HOOK READER | READ | Reads continuity for auto-loop decisions, compaction context |
| `src/hooks/guards/tool-guard-hooks.ts` | 11, 193 | HOOK READER | READ | Reads continuity for metadata injection into tool output |
| `src/coordination/completion/notification-handler.ts` | 13, 219-229 | CALLER | READ/WRITE | NO critical: records delegation results as pending notifications |
| `src/features/governance-engine/evaluator.ts` | 2, 97-99 | CALLER | READ/WRITE | Governance state writes — currently test-only data |
| `src/tools/session/session-journal-export.ts` | 4, 80 | CALLER of READER | READ | Continuity list returns `[]` — journal export loses session data |
| `src/features/bootstrap/control-plane/gate-decision.ts` | 119 | PATH VALIDATOR | VALIDATE | Same as delegations — becomes dead code for exact path |
| `src/shared/security/path-scope.ts` | 27-28 | JSDOC EXAMPLE | DOC | Example only |

### TEST-FILE consumers (107 references total)

Both files are heavily referenced in test files. Key test files:

| Test File | Current Role | Impact |
|---|---|---|
| `tests/lib/continuity.test.ts` | Validates CRUD on state/session-continuity.json | Tests must be updated to use session-tracker |
| `tests/lib/delegation-persistence.test.ts` | Validates write/read/quarantine of delegations.json | Tests must be updated |
| `tests/lib/delegation-manager.test.ts` | Validates delegation persistence round-trip | Tests must be updated |
| `tests/lib/delegation/readers/legacy-reader.test.ts` | Validates delegations.json parsing | Legacy reader likely deprecated |
| `tests/tools/session-journal-export.test.ts` | Writes both files to temp dir, validates export | Export test must use session-tracker |
| `tests/lib/control-plane/gatekeeper.test.ts` | Validates path guards for both files | Path guard behavior changes |
| 15+ session-tracker test files | Reference per-session `session-continuity.json` (NOT state/ version) | No impact — these reference the per-session file, not the deleted state/ file |

---

## 4. Breakage Impact Analysis (REQ-P41A-05)

### Category: SILENT (most consumers)

| Consumer | Error Mode | Alternative Source | Migration Effort |
|---|---|---|---|
| `readPersistedDelegations()` | Returns `[]` (graceful) | Session-tracker: `getSessionTrackerDelegation()` / `getSessionTrackerChildren()` | SMALL — read from session-tracker instead |
| `LegacyPersistenceStatusReader` | Returns `[]` (try/catch) | `SessionTrackerStatusReader` (already exists) | SMALL — remove legacy reader, existing primary reader takes over |
| `hivemind-session-view` | Returns empty delegations w/ total:0, active:0 | Should read from session-tracker's delegation data | MEDIUM — modify `readDelegationsForSession()` to use hierarchy-manifest or child files |
| `session-journal-export` | Continuity = `[]`, Delegations = `[]` | Should read from session-tracker | MEDIUM — build execution lineage from session-tracker instead |
| `loadStoreFromDisk()` | Returns `emptyStore()` (0 sessions) | Session-tracker has per-session data | LARGE — the entire `SessionContinuityRecord` API needs to be backed by session-tracker |
| `listSessionContinuity()` | Returns `[]` | Must iterate session-tracker | LARGE |
| `getSessionContinuity(id)` | Returns `undefined` | Must look up from session-tracker | LARGE |
| `gate-decision.ts` | `isStateFilePath()` no longer matches these exact paths | `.hivemind/state/` prefix still blocks direct writes | SMALL — remove dead path checks |
| `path-scope.ts` | No runtime impact | N/A | SMALL — update JSDoc examples |

### Category: DEGRADED (functional loss but no crash)

| Consumer | Error Mode | Alternative Source | Migration Effort |
|---|---|---|---|
| `plugin.ts` notification replay | `listSessionContinuity()` returns `[]` — no notifications replayed | Session-tracker doesn't store pending notifications | LARGE — add notification storage to session-tracker or create standalone notification store |
| `lifecycle/index.ts` | `getSessionContinuity(id)` returns `undefined` — no lifecycle state | `ChildSessionRecord.status` + `updated` provides partial info | MEDIUM — migrate lifecycle readers to session-tracker |
| `notification-handler.ts` | `getSessionContinuity` returns `undefined` for parent — can't enqueue notification | Must write to session-tracker or new notification store | MEDIUM |
| `governance-engine/evaluator.ts` | `getGovernancePersistenceState()` returns empty defaults | Governance should get its own store (per SPEC Open Question #2) | SMALL — governance is test-only today |
| `DelegationStateMachine.persistDelegations()` | Writes to `delegations.json` — creates empty file if missing | Must write delegation metadata to session-tracker instead | MEDIUM |
| `manager-runtime.ts recoverPending()` | No persisted delegations to recover | In-memory state from active sessions only | SMALL — test-only data today |

### Category: BLOCKING (none found)

No consumer crashes with a hard error when either file is missing. All readers have graceful fallbacks (try/catch, exists check, or empty defaults). The `quarantineCorruptDelegationsFile()` and `quarantineCorruptFile` functions are only triggered on corrupt (not missing) files.

**However:** The `persistDelegations()` and continuity `persistStore()` WRITE functions continue to write to the old file paths after deletion. This means:
1. `state-machine.ts` writes to `delegations.json` (recreates it with empty/partial data)
2. `plugin.ts` writes to `session-continuity.json` (recreates it with new data)
3. `lifecycle/index.ts` writes to `session-continuity.json`
4. `notification-handler.ts` writes to `session-continuity.json`

**These re-created files would need to be re-deleted or the code must be modified to stop writing to them.** This is the primary risk — not deletion itself, but the code continuing to recreate the files after deletion.

### Category: TEST-ONLY

| Test File | Tests | Action Required |
|---|---|---|
| `tests/lib/continuity.test.ts` | Validates continuity.json CRUD | Rewrite to test session-tracker persistence |
| `tests/lib/delegation-persistence.test.ts` | Validates delegations.json write/read | Rewrite to test session-tracker delegation storage |
| `tests/lib/delegation-manager.test.ts` | Validates delegation lifecycle with persistence | Update persistence assertions |
| `tests/lib/delegation/readers/legacy-reader.test.ts` | Validates legacy delegations.json parsing | Remove (legacy reader deprecated) |
| `tests/tools/session-journal-export.test.ts` | Writes both files to temp dir, validates export | Update to use session-tracker fixtures |
| `tests/lib/state-root-migration.test.ts` | Validates paths contain both files | Update path assertions |
| `tests/lib/control-plane/gatekeeper.test.ts` | Validates path guards | Update to reflect removed paths |
| `tests/lib/agent-work-contracts/store.test.ts` | Asserts both files don't exist after agent work creation | Update assertions |
| `tests/tools/hivemind-pressure.test.ts` | Asserts both files don't exist | Update assertions |
| `tests/lib/trajectory/ledger.test.ts` | Asserts both files don't exist in certain scenarios | Update assertions |

---

## 5. Uncertainty Flags

These items need user confirmation before the planner (P41-B) proceeds:

| # | Uncertainty | Flagged By | Recommended Action for P41-B |
|---|---|---|---|
| U1 | **Governance state destination** — `governance.rules` and `governance.violations` currently live in `state/session-continuity.json`. Should they merge into session-tracker or stay as a separate `.hivemind/state/governance.json` file? | SPEC Open Question #2 | Create separate `governance-state.json` under `.hivemind/state/` — governance is logically distinct from session tracking and has no production data today. |
| U2 | **PendingNotifications storage** — These are the HIGHEST-risk data in the merge. If real notifications exist (none do today), loss would mean notification "silent drop" scenario. Is a new `notifications.json` per-session file needed, or should notifications be discarded since no real data exists? | SPEC Open Question #1 & Assumption A2 | Since zero production notification data exists, add `pendingNotifications[]` to `ChildSessionRecord` as optional field for future use, but do NOT backfill from deleted file. |
| U3 | **Disposal plan for 35 test-artifact delegation records** — These use fake session IDs (`child-*`, `parent-*`). Should they be silently dropped, or is a cleanup script needed? | SPEC Open Question #3 | Silently drop them during merge — no session-tracker entries match these IDs, and the IDs cannot be mapped to any real session. |
| U4 | **`persistDelegations()` writer code still exists** — After migrating to session-tracker, should the old `persistDelegations()` call in `state-machine.ts` be redirected to session-tracker, or should `delegations.json` become a transient/volatile file that's allowed to reappear? | Breakage Analysis (Degraded category) | Redirect `persistDelegations()` to write delegation metadata to session-tracker's hierarchy-manifest or child files. The old file write becomes a dead-code path after migration. |
| U5 | **`SessionContinuityRecord` API has 10+ export functions** — `getSessionContinuity`, `listSessionContinuity`, `patchSessionContinuity`, etc. Should these be DEPRECATED (keeping them but reading from session-tracker), or REMOVED? | Breakage Analysis (Large effort for each) | Keep the function signatures but change their backing store to session-tracker. This minimizes change impact across 39 caller sites in 10+ files. |
| U6 | **`recoveryGuarantee` and `terminalKind` mapping** — session-tracker `status` uses "active/completed/error" while `DelegationStatus` uses "dispatched/running/completed/error/timeout". Should a mapping layer normalize these, or should session-tracker adopt the `DelegationStatus` values? | Assumption A24 | Normalize at the read boundary: session-tracker stores its own status values, and the `delegation-status` tool maps them on read (as it already does at line 218-219 of delegation-status.ts). |

---

## 6. Summary of Key Findings

### What We Know With HIGH Confidence

1. Both files contain ZERO production data — 35 delegation records and 18 continuity records, all with test session IDs
2. Zero session ID overlap between either standalone file and the 121 live session-tracker sessions
3. Every reader of both files handles missing files gracefully (returns `[]`, empty store, or `undefined`)
4. No BLOCKING breakage would occur from deletion — readers fall back gracefully
5. The session-tracker already captures ~60% of the delegation data fields and ~40% of the continuity data fields
6. Two filenamed `session-continuity.json` exist → no naming collision after state/ deletion

### What We Know With MEDIUM Confidence

7. `pendingNotifications` is the HIGHEST-risk data — but only 2 test records have any data, and those are fake sessions
8. `governance` state needs a design decision — separate file or merge into session-tracker
9. The `recoveryGuarantee` and `terminalKind` fields have no session-tracker equivalent and are used by the delegation-status tool
10. `queueKey` is the most useful MEDIUM-risk field not in session-tracker — used for concurrency diagnostics

### What We Need to Decide

11. Writer code (`persistDelegations()`, `recordSessionContinuity()`, etc.) continues to recreate the old files after deletion unless redirected
12. The 10+ `SessionContinuityRecord` export functions have 39+ call sites across 10+ files — keeping signatures but changing backing store is the minimal-change approach
13. Type mismatch between session-tracker `status` (string) and `DelegationStatus` (5-value enum) needs a mapping layer
