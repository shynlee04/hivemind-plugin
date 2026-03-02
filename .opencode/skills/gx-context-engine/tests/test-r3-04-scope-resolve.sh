#!/usr/bin/env bash
# TDD Test: R3-04 — Dynamic Scope Resolver
# CRs: CR-08 (dynamic per-task scope tied to hierarchy depth)
#
# RED phase: All tests MUST fail before implementation.
# GREEN phase: All assertions MUST pass after implementation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/gx-scope-resolve.sh"

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

echo "=== TDD Test: R3-04 Dynamic Scope Resolver ==="

# --- Pre-flight ---
assert "Pre-flight: jq available" "$(command -v jq >/dev/null 2>&1 && echo true || echo false)"

# --- Setup: hierarchy with depth + scopes ---
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
        "scope": {
          "allowed_paths": [".opencode/**", ".hivemind/**", "docs/**"],
          "allowed_tools": ["read", "glob", "grep", "write", "edit", "bash", "task", "hiveops_export", "hiveops_gate"],
          "allowed_delegations": ["hivemaker", "hiveq", "hivexplorer"]
        },
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
            "id": "action/no-scope-inherits",
            "children": []
          }
        ]
      }
    ]
  },
  "cursor": "action/fix-schemas"
}
EOF

# --- Test 1: Resolve root → full default scope ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "root" 2>/dev/null || echo '{"error":"failed"}')
SOURCE=$(echo "$RESULT" | jq -r '.scope_source // "none"' 2>/dev/null || echo "none")
assert "Resolve: root → scope_source=node or default" "$([ "$SOURCE" = "node" ] || [ "$SOURCE" = "default" ] && echo true || echo false)"

# --- Test 2: Resolve action with scope → restricted scope ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/fix-schemas" 2>/dev/null || echo '{"error":"failed"}')
PATHS_COUNT=$(echo "$RESULT" | jq '.allowed_paths | length' 2>/dev/null || echo "0")
assert "Resolve: action node → restricted paths (2)" "$([ "$PATHS_COUNT" = "2" ] && echo true || echo false)"

# --- Test 3: Resolve node without scope → inherits parent ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/no-scope-inherits" 2>/dev/null || echo '{"error":"failed"}')
SOURCE=$(echo "$RESULT" | jq -r '.scope_source // "none"' 2>/dev/null || echo "none")
assert "Resolve: node without scope → scope_source=parent" "$([ "$SOURCE" = "parent" ] && echo true || echo false)"

# --- Test 4: Resolve L2 agent → includes orchestration tools ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "tactic/gx-pack" "2" 2>/dev/null || echo '{"error":"failed"}')
HAS_TASK=$(echo "$RESULT" | jq '.allowed_tools | index("task") != null' 2>/dev/null || echo "false")
assert "Resolve: L2 agent includes 'task' tool" "$HAS_TASK"

# --- Test 5: Resolve L3 agent → excludes orchestration tools ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "tactic/gx-pack" "3" 2>/dev/null || echo '{"error":"failed"}')
HAS_TASK=$(echo "$RESULT" | jq '.allowed_tools | index("task") != null' 2>/dev/null || echo "true")
assert "Resolve: L3 agent excludes 'task' tool" "$([ "$HAS_TASK" = "false" ] && echo true || echo false)"

# --- Test 6: Resolve L3 → excludes hiveops_export ---
HAS_EXPORT=$(echo "$RESULT" | jq '.allowed_tools | index("hiveops_export") != null' 2>/dev/null || echo "true")
assert "Resolve: L3 excludes hiveops_export" "$([ "$HAS_EXPORT" = "false" ] && echo true || echo false)"

# --- Test 7: Resolve L3 → excluded_tools listed ---
EXCLUDED_COUNT=$(echo "$RESULT" | jq '.excluded_tools | length' 2>/dev/null || echo "0")
assert "Resolve: L3 lists excluded_tools" "$([ "$EXCLUDED_COUNT" -ge 1 ] 2>/dev/null && echo true || echo false)"

# --- Test 8: scope_source = "node" when node declares scope ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/fix-schemas" 2>/dev/null || echo '{"scope_source":"none"}')
SOURCE=$(echo "$RESULT" | jq -r '.scope_source // "none"' 2>/dev/null || echo "none")
assert "Resolve: scope_source=node when node has scope" "$([ "$SOURCE" = "node" ] && echo true || echo false)"

# --- Test 9: scope_source = "default" when no ancestor has scope ---
# Create a hierarchy where nothing has scope
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {
    "type": "trajectory",
    "id": "root",
    "children": [
      {"type": "action", "id": "action/bare-node", "children": []}
    ]
  }
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/bare-node" 2>/dev/null || echo '{"scope_source":"none"}')
SOURCE=$(echo "$RESULT" | jq -r '.scope_source // "none"' 2>/dev/null || echo "none")
assert "Resolve: scope_source=default when no ancestor has scope" "$([ "$SOURCE" = "default" ] && echo true || echo false)"

# --- Test 10: Check: path in scope → in_scope=true ---
# Restore full hierarchy
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {
    "type": "trajectory",
    "id": "root",
    "children": [
      {
        "type": "action",
        "id": "action/test",
        "scope": {
          "allowed_paths": [".opencode/**", ".hivemind/**"],
          "allowed_tools": ["read", "write"],
          "allowed_delegations": ["hivemaker"]
        },
        "children": []
      }
    ]
  }
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check "action/test" ".opencode/skills/test.md" 2>/dev/null || echo '{"in_scope":false}')
IN_SCOPE=$(echo "$RESULT" | jq -r '.in_scope // false' 2>/dev/null || echo "false")
assert "Check: path in scope returns in_scope=true" "$IN_SCOPE"

# --- Test 11: Check: path out of scope → in_scope=false ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check "action/test" "src/main.ts" 2>/dev/null || echo '{}')
IN_SCOPE=$(echo "$RESULT" | jq -r 'if has("in_scope") then (.in_scope | tostring) else "unknown" end' 2>/dev/null || echo "unknown")
assert "Check: path out of scope returns in_scope=false" "$([ "$IN_SCOPE" = "false" ] && echo true || echo false)"

# --- Test 12: Depth: root = 0 ---
# Restore multi-level hierarchy
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {
    "type": "trajectory",
    "id": "root",
    "children": [
      {
        "type": "tactic",
        "id": "tactic/level2",
        "children": [
          {"type": "action", "id": "action/level3", "children": []}
        ]
      }
    ]
  }
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" depth "root" 2>/dev/null || echo '{"depth":-1}')
DEPTH=$(echo "$RESULT" | jq '.depth // -1' 2>/dev/null || echo "-1")
assert "Depth: root = 0" "$([ "$DEPTH" = "0" ] && echo true || echo false)"

# --- Test 13: Depth: tactic = 1 ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" depth "tactic/level2" 2>/dev/null || echo '{"depth":-1}')
DEPTH=$(echo "$RESULT" | jq '.depth // -1' 2>/dev/null || echo "-1")
assert "Depth: tactic = 1" "$([ "$DEPTH" = "1" ] && echo true || echo false)"

# --- Test 14: Depth: action = 2 ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" depth "action/level3" 2>/dev/null || echo '{"depth":-1}')
DEPTH=$(echo "$RESULT" | jq '.depth // -1' 2>/dev/null || echo "-1")
assert "Depth: action = 2" "$([ "$DEPTH" = "2" ] && echo true || echo false)"

# --- Test 15: Missing hierarchy.json → default scope ---
rm -f "$WORKDIR/.hivemind/state/hierarchy.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/test" 2>/dev/null || echo '{"scope_source":"none"}')
SOURCE=$(echo "$RESULT" | jq -r '.scope_source // "none"' 2>/dev/null || echo "none")
assert "Missing hierarchy.json: returns default scope" "$([ "$SOURCE" = "default" ] && echo true || echo false)"

# --- Test 16: Node not found → error ---
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {"type": "trajectory", "id": "root", "children": []}
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/nonexistent" 2>/dev/null || echo '{"scope_source":"none"}')
SOURCE=$(echo "$RESULT" | jq -r '.scope_source // "none"' 2>/dev/null || echo "none")
assert "Node not found: returns default scope (fallback)" "$([ "$SOURCE" = "default" ] && echo true || echo false)"

# --- Test 17: Depth: node not found → depth=-1 ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" depth "action/nonexistent" 2>/dev/null || echo '{"depth":-1}')
DEPTH=$(echo "$RESULT" | jq '.depth // -1' 2>/dev/null || echo "-1")
assert "Depth: nonexistent node returns depth=-1" "$([ "$DEPTH" = "-1" ] && echo true || echo false)"

# --- Test 18: Unknown action returns error ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" unknown-action 2>/dev/null) || true
HAS_ERROR=$(echo "$RESULT" | jq -s '.[0] | has("error")' 2>/dev/null || echo "false")
assert "Unknown action: returns error JSON" "$HAS_ERROR"

# --- Test 19: Invalid agent_level defaults to 2 (no crash) ---
# Restore multi-level hierarchy
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {
    "type": "trajectory",
    "id": "root",
    "children": [
      {"type": "action", "id": "action/test", "scope": {"allowed_paths": [".opencode/**"], "allowed_tools": ["read", "task"], "allowed_delegations": ["hivemaker"]}, "children": []}
    ]
  }
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/test" "abc" 2>/dev/null || echo '{"error":"failed"}')
HAS_TOOLS=$(echo "$RESULT" | jq 'has("allowed_tools")' 2>/dev/null || echo "false")
assert "Invalid agent_level: defaults to 2, no crash" "$HAS_TOOLS"

# --- Test 20: Default scope includes 'skill' tool ---
rm -f "$WORKDIR/.hivemind/state/hierarchy.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" resolve "action/nonexistent" 2>/dev/null || echo '{"error":"failed"}')
HAS_SKILL=$(echo "$RESULT" | jq '.allowed_tools | index("skill") != null' 2>/dev/null || echo "false")
assert "Default scope includes 'skill' tool" "$HAS_SKILL"

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
