#!/usr/bin/env bash
# gx-enforce.sh — Hard block enforcement engine (CR-01, CR-08)
#
# CHAIN: Enforcement (Chain 8) — Runtime scope enforcement
# TRIGGER: Every tool call / path access / delegation
# OUTPUT: JSON {allowed: bool, reason: string} or state updates
#
# USAGE:
#   gx-enforce.sh <workdir> init <node_id>                       — Initialize enforcement for a hierarchy node
#   gx-enforce.sh <workdir> check-path <path>                    — Check if path is within current scope
#   gx-enforce.sh <workdir> check-tool <tool_name>               — Check if tool is allowed
#   gx-enforce.sh <workdir> check-delegation <agent>             — Check if delegation target is allowed
#   gx-enforce.sh <workdir> record-violation <type> <detail>     — Record a scope violation
#   gx-enforce.sh <workdir> status                               — Return current enforcement state
#   gx-enforce.sh <workdir> set-mode <mode>                      — Set enforcement mode
#   gx-enforce.sh <workdir> set-node <node_id>                   — Update active hierarchy node + scope

set -euo pipefail

WORKDIR="${1:-.}"
ACTION="${2:-}"
ARG1="${3:-}"
ARG2="${4:-}"

STATE_DIR="$WORKDIR/.hivemind/state"
ENFORCEMENT_FILE="$STATE_DIR/enforcement.json"
HIERARCHY_FILE="$STATE_DIR/hierarchy.json"

# --- Pre-flight ---
if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq_not_found","message":"jq is required but not installed"}'
  exit 1
fi

# --- Locking (mkdir-based POSIX atomic) ---
LOCK_DIR=""
with_lock() {
  local lock_name="$1"
  shift
  local lock_path="$STATE_DIR/.lock-$lock_name"
  local max_wait=10
  local waited=0

  while ! mkdir "$lock_path" 2>/dev/null; do
    waited=$((waited + 1))
    if [ "$waited" -ge "$max_wait" ]; then
      echo '{"error":"lock_timeout","message":"Could not acquire lock"}'
      return 1
    fi
    sleep 1
  done

  LOCK_DIR="$lock_path"
  trap 'rmdir "${LOCK_DIR:-}" 2>/dev/null; trap - EXIT' EXIT

  "$@"
  local rc=$?

  rmdir "$lock_path" 2>/dev/null || true
  LOCK_DIR=""
  trap - EXIT

  return $rc
}

# --- Default scope ---
DEFAULT_PATHS='[".opencode/**", ".hivemind/**", "docs/**"]'
DEFAULT_TOOLS='["read", "glob", "grep", "write", "edit", "bash", "task", "skill", "hiveops_todo", "hiveops_gate", "hiveops_sot", "hiveops_export"]'
DEFAULT_DELEGATIONS='["hivemaker", "hiveq", "hivexplorer", "hiveplanner", "hiverd"]'

# --- Hierarchy node lookup ---
# Recursively find a node by ID in hierarchy tree
find_node_scope() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
    echo ""
    return 0
  fi

  # Use jq to recursively walk the tree and find the node
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

# Walk up the tree to find nearest ancestor with a scope
find_ancestor_scope() {
  local node_id="$1"

  if [ ! -f "$HIERARCHY_FILE" ]; then
    echo ""
    return 0
  fi

  # Use jq to find the path to the node, then walk up for scope
  local scope
  scope=$(jq -r --arg id "$node_id" '
    # Build path from root to target node
    def find_path($id):
      if .id == $id then [.]
      elif has("children") then
        .children[]? | find_path($id) as $p | if $p then [.] + $p else empty end
      else empty
      end;
    [.root | find_path($id)] | .[0] // [] |
    # Walk from deepest ancestor to shallowest, find first with scope
    reverse | .[1:][] | select(has("scope") and .scope != null) | .scope | limit(1;.)
  ' "$HIERARCHY_FILE" 2>/dev/null || echo "")

  if [ -n "$scope" ] && [ "$scope" != "null" ]; then
    echo "$scope"
  else
    echo ""
  fi
}

# Resolve scope: node scope → parent scope → default
resolve_scope() {
  local node_id="$1"

  # Try node's own scope first
  local scope
  scope=$(find_node_scope "$node_id")

  if [ -n "$scope" ]; then
    echo "$scope"
    return 0
  fi

  # Try ancestor scope (parent inheritance per CR-08)
  local ancestor_scope
  ancestor_scope=$(find_ancestor_scope "$node_id")

  if [ -n "$ancestor_scope" ]; then
    echo "$ancestor_scope"
    return 0
  fi

  # No scope on node or ancestors → use default
  jq -n \
    --argjson paths "$DEFAULT_PATHS" \
    --argjson tools "$DEFAULT_TOOLS" \
    --argjson delegations "$DEFAULT_DELEGATIONS" \
    '{"allowed_paths": $paths, "allowed_tools": $tools, "allowed_delegations": $delegations}'
}

# --- Path matching ---
# Match a path against a glob pattern
path_matches_pattern() {
  local path="$1"
  local pattern="$2"

  # Strip trailing /** for prefix matching
  local prefix="${pattern%%/\*\*}"

  if [ "$prefix" != "$pattern" ]; then
    # Pattern ends with /** → match any path starting with prefix
    case "$path" in
      "${prefix}/"*|"${prefix}") return 0 ;;
    esac
  else
    # Exact match or single-level glob
    case "$path" in
      "$pattern") return 0 ;;
    esac
  fi

  return 1
}

# Check if path matches any allowed pattern
path_in_scope() {
  local path="$1"
  local allowed_paths_json="$2"

  local count
  count=$(echo "$allowed_paths_json" | jq 'length' 2>/dev/null || echo "0")

  local i=0
  while [ "$i" -lt "$count" ]; do
    local pattern
    pattern=$(echo "$allowed_paths_json" | jq -r ".[$i]" 2>/dev/null || echo "")
    if path_matches_pattern "$path" "$pattern"; then
      echo "$pattern"
      return 0
    fi
    i=$((i + 1))
  done

  echo ""
  return 1
}

# --- Atomic write helper ---
write_enforcement() {
  local content="$1"
  mkdir -p "$STATE_DIR"
  local tmp_file
  tmp_file=$(mktemp "$STATE_DIR/.enforcement.XXXXXX")
  echo "$content" > "$tmp_file"
  mv "$tmp_file" "$ENFORCEMENT_FILE"
}

# --- Read enforcement state safely ---
read_enforcement() {
  if [ ! -f "$ENFORCEMENT_FILE" ]; then
    echo ""
    return 1
  fi

  if ! jq '.' "$ENFORCEMENT_FILE" >/dev/null 2>&1; then
    echo ""
    return 1
  fi

  jq '.' "$ENFORCEMENT_FILE"
}

# --- Commands ---

do_init() {
  local node_id="$1"
  mkdir -p "$STATE_DIR"

  local scope
  scope=$(resolve_scope "$node_id")

  local now
  now=$(date +%s)

  local state
  state=$(jq -n \
    --arg schema "gx-enforcement-v1" \
    --arg node "$node_id" \
    --argjson scope "$scope" \
    --argjson ts "$now" \
    '{
      "$schema": $schema,
      "version": 1,
      "mode": "active",
      "active_node": $node,
      "scope": $scope,
      "violations": [],
      "last_check": $ts,
      "block_active": false,
      "block_reason": null
    }')

  write_enforcement "$state"
  echo "$state"
}

do_check_path() {
  local path="$1"

  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"allowed":false,"reason":"No enforcement state. Run init first."}'
    return 0
  fi

  local mode
  mode=$(echo "$state" | jq -r '.mode' 2>/dev/null || echo "active")

  if [ "$mode" = "disabled" ]; then
    jq -n '{"allowed":true}'
    return 0
  fi

  local allowed_paths
  allowed_paths=$(echo "$state" | jq '.scope.allowed_paths // []' 2>/dev/null || echo "[]")

  local matched
  matched=$(path_in_scope "$path" "$allowed_paths") || true

  if [ -n "$matched" ]; then
    jq -n --arg p "$matched" '{"allowed":true,"matched_pattern":$p}'
  else
    local allowed_str
    allowed_str=$(echo "$allowed_paths" | jq -r 'join(", ")' 2>/dev/null || echo "")

    local active_node
    active_node=$(echo "$state" | jq -r '.active_node // "unknown"' 2>/dev/null || echo "unknown")

    if [ "$mode" = "passive" ]; then
      jq -n --arg p "$path" --arg a "$allowed_str" \
        '{"allowed":true,"warning":("Path not in scope: " + $p + ". Allowed: " + $a)}'
    else
      jq -n --arg p "$path" --arg a "$allowed_str" --arg node "$active_node" \
        '{"allowed":false,"reason":("BLOCKED: Path " + $p + " not in scope for node " + $node + ". Allowed: " + $a)}'
    fi
  fi
}

do_check_tool() {
  local tool="$1"

  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"allowed":false,"reason":"No enforcement state. Run init first."}'
    return 0
  fi

  local mode
  mode=$(echo "$state" | jq -r '.mode' 2>/dev/null || echo "active")

  if [ "$mode" = "disabled" ]; then
    jq -n '{"allowed":true}'
    return 0
  fi

  local allowed
  allowed=$(echo "$state" | jq --arg t "$tool" '.scope.allowed_tools | index($t) != null' 2>/dev/null || echo "false")

  if [ "$allowed" = "true" ]; then
    jq -n '{"allowed":true}'
  else
    local allowed_str
    allowed_str=$(echo "$state" | jq -r '.scope.allowed_tools | join(", ")' 2>/dev/null || echo "")

    if [ "$mode" = "passive" ]; then
      jq -n --arg t "$tool" --arg a "$allowed_str" \
        '{"allowed":true,"warning":("Tool not allowed: " + $t + ". Allowed: " + $a)}'
    else
      jq -n --arg t "$tool" --arg a "$allowed_str" \
        '{"allowed":false,"reason":("BLOCKED: Tool " + $t + " not allowed. Allowed: " + $a)}'
    fi
  fi
}

do_check_delegation() {
  local agent="$1"

  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"allowed":false,"reason":"No enforcement state. Run init first."}'
    return 0
  fi

  local mode
  mode=$(echo "$state" | jq -r '.mode' 2>/dev/null || echo "active")

  if [ "$mode" = "disabled" ]; then
    jq -n '{"allowed":true}'
    return 0
  fi

  local allowed
  allowed=$(echo "$state" | jq --arg a "$agent" '.scope.allowed_delegations | index($a) != null' 2>/dev/null || echo "false")

  if [ "$allowed" = "true" ]; then
    jq -n '{"allowed":true}'
  else
    local allowed_str
    allowed_str=$(echo "$state" | jq -r '.scope.allowed_delegations | join(", ")' 2>/dev/null || echo "")

    if [ "$mode" = "passive" ]; then
      jq -n --arg a "$agent" --arg al "$allowed_str" \
        '{"allowed":true,"warning":("Delegation target not allowed: " + $a + ". Allowed: " + $al)}'
    else
      jq -n --arg a "$agent" --arg al "$allowed_str" \
        '{"allowed":false,"reason":("BLOCKED: Delegation to " + $a + " not allowed. Allowed: " + $al)}'
    fi
  fi
}

do_record_violation_inner() {
  local vtype="$1"
  local detail="$2"

  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"error":"no_enforcement_state","message":"Run init first"}'
    return 1
  fi

  local now
  now=$(date +%s)

  local mode
  mode=$(echo "$state" | jq -r '.mode' 2>/dev/null || echo "active")
  local blocked="true"
  if [ "$mode" = "passive" ] || [ "$mode" = "disabled" ]; then
    blocked="false"
  fi

  local updated
  updated=$(echo "$state" | jq \
    --arg t "$vtype" \
    --arg d "$detail" \
    --argjson ts "$now" \
    --argjson b "$blocked" \
    '.violations += [{"timestamp": $ts, "type": $t, "detail": $d, "blocked": $b}] | .last_check = $ts')

  write_enforcement "$updated"
  jq -n --arg t "$vtype" --argjson ts "$now" '{"recorded":true,"type":$t,"timestamp":$ts}'
}

do_record_violation() {
  with_lock "enforcement" do_record_violation_inner "$@"
}

do_status() {
  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"mode":"uninitialized","active_node":null,"violation_count":0,"block_active":false}'
    return 0
  fi

  local vcount
  vcount=$(echo "$state" | jq '.violations | length' 2>/dev/null || echo "0")

  echo "$state" | jq --argjson vc "$vcount" '{
    mode: .mode,
    active_node: .active_node,
    scope: .scope,
    violation_count: $vc,
    block_active: .block_active,
    block_reason: .block_reason,
    last_check: .last_check
  }'
}

do_set_mode_inner() {
  local mode="$1"

  # Validate mode
  case "$mode" in
    active|passive|disabled) ;;
    *)
      jq -n --arg m "$mode" '{"error":"invalid_mode","message":"Mode must be active, passive, or disabled. Got: " + $m}'
      return 1
      ;;
  esac

  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"error":"no_enforcement_state","message":"Run init first"}'
    return 1
  fi

  # CR-01: switching to disabled requires approval_token (audit trail)
  if [ "$mode" = "disabled" ]; then
    local approval_token="${ARG2:-}"
    if [ -z "$approval_token" ]; then
      jq -n '{"error":"approval_required","message":"Switching to disabled mode requires explicit approval. Usage: set-mode disabled <approval_reason>"}'
      return 0
    fi

    local now
    now=$(date +%s)

    # Record the override in violations as audit trail
    local updated_with_audit
    updated_with_audit=$(echo "$state" | jq \
      --arg m "$mode" \
      --arg reason "$approval_token" \
      --argjson ts "$now" \
      '.mode = $m | .violations += [{"timestamp": $ts, "type": "mode_override", "detail": ("Enforcement disabled. Approval: " + $reason), "blocked": false}]')

    write_enforcement "$updated_with_audit"
    jq -n --arg m "$mode" --arg r "$approval_token" '{"mode":$m,"updated":true,"audit":"mode_override_recorded","approval_reason":$r}'
    return 0
  fi

  local updated
  updated=$(echo "$state" | jq --arg m "$mode" '.mode = $m')
  write_enforcement "$updated"

  jq -n --arg m "$mode" '{"mode":$m,"updated":true}'
}

do_set_mode() {
  with_lock "enforcement" do_set_mode_inner "$@"
}

do_set_node_inner() {
  local node_id="$1"

  local state
  state=$(read_enforcement)
  if [ -z "$state" ]; then
    jq -n '{"error":"no_enforcement_state","message":"Run init first"}'
    return 1
  fi

  local scope
  scope=$(resolve_scope "$node_id")

  local now
  now=$(date +%s)

  local updated
  updated=$(echo "$state" | jq \
    --arg n "$node_id" \
    --argjson s "$scope" \
    --argjson ts "$now" \
    '.active_node = $n | .scope = $s | .last_check = $ts')

  write_enforcement "$updated"

  jq -n --arg n "$node_id" '{"active_node":$n,"updated":true}'
}

do_set_node() {
  with_lock "enforcement" do_set_node_inner "$@"
}

# --- Dispatch ---
case "$ACTION" in
  init)
    [ -z "$ARG1" ] && { echo '{"error":"missing_node_id","message":"Usage: gx-enforce.sh <workdir> init <node_id>"}'; exit 1; }
    do_init "$ARG1"
    ;;
  check-path)
    [ -z "$ARG1" ] && { echo '{"error":"missing_path","message":"Usage: gx-enforce.sh <workdir> check-path <path>"}'; exit 1; }
    do_check_path "$ARG1"
    ;;
  check-tool)
    [ -z "$ARG1" ] && { echo '{"error":"missing_tool","message":"Usage: gx-enforce.sh <workdir> check-tool <tool>"}'; exit 1; }
    do_check_tool "$ARG1"
    ;;
  check-delegation)
    [ -z "$ARG1" ] && { echo '{"error":"missing_agent","message":"Usage: gx-enforce.sh <workdir> check-delegation <agent>"}'; exit 1; }
    do_check_delegation "$ARG1"
    ;;
  record-violation)
    [ -z "$ARG1" ] && { echo '{"error":"missing_type","message":"Usage: gx-enforce.sh <workdir> record-violation <type> <detail>"}'; exit 1; }
    do_record_violation "$ARG1" "${ARG2:-unspecified}"
    ;;
  status)
    do_status
    ;;
  set-mode)
    [ -z "$ARG1" ] && { echo '{"error":"missing_mode","message":"Usage: gx-enforce.sh <workdir> set-mode <active|passive|disabled>"}'; exit 1; }
    do_set_mode "$ARG1"
    ;;
  set-node)
    [ -z "$ARG1" ] && { echo '{"error":"missing_node","message":"Usage: gx-enforce.sh <workdir> set-node <node_id>"}'; exit 1; }
    do_set_node "$ARG1"
    ;;
  *)
    jq -n --arg a "${ACTION:-}" '{"error":"unknown_action","message":("Unknown action: " + $a + ". Valid: init, check-path, check-tool, check-delegation, record-violation, status, set-mode, set-node")}'
    exit 1
    ;;
esac
