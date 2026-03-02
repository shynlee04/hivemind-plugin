#!/usr/bin/env bash
# gx-schema-sync.sh — Schema validation + registry management (CR-06)
#
# CHAIN: Schema Sync (Chain 7) — Step 1
# TRIGGER: file.edited event on .hivemind/state/*.json
# OUTPUT: Validation result JSON or registry update
#
# USAGE:
#   gx-schema-sync.sh <workdir> validate <file>      — Validate a state file against its schema
#   gx-schema-sync.sh <workdir> register              — Initialize/update schema registry
#   gx-schema-sync.sh <workdir> check-all             — Validate ALL state files
#   gx-schema-sync.sh <workdir> status                — Report registry health

set -euo pipefail

WORKDIR="${1:-.}"
ACTION="${2:-}"
TARGET="${3:-}"

STATE_DIR="$WORKDIR/.hivemind/state"
REGISTRY_FILE="$STATE_DIR/schema-registry.json"

# --- Pre-flight ---
if ! command -v jq >/dev/null 2>&1; then
  echo '{"error":"jq_not_found","message":"jq is required but not installed"}'
  exit 1
fi

# --- Locking (mkdir-based POSIX atomic, macOS-compatible) ---
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
      echo '{"error":"lock_timeout","message":"Could not acquire lock after '"$max_wait"'s"}'
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

# --- Schema definitions ---

# Returns required fields for a schema
get_required_fields() {
  local schema_id="$1"
  case "$schema_id" in
    gx-runtime-profile-v1)
      echo "id created created_epoch ttl intent policy_version role_envelope capabilities constraints"
      ;;
    gx-todo-v1)
      echo "version items lastSync"
      ;;
    gx-health-metrics-v1)
      echo "\$schema version signals composite thresholds history"
      ;;
    gx-hierarchy-v1)
      echo "version root"
      ;;
    gx-enforcement-v1)
      echo "\$schema version mode active_node scope violations last_check block_active block_reason"
      ;;
    gx-workflow-state-v1)
      echo "workflow_id current_step total_steps is_blocked"
      ;;
    *)
      echo ""
      ;;
  esac
}

# Returns allowed fields for a schema (required + optional)
get_allowed_fields() {
  local schema_id="$1"
  case "$schema_id" in
    gx-runtime-profile-v1)
      echo "id created created_epoch ttl intent policy_version role_envelope capabilities constraints"
      ;;
    gx-todo-v1)
      echo "version items lastSync activeItem"
      ;;
    gx-health-metrics-v1)
      echo "\$schema version signals composite thresholds history"
      ;;
    gx-hierarchy-v1)
      echo "version root cursor"
      ;;
    gx-enforcement-v1)
      echo "\$schema version mode active_node scope violations last_check block_active block_reason"
      ;;
    gx-workflow-state-v1)
      echo "workflow_id current_step total_steps step_name iteration_count max_iterations started_at last_step_completed_at step_outputs transition_log is_blocked blocked_reason"
      ;;
    *)
      echo ""
      ;;
  esac
}

# Map filename to schema ID
filename_to_schema() {
  local filename="$1"
  case "$filename" in
    runtime-profile.json)    echo "gx-runtime-profile-v1" ;;
    todo.json)               echo "gx-todo-v1" ;;
    health-metrics.json)     echo "gx-health-metrics-v1" ;;
    hierarchy.json)          echo "gx-hierarchy-v1" ;;
    enforcement.json)        echo "gx-enforcement-v1" ;;
    decisions.jsonl)         echo "gx-decision-entry-v1" ;;
    wf-*.json)               echo "gx-workflow-state-v1" ;;
    schema-registry.json)    echo "gx-schema-registry-v1" ;;
    *)                       echo "unknown" ;;
  esac
}

# Validate required fields present
validate_required() {
  local file="$1"
  local schema_id="$2"
  local required
  required=$(get_required_fields "$schema_id")

  if [ -z "$required" ]; then
    echo "[]"
    return 0
  fi

  local errors="[]"
  for field in $required; do
    local has_field
    if [ "$field" = "\$schema" ]; then
      has_field=$(jq 'has("$schema")' "$file" 2>/dev/null || echo "false")
    else
      has_field=$(jq --arg f "$field" 'has($f)' "$file" 2>/dev/null || echo "false")
    fi

    if [ "$has_field" != "true" ]; then
      errors=$(echo "$errors" | jq --arg f "$field" '. + ["missing required field: " + $f]')
    fi
  done

  echo "$errors"
}

# Validate no unknown top-level fields
validate_no_unknown() {
  local file="$1"
  local schema_id="$2"
  local allowed
  allowed=$(get_allowed_fields "$schema_id")

  if [ -z "$allowed" ]; then
    echo "[]"
    return 0
  fi

  # Build jq array of allowed field names
  local allowed_json="[]"
  for field in $allowed; do
    if [ "$field" = "\$schema" ]; then
      allowed_json=$(echo "$allowed_json" | jq '. + ["$schema"]')
    else
      allowed_json=$(echo "$allowed_json" | jq --arg f "$field" '. + [$f]')
    fi
  done

  # Find unknown fields
  local unknown
  unknown=$(jq --argjson allowed "$allowed_json" '
    keys | map(select(. as $k | $allowed | index($k) | not))
  ' "$file" 2>/dev/null || echo "[]")

  local count
  count=$(echo "$unknown" | jq 'length' 2>/dev/null || echo "0")

  if [ "$count" -gt 0 ]; then
    echo "$unknown" | jq '[.[] | "unknown field: " + .]'
  else
    echo "[]"
  fi
}

# Validate version field is numeric
validate_version_field() {
  local file="$1"
  local has_version
  has_version=$(jq 'has("version")' "$file" 2>/dev/null || echo "false")

  if [ "$has_version" = "true" ]; then
    local version_type
    version_type=$(jq '.version | type' "$file" 2>/dev/null || echo '"null"')
    if [ "$version_type" != '"number"' ]; then
      echo '["version field must be numeric"]'
      return 0
    fi
  fi
  echo "[]"
}

# --- Per-schema type validation (CR-06 strict typed) ---
validate_types() {
  local file="$1"
  local schema_id="$2"
  local errors="[]"

  case "$schema_id" in
    gx-runtime-profile-v1)
      errors=$(jq '
        def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
        chk("id";"string") + chk("created";"string") + chk("created_epoch";"number") +
        chk("ttl";"number") + chk("intent";"string") + chk("policy_version";"string") +
        chk("role_envelope";"object") + chk("capabilities";"object") + chk("constraints";"array")
      ' "$file" 2>/dev/null || echo "[]")
      ;;
    gx-todo-v1)
      errors=$(jq '
        def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
        def chk_nullable(f; t): if has(f) and .[f] != null and (.[f] | type) != t then ["field " + f + ": expected " + t + " or null, got " + (.[f] | type)] else [] end;
        chk("version";"number") + chk("items";"array") + chk("lastSync";"number") +
        chk_nullable("activeItem";"string")
      ' "$file" 2>/dev/null || echo "[]")
      ;;
    gx-health-metrics-v1)
      errors=$(jq '
        def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
        chk("$schema";"string") + chk("version";"number") + chk("signals";"object") + chk("composite";"object") +
        chk("thresholds";"object") + chk("history";"array")
      ' "$file" 2>/dev/null || echo "[]")
      ;;
    gx-hierarchy-v1)
      errors=$(jq '
        def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
        def chk_nullable_multi(f; ts): if has(f) and .[f] != null and ((.[f] | type) as $t | ts | index($t) | not) then ["field " + f + ": expected one of " + (ts | join("|")) + " or null, got " + (.[f] | type)] else [] end;
        chk("version";"number") + chk("root";"object") + chk_nullable_multi("cursor"; ["string","object"])
      ' "$file" 2>/dev/null || echo "[]")
      ;;
    gx-enforcement-v1)
      errors=$(jq '
        def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
        def chk_nullable(f; t): if has(f) and .[f] != null and (.[f] | type) != t then ["field " + f + ": expected " + t + " or null, got " + (.[f] | type)] else [] end;
        chk("$schema";"string") + chk("version";"number") + chk("mode";"string") + chk("scope";"object") +
        chk("violations";"array") + chk("last_check";"number") + chk("block_active";"boolean") +
        chk_nullable("active_node";"string") + chk_nullable("block_reason";"string")
      ' "$file" 2>/dev/null || echo "[]")
      ;;
    gx-workflow-state-v1)
      errors=$(jq '
        def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
        def chk_nullable(f; t): if has(f) and .[f] != null and (.[f] | type) != t then ["field " + f + ": expected " + t + " or null, got " + (.[f] | type)] else [] end;
        chk("workflow_id";"string") + chk("current_step";"number") +
        chk("total_steps";"number") + chk("is_blocked";"boolean") +
        chk_nullable("step_name";"string") + chk_nullable("iteration_count";"number") +
        chk_nullable("max_iterations";"number") + chk_nullable("started_at";"number") +
        chk_nullable("last_step_completed_at";"number") + chk_nullable("step_outputs";"object") +
        chk_nullable("transition_log";"array") + chk_nullable("blocked_reason";"string")
      ' "$file" 2>/dev/null || echo "[]")
      ;;
    *)
      errors="[]"
      ;;
  esac

  echo "$errors"
}

# Validate types within JSONL entries
validate_jsonl_types() {
  local line="$1"
  local line_num="$2"
  local errors="[]"

  # Check required field types
  local type_errors
  type_errors=$(echo "$line" | jq '
    def chk(f; t): if has(f) and (.[f] | type) != t then ["field " + f + ": expected " + t + ", got " + (.[f] | type)] else [] end;
    chk("id";"string") + chk("timestamp";"number") + chk("content";"string") +
    chk("rationale";"string") + chk("hierarchy_node";"string") + chk("agent";"string")
  ' 2>/dev/null || echo "[]")

  local count
  count=$(echo "$type_errors" | jq 'length' 2>/dev/null || echo "0")
  if [ "$count" -gt 0 ]; then
    errors=$(echo "$type_errors" | jq --arg ln "$line_num" '[.[] | "line " + $ln + ": " + .]')
  fi

  echo "$errors"
}

# Validate a JSONL file (decisions.jsonl)
validate_jsonl() {
  local file="$1"
  local errors="[]"
  local line_num=0
  local required_fields="id timestamp content rationale hierarchy_node agent"

  while IFS= read -r line || [ -n "$line" ]; do
    line_num=$((line_num + 1))

    # Skip empty lines
    if [ -z "$line" ]; then
      continue
    fi

    # Check valid JSON
    if ! echo "$line" | jq '.' >/dev/null 2>&1; then
      errors=$(echo "$errors" | jq --arg l "line $line_num: invalid JSON" '. + [$l]')
      continue
    fi

    # Check required fields per line
    for field in $required_fields; do
      local has_field
      has_field=$(echo "$line" | jq --arg f "$field" 'has($f)' 2>/dev/null || echo "false")
      if [ "$has_field" != "true" ]; then
        errors=$(echo "$errors" | jq --arg l "line $line_num: missing field $field" '. + [$l]')
      fi
    done

    # Type validation per line
    local type_errors
    type_errors=$(validate_jsonl_types "$line" "$line_num")
    local tcount
    tcount=$(echo "$type_errors" | jq 'length' 2>/dev/null || echo "0")
    if [ "$tcount" -gt 0 ]; then
      errors=$(echo "$errors" | jq --argjson e "$type_errors" '. + $e')
    fi
  done < "$file"

  echo "$errors"
}

# --- Main validate command ---
do_validate() {
  local filename="$1"
  local filepath="$STATE_DIR/$filename"

  # File exists?
  if [ ! -f "$filepath" ]; then
    jq -n --arg fn "$filename" '{"valid":false,"schema_id":"unknown","errors":["file not found: " + $fn]}'
    return 0
  fi

  # Empty file?
  if [ ! -s "$filepath" ]; then
    jq -n '{"valid":false,"schema_id":"unknown","errors":["file is empty"]}'
    return 0
  fi

  # Determine schema
  local schema_id
  schema_id=$(filename_to_schema "$filename")

  if [ "$schema_id" = "unknown" ]; then
    jq -n --arg fn "$filename" '{"valid":false,"schema_id":"unregistered","errors":["no schema defined for: " + $fn]}'
    return 0
  fi

  # Special handling for JSONL files
  if [[ "$filename" == *.jsonl ]]; then
    local jsonl_errors
    jsonl_errors=$(validate_jsonl "$filepath")
    local err_count
    err_count=$(echo "$jsonl_errors" | jq 'length' 2>/dev/null || echo "0")
    if [ "$err_count" -gt 0 ]; then
      jq -n --arg sid "$schema_id" --argjson errs "$jsonl_errors" '{"valid":false,"schema_id":$sid,"errors":$errs}'
    else
      jq -n --arg sid "$schema_id" '{"valid":true,"schema_id":$sid,"errors":[]}'
    fi
    return 0
  fi

  # For JSON files: basic JSON validity
  if ! jq '.' "$filepath" >/dev/null 2>&1; then
    jq -n --arg sid "$schema_id" '{"valid":false,"schema_id":$sid,"errors":["invalid JSON"]}'
    return 0
  fi

  # Skip schema-registry.json from strict validation
  if [ "$schema_id" = "gx-schema-registry-v1" ]; then
    jq -n --arg sid "$schema_id" '{"valid":true,"schema_id":$sid,"errors":[]}'
    return 0
  fi

  # Collect all errors
  local all_errors="[]"

  # Required fields check
  local req_errors
  req_errors=$(validate_required "$filepath" "$schema_id")
  all_errors=$(echo "$all_errors" | jq --argjson e "$req_errors" '. + $e')

  # Unknown fields check
  local unk_errors
  unk_errors=$(validate_no_unknown "$filepath" "$schema_id")
  all_errors=$(echo "$all_errors" | jq --argjson e "$unk_errors" '. + $e')

  # Version field type check
  local ver_errors
  ver_errors=$(validate_version_field "$filepath")
  all_errors=$(echo "$all_errors" | jq --argjson e "$ver_errors" '. + $e')

  # Per-schema type validation (CR-06 strict typed)
  local type_errors
  type_errors=$(validate_types "$filepath" "$schema_id")
  all_errors=$(echo "$all_errors" | jq --argjson e "$type_errors" '. + $e')

  # Result
  local err_count
  err_count=$(echo "$all_errors" | jq 'length' 2>/dev/null || echo "0")

  if [ "$err_count" -gt 0 ]; then
    jq -n --arg sid "$schema_id" --argjson errs "$all_errors" '{"valid":false,"schema_id":$sid,"errors":$errs}'
  else
    jq -n --arg sid "$schema_id" '{"valid":true,"schema_id":$sid,"errors":[]}'
  fi
}

# --- Register command (locked) ---
do_register_inner() {
  mkdir -p "$STATE_DIR"

  local current_version=0
  if [ -f "$REGISTRY_FILE" ]; then
    # Defensive: handle corrupt/non-numeric version
    local raw_version
    raw_version=$(jq '.version // 0' "$REGISTRY_FILE" 2>/dev/null || echo "0")
    if [[ "$raw_version" =~ ^[0-9]+$ ]]; then
      current_version="$raw_version"
    else
      current_version=0
    fi
  fi

  local new_version=$((current_version + 1))
  local now
  now=$(date +%s)

  # Build files map
  local files_json="{}"
  local log_entries="[]"

  for filepath in "$STATE_DIR"/*.json "$STATE_DIR"/*.jsonl; do
    [ -f "$filepath" ] || continue
    local filename
    filename=$(basename "$filepath")

    # Skip the registry itself and lock dirs
    if [ "$filename" = "schema-registry.json" ]; then
      continue
    fi

    local schema_id
    schema_id=$(filename_to_schema "$filename")

    # Validate the file
    local result
    result=$(do_validate "$filename")
    local valid
    valid=$(echo "$result" | jq -r '.valid' 2>/dev/null || echo "false")

    local status="valid"
    if [ "$valid" != "true" ]; then
      if [ "$schema_id" = "unknown" ]; then
        status="unregistered"
      else
        status="invalid"
      fi
    fi

    # Map boolean to valid/invalid for log
    local result_str="invalid"
    if [ "$valid" = "true" ]; then
      result_str="valid"
    fi

    local schema_version=1
    files_json=$(echo "$files_json" | jq \
      --arg fn "$filename" \
      --arg sid "$schema_id" \
      --arg st "$status" \
      --argjson sv "$schema_version" \
      --argjson fv "$new_version" \
      --argjson ts "$now" \
      '.[$fn] = {"schema_id": $sid, "schema_version": $sv, "file_version": $fv, "last_validated": $ts, "status": $st}')

    local errors
    errors=$(echo "$result" | jq '.errors' 2>/dev/null || echo "[]")
    log_entries=$(echo "$log_entries" | jq \
      --arg fn "$filename" \
      --argjson ts "$now" \
      --arg r "$result_str" \
      --argjson e "$errors" \
      '. + [{"file": $fn, "timestamp": $ts, "result": $r, "errors": $e}]')
  done

  # Write registry atomically
  local registry
  registry=$(jq -n \
    --arg schema "gx-schema-registry-v1" \
    --argjson version "$new_version" \
    --argjson files "$files_json" \
    --argjson log "$log_entries" \
    '{"$schema": $schema, "version": $version, "files": $files, "validation_log": $log}')

  local tmp_file
  tmp_file=$(mktemp "$STATE_DIR/.schema-registry.XXXXXX")
  echo "$registry" > "$tmp_file"
  mv "$tmp_file" "$REGISTRY_FILE"

  echo "$registry"
}

do_register() {
  mkdir -p "$STATE_DIR"
  with_lock "schema-registry" do_register_inner
}

# --- Check-all command ---
do_check_all() {
  local total=0
  local valid=0
  local invalid=0
  local unregistered=0
  local results="[]"

  if [ ! -d "$STATE_DIR" ]; then
    jq -n '{"total":0,"valid":0,"invalid":0,"unregistered":0,"results":[]}'
    return 0
  fi

  for filepath in "$STATE_DIR"/*.json "$STATE_DIR"/*.jsonl; do
    [ -f "$filepath" ] || continue
    local filename
    filename=$(basename "$filepath")

    # Skip the registry itself
    if [ "$filename" = "schema-registry.json" ]; then
      continue
    fi

    total=$((total + 1))

    local result
    result=$(do_validate "$filename")
    local is_valid
    is_valid=$(echo "$result" | jq -r '.valid' 2>/dev/null || echo "false")
    local schema_id
    schema_id=$(echo "$result" | jq -r '.schema_id' 2>/dev/null || echo "unknown")

    if [ "$schema_id" = "unregistered" ]; then
      unregistered=$((unregistered + 1))
    elif [ "$is_valid" = "true" ]; then
      valid=$((valid + 1))
    else
      invalid=$((invalid + 1))
    fi

    results=$(echo "$results" | jq --arg fn "$filename" --argjson r "$result" '. + [{"file": $fn, "result": $r}]')
  done

  jq -n \
    --argjson total "$total" \
    --argjson valid "$valid" \
    --argjson invalid "$invalid" \
    --argjson unreg "$unregistered" \
    --argjson results "$results" \
    '{"total": $total, "valid": $valid, "invalid": $invalid, "unregistered": $unreg, "results": $results}'
}

# --- Status command ---
do_status() {
  local check
  check=$(do_check_all)

  local total valid invalid unreg
  total=$(echo "$check" | jq '.total' 2>/dev/null || echo "0")
  valid=$(echo "$check" | jq '.valid' 2>/dev/null || echo "0")
  invalid=$(echo "$check" | jq '.invalid' 2>/dev/null || echo "0")
  unreg=$(echo "$check" | jq '.unregistered' 2>/dev/null || echo "0")

  local health="healthy"
  if [ "$invalid" -gt 0 ]; then
    health="degraded"
  fi
  if [ "$total" -eq 0 ]; then
    health="empty"
  fi

  local registry_version=0
  if [ -f "$REGISTRY_FILE" ]; then
    registry_version=$(jq '.version // 0' "$REGISTRY_FILE" 2>/dev/null || echo "0")
  fi

  jq -n \
    --argjson total "$total" \
    --argjson valid "$valid" \
    --argjson invalid "$invalid" \
    --argjson unreg "$unreg" \
    --arg health "$health" \
    --argjson rv "$registry_version" \
    '{"total": $total, "valid": $valid, "invalid": $invalid, "unregistered": $unreg, "health": $health, "registry_version": $rv}'
}

# --- Dispatch ---
case "$ACTION" in
  validate)
    if [ -z "$TARGET" ]; then
      echo '{"error":"missing_target","message":"Usage: gx-schema-sync.sh <workdir> validate <filename>"}'
      exit 1
    fi
    do_validate "$TARGET"
    ;;
  register)
    do_register
    ;;
  check-all)
    do_check_all
    ;;
  status)
    do_status
    ;;
  *)
    jq -n --arg a "${ACTION:-}" '{"error":"unknown_action","message":("Unknown action: " + $a + ". Valid: validate, register, check-all, status")}'
    exit 1
    ;;
esac
