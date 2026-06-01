# Phase 45: Vendor Sync Script — Specification

**Created:** 2026-06-01
**Ambiguity score:** 0.17 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Create `scripts/sync-fork.sh` that pulls upstream changes from the `shynlee04/opencode-tmux` GitHub fork into the vendored `opencode-tmux/` directory using a 3-way merge, automatically aborting when Hivemind-pinned files would be overwritten, and supporting a `--dry-run` mode that previews the merge without writing.

## Background

The vendored `opencode-tmux/` directory (committed directly into the Hivemind monorepo, not a submodule) contains the `@hivemind/opencode-tmux` fork at v0.6.0 with 22 files tracked. Phase 43 added Hivemind-specific modifications to 4 files:

- `opencode-tmux/src/session-manager.ts` — enriched `hivemindMeta` delegation metadata, public `respawnIfKnown()` method, enriched event type support
- `opencode-tmux/src/grid-planner.ts` — NEW file (120 LOC): DFS preorder pane grid planner with 500ms debounce
- `opencode-tmux/src/__tests__/grid-planner.test.ts` — NEW file (198 LOC): grid-planner test suite
- `opencode-tmux/src/__tests__/session-manager.test.ts` — MODIFIED (80 LOC added): coverage for `hivemindMeta` propagation

These Hivemind-surface changes must be preserved across all future upstream syncs. The fork's package.json (`@hivemind/opencode-tmux`) and unmodified files (tmux.ts, config.ts, index.ts, util.ts, remaining tests) are safe to merge normally.

No sync tooling exists today — developers have no standardized way to pull upstream changes from the fork.

## Requirements

1. **Fetch and merge**: Script pulls from the fork remote and applies a 3-way merge.
   - Current: No sync mechanism exists — vendored directory is static
   - Target: Running `scripts/sync-fork.sh` fetches from `https://github.com/shynlee04/opencode-tmux.git` (main branch), then performs `git merge` into the vendored `opencode-tmux/` working tree
   - Acceptance: After running on a stale vendored copy, new commits from the fork's main branch appear in `opencode-tmux/` and `git log opencode-tmux/` shows the merged fork commits

2. **Hivemind-pinned file protection**: Script detects and aborts when pinned files would be overwritten.
   - Current: Merge would silently overwrite Hivemind-specific changes
   - Target: Before merging, script checks whether any of the 4 pinned files (`src/session-manager.ts`, `src/grid-planner.ts`, `src/__tests__/grid-planner.test.ts`, `src/__tests__/session-manager.test.ts`) would produce merge conflicts in the incoming changes. If any pinned file has conflicts, the script prints the conflicting filename(s) to stderr and exits code 1 WITHOUT modifying any files
   - Acceptance: Injecting a commit that modifies a pinned file into the test remote causes `sync-fork.sh` to exit code 1 with the filename in stderr; `opencode-tmux/src/session-manager.ts` remains unchanged

3. **`--dry-run` mode**: Previews merge without writing.
   - Current: No preview mechanism
   - Target: `scripts/sync-fork.sh --dry-run` fetches from the remote, performs the conflict check, prints a summary of what would be merged (commit count, affected non-pinned files), and exits without modifying `opencode-tmux/`
   - Acceptance: Running `--dry-run` against a remote with new commits prints a merge preview summary; `git status opencode-tmux/` shows no changes; `--dry-run` exits code 0 on success, code 1 on detected pinned-file conflicts

4. **Idempotent execution**: Re-running produces identical results; no persistent state.
   - Current: No sync mechanism to evaluate
   - Target: Script creates a temporary named remote (`hivemind-fork-temp`) for the fetch and removes it after merge or dry-run completes. No files outside `opencode-tmux/` are created or modified. Re-running against the same remote state produces the same outcome
   - Acceptance: Running twice in succession produces `opencode-tmux/` in an identical state (verified via `git diff opencode-tmux/`) and exits with the same status code

5. **Shell test suite**: Three scenarios tested via a shell test framework.
   - Current: No tests exist
   - Target: A `tests/scripts/sync-fork.bats` file (or equivalent) covers:
     - (a) Clean fast-forward: remote has commits that merge cleanly → script succeeds, new commits visible
     - (b) Non-conflicting 3-way merge: remote and local have diverged but no pinned file conflicts → script succeeds, both sets of changes present
     - (c) Conflicting pinned file: remote changes a pinned file → script aborts with code 1 and stderr listing the file, no changes applied
   - Acceptance: `bats tests/scripts/sync-fork.bats` passes all three scenarios

## Boundaries

**In scope:**
- `scripts/sync-fork.sh` — the bash sync script
- `tests/scripts/sync-fork.bats` — shell test suite for the script
- Git-based 3-way merge (fetch + merge)
- Temporary remote management (add/remove within script execution)
- Pinned file conflict detection by filename pattern (4 files)
- `--dry-run` flag for preview mode

**Out of scope:**
- Phase 46 (Build Pipeline) — compiling `opencode-tmux/` into Hivemind's `dist/` — separate phase
- Phase 47 (Install Documentation) — documenting how to install the tmux plugin — separate phase
- Auto-merging pinned files — script MUST abort, never attempt to auto-resolve
- Pushing changes back to the fork — one-way pull only
- Submodule or subtree conversion — vendored-as-files is a locked decision from Phase 43 (commit `7dc30d95`)
- Restoring the fork's git history in `opencode-tmux/.git/` — the vendored copy is history-less

## Constraints

- Script must be bash (tested with `#!/usr/bin/env bash`), targeting macOS (primary dev environment) and Linux (CI)
- Requires `git` >= 2.0 (for `git worktree add` / basic fetch+merge)
- Requires network access to `github.com` on first run (cached via `git fetch` refs)
- Test suite uses `bats` (Bash Automated Testing System) — `brew install bats-core` / `apt install bats`
- The 4 Hivemind-pinned files are hardcoded in the script; if Phase 46+ adds more, the list must be updated
- Excluded from merge consideration by git's native behavior (untracked): `dist/`, `coverage/`, `node_modules/`

## Acceptance Criteria

- [ ] `scripts/sync-fork.sh` fetches from `shynlee04/opencode-tmux` and merges non-conflicting commits into `opencode-tmux/`
- [ ] `scripts/sync-fork.sh` exits code 1 with stderr when a Hivemind-pinned file would conflict, leaving `opencode-tmux/` unchanged
- [ ] `scripts/sync-fork.sh --dry-run` prints merge summary, exits code 0 on success, makes no changes to `opencode-tmux/`
- [ ] Running the script twice is idempotent — `opencode-tmux/` state and exit code are identical
- [ ] No persistent remotes or state files remain after script execution (temp remote cleaned up)
- [ ] `bats tests/scripts/sync-fork.bats` passes all 3 scenarios (clean fast-forward, 3-way merge, pinned-file conflict abort)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | Script name, source, target all clear |
| Boundary Clarity   | 0.82  | 0.70 | ✓      | Pinned files identified, Phases 46/47 excluded |
| Constraint Clarity | 0.78  | 0.65 | ✓      | bash, bats, git >= 2.0 specified |
| Acceptance Criteria| 0.76  | 0.70 | ✓      | 6 pass/fail criteria, 3 bats scenarios |
| **Ambiguity**      | 0.17  | ≤0.20| ✓      | Gate passed                        |

## Interview Log

| Round | Perspective     | Question summary                                      | Decision locked                                   |
|-------|-----------------|------------------------------------------------------|--------------------------------------------------|
| 1     | Researcher      | What files are Hivemind-pinned? What's the source?   | 4 pinned files identified; fork at shynlee04/opencode-tmux |
| 1     | Researcher      | Are dist/coverage/node_modules affected?             | No — git-ignored in fork, already untracked      |
| 2     | Simplifier      | What's the minimum viable sync strategy?             | git fetch + git merge (3-way is native); temp remote |
| 2     | Simplifier      | What test framework?                                 | bats (3 scenarios: ffwd, 3-way, conflict abort)  |

*Auto-selected mode: all decisions derived from codebase scouting and ROADMAP.md. No interactive user questions.*

---

*Phase: 45-vendor-sync-script*
*Spec created: 2026-06-01*
*Next step: /gsd-discuss-phase 45 — implementation decisions (remote naming, error message format, bats setup, etc.)*
