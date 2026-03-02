#!/usr/bin/env bash
# gx-trace-check.sh — Task traceability verification (CR-02)
#
# CHAIN: Traceability (Chain 9) — TODO→hierarchy cross-reference
# TRIGGER: After todo.json or hierarchy.json changes
# OUTPUT: Traceability report JSON
#
# USAGE:
#   gx-trace-check.sh <workdir> check-todos         — Check all active TODOs for hierarchy links
#   gx-trace-check.sh <workdir> check-item <id>      — Check a specific TODO item
#   gx-trace-check.sh <workdir> find-orphans          — List all TODOs without hierarchy links
#   gx-trace-check.sh <workdir> report                — Full traceability report

set -euo pipefail

WORKDIR="${1:-.}"
ACTION="${2:-}"
ARG1="${3:-}"

STATE_DIR="$WORKDIR/.hivemind/state"
TODO_FILE="$STATE_DIR/todo.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"

# --- Pre-flight ---
if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq_not_found","message":"jq is required but not installed"}'
  exit 1
fi

# --- Helper: Read active items from todo.json ---
# Active = in_progress or pending (not completed, not cancelled)
get_active_items() {
  if [ ! -f "$TODO_FILE" ]; then
    echo "[]"
    return 0
  fi

  if ! jq '.' "$TODO_FILE" >/dev/null 2>&1; then
    echo "[]"
    return 0
  fi

  jq '[.items[]? | select(.status == "in_progress" or .status == "pending")]' "$TODO_FILE" 2>/dev/null || echo "[]"
}

# --- Helper: Check if node exists in hierarchy tree ---
node_exists() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
    return 1
  fi

  if ! jq '.' "$HIERARCHY_FILE" >/dev/null 2>&1; then
    return 1
  fi

  local found
  found=$(jq -r --arg id "$node_id" '
    def find_node($id):
      if .id == $id then true
      elif has("children") then .children[]? | find_node($id)
      else empty
      end;
    .root | find_node($id) // false
  ' "$HIERARCHY_FILE" 2>/dev/null || echo "false")

  if [ "$found" = "true" ]; then
    return 0
  else
    return 1
  fi
}

# --- Commands ---

do_check_todos() {
  local items
  items=$(get_active_items)

  local total
  total=$(echo "$items" | jq 'length' 2>/dev/null || echo "0")

  if [ "$total" = "0" ]; then
    jq -n '{"total":0,"traced":0,"orphans":0,"broken_links":0,"orphan_ids":[],"broken_link_ids":[]}'
    return 0
  fi

  local traced=0
  local orphans=0
  local broken_links=0
  local orphan_ids="[]"
  local broken_link_ids="[]"

  local i=0
  while [ "$i" -lt "$total" ]; do
    local item_id
    item_id=$(echo "$items" | jq -r ".[$i].id // \"\"" 2>/dev/null || echo "")

    local has_node
    has_node=$(echo "$items" | jq -r ".[$i] | has(\"hierarchy_node\") and (.hierarchy_node != null) and (.hierarchy_node != \"\")" 2>/dev/null || echo "false")

    if [ "$has_node" = "true" ]; then
      local node_id
      node_id=$(echo "$items" | jq -r ".[$i].hierarchy_node" 2>/dev/null || echo "")

      if node_exists "$node_id"; then
        traced=$((traced + 1))
      else
        broken_links=$((broken_links + 1))
        broken_link_ids=$(echo "$broken_link_ids" | jq --arg id "$item_id" '. + [$id]')
      fi
    else
      orphans=$((orphans + 1))
      orphan_ids=$(echo "$orphan_ids" | jq --arg id "$item_id" '. + [$id]')
    fi

    i=$((i + 1))
  done

  jq -n \
    --argjson total "$total" \
    --argjson traced "$traced" \
    --argjson orphans "$orphans" \
    --argjson broken "$broken_links" \
    --argjson oids "$orphan_ids" \
    --argjson bids "$broken_link_ids" \
    '{"total":$total,"traced":$traced,"orphans":$orphans,"broken_links":$broken,"orphan_ids":$oids,"broken_link_ids":$bids}'
}

do_check_item() {
  local target_id="$1"

  if [ ! -f "$TODO_FILE" ]; then
    jq -n --arg id "$target_id" '{"id":$id,"traced":false,"reason":"todo_file_missing"}'
    return 0
  fi

  # Find the item
  local item
  item=$(jq --arg id "$target_id" '.items[]? | select(.id == $id)' "$TODO_FILE" 2>/dev/null || echo "")

  if [ -z "$item" ]; then
    jq -n --arg id "$target_id" '{"id":$id,"traced":false,"reason":"item_not_found"}'
    return 0
  fi

  # Check if item is active (only in_progress or pending are checked)
  local status
  status=$(echo "$item" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
  if [ "$status" != "in_progress" ] && [ "$status" != "pending" ]; then
    jq -n --arg id "$target_id" --arg st "$status" '{"id":$id,"traced":true,"status":$st,"skipped":"inactive_item"}'
    return 0
  fi

  # Check hierarchy_node field
  local has_node
  has_node=$(echo "$item" | jq 'has("hierarchy_node") and (.hierarchy_node != null) and (.hierarchy_node != "")' 2>/dev/null || echo "false")

  if [ "$has_node" != "true" ]; then
    jq -n --arg id "$target_id" '{"id":$id,"traced":false,"reason":"missing_hierarchy_node"}'
    return 0
  fi

  # Check if the node exists in hierarchy
  local node_id
  node_id=$(echo "$item" | jq -r '.hierarchy_node' 2>/dev/null || echo "")

  if node_exists "$node_id"; then
    jq -n --arg id "$target_id" --arg node "$node_id" '{"id":$id,"traced":true,"hierarchy_node":$node}'
  else
    jq -n --arg id "$target_id" --arg node "$node_id" '{"id":$id,"traced":false,"reason":"node_not_found","hierarchy_node":$node}'
  fi
}

do_find_orphans() {
  local items
  items=$(get_active_items)

  local total
  total=$(echo "$items" | jq 'length' 2>/dev/null || echo "0")

  if [ "$total" = "0" ]; then
    jq -n '{"orphan_ids":[],"count":0}'
    return 0
  fi

  local orphan_ids
  orphan_ids=$(echo "$items" | jq '[.[] | select(has("hierarchy_node") | not) | .id] + [.[] | select(.hierarchy_node == null or .hierarchy_node == "") | .id]' 2>/dev/null || echo "[]")

  # Deduplicate
  orphan_ids=$(echo "$orphan_ids" | jq 'unique' 2>/dev/null || echo "[]")

  local count
  count=$(echo "$orphan_ids" | jq 'length' 2>/dev/null || echo "0")

  jq -n \
    --argjson ids "$orphan_ids" \
    --argjson count "$count" \
    '{"orphan_ids":$ids,"count":$count}'
}

do_report() {
  local check
  check=$(do_check_todos)

  local total traced orphans broken_links
  total=$(echo "$check" | jq '.total // 0' 2>/dev/null || echo "0")
  traced=$(echo "$check" | jq '.traced // 0' 2>/dev/null || echo "0")
  orphans=$(echo "$check" | jq '.orphans // 0' 2>/dev/null || echo "0")
  broken_links=$(echo "$check" | jq '.broken_links // 0' 2>/dev/null || echo "0")
  local orphan_ids
  orphan_ids=$(echo "$check" | jq '.orphan_ids // []' 2>/dev/null || echo "[]")

  # Compute traceability score
  local score=100
  if [ "$total" -gt 0 ]; then
    score=$(( (traced * 100) / total ))
  fi

  # Build broken_link_details
  local broken_link_details="[]"
  local broken_link_ids
  broken_link_ids=$(echo "$check" | jq '.broken_link_ids // []' 2>/dev/null || echo "[]")
  local bcount
  bcount=$(echo "$broken_link_ids" | jq 'length' 2>/dev/null || echo "0")

  local bi=0
  while [ "$bi" -lt "$bcount" ]; do
    local bid
    bid=$(echo "$broken_link_ids" | jq -r ".[$bi]" 2>/dev/null || echo "")

    local bnode=""
    if [ -f "$TODO_FILE" ]; then
      bnode=$(jq -r --arg id "$bid" '.items[]? | select(.id == $id) | .hierarchy_node // ""' "$TODO_FILE" 2>/dev/null || echo "")
    fi

    broken_link_details=$(echo "$broken_link_details" | jq \
      --arg tid "$bid" \
      --arg node "$bnode" \
      '. + [{"todo_id": $tid, "hierarchy_node": $node, "reason": "node_not_found"}]')

    bi=$((bi + 1))
  done

  # Determine status
  local violations=$((orphans + broken_links))
  local status="compliant"
  if [ "$total" -gt 0 ] && [ "$violations" -gt 0 ]; then
    local violation_pct=$(( (violations * 100) / total ))
    if [ "$violation_pct" -gt 30 ]; then
      status="non_compliant"
    else
      status="degraded"
    fi
  fi

  jq -n \
    --argjson traced "$traced" \
    --argjson orphans "$orphans" \
    --argjson broken "$broken_links" \
    --argjson oids "$orphan_ids" \
    --argjson bdetails "$broken_link_details" \
    --argjson score "$score" \
    --arg status "$status" \
    '{
      "traced_items": $traced,
      "orphan_items": $orphans,
      "orphan_ids": $oids,
      "broken_links": $broken,
      "broken_link_details": $bdetails,
      "traceability_score": $score,
      "status": $status
    }'
}

# --- Dispatch ---
case "$ACTION" in
  check-todos)
    do_check_todos
    ;;
  check-item)
    if [ -z "$ARG1" ]; then
      echo '{"error":"missing_id","message":"Usage: gx-trace-check.sh <workdir> check-item <id>"}'
      exit 1
    fi
    do_check_item "$ARG1"
    ;;
  find-orphans)
    do_find_orphans
    ;;
  report)
    do_report
    ;;
  *)
    jq -n --arg a "${ACTION:-}" '{"error":"unknown_action","message":("Unknown action: " + $a + ". Valid: check-todos, check-item, find-orphans, report")}'
    exit 1
    ;;
esac
