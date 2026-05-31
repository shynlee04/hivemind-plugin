---
phase: P41-B
type: spec
upstream: P41-A-SUMMARY.md
downstream: P41-C
depends_on: []
created: 2026-05-31
status: draft
authority: spec-driven
---

# Phase P41-B: Add 8 Gap Fields to Session-Tracker Types + Redirect Writers

**One-liner:** Extend `ChildSessionRecord` with 1 HIGH + 6 MEDIUM optional gap fields, create standalone governance state file, redirect 5 writer paths from legacy files to session-tracker, while keeping all readers unchanged (P41-C).

**Ambiguity Score:** LOW (0 open questions beyond P41-A decisions)

---

## Summary

P41-B is the first implementation phase of the P41 state cluster redesign. It handles the write side ONLY — extending the session-tracker schema so it can hold all data currently written to `delegations.json` and `session-continuity.json`, then redirecting the 5 writer actors to write through session-tracker instead.

**Key constraint:** Readers are NOT modified in this phase (P41-C). Old files are NOT deleted (P41-D). Writers must continue to work through their new paths, and all old file paths will remain valid until P41-D.

---

## Requirements

### REQ-P41B-01: Add HIGH gap field `pendingNotifications` to `ChildSessionRecord`

**Falsifiable criterion:** The `ChildSessionRecord` interface in `src/features/session-tracker/types.ts` has an optional `pendingNotifications` field typed as `PendingNotification[]` (imported from `shared/types.ts`).

**Acceptance criteria:**
1. Field is optional (`pendingNotifications?: PendingNotification[]`)
2. Type import path resolves: `import type { PendingNotification } from "../../shared/types.js"` (or equivalent relative path)
3. Field is NOT required when constructing a `ChildSessionRecord` — existing code that creates child records continues to compile without change
4. All existing typecheck runs pass (`npm run typecheck`)

**Boundaries:**
- Do NOT change `PendingNotification` type itself — it lives in `src/shared/types.ts` and is stable
- Do NOT add default value logic in types (optional = `undefined` at runtime)
- Do NOT add validation logic to `isValidSessionID`, `isValidHookPayload`, or any type guard

**Inspiration:** `PendingNotification[]` is carried by `SessionContinuityMetadata.pendingNotifications` (line 312 of types.ts). 7 of 18 test continuity records have notification data (all test `fake-ses-*` child IDs). Zero production notification data exists.

---

### REQ-P41B-02: Add 6 MEDIUM gap fields to `ChildSessionRecord`

**Falsifiable criterion:** The `ChildSessionRecord` interface has 6 new optional fields with the correct types.

**Acceptance criteria:**

| # | Field | Type | Import Source | Notes |
|---|-------|------|---------------|-------|
| 1 | `queueKey` | `string` | inline primitive | From `Delegation.queueKey` |
| 2 | `terminalKind` | `DelegationTerminalKind` | `../../coordination/delegation/types.js` | From `Delegation.terminalKind` |
| 3 | `recoveryGuarantee` | `DelegationRecoveryGuarantee` | `../../coordination/delegation/types.js` | From `Delegation.recoveryGuarantee` |
| 4 | `executionMode` | `"sdk" \| "pty" \| "headless"` | inline union | From `Delegation.executionMode` |
| 5 | `compactionCheckpoint` | `CompactionCheckpointData` | `../../shared/types.js` | From continuity store — never populated on disk |
| 6 | `lifecycle` | `SessionLifecycleState` | `../../shared/types.js` | From continuity store — never populated on disk |

All 6 fields are:
- Marked optional with `?`
- Do NOT break existing `ChildSessionRecord` construction
- All existing typecheck runs pass

**Boundaries:**
- Do NOT change `DelegationTerminalKind`, `DelegationRecoveryGuarantee`, `CompactionCheckpointData`, or `SessionLifecycleState` types themselves
- Do NOT add runtime defaults for these fields in the type definition (optional = `undefined`)
- Do NOT add serialization/deserialization logic — the fields are plain optional properties that `JSON.parse`/`JSON.stringify` handle natively

---

### REQ-P41B-03: Create standalone `.hivemind/state/governance-state.json` file

**Falsifiable criterion:** A new governance state persistence module exists that reads/writes `.hivemind/state/governance-state.json` independently of the continuity store and session-tracker.

**Acceptance criteria:**

1. New file created: `src/features/governance/persistence.ts` (or equivalent path under `src/features/session-tracker/persistence/`)
2. Module exports:
   - `getGovernanceStatePath(): string` — returns the absolute path to `.hivemind/state/governance-state.json`
   - `readGovernanceState(): GovernancePersistenceState` — reads from disk, returns `emptyGovernanceState()` on missing file
   - `writeGovernanceState(state: GovernancePersistenceState): void` — atomic write to `.hivemind/state/governance-state.json`
   - `emptyGovernanceState(): GovernancePersistenceState` — returns `{ rules: [], violations: [], updatedAt: Date.now() }`
3. The file path resolves to: `<projectRoot>/.hivemind/state/governance-state.json`
4. No import dependency on session-tracker or continuity types (only imports from `src/shared/types.ts`)
5. Uses atomic write pattern (write to temp → rename) matching the existing convention in `continuity/index.ts`
6. All existing tests pass

**Boundaries:**
- This is a NEW file, not a modification of session-tracker types
- Governance is a cross-cutting concern (applies to all sessions), NOT per-session data
- Do NOT store governance data inside `ChildSessionRecord`
- Do NOT add governance data to session-tracker indices

**Migration plan for `recordGovernancePersistenceState()` (continuity/index.ts:464-474):**
- The function currently writes governance data into `session-continuity.json`'s top-level `governance` field
- After P41-B, the governance engine's evaluator (`governance-engine/evaluator.ts:97-99`) calls `writeGovernanceState()` instead
- The old `recordGovernancePersistenceState()` in continuity is kept as a deprecated no-op that logs a warning (aligned with P41-A U4 decision pattern)

---

### REQ-P41B-04: Redirect `persistDelegations()` from `delegations.json` to `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()`

**Falsifiable criterion:** When `persistDelegations()` is called with a new delegation record, the data is written to `.hivemind/session-tracker/{parentID}/{childID}.json` via `ChildWriter.createChildFile()` and the child is registered in the hierarchy manifest.

**Acceptance criteria:**

1. **Primary redirect:** `persistDelegations()` (in `delegation-persistence.ts:58`) is modified to call `ChildWriter.createChildFile()` for each delegation record that has a valid `childSessionId` and `parentSessionId`
2. **Secondary redirect:** After creating the child file, call `HierarchyManifestWriter.addChild()` to register the child in the hierarchy manifest
3. **Field mapping on write:**

| `Delegation` field | `ChildSessionRecord` field | Conversion |
|-------------------|---------------------------|------------|
| `id` | `sessionID` | direct |
| `parentSessionId` | `parentSessionID` | direct |
| (derived from depth context) | `delegationDepth` | default `1` |
| `agent` + `executionMode` | `delegatedBy.agentName` | direct |
| (from dispatch context) | `delegatedBy.model` | `""` if unavailable |
| `"task"` | `delegatedBy.tool` | always `"task"` |
| `prompt` | `delegatedBy.description` | direct |
| (from type mapping) | `delegatedBy.subagentType` | `""` if unavailable |
| `createdAt` (Unix ms) | `created` | `new Date(createdAt).toISOString()` |
| `completedAt` (Unix ms) | `updated` | `new Date(completedAt).toISOString()` or `new Date().toISOString()` |
| (status mapping) | `status` | see REQ-P41B-04-AC4 |
| `agent` | `mainAgent.name` | direct |
| (from dispatch context) | `mainAgent.model` | `""` if unavailable |
| - | `turns` | `[]` (new child, no turns yet) |
| - | `children` | `[]` (new child, no children yet) |
| `queueKey` | `queueKey` | direct |
| `terminalKind` | `terminalKind` | direct |
| `recoveryGuarantee` | `recoveryGuarantee` | direct |
| `executionMode` | `executionMode` | direct |

4. **Status mapping on write:** `Delegation.status` is mapped to `ChildSessionRecord.status`:
   - `"dispatched"` → `"active"`
   - `"running"` → `"active"`
   - `"completed"` → `"completed"`
   - `"error"` → `"error"`
   - `"timeout"` → `"error"`
5. **Existing path preserved:** `persistDelegations()` ALSO continues to write to the old `delegations.json` path (dual-write) — readers that haven't migrated yet in P41-C will still find their data
6. **No data loss on missing fields:** If `childSessionId` or `parentSessionId` is missing/invalid, skip that delegation record and log a warning — do NOT throw
7. **All existing tests pass** — test writers still write to delegations.json through the dual-write path

**Boundaries:**
- Do NOT remove the old `persistDelegations()` write to `delegations.json` — this is a dual-write phase
- Do NOT touch `readPersistedDelegations()` — that's a reader, P41-C
- Do NOT touch delegation-status.ts — that's a reader, P41-C
- The status mapping on write (AC4) means session-tracker stores its own status values; the reverse mapping on read already exists in `delegation-status.ts:218-219`

**Note on `Delegation` vs `ChildSessionRecord` shape:** The `Delegation` interface has ~25 fields, while `ChildSessionRecord` has ~10. Many fields (`result`, `error`, `fallbackReason`, `ptySessionId`, `v2`, termination fields, etc.) are not mapped to `ChildSessionRecord` because they are either transient runtime state, redacted before persist, or have no session-tracker equivalent. Only the 8 gap fields plus the existing mapped fields are written.

---

### REQ-P41B-05: Redirect continuity store writes (`persistStore()` / `recordSessionContinuity()` / `patchSessionContinuity()`) to session-tracker

**Falsifiable criterion:** When continuity store functions are called, the data they would have written to `session-continuity.json` is also written to session-tracker `ChildSessionRecord` files.

**Acceptance criteria:**

1. **`recordSessionContinuity()` redirect:** When a `SessionContinuityRecord` is recorded for a session that has a valid child ID (starts with `ses_`), the relevant fields are written to the corresponding `ChildSessionRecord` file via `ChildWriter`:
   - `lifecycle` → `ChildSessionRecord.lifecycle`
   - `pendingNotifications` → `ChildSessionRecord.pendingNotifications`
   - `compactionCheckpoint` → `ChildSessionRecord.compactionCheckpoint`
   - Timestamp → `ChildSessionRecord.updated`
2. **`patchSessionContinuity()` redirect:** When patching `lifecycle` or `pendingNotifications`, also patch the `ChildSessionRecord` file
3. **Dual-write:** Both functions continue to write to the old `session-continuity.json` path — old readers continue to function
4. **Graceful skip:** If the session ID does not correspond to any existing `ChildSessionRecord` file on disk, log a warning and skip the session-tracker write (do NOT create orphan files)
5. **All existing tests pass**

**Boundaries:**
- Do NOT remove the old `persistStore()` path — dual-write only
- Do NOT modify `getSessionContinuity()` or `listSessionContinuity()` — readers, P41-C
- The `notification-handler.ts` and `plugin.ts` notification persistence paths (which call `patchSessionContinuity()` with `pendingNotifications`) are automatically redirected via this requirement
- The `lifecycle/index.ts` lifecycle phase transition writes (which call `patchSessionContinuity()`) are automatically redirected via this requirement

---

### REQ-P41B-06: All existing tests pass, typecheck clean

**Falsifiable criterion:** `npm run typecheck` completes with zero errors and `npm run test` completes with zero failures.

**Acceptance criteria:**
1. `npm run typecheck` exits with code 0
2. `npm run test` exits with code 0
3. No new `any` types introduced
4. No new lint warnings in modified files

**Boundaries:**
- This requirement gates the entire phase — implementations that break the typecheck or test suite are unacceptable
- The dual-write strategy ensures tests continue to pass because old file paths remain valid
- New tests for the redirect behavior are RECOMMENDED but not required for this phase (test coverage of the redirect is a quality concern, not a spec requirement)

---

### REQ-P41B-07: All existing writers still functional through new paths

**Falsifiable criterion:** Every writer actor identified in P41-A (Section 3) produces equivalent output through the session-tracker path as it did through the legacy path.

**Acceptance criteria:**

**Writer smoke tests:** Each of the following actors produces the expected output in the session-tracker directory:

| Actor | File:Line | Verifiable Output |
|-------|-----------|-------------------|
| `DelegationStateMachine` | `state-machine.ts:218,394` | Child `.json` file exists under `.hivemind/session-tracker/{parentID}/` |
| `notification-handler.ts` | `notification-handler.ts:219-229` | `pendingNotifications` field populated in child record |
| `plugin.ts` (notification persistence) | `plugin.ts:232-237` | `pendingNotifications` field populated in child record |
| `lifecycle/index.ts` | `lifecycle/index.ts:108-217` | `lifecycle` field populated in child record |
| `governance-engine/evaluator.ts` | `evaluator.ts:97-99` | `.hivemind/state/governance-state.json` file exists with correct shape |

**Verification method:** For each writer actor:
1. Run a test that triggers the writer (existing test suite)
2. Verify the session-tracker file contains the expected data
3. Verify the old legacy file STILL contains the expected data (dual-write)
4. Verify the content is semantically equivalent (same data, potentially different schema)

**Boundaries:**
- Do NOT verify that readers can consume the new data (P41-C)
- Do NOT delete old files (P41-D)
- Do NOT run integration tests that assume old-file deletion (those are P41-D or later)
- Performance regression is acceptable within reason (< 2x write latency) — dual-write is inherently slower

---

## Files Modified

| File | Change | Risk |
|------|--------|------|
| `src/features/session-tracker/types.ts` | Add 7 optional fields to `ChildSessionRecord` | LOW — pure type addition, no runtime impact |
| `src/features/governance/persistence.ts` (NEW) | Create standalone governance persistence module | LOW — new file, no existing consumers affected |
| `src/task-management/continuity/delegation-persistence.ts` | Add dual-write to `persistDelegations()` → `ChildWriter.createChildFile()` | MEDIUM — complex field mapping, 35 test records to verify |
| `src/task-management/continuity/index.ts` | Add dual-write to `persistStore()`/`recordSessionContinuity()`/`patchSessionContinuity()` → session-tracker | MEDIUM — complex field mapping, 18 test continuity records |
| `src/task-management/continuity/index.ts` | Deprecate `recordGovernancePersistenceState()` → no-op with warning | LOW — governance is a separate file now |
| `src/features/governance/governance-engine/evaluator.ts` | Redirect to `writeGovernanceState()` | LOW — single function call change |

---

## File Structure Changes

```
src/
├── features/
│   ├── governance/
│   │   └── persistence.ts           # NEW: standalone governance state I/O
│   └── session-tracker/
│       └── types.ts                  # MODIFIED: 7 new optional fields
└── task-management/
    └── continuity/
        ├── delegation-persistence.ts # MODIFIED: dual-write to session-tracker
        └── index.ts                  # MODIFIED: dual-write + deprecate gov write
```

---

## Dependencies

- **No external packages.** All types and utilities already exist in the codebase.
- **Depends on:** P41-A investigation (complete — gap fields are identified, field mapping is defined)
- **Unlocks:** P41-C (reader migration — all fields are available in session-tracker for readers)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dual-write doubles write latency | MEDIUM | LOW | Acceptable in dev; monitor in production |
| Field mapping misses an edge case (e.g., legacy status value) | LOW | MEDIUM | Status mapping table verified against P41-A findings |
| Child file doesn't exist when continuity tries to patch it | LOW | LOW | Graceful skip with warning log |
| Governance state file is written to wrong path | LOW | HIGH | `getGovernanceStatePath()` resolves through existing `getCanonicalStateDir()` |
| Typecheck fails due to missing imports | LOW | HIGH | Run `npm run typecheck` as gate |

---

## Verification Protocol

```
Phase gate: npm run typecheck && npm run test  # Both must pass

Per-requirement verification:
  REQ-P41B-01: grep -n "pendingNotifications" src/features/session-tracker/types.ts
  REQ-P41B-02: grep -nE "queueKey|terminalKind|recoveryGuarantee|executionMode|compactionCheckpoint|lifecycle" src/features/session-tracker/types.ts
  REQ-P41B-03: test -f src/features/governance/persistence.ts && npm run typecheck
  REQ-P41B-04: run tests that trigger persistDelegations() — verify both delegations.json AND child .json
  REQ-P41B-05: run tests that trigger recordSessionContinuity() — verify both session-continuity.json AND child .json
  REQ-P41B-06: npm run typecheck && npm run test
  REQ-P41B-07: run test suite — verify no test failures or regressions
```

---

## Assumptions Log

| # | Assumption | Section | Evidence | Risk if Wrong |
|---|-----------|---------|----------|---------------|
| A1 | Zero production data exists in delegations.json and session-continuity.json | All | P41-A confirmed 126 live sessions with zero overlap | Accidental production data loss in P41-D |
| A2 | `executionMode` and `recoveryGuarantee` from `Delegation` are semantically correct for `ChildSessionRecord` | REQ-P41B-02 | They are delegation-level properties that apply to the child session | Wrong values stored in session-tracker |
| A3 | HierarchyManifestWriter is available and injectable into persistDelegations | REQ-P41B-04 | Existing code patterns show it injected via deps | May need to find or create instance in the caller chain |

---

## Open Questions

**None.** All decisions were resolved in P41-A (see P41-A-SUMMARY.md Section 7: Risks Requiring User Decisions — U1 through U6 have explicit recommendations).

---

## State of the Art

| Old Approach | New Approach | Phase |
|-------------|-------------|-------|
| `Delegation.queueKey` → delegations.json only | `Delegation.queueKey` → ChildSessionRecord.queueKey + delegations.json | P41-B |
| `Delegation.terminalKind` → delegations.json only | `Delegation.terminalKind` → ChildSessionRecord.terminalKind + delegations.json | P41-B |
| `SessionLifecycleState` → session-continuity.json only | `SessionLifecycleState` → ChildSessionRecord.lifecycle + session-continuity.json | P41-B |
| `PendingNotification[]` → session-continuity.json only | `PendingNotification[]` → ChildSessionRecord.pendingNotifications + session-continuity.json | P41-B |
| `.hivemind/state/session-continuity.json` holds governance data | `.hivemind/state/governance-state.json` holds governance data | P41-B |
| `recordGovernancePersistenceState()` writes to continuity store | `recordGovernancePersistenceState()` is a deprecated no-op; governance engine calls `writeGovernanceState()` | P41-B |

---

## Security Domain

**Applicable ASVS categories:** None directly. This phase adds data fields and redirects 
writers but does not introduce new authentication, session management, access control, 
or input validation surfaces. The governance state file is local filesystem-only (no network exposure).

**Threat consideration:** Dual-write to session-tracker files uses the same `atomicWriteJson()` 
pattern as existing code — no new attack surface.
