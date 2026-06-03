#!/usr/bin/env bash
# Test helpers for tmux subsystem BATS files.
# Provides path resolution, node invocation, and assertion helpers for
# loading the compiled ESM module from dist/features/tmux/.

# Resolve absolute path to project root (one level up from tests/scripts/tmux/).
export TMUX_BATS_ROOT="${TMUX_BATS_ROOT:-$(cd "$(dirname "$BATS_TEST_FILENAME")/../../.." && pwd)}"
export TMUX_BATS_DIST="${TMUX_BATS_DIST:-${TMUX_BATS_ROOT}/dist/features/tmux}"

# Assert that the dist/ artifacts exist (build is a prerequisite for these tests).
tmux_bats_require_dist() {
  if [[ ! -f "${TMUX_BATS_DIST}/integration.js" ]]; then
    skip "dist/features/tmux/integration.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/types.js" ]]; then
    skip "dist/features/tmux/types.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js" ]]; then
    skip "dist/hooks/pane-monitor.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/persistence.js" ]]; then
    skip "dist/features/tmux/persistence.js missing — run 'npx tsc' first"
  fi
  # P55 additions (D-55-06 — 2 new dist checks for BATS slots 58 + 60)
  if [[ ! -f "${TMUX_BATS_DIST}/grid-planner.js" ]]; then
    skip "dist/features/tmux/grid-planner.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js" ]]; then
    skip "dist/tools/tmux-copilot.js missing — run 'npx tsc' first"
  fi
  # P58 addition (D-58-16) — pool-types.js dist artifact
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/coordination/delegation/pool-types.js" ]]; then
    skip "dist/coordination/delegation/pool-types.js missing — run 'npx tsc' first"
  fi
}

# Run a Node ESM script that imports the in-tree tmux modules.
# Usage: tmux_node_eval '<js-script-as-string>'
# Example: tmux_node_eval 'const m = await import(".../integration.js"); console.log(m.getTmuxVersion("foo"));'
tmux_node_eval() {
  local script="$1"
  (cd "${TMUX_BATS_ROOT}" && node --input-type=module -e "${script}")
}

# Resolve project directory for the current test (uses BATS_TEST_TMPDIR so
# each test gets an isolated workspace).
tmux_bats_project_dir() {
  echo "${BATS_TEST_TMPDIR}/project"
}

# Create a fresh project directory under BATS_TEST_TMPDIR.
tmux_bats_make_project() {
  local dir
  dir="$(tmux_bats_project_dir)"
  mkdir -p "${dir}"
  echo "${dir}"
}
