#!/usr/bin/env bash
# TDD Test: R3-02 — Enforcement Engine
# CRs: CR-01 (hard block enforcement), CR-08 (dynamic per-task scope)
#
# RED phase: All tests MUST fail before implementation.
# GREEN phase: All assertions MUST pass after implementation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/gx-enforce.sh"

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

echo "=== TDD Test: R3-02 Enforcement Engine ==="

# --- Pre-flight ---
assert "Pre-flight: jq available" "$(command -v jq >/dev/null 2>&1 && echo true || echo false)"

# --- Setup: Create hierarchy.json with test nodes ---
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {
    "type": "trajectory",
    "id": "root",
    "children": [
      {
        "type": "tactic",
        "id": "tactic/gx-pack",
        "children": [
          {
            "type": "action",
            "id": "action/fix-schemas",
            "scope": {
              "allowed_paths": [".opencode/skills/gx-context-engine/**", ".hivemind/state/**"],
              "allowed_tools": ["read", "glob", "grep", "write", "edit", "bash"],
              "allowed_delegations": ["hivemaker", "hiveq"]
            },
            "children": []
          },
          {
            "type": "action",
            "id": "action/no-scope-node",
            "children": []
          }
        ]
      }
    ]
  },
  "cursor": "action/fix-schemas"
}
EOF

# --- Test 1: Init creates enforcement.json ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" init "action/fix-schemas" 2>/dev/null || echo '{"error":"failed"}')
EXISTS="$([ -f "$WORKDIR/.hivemind/state/enforcement.json" ] && echo true || echo false)"
assert "Init: creates enforcement.json" "$EXISTS"

# --- Test 2: Init reads hierarchy to resolve scope ---
if [ -f "$WORKDIR/.hivemind/state/enforcement.json" ]; then
  NODE=$(jq -r '.active_node' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
  assert "Init: sets active_node from hierarchy" "$([ "$NODE" = "action/fix-schemas" ] && echo true || echo false)"
else
  assert "Init: sets active_node from hierarchy" "false"
fi

# --- Test 3: Init uses default scope if node has no scope ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" init "action/no-scope-node" 2>/dev/null || echo '{"error":"failed"}')
PATHS=$(jq -r '.scope.allowed_paths | length' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "0")
assert "Init: uses default scope for node without scope" "$([ "$PATHS" -ge 3 ] && echo true || echo false)"

# Reset to node with scope
bash "$SCRIPT" "$WORKDIR" init "action/fix-schemas" >/dev/null 2>&1

# --- Test 4: Check-path allowed ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path ".opencode/skills/gx-context-engine/scripts/test.sh" 2>/dev/null || echo '{"allowed":false}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "false")
assert "Check-path: allowed path returns allowed=true" "$ALLOWED"

# --- Test 5: Check-path blocked ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path "src/main.ts" 2>/dev/null || echo '{"allowed":true}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "true")
assert "Check-path: blocked path returns allowed=false" "$([ "$ALLOWED" = "false" ] && echo true || echo false)"

# --- Test 6: Glob matching works ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path ".hivemind/state/todo.json" 2>/dev/null || echo '{"allowed":false}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "false")
assert "Check-path: glob .hivemind/state/** matches .hivemind/state/todo.json" "$ALLOWED"

# --- Test 7: src/** blocked by scope ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path "src/hooks/lifecycle.ts" 2>/dev/null || echo '{"allowed":true}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "true")
assert "Check-path: src/** blocked by scope" "$([ "$ALLOWED" = "false" ] && echo true || echo false)"

# --- Test 8: Check-tool allowed ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-tool "read" 2>/dev/null || echo '{"allowed":false}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "false")
assert "Check-tool: allowed tool returns allowed=true" "$ALLOWED"

# --- Test 9: Check-tool blocked ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-tool "dangerous_tool" 2>/dev/null || echo '{"allowed":true}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "true")
assert "Check-tool: blocked tool returns allowed=false" "$([ "$ALLOWED" = "false" ] && echo true || echo false)"

# --- Test 10: Check-delegation allowed ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-delegation "hivemaker" 2>/dev/null || echo '{"allowed":false}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "false")
assert "Check-delegation: allowed agent returns allowed=true" "$ALLOWED"

# --- Test 11: Check-delegation blocked ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-delegation "unknown_agent" 2>/dev/null || echo '{"allowed":true}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "true")
assert "Check-delegation: blocked agent returns allowed=false" "$([ "$ALLOWED" = "false" ] && echo true || echo false)"

# --- Test 12: Record-violation appends ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" record-violation "path" "Attempted src/main.ts" 2>/dev/null || echo '{"error":"failed"}')
VCOUNT=$(jq '.violations | length' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "0")
assert "Record-violation: appends to violations array" "$([ "$VCOUNT" -ge 1 ] && echo true || echo false)"

# --- Test 13: Violation includes type + detail + timestamp ---
VTYPE=$(jq -r '.violations[0].type' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
VDETAIL=$(jq -r '.violations[0].detail' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
VTIME=$(jq '.violations[0].timestamp' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "0")
assert "Record-violation: has type + detail + timestamp" "$([ "$VTYPE" = "path" ] && [ "$VDETAIL" != "none" ] && [ "$VTIME" -gt 0 ] 2>/dev/null && echo true || echo false)"

# --- Test 14: Status returns full state ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" status 2>/dev/null || echo '{}')
HAS_MODE=$(echo "$RESULT" | jq 'has("mode")' 2>/dev/null || echo "false")
HAS_NODE=$(echo "$RESULT" | jq 'has("active_node")' 2>/dev/null || echo "false")
HAS_VCOUNT=$(echo "$RESULT" | jq 'has("violation_count")' 2>/dev/null || echo "false")
assert "Status: returns mode + active_node + violation_count" "$([ "$HAS_MODE" = "true" ] && [ "$HAS_NODE" = "true" ] && [ "$HAS_VCOUNT" = "true" ] && echo true || echo false)"

# --- Test 15: Set-mode changes mode ---
bash "$SCRIPT" "$WORKDIR" set-mode "passive" >/dev/null 2>&1
MODE=$(jq -r '.mode' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
assert "Set-mode: changes to passive" "$([ "$MODE" = "passive" ] && echo true || echo false)"

# --- Test 16: Passive mode allows but warns ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path "src/main.ts" 2>/dev/null || echo '{}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "false")
HAS_WARN=$(echo "$RESULT" | jq 'has("warning")' 2>/dev/null || echo "false")
assert "Set-mode: passive allows but warns on violation" "$([ "$ALLOWED" = "true" ] && [ "$HAS_WARN" = "true" ] && echo true || echo false)"

# Reset to active
bash "$SCRIPT" "$WORKDIR" set-mode "active" >/dev/null 2>&1

# --- Test 17: Set-node updates active_node + scope ---
bash "$SCRIPT" "$WORKDIR" set-node "action/no-scope-node" >/dev/null 2>&1
NODE=$(jq -r '.active_node' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
assert "Set-node: updates active_node" "$([ "$NODE" = "action/no-scope-node" ] && echo true || echo false)"

# --- Test 18: Missing hierarchy.json uses default scope ---
rm -f "$WORKDIR/.hivemind/state/hierarchy.json"
rm -f "$WORKDIR/.hivemind/state/enforcement.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" init "action/test" 2>/dev/null || echo '{"error":"failed"}')
PATHS=$(jq -r '.scope.allowed_paths | length' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "0")
assert "Missing hierarchy.json: init uses default scope" "$([ "$PATHS" -ge 3 ] && echo true || echo false)"

# --- Test 19: Corrupt enforcement.json: init recreates ---
echo "corrupt data" > "$WORKDIR/.hivemind/state/enforcement.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" init "action/test" 2>/dev/null || echo '{"error":"failed"}')
VALID_JSON=$(jq '.' "$WORKDIR/.hivemind/state/enforcement.json" >/dev/null 2>&1 && echo true || echo false)
assert "Corrupt enforcement.json: init recreates from scratch" "$VALID_JSON"

# --- Test 20: Pre-flight jq check (covered by test 1) ---
# Combined with pre-flight above

# --- Test 20 (actual): BLOCKED message format for active mode ---
# Recreate hierarchy for this test
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {"type": "trajectory", "id": "root", "children": [{"type": "action", "id": "action/test", "scope": {"allowed_paths": [".opencode/**"], "allowed_tools": ["read"], "allowed_delegations": ["hivemaker"]}, "children": []}]},
  "cursor": "action/test"
}
EOF
bash "$SCRIPT" "$WORKDIR" init "action/test" >/dev/null 2>&1
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path "src/main.ts" 2>/dev/null || echo '{}')
HAS_REASON=$(echo "$RESULT" | jq 'has("reason")' 2>/dev/null || echo "false")
assert "Active mode: blocked check-path includes reason" "$HAS_REASON"

# --- Test 21: Parent scope inheritance (CR-08) ---
# Create hierarchy where child has no scope but parent does
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {
    "type": "trajectory",
    "id": "root",
    "children": [
      {
        "type": "tactic",
        "id": "tactic/parent-with-scope",
        "scope": {
          "allowed_paths": [".opencode/skills/**", "docs/**"],
          "allowed_tools": ["read", "write"],
          "allowed_delegations": ["hivemaker"]
        },
        "children": [
          {
            "type": "action",
            "id": "action/child-no-scope",
            "children": []
          }
        ]
      }
    ]
  },
  "cursor": "action/child-no-scope"
}
EOF

rm -f "$WORKDIR/.hivemind/state/enforcement.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" init "action/child-no-scope" 2>/dev/null || echo '{"error":"failed"}')
# Should inherit parent's scope, NOT default scope
TOOLS_COUNT=$(jq '.scope.allowed_tools | length' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "0")
# Parent has 2 tools (read, write), default has 12 tools. If inherited, should be 2.
assert "Parent inheritance: child without scope inherits parent scope" "$([ "$TOOLS_COUNT" = "2" ] && echo true || echo false)"

# --- Test 22: Disabled mode requires approval token ---
bash "$SCRIPT" "$WORKDIR" init "action/child-no-scope" >/dev/null 2>&1
RESULT=$(bash "$SCRIPT" "$WORKDIR" set-mode "disabled" 2>/dev/null || echo '{"error":"approval_required"}')
HAS_ERROR=$(echo "$RESULT" | jq -r '.error // "none"' 2>/dev/null || echo "none")
assert "Disabled mode: requires approval token" "$([ "$HAS_ERROR" = "approval_required" ] && echo true || echo false)"

# --- Test 23: Disabled mode with approval token succeeds ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" set-mode "disabled" "emergency-fix-by-user" 2>/dev/null || echo '{"error":"failed"}')
MODE=$(jq -r '.mode' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
assert "Disabled mode: succeeds with approval token" "$([ "$MODE" = "disabled" ] && echo true || echo false)"

# --- Test 24: Disabled mode records audit trail ---
AUDIT_TYPE=$(jq -r '.violations[-1].type' "$WORKDIR/.hivemind/state/enforcement.json" 2>/dev/null || echo "none")
assert "Disabled mode: records mode_override in violations audit" "$([ "$AUDIT_TYPE" = "mode_override" ] && echo true || echo false)"

# --- Test 25: Disabled mode allows everything ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-path "src/anything.ts" 2>/dev/null || echo '{"allowed":false}')
ALLOWED=$(echo "$RESULT" | jq -r '.allowed' 2>/dev/null || echo "false")
assert "Disabled mode: allows all paths" "$ALLOWED"

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
