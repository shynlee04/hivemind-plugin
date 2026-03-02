#!/usr/bin/env bash
# TDD Test: R3-01 — Schema Registry + Validation
# CRs: CR-06 (strict typed + versioned schemas)
#
# RED phase: All tests MUST fail before implementation.
# GREEN phase: All assertions MUST pass after implementation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/gx-schema-sync.sh"

# Create temp working directory
TMPDIR_BASE=$(mktemp -d)
WORKDIR="$TMPDIR_BASE/test-project"
mkdir -p "$WORKDIR/.hivemind/state"

cleanup() { rm -rf "$TMPDIR_BASE"; }
trap cleanup EXIT

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

echo "=== TDD Test: R3-01 Schema Registry + Validation ==="

# --- Pre-flight ---
assert "Pre-flight: jq available" "$(command -v jq >/dev/null 2>&1 && echo true || echo false)"

# --- Test 1: Validate valid runtime-profile.json ---
cat > "$WORKDIR/.hivemind/state/runtime-profile.json" << 'EOF'
{
  "id": "gx-profile-test",
  "created": "2026-03-02T00:00:00Z",
  "created_epoch": 1772409600,
  "ttl": 3600000,
  "intent": "build_new",
  "policy_version": "gx-pack-v1",
  "role_envelope": {"primary": {"agent": "hivefiver", "level": 2}},
  "capabilities": {"tools": ["read"], "paths": [".opencode/**"], "depth_limit": 3, "delegate_to": ["hivemaker"]},
  "constraints": ["L3 cannot edit critical-path"]
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: valid runtime-profile.json passes" "$VALID"

# --- Test 2: Rejects missing required field ---
cat > "$WORKDIR/.hivemind/state/runtime-profile.json" << 'EOF'
{
  "created": "2026-03-02T00:00:00Z",
  "intent": "build_new",
  "policy_version": "gx-pack-v1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: rejects missing required field (id)" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 3: Rejects unknown top-level field ---
cat > "$WORKDIR/.hivemind/state/runtime-profile.json" << 'EOF'
{
  "id": "gx-profile-test",
  "created": "2026-03-02T00:00:00Z",
  "created_epoch": 1772409600,
  "ttl": 3600000,
  "intent": "build_new",
  "policy_version": "gx-pack-v1",
  "role_envelope": {"primary": {"agent": "hivefiver", "level": 2}},
  "capabilities": {"tools": ["read"], "paths": [".opencode/**"], "depth_limit": 3, "delegate_to": ["hivemaker"]},
  "constraints": ["test"],
  "unknown_field_xyz": "should_be_rejected"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: rejects unknown top-level field" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 4: Validates health-metrics.json (R1 schema) ---
# Create a minimal valid health-metrics
cat > "$WORKDIR/.hivemind/state/health-metrics.json" << 'HMEOF'
{
  "$schema": "gx-health-metrics-v1",
  "version": 1,
  "signals": {
    "plan_adherence": {"score": 50, "velocity": 0},
    "hierarchy_freshness": {"score": 50, "velocity": 0},
    "decision_velocity": {"score": 50, "velocity": 0},
    "todo_progression": {"score": 50, "velocity": 0},
    "context_saturation": {"score": 50, "velocity": 0},
    "hard_stop_compliance": {"score": 50, "velocity": 0},
    "delegation_efficiency": {"score": 50, "velocity": 0},
    "scope_proximity": {"score": 50, "velocity": 0},
    "domain_continuity": {"score": 50, "velocity": 0},
    "evidence_quality": {"score": 50, "velocity": 0},
    "turn_normalized": {"score": 50, "velocity": 0},
    "chain_integrity": {"score": 50, "velocity": 0}
  },
  "composite": {"score": 50, "status": "warning", "weights": {"plan_adherence": 15, "hierarchy_freshness": 12, "decision_velocity": 5, "todo_progression": 10, "context_saturation": 10, "hard_stop_compliance": 8, "delegation_efficiency": 5, "scope_proximity": 8, "domain_continuity": 5, "evidence_quality": 8, "turn_normalized": 4, "chain_integrity": 10}},
  "thresholds": {"healthy": {"min": 70}, "warning": {"min": 40, "max": 69}, "critical": {"max": 39}, "hard_block": {"below": 20, "signals": ["plan_adherence", "hierarchy_freshness"]}},
  "history": []
}
HMEOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate health-metrics.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: health-metrics.json passes (R1 schema)" "$VALID"

# --- Test 5: Validates todo.json ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [{"id": "t1", "content": "Test task", "status": "pending", "priority": "high"}],
  "lastSync": 1772409600,
  "activeItem": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate todo.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: todo.json passes with valid structure" "$VALID"

# --- Test 6: Validates hierarchy.json ---
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {"type": "trajectory", "id": "root", "children": []},
  "cursor": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate hierarchy.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: hierarchy.json passes with root + version" "$VALID"

# --- Test 7: Validates wf-*.json ---
cat > "$WORKDIR/.hivemind/state/wf-test-flow.json" << 'EOF'
{
  "workflow_id": "test-flow",
  "current_step": 1,
  "total_steps": 5,
  "step_name": "1_init",
  "iteration_count": 0,
  "max_iterations": 3,
  "started_at": 1772409600,
  "last_step_completed_at": null,
  "step_outputs": {},
  "transition_log": [],
  "is_blocked": false,
  "blocked_reason": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate wf-test-flow.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: workflow state (wf-*.json) passes" "$VALID"

# --- Test 8: Validates decisions.jsonl line-by-line ---
mkdir -p "$WORKDIR/.hivemind/state"
cat > "$WORKDIR/.hivemind/state/decisions.jsonl" << 'EOF'
{"id":"dec/gx/test/001","timestamp":1772409600,"content":"Test decision","rationale":"Testing","hierarchy_node":"action/test","agent":"hivefiver","session_id":"s1","supersedes":null,"superseded_by":null}
{"id":"dec/gx/test/002","timestamp":1772409601,"content":"Another decision","rationale":"Also testing","hierarchy_node":"action/test","agent":"hivefiver","session_id":"s1","supersedes":null,"superseded_by":null}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate decisions.jsonl 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: decisions.jsonl validates each line" "$VALID"

# --- Test 9: Rejects non-JSON file ---
echo "this is not json" > "$WORKDIR/.hivemind/state/runtime-profile.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: rejects non-JSON file" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 10: Rejects empty file ---
> "$WORKDIR/.hivemind/state/runtime-profile.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Validate: rejects empty file" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 11: Register creates schema-registry.json ---
# Restore valid files first
cat > "$WORKDIR/.hivemind/state/runtime-profile.json" << 'EOF'
{
  "id": "gx-profile-test",
  "created": "2026-03-02T00:00:00Z",
  "created_epoch": 1772409600,
  "ttl": 3600000,
  "intent": "build_new",
  "policy_version": "gx-pack-v1",
  "role_envelope": {"primary": {"agent": "hivefiver", "level": 2}},
  "capabilities": {"tools": ["read"], "paths": [".opencode/**"], "depth_limit": 3, "delegate_to": ["hivemaker"]},
  "constraints": ["test"]
}
EOF

bash "$SCRIPT" "$WORKDIR" register >/dev/null 2>&1 || true
REG_EXISTS="$([ -f "$WORKDIR/.hivemind/state/schema-registry.json" ] && echo true || echo false)"
assert "Register: creates schema-registry.json" "$REG_EXISTS"

# --- Test 12: Register records all found state files ---
if [ "$REG_EXISTS" = "true" ]; then
  FILE_COUNT=$(jq '.files | keys | length' "$WORKDIR/.hivemind/state/schema-registry.json" 2>/dev/null || echo "0")
  # Should have at least runtime-profile, health-metrics, todo, hierarchy, wf-test-flow, decisions
  assert "Register: records all found state files" "$([ "$FILE_COUNT" -ge 5 ] && echo true || echo false)"
else
  assert "Register: records all found state files" "false"
fi

# --- Test 13: Register increments version on re-register ---
V1=$(jq '.version' "$WORKDIR/.hivemind/state/schema-registry.json" 2>/dev/null || echo "0")
bash "$SCRIPT" "$WORKDIR" register >/dev/null 2>&1 || true
V2=$(jq '.version' "$WORKDIR/.hivemind/state/schema-registry.json" 2>/dev/null || echo "0")
assert "Register: increments version on re-register" "$([ "$V2" -gt "$V1" ] 2>/dev/null && echo true || echo false)"

# --- Test 14: Check-all returns aggregate ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-all 2>/dev/null || echo '{"valid":0}')
VALID_COUNT=$(echo "$RESULT" | jq -r '.valid // 0' 2>/dev/null || echo "0")
TOTAL_COUNT=$(echo "$RESULT" | jq -r '.total // 0' 2>/dev/null || echo "0")
assert "Check-all: returns aggregate valid/invalid counts" "$([ "$TOTAL_COUNT" -ge 5 ] && [ "$VALID_COUNT" -ge 4 ] && echo true || echo false)"

# --- Test 15: Status reports ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" status 2>/dev/null || echo '{}')
HAS_TOTAL=$(echo "$RESULT" | jq 'has("total")' 2>/dev/null || echo "false")
HAS_VALID=$(echo "$RESULT" | jq 'has("valid")' 2>/dev/null || echo "false")
HAS_INVALID=$(echo "$RESULT" | jq 'has("invalid")' 2>/dev/null || echo "false")
assert "Status: reports total, valid, invalid, unregistered" "$([ "$HAS_TOTAL" = "true" ] && [ "$HAS_VALID" = "true" ] && [ "$HAS_INVALID" = "true" ] && echo true || echo false)"

# --- Test 16: Unknown file reports as unregistered ---
echo '{"custom": "data"}' > "$WORKDIR/.hivemind/state/unknown-custom-file.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" validate unknown-custom-file.json 2>/dev/null || echo '{"valid":false}')
SCHEMA_ID=$(echo "$RESULT" | jq -r '.schema_id // "none"' 2>/dev/null || echo "none")
assert "Unknown file: reports as unregistered (not crash)" "$([ "$SCHEMA_ID" = "unregistered" ] && echo true || echo false)"

# --- Test 17: Version field must be numeric ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": "one",
  "items": [],
  "lastSync": 1772409600
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate todo.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Version field: rejects string version" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 18: Type mismatch: items must be array ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": "not-an-array",
  "lastSync": 1772409600
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate todo.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type mismatch: items must be array (rejects string)" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 19: Type mismatch: role_envelope must be object ---
cat > "$WORKDIR/.hivemind/state/runtime-profile.json" << 'EOF'
{
  "id": "gx-profile-test",
  "created": "2026-03-02T00:00:00Z",
  "created_epoch": 1772409600,
  "ttl": 3600000,
  "intent": "build_new",
  "policy_version": "gx-pack-v1",
  "role_envelope": "not-an-object",
  "capabilities": {"tools": ["read"], "paths": [".opencode/**"], "depth_limit": 3, "delegate_to": ["hivemaker"]},
  "constraints": ["test"]
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type mismatch: role_envelope must be object" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 20: JSONL type mismatch: timestamp must be number ---
cat > "$WORKDIR/.hivemind/state/decisions.jsonl" << 'EOF'
{"id":"dec/gx/test/001","timestamp":"not-a-number","content":"Test","rationale":"Test","hierarchy_node":"action/test","agent":"hivefiver"}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate decisions.jsonl 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "JSONL type mismatch: timestamp must be number" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 21: Register works with missing state dir ---
EMPTY_DIR=$(mktemp -d)
RESULT=$(bash "$SCRIPT" "$EMPTY_DIR" register 2>/dev/null || echo '{"error":"failed"}')
HAS_VERSION=$(echo "$RESULT" | jq 'has("version")' 2>/dev/null || echo "false")
assert "Register: works with missing state dir (creates it)" "$HAS_VERSION"
rm -rf "$EMPTY_DIR"

# --- Test 22: Register handles corrupt version in existing registry ---
cat > "$WORKDIR/.hivemind/state/schema-registry.json" << 'EOF'
{"version": "corrupt", "files": {}}
EOF
RESULT=$(bash "$SCRIPT" "$WORKDIR" register 2>/dev/null || echo '{"error":"failed"}')
REG_VER=$(echo "$RESULT" | jq '.version // 0' 2>/dev/null || echo "0")
assert "Register: handles corrupt version (resets to 1)" "$([ "$REG_VER" = "1" ] && echo true || echo false)"

# --- Test 23: Validation output is always valid JSON ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" validate runtime-profile.json 2>/dev/null || echo '{}')
IS_VALID_JSON="$(echo "$RESULT" | jq '.' >/dev/null 2>&1 && echo true || echo false)"
assert "Output: validation result is always valid JSON" "$IS_VALID_JSON"

# --- Test 24: Optional field type check: activeItem must be string|null ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [],
  "lastSync": 1772409600,
  "activeItem": 12345
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate todo.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: activeItem rejects number (expects string|null)" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 25: activeItem=null is valid ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [],
  "lastSync": 1772409600,
  "activeItem": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate todo.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: activeItem=null is valid" "$VALID"

# --- Test 26: Workflow optional field step_name must be string ---
cat > "$WORKDIR/.hivemind/state/wf-type-test.json" << 'EOF'
{
  "workflow_id": "type-test",
  "current_step": 1,
  "total_steps": 3,
  "step_name": 42,
  "is_blocked": false
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate wf-type-test.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: wf step_name rejects number (expects string)" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 27: hierarchy.json cursor as object is valid ---
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {"type": "trajectory", "id": "root", "children": []},
  "cursor": {"node_id": "action/fix-schemas", "depth": 3}
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate hierarchy.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: hierarchy cursor as object is valid" "$VALID"

# --- Test 28: $schema field type check: health-metrics rejects number ---
cat > "$WORKDIR/.hivemind/state/health-metrics.json" << 'HMEOF'
{
  "$schema": 123,
  "version": 1,
  "signals": {},
  "composite": {},
  "thresholds": {},
  "history": []
}
HMEOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate health-metrics.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: \$schema rejects number in health-metrics" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 29: $schema field type check: enforcement rejects number ---
cat > "$WORKDIR/.hivemind/state/enforcement.json" << 'EOF'
{
  "$schema": 456,
  "version": 1,
  "mode": "active",
  "active_node": "test",
  "scope": {},
  "violations": [],
  "last_check": 1772409600,
  "block_active": false,
  "block_reason": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate enforcement.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: \$schema rejects number in enforcement" "$([ "$VALID" = "false" ] && echo true || echo false)"

# --- Test 30: hierarchy cursor as number is rejected ---
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {"type": "trajectory", "id": "root", "children": []},
  "cursor": 42
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" validate hierarchy.json 2>/dev/null || echo '{"valid":false}')
VALID=$(echo "$RESULT" | jq -r '.valid // false' 2>/dev/null || echo "false")
assert "Type check: hierarchy cursor as number is rejected" "$([ "$VALID" = "false" ] && echo true || echo false)"

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
