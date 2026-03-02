#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REFRESH_SCRIPT="$ROOT_DIR/scripts/gx-first-turn-refresh.sh"

PASS_COUNT=0
FAIL_COUNT=0
TMP_WORKDIRS=()

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS: %s\n' "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'FAIL: %s\n' "$1" >&2
}

assert_eq() {
  local expected="$1"
  local actual="$2"
  local message="$3"

  if [ "$expected" = "$actual" ]; then
    pass "$message"
  else
    fail "$message (expected: $expected, actual: $actual)"
  fi
}

assert_jq() {
  local json="$1"
  local expr="$2"
  local message="$3"

  if printf '%s' "$json" | jq -e "$expr" >/dev/null 2>&1; then
    pass "$message"
  else
    fail "$message (jq expr failed: $expr)"
  fi
}

new_workdir() {
  local workdir
  workdir="$(mktemp -d "${TMPDIR:-/tmp}/gx-r2-05-XXXXXX")"
  TMP_WORKDIRS+=("$workdir")
  printf '%s\n' "$workdir"
}

cleanup() {
  local workdir
  if [ "${#TMP_WORKDIRS[@]}" -eq 0 ]; then
    return
  fi

  for workdir in "${TMP_WORKDIRS[@]}"; do
    rm -rf "$workdir"
  done
}

trap cleanup EXIT

create_base_state() {
  local workdir="$1"
  local state_dir="$workdir/.hivemind/state"

  mkdir -p "$state_dir"
  printf '{"nodes":[]}\n' > "$state_dir/hierarchy.json"
  printf '{"id":"gx-profile-1","intent":"build_new"}\n' > "$state_dir/runtime-profile.json"
  printf '{"signals":{"signal_01":90}}\n' > "$state_dir/health-metrics.json"
  printf '{"items":[{"id":"task-1","done":false}]}\n' > "$state_dir/todo.json"
  printf '{"decision":"start"}\n{"decision":"continue"}\n' > "$state_dir/decisions.jsonl"
  printf '{"active_profile":"gx-profile-1"}\n' > "$state_dir/enforcement.json"
}

set_file_25h_old() {
  local file_path="$1"
  local stale_ts

  if stale_ts="$(date -v-25H +%Y%m%d%H%M.%S 2>/dev/null)"; then
    touch -t "$stale_ts" "$file_path"
    return
  fi

  stale_ts="$(date -d '25 hours ago' +%Y%m%d%H%M.%S)"
  touch -t "$stale_ts" "$file_path"
}

run_refresh() {
  local workdir="$1"
  local output
  local exit_code

  set +e
  output="$(bash "$REFRESH_SCRIPT" "$workdir" 2>&1)"
  exit_code=$?
  set -e

  if [ "$exit_code" -ne 0 ]; then
    fail "Refresh script exited non-zero ($exit_code): $output"
    printf '%s\n' "$output"
    return 0
  fi

  if ! printf '%s' "$output" | jq -e '.' >/dev/null 2>&1; then
    fail "Refresh output is not valid JSON: $output"
    printf '%s\n' "$output"
    return 0
  fi

  printf '%s\n' "$output"
}

# 1) Pre-flight: jq check
if command -v jq >/dev/null 2>&1; then
  pass "Pre-flight: jq available"
else
  fail "Pre-flight: jq missing"
  printf '\nResult: %s passed, %s failed\n' "$PASS_COUNT" "$FAIL_COUNT"
  exit 1
fi

if [ ! -f "$REFRESH_SCRIPT" ]; then
  fail "Missing target script: $REFRESH_SCRIPT"
  printf '\nResult: %s passed, %s failed\n' "$PASS_COUNT" "$FAIL_COUNT"
  exit 1
fi

# 2) All files present + fresh
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.status == "fresh"' "All fresh: status=fresh"
assert_jq "$OUTPUT" '.block == false' "All fresh: block=false"

# 3) Critical file missing: hierarchy.json
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
rm -f "$WORKDIR/.hivemind/state/hierarchy.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == true' "Critical missing hierarchy: block=true"
assert_jq "$OUTPUT" '.missing_files | index("hierarchy.json") != null' "Critical missing hierarchy recorded"

# 4) Critical file missing: runtime-profile.json
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
rm -f "$WORKDIR/.hivemind/state/runtime-profile.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == true' "Critical missing runtime-profile: block=true"
assert_jq "$OUTPUT" '.missing_files | index("runtime-profile.json") != null' "Critical missing runtime-profile recorded"

# 5) Important file missing: todo.json
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
rm -f "$WORKDIR/.hivemind/state/todo.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == false' "Important missing todo: block=false"
assert_jq "$OUTPUT" '.missing_files | index("todo.json") != null' "Important missing todo recorded"

# 6) Optional file missing: decisions.jsonl
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
rm -f "$WORKDIR/.hivemind/state/decisions.jsonl"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == false' "Optional missing decisions: block=false"
assert_jq "$OUTPUT" '.missing_files | index("decisions.jsonl") != null' "Optional missing decisions recorded"

# 7) Critical file stale: hierarchy.json
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
set_file_25h_old "$WORKDIR/.hivemind/state/hierarchy.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == true' "Critical stale hierarchy: block=true"
assert_jq "$OUTPUT" '.stale_files | map(.name) | index("hierarchy.json") != null' "Critical stale hierarchy recorded"

# 8) Important file stale: health-metrics.json
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
set_file_25h_old "$WORKDIR/.hivemind/state/health-metrics.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == false' "Important stale health-metrics: block=false"
assert_jq "$OUTPUT" '.stale_files | map(.name) | index("health-metrics.json") != null' "Important stale health-metrics recorded"

# 9) Corrupt JSON: runtime-profile.json
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
printf '{invalid-json\n' > "$WORKDIR/.hivemind/state/runtime-profile.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == true' "Corrupt critical JSON: block=true"
assert_jq "$OUTPUT" '.corrupt_files | index("runtime-profile.json") != null' "Corrupt runtime-profile recorded"

# 10) JSONL validation: valid first/last lines in decisions.jsonl
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.corrupt_files | index("decisions.jsonl") == null' "Valid JSONL is not marked corrupt"

# 11) files_checked count: 6
assert_jq "$OUTPUT" '.files_checked == 6' "files_checked equals 6"

# 12) files_read count: only successfully read files
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
rm -f "$WORKDIR/.hivemind/state/decisions.jsonl"
printf '{broken\n' > "$WORKDIR/.hivemind/state/runtime-profile.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.files_read == 4' "files_read counts only successfully read files"

# 13) Fresh project (no .hivemind/state dir)
WORKDIR="$(new_workdir)"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.block == true' "Fresh project without state dir: block=true"
assert_jq "$OUTPUT" '.recommendation | contains("gx-entry-guard.sh")' "Fresh project recommendation mentions gx-entry-guard.sh"

# 14) Mixed state categorization
WORKDIR="$(new_workdir)"
create_base_state "$WORKDIR"
rm -f "$WORKDIR/.hivemind/state/runtime-profile.json"
set_file_25h_old "$WORKDIR/.hivemind/state/health-metrics.json"
printf '{oops\n' > "$WORKDIR/.hivemind/state/todo.json"
OUTPUT="$(run_refresh "$WORKDIR")"
assert_jq "$OUTPUT" '.missing_files | index("runtime-profile.json") != null' "Mixed state: missing file categorized"
assert_jq "$OUTPUT" '.stale_files | map(.name) | index("health-metrics.json") != null' "Mixed state: stale file categorized"
assert_jq "$OUTPUT" '.corrupt_files | index("todo.json") != null' "Mixed state: corrupt file categorized"
assert_jq "$OUTPUT" '.block == true' "Mixed state: block=true due to critical issue"

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf '\nResult: %s passed, %s failed\n' "$PASS_COUNT" "$FAIL_COUNT"
  exit 1
fi

printf '\nResult: %s passed, %s failed\n' "$PASS_COUNT" "$FAIL_COUNT"
exit 0
