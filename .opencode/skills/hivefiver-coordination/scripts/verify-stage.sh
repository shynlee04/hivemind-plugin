#!/usr/bin/env bash
# verify-stage.sh — Unified stage verification for HiveFiver V2
# Validates that a specific stage completed correctly per completion-criteria.md
#
# Usage: verify-stage.sh <stage> [workdir]
# Output: JSON with stage, verified, checks, failures, evidence
# Exit: 0 always (failures are in JSON, not exit code)

set -Eeuo pipefail

readonly STAGE="${1:-}"
readonly WORKDIR="${2:-.}"
readonly STATE_FILE="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/STATE.md"
readonly SCRIPTS_DIR="$WORKDIR/.opencode/skills/hivefiver-coordination/scripts"

# --- Accumulators ---
FAILURES=()
WARNINGS=()
CHECKS_RUN=0
EVIDENCE=()

fail() { FAILURES+=("$1"); }
warn() { WARNINGS+=("$1"); }
check() { (( ++CHECKS_RUN )); }
evidence() { EVIDENCE+=("$1"); }

# --- JSON escape helper ---
json_escape() {
  local str="$1"
  # Escape backslashes, double quotes, and control chars
  printf '%s' "$str" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g'
}

# --- State parsing ---
parse_state_field() {
  local field="$1"
  if [[ -f "$STATE_FILE" ]]; then
    awk -F'|' -v f="$field" '$2 ~ f {gsub(/^ +| +$/,"",$3); print $3}' "$STATE_FILE" 2>/dev/null || true
  fi
}

load_pipeline_state() {
  PIPELINE_ACTIVE="$(parse_state_field "pipeline_active")"
  CURRENT_STAGE="$(parse_state_field "current_stage")"
  COMPLETED_STAGES="$(parse_state_field "completed_stages")"
  PIPELINE_TARGET="$(parse_state_field "pipeline_target")"
  LAST_GATE="$(parse_state_field "last_gate_result")"

  # Defaults
  PIPELINE_ACTIVE="${PIPELINE_ACTIVE:-false}"
  CURRENT_STAGE="${CURRENT_STAGE:-none}"
  COMPLETED_STAGES="${COMPLETED_STAGES:-}"
  PIPELINE_TARGET="${PIPELINE_TARGET:-}"
  LAST_GATE="${LAST_GATE:-}"
}

# --- Stage completed check ---
stage_completed() {
  local stage="$1"
  if [[ -z "$COMPLETED_STAGES" ]]; then
    return 1
  fi
  echo ",$COMPLETED_STAGES," | grep -q ",$stage,"
}

# --- Per-stage verification functions ---

verify_start() {
  # Entry: User intent captured, scope defined
  # Exit: Persona lane determined, Initial SOT written, First action created
  check
  
  # Check pipeline is active
  if [[ "$PIPELINE_ACTIVE" != "true" ]]; then
    fail "START-01: pipeline_active is not true"
  else
    evidence "pipeline_active=true"
  fi
  
  # Check start is in completed_stages
  if ! stage_completed "start"; then
    fail "START-02: 'start' not in completed_stages"
  else
    evidence "start in completed_stages"
  fi
  
  # Check pipeline_target is set (indicates requirements captured)
  if [[ -z "$PIPELINE_TARGET" ]]; then
    warn "START-03: pipeline_target is empty (requirements may not be captured)"
  else
    evidence "pipeline_target set: ${PIPELINE_TARGET:0:50}..."
  fi
  
  # Check hierarchy.json exists (SOT written)
  local hierarchy_file="$WORKDIR/.hivemind/state/hierarchy.json"
  if [[ ! -f "$hierarchy_file" ]]; then
    fail "START-04: hierarchy.json not found (SOT not written)"
  else
    evidence "hierarchy.json exists"
  fi
}

verify_discovery() {
  # Entry: Start completed, intent classified
  # Exit: User profiled (language, maturity, complexity), QA scoped
  check
  
  # Prerequisite: start must be completed
  if ! stage_completed "start"; then
    fail "DISCOVERY-01: 'start' stage not completed (prerequisite)"
  else
    evidence "start completed"
  fi
  
  # Check pipeline is active
  if [[ "$PIPELINE_ACTIVE" != "true" ]]; then
    fail "DISCOVERY-02: pipeline_active is not true"
  else
    evidence "pipeline_active=true"
  fi
  
  # Check pipeline_target is set
  if [[ -z "$PIPELINE_TARGET" ]]; then
    warn "DISCOVERY-03: pipeline_target is empty (requirements may not be captured)"
  else
    evidence "pipeline_target set: ${PIPELINE_TARGET:0:50}..."
  fi
  
  # Check discovery is completed
  if ! stage_completed "discovery"; then
    fail "DISCOVERY-04: 'discovery' not in completed_stages"
  else
    evidence "discovery in completed_stages"
  fi
  
  # Check guided-discovery skill exists
  local gd_skill="$WORKDIR/.opencode/skills/hivefiver-guided-discovery/SKILL.md"
  if [[ ! -f "$gd_skill" ]]; then
    warn "DISCOVERY-05: guided-discovery skill not found"
  else
    evidence "guided-discovery skill exists"
  fi
}

verify_intake() {
  # Entry: User input received, initial scope validated
  # Exit: All requirements gathered, ambiguities identified
  check
  
  # Prerequisite: start must be completed
  if ! stage_completed "start"; then
    fail "INTAKE-01: 'start' stage not completed (prerequisite)"
  else
    evidence "start completed"
  fi
  
  # For pipelines with discovery, check discovery completed
  if stage_completed "discovery"; then
    evidence "discovery completed"
  fi
  
  # Check pipeline_target is documented
  if [[ -z "$PIPELINE_TARGET" ]]; then
    fail "INTAKE-02: pipeline_target is empty (requirements not documented)"
  else
    evidence "requirements documented in pipeline_target"
  fi
}

verify_spec() {
  # Entry: Requirements complete, scope boundaries clear
  # Exit: SPEC created, acceptance criteria defined
  check
  
  # Prerequisite: intake must be completed
  if ! stage_completed "intake"; then
    fail "SPEC-01: 'intake' stage not completed (prerequisite)"
  else
    evidence "intake completed"
  fi
  
  # Check pipeline_target describes what's being built
  if [[ -z "$PIPELINE_TARGET" ]]; then
    fail "SPEC-02: pipeline_target is empty"
  else
    evidence "pipeline_target describes build target"
  fi
  
  # Check for SPEC file in docs/plans/
  local spec_count
  spec_count="$(find "$WORKDIR/docs/plans" -name "SPEC*.md" -o -name "spec*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if (( spec_count == 0 )); then
    warn "SPEC-03: No SPEC file found in docs/plans/"
  else
    evidence "SPEC file exists in docs/plans/"
  fi
}

verify_architect() {
  # Entry: SPEC approved, acceptance criteria accepted
  # Exit: Architecture design complete, asset contracts defined
  check
  
  # Prerequisite: spec must be completed
  if ! stage_completed "spec"; then
    fail "ARCHITECT-01: 'spec' stage not completed (prerequisite)"
  else
    evidence "spec completed"
  fi
  
  # Check target assets are identified (via pipeline_target or docs)
  if [[ -z "$PIPELINE_TARGET" ]]; then
    warn "ARCHITECT-02: pipeline_target is empty (target assets unclear)"
  else
    evidence "target assets identified in pipeline_target"
  fi
  
  # Check for architecture doc
  local arch_count
  arch_count="$(find "$WORKDIR/docs" -name "*architect*.md" -o -name "*design*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if (( arch_count == 0 )); then
    warn "ARCHITECT-03: No architecture document found in docs/"
  else
    evidence "architecture document exists"
  fi
}

verify_build() {
  # Entry: Architecture approved, contracts defined
  # Exit: All assets created, frontmatter valid, parity verified
  check
  
  # Prerequisite: architect must be completed
  if ! stage_completed "architect"; then
    fail "BUILD-01: 'architect' stage not completed (prerequisite)"
  else
    evidence "architect completed"
  fi
  
  # Run quality-check.sh for build stage
  if [[ -f "$SCRIPTS_DIR/quality-check.sh" ]]; then
    local quality_result
    quality_result="$(bash "$SCRIPTS_DIR/quality-check.sh" build "$WORKDIR" 2>/dev/null || echo '{"passed":false}')"
    local quality_passed
    quality_passed="$(printf '%s' "$quality_result" | grep -o '"passed": *[a-z]*' | sed 's/"passed": *//' || echo "false")"
    
    if [[ "$quality_passed" != "true" ]]; then
      fail "BUILD-02: quality-check.sh failed for build stage"
    else
      evidence "quality-check.sh passed"
    fi
  else
    warn "BUILD-03: quality-check.sh not found, skipping quality validation"
  fi
  
  # Check for stale .guard files
  local guard_count
  guard_count="$(find "$WORKDIR/.opencode" -name "*.guard" 2>/dev/null | wc -l | tr -d ' ')"
  if (( guard_count > 0 )); then
    fail "BUILD-04: $guard_count stale .guard files found (schema-guard verify not completed)"
  else
    evidence "no stale .guard files"
  fi
}

verify_audit() {
  # Entry: Build complete, all assets present
  # Exit: All contracts validated, no anti-patterns, quality gates pass
  check
  
  # Run quality-check.sh
  if [[ -f "$SCRIPTS_DIR/quality-check.sh" ]]; then
    local quality_result
    quality_result="$(bash "$SCRIPTS_DIR/quality-check.sh" audit "$WORKDIR" 2>/dev/null || echo '{"passed":false}')"
    local quality_passed
    quality_passed="$(printf '%s' "$quality_result" | grep -o '"passed": *[a-z]*' | sed 's/"passed": *//' || echo "false")"
    
    if [[ "$quality_passed" != "true" ]]; then
      fail "AUDIT-01: quality-check.sh failed for audit stage"
    else
      evidence "quality-check.sh passed"
    fi
  else
    warn "AUDIT-02: quality-check.sh not found"
  fi
  
  # Run inventory scan
  if [[ -f "$SCRIPTS_DIR/hivefiver-tools.sh" ]]; then
    local inventory_result
    inventory_result="$(bash "$SCRIPTS_DIR/hivefiver-tools.sh" inventory scan 2>/dev/null || echo '{"health":"unknown"}')"
    evidence "inventory scan completed"
  fi
}

verify_doctor() {
  # Entry: Audit issues identified, issues prioritized
  # Exit: All critical issues resolved, quality restored, tests pass
  check
  
  # Run quality-check.sh after fixes
  if [[ -f "$SCRIPTS_DIR/quality-check.sh" ]]; then
    local quality_result
    quality_result="$(bash "$SCRIPTS_DIR/quality-check.sh" doctor "$WORKDIR" 2>/dev/null || echo '{"passed":false}')"
    local quality_passed
    quality_passed="$(printf '%s' "$quality_result" | grep -o '"passed": *[a-z]*' | sed 's/"passed": *//' || echo "false")"
    
    if [[ "$quality_passed" != "true" ]]; then
      fail "DOCTOR-01: quality-check.sh failed after fixes applied"
    else
      evidence "quality-check.sh passed after fixes"
    fi
  else
    warn "DOCTOR-02: quality-check.sh not found"
  fi
}

# --- Main ---

main() {
  # Validate stage argument
  local valid_stages="start discovery intake spec architect build audit doctor"
  local stage_valid=false
  for s in $valid_stages; do
    if [[ "$s" == "$STAGE" ]]; then
      stage_valid=true
      break
    fi
  done
  
  if [[ "$stage_valid" != "true" ]]; then
    printf '{\n'
    printf '  "stage": "%s",\n' "${STAGE:-unknown}"
    printf '  "verified": false,\n'
    printf '  "checks_run": 0,\n'
    printf '  \"failures\": ["Invalid stage. Valid: start, discovery, intake, spec, architect, build, audit, doctor"],\n'
    printf '  "warnings": [],\n'
    printf '  "evidence": []\n'
    printf '}\n'
    return 0
  fi
  
  # Load pipeline state
  load_pipeline_state
  
  # Run stage-specific verification
  case "$STAGE" in
    start)     verify_start ;;
    discovery) verify_discovery ;;
    intake)    verify_intake ;;
    spec)      verify_spec ;;
    architect) verify_architect ;;
    build)     verify_build ;;
    audit)     verify_audit ;;
    doctor)    verify_doctor ;;
  esac
  
  # Determine verification result
  local verified=true
  if (( ${#FAILURES[@]} > 0 )); then
    verified=false
  fi
  
  # Output JSON
  printf '{\n'
  printf '  "stage": "%s",\n' "$STAGE"
  printf '  "verified": %s,\n' "$verified"
  printf '  "checks_run": %d,\n' "$CHECKS_RUN"
  printf '  "failures": [\n'
  local first=true
  for f in ${FAILURES[@]+"${FAILURES[@]}"}; do
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
  printf '\n  ],\n'
  printf '  "evidence": [\n'
  first=true
  for e in ${EVIDENCE[@]+"${EVIDENCE[@]}"}; do
    if [[ "$first" == "true" ]]; then first=false; else printf ',\n'; fi
    printf '    "%s"' "$(json_escape "$e")"
  done
  printf '\n  ]\n'
  printf '}\n'
}

main
