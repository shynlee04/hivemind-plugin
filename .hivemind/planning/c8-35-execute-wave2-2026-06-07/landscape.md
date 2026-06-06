[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
# Wave 2 Execution Landscape — C8/35 Option C (Phase 3 + Phase 4)

**Plan ID:** `C8-35-dead-type-inline-2026-06-07`
**Wave:** 2 of 2 (FINAL)
**Date:** 2026-06-07
**Path Type:** coordinated-path (via hm-executor)
**Delegation Tree Depth:** 1 (root → hm-executor)
**Risk Tier:** MEDIUM — continues touching `src/shared/types.ts`; 3 final inline commits for the last 3 of 10 INLINEABLE types

---

## 1. Task Summary

Execute the SECOND (FINAL) WAVE of the C8/35 dead-type inline refactor (Option C). Wave 1 is COMPLETE with all 3 quality gates PASS (lifecycle→spec→evidence). This wave addresses the last 3 of 10 INLINEABLE types across 2 phases.

**Wave 1 was successful:** 5 atomic commits landed on `refactor/c8-35-dead-code`, all typechecks GREEN, 2 files changed (21 insertions / 111 deletions), BLOCKED types preserved, no out-of-scope mutations. Verification:
- Branch state: `cd6b03ee` on `refactor/c8-35-dead-code` in worktree `../hivemind-c8-35`
- `src/shared/types.ts` reduced 422 → 361 LOC (net -61 lines, 5 of 8 inlining commits)
- SUMMARY: `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md` (148 lines, 10663 bytes)

**Wave 2 scope:** 3 atomic commits across 2 phases:
- **Phase 3** (2 commits) — inline `DelegationPacketStatus`, `ToolCallSummary`
- **Phase 4** (1 commit) — inline `SessionStatusType`

After Wave 2: 8 of 10 INLINEABLE types addressed. The 2 BLOCKED types (`CapturedResult`, `DelegationPacket`) remain for C9 phase.

---

## 2. Path Decision Rationale

**Chosen:** coordinated-path (hm-executor for Wave 2)

**Why hm-executor:** Same as Wave 1. hm-executor owns wave-based execution, atomic commits, deviation handling. Re-dispatching to the same agent ensures consistent methodology.

**Why not fast-path:** 3 atomic commits with per-commit gatekeeping require wave structure; not a one-shot task.

**Why not via L0 (orchestrator):** L0 is forbidden from inline specialist work per iron law 1. The orchestrator's role is to delegate and verify, not execute.

---

## 3. Source References (READ THESE BEFORE DISPATCH)

The subagent MUST read these files at the start of Wave 2 to establish ground truth:

| Path | Purpose | Status |
|---|---|---|
| `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/PLAN.md` | The authoritative plan — 544 LOC, 17 sections, 8 atomic commits pre-decomposed | WRITTEN, plan-checker PASS |
| `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/VERIFICATION.md` | The plan-checker's evidence — 19/19 file:line anchors verified, gate triad PASS | WRITTEN, PASS verdict |
| `.planning/codebase/DEAD-TYPE-GROUND-TRUTH-2026-06-07.md` | Ground truth investigation — 12 types analyzed, 10 INLINEABLE, 2 BLOCKED, exact line numbers in `src/shared/types.ts` | READ in full (403 lines) |
| `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md` | **Wave 1 evidence** — 5 commit hashes, per-commit typecheck, deviations. The subagent MUST read this to understand what's already done. | WRITTEN (148 lines) |
| `src/shared/types.ts` | The file to mutate — **now 361 lines** (was 422; -61 from Wave 1). The 3 remaining INLINEABLE types are at NEW line numbers (shifted by Wave 1's inlining) | READ for current line numbers |

**IMPORTANT — line number shift:** Wave 1's 5 inlining commits shifted line numbers. The DEAD-TYPE-GROUND-TRUTH-2026-06-07.md file was based on the original 422-LOC version. The subagent MUST locate the 3 remaining types by NAME (grep for `DelegationPacketStatus`, `ToolCallSummary`, `SessionStatusType`) and verify their CURRENT line numbers before inlining.

---

## 4. Scope Boundaries

### 4.1 IN SCOPE (Wave 2 — 3 atomic commits)

| Commit | Phase | Target | Action |
|---|---|---|---|
| 6 | P3 | `src/shared/types.ts` (search for `DelegationPacketStatus`) | Inline `DelegationPacketStatus` type into the `DelegationPacketStatus` union (or parent enum) |
| 7 | P3 | `src/shared/types.ts` (search for `ToolCallSummary`) | Inline `ToolCallSummary` type into `ToolCallRecord` |
| 8 | P4 | `src/shared/types.ts` (search for `SessionStatusType`) | Inline `SessionStatusType` type into `SessionLifecycle` |

**EXACT LINE LOCATIONS TO VERIFY** (from DEAD-TYPE-GROUND-TRUTH-2026-06-07.md, line numbers may have shifted):
- `DelegationPacketStatus` was at L155 in original 422-LOC version
- `ToolCallSummary` was at L67-72 in original
- `SessionStatusType` was at L50 in original

**SUBAGENT INSTRUCTION:** Before each commit, run `grep -n "DelegationPacketStatus\|ToolCallSummary\|SessionStatusType" src/shared/types.ts` to find current line numbers.

### 4.2 OUT OF SCOPE (deferred to C9 or future phases)

- **C9 (future phase stub):** `CapturedResult`, `DelegationPacket` (BLOCKED — 6 call sites each in `src/task-management/continuity/index.ts`)
- **C8/34:** Typed errors + `HarnessError` base class + TUI-safe logging
- **C8/SR-00/SR-04:** Archive no-op phases

### 4.3 HARD EXCLUSIONS (do not touch)

- `src/runtime-policy.ts` (now at `src/shared/runtime-policy.ts`) — DO NOT modify its structure
- `src/task-management/continuity/index.ts` — DO NOT touch (uses BLOCKED types)
- `src/shared/types.ts` exports outside the 3 remaining INLINEABLE types
- Any other `src/**` file not listed in §4.1
- Any file under `.opencode/**` or `.hivemind/**`
- Any documentation file under `.planning/**`
- **`src/tools/hivemind/hivemind-steer.ts`:** This file is untracked in BOTH worktrees (existed on filesystem as of 2026-06-05 22:26 but never committed to git). Wave 1 executor COPIED it from main to worktree to make baseline typecheck pass. **DO NOT commit it as part of any C8/35 commit** — it's a separate concern (see Wave 1 deviation §7). The file is already in the worktree's filesystem, so baseline typecheck will work; just leave it untracked.

---

## 5. Pre-Committed Decisions (LOCKED — do not re-debate)

1. **Atomic commits must be independently revertable** — each commit's revert must leave the build green.
2. **Build must stay green** — `npm run typecheck` MUST pass after each commit.
3. **No mutation to `src/runtime-policy.ts` structure** — its imports must continue to work without changes.
4. **No mutation to `src/task-management/continuity/index.ts`** — BLOCKED types are deferred.
5. **No mutation to public API of `src/shared/types.ts` outside the 3 remaining INLINEABLE types** — every other export remains stable.
6. **No commit to `src/tools/hivemind/hivemind-steer.ts`** — it stays untracked, separate concern.
7. **Each commit message format:** `phase(C8-35): <action> — <rationale>` (per repo convention).
8. **Worktree:** use the existing worktree at `../hivemind-c8-35` on branch `refactor/c8-35-dead-code` (NOW SET UP at HEAD `cd6b03ee` after Wave 1; do NOT create a new worktree).
9. **EARS pattern coverage:** all 7 EARS patterns (U/B/R/E/O/Optional + not-coverage) must be satisfied per commit's spec entry; composite clarity score ≤ 0.20.
10. **Per-commit gate:** the executor must run `npm run typecheck` AFTER each commit and confirm green BEFORE proceeding to the next commit.
11. **Final report:** the executor must produce a `SUMMARY.md` at `.hivemind/planning/c8-35-execute-wave2-2026-06-07/SUMMARY.md` (absolute path in main worktree) with all 3 commit hashes, file:line evidence per commit, and `npm run typecheck` final output.

---

## 6. Wave 2 Execution Plan (3 atomic commits)

The subagent must execute these in the order listed. DO NOT skip ahead. DO NOT batch commits.

### Commit 6 (Phase 3, Type 7 of 10) — Inline `DelegationPacketStatus`

**Target:** `src/shared/types.ts` (locate via `grep -n "DelegationPacketStatus" src/shared/types.ts`; was L155 in original 422-LOC version)
**Action:** Inline the `DelegationPacketStatus` type into the parent union (or the `DelegationPacket` interface if it's an enum-like field).
**Pre-conditions:** Branch must be at `cd6b03ee` (Wave 1 HEAD). Verify with `git log --oneline -1`.
**Post-conditions:**
- `DelegationPacketStatus` is no longer a top-level export from `src/shared/types.ts`
- The parent union/interface still type-checks
- All consumers (in `src/task-management/continuity/index.ts:232` per Wave 1 SUMMARY) must continue to compile — DO NOT modify that file
**Verification:**
- `npm run typecheck` → green
- `git diff --stat` → only `src/shared/types.ts`
**Commit message:** `phase(C8-35): inline DelegationPacketStatus into parent union — remove dead type (9 of 10 to inline)`

### Commit 7 (Phase 3, Type 8 of 10) — Inline `ToolCallSummary`

**Target:** `src/shared/types.ts` (locate via `grep -n "ToolCallSummary" src/shared/types.ts`; was L67-72 in original 422-LOC version)
**Action:** Inline the `ToolCallSummary` type into the `ToolCallRecord` interface.
**Pre-conditions:** Commit 6 must be green.
**Post-conditions:**
- `ToolCallSummary` is no longer a top-level export
- `ToolCallRecord` interface still type-checks
**Verification:**
- `npm run typecheck` → green
- `git diff --stat` → only `src/shared/types.ts`
**Commit message:** `phase(C8-35): inline ToolCallSummary into ToolCallRecord — remove dead type (10 of 10 to inline)`

### Commit 8 (Phase 4, final) — Inline `SessionStatusType`

**Target:** `src/shared/types.ts` (locate via `grep -n "SessionStatusType" src/shared/types.ts`; was L50 in original 422-LOC version)
**Action:** Inline the `SessionStatusType` type into the `SessionLifecycle` interface.
**Pre-conditions:** Commits 6, 7 must be green.
**Post-conditions:**
- `SessionStatusType` is no longer a top-level export
- `SessionLifecycle` interface still type-checks
- All consumers (if any) continue to compile
**Verification:**
- `npm run typecheck` → green
- `git diff --stat` → only `src/shared/types.ts`
**Commit message:** `phase(C8-35): inline SessionStatusType into SessionLifecycle — final dead type removal (10 of 10 complete)`

---

## 7. Success Criteria (Gate-Enforced)

A Wave 2 return is ACCEPTABLE only if ALL of the following are true:

1. **3 atomic commits** exist on branch `refactor/c8-35-dead-code` IN ADDITION to the 5 Wave 1 commits (total: 8 commits ahead of `feature/harness-implementation`)
2. **Each commit has a meaningful message** matching the `phase(C8-35): <action> — <rationale>` format
3. **`npm run typecheck` is GREEN after the final commit** (executor must show the output)
4. **Each commit is independently revertable** (structural claim, verified by reading the diff)
5. **No mutation to OUT-OF-SCOPE files** (verify with `git diff --stat feature/harness-implementation..refactor/c8-35-dead-code` showing only `src/shared/types.ts`)
6. **No mutation to BLOCKED types** (`CapturedResult` + `DelegationPacket` must be untouched — verify with `git diff feature/harness-implementation..refactor/c8-35-dead-code -- src/task-management/continuity/index.ts` showing no changes)
7. **`src/tools/hivemind/hivemind-steer.ts` is NOT committed** (verify with `git status` in the worktree — file should still show as untracked)
8. **SUMMARY.md exists** at the absolute main worktree path `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave2-2026-06-07/SUMMARY.md` with: 3 commit hashes, file:line evidence per commit, final `npm run typecheck` output, any deviation notes

---

## 8. Quality Gate Expectations

The executor does NOT need to run the gate triad itself — that is the orchestrator's responsibility. But the executor MUST produce the evidence needed for the gates:

| Gate | Evidence Required from Executor | Source |
|---|---|---|
| **lifecycle** | All changes are in `src/shared/types.ts` (CQRS write boundary); no `src/shared/runtime-policy.ts` or `src/task-management/continuity/index.ts` mutation; `hivemind-steer.ts` NOT committed | `git diff --stat feature/harness-implementation..refactor/c8-35-dead-code` + `git status` in worktree |
| **spec** | 3 commits map to 3 REQ-35 acceptance criteria entries in `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/SPEC.md` L77-244 (specifically the last 3 inlining entries) | cross-reference table in SUMMARY.md |
| **evidence** | `npm run typecheck` green output (paste last 20 lines); `git log --oneline feature/harness-implementation..refactor/c8-35-dead-code` showing 8 total commits; per-commit diff stat | raw output in SUMMARY.md |

---

## 9. Constraints (LOCKED in PLAN.md §6-§8)

**Non-Goals (DO NOT do):**
- DO NOT touch the 2 BLOCKED types (`CapturedResult`, `DelegationPacket`)
- DO NOT modify `src/shared/runtime-policy.ts` structure
- DO NOT touch `src/shared/types.ts` exports outside the 3 remaining INLINEABLE types
- DO NOT change the parent public API of any type/interface
- DO NOT commit `src/tools/hivemind/hivemind-steer.ts`
- DO NOT run the full test suite unless required by a specific commit's verification
- DO NOT push to remote, DO NOT create a PR, DO NOT merge — that is the orchestrator's job after Wave 2 completes

**Required Patterns:**
- Atomic commits (one logical change per commit)
- Each commit independently revertable
- Build must stay green after each commit
- All file:line references verified BEFORE commit (grep the current line numbers, do NOT trust the original 422-LOC line numbers)
- EARS pattern coverage: 7 patterns per commit, composite clarity score ≤ 0.20

---

## 10. Execution Workflow (Subagent Instructions)

The subagent must execute in this order:

1. **Read all source documents** in §3 — landscape.md (this file), PLAN.md, VERIFICATION.md, DEAD-TYPE-GROUND-TRUTH-2026-06-07.md, AND Wave 1 SUMMARY.md.
2. **Switch to worktree** at `../hivemind-c8-35` on branch `refactor/c8-35-dead-code` (verify with `git status` and `git log --oneline -1` → must be `cd6b03ee`).
3. **Run `npm run typecheck`** as a baseline — must be green BEFORE any changes.
4. **Locate the 3 remaining types** in `src/shared/types.ts`:
   - `grep -n "DelegationPacketStatus" src/shared/types.ts` → record line number
   - `grep -n "ToolCallSummary" src/shared/types.ts` → record line number
   - `grep -n "SessionStatusType" src/shared/types.ts` → record line number
5. **Read the consumers** of each type to verify inlining preserves their imports:
   - `DelegationPacketStatus` → `src/task-management/continuity/index.ts:232` (per Wave 1 SUMMARY)
   - `ToolCallSummary` → check via `grep -rn "ToolCallSummary" src/`
   - `SessionStatusType` → check via `grep -rn "SessionStatusType" src/`
6. **Execute commits 6-8** in the order in §6:
   - For each commit: read the target file at the verified line range, read any consumer files, apply the inlining edit, run `npm run typecheck`, confirm green, `git add` only the expected file, `git commit -m "<message>"`.
7. **Run `npm run typecheck` again** at the end — must be green.
8. **Write SUMMARY.md** at the ABSOLUTE path `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave2-2026-06-07/SUMMARY.md` with the 3 commit hashes, per-commit evidence, and final typecheck output.
9. **Return the structured result** to the orchestrator with: 3 commit hashes, summary file path, typecheck status, any deviations encountered.

**Deviation handling:** if a commit's `npm run typecheck` fails, the executor must:
- Stop the wave
- Report the failure with the exact error output and file:line
- NOT attempt to fix beyond the current commit
- Return a BLOCKED status with a re-dispatch request specifying the failure

**Retry budget:** max 3 attempts per commit. After 3 failures on the same commit, the executor must return BLOCKED.

---

## 11. Escalation Rules

The subagent must escalate (return BLOCKED) if:

- A type is referenced by a file OUTSIDE the expected set (e.g., a new consumer of `DelegationPacketStatus` appears)
- `npm run typecheck` fails for a reason unrelated to the inlining (e.g., pre-existing failure)
- A BLOCKED type is accidentally modified
- The worktree is in an unexpected state (wrong branch, uncommitted changes in tracked files, missing files)
- The 3-retry budget is exhausted on any commit
- The 3 remaining types cannot be located via grep (they may have already been removed by a prior commit)

The subagent must NOT escalate for:
- Minor formatting differences in type definitions
- Adding new helper types in the same file IF they are required for the inlining
- Updating consumer files IF the consumer only used the inlined type (e.g., re-export shims)
- The untracked `src/tools/hivemind/hivemind-steer.ts` file (this is expected from Wave 1)

---

## 12. Artifact Requirements (What Executor Must Return)

The executor's final return must include:

1. **Session ID** — for continuity tracking
2. **3 commit hashes** (short form, e.g., `a1b2c3d`) on branch `refactor/c8-35-dead-code`
3. **Path to SUMMARY.md** (absolute: `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave2-2026-06-07/SUMMARY.md`)
4. **Final `npm run typecheck` output** (last 20 lines, copy-paste, not summarized)
5. **Total branch diff stat** — `git diff --stat feature/harness-implementation..refactor/c8-35-dead-code` (should show ONLY `src/shared/types.ts` and the status-mapping test file from Wave 1)
6. **Per-commit diff stat** for the 3 Wave 2 commits
7. **Evidence label per commit** — `runtime-truthful` is the expected label
8. **Deviation notes** (if any) — what was different from the plan and why
9. **Confirmation that `src/tools/hivemind/hivemind-steer.ts` is STILL untracked** (not committed by any Wave 2 commit)

---

## 13. Delegation Metadata (For Orchestrator Audit)

- **Parent session:** root orchestrator session
- **Child session:** TBD (assigned by SDK on dispatch)
- **Path decision:** coordinated-path via hm-executor (continuation of Wave 1)
- **Plan reference:** `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/PLAN.md` (plan_id: `C8-35-dead-type-inline-2026-06-07`)
- **Verification reference:** `.planning/phases/AUDIT-04-legacy-phase-audit/C8-foundation/VERIFICATION.md` (PASS, 95% confidence, L5 evidence)
- **Wave 1 reference:** `/Users/apple/hivemind-plugin-private/.hivemind/planning/c8-35-execute-wave1-2026-06-07/SUMMARY.md` (5 commits, all typechecks GREEN, deviation documented)
- **User authorization:** Option A (full 8-commit, 2-wave, gatekeeping on each commit)
- **Worktree state at Wave 2 start:** HEAD `cd6b03ee` on `refactor/c8-35-dead-code` in worktree `../hivemind-c8-35`, 1 untracked file (`hivemind-steer.ts`), no other modifications
- **Expected delegation depth after Wave 2:** 1
- **Maximum allowed delegation depth:** 3 (iron law)
- **Gate triad execution:** deferred to orchestrator after Wave 2 return
- **Final Option C status (after Wave 2 + gate triad):** ready for user reporting and next-phase authorization

---

**END OF WAVE 2 LANDSCAPE**
