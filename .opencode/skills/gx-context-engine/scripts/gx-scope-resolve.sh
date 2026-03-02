#!/usr/bin/env bash
# gx-scope-resolve.sh — Dynamic scope resolution tied to hierarchy depth (CR-08)
#
# CHAIN: Scope Resolution (Chain 10) — Depth-based scope narrowing
# TRIGGER: On node activation / delegation
# OUTPUT: Resolved scope JSON with source attribution
#
# USAGE:
#   gx-scope-resolve.sh <workdir> resolve <node_id> [agent_level]  — Resolve scope for a node
#   gx-scope-resolve.sh <workdir> check <node_id> <path> [level]   — Check if path in scope
#   gx-scope-resolve.sh <workdir> depth <node_id>                   — Get hierarchy depth of node

set -euo pipefail

WORKDIR="${1:-.}"
ACTION="${2:-}"
ARG1="${3:-}"
ARG2="${4:-}"
ARG3="${5:-}"

STATE_DIR="$WORKDIR/.hivemind/state"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"

# --- Pre-flight ---
if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq_not_found","message":"jq is required but not installed"}'
  exit 1
fi

# --- Defaults ---
DEFAULT_PATHS='[".opencode/**", ".hivemind/**", "docs/**"]'
DEFAULT_TOOLS='["read", "glob", "grep", "write", "edit", "bash", "skill", "task", "hiveops_todo", "hiveops_gate", "hiveops_sot", "hiveops_export"]'
DEFAULT_DELEGATIONS='["hivemaker", "hiveq", "hivexplorer", "hiveplanner", "hiverd"]'

# Orchestration tools to subtract for L3 agents
L3_EXCLUDED_TOOLS='["task", "hiveops_export", "hiveops_gate"]'

# --- Hierarchy helpers ---

# Find a node's own scope (empty string if not found or no scope)
find_node_scope() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
    echo ""
    return 0
  fi

  local scope
  scope=$(jq -r --arg id "$node_id" '
    def find_node($id):
      if .id == $id then .
      elif has("children") then .children[]? | find_node($id)
      else empty
      end;
    .root | find_node($id) | .scope // empty
  ' "$HIERARCHY_FILE" 2>/dev/null || echo "")

  if [ -n "$scope" ] && [ "$scope" != "null" ]; then
    echo "$scope"
  else
    echo ""
  fi
}

# Find the nearest ancestor with a scope
find_ancestor_scope() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
    echo ""
    return 0
  fi

  local scope
  scope=$(jq -r --arg id "$node_id" '
    def find_path($id):
      if .id == $id then [.]
      elif has("children") then
        .children[]? | find_path($id) as $p | if $p then [.] + $p else empty end
      else empty
      end;
    [.root | find_path($id)] | .[0] // [] |
    reverse | .[1:][] | select(has("scope") and .scope != null) | .scope | limit(1;.)
  ' "$HIERARCHY_FILE" 2>/dev/null || echo "")

  if [ -n "$scope" ] && [ "$scope" != "null" ]; then
    echo "$scope"
  else
    echo ""
  fi
}

# Get depth of a node (root=0, children=1, grandchildren=2, etc.)
get_node_depth() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
    echo "-1"
    return 0
  fi

  local depth
  depth=$(jq --arg id "$node_id" '
    def find_depth($id; $d):
      if .id == $id then $d
      elif has("children") then .children[]? | find_depth($id; $d + 1)
      else empty
      end;
    .root | find_depth($id; 0) // -1
  ' "$HIERARCHY_FILE" 2>/dev/null || echo "-1")

  echo "$depth"
}

# Check if a node exists
node_exists() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
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

  [ "$found" = "true" ]
}

# Path matching (same logic as gx-enforce.sh)
path_matches_pattern() {
  local path="$1"
  local pattern="$2"

  local prefix="${pattern%%/\*\*}"

  if [ "$prefix" != "$pattern" ]; then
    case "$path" in
      "${prefix}/"*|"${prefix}") return 0 ;;
    esac
  else
    case "$path" in
      "$pattern") return 0 ;;
    esac
  fi

  return 1
}

# --- Commands ---

do_resolve() {
  local node_id="$1"
  local agent_level="${2:-2}"  # Default to L2

  # Validate agent_level is numeric
  if ! [[ "$agent_level" =~ ^[0-9]+$ ]]; then
    agent_level=2
  fi

  local depth
  depth=$(get_node_depth "$node_id")

  # Resolve scope with 3-step fallback: node → ancestor → default
  local scope=""
  local scope_source="default"

  local node_scope
  node_scope=$(find_node_scope "$node_id")

  if [ -n "$node_scope" ]; then
    scope="$node_scope"
    scope_source="node"
  else
    local ancestor_scope
    ancestor_scope=$(find_ancestor_scope "$node_id")

    if [ -n "$ancestor_scope" ]; then
      scope="$ancestor_scope"
      scope_source="parent"
    fi
  fi

  # If still no scope, use defaults
  local allowed_paths allowed_tools allowed_delegations
  if [ -z "$scope" ]; then
    allowed_paths="$DEFAULT_PATHS"
    allowed_tools="$DEFAULT_TOOLS"
    allowed_delegations="$DEFAULT_DELEGATIONS"
  else
    allowed_paths=$(echo "$scope" | jq '.allowed_paths // []' 2>/dev/null || echo "[]")
    allowed_tools=$(echo "$scope" | jq '.allowed_tools // []' 2>/dev/null || echo "[]")
    allowed_delegations=$(echo "$scope" | jq '.allowed_delegations // []' 2>/dev/null || echo "[]")
  fi

  # L3 agent subtraction: remove orchestration tools
  local excluded_tools="[]"
  if [ "$agent_level" = "3" ]; then
    excluded_tools="$L3_EXCLUDED_TOOLS"
    # Subtract excluded tools from allowed
    allowed_tools=$(jq -n \
      --argjson tools "$allowed_tools" \
      --argjson exclude "$L3_EXCLUDED_TOOLS" \
      '$tools | map(select(. as $t | $exclude | index($t) | not))')
  fi

  jq -n \
    --arg nid "$node_id" \
    --argjson depth "$depth" \
    --argjson level "$agent_level" \
    --argjson paths "$allowed_paths" \
    --argjson tools "$allowed_tools" \
    --argjson delegations "$allowed_delegations" \
    --argjson excluded "$excluded_tools" \
    --arg source "$scope_source" \
    '{
      "node_id": $nid,
      "depth": $depth,
      "agent_level": $level,
      "allowed_paths": $paths,
      "allowed_tools": $tools,
      "allowed_delegations": $delegations,
      "excluded_tools": $excluded,
      "scope_source": $source
    }'
}

do_check() {
  local node_id="$1"
  local path="$2"
  local agent_level="${3:-2}"

  local resolved
  resolved=$(do_resolve "$node_id" "$agent_level")

  local allowed_paths
  allowed_paths=$(echo "$resolved" | jq '.allowed_paths // []' 2>/dev/null || echo "[]")

  local count
  count=$(echo "$allowed_paths" | jq 'length' 2>/dev/null || echo "0")

  local i=0
  while [ "$i" -lt "$count" ]; do
    local pattern
    pattern=$(echo "$allowed_paths" | jq -r ".[$i]" 2>/dev/null || echo "")

    if path_matches_pattern "$path" "$pattern"; then
      jq -n --arg p "$pattern" '{"in_scope":true,"matched_pattern":$p}'
      return 0
    fi

    i=$((i + 1))
  done

  jq -n --arg p "$path" '{"in_scope":false,"path":$p}'
}

do_depth() {
  local node_id="$1"

  local depth
  depth=$(get_node_depth "$node_id")

  jq -n --arg nid "$node_id" --argjson d "$depth" '{"node_id":$nid,"depth":$d}'
}

# --- Dispatch ---
case "$ACTION" in
  resolve)
    if [ -z "$ARG1" ]; then
      echo '{"error":"missing_node_id","message":"Usage: gx-scope-resolve.sh <workdir> resolve <node_id> [agent_level]"}'
      exit 1
    fi
    do_resolve "$ARG1" "${ARG2:-2}"
    ;;
  check)
    if [ -z "$ARG1" ] || [ -z "$ARG2" ]; then
      echo '{"error":"missing_args","message":"Usage: gx-scope-resolve.sh <workdir> check <node_id> <path> [level]"}'
      exit 1
    fi
    do_check "$ARG1" "$ARG2" "${ARG3:-2}"
    ;;
  depth)
    if [ -z "$ARG1" ]; then
      echo '{"error":"missing_node_id","message":"Usage: gx-scope-resolve.sh <workdir> depth <node_id>"}'
      exit 1
    fi
    do_depth "$ARG1"
    ;;
  *)
    jq -n --arg a "${ACTION:-}" '{"error":"unknown_action","message":("Unknown action: " + $a + ". Valid: resolve, check, depth")}'
    exit 1
    ;;
esac
