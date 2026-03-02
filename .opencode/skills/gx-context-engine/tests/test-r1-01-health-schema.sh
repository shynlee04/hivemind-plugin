#!/usr/bin/env bash
# TDD Test: R1-01 — Health Metrics Schema + State File
# CRs: CR-13 (12-signal vector), CR-06 (strict typed + versioned)
#
# This test MUST fail before implementation (RED phase).
# After implementation, all assertions MUST pass (GREEN phase).
set -euo pipefail

WORKDIR="${1:-.}"
METRICS_FILE="$WORKDIR/.hivemind/state/health-metrics.json"
SCHEMA_DOC="$WORKDIR/.opencode/skills/gx-context-engine/references/health-metrics-schema.md"

PASS=0
FAIL=0
TOTAL=0

assert() {
  local name="$1"
  local result="$2"
  TOTAL=$((TOTAL + 1))
  if [ "$result" = "true" ]; then
    PASS=$((PASS + 1))
    echo "  PASS: $name"
  else
    FAIL=$((FAIL + 1))
    echo "  FAIL: $name"
  fi
}

echo "=== TDD Test: R1-01 Health Metrics Schema ==="

# --- Existence checks ---
assert "Schema doc exists" "$([ -f "$SCHEMA_DOC" ] && echo true || echo false)"
assert "State file exists" "$([ -f "$METRICS_FILE" ] && echo true || echo false)"

# --- Valid JSON ---
VALID_JSON="false"
if [ -f "$METRICS_FILE" ]; then
  if jq '.' "$METRICS_FILE" > /dev/null 2>&1; then
    VALID_JSON="true"
  fi
fi
assert "State file is valid JSON" "$VALID_JSON"

# --- Schema version ---
HAS_VERSION="false"
if [ -f "$METRICS_FILE" ]; then
  HAS_VERSION=$(jq 'has("$schema") and has("version")' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "Has \$schema and version fields" "$HAS_VERSION"

# --- All 12 EXACT signal keys present (review fix: check names not just count) ---
EXPECTED_SIGNALS='["chain_integrity","context_saturation","decision_velocity","delegation_efficiency","domain_continuity","evidence_quality","hard_stop_compliance","hierarchy_freshness","plan_adherence","scope_proximity","todo_progression","turn_normalized"]'
SIGNAL_COUNT="0"
EXACT_KEYS_MATCH="false"
if [ -f "$METRICS_FILE" ]; then
  SIGNAL_COUNT=$(jq '.signals | keys | length' "$METRICS_FILE" 2>/dev/null || echo "0")
  ACTUAL_KEYS=$(jq -cS '.signals | keys' "$METRICS_FILE" 2>/dev/null || echo "[]")
  if [ "$ACTUAL_KEYS" = "$EXPECTED_SIGNALS" ]; then
    EXACT_KEYS_MATCH="true"
  fi
fi
assert "12 signal keys present (got $SIGNAL_COUNT)" "$([ "$SIGNAL_COUNT" = "12" ] && echo true || echo false)"
assert "Exact 12 signal names match CR-13 spec" "$EXACT_KEYS_MATCH"

# --- Each signal has score (numeric 0-100) + velocity (numeric) ---
SIGNALS_VALID="false"
SCORES_IN_RANGE="false"
if [ -f "$METRICS_FILE" ]; then
  SIGNALS_VALID=$(jq '
    .signals | to_entries | all(.value | has("score") and has("velocity"))
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
  SCORES_IN_RANGE=$(jq '
    [.signals | to_entries[].value.score] | all(type == "number" and . >= 0 and . <= 100)
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "Each signal has score + velocity fields" "$SIGNALS_VALID"
assert "All scores are numeric in [0,100]" "$SCORES_IN_RANGE"

# --- Composite weights sum to 100 ---
WEIGHT_SUM="0"
if [ -f "$METRICS_FILE" ]; then
  WEIGHT_SUM=$(jq '[.composite.weights | to_entries[].value] | add' "$METRICS_FILE" 2>/dev/null || echo "0")
fi
assert "Composite weights sum to 100 (got $WEIGHT_SUM)" "$([ "$WEIGHT_SUM" = "100" ] && echo true || echo false)"

# --- Thresholds defined with correct values (review fix: check values not just keys) ---
HAS_THRESHOLDS="false"
THRESHOLD_VALUES_CORRECT="false"
if [ -f "$METRICS_FILE" ]; then
  HAS_THRESHOLDS=$(jq '
    .thresholds | has("healthy") and has("warning") and has("critical") and has("hard_block")
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
  THRESHOLD_VALUES_CORRECT=$(jq '
    .thresholds.healthy.min == 70 and
    .thresholds.warning.min == 40 and .thresholds.warning.max == 69 and
    .thresholds.critical.max == 39 and
    .thresholds.hard_block.below == 20
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "Thresholds for healthy/warning/critical/hard_block" "$HAS_THRESHOLDS"
assert "Threshold values correct (70/40-69/39/20)" "$THRESHOLD_VALUES_CORRECT"

# --- Hard block signals EXACTLY plan_adherence + hierarchy_freshness (review fix: exact match) ---
HARD_BLOCK_EXACT="false"
if [ -f "$METRICS_FILE" ]; then
  HARD_BLOCK_EXACT=$(jq '
    (.thresholds.hard_block.signals | sort) == ["hierarchy_freshness","plan_adherence"]
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "Hard block signals exactly [plan_adherence, hierarchy_freshness] (CR-01)" "$HARD_BLOCK_EXACT"

# --- Schema version exact values (review fix: verify version identity) ---
SCHEMA_ID_CORRECT="false"
if [ -f "$METRICS_FILE" ]; then
  SCHEMA_ID_CORRECT=$(jq '
    ."$schema" == "gx-health-metrics-v1" and .version == 1
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "Schema ID = gx-health-metrics-v1, version = 1" "$SCHEMA_ID_CORRECT"

# --- All signal scores are numeric 0-100 (may have been updated by combinator) ---
ALL_SCORES_VALID="false"
if [ -f "$METRICS_FILE" ]; then
  ALL_SCORES_VALID=$(jq '
    [.signals | to_entries[].value.score] | all(type == "number" and . >= 0 and . <= 100)
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "All signal scores are numeric [0,100]" "$ALL_SCORES_VALID"

# --- Signals are nested objects (not flat numbers) — post-fix for review issue #1 ---
SIGNALS_NESTED="false"
if [ -f "$METRICS_FILE" ]; then
  SIGNALS_NESTED=$(jq '
    .signals | to_entries | all(.value | type == "object" and has("score") and has("velocity"))
  ' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "Signals are nested objects with score+velocity (schema compliance)" "$SIGNALS_NESTED"

# --- No top-level velocity key (velocity is inside each signal) ---
NO_TOPLEVEL_VELOCITY="false"
if [ -f "$METRICS_FILE" ]; then
  NO_TOPLEVEL_VELOCITY=$(jq 'has("velocity") | not' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "No top-level velocity key (nested per signal)" "$NO_TOPLEVEL_VELOCITY"

# --- History array exists ---
HAS_HISTORY="false"
if [ -f "$METRICS_FILE" ]; then
  HAS_HISTORY=$(jq 'has("history") and (.history | type == "array")' "$METRICS_FILE" 2>/dev/null || echo "false")
fi
assert "History array exists" "$HAS_HISTORY"

# --- Summary ---
echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: RED (tests failing — implementation needed)"
  exit 1
else
  echo "STATUS: GREEN (all tests pass)"
  exit 0
fi
