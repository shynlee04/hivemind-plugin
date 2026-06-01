# Phase 45: Vendor Sync Script — Assumptions

**Generated:** 2026-06-01
**Source:** Codebase scouting + 45-SPEC.md analysis
**Ambiguity score (SPEC):** 0.17 — gate passed

---

## Assumption 1: `opencode-tmux/` has no local git history

- **Claim:** The vendored `opencode-tmux/` directory contains regular tracked files with no `.git/` directory. The script must fetch the fork's history into the **monorepo's** git object store and merge into the monorepo working tree, not into a nested repository.
- **Confidence:** HIGH (VERIFIED)
- **Evidence:**
  - `ls -la opencode-tmux/.git` → "No such file or directory" (confirmed history-less copy)
  - `git submodule status` → no output (confirmed NOT a submodule)
  - 21 files tracked directly in monorepo via `git ls-files opencode-tmux/`
- **Risk if wrong:** If upstream ever converts `opencode-tmux/` to a submodule or gitlink, the script would break because `git fetch` targeting a nested directory within the monorepo would behave differently. The script must NOT depend on `opencode-tmux/.git` existing.
- **Mitigation in SPEC:** SPEC already constrains this — "vendored-as-files is a locked decision from Phase 43 (commit 7dc30d95)" — and explicitly scopes out submodule/subtree conversion.

---

## Assumption 2: No fork remote is preconfigured in the monorepo

- **Claim:** The `shynlee04/opencode-tmux` upstream remote does not exist as a named git remote in the monorepo. The script must temporarily add and remove a remote (`hivemind-fork-temp`) each time it runs.
- **Confidence:** HIGH (VERIFIED)
- **Evidence:**
  - `git remote -v` from monorepo root shows only `origin` (`shynlee04/hivemind-plugin-private`) and `public` (`shynlee04/hivemind-plugin`)
  - No remote points to `github.com/shynlee04/opencode-tmux.git`
  - SPEC Requirement 4 mandates temp remote: "Script creates a temporary named remote (hivemind-fork-temp) for the fetch and removes it after merge or dry-run completes"
- **Risk if wrong:** If a future phase adds the fork as a permanent remote, the temp-remote logic would be harmless (add would warn but not fail; `git remote add --no-fetch` checks existence). However, if the remote name clashes with an existing entry, the script must handle `fatal: remote hivemind-fork-temp already exists`.

---

## Assumption 3: `bats` is NOT pre-installed and must be treated as an optional/prerequisite dependency

- **Claim:** The `bats` test runner is not installed on the primary development environment (macOS). The test suite at `tests/scripts/sync-fork.bats` requires bats to execute, but the script itself (`scripts/sync-fork.sh`) does not depend on bats.
- **Confidence:** HIGH (VERIFIED)
- **Evidence:**
  - `which bats` → "bats not found" on macOS dev machine
  - `bats --version` → empty output
  - `package.json` grep for "bats" → no entry in devDependencies or scripts
- **Risk if wrong:** CI or other developer machines may lack bats as well. If the test suite cannot run, the SPEC's AC-5 (`bats tests/scripts/sync-fork.bats passes all three scenarios`) cannot be verified. Two possible resolutions:
  - **Option A:** Document bats as a prerequisite (`brew install bats-core`) and add a `pre-commit` or `npm run test:scripts` script that checks for bats before running
  - **Option B:** Use a pure-bash test runner instead of bats (losing bats' TAP assertion syntax)
- **Fallback in SPEC:** SPEC says "bats (Bash Automated Testing System) — `brew install bats-core` / `apt install bats`", treating bats as a prerequisite rather than a bundled dependency.

---

## Assumption 4: The 4 Hivemind-pinned files are the COMPLETE set for Phase 45

- **Claim:** Only 4 files in `opencode-tmux/` contain Hivemind-specific modifications that must be preserved across merges. All other files (17 remaining tracked files) are safe for normal 3-way merge.
- **Confidence:** HIGH (VERIFIED against SPEC and file listing)
- **Evidence:**
  - SPEC §Background lists exactly 4 files: `session-manager.ts`, `grid-planner.ts`, `__tests__/grid-planner.test.ts`, `__tests__/session-manager.test.ts`
  - `git ls-files opencode-tmux/` shows 21 tracked files (excluding dist/, coverage/, node_modules/)
  - 21 - 4 = 17 files are unmodified fork originals safe for merge
  - SPEC §Boundaries explicitly states: "The 4 Hivemind-pinned files are hardcoded in the script; if Phase 46+ adds more, the list must be updated"
- **Risk if wrong:** If future phases (46+) modify additional fork files without updating the pin list, the script would silently overwrite those Hivemind changes. The pinned file list must be maintainable — consider either:
  - A comment in the script pointing to where to update the list
  - A future mechanism to auto-detect pinned files (e.g., markers in file headers)

---

## Assumption 5: The merge target is the fork's `main` branch (one-way pull, no push)

- **Claim:** The script pulls from `main` branch of `shynlee04/opencode-tmux` and never pushes changes back. The merge is one-directional: upstream → vendored copy.
- **Confidence:** HIGH (CITED — SPEC Requirement 1)
- **Evidence:**
  - SPEC §R1: "fetches from `https://github.com/shynlee04/opencode-tmux.git` (main branch), then performs `git merge`"
  - SPEC §Boundaries: "Pushing changes back to the fork — one-way pull only" is explicitly out of scope
  - SPEC §Background: "No sync tooling exists today — developers have no standardized way to pull upstream changes"
- **Risk if wrong:** If the fork changes its default branch name (e.g., `main` → `master`) in the future, the hardcoded branch reference would break. Mitigation: use `refs/heads/main` for explicitness, or fetch all refs and inspect the remote HEAD symbolic ref.

---

## Assumption 6: Conflict detection is by filename matching, NOT content diff

- **Claim:** The script detects potential pinned-file conflicts by checking whether incoming commits touch any of the 4 pinned files by path. It does NOT perform a content-level 3-way diff against Hivemind's local versions.
- **Confidence:** MEDIUM (CITED from SPEC but implementation detail is ambiguous)
- **Evidence:**
  - SPEC §R2: "script checks whether any of the 4 pinned files ... would produce merge conflicts in the incoming changes"
  - SPEC §Constraints: "Pinned file conflict detection by filename pattern (4 files)"
  - SPEC does NOT specify the detection mechanism — it could be:
    - **Option A (filename check):** `git diff --name-only FETCH_HEAD...main | grep` for pinned filenames → simple, fast, but may produce false positives (upstream change that doesn't actually conflict with Hivemind's changes)
    - **Option B (merge simulation):** `git merge --no-commit --no-ff` then check for conflict markers in pinned files → accurate but slower, leaves merge state
- **Risk if wrong:** If using Option A (filename check), a pinned file that was changed upstream but doesn't conflict textually would cause the script to abort unnecessarily (false positive). If using Option B (merge simulation), the script must handle cleanup of the in-progress merge state on abort.
- **Recommendation:** SPEC §R2's acceptance criterion ("Injecting a commit that modifies a pinned file into the test remote causes sync-fork.sh to exit code 1") implies filename-level detection is sufficient — the test would inject a commit touching a pinned file, and the script must catch it regardless of whether it actually conflicts.

---

## Assumption 7: `tests/scripts/` directory does not exist and must be created

- **Claim:** The `tests/scripts/` directory (destination for `sync-fork.bats`) does not exist. It must be created as part of this phase, and its `.gitkeep` must be registered.
- **Confidence:** HIGH (VERIFIED)
- **Evidence:**
  - `ls tests/scripts/` → "No such file or directory" (confirmed absent)
  - SPEC §R5: "A `tests/scripts/sync-fork.bats` file (or equivalent) covers three scenarios"
- **Risk if wrong:** If the directory is not created and tracked, the bats test file cannot be committed. Additionally, the `.gitignore` does not exclude `tests/scripts/*.sh` or `*.bats` — no gitignore change needed.

---

## Assumption 8: `set -euo pipefail` is sufficient for error handling

- **Claim:** The bash `set -euo pipefail` strict mode (used by existing `scripts/sync-oss.sh`) is adequate for the sync script's error handling. The script does not require a more sophisticated error-handling framework.
- **Confidence:** MEDIUM (VERIFIED — existing pattern)
- **Evidence:**
  - `scripts/sync-oss.sh` uses `set -euo pipefail` with explicit message printing (lines 16-18, 37-44)
  - SPEC §Constraints: "Script must be bash" with `#!/usr/bin/env bash`
  - `git version 2.54.0` — well above the >=2.0 constraint
- **Risk if wrong:** `set -e` has subtle behaviors — a failed command in a conditional (e.g., `if git merge --dry-run; then`) would NOT trigger `set -e`, but a bare command like `git fetch` that fails would exit. If the script uses complex git plumbing, edge cases around `set -e` exit traps must be tested. The bats test suite (AC-5) should cover failure paths to verify this.

---

## Summary

| # | Assumption | Confidence | Source | Impact if Wrong |
|---|-----------|------------|--------|-----------------|
| 1 | `opencode-tmux/` has no `.git/` | HIGH | VERIFIED | Script would fail if dir ever becomes submodule |
| 2 | No fork remote preconfigured | HIGH | VERIFIED | Temp-remote name clash |
| 3 | `bats` not pre-installed | HIGH | VERIFIED | Tests cannot run without install |
| 4 | 4 files = complete pin set | HIGH | VERIFIED | Future pins silently overwritten |
| 5 | Merge target = fork `main` branch | HIGH | CITED | Branch rename breaks fetch |
| 6 | Conflict detection = filename matching | MEDIUM | CITED | False positives/negatives |
| 7 | `tests/scripts/` does not exist | HIGH | VERIFIED | Directory must be created |
| 8 | `set -euo pipefail` sufficient | MEDIUM | VERIFIED | Edge-case exit handling gaps |

**Key risks requiring attention during planning:**
1. **Bats installation** must be documented as a prerequisite or the test framework must be reconsidered
2. **Conflict detection mechanism** (filename vs. merge-simulation) must be decided explicitly — filename check is simpler but less accurate
3. **Pinned file list maintainability** — document in the script where to add new pins as more files are Hivemind-modified
