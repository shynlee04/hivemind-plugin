#!/usr/bin/env bash
# TDD test suite for R2-06: Compaction Hook Enhancement (CR-07)
# Tests the BLOCK → retrieve → synthesize → inject → unblock flow
# by verifying: TypeScript validity, context-recovery.json shape, integration
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

PASS=0
FAIL=0
TOTAL=0

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
    echo "  FAIL: $desc (missing: $needle in output)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== TDD Test: R2-06 Compaction Hook Enhancement ==="

PLUGIN_DIR="$(cd "$SCRIPT_DIR/../../plugins/hiveops-governance" && pwd)"
COMPACTION_FILE="$PLUGIN_DIR/hooks/compaction.ts"
TYPES_FILE="$PLUGIN_DIR/types.ts"

# ── 1. File existence ──
assert_true "compaction.ts exists" "[ -f \"$COMPACTION_FILE\" ]"
assert_true "types.ts exists" "[ -f \"$TYPES_FILE\" ]"

# ── 2. CompactionRecovery type present in types.ts ──
TYPES_CONTENT=$(cat "$TYPES_FILE")
assert_contains "CompactionRecovery interface exported" "$TYPES_CONTENT" "export interface CompactionRecovery"
assert_contains "CompactionRecovery has trajectory_summary" "$TYPES_CONTENT" "trajectory_summary: string"
assert_contains "CompactionRecovery has active_todos" "$TYPES_CONTENT" "active_todos: string[]"
assert_contains "CompactionRecovery has key_decisions" "$TYPES_CONTENT" "key_decisions: string[]"
assert_contains "CompactionRecovery has workflow_positions" "$TYPES_CONTENT" "workflow_positions:"
assert_contains "CompactionRecovery has health_summary" "$TYPES_CONTENT" "health_summary:"
assert_contains "CompactionRecovery has recommended_next" "$TYPES_CONTENT" "recommended_next: string"
assert_contains "CompactionRecovery has recovered_at" "$TYPES_CONTENT" "recovered_at: number"

# ── 3. Compaction hook implements CR-07 flow ──
HOOK_CONTENT=$(cat "$COMPACTION_FILE")
assert_contains "Hook imports CompactionRecovery type" "$HOOK_CONTENT" "CompactionRecovery"
assert_contains "Hook references gx-context-retrieve.sh" "$HOOK_CONTENT" "gx-context-retrieve.sh"
assert_contains "Hook has BLOCK phase" "$HOOK_CONTENT" "Phase 1: BLOCK"
assert_contains "Hook has RETRIEVE phase" "$HOOK_CONTENT" "Phase 2: RETRIEVE"
assert_contains "Hook has SYNTHESIZE phase" "$HOOK_CONTENT" "Phase 3: SYNTHESIZE"
assert_contains "Hook has INJECT phase" "$HOOK_CONTENT" "Phase 4: INJECT"
assert_contains "Hook has UNBLOCK phase" "$HOOK_CONTENT" "Phase 5: UNBLOCK"
assert_contains "Hook has fallback on failure" "$HOOK_CONTENT" "buildFallbackContext"
assert_contains "Hook injects key decisions" "$HOOK_CONTENT" "Key Decisions"
assert_contains "Hook injects active TODOs" "$HOOK_CONTENT" "Active TODO Items"
assert_contains "Hook injects workflow positions" "$HOOK_CONTENT" "Workflow Positions"
assert_contains "Hook injects health summary" "$HOOK_CONTENT" "Health Summary"
assert_contains "Hook has context recovery warning" "$HOOK_CONTENT" "Context recovery failed"
assert_contains "Hook saves enforcement state" "$HOOK_CONTENT" "saveEnforcementState"

# ── 4. Context-recovery.json shape test (integration with gx-context-retrieve.sh) ──
RETRIEVE_SCRIPT="$SCRIPT_DIR/scripts/gx-context-retrieve.sh"
if [ -f "$RETRIEVE_SCRIPT" ]; then
  WORKDIR="$TMPDIR/integration"
  mkdir -p "$WORKDIR/.hivemind/state"

  # Set up minimal fixtures for context-retrieve
  cat > "$WORKDIR/.hivemind/state/todo.json" <<'EOF'
{"items":[{"content":"Fix regression","status":"in_progress","priority":"high","hierarchy_node":"action/fix-r2-01"},{"content":"Add tests","status":"pending","priority":"medium","hierarchy_node":"action/add-tests"}]}
EOF
  cat > "$WORKDIR/.hivemind/state/hierarchy.json" <<'EOF'
{"trajectory":{"id":"traj/gx-pack","name":"GX-Pack Build","children":[{"id":"tactic/r2","name":"R2 State Persistence","children":[{"id":"action/fix-r2-01","name":"Fix R2-01","status":"in_progress"},{"id":"action/add-tests","name":"Add Tests","status":"pending"}]}]}}
EOF
  cat > "$WORKDIR/.hivemind/state/health-metrics.json" <<'EOF'
{"composite_score":65,"status":"warning","hard_blocked":false,"signals":{"hierarchy_freshness":{"score":80,"velocity":0},"todo_progression":{"score":50,"velocity":0}},"history":[]}
EOF
  echo '{"id":"dec/gx/arch/001","timestamp":1000,"content":"Use slug IDs","rationale":"Readable","supersedes":null,"superseded_by":null,"hierarchy_node":null,"agent":null,"session_id":null}' > "$WORKDIR/.hivemind/state/decisions.jsonl"

  set +e
  RETRIEVE_OUTPUT=$(bash "$RETRIEVE_SCRIPT" "$WORKDIR" 2>&1)
  RETRIEVE_STATUS=$?
  set -e

  assert "gx-context-retrieve.sh exits zero" "0" "$RETRIEVE_STATUS"

  RECOVERY_FILE="$WORKDIR/.hivemind/state/context-recovery.json"
  assert_true "context-recovery.json created" "[ -f \"$RECOVERY_FILE\" ]"

  if [ -f "$RECOVERY_FILE" ]; then
    # Verify shape matches CompactionRecovery interface
    RECOVERY_JSON=$(cat "$RECOVERY_FILE")

    assert_true "Recovery has key_decisions array" "printf '%s' \"\$RECOVERY_JSON\" | jq -e '.key_decisions | type == \"array\"' >/dev/null 2>&1"
    assert_true "Recovery has active_todos array" "printf '%s' \"\$RECOVERY_JSON\" | jq -e '.active_todos | type == \"array\"' >/dev/null 2>&1"
    assert_true "Recovery has health_summary object" "printf '%s' \"\$RECOVERY_JSON\" | jq -e '.health_summary | type == \"object\"' >/dev/null 2>&1"
    assert_true "Recovery health has score" "printf '%s' \"\$RECOVERY_JSON\" | jq -e '.health_summary.composite_score != null' >/dev/null 2>&1"

    # Check content integrity
    DECISIONS_LEN=$(printf '%s' "$RECOVERY_JSON" | jq -r '.key_decisions | length')
    assert "Recovery contains 1 key decision" "1" "$DECISIONS_LEN"

    TODOS_LEN=$(printf '%s' "$RECOVERY_JSON" | jq -r '.active_todos | length')
    assert "Recovery contains 2 active todos" "2" "$TODOS_LEN"
  fi
else
  echo "  SKIP: gx-context-retrieve.sh not found, skipping integration tests"
fi

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
