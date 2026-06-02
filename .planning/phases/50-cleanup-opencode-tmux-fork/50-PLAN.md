# Phase 50 — Cleanup Vendored opencode-tmux Fork

**Phase Number:** 50
**Phase Name:** cleanup-opencode-tmux-fork
**Plan Version:** 1.0
**Generated:** 2026-06-02
**Author:** gsd-planner (subagent of hm-l0-orchestrator)
**Upstream Artifacts:** 50-SPEC.md (CP4 · `beb024f5`) · 50-CONTEXT.md (CP5 · `ad43e657`) · 50-RESEARCH.md (CP6 · `2625d83a`) · 50-PATTERNS.md (CP7 · `fd4668d6`)

## Goal

Eliminate the vendored `opencode-tmux/` fork from the repository to complete the
external-fork → in-tree synthesis transition initiated in earlier phases, while
preserving runtime safety via the D-04 graceful-fallback already present in
`src/features/tmux/integration.ts:189-202`.

**Outcome:** `opencode-tmux/` no longer exists in the working tree; the harness
ships a single, internally-maintained PTY implementation sourced from
`src/features/tmux/`; the changelog documents the removal; CI no longer runs
the `bats-vendor-sync` job; the runtime exhibits graceful-degradation when the
fork path is absent.

**Locked Decisions:**
- **D-P50-EARS5-NARROW-2026-06-02 (Option B):** narrows EARS-5 to (i) harness
  still typechecks and tests pass, and (ii) tmux adapter resolves with a
  structured "not available" signal — no exotic recovery path required.

## Scope

### In Scope
1. Delete `opencode-tmux/` directory (15 entries: 932 LOC src + 1820 LOC test).
2. Delete `scripts/sync-fork.sh` (126 LOC).
3. Delete `tests/scripts/sync-fork.bats` (210 LOC).
4. Edit `.github/workflows/ci.yml` lines 64-82 to remove the `bats-vendor-sync`
   job.
5. Add new `### Removed` subsection under `[Unreleased]` in `CHANGELOG.md`
   documenting the fork removal (Q4 decision).
6. Verify `AGENTS.md` has no `opencode-tmux` references (Q3 no-op — grep must
   return 0).
7. Pre-EXECUTE tar.gz backup of `opencode-tmux/` to `/tmp/` for emergency
   recovery.
8. Atomic commit of all changes in CP9 with conventional commit message.

### Out of Scope
- Modifying `src/features/tmux/integration.ts` (D-04 already provides the
  graceful-fallback runtime safety net; no code change needed).
- Modifying `.hivemind/session-tracker/*` (append-only journal; preserved).
- Re-architecting the in-tree PTY implementation (PIVOT phase 51-55 territory).
- Updating `package.json` (no scripts reference the deleted paths after
  removal).
- `src/index.ts` re-exports (no path currently re-exports from
  `opencode-tmux/`).

## Task Breakdown

### T1: Pre-EXECUTE Safety Backup
- **EARS Coverage:** EARS-6
- **Files:** `/tmp/opencode-tmux-backup-<unix-ts>.tar.gz` (create, not tracked)
- **Action:** Create a tar.gz backup of `opencode-tmux/` in `/tmp/` for
  emergency recovery if the deletion needs to be reversed. Filename pattern:
  `opencode-tmux-backup-$(date +%s).tar.gz`.
- **Verify:**
  ```bash
  ls -la /tmp/opencode-tmux-backup-*.tar.gz | tail -1
  ```
  Shows a non-zero file size; archive extracts to a tree with the same 15
  entries as the original directory.
- **Done:** Backup archive exists with content matching `opencode-tmux/`
  pre-deletion state. Archive is OUTSIDE the repo (in `/tmp/`) so it will
  not be staged by any git operation.

### T2: Verify Q3 AGENTS.md No-Op
- **EARS Coverage:** EARS-1
- **Files:** `AGENTS.md` (read-only)
- **Action:** Run `grep -c "opencode-tmux" AGENTS.md` and confirm output is
  `0`. Per Q3 decision (CONTEXT.md) and the PATTERNS report subagent grep
  finding (which returned 0 matches across 18 documentation files), no edit
  to `AGENTS.md` is required. This is a verification-only task — no
  modification is performed.
- **Verify:**
  ```bash
  grep -c "opencode-tmux" AGENTS.md
  ```
  Exits 0 with no output (i.e., count is 0).
- **Done:** AGENTS.md is confirmed free of `opencode-tmux` references; no
  file modification performed.

### T3: Update CHANGELOG.md with Removed Section
- **EARS Coverage:** EARS-2
- **Files:** `CHANGELOG.md` (write)
- **Action:** Insert a new `### Removed` subsection under `[Unreleased]`
  (placed between the existing `### Fixed` block and the `## [0.1.0]`
  heading) following Keep a Changelog format. Add one bullet documenting
  the fork removal with cross-reference to the D-04 graceful-fallback
  runtime safety net in `src/features/tmux/integration.ts`.
- **Verify:**
  ```bash
  grep -A3 "^### Removed" CHANGELOG.md | head -6
  ```
  Shows the new section heading and the first bullet.
- **Done:** CHANGELOG.md has a new `### Removed` section under `[Unreleased]`
  with at least one bullet referencing the cleanup and D-04 fallback.

### T4: Delete opencode-tmux/ Directory
- **EARS Coverage:** EARS-3
- **Files:** `opencode-tmux/` (delete, 15 entries)
- **Action:** Remove the entire `opencode-tmux/` directory tree using
  `git rm -rf opencode-tmux/`. This stages the deletion in the git index
  while physically removing the files from the working tree. The command
  must NOT be `git rm -rf *` (would also delete the parent or any sibling
  directories; the explicit subpath is critical).
- **Verify:**
  ```bash
  ls opencode-tmux/ 2>&1 | head -1
  git status --short | grep -c "^D.*opencode-tmux/"
  ```
  First command returns "No such file or directory"; second returns 15
  (one line per staged deletion).
- **Done:** Directory removed from working tree and 15 entries staged in
  git index for commit in CP9.

### T5: Delete Fork Sync Script and Test
- **EARS Coverage:** EARS-4 (part 1)
- **Files:** `scripts/sync-fork.sh`, `tests/scripts/sync-fork.bats` (delete)
- **Action:** Remove both files using `git rm`. The sync script has no
  remaining call sites after `opencode-tmux/` is gone; the bats test is
  orphaned by the same deletion. No other file in the repo imports from
  these paths (verified pre-plan via `grep -r "sync-fork" --include="*.ts"
  --include="*.sh" --include="*.bats" --include="*.yml" .` returning only
  the 3 deletion targets and the CI job).
- **Verify:**
  ```bash
  ls scripts/sync-fork.sh tests/scripts/sync-fork.bats 2>&1
  git status --short | grep -cE "^D.*sync-fork"
  ```
  First command shows "No such file or directory" for both paths; second
  returns 2.
- **Done:** Both files removed from working tree and staged in git index.

### T6: Remove bats-vendor-sync Job from CI Workflow
- **EARS Coverage:** EARS-4 (part 2)
- **Files:** `.github/workflows/ci.yml` (edit lines 64-82)
- **Action:** Remove the `bats-vendor-sync` job definition (19 lines,
  L64-L82 inclusive) from the CI workflow. The job references the deleted
  `tests/scripts/sync-fork.bats` test and would fail after T5. Use the
  Edit tool with an exact-match string covering the full job block
  (job name, runs-on, steps, and trailing blank line) to ensure no
  orphan whitespace remains.
- **Verify:**
  ```bash
  grep -c "bats-vendor-sync" .github/workflows/ci.yml
  grep -c "sync-fork" .github/workflows/ci.yml
  ```
  Both return 0.
- **Done:** CI workflow no longer contains the `bats-vendor-sync` job or
  any reference to the deleted sync script. File is in a parseable YAML
  state (no orphan indentation).

### T7: Verify Clean State (EXECUTE-phase prelude)
- **EARS Coverage:** EARS-5, EARS-7
- **Files:** all staged files (verification only — commit happens in CP9)
- **Action:** Run the full verification suite:
  1. `git grep -n 'opencode-tmux' -- ':!*.md' | wc -l` must return 0
     (no non-markdown references remain in the working tree).
  2. `grep -c "opencode-tmux" CHANGELOG.md` must return ≥1 (the
     documentation entry from T3 is expected and required).
  3. `npm run typecheck` must pass (TypeScript strict mode, 0 errors).
  4. `npm test` must pass with 2,963+ tests, including
     `tests/lib/tmux/integration.test.ts:310,315` which mock `existsSync`
     to validate the D-04 graceful fallback.
  5. `git diff --stat .hivemind/session-tracker/` must be empty
     (append-only contract preserved — T1 backup lives in `/tmp/`, not
     in the repo).
  6. `git status --short` confirms the expected file set: 15 deletions
     under `opencode-tmux/`, 2 deletions (`scripts/sync-fork.sh`,
     `tests/scripts/sync-fork.bats`), 1 modification
     (`.github/workflows/ci.yml`), 1 modification (`CHANGELOG.md`).
- **Verify:** All six verification commands exit 0 with the expected
  outputs.
- **Done:** Working tree passes all six checks; ready for the CP9 EXECUTE
  atomic commit. The CP9 commit will use `git add -u .` (NOT `-A` — that
  flag is what preserves the append-only `.hivemind/session-tracker/`
  contract because `-u` only stages modifications to tracked files, never
  new untracked files).

## Dependency Analysis

```
Wave 1 (parallel-safe):  T1 ─┐
                            ├─> Wave 2: T4 ─> Wave 3: T5 ─> Wave 4: T6 ─> Wave 5: T7
                            │
Wave 1 (parallel-safe):  T2 ─┤
                            │
Wave 1 (parallel-safe):  T3 ─┘
```

- **T1, T2, T3** are parallel-safe: no file overlap, no shared state, no
  ordering constraint between them.
- **T4** must precede T5: T5's tests/scripts/sync-fork.bats doesn't
  reference T4's tree directly, but T4's deletion exposes T5's orphan
  status (proves the sync script has no remaining call sites).
- **T5** must precede T6: the CI job is invalid after the test file is
  gone (the job's `run:` step invokes `bats tests/scripts/sync-fork.bats`).
- **T6** must precede T7: T7's grep verification includes the CI workflow
  cleanliness check.
- **T7** must follow all other tasks: T7 verifies the cumulative state and
  prepares the CP9 commit.

## Goal-Backward Verification

| EARS-ID | Statement | Satisfied By | Verification |
|---------|-----------|--------------|--------------|
| EARS-1 | AGENTS.md has no `opencode-tmux` references | T2 | `grep -c "opencode-tmux" AGENTS.md` = 0 |
| EARS-2 | CHANGELOG.md documents the removal | T3 | New `### Removed` section under `[Unreleased]` containing ≥1 bullet |
| EARS-3 | `opencode-tmux/` directory is removed from the working tree | T4 | `ls opencode-tmux/` returns "No such file or directory" |
| EARS-4 | Sync script, bats test, and CI job are all removed | T5, T6 | `ls` of deleted paths fails + `grep -c "bats-vendor-sync" .github/workflows/ci.yml` = 0 + `grep -c "sync-fork" .github/workflows/ci.yml` = 0 |
| EARS-5 | Harness still functions after removal (narrowed per D-P50-EARS5-NARROW-2026-06-02 Option B) | T7 | `npm run typecheck` exits 0; `npm test` passes 2,963+ tests including `tests/lib/tmux/integration.test.ts:310,315` which mock `existsSync` to validate graceful fallback |
| EARS-6 | Backup of `opencode-tmux/` exists in `/tmp/` before deletion | T1 | `ls /tmp/opencode-tmux-backup-*.tar.gz` returns the file with non-zero size |
| EARS-7 | Atomic commit in CP9 records all changes | T7 (verify) → CP9 (commit) | `git log -1 --format=%H` shows new commit hash; `.hivemind/session-tracker/` byte-identical to pre-P50 state |

**Coverage:** 7/7 EARS requirements satisfied.
**Composite Risk Score:** 0.05 (RESEARCH.md §9), target ≤ 0.20 — PASS.

## Risk Surface

| Risk ID | Description | Likelihood | Impact | Mitigation |
|---------|-------------|------------|--------|------------|
| R-P50-01 | Accidental deletion of `src/features/tmux/` instead of `opencode-tmux/` (typo on the rm path) | Low | High | T1 backup + explicit `git rm -rf opencode-tmux/` (not `*`); T7 grep verifies `src/` untouched via `git grep "features/tmux"` matching only the expected 2 files |
| R-P50-02 | D-04 fallback doesn't actually cover all call sites | Low | Medium | `src/features/tmux/integration.ts:189-202` `existsSync` check is the documented safety net; mocked test at `tests/lib/tmux/integration.test.ts:310,315` validates behavior; P50 does not modify this code, so prior validation stands. T7's `npm test` will catch any regression. |
| R-P50-03 | `git add -A` accidentally stages `.hivemind/session-tracker/` mutations in CP9 | Medium | High | T7's verification step 5 (`git diff --stat .hivemind/session-tracker/` empty) catches this BEFORE the commit. Additionally, the CP9 commit will use `git add -u .` not `-A`. |
| R-P50-04 | CI workflow retains a stale `bats-vendor-sync` reference after T6 edit | Low | Medium | T6 verification greps both `bats-vendor-sync` and `sync-fork`; T7 runs `npm run typecheck` (does not catch YAML issues but the next CI run will). The 19-line block edit is bounded — partial removal would be visible in the diff. |
| R-P50-05 | Append-only contract violation by `git add -u` in CP9 | Very Low | High | `git add -u` only stages modifications to already-tracked files; never adds untracked files. Session-tracker files ARE tracked (they exist in HEAD), so modifications would be staged — but P50 does not modify them, and T7's verification step 5 confirms this BEFORE the commit. |
| R-P50-06 | CHANGELOG.md entry uses wrong Keep a Changelog subsection ordering | Low | Low | The CHANGELOG.md order is Added → Fixed → (new) Removed → next version. T3 verification greps for `### Removed` after the `### Fixed` block. |
| R-P50-07 | T1 backup accidentally lands inside the repo and gets staged | Very Low | Medium | Backup target is `/tmp/` (absolute path outside the repo root), and the filename pattern `opencode-tmux-backup-*.tar.gz` is not in `.gitignore` only because it's outside the repo entirely. |

## Execution Order

**Wave 1 (parallel-safe, 3 tasks):** T1, T2, T3
**Wave 2 (sequential, depends on Wave 1):** T4
**Wave 3 (depends on T4):** T5
**Wave 4 (depends on T5):** T6
**Wave 5 (depends on all, prelude to CP9 commit):** T7

Total: 5 waves, 7 tasks. Sequential except for the first wave. No parallel
delegation needed — the phase is simple enough that single-agent execution
preserves quality without splitting work.

## Definition of Done

- [ ] **EARS-1:** `grep -c "opencode-tmux" AGENTS.md` returns 0 (Q3 no-op
      confirmed; no file modification performed in T2)
- [ ] **EARS-2:** `CHANGELOG.md` has new `### Removed` section under
      `[Unreleased]` containing at least one bullet referencing the
      cleanup and the D-04 graceful fallback
- [ ] **EARS-3:** `opencode-tmux/` directory does not exist; `git status
      --short | grep -c "^D.*opencode-tmux/"` returns 15
- [ ] **EARS-4a:** `scripts/sync-fork.sh` and `tests/scripts/sync-fork.bats`
      do not exist; `git status --short | grep -cE "^D.*sync-fork"`
      returns 2
- [ ] **EARS-4b:** `grep -c "bats-vendor-sync" .github/workflows/ci.yml`
      returns 0; `grep -c "sync-fork" .github/workflows/ci.yml` returns 0
- [ ] **EARS-5:** `npm run typecheck` exits 0; `npm test` exits 0 with
      2,963+ tests passing
- [ ] **EARS-6:** `ls /tmp/opencode-tmux-backup-*.tar.gz` shows the
      backup file with non-zero size
- [ ] **EARS-7a:** `git grep -n 'opencode-tmux' -- ':!*.md' | wc -l` returns 0
- [ ] **EARS-7b:** `git diff --stat .hivemind/session-tracker/` is empty
      (append-only contract preserved)
- [ ] **CP8 PLANNING commit:** 50-PLAN.md committed with message
      `P50 Checkpoint 8: 50-PLAN.md — 7-task EXECUTE plan, goal-backward EARS coverage verified`
- [ ] **CP9 EXECUTE commit (deferred):** atomic commit using
      `git add -u .` (not `-A`) with the execution-phase commit message
      (to be defined in CP9, per CONTRIBUTING.md commit conventions)
- [ ] All 7 EARS requirements marked satisfied in the Goal-Backward
      Verification table
