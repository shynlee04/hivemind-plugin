#!/usr/bin/env bash
# TDD Test: R3-03 — Traceability Checker
# CRs: CR-02 (every task traced to hierarchy node)
#
# RED phase: All tests MUST fail before implementation.
# GREEN phase: All assertions MUST pass after implementation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/gx-trace-check.sh"

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

echo "=== TDD Test: R3-03 Traceability Checker ==="

# --- Pre-flight ---
assert "Pre-flight: jq available" "$(command -v jq >/dev/null 2>&1 && echo true || echo false)"

# --- Setup: hierarchy with known nodes ---
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
          {"type": "action", "id": "action/fix-schemas", "children": []},
          {"type": "action", "id": "action/build-engine", "children": []}
        ]
      }
    ]
  },
  "cursor": "action/fix-schemas"
}
EOF

# --- Test 1: check-todos: all items traced → orphans=0 ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Build schema registry", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"},
    {"id": "t2", "content": "Build enforcement", "status": "pending", "priority": "high", "hierarchy_node": "action/build-engine"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check-todos 2>/dev/null || echo '{"orphans":-1}')
ORPHANS=$(echo "$RESULT" | jq '.orphans // -1' 2>/dev/null || echo "-1")
assert "Check-todos: all traced items → orphans=0" "$([ "$ORPHANS" = "0" ] && echo true || echo false)"

# --- Test 2: check-todos: some without hierarchy_node → orphans=N ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Traced task", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"},
    {"id": "t2", "content": "Orphan task", "status": "pending", "priority": "high"},
    {"id": "t3", "content": "Another orphan", "status": "pending", "priority": "medium"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check-todos 2>/dev/null || echo '{"orphans":-1}')
ORPHANS=$(echo "$RESULT" | jq '.orphans // -1' 2>/dev/null || echo "-1")
assert "Check-todos: 2 orphans detected" "$([ "$ORPHANS" = "2" ] && echo true || echo false)"

# --- Test 3: check-item: traced item ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-item "t1" 2>/dev/null || echo '{"traced":false}')
TRACED=$(echo "$RESULT" | jq -r '.traced // false' 2>/dev/null || echo "false")
assert "Check-item: traced item returns traced=true" "$TRACED"

# --- Test 4: check-item: orphan item ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-item "t2" 2>/dev/null || echo '{}')
TRACED=$(echo "$RESULT" | jq -r 'if has("traced") then (.traced | tostring) else "unknown" end' 2>/dev/null || echo "unknown")
REASON=$(echo "$RESULT" | jq -r '.reason // ""' 2>/dev/null || echo "")
assert "Check-item: orphan returns traced=false + reason" "$([ "$TRACED" = "false" ] && [ "$REASON" = "missing_hierarchy_node" ] && echo true || echo false)"

# --- Test 5: check-item: broken link (node not in hierarchy) ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Points to missing node", "status": "in_progress", "priority": "high", "hierarchy_node": "action/nonexistent-node"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check-item "t1" 2>/dev/null || echo '{}')
TRACED=$(echo "$RESULT" | jq -r 'if has("traced") then (.traced | tostring) else "unknown" end' 2>/dev/null || echo "unknown")
REASON=$(echo "$RESULT" | jq -r '.reason // ""' 2>/dev/null || echo "")
assert "Check-item: broken link returns traced=false + node_not_found" "$([ "$TRACED" = "false" ] && [ "$REASON" = "node_not_found" ] && echo true || echo false)"

# --- Test 6: find-orphans: returns correct orphan IDs ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Traced", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"},
    {"id": "t2", "content": "Orphan A", "status": "pending", "priority": "high"},
    {"id": "t3", "content": "Orphan B", "status": "pending", "priority": "medium"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" find-orphans 2>/dev/null || echo '{"orphan_ids":[]}')
ORPHAN_COUNT=$(echo "$RESULT" | jq '.orphan_ids | length' 2>/dev/null || echo "0")
assert "Find-orphans: returns 2 orphan IDs" "$([ "$ORPHAN_COUNT" = "2" ] && echo true || echo false)"

# --- Test 7: find-orphans: empty when all traced ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Traced", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" find-orphans 2>/dev/null || echo '{"orphan_ids":["x"]}')
ORPHAN_COUNT=$(echo "$RESULT" | jq '.orphan_ids | length' 2>/dev/null || echo "1")
assert "Find-orphans: empty when all traced" "$([ "$ORPHAN_COUNT" = "0" ] && echo true || echo false)"

# --- Test 8: report: compliant status when all traced ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" report 2>/dev/null || echo '{"status":"none"}')
STATUS=$(echo "$RESULT" | jq -r '.status // "none"' 2>/dev/null || echo "none")
assert "Report: compliant when all traced" "$([ "$STATUS" = "compliant" ] && echo true || echo false)"

# --- Test 9: report: degraded with <30% orphans ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Traced 1", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"},
    {"id": "t2", "content": "Traced 2", "status": "pending", "priority": "high", "hierarchy_node": "action/build-engine"},
    {"id": "t3", "content": "Traced 3", "status": "pending", "priority": "high", "hierarchy_node": "action/fix-schemas"},
    {"id": "t4", "content": "Traced 4", "status": "pending", "priority": "high", "hierarchy_node": "action/build-engine"},
    {"id": "t5", "content": "Orphan", "status": "pending", "priority": "medium"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" report 2>/dev/null || echo '{"status":"none"}')
STATUS=$(echo "$RESULT" | jq -r '.status // "none"' 2>/dev/null || echo "none")
assert "Report: degraded with <30% orphans (1/5=20%)" "$([ "$STATUS" = "degraded" ] && echo true || echo false)"

# --- Test 10: report: non_compliant with >30% orphans ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Traced", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"},
    {"id": "t2", "content": "Orphan A", "status": "pending", "priority": "high"},
    {"id": "t3", "content": "Orphan B", "status": "pending", "priority": "medium"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" report 2>/dev/null || echo '{"status":"none"}')
STATUS=$(echo "$RESULT" | jq -r '.status // "none"' 2>/dev/null || echo "none")
assert "Report: non_compliant with >30% orphans (2/3=67%)" "$([ "$STATUS" = "non_compliant" ] && echo true || echo false)"

# --- Test 11: report: traceability_score ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" report 2>/dev/null || echo '{"traceability_score":-1}')
SCORE=$(echo "$RESULT" | jq '.traceability_score // -1' 2>/dev/null || echo "-1")
assert "Report: traceability_score is 0-100 number" "$([ "$SCORE" -ge 0 ] 2>/dev/null && [ "$SCORE" -le 100 ] 2>/dev/null && echo true || echo false)"

# --- Test 12: report: broken_link_details ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Points to missing", "status": "in_progress", "priority": "high", "hierarchy_node": "action/nonexistent"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" report 2>/dev/null || echo '{"broken_links":0}')
BROKEN=$(echo "$RESULT" | jq '.broken_links // 0' 2>/dev/null || echo "0")
HAS_DETAILS=$(echo "$RESULT" | jq '.broken_link_details | length > 0' 2>/dev/null || echo "false")
assert "Report: broken_link_details for missing node" "$([ "$BROKEN" -ge 1 ] 2>/dev/null && [ "$HAS_DETAILS" = "true" ] && echo true || echo false)"

# --- Test 13: empty todo.json: graceful ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [],
  "lastSync": 1772409600,
  "activeItem": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check-todos 2>/dev/null || echo '{"total":-1}')
TOTAL_ITEMS=$(echo "$RESULT" | jq '.total // -1' 2>/dev/null || echo "-1")
assert "Empty todo.json: graceful total=0" "$([ "$TOTAL_ITEMS" = "0" ] && echo true || echo false)"

# --- Test 14: missing hierarchy.json: all traced items → broken links ---
rm -f "$WORKDIR/.hivemind/state/hierarchy.json"
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Has node but no hierarchy", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t1"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" report 2>/dev/null || echo '{"broken_links":0}')
BROKEN=$(echo "$RESULT" | jq '.broken_links // 0' 2>/dev/null || echo "0")
assert "Missing hierarchy.json: traced items become broken links" "$([ "$BROKEN" -ge 1 ] 2>/dev/null && echo true || echo false)"

# --- Test 15: missing todo.json: graceful ---
rm -f "$WORKDIR/.hivemind/state/todo.json"
RESULT=$(bash "$SCRIPT" "$WORKDIR" check-todos 2>/dev/null || echo '{"total":-1}')
TOTAL_ITEMS=$(echo "$RESULT" | jq '.total // -1' 2>/dev/null || echo "-1")
assert "Missing todo.json: graceful total=0" "$([ "$TOTAL_ITEMS" = "0" ] && echo true || echo false)"

# --- Test 16: completed items: not checked ---
# Restore hierarchy
cat > "$WORKDIR/.hivemind/state/hierarchy.json" << 'EOF'
{
  "version": 1,
  "root": {"type": "trajectory", "id": "root", "children": [{"type": "action", "id": "action/fix-schemas", "children": []}]},
  "cursor": "action/fix-schemas"
}
EOF

cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Completed no node", "status": "completed", "priority": "high"},
    {"id": "t2", "content": "Cancelled no node", "status": "cancelled", "priority": "high"},
    {"id": "t3", "content": "Active traced", "status": "in_progress", "priority": "high", "hierarchy_node": "action/fix-schemas"}
  ],
  "lastSync": 1772409600,
  "activeItem": "t3"
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check-todos 2>/dev/null || echo '{"total":-1}')
TOTAL_ITEMS=$(echo "$RESULT" | jq '.total // -1' 2>/dev/null || echo "-1")
ORPHANS=$(echo "$RESULT" | jq '.orphans // -1' 2>/dev/null || echo "-1")
assert "Completed/cancelled items: not checked (only 1 active)" "$([ "$TOTAL_ITEMS" = "1" ] && [ "$ORPHANS" = "0" ] && echo true || echo false)"

# --- Test 17: unknown action returns error ---
RESULT=$(bash "$SCRIPT" "$WORKDIR" unknown-action 2>/dev/null) || true
HAS_ERROR=$(echo "$RESULT" | jq -s '.[0] | has("error")' 2>/dev/null || echo "false")
assert "Unknown action: returns error JSON" "$HAS_ERROR"

# --- Test 18: check-item: completed item returns skipped ---
cat > "$WORKDIR/.hivemind/state/todo.json" << 'EOF'
{
  "version": 1,
  "items": [
    {"id": "t1", "content": "Done task no node", "status": "completed", "priority": "high"}
  ],
  "lastSync": 1772409600,
  "activeItem": null
}
EOF

RESULT=$(bash "$SCRIPT" "$WORKDIR" check-item "t1" 2>/dev/null || echo '{}')
SKIPPED=$(echo "$RESULT" | jq -r '.skipped // ""' 2>/dev/null || echo "")
assert "Check-item: completed item returns skipped=inactive_item" "$([ "$SKIPPED" = "inactive_item" ] && echo true || echo false)"

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
