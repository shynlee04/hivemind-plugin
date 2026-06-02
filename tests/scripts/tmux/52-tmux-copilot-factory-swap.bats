#!/usr/bin/env bats
#
# 52-tmux-copilot-factory-swap.bats — Phase 52 acceptance criteria verification.
#
# Verifies the buildNoopForkSessionManager → buildInTreeSessionManager factory
# rename is complete, with no stragglers. The factory swap is the central
# P52 deliverable (REQ-52-01).

load "helpers"

setup() {
  tmux_bats_require_dist
}

# REQ-52-01 acceptance: `git grep buildNoopForkSessionManager src/` returns empty.
@test "no remaining buildNoopForkSessionManager references in src/" {
  if ! command -v git >/dev/null 2>&1; then
    skip "git not available"
  fi
  run bash -c "cd '${TMUX_BATS_ROOT}' && git grep buildNoopForkSessionManager src/ 2>/dev/null; true"
  [ "$status" -eq 0 ]
  # Strip whitespace — if there are no matches, the output is empty.
  trimmed=$(echo "$output" | tr -d '[:space:]')
  [ -z "$trimmed" ]
}

# REQ-52-01 acceptance: `git grep buildInTreeSessionManager src/` returns exactly
# 1 function definition and 1 call site in src/plugin.ts.
@test "buildInTreeSessionManager has exactly 1 definition + 1 call site in src/plugin.ts" {
  if ! command -v git >/dev/null 2>&1; then
    skip "git not available"
  fi
  run bash -c "cd '${TMUX_BATS_ROOT}' && git grep -n buildInTreeSessionManager src/ 2>/dev/null"
  [ "$status" -eq 0 ]
  # Expect exactly 2 lines: 1 function definition + 1 call site
  line_count=$(echo "$output" | wc -l | tr -d ' ')
  [[ "$line_count" -eq 2 ]]
  # Expect both hits in src/plugin.ts
  [[ "$output" == *"src/plugin.ts"* ]]
}

# REQ-52-01 acceptance: the function name appears as `function buildInTreeSessionManager`
# (not as a string literal in a comment, and not exported separately).
@test "buildInTreeSessionManager is a function definition, not a string literal" {
  run grep -nE "^function buildInTreeSessionManager\b" src/plugin.ts
  [ "$status" -eq 0 ]
  # Must find at least 1 line starting with `function buildInTreeSessionManager`
  [[ "$output" == *"function buildInTreeSessionManager"* ]]
}
