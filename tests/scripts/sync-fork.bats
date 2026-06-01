#!/usr/bin/env bats
#
# tests/scripts/sync-fork.bats
#
# Integration tests for scripts/sync-fork.sh — verifies fast-forward
# merges, non-pinned conflict detection, and pinned-file conflict
# detection.  Uses a local bare repo to simulate the upstream fork;
# no network calls are made.

bats_require_minimum_version 1.7.0

# ── Path helpers ──────────────────────────────────────────────────
# File layout:
#   tests/scripts/sync-fork.bats    →  $BATS_TEST_FILENAME
#   scripts/sync-fork.sh            →  ../../scripts/sync-fork.sh
HARNESS_ROOT="$(cd "${BATS_TEST_FILENAME%/*}/../.." && pwd)"
SYNC_FORK_SH="$HARNESS_ROOT/scripts/sync-fork.sh"

# ── Fixture setup (runs before EACH test) ────────────────────────
setup() {
  # Each test gets an isolated BATS_TEST_TMPDIR — no cross-test pollution.
  #
  # ┌─────────────────────────────────────────┐
  # │  BATS_TEST_TMPDIR                       │
  # │  ├── upstream-fork.git   (bare remote)  │
  # │  ├── fork-wt             (clone of bare)│
  # │  └── hivemind-test       (working repo) │
  # └─────────────────────────────────────────┘
  WORK="$BATS_TEST_TMPDIR/hivemind-test"
  FORK_BARE="$BATS_TEST_TMPDIR/upstream-fork.git"
  FORK_WT="$BATS_TEST_TMPDIR/fork-wt"

  # ── 1. Create upstream fork (bare) ─────────────────────────────
  git init -q --bare --initial-branch=main "$FORK_BARE"

  # ── 2. Populate upstream with the initial vendored structure ───
  (
    git clone -q "$FORK_BARE" "$FORK_WT"
    cd "$FORK_WT"
    git config user.email "upstream@example.com"
    git config user.name "Upstream Maintainer"

    mkdir -p opencode-tmux/src/__tests__

    printf '%s\n' \
      'export class SessionManager {' \
      '  greet(): string { return "upstream-init"; }' \
      '}' \
      > opencode-tmux/src/session-manager.ts

    printf '%s\n' \
      'export class GridPlanner {' \
      '  plan(): string { return "upstream-init"; }' \
      '}' \
      > opencode-tmux/src/grid-planner.ts

    printf '%s\n' \
      'export const tmuxVersion = "1.0";' \
      > opencode-tmux/src/tmux.ts

    printf '%s\n' \
      'export const config = { version: "1.0" };' \
      > opencode-tmux/src/config.ts

    printf '%s\n' \
      'import { describe, it, expect } from "vitest";' \
      'it("placeholder", () => expect(true).toBe(true));' \
      > opencode-tmux/src/__tests__/session-manager.test.ts

    printf '%s\n' \
      'import { describe, it, expect } from "vitest";' \
      'it("placeholder", () => expect(true).toBe(true));' \
      > opencode-tmux/src/__tests__/grid-planner.test.ts

    printf '%s\n' '{ "name": "opencode-tmux", "version": "1.0.0" }' \
      > opencode-tmux/package.json

    printf '%s\n' '# upstream-fork' > README.md

    git add -A
    git commit -q -m "feat: initial vendored structure"
    git push -q origin main
  )

  # ── 3. Clone fork into "Hivemind monorepo" working repo ────────
  git clone -q "$FORK_BARE" "$WORK"
  (
    cd "$WORK"
    git config user.email "hivemind@example.com"
    git config user.name "Hivemind Dev"

    # Monorepo marker so the repo is not a pure fork clone.
    # NOTE: do NOT push this marker to the upstream bare — WORK must
    # have a divergence from what's in the bare for merge-tree to work
    # correctly (the bare only tracks upstream commits).
    printf '%s\n' \
      'Hivemind monorepo root marker.' \
      > hivemind-marker.txt
    git add hivemind-marker.txt
    git commit -q -m "chore: add Hivemind monorepo marker"
  )

  # ── 4. Export env vars the script reads ────────────────────────
  export SYNC_FORK_REMOTE_URL="$FORK_BARE"
  export SYNC_FORK_BRANCH="main"
}

# teardown runs after each test — reset cwd in case a test changed it.
teardown() {
  cd "$BATS_TEST_TMPDIR" 2>/dev/null || true
}

# ── Helpers ──────────────────────────────────────────────────────

# Add a commit to the upstream fork and push.
# Usage: upstream_commit <relative-path> <body-text> <commit-message>
upstream_commit() {
  local path="$1"
  local content="$2"
  local msg="$3"
  (
    cd "$FORK_WT"
    printf '%s\n' "$content" > "$path"
    git add "$path"
    git commit -q -m "$msg"
    git push -q origin main
  )
}

# ── Test 1: Clean fast-forward merge (non-pinned change) ─────────
@test "scenario 1 — clean fast-forward: non-pinned upstream commit merges" {
  upstream_commit "opencode-tmux/src/tmux.ts" \
    "export const tmuxVersion = \"2.0\";" \
    "feat: bump tmux to v2"

  run bash -c "cd '$WORK' && SYNC_FORK_REMOTE_URL='$FORK_BARE' '$SYNC_FORK_SH'"

  [ "$status" -eq 0 ]
  [[ "$output" == *"Sync complete"* ]]

  # Verify the new upstream content landed in the working repo
  run cat "$WORK/opencode-tmux/src/tmux.ts"
  [ "$status" -eq 0 ]
  [[ "$output" == *"tmuxVersion = \"2.0\""* ]]
}

# ── Test 2: Non-pinned conflict → merge fails, script exits 1 ───
@test "scenario 2 — three-way merge conflict: both sides modify same non-pinned file" {
  # Local advances on a non-pinned file
  printf '%s\n' \
    'export const config = { version: "local-v2" };' \
    > "$WORK/opencode-tmux/src/config.ts"
  (
    cd "$WORK"
    git add opencode-tmux/src/config.ts
    git commit -q -m "local: tweak config"
  )

  # Upstream advances the same non-pinned file — creates a real conflict
  upstream_commit "opencode-tmux/src/config.ts" \
    "export const config = { version: \"upstream-v2\" };" \
    "upstream: update config"

  run bash -c "cd '$WORK' && SYNC_FORK_REMOTE_URL='$FORK_BARE' '$SYNC_FORK_SH'"

  [ "$status" -ne 0 ]
  [[ "$output" == *"Non-pinned conflicts detected"* ]]
  [[ "$output" != *"pinned"* ]]
  [[ ! "$output" == *"Sync complete"* ]]
}

# ── Test 3: Pinned-file conflict → script aborts with exit 1 ────
@test "scenario 3 — pinned file conflict: upstream modifies session-manager.ts" {
  # Local advances on an ACTUALLY pinned file
  printf '%s\n' \
    'export class SessionManager {' \
    '  greet(): string { return "hivemind-local"; }' \
    '}' \
    > "$WORK/opencode-tmux/src/session-manager.ts"
  (
    cd "$WORK"
    git add opencode-tmux/src/session-manager.ts
    git commit -q -m "local: customize SessionManager"
  )

  # Upstream also modifies the same pinned file — creates a conflict
  # on a file the script must protect.
  upstream_commit "opencode-tmux/src/session-manager.ts" \
    "export class SessionManager {
  greet(): string { return \"upstream-change\"; }
}" \
    "upstream: change SessionManager"

  # Snapshot the pre-merge file content (script should NOT touch it)
  local expected
  expected=$(cat "$WORK/opencode-tmux/src/session-manager.ts")

  run bash -c "cd '$WORK' && SYNC_FORK_REMOTE_URL='$FORK_BARE' '$SYNC_FORK_SH'"

  [ "$status" -eq 1 ]
  [[ "$output" == *"pinned"* ]]
  [[ "$output" == *"session-manager.ts"* ]]
  [[ ! "$output" == *"Sync complete"* ]]
  [[ ! "$output" == *"Non-pinned"* ]]

  # Pinned file must be untouched — no conflict markers, no upstream content
  local actual
  actual=$(cat "$WORK/opencode-tmux/src/session-manager.ts")
  [ "$expected" = "$actual" ]
}
