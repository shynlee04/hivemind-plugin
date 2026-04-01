#!/usr/bin/env bash
# hm-ideating-validate.sh — Validates ideating skill artifacts for compliance
# Usage: bash hm-ideating-validate.sh <path-to-artifact>
# Exit codes: 0 = all checks pass, 1 = one or more checks fail
# Checks: file existence, JSON syntax + _meta + scorecard keys, Markdown heading,
#          requirements-doc stable IDs, decision-log structure

set -euo pipefail
IFS=$'\n\t'

errors=0

fail() { printf 'FAIL: %s\n' "$1" >&2; errors=$((errors + 1)); }
pass() { printf 'PASS: %s\n' "$1"; }

# --- Argument check ---
[[ $# -ge 1 ]] || { printf 'FAIL: usage: hm-ideating-validate.sh <path-to-artifact>\n' >&2; exit 1; }
artifact="$1"

# --- Check 1: file exists and is non-empty ---
check_exists() {
  if [[ ! -f "$artifact" ]]; then
    fail "file not found: $artifact"
    return 1
  fi
  if [[ ! -s "$artifact" ]]; then
    fail "file is empty: $artifact"
    return 1
  fi
  pass "file exists and is non-empty"
  return 0
}

# --- Check 2: JSON syntax (parseable with jq) ---
check_json_syntax() {
  if ! jq empty "$artifact" 2>/dev/null; then
    fail "invalid JSON syntax in: $artifact"
    return 1
  fi
  pass "JSON syntax valid"
  return 0
}

# --- Check 3: JSON _meta object ---
check_json_meta() {
  local meta
  meta=$(jq '._meta // empty' "$artifact" 2>/dev/null) || true
  if [[ -z "$meta" || "$meta" == "null" ]]; then
    fail "JSON missing _meta object"
    return 1
  fi
  for field in created_at updated_at producer; do
    if ! jq -e "._meta.${field}" "$artifact" >/dev/null 2>&1; then
      fail "JSON _meta missing field: ${field}"
      return 1
    fi
  done
  pass "JSON _meta has required fields (created_at, updated_at, producer)"
  return 0
}

# --- Check 4: feature-scorecard required keys ---
check_scorecard_keys() {
  for key in scores creep_check review_disposition; do
    if ! jq -e ".${key}" "$artifact" >/dev/null 2>&1; then
      fail "feature-scorecard missing required key: ${key}"
      return 1
    fi
  done
  pass "feature-scorecard has required keys (scores, creep_check, review_disposition)"
  return 0
}

# --- Check 5: Markdown has heading ---
check_md_heading() {
  if ! grep -qE '^#' "$artifact"; then
    fail "Markdown file has no heading (#)"
    return 1
  fi
  pass "Markdown has heading"
  return 0
}

# --- Check 6: requirements-doc structure ---
check_requirements_doc() {
  if ! grep -qE '^## Requirements' "$artifact"; then
    fail "requirements-doc missing '## Requirements' section"
    return 1
  fi
  if ! grep -qE '^\s*-\s*(\*\*)?R[0-9]+\.' "$artifact"; then
    fail "requirements-doc missing stable IDs (e.g., - R1.)"
    return 1
  fi
  pass "requirements-doc has '## Requirements' section and stable IDs"
  return 0
}

# --- Check 7: decision-log structure ---
check_decision_log() {
  if ! grep -qE '^## Decision Record' "$artifact"; then
    fail "decision-log missing '## Decision Record' section"
    return 1
  fi
  pass "decision-log has '## Decision Record' section"
  return 0
}

# ==========================================================================
# Main dispatch
# ==========================================================================
if ! check_exists; then
  exit 1
fi

filename=$(basename "$artifact")
ext="${filename##*.}"

if [[ "$ext" == "json" ]]; then
  check_json_syntax || true
  check_json_meta || true
  # Scorecard-specific check
  if [[ "$filename" == *"scorecard"* ]]; then
    check_scorecard_keys || true
  fi
else
  # Markdown family
  check_md_heading || true
  case "$filename" in
    requirements-*|requirements*)
      check_requirements_doc || true
      ;;
    decision*|decisions*)
      check_decision_log || true
      ;;
  esac
fi

# --- Final result ---
if [[ "$errors" -eq 0 ]]; then
  pass "all validations passed"
  exit 0
else
  printf 'FAIL: %d validation error(s)\n' "$errors" >&2
  exit 1
fi
