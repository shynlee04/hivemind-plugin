#!/usr/bin/env bats
#
# 67-delegate-task-no-native-task-tool.bats — Phase 58 REQ-58-01 acceptance:
# delegate-task must not invoke the native task tool from @opencode-ai/plugin.
# Slot 67 (renamed from slot 61 per 58-CONTEXT.md:252 deferred-idea resolution:
# P56 owns tests/scripts/tmux/61-stress-test-real-world-workflow.bats).
# 3 grep assertions: (a) no `from "@opencode-ai/plugin"` import with `task`,
# (b) no `createTaskTool` factory usage, (c) POLICY (P58, G1) comment present.

load "helpers"

setup() {
  # No tmux session needed — pure grep assertions.
  # tmux_bats_require_dist NOT needed (no dist/ dependency for grep).
  cd "${TMUX_BATS_ROOT}"
}

teardown() {
  # No teardown needed.
  :
}

@test "delegate-task does not invoke native task tool (G1, slot 67 — P58)" {
  # Assertion 1: no native task shortcut import (covers subpath @opencode-ai/plugin/task)
  # Exclude comment lines (any line containing //) to avoid matching the
  # POLICY (P58, G1) comment that documents the ban.
  # Use a tempfile to avoid bash quote-escaping issues with the regex.
  local tmp_grep="$(mktemp)"
  grep -rnE "from ['\"]@opencode-ai/plugin(/task)?['\"]" src/tools/delegation/ \
    | grep -v '//' \
    | grep -E "\btask\b" > "$tmp_grep" 2>&1 || true
  run cat "$tmp_grep"
  rm -f "$tmp_grep"
  [ "$status" -eq 0 ]
  [ -z "$output" ]  # output must be empty (no matching non-comment lines)

  # Assertion 2: no createTaskTool factory function usage
  run grep -rE "createTaskTool" src/tools/delegation/
  [ "$status" -eq 1 ]  # grep returns no matches (exit 1)

  # Assertion 3: POLICY (P58, G1) comment is present in delegate-task.ts
  run bash -c "grep -c 'POLICY (P58, G1)' src/tools/delegation/delegate-task.ts"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]
}
