#!/usr/bin/env bash
# validate-delegation.sh — Validate delegation packets before dispatch and return payloads after receipt
# Ensures all required fields are present per HiveFiver delegation contract.
#
# Usage:
#   validate-delegation.sh check <json-file-or-stdin>     — Validate delegation packet
#   validate-delegation.sh verify-return <json-file-or-stdin>  — Validate return payload
#
# Output: JSON with valid, missing_fields, warnings
# Exit: 0 always (validation results in JSON, not exit code)

set -Eeuo pipefail

readonly MODE="${1:-}"
readonly INPUT_FILE="${2:-}"

# --- Accumulators ---
MISSING_FIELDS=()
WARNINGS=()
VALID=true

missing() { MISSING_FIELDS+=("$1"); VALID=false; }
warn() { WARNINGS+=("$1"); }

# --- JSON escape helper ---
json_escape() {
  local str="$1"
  printf '%s' "$str" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g'
}

# --- Check if jq is available ---
has_jq() {
  command -v jq &>/dev/null
}

# --- Read input (file or stdin) ---
read_input() {
  if [[ -n "$INPUT_FILE" && "$INPUT_FILE" != "-" ]]; then
    if [[ ! -f "$INPUT_FILE" ]]; then
      printf '{\n'
      printf '  "valid": false,\n'
      printf '  "missing_fields": ["input_file_not_found"],\n'
      printf '  "warnings": ["File not found: %s"]\n' "$INPUT_FILE"
      printf '}\n'
      exit 0
    fi
    cat "$INPUT_FILE"
  else
    cat
  fi
}

# --- Fallback JSON field extraction (without jq) ---
# These are simple grep-based extractors for basic JSON parsing
extract_field_string() {
  local json="$1"
  local field="$2"
  # Match "field": "value" or "field": "value with \"escapes\""
  printf '%s' "$json" | grep -o "\"$field\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\|\\\\\"\\)*\"" | \
    sed "s/\"$field\"[[:space:]]*:[[:space:]]*\"//" | \
    sed 's/"$//' | head -1 || true
}

extract_field_array() {
  local json="$1"
  local field="$2"
  # Match "field": [...] - extract array content
  printf '%s' "$json" | grep -o "\"$field\"[[:space:]]*:[[:space:]]*\\[.*\\]" | \
    sed "s/\"$field\"[[:space:]]*:[[:space:]]*//" | head -1 || true
}

field_exists() {
  local json="$1"
  local field="$2"
  printf '%s' "$json" | grep -q "\"$field\"[[:space:]]*:"
}

field_is_nonempty_string() {
  local json="$1"
  local field="$2"
  local value
  value="$(extract_field_string "$json" "$field")"
  [[ -n "$value" ]]
}

field_is_nonempty_array() {
  local json="$1"
  local field="$2"
  local value
  value="$(extract_field_array "$json" "$field")"
  # Check it's not empty array []
  local trimmed
  trimmed="$(printf '%s' "$value" | tr -d '[:space:]')"
  [[ -n "$trimmed" && "$trimmed" != "[]" ]]
}

# --- Validate delegation packet (check mode) ---
validate_packet() {
  local json="$1"
  
  # Required: objective (string, non-empty)
  if ! field_exists "$json" "objective"; then
    missing "objective"
  elif ! field_is_nonempty_string "$json" "objective"; then
    missing "objective (empty)"
  fi
  
  # Required: in_scope_paths (array, at least 1 path)
  if ! field_exists "$json" "in_scope_paths"; then
    missing "in_scope_paths"
  elif ! field_is_nonempty_array "$json" "in_scope_paths"; then
    missing "in_scope_paths (empty array)"
  fi
  
  # Required: constraints (array, at least 1 constraint)
  if ! field_exists "$json" "constraints"; then
    missing "constraints"
  elif ! field_is_nonempty_array "$json" "constraints"; then
    missing "constraints (empty array)"
  fi
  
  # Required: required_outputs (array, at least 1 output)
  if ! field_exists "$json" "required_outputs"; then
    missing "required_outputs"
  elif ! field_is_nonempty_array "$json" "required_outputs"; then
    missing "required_outputs (empty array)"
  fi
  
  # Optional but recommended: out_of_scope_paths
  if ! field_exists "$json" "out_of_scope_paths"; then
    warn "out_of_scope_paths not specified (recommended for safety)"
  fi
  
  # Optional but recommended: return_schema
  if ! field_exists "$json" "return_schema"; then
    warn "return_schema not specified (recommended for contract clarity)"
  fi
}

# --- Validate return payload (verify-return mode) ---
validate_return() {
  local json="$1"
  
  # Required: status (string: pass|fail|partial)
  if ! field_exists "$json" "status"; then
    missing "status"
  else
    local status
    status="$(extract_field_string "$json" "status")"
    if [[ "$status" != "pass" && "$status" != "fail" && "$status" != "partial" ]]; then
      warn "status should be 'pass', 'fail', or 'partial' (got: $status)"
    fi
  fi
  
  # Required: findings OR files_created (at least one must exist)
  local has_findings=false
  local has_files_created=false
  
  if field_exists "$json" "findings"; then
    has_findings=true
  fi
  if field_exists "$json" "files_created"; then
    has_files_created=true
  fi
  
  if [[ "$has_findings" != "true" && "$has_files_created" != "true" ]]; then
    missing "findings or files_created (at least one required)"
  fi
  
  # Required: residual_issues (array, can be empty)
  if ! field_exists "$json" "residual_issues"; then
    missing "residual_issues"
    warn "residual_issues should be present (can be empty array [])"
  fi
  
  # Recommended: issues
  if ! field_exists "$json" "issues" && ! field_exists "$json" "residual_issues"; then
    warn "no issues/residual_issues field found"
  fi
}

# --- Output JSON result ---
output_result() {
  printf '{\n'
  printf '  "valid": %s,\n' "$VALID"
  printf '  "missing_fields": [\n'
  local first=true
  for f in ${MISSING_FIELDS[@]+"${MISSING_FIELDS[@]}"}; do
    if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
    printf '    "%s"' "$(json_escape "$f")"
  done
  printf '\n  ],\n'
  printf '  "warnings": [\n'
  first=true
  for w in ${WARNINGS[@]+"${WARNINGS[@]}"}; do
    if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
    printf '    "%s"' "$(json_escape "$w")"
  done
  printf '\n  ]\n'
  printf '}\n'
}

# --- Main ---

main() {
  # Validate mode argument
  if [[ "$MODE" != "check" && "$MODE" != "verify-return" ]]; then
    printf '{\n'
    printf '  "valid": false,\n'
    printf '  "missing_fields": ["mode"],\n'
    printf '  "warnings": ["Usage: validate-delegation.sh <check|verify-return> <json-file-or-stdin>"]\n'
    printf '}\n'
    return 0
  fi
  
  # Read JSON input
  local json
  json="$(read_input)"
  
  if [[ -z "$json" ]]; then
    printf '{\n'
    printf '  "valid": false,\n'
    printf '  "missing_fields": ["input"],\n'
    printf '  "warnings": ["No JSON input provided"]\n'
    printf '}\n'
    return 0
  fi
  
  # Run validation based on mode
  case "$MODE" in
    check)
      validate_packet "$json"
      ;;
    verify-return)
      validate_return "$json"
      ;;
  esac
  
  # Output result
  output_result
}

main
