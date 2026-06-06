[LANGUAGE: Write this file in en per Language Governance.]
---
phase: 35
plan: C8-35-wave-1
subsystem: dead-type-inline-refactor
tags: [refactor, dead-code, types, atomic-commits, c8-35, wave-1]
dependency-graph: standalone (no upstream dependency)
tech-stack: typescript, vitest, npm
key-files:
  - src/shared/types.ts
  - tests/lib/coordination/delegation/status-mapping.test.ts
  - src/tools/hivemind/hivemind-steer.ts (provisioning fix, untracked)
decisions:
  - inline-over-keep-named: chose Option C (inline into consumer field) for all 5 type clusters — rationale: per-callsite, each shape was only consumed by 1-2 files, and the named-type abstraction added indirection without contract value
  - preserve-jsdoc-context: kept the L115-136 historical context comment block (HarnessStatus mapping table) as historical reference, even after the type was removed
  - surgical-test-deletion: removed only the P22-01 describe block (6 tests) from status-mapping.test.ts; kept the P22-02/03/04/07b blocks (unrelated coverage) intact
  - provisioning-fix-uncommitted: did NOT commit src/tools/hivemind/hivemind-steer.ts to preserve the 5-commit plan structure; documented as deviation
metrics:
  commits: 5
  files-changed: 2
  insertions: 21
  deletions: 111
  typecheck: GREEN
  blocked-type-mutations: 0
  out-of-scope-mutations: 0
---

# Phase 35 C8/35 Wave 1 Summary: Dead-Type Inline Refactor

## Plan Scope

- **Branch:** `refactor/c8-35-dead-code` in worktree `/Users/apple/hivemind-c8-35`
- **Base:** `feature/harness-implementation` @ `49f36dc7`
- **Goal:** Remove 5 dead-type clusters by inlining their shapes into their sole consumer (Option C from the dispatch packet's analysis)
- **Constraint set:**
  - Touch only `src/shared/types.ts` + 1 test file (`tests/lib/coordination/delegation/status-mapping.test.ts`)
  - Do NOT touch BLOCKED types: `CapturedResult`, `DelegationPacket` (deferred to Wave 2)
  - Do NOT modify `src/shared/runtime-policy.ts` structure
  - Do NOT modify `src/task-management/continuity/index.ts`
  - Do NOT touch `.opencode/**`, `.hivemind/**`, `.planning/**`
  - Per-commit `npm run typecheck` must be GREEN; final typecheck must be GREEN
  - No push, PR, merge, batch commits, or full test suite

## Tasks Completed

| # | Commit  | Action                                                                | Files | +/-   |
|---|---------|-----------------------------------------------------------------------|-------|-------|
| 1 | `37ce4658` | Inline `PermissionAction` → `PermissionRule.action` union            | 1     | +1/-2 |
| 2 | `9ca00ed7` | Inline `LoopWindow` → `SessionStats.loop`                            | 1     | +1/-6 |
| 3 | `6e6b8735` | Inline `SessionBudgetOverride` + `SessionConcurrencyOverride` → `SessionPolicyOverride` | 1 | +5/-9 |
| 4 | `48dc9c23` | Inline `SessionPromptParams` + `SessionToolProfile` → `SessionContinuityRecord` | 1   | +11/-15 |
| 5 | `cd6b03ee` | Remove `HarnessStatus` cluster (type + mapping const + converter fn) + delete P22-01 test block | 2 | +3/-79 |

## Per-Commit Evidence

### Commit 1 — `37ce4658` — `PermissionAction`
- **Removed:** Standalone `export type PermissionAction = "allow" | "ask"` at `types.ts:42`
- **Replaced:** L47 `action: PermissionAction` → `action: "allow" | "ask"`
- **Sole consumer:** `src/shared/helpers.ts:1` imports `PermissionRule` (not the inlined type) — safe
- **Pre-flight:** 0 other consumers in `src/` for `PermissionAction`

### Commit 2 — `9ca00ed7` — `LoopWindow`
- **Removed:** Standalone `LoopWindow` type at `types.ts:61-64`
- **Replaced:** L86 `loop: LoopWindow` → `loop: { signature: string; count: number }`
- **Sole consumer:** `src/shared/state.ts:25,48` already used inlined shape `{ signature: "", count: 0 }` — safe
- **Pre-flight:** 0 other consumers in `src/` for `LoopWindow`

### Commit 3 — `6e6b8735` — `SessionBudgetOverride` + `SessionConcurrencyOverride`
- **Removed:** Both types at `types.ts:227-232`
- **Replaced:** L227-238 `SessionPolicyOverride` fields now use inline shapes
- **Sole consumer:** `src/shared/runtime-policy.ts:20,159` imports only `SessionPolicyOverride` — safe
- **Pre-flight:** 0 other consumers in `src/` for the two override types

### Commit 4 — `48dc9c23` — `SessionPromptParams` + `SessionToolProfile`
- **Removed:** Both types at `types.ts:271-282`
- **Replaced:** L315-316 fields inlined into `SessionContinuityRecord`; preserved `[key: string]: unknown` index signature for both
- **Sole consumer:** `src/task-management/journal/execution-lineage.ts:1` imports only `SessionContinuityRecord` — safe
- **Pre-flight:** 0 other consumers in `src/` for the two prompt/tool types

### Commit 5 — `cd6b03ee` — `HarnessStatus` cluster
- **Removed (3 exports + Phase 22 marker block):**
  - `HarnessStatus` type at `types.ts:138-147` (9-value union: `pending | queued | dispatching | running | completed | error | cancelled | interrupt | failed`)
  - `HARNESS_STATUS_TO_LIFECYCLE_PHASE` const at `types.ts:151-163` (`Record<Exclude<HarnessStatus, "interrupt">, "created" | "queued" | "dispatching" | "running" | "completed" | "failed">`)
  - `delegationStatusToHarnessStatus` function at `types.ts:165-186` (Phase 22 mapping function)
- **Preserved (Optional clause):** Historical context JSDoc comment block at `types.ts:115-136` (the "Three overlapping status types" mapping table) — converted to past-tense ("existed" / "was") to reflect the removal while keeping the architectural rationale on disk
- **Test file:** Removed the `describe("P22-01: delegationStatusToHarnessStatus()")` block (6 tests, L13-39) and the now-orphan import at L2. Kept P22-02/03/04/07b blocks intact (unrelated coverage of `DelegationErrorCode` const union + `PendingNotification`)
- **Sole consumer:** `tests/lib/coordination/delegation/status-mapping.test.ts` (the test file) — safe to remove
- **Pre-flight:** 0 consumers in `src/` for all 3 removed exports; 0 consumers in other test files

## Deviations from Plan

### Auto-fixed: Provisioning fix for `src/tools/hivemind/hivemind-steer.ts` (Rule 1 — Bug)

- **Found during:** Pre-execution baseline check (before commit 1)
- **Issue:** `src/tools/hivemind/hivemind-steer.ts` (2905 bytes) was untracked in main worktree as of 2026-06-05 22:26 — file existed in the filesystem but was never committed. It is referenced by `src/plugin.ts:35,450` (a tracked file). When the worktree was provisioned from base `49f36dc7`, the file was missing, causing baseline `npm run typecheck` to fail with module-not-found errors.
- **Fix applied:** Copied the untracked file from `/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-steer.ts` to `/Users/apple/hivemind-c8-35/src/tools/hivemind/hivemind-steer.ts` as a provisioning fix.
- **Status:** File left untracked in worktree. **NOT included in any of the 5 commits.** Documented for awareness only.
- **Why not committed:** Out of scope for C8/35 (which targets only `types.ts` + the status-mapping test). The `hivemind-steer.ts` file lifecycle is a separate concern — it should be committed in a prior baseline commit or a follow-up phase.
- **Files modified (uncommitted):** `src/tools/hivemind/hivemind-steer.ts` (copy, 2905 bytes)
- **Commit:** (none — explicitly excluded from the 5-commit plan)

### Documented path inconsistency (no action taken)

- `DEAD-TYPE-GROUND-TRUTH-2026-06-07.md` and the regenerated 544-LOC `PLAN.md` are uncommitted in main worktree; preserved in context from the BLOCKED-then-re-dispatched prompt but not part of the 5 commits.
- `landscape.md` references `src/runtime-policy.ts:159` but the actual path is `src/shared/runtime-policy.ts:159` — minor path typo in `landscape.md`; `PLAN.md` has the correct path. No action needed.

## Gates Passed

- [x] **Final `npm run typecheck`:** GREEN
  ```
  > hivemind-3.0@0.1.0 typecheck
  > tsc --noEmit
  ```
- [x] **All 5 commits land on `refactor/c8-35-dead-code`** (verified via `git log feature/harness-implementation..refactor/c8-35-dead-code`)
- [x] **Diff stat:** 2 files touched (`src/shared/types.ts` + `tests/lib/coordination/delegation/status-mapping.test.ts`), 21 insertions / 111 deletions
- [x] **BLOCKED-type consumer check:** `git diff feature/harness-implementation..refactor/c8-35-dead-code -- src/task-management/continuity/index.ts` → EMPTY (no changes to the file that holds `CapturedResult` / `DelegationPacket` consumers)
- [x] **BLOCKED types still present:**
  - `CapturedResult` at `types.ts:68` (still used at L245)
  - `DelegationPacket` at `types.ts:224` (still used at L247)
  - `DelegationPacketStatus` at `types.ts:139` (still used at L232)
- [x] **Pre-flight consumer scan:** 0 in-file code consumers of removed exports (only references are inside the preserved historical context JSDoc comment)
- [x] **No TODO/FIXME/HACK/XXX stubs** added in modified files
- [x] **Per-commit typecheck:** GREEN (verified after each of 5 commits)

## Known Stubs

None.

## Threat Flags

None introduced. This is a pure dead-code removal that *reduces* the type surface area. The deletion of `HarnessStatus` removes a 9-value union that no production code depended on, eliminating a class of potential "status enum drift" bugs between modules.

## Next Steps

1. **Wave 2** will tackle the BLOCKED types `CapturedResult` and `DelegationPacket` in a separate plan/session (out of scope for Wave 1)
2. **Provisioning fix follow-up:** Commit `src/tools/hivemind/hivemind-steer.ts` in a separate prior-phase commit (out of scope for C8/35; the file should be reviewed and possibly folded into the harness baseline)
3. **Test coverage check** (`npm run test:coverage`) was not run per the plan's out-of-scope rule; should be enabled in a follow-up phase to verify the inlined shapes still pass runtime test coverage
4. **No push/PR/merge** performed per the plan boundary — branch is local only on `refactor/c8-35-dead-code`

## Self-Check

- [x] All 5 commit hashes verified: `37ce4658`, `9ca00ed7`, `6e6b8735`, `48dc9c23`, `cd6b03ee` (via `git log --oneline`)
- [x] Final typecheck output captured (GREEN, 0 errors)
- [x] Files modified match expected scope (2 files, all in `src/shared/types.ts` or the status-mapping test)
- [x] No TODOs/FIXMEs left in modified files (grep -nE "TODO|FIXME|XXX|HACK" returned 0 matches)
- [x] SUMMARY.md written to absolute main-worktree path: `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md`
- [x] Deviations documented with Rule-1 classification and rationale
- [x] No destructive git operations performed (no push, no PR, no merge, no reset, no clean)
