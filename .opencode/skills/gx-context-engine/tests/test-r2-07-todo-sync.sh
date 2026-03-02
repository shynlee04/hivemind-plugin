#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/Users/apple/hivemind-plugin}"
SCRIPT="$ROOT_DIR/.opencode/skills/gx-context-engine/scripts/gx-todo-sync.sh"

PASS=0
FAIL=0
TOTAL=0

TEMP_DIRS=()

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

make_tempdir() {
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/gx-r2-07.XXXXXX")"
  TEMP_DIRS+=("$dir")
  echo "$dir"
}

cleanup() {
  local dir
  for dir in "${TEMP_DIRS[@]:-}"; do
    if [ -n "$dir" ] && [ -d "$dir" ]; then
      rm -rf "$dir"
    fi
  done
}

run_script() {
  local workdir="$1"
  shift
  if OUTPUT="$($SCRIPT "$workdir" "$@" 2>&1)"; then
    EXIT_CODE=0
  else
    EXIT_CODE=$?
  fi
}

write_hierarchy_base() {
  local dir="$1"
  cat > "$dir/hierarchy.json" <<'JSON'
{
  "id": "traj/gx-pack",
  "type": "trajectory",
  "content": "GX-Pack",
  "status": "active",
  "children": [
    {
      "id": "tactic/r2",
      "type": "tactic",
      "content": "R2 State Persistence",
      "status": "active",
      "children": [
        {
          "id": "action/decision-log",
          "type": "action",
          "content": "Decision log",
          "status": "in_progress"
        },
        {
          "id": "action/workflow-state",
          "type": "action",
          "content": "Workflow state",
          "status": "pending"
        }
      ]
    }
  ]
}
JSON
}

write_hierarchy_no_actions() {
  local dir="$1"
  cat > "$dir/hierarchy.json" <<'JSON'
{
  "id": "traj/gx-pack",
  "type": "trajectory",
  "content": "GX-Pack",
  "status": "active",
  "children": [
    {
      "id": "tactic/r2",
      "type": "tactic",
      "content": "R2 State Persistence",
      "status": "active",
      "children": []
    }
  ]
}
JSON
}

write_todo_base() {
  local dir="$1"
  cat > "$dir/todo.json" <<'JSON'
{
  "items": [
    {
      "id": "t1",
      "content": "Build decision log",
      "status": "in_progress",
      "priority": "high",
      "hierarchy_node": "action/decision-log"
    },
    {
      "id": "t2",
      "content": "Build workflow state",
      "status": "pending",
      "priority": "high",
      "hierarchy_node": "action/workflow-state"
    },
    {
      "id": "t3",
      "content": "Fix orphan bug",
      "status": "pending",
      "priority": "medium"
    }
  ],
  "last_updated": 1709337600
}
JSON
}

write_todo_all_linked() {
  local dir="$1"
  cat > "$dir/todo.json" <<'JSON'
{
  "items": [
    {
      "id": "t1",
      "content": "Build decision log",
      "status": "in_progress",
      "priority": "high",
      "hierarchy_node": "action/decision-log"
    },
    {
      "id": "t2",
      "content": "Build workflow state",
      "status": "pending",
      "priority": "high",
      "hierarchy_node": "action/workflow-state"
    }
  ],
  "last_updated": 1709337600
}
JSON
}

write_todo_empty() {
  local dir="$1"
  cat > "$dir/todo.json" <<'JSON'
{
  "items": [],
  "last_updated": 1709337600
}
JSON
}

trap cleanup EXIT

echo "=== TDD Test: R2-07 TODO-Graph Sync ==="

assert "Script exists" "$([ -f "$SCRIPT" ] && echo true || echo false)"
assert "Pre-flight jq check" "$(command -v jq >/dev/null 2>&1 && echo true || echo false)"

# 1) Sync: all linked -> healthy, linked count
DIR1="$(make_tempdir)"
write_hierarchy_base "$DIR1"
write_todo_all_linked "$DIR1"
run_script "$DIR1" sync
assert "Sync all linked exits 0" "$([ "$EXIT_CODE" -eq 0 ] && echo true || echo false)"
assert "Sync all linked returns healthy" "$(echo "$OUTPUT" | jq -e '.sync_health == "healthy"' >/dev/null 2>&1 && echo true || echo false)"
assert "Sync all linked reports linked=2" "$(echo "$OUTPUT" | jq -e '.linked == 2' >/dev/null 2>&1 && echo true || echo false)"

# 2) Sync: orphan todo reported
DIR2="$(make_tempdir)"
write_hierarchy_base "$DIR2"
write_todo_base "$DIR2"
run_script "$DIR2" sync
assert "Orphan todo is reported" "$(echo "$OUTPUT" | jq -e '.orphan_todos | any(.id == "t3")' >/dev/null 2>&1 && echo true || echo false)"

# 3) Sync: untracked hierarchy action reported
DIR3="$(make_tempdir)"
write_hierarchy_base "$DIR3"
write_todo_all_linked "$DIR3"
TMP_HIERARCHY="$(mktemp "${TMPDIR:-/tmp}/gx-r2-07.hierarchy.XXXXXX")"
jq '.children[0].children += [{"id":"action/deploy","type":"action","content":"Deploy to prod","status":"pending"}]' "$DIR3/hierarchy.json" > "$TMP_HIERARCHY"
mv "$TMP_HIERARCHY" "$DIR3/hierarchy.json"
run_script "$DIR3" sync
assert "Untracked hierarchy action is reported" "$(echo "$OUTPUT" | jq -e '.untracked_nodes | any(.id == "action/deploy")' >/dev/null 2>&1 && echo true || echo false)"

# 4) Sync: status mismatch reported
DIR4="$(make_tempdir)"
write_hierarchy_base "$DIR4"
write_todo_all_linked "$DIR4"
TMP_HIERARCHY2="$(mktemp "${TMPDIR:-/tmp}/gx-r2-07.hierarchy.XXXXXX")"
jq '(.children[0].children[] | select(.id == "action/workflow-state") | .status) = "complete"' "$DIR4/hierarchy.json" > "$TMP_HIERARCHY2"
mv "$TMP_HIERARCHY2" "$DIR4/hierarchy.json"
run_script "$DIR4" sync
assert "Status mismatch is reported" "$(echo "$OUTPUT" | jq -e '.status_mismatches | any(.todo_id == "t2" and .node_id == "action/workflow-state" and .todo_status == "pending" and .node_status == "complete")' >/dev/null 2>&1 && echo true || echo false)"

# 5) Sync: missing hierarchy -> all todos orphan
DIR5="$(make_tempdir)"
write_todo_all_linked "$DIR5"
run_script "$DIR5" sync
assert "Missing hierarchy marks all todos orphan" "$(echo "$OUTPUT" | jq -e '(.orphan_todos | length) == 2' >/dev/null 2>&1 && echo true || echo false)"

# 6) Sync: missing todo -> empty report
DIR6="$(make_tempdir)"
write_hierarchy_base "$DIR6"
run_script "$DIR6" sync
assert "Missing todo returns empty report" "$(echo "$OUTPUT" | jq -e '.linked == 0 and (.orphan_todos | length) == 0 and (.untracked_nodes | length) == 0 and (.status_mismatches | length) == 0' >/dev/null 2>&1 && echo true || echo false)"

# 7) Link: sets hierarchy_node on todo item
DIR7="$(make_tempdir)"
write_todo_base "$DIR7"
run_script "$DIR7" link t3 action/decision-log
assert "Link command exits 0" "$([ "$EXIT_CODE" -eq 0 ] && echo true || echo false)"
assert "Link command updates todo file" "$(jq -e '.items[] | select(.id == "t3") | .hierarchy_node == "action/decision-log"' "$DIR7/todo.json" >/dev/null 2>&1 && echo true || echo false)"

# 8) Check: all linked true
DIR8="$(make_tempdir)"
write_todo_all_linked "$DIR8"
run_script "$DIR8" check
assert "Check all linked returns true" "$(echo "$OUTPUT" | jq -e '.all_linked == true' >/dev/null 2>&1 && echo true || echo false)"

# 9) Check: some unlinked false with count
DIR9="$(make_tempdir)"
write_todo_base "$DIR9"
run_script "$DIR9" check
assert "Check unlinked returns false with count" "$(echo "$OUTPUT" | jq -e '.all_linked == false and .unlinked_count == 1' >/dev/null 2>&1 && echo true || echo false)"

# 10) Empty hierarchy (no action nodes) -> linked=0, healthy
DIR10="$(make_tempdir)"
write_hierarchy_no_actions "$DIR10"
write_todo_empty "$DIR10"
run_script "$DIR10" sync
assert "Empty hierarchy reports linked=0 and healthy" "$(echo "$OUTPUT" | jq -e '.linked == 0 and .sync_health == "healthy"' >/dev/null 2>&1 && echo true || echo false)"

# 11) Sync: completed/cancelled todos are filtered out
DIR11="$(make_tempdir)"
cat > "$DIR11/todo.json" <<'JSON'
{
  "items": [
    {
      "id": "item1",
      "content": "Done item",
      "status": "completed",
      "priority": "medium",
      "hierarchy_node": "action/a"
    },
    {
      "id": "item2",
      "content": "Cancelled item",
      "status": "cancelled",
      "priority": "low",
      "hierarchy_node": "action/b"
    },
    {
      "id": "item3",
      "content": "In progress item",
      "status": "in_progress",
      "priority": "high",
      "hierarchy_node": "action/c"
    },
    {
      "id": "item4",
      "content": "Pending item",
      "status": "pending",
      "priority": "high",
      "hierarchy_node": "action/d"
    }
  ],
  "last_updated": 1709337600
}
JSON
cat > "$DIR11/hierarchy.json" <<'JSON'
{
  "id": "traj/gx-pack",
  "type": "trajectory",
  "content": "GX-Pack",
  "status": "active",
  "children": [
    {
      "id": "tactic/r2",
      "type": "tactic",
      "content": "R2 State Persistence",
      "status": "active",
      "children": [
        {
          "id": "action/a",
          "type": "action",
          "content": "Action A",
          "status": "pending"
        },
        {
          "id": "action/b",
          "type": "action",
          "content": "Action B",
          "status": "in_progress"
        },
        {
          "id": "action/c",
          "type": "action",
          "content": "Action C",
          "status": "in_progress"
        },
        {
          "id": "action/d",
          "type": "action",
          "content": "Action D",
          "status": "pending"
        }
      ]
    }
  ]
}
JSON
run_script "$DIR11" sync
assert "Sync filter exits 0" "$([ "$EXIT_CODE" -eq 0 ] && echo true || echo false)"
assert "Sync filter reports only active linked=2" "$(echo "$OUTPUT" | jq -e '.linked == 2' >/dev/null 2>&1 && echo true || echo false)"
assert "Sync filter excludes completed/cancelled todos" "$(echo "$OUTPUT" | jq -e '(.orphan_todos | any(.id == "item1" or .id == "item2") | not) and (.status_mismatches | any(.todo_id == "item1" or .todo_id == "item2") | not)' >/dev/null 2>&1 && echo true || echo false)"
assert "Sync filter keeps active nodes tracked" "$(echo "$OUTPUT" | jq -e '.untracked_nodes | any(.id == "action/c" or .id == "action/d") | not' >/dev/null 2>&1 && echo true || echo false)"

# 12) Link: non-existent hierarchy node should warn, not crash
DIR12="$(make_tempdir)"
cat > "$DIR12/todo.json" <<'JSON'
{
  "items": [
    {
      "id": "solo1",
      "content": "Standalone task",
      "status": "pending",
      "priority": "high"
    }
  ],
  "last_updated": 1709337600
}
JSON
write_hierarchy_base "$DIR12"
run_script "$DIR12" link solo1 action/not-found
assert "Link missing node exits without crash" "$([ "$EXIT_CODE" -eq 0 ] && echo true || echo false)"
assert "Link missing node still updates todo file" "$(jq -e '.items[] | select(.id == "solo1") | .hierarchy_node == "action/not-found"' "$DIR12/todo.json" >/dev/null 2>&1 && echo true || echo false)"
assert "Link missing node emits warning" "$(echo "$OUTPUT" | jq -e '.warning | test("not found"; "i")' >/dev/null 2>&1 && echo true || echo false)"

echo ""
echo "=== Results: $PASS/$TOTAL passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
