[LANGUAGE: Write this file in en per Language Governance.]
# Wave 1 Execution Landscape — C8/35 Option C (Phase 1 + Phase 2)

**Plan ID:** `C8-35-dead-type-inline-2026-06-07`
**Wave:** 1 of 2
**Date:** 2026-06-07
**Path Type:** coordinated-path (via hm-executor)
**Delegation Tree Depth:** 1 (root → hm-executor)
**Risk Tier:** MEDIUM — touches `src/shared/types.ts` (the runtime type contract authority); 10 INLINEABLE + cluster removal across 5 atomic commits

---

## 1. Task Summary

Execute the FIRST WAVE of the C8/35 dead-type inline refactor (Option C). The plan-checker has already PASSED the regenerated PLAN.md (confidence 95% HIGH, evidence L5, all 10 critical-check items PASS, 3/3 gates PASS). The user has authorized full Option A execution: dispatch hm-executor with the 8-commit plan in 2 waves, full gatekeeping on each commit.

**Wave 1 scope:** 5 atomic commits across 2 phases:
- **Phase 1** (4 commits) — inline 8 dead types in `src/shared/types.ts` into their parent unions/records
- **Phase 2** (1 commit) — remove `HarnessStatus` cluster (3 exports + 1 test file)

**Wave 2 scope (deferred):** 3 atomic commits across 2 phases:
- **Phase 3** (2 commits) — inline `DelegationPacketStatus`, `ToolCallSummary`
- **Phase 4** (1 commit) — inline `SessionStatusType`

---

## 2. Path Decision Rationale

**Chosen:** coordinated-path (hm-executor for Wave 1)

**Why hm-executor, NOT hm-coordinator:** hm-coordinator is not in the available subagent roster. hm-executor is the named execution specialist that owns wave-based parallelization, atomic commits, deviation handling, and state management. It is the canonical "execute PLAN.md" agent.

**Why not fast-path to L3:** the task is multi-commit (5 atomic commits), each commit requires verification, deviation handling, and post-commit gatekeeping. A single direct dispatch would lose the wave structure and per-commit gate enforcement.

**Why not GSD `gsd-executor`:** the governance policy in this repository binds orchestration through `hm-*` agents; GSD agents are developer-tooling only and NOT shipped. hm-executor is the lineage-correct target.

---

## 3. Source References (READ THESE BEFORE DISPATCH)

The subagent MUST read these files at the start of Wave 1 to establish ground truth:

| Path | Purpose | Status |
|---|---|---|
| `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/PLAN.md` | **The authoritative plan** — 544 LOC, 17 sections, 8 atomic commits pre-decomposed. The executor MUST follow this plan. | WRITTEN, plan-checker PASS |
| `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/VERIFICATION.md` | The plan-checker's evidence — 19/19 file:line anchors verified, gate triad PASS | WRITTEN, PASS verdict |
| `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/SPEC.md` | Spec for the dead-type inline refactor — REQ-35 L77-244 rewritten for Option C | WRITTEN, gate-spec-compliance PASS |
| `.planning/codebase/DEAD-TYPE-GROUND-TRUTH-2026-06-07.md` | Ground truth investigation — 12 types analyzed, 10 INLINEABLE, 2 BLOCKED, exact line numbers in `src/shared/types.ts` | READ in full (403 lines) |
| `src/shared/types.ts` | The file to mutate — 422 LOC. The 10 INLINEABLE + cluster removal locations are pinned with file:line references | READ in full (the file) |
| `src/task-management/continuity/index.ts` | Uses the 2 BLOCKED types (`CapturedResult`, `DelegationPacket`) — DO NOT touch | DO NOT MODIFY |
| `src/task-management/journal/execution-lineage.ts` | Uses `SessionContinuityRecord` parent — references for Phase 1 commit 4 | READ for verification |
| `src/runtime-policy.ts` | Uses `SessionPolicyOverride` — references for Phase 1 commit 3 | DO NOT MODIFY structure |

---

## 4. Scope Boundaries

### 4.1 IN SCOPE (Wave 1 — 5 atomic commits)

| Commit | Phase | File(s) | Action |
|---|---|---|---|
| 1 | P1 | `src/shared/types.ts` L42 | Inline `PermissionAction` type into the `Permission` union |
| 2 | P1 | `src/shared/types.ts` L62-65 | Inline `LoopWindow` type into the `LoopConfig` interface |
| 3 | P1 | `src/shared/types.ts` L233, L242 | Inline `SessionBudgetOverride` + `SessionConcurrencyOverride` into `SessionPolicyOverride` (still consumed at `src/runtime-policy.ts:159`) |
| 4 | P1 | `src/shared/types.ts` L325-326 | Inline `SessionPromptParams` + `SessionToolProfile` into `SessionContinuityRecord` (still consumed at `src/task-management/journal/execution-lineage.ts:1,31,40,51`) |
| 5 | P2 | `src/shared/types.ts` L144-153, L155, L157-169, L179-190 + 1 test file | Remove `HarnessStatus` cluster (3 exports: `HarnessStatus`, `HARNESS_STATUS_TO_LIFECYCLE_PHASE`, `delegationStatusToHarnessStatus`) + the 1 test file that references these exports |

### 4.2 OUT OF SCOPE (deferred to Wave 2 or future phases)

- **Wave 2 (3 commits):** `DelegationPacketStatus`, `ToolCallSummary`, `SessionStatusType`
- **C9 (future phase stub):** `CapturedResult`, `DelegationPacket` (BLOCKED — 6 call sites each in `src/task-management/continuity/index.ts`)
- **C8/34:** Typed errors + `HarnessError` base class + TUI-safe logging
- **C8/SR-00/SR-04:** Archive no-op phases

### 4.3 HARD EXCLUSIONS (do not touch)

- `src/runtime-policy.ts` — DO NOT modify its structure
- `src/task-management/continuity/index.ts` — DO NOT touch (uses BLOCKED types)
- `src/shared/types.ts` exports outside the 10 INLINEABLE + cluster list
- Any other `src/**` file not listed in §4.1
- Any file under `.opencode/**` or `.hivemind/**`
- Any file under `tests/**` EXCEPT the 1 HarnessStatus test file in commit 5
- Any documentation file under `.planning/**`

---

## 5. Pre-Committed Decisions (LOCKED — do not re-debate)

1. **Atomic commits must be independently revertable** — each commit's revert must leave the build green.
2. **Build must stay green** — `npm run typecheck` MUST pass after each commit.
3. **No mutation to `src/runtime-policy.ts` structure** — its imports must continue to work without changes.
4. **No mutation to `src/task-management/continuity/index.ts`** — BLOCKED types are deferred.
5. **No mutation to public API of `src/shared/types.ts` outside the 10 INLINEABLE + cluster list** — every other export remains stable.
6. **Each commit message format:** `phase(C8-35): <action> — <rationale>` (per repo convention `phase: what changed — why it matters`).
7. **Worktree:** use the existing worktree at `../hivemind-c8-35` on branch `refactor/c8-35-dead-code` (already set up — do NOT create a new worktree).
8. **EARS pattern coverage:** all 7 EARS patterns (U/B/R/E/O/Optional + not-coverage) must be satisfied per commit's spec entry; composite clarity score ≤ 0.20.
9. **Per-commit gate:** the executor must run `npm run typecheck` AFTER each commit and confirm green BEFORE proceeding to the next commit.
10. **Final report:** the executor must produce a `SUMMARY.md` at `.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md` with all 5 commit hashes, file:line evidence per commit, and `npm run typecheck` final output.

---

## 6. Wave 1 Execution Plan (5 atomic commits)

The subagent must execute these in the order listed. DO NOT skip ahead. DO NOT batch commits.

### Commit 1 (Phase 1, Type 1 of 8) — Inline `PermissionAction`

**Target:** `src/shared/types.ts:42`
**Action:** Inline the `PermissionAction` type into the `Permission` union.
**Pre-conditions:** None.
**Post-conditions:**
- `PermissionAction` is no longer a top-level export from `src/shared/types.ts`
- The `Permission` union still type-checks
- All consumers of `PermissionAction` (if any) must be updated to use the inlined union
**Verification:**
- `npm run typecheck` → green
- `git diff --stat` → only `src/shared/types.ts` and any consumer files (if PermissionAction was imported elsewhere)
**Commit message:** `phase(C8-35): inline PermissionAction into Permission union — remove dead type (8 of 10 to inline)`

### Commit 2 (Phase 1, Type 2 of 8) — Inline `LoopWindow`

**Target:** `src/shared/types.ts:62-65`
**Action:** Inline the `LoopWindow` type into the `LoopConfig` interface.
**Pre-conditions:** Commit 1 must be green.
**Post-conditions:**
- `LoopWindow` is no longer a top-level export
- `LoopConfig` interface still type-checks
- All consumers of `LoopWindow` (if any) updated
**Verification:** same as Commit 1.
**Commit message:** `phase(C8-35): inline LoopWindow into LoopConfig — remove dead type (8 of 10 to inline)`

### Commit 3 (Phase 1, Types 3+4 of 8) — Inline `SessionBudgetOverride` + `SessionConcurrencyOverride`

**Target:** `src/shared/types.ts:233, L242`
**Action:** Inline both override types into the `SessionPolicyOverride` interface.
**Pre-conditions:** Commits 1, 2 must be green.
**Post-conditions:**
- `SessionBudgetOverride` + `SessionConcurrencyOverride` are no longer top-level exports
- `SessionPolicyOverride` interface still type-checks
- `src/runtime-policy.ts:159` continues to compile (DO NOT modify that file's structure)
**Verification:**
- `npm run typecheck` → green (CRITICAL — `src/runtime-policy.ts` must compile)
- `git diff --stat` → only `src/shared/types.ts`
**Commit message:** `phase(C8-35): inline SessionBudgetOverride + SessionConcurrencyOverride into SessionPolicyOverride — preserve runtime-policy.ts contract`

### Commit 4 (Phase 1, Types 5+6 of 8) — Inline `SessionPromptParams` + `SessionToolProfile`

**Target:** `src/shared/types.ts:325-326`
**Action:** Inline both types into the `SessionContinuityRecord` interface.
**Pre-conditions:** Commits 1, 2, 3 must be green.
**Post-conditions:**
- `SessionPromptParams` + `SessionToolProfile` are no longer top-level exports
- `SessionContinuityRecord` interface still type-checks
- `src/task-management/journal/execution-lineage.ts:1,31,40,51` continues to compile (DO NOT modify that file's structure)
**Verification:**
- `npm run typecheck` → green
- `git diff --stat` → only `src/shared/types.ts`
**Commit message:** `phase(C8-35): inline SessionPromptParams + SessionToolProfile into SessionContinuityRecord — preserve execution-lineage.ts contract`

### Commit 5 (Phase 2, HarnessStatus cluster) — Remove 3 exports + 1 test file

**Target:** `src/shared/types.ts:144-153, L155, L157-169, L179-190` + 1 test file (locate via `grep -r "HarnessStatus" tests/`)
**Action:** Remove the entire `HarnessStatus` cluster — the type itself, the `HARNESS_STATUS_TO_LIFECYCLE_PHASE` constant, the `delegationStatusToHarnessStatus` function — and the 1 test file that references them.
**Pre-conditions:** Commits 1, 2, 3, 4 must be green.
**Post-conditions:**
- 3 exports are removed from `src/shared/types.ts`
- 1 test file is removed (or its HarnessStatus test block is removed — choose the surgical option if the file has other tests)
- NO other source file imports these exports (verify with `grep -r "HARNESS_STATUS_TO_LIFECYCLE_PHASE\|delegationStatusToHarnessStatus" src/`)
**Verification:**
- `npm run typecheck` → green
- `npm test` for the removed test file → either N/A (file removed) or green
- `git diff --stat` → `src/shared/types.ts` and 1 test file
**Commit message:** `phase(C8-35): remove HarnessStatus cluster (3 exports + 1 test) — no source consumers, test-only surface`

---

## 7. Success Criteria (Gate-Enforced)

A Wave 1 return is ACCEPTABLE only if ALL of the following are true:

1. **5 atomic commits** exist on branch `refactor/c8-35-dead-code` in worktree `../hivemind-c8-35`
2. **Each commit has a meaningful message** matching the `phase(C8-35): <action> — <rationale>` format
3. **`npm run typecheck` is GREEN after the final commit** (executor must show the output)
4. **Each commit is independently revertable** (executor should note: `git revert <hash>` leaves the build green — this is a STRUCTURAL claim, executor verifies by reading the diff and confirming no other commits depend on it)
5. **No mutation to OUT-OF-SCOPE files** (verify with `git diff --stat main..refactor/c8-35-dead-code` showing only the 4 expected files: `src/shared/types.ts` + 1 test file + possibly 0-2 consumer updates)
6. **No mutation to BLOCKED types** (`CapturedResult` + `DelegationPacket` must be untouched — verify with `git diff main..refactor/c8-35-dead-code -- src/task-management/continuity/index.ts` showing no changes)
7. **SUMMARY.md exists** at `.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md` with: 5 commit hashes, file:line evidence per commit, final `npm run typecheck` output, any deviation notes

---

## 8. Quality Gate Expectations

The executor does NOT need to run the gate triad itself — that is the orchestrator's responsibility. But the executor MUST produce the evidence needed for the gates:

| Gate | Evidence Required from Executor | Source |
|---|---|---|
| **lifecycle** | All changes are in `src/shared/types.ts` (CQRS write boundary); no `src/runtime-policy.ts` or `src/task-management/continuity/index.ts` mutation | `git diff --stat` + file:line evidence in SUMMARY.md |
| **spec** | 5 commits map to 5 REQ-35 acceptance criteria entries in `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/SPEC.md` L77-244 | cross-reference table in SUMMARY.md |
| **evidence** | `npm run typecheck` green output (paste last 20 lines); `git log --oneline main..refactor/c8-35-dead-code` showing 5 commits; per-commit diff stat | raw output in SUMMARY.md |

---

## 9. Constraints (LOCKED in PLAN.md §6-§8)

**Non-Goals (DO NOT do):**
- DO NOT touch the 2 BLOCKED types (`CapturedResult`, `DelegationPacket`)
- DO NOT modify `src/runtime-policy.ts` structure
- DO NOT touch `src/shared/types.ts` exports outside the 10 INLINEABLE + cluster list
- DO NOT change the parent public API of any type/interface
- DO NOT run the full test suite unless required by a specific commit's verification
- DO NOT push to remote, DO NOT create a PR, DO NOT merge — that is the orchestrator's job after Wave 2 completes

**Required Patterns:**
- Atomic commits (one logical change per commit)
- Each commit independently revertable
- Build must stay green after each commit
- All file:line references verified before commit (read the file, confirm the line range)
- EARS pattern coverage: 7 patterns per commit, composite clarity score ≤ 0.20

---

## 10. Execution Workflow (Subagent Instructions)

The subagent must execute in this order:

1. **Read all 3 source documents** in §3 (PLAN.md, VERIFICATION.md, DEAD-TYPE-GROUND-TRUTH-2026-06-07.md) — these establish ground truth.
2. **Switch to worktree** at `../hivemind-c8-35` on branch `refactor/c8-35-dead-code` (already exists).
3. **Run `npm run typecheck`** as a baseline — must be green before any changes.
4. **Execute commits 1-5** in the order in §6:
   - For each commit: read the target file, read any consumer files, apply the inlining, run `npm run typecheck`, confirm green, `git add` only the expected files, `git commit -m "<message>"`.
5. **Run `npm run typecheck` again** at the end — must be green.
6. **Write SUMMARY.md** at `.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md` with the 5 commit hashes, per-commit evidence, and final typecheck output.
7. **Return the structured result** to the orchestrator with: 5 commit hashes, summary file path, typecheck status, any deviations encountered.

**Deviation handling:** if a commit's `npm run typecheck` fails, the executor must:
- Stop the wave
- Report the failure with the exact error output and file:line
- NOT attempt to fix beyond the current commit
- Return a BLOCKED status with a re-dispatch request specifying the failure

**Retry budget:** max 3 attempts per commit. After 3 failures on the same commit, the executor must return BLOCKED.

---

## 11. Escalation Rules

The subagent must escalate (return BLOCKED) if:

- A type is referenced by a file OUTSIDE the expected set (e.g., a new consumer of `PermissionAction` appears)
- `npm run typecheck` fails for a reason unrelated to the inlining (e.g., pre-existing failure)
- A BLOCKED type is accidentally modified
- The worktree is in an unexpected state (wrong branch, uncommitted changes, missing files)
- The 3-retry budget is exhausted on any commit

The subagent must NOT escalate for:
- Minor formatting differences in type definitions
- Adding new helper types in the same file IF they are required for the inlining
- Updating consumer files IF the consumer only used the inlined type (e.g., re-export shims)

---

## 12. Artifact Requirements (What Executor Must Return)

The executor's final return must include:

1. **Session ID** — for continuity tracking
2. **5 commit hashes** (short form, e.g., `a1b2c3d`) on branch `refactor/c8-35-dead-code`
3. **Path to SUMMARY.md** (absolute or relative to project root)
4. **Final `npm run typecheck` output** (last 20 lines, copy-paste, not summarized)
5. **Per-commit diff stat** — `git diff --stat main..refactor/c8-35-dead-code` showing only expected files
6. **Evidence label per commit** — `runtime-truthful` (npm run typecheck green) is the expected label
7. **Deviation notes** (if any) — what was different from the plan and why

---

## 13. Delegation Metadata (For Orchestrator Audit)

- **Parent session:** root orchestrator session
- **Child session:** TBD (assigned by SDK on dispatch)
- **Path decision:** coordinated-path via hm-executor
- **Plan reference:** `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/PLAN.md` (plan_id: `C8-35-dead-type-inline-2026-06-07`)
- **Verification reference:** `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/VERIFICATION.md` (PASS, 95% confidence, L5 evidence)
- **User authorization:** Option A (full 8-commit, 2-wave, gatekeeping on each commit)
- **Expected delegation depth after Wave 1:** 1
- **Maximum allowed delegation depth:** 3 (iron law)
- **Gate triad execution:** deferred to orchestrator after Wave 1 return

---

**END OF WAVE 1 LANDSCAPE**
