---
phase: P41-B
plan: 01
subsystem: state-cluster-redesign
tags: [session-tracker, governance, delegation, continuity, dual-write]
requires: [P41-A]
provides: [P41-C-prerequisite]
affects: [session-tracker/types, governance/persistence, continuity/delegation-persistence, continuity/index, governance-engine/evaluator]
tech-stack:
  added: []
  patterns: [fire-and-forget dual-write, atomic-rename, governance-state-separation]
metrics:
  duration: 25m
  completed: 2026-05-31
  commits: 6
  tasks: 5
  files-modified: 6
  typecheck: pass (0 errors)
  tests: 3012 pass, 2 skip (0 failures)
---

# Phase P41-B Plan 01: Schema changes + writer redirect — 5 tasks, dual-write strategy Summary

Add 7 gap fields to `ChildSessionRecord`, create standalone `governance-state.json` persistence module, redirect governance evaluator writes, and add fire-and-forget dual-write to `persistDelegations()`, `recordSessionContinuity()`, and `patchSessionContinuity()` for session-tracker.

## Key Decisions Made

1. **Fire-and-forget with `.catch()`**: Each dual-write `void` call includes `.catch()` to prevent unhandled Promise rejections when test directories don't exist.
2. **Governance evaluator reads from governance-state.json**: Changed both read (`readGovernanceState()`) and write (`writeGovernanceState()`) to the new standalone file instead of the continuity store. This is one plan ahead of schedule (SPEC said P41-C for reader migration), but necessary to prevent in-memory cache accumulation across test runs.
3. **Synchronous functions remain synchronous**: Both `patchSessionContinuity()` and `persistDelegations()` stay synchronous — async dual-write is wrapped in IIAFE or `.catch()` chains.
4. **`recordGovernancePersistenceState()` deprecated as no-op**: Old path emits a console warning, returns empty governance state, and has commented-out old code for reference.

## Tasks Executed

### Task 1: Add 7 optional gap fields to ChildSessionRecord

**Commit:** `5390eaec`

Added 7 optional fields to `ChildSessionRecord` in `src/features/session-tracker/types.ts`:
- `pendingNotifications?: PendingNotification[]`
- `queueKey?: string`
- `terminalKind?: DelegationTerminalKind`
- `recoveryGuarantee?: DelegationRecoveryGuarantee`
- `executionMode?: "sdk" | "pty" | "headless"`
- `compactionCheckpoint?: CompactionCheckpointData`
- `lifecycle?: SessionLifecycleState`

All fields are optional (`?`) with proper type imports. Backward-compatible — no existing construction sites broken.

### Task 2: Create governance persistence module

**Commit:** `db7f1873`

Created `src/features/governance/persistence.ts` with 4 exported functions:
- `getGovernanceStatePath(projectRoot?)` — resolves to `.hivemind/state/governance-state.json`
- `readGovernanceState(projectRoot?)` — reads file with graceful degradation
- `writeGovernanceState(state, projectRoot?)` — atomic write (temp → rename)
- `emptyGovernanceState()` — returns `{ rules: [], violations: [], updatedAt: Date.now() }`

Imports `getCanonicalStateDir` from continuity module. No session-tracker dependency.

### Task 3: Redirect governance evaluator + deprecate old function

**Commit:** `92c1f581`, `0e04b6bf`

- `evaluator.ts`: Replaced `getGovernancePersistenceState` + `recordGovernancePersistenceState` with `readGovernanceState` + `writeGovernanceState`
- `continuity/index.ts`: `recordGovernancePersistenceState()` is now a deprecation-warning no-op that returns empty state. Old code path preserved as comments.
- Updated tests: governance-evaluator tests now read from `readGovernanceState()`; continuity test removed (no longer applies to no-op)

### Task 4: Dual-write in persistDelegations()

**Commit:** `9cfc954b`

Added fire-and-forget dual-write to `src/task-management/continuity/delegation-persistence.ts`:
- New `buildChildRecordFromDelegation()` helper maps `Delegation` → `ChildSessionRecord`
- After atomic write to `delegations.json`, fires `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()` as fire-and-forget
- Old sync path to delegations.json is unchanged — function signature stays `void`

### Task 5: Dual-write in continuity/index.ts

**Commit:** `742ae00c`

- `recordSessionContinuity()`: After `persistStore()`, dual-writes lifecycle/pendingNotifications/compactionCheckpoint to session-tracker via `ChildWriter`
- `patchSessionContinuity()`: After `persistStore()`, dual-writes lifecycle-related patches using IIAFE pattern (async childFileExists check)
- Graceful skip if child file doesn't exist (no orphan files)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unhandled Promise rejections from fire-and-forget dual-write**

- **Found during:** Task 4/5 test gate (`npm test`)
- **Issue:** `void childWriter.createChildFile()` and `void manifestWriter.addChild()` caused unhandled Promise rejections (113 errors) when session-tracker directories didn't exist in test environments
- **Fix:** Replaced bare `void` with `.catch(err => console.error(...))` in all 3 dual-write locations
- **Files modified:** `delegation-persistence.ts`, `continuity/index.ts`
- **Commits:** `9cfc954b`, `742ae00c`

**2. [Rule 2 - Missing critical functionality] Governance evaluator reads from stale continuity cache**

- **Found during:** Test gate (after fixing unhandled rejections)
- **Issue:** `evaluateGovernance()` used `getGovernancePersistenceState()` (continuity store in-memory cache), which accumulated violations across test runs. Tests checking via `readGovernanceState()` saw stale + new violations.
- **Fix:** Changed `evaluateGovernance()` to also read from `readGovernanceState()` — both reads and writes now go through the new standalone governance-state.json. This is one plan ahead of schedule (P41-C's reader migration).
- **Files modified:** `evaluator.ts`, governance-evaluator test
- **Commit:** `0e04b6bf`

## Threat Surface Scan

No new threat flags introduced. All new code paths are covered by existing mitigations:
- T-41B-01: `safeSessionPath()` prevents path traversal — ChildWriter/HierarchyManifestWriter constructed with derived projectRoot
- T-41B-02: Fire-and-forget wrapped in try-catch + `.catch()` — old sync path guarantees data delivery
- T-41B-03: Atomic write pattern with randomUUID temp filename
- T-41B-04: Graceful skip for missing session IDs
- T-41B-SC: No new external packages

## Self-Check: PASSED

- `npm run typecheck`: 0 errors
- `npm run test`: 3012 passed, 2 skipped, 0 failures (249 test files)
- All 6 requirement checks pass (REQ-P41B-01 through REQ-P41B-07)

## Per-Requirement Verification

| Req | Check | Status |
|-----|-------|--------|
| REQ-P41B-01 | `pendingNotifications?: PendingNotification[]` at line 245 | ✅ |
| REQ-P41B-02 | 6 gap fields at lines 247-257 | ✅ |
| REQ-P41B-03 | `src/features/governance/persistence.ts` exists | ✅ |
| REQ-P41B-04 | `createChildFile` in delegation-persistence.ts | ✅ |
| REQ-P41B-05 | `createChildFile` in continuity/index.ts | ✅ |
| REQ-P41B-06 | `npm run typecheck && npm run test` both exit 0 | ✅ |
| REQ-P41B-07 | `npm run test` all tests pass | ✅ |
