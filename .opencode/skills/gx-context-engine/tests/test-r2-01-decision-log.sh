#!/usr/bin/env bash
# TDD test suite for gx-decision-log.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/gx-decision-log.sh"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

PASS=0
FAIL=0
TOTAL=0
CMD_OUTPUT=""
CMD_STATUS=0

assert() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (expected: $expected, got: $actual)"
    FAIL=$((FAIL + 1))
  fi
}

assert_true() {
  local desc="$1"
  local condition="$2"
  TOTAL=$((TOTAL + 1))
  if eval "$condition"; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local desc="$1"
  local haystack="$2"
  local needle="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (missing: $needle)"
    FAIL=$((FAIL + 1))
  fi
}

run_cmd() {
  set +e
  CMD_OUTPUT="$("$@" 2>&1)"
  CMD_STATUS=$?
  set -e
}

echo "=== TDD Test: R2-01 Decision Log ==="

if [ ! -f "$SCRIPT" ]; then
  echo "  FAIL: Script exists ($SCRIPT)"
  echo ""
  echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
  exit 1
fi

WORKDIR="$TMPDIR/workdir"
LOG_FILE="$WORKDIR/.hivemind/state/decisions.jsonl"

# 1. Pre-flight: jq not found -> graceful error JSON
NOJQ_PATH="$TMPDIR/empty-path"
mkdir -p "$NOJQ_PATH"
run_cmd env PATH="$NOJQ_PATH" /bin/bash "$SCRIPT" "$TMPDIR/nojq" count
assert "Pre-flight jq missing exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Pre-flight jq missing returns error JSON" "$CMD_OUTPUT" '"error":"jq_not_found"'

# 2. Append: missing required fields -> error JSON with field names
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" append '{"content":"x","module":"gx","topic":"decision"}'
assert "Append missing fields exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Append missing fields reports missing_fields" "$CMD_OUTPUT" '"error":"missing_fields"'
assert_contains "Append missing fields includes rationale" "$CMD_OUTPUT" "rationale"

# 3. Append valid input -> creates JSONL file with 1 line
JSON_ONE='{"content":"Use slug ids","rationale":"Readable","module":"gx","topic":"decision","hierarchy_node":"action/fix-schemas","agent":"hivefiver","session_id":"ses_abc123"}'
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" append "$JSON_ONE"
assert "Append valid input exits zero" "0" "$CMD_STATUS"
assert_true "Append valid input creates JSONL file" "[ -f \"$LOG_FILE\" ]"
LINE_COUNT=$(wc -l < "$LOG_FILE" | tr -d ' ')
assert "Append valid input creates one line" "1" "$LINE_COUNT"
ID_ONE=$(printf '%s' "$CMD_OUTPUT" | jq -r '.id')
TS_ONE=$(printf '%s' "$CMD_OUTPUT" | jq -r '.timestamp')

# 4. Append second input -> file has 2 lines
JSON_TWO='{"content":"Track supersession","rationale":"Need decision lineage","module":"gx","topic":"decision","hierarchy_node":"action/fix-schemas","agent":"hivefiver","session_id":"ses_abc123"}'
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" append "$JSON_TWO"
assert "Second append exits zero" "0" "$CMD_STATUS"
LINE_COUNT=$(wc -l < "$LOG_FILE" | tr -d ' ')
assert "Second append creates two lines" "2" "$LINE_COUNT"
ID_TWO=$(printf '%s' "$CMD_OUTPUT" | jq -r '.id')

# 5. ID format first decision for module/topic
assert "First ID is dec/{module}/{topic}/001" "dec/gx/decision/001" "$ID_ONE"

# 6. ID format second decision for same module/topic
assert "Second ID is dec/{module}/{topic}/002" "dec/gx/decision/002" "$ID_TWO"

# 7. Timestamp auto-generated and valid Unix epoch
NOW_TS=$(date +%s)
assert_true "Timestamp is numeric epoch" "[[ \"$TS_ONE\" =~ ^[0-9]+$ ]]"
assert_true "Timestamp is in valid range" "[ \"$TS_ONE\" -ge 1000000000 ] && [ \"$TS_ONE\" -le $((NOW_TS + 10)) ]"

# 8. Query --last 1 returns array with 1 element
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" query --last 1
assert "Query --last exits zero" "0" "$CMD_STATUS"
LAST_LEN=$(printf '%s' "$CMD_OUTPUT" | jq -r 'length')
LAST_ID=$(printf '%s' "$CMD_OUTPUT" | jq -r '.[0].id')
assert "Query --last 1 returns one element" "1" "$LAST_LEN"
assert "Query --last 1 returns latest decision" "$ID_TWO" "$LAST_ID"

# 9. Query --module filters correctly
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" query --module gx
assert "Query --module exits zero" "0" "$CMD_STATUS"
MODULE_LEN=$(printf '%s' "$CMD_OUTPUT" | jq -r 'length')
assert "Query --module gx returns two decisions" "2" "$MODULE_LEN"

# Additional coverage: query by hierarchy node
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" query --node action/fix-schemas
assert "Query --node exits zero" "0" "$CMD_STATUS"
NODE_LEN=$(printf '%s' "$CMD_OUTPUT" | jq -r 'length')
assert "Query --node filters by hierarchy_node" "2" "$NODE_LEN"

# 11. Supersede sets both forward and backward links
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" supersede "$ID_ONE" "$ID_TWO"
assert "Supersede exits zero" "0" "$CMD_STATUS"
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" query --module gx
OLD_SUPERSEDED_BY=$(printf '%s' "$CMD_OUTPUT" | jq -r --arg id "$ID_ONE" '[ .[] | select(.id == $id) ][0].superseded_by')
NEW_SUPERSEDES=$(printf '%s' "$CMD_OUTPUT" | jq -r --arg id "$ID_TWO" '[ .[] | select(.id == $id) ][0].supersedes')
assert "Supersede updates old.superseded_by" "$ID_TWO" "$OLD_SUPERSEDED_BY"
assert "Supersede updates new.supersedes" "$ID_ONE" "$NEW_SUPERSEDES"

# 10. Query --active excludes superseded decisions
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" query --active
assert "Query --active exits zero" "0" "$CMD_STATUS"
ACTIVE_LEN=$(printf '%s' "$CMD_OUTPUT" | jq -r 'length')
ACTIVE_ID=$(printf '%s' "$CMD_OUTPUT" | jq -r '.[0].id')
assert "Query --active excludes superseded decisions" "1" "$ACTIVE_LEN"
assert "Query --active keeps newest decision" "$ID_TWO" "$ACTIVE_ID"

# 12. Count returns correct total and active counts
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" count
assert "Count exits zero" "0" "$CMD_STATUS"
TOTAL_COUNT=$(printf '%s' "$CMD_OUTPUT" | jq -r '.total')
ACTIVE_COUNT=$(printf '%s' "$CMD_OUTPUT" | jq -r '.active')
assert "Count total is correct" "2" "$TOTAL_COUNT"
assert "Count active is correct" "1" "$ACTIVE_COUNT"

# 13. Empty file handling
EMPTY_WORKDIR="$TMPDIR/empty-workdir"
run_cmd /bin/bash "$SCRIPT" "$EMPTY_WORKDIR" query --last 5
assert "Empty file query exits zero" "0" "$CMD_STATUS"
assert "Empty file query returns []" "[]" "$CMD_OUTPUT"
run_cmd /bin/bash "$SCRIPT" "$EMPTY_WORKDIR" count
assert "Empty file count exits zero" "0" "$CMD_STATUS"
EMPTY_TOTAL=$(printf '%s' "$CMD_OUTPUT" | jq -r '.total')
EMPTY_ACTIVE=$(printf '%s' "$CMD_OUTPUT" | jq -r '.active')
assert "Empty file count total is 0" "0" "$EMPTY_TOTAL"
assert "Empty file count active is 0" "0" "$EMPTY_ACTIVE"

# 14. Invalid JSON input rejected
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" append '{bad json}'
assert "Invalid JSON append exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Invalid JSON append returns error" "$CMD_OUTPUT" '"error":"invalid_json"'

# 15. Corrupt JSONL resilience
CORRUPT_WORKDIR="$TMPDIR/corrupt-workdir"
mkdir -p "$CORRUPT_WORKDIR/.hivemind/state"
CORRUPT_LOG="$CORRUPT_WORKDIR/.hivemind/state/decisions.jsonl"
# Write two valid lines and one corrupt line
echo '{"id":"dec/core/x/001","timestamp":1000,"content":"a","rationale":"b","supersedes":null,"superseded_by":null,"hierarchy_node":null,"agent":null,"session_id":null}' > "$CORRUPT_LOG"
echo 'THIS IS NOT JSON AT ALL' >> "$CORRUPT_LOG"
echo '{"id":"dec/core/x/002","timestamp":2000,"content":"c","rationale":"d","supersedes":null,"superseded_by":null,"hierarchy_node":null,"agent":null,"session_id":null}' >> "$CORRUPT_LOG"

run_cmd /bin/bash "$SCRIPT" "$CORRUPT_WORKDIR" count
assert "Corrupt JSONL count exits zero" "0" "$CMD_STATUS"
CORRUPT_TOTAL=$(printf '%s' "$CMD_OUTPUT" | jq -r '.total')
assert "Corrupt JSONL count skips bad line" "2" "$CORRUPT_TOTAL"

run_cmd /bin/bash "$SCRIPT" "$CORRUPT_WORKDIR" query --active
assert "Corrupt JSONL query --active exits zero" "0" "$CMD_STATUS"
CORRUPT_ACTIVE_LEN=$(printf '%s' "$CMD_OUTPUT" | jq -r 'length')
assert "Corrupt JSONL query --active returns valid entries" "2" "$CORRUPT_ACTIVE_LEN"

run_cmd /bin/bash "$SCRIPT" "$CORRUPT_WORKDIR" query --last 5
assert "Corrupt JSONL query --last exits zero" "0" "$CMD_STATUS"

# Append to corrupt file should still work
run_cmd /bin/bash "$SCRIPT" "$CORRUPT_WORKDIR" append '{"content":"new","rationale":"test","module":"core","topic":"x"}'
assert "Append to corrupt JSONL exits zero" "0" "$CMD_STATUS"

# 16. Supersede negative cases
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" supersede "dec/nonexistent/x/999" "$ID_TWO"
assert "Supersede non-existent old_id exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Supersede non-existent old_id returns not_found" "$CMD_OUTPUT" '"error":"not_found"'

run_cmd /bin/bash "$SCRIPT" "$WORKDIR" supersede "$ID_ONE" "dec/nonexistent/x/999"
assert "Supersede non-existent new_id exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Supersede non-existent new_id returns not_found" "$CMD_OUTPUT" '"error":"not_found"'

run_cmd /bin/bash "$SCRIPT" "$WORKDIR" supersede "$ID_ONE" "$ID_ONE"
assert "Supersede self-reference exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Supersede self-reference returns invalid_argument" "$CMD_OUTPUT" '"error":"invalid_argument"'

# 17. Invalid --last argument
run_cmd /bin/bash "$SCRIPT" "$WORKDIR" query --last abc
assert "Invalid --last exits non-zero" "true" "$( [ "$CMD_STATUS" -ne 0 ] && echo true || echo false )"
assert_contains "Invalid --last returns invalid_argument" "$CMD_OUTPUT" '"error":"invalid_argument"'

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
