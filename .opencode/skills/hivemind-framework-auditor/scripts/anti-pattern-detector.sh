#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# HIVEMIND Anti-Pattern Detector — D-01 through D-15
# Scans session artifacts and framework assets for known anti-patterns.
#
# Usage: bash scripts/anti-pattern-detector.sh [--json] [--verbose]
# Note: Some checks require session log access; others are static.
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
# Walk up to find project root (contains package.json AND .opencode/ directory)
# This avoids false matches on .opencode/package.json
PROJECT_ROOT="$SKILL_DIR"
while [[ "$PROJECT_ROOT" != "/" ]]; do
  if [[ -f "$PROJECT_ROOT/package.json" && -d "$PROJECT_ROOT/.opencode" && "$PROJECT_ROOT" != *"/.opencode"* ]]; then
    break
  fi
  PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done

OPENCODE_DIR="$PROJECT_ROOT/.opencode"
HIVEMIND_DIR="$PROJECT_ROOT/.hivemind"
SKILLS_DIR="$OPENCODE_DIR/skills"
COMMANDS_DIR="$OPENCODE_DIR/commands"
WORKFLOWS_DIR="$OPENCODE_DIR/workflows"
REGISTRY="$SKILLS_DIR/registry.yaml"

JSON_MODE=false
VERBOSE=false
for arg in "$@"; do
  case "$arg" in
    --json) JSON_MODE=true ;;
    --verbose) VERBOSE=true ;;
  esac
done

DETECTED=0
CLEAN=0
SKIP=0
RESULTS=()

detect() {
  local id="$1" status="$2" message="$3"
  case "$status" in
    DETECTED) ((DETECTED++)) ;;
    CLEAN) ((CLEAN++)) ;;
    SKIP) ((SKIP++)) ;;
  esac
  RESULTS+=("$id|$status|$message")
  if ! $JSON_MODE; then
    local icon="✓"
    [[ "$status" == "DETECTED" ]] && icon="✗"
    [[ "$status" == "SKIP" ]] && icon="⊘"
    printf "  [%-4s] %s %s\n" "$id" "$icon" "$message"
  fi
}

# ── D-04: Planning Artifact Dump ─────────────────────────────────
check_d04() {
  if [[ ! -d "$HIVEMIND_DIR" ]]; then
    detect "D-04" "SKIP" "No .hivemind/ directory — cannot check artifact dump"
    return
  fi
  local recent_files
  recent_files="$(find "$HIVEMIND_DIR" -name "*.md" -mtime -1 2>/dev/null | wc -l | tr -d ' ')"
  if [[ $recent_files -gt 15 ]]; then
    detect "D-04" "DETECTED" "$recent_files md files created in last 24h — possible artifact dump"
  else
    detect "D-04" "CLEAN" "$recent_files md files in last 24h — within normal range"
  fi
}

# ── D-07: Upstream Amnesia (check delegation packets) ────────────
check_d07() {
  local packets_checked=0 missing_source=0

  # Check command bodies for Task() calls without delegation_source
  if [[ -d "$COMMANDS_DIR" ]]; then
    for cmd_file in "$COMMANDS_DIR"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      if grep -qi "subagent_type" "$cmd_file" 2>/dev/null; then
        ((packets_checked++))
        if ! grep -qi "delegation_source" "$cmd_file" 2>/dev/null; then
          ((missing_source++))
        fi
      fi
    done
  fi

  if [[ $packets_checked -eq 0 ]]; then
    detect "D-07" "SKIP" "No Task() delegation patterns found in commands"
  elif [[ $missing_source -gt 0 ]]; then
    detect "D-07" "DETECTED" "$missing_source/$packets_checked delegations lack delegation_source"
  else
    detect "D-07" "CLEAN" "$packets_checked delegations all include delegation_source"
  fi
}

# ── D-08: Ghost Connections ──────────────────────────────────────
check_d08() {
  local ghost_count=0 checked=0 ghosts=""

  # Check skill references in SKILL.md files for missing reference files
  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] || continue
    local skill_md="$skill_dir/SKILL.md"
    [[ -f "$skill_md" ]] || continue

    # Extract relative file references like references/foo.md, scripts/bar.sh
    while IFS= read -r ref_path; do
      ((checked++))
      local full_path="$skill_dir/$ref_path"
      if [[ ! -f "$full_path" ]]; then
        ((ghost_count++))
        ghosts="${ghosts}$(basename "$skill_dir")/$ref_path "
      fi
    done < <(grep -oE '(references|scripts|assets)/[a-zA-Z0-9_.-]+\.(md|sh|py|yaml|yml|json|html)' "$skill_md" 2>/dev/null || true)
  done

  if [[ $checked -eq 0 ]]; then
    detect "D-08" "SKIP" "No internal file references found in skills"
  elif [[ $ghost_count -gt 0 ]]; then
    detect "D-08" "DETECTED" "$ghost_count ghost reference(s): ${ghosts}"
  else
    detect "D-08" "CLEAN" "$checked internal references verified — all exist"
  fi
}

# ── D-12: No Return Format (check delegation packets) ───────────
check_d12() {
  local packets_checked=0 missing_return=0

  if [[ -d "$COMMANDS_DIR" ]]; then
    for cmd_file in "$COMMANDS_DIR"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      if grep -qi "subagent_type" "$cmd_file" 2>/dev/null; then
        ((packets_checked++))
        if ! grep -qi "return_schema\|return_format\|return format" "$cmd_file" 2>/dev/null; then
          ((missing_return++))
        fi
      fi
    done
  fi

  if [[ $packets_checked -eq 0 ]]; then
    detect "D-12" "SKIP" "No Task() delegation patterns found"
  elif [[ $missing_return -gt 0 ]]; then
    detect "D-12" "DETECTED" "$missing_return/$packets_checked delegations lack return_schema"
  else
    detect "D-12" "CLEAN" "$packets_checked delegations all specify return format"
  fi
}

# ── D-02: Skill Avalanche (check SKILL.md body sizes) ───────────
check_d02() {
  local large_skills="" large_count=0

  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] || continue
    local skill_md="$skill_dir/SKILL.md"
    [[ -f "$skill_md" ]] || continue
    local lines
    lines="$(wc -l < "$skill_md" | tr -d ' ')"
    if [[ $lines -gt 500 ]]; then
      ((large_count++))
      large_skills="${large_skills}$(basename "$skill_dir")(${lines}L) "
    fi
  done

  if [[ $large_count -gt 0 ]]; then
    detect "D-02" "DETECTED" "$large_count skill(s) >500 lines — risk of context bloat: ${large_skills}"
  else
    detect "D-02" "CLEAN" "All skill bodies under 500 lines"
  fi
}

# ── D-05: Unrouted Execution (commands without workflow link) ────
check_d05() {
  local router_total=0 router_unrouted=0 unrouted_list=""
  local utility_total=0 utility_no_wf=0 utility_list=""

  if [[ ! -d "$COMMANDS_DIR" ]]; then
    detect "D-05" "SKIP" "No commands directory"
    return
  fi

  for cmd_file in "$COMMANDS_DIR"/*.md; do
    [[ -f "$cmd_file" ]] || continue
    local kind
    kind="$(grep "^kind:" "$cmd_file" 2>/dev/null | head -1 | sed 's/kind: *//' | tr -d '"' | tr -d "'")"

    if [[ "$kind" == "router" ]]; then
      ((router_total++))
      if ! grep -qi "execution_context" "$cmd_file" 2>/dev/null; then
        ((router_unrouted++))
        unrouted_list="${unrouted_list}$(basename "$cmd_file" .md) "
      fi
    else
      # utility/untyped commands — check for workflows: field instead
      ((utility_total++))
      if ! grep -qi "execution_context\|workflows:" "$cmd_file" 2>/dev/null; then
        ((utility_no_wf++))
        utility_list="${utility_list}$(basename "$cmd_file" .md) "
      fi
    fi
  done

  if [[ $router_total -eq 0 && $utility_total -eq 0 ]]; then
    detect "D-05" "SKIP" "No commands found"
  elif [[ $router_unrouted -gt 0 ]]; then
    detect "D-05" "DETECTED" "$router_unrouted/$router_total router commands lack execution_context: ${unrouted_list}"
  else
    local msg="$router_total router commands all routed"
    if [[ $utility_no_wf -gt 0 ]]; then
      msg="$msg; $utility_no_wf/$utility_total utility commands lack workflow ref (advisory): ${utility_list}"
    fi
    detect "D-05" "CLEAN" "$msg"
  fi
}

# ── D-13: Broken Chain (workflow steps without entry_criteria) ───
check_d13() {
  local total_steps=0 no_entry=0

  if [[ ! -d "$WORKFLOWS_DIR" ]]; then
    detect "D-13" "SKIP" "No workflows directory"
    return
  fi

  for wf_file in "$WORKFLOWS_DIR"/*.yaml "$WORKFLOWS_DIR"/*.yml; do
    [[ -f "$wf_file" ]] || continue
    # Count steps and entry_criteria occurrences
    local steps entry
    steps="$(grep -c "  - name:" "$wf_file" 2>/dev/null || echo 0)"
    entry="$(grep -c "entry_criteria:" "$wf_file" 2>/dev/null || echo 0)"
    total_steps=$((total_steps + steps))
    if [[ $entry -lt $steps ]]; then
      no_entry=$((no_entry + steps - entry))
    fi
  done

  if [[ $total_steps -eq 0 ]]; then
    detect "D-13" "SKIP" "No workflow steps found"
  elif [[ $no_entry -gt 0 ]]; then
    detect "D-13" "DETECTED" "$no_entry/$total_steps steps lack entry_criteria — chain may break"
  else
    detect "D-13" "CLEAN" "$total_steps steps all have entry_criteria"
  fi
}

# ── D-15: Skill Without Routing (skills with no clear workflow) ──
check_d15() {
  local no_router=0 no_router_list=""

  for skill_dir in "$SKILLS_DIR"/*/; do
    [[ -d "$skill_dir" ]] || continue
    local skill_md="$skill_dir/SKILL.md"
    [[ -f "$skill_md" ]] || continue
    # Check if skill body has any workflow/process/router guidance
    if ! grep -qiE "(workflow|router|process|## mode|## step|decision tree|when to)" "$skill_md" 2>/dev/null; then
      ((no_router++))
      no_router_list="${no_router_list}$(basename "$skill_dir") "
    fi
  done

  if [[ $no_router -gt 0 ]]; then
    detect "D-15" "DETECTED" "$no_router skill(s) lack routing/workflow guidance: ${no_router_list}"
  else
    detect "D-15" "CLEAN" "All skills have routing or workflow guidance"
  fi
}

# ── Runtime-only checks (require session log) ────────────────────
check_runtime() {
  detect "D-01" "SKIP" "Lint-on-docs: requires session log analysis (runtime check)"
  detect "D-03" "SKIP" "Redundant research: requires session log analysis (runtime check)"
  detect "D-06" "SKIP" "Hallucinated options: requires human review (runtime check)"
  detect "D-09" "SKIP" "Context echo: requires session log analysis (runtime check)"
  detect "D-10" "SKIP" "Scope creep: requires post-delegation git diff (runtime check)"
  detect "D-11" "SKIP" "Depth unawareness: requires delegation trace (runtime check)"
  detect "D-14" "SKIP" "Session rot: requires turn count tracking (runtime check)"
}

# ── Main ─────────────────────────────────────────────────────────
main() {
  if ! $JSON_MODE; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  HIVEMIND Anti-Pattern Detector — D-01 through D-15     ║"
    echo "║  Project: $(basename "$PROJECT_ROOT")"
    echo "║  Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Static Analysis (from framework assets):"
  fi

  check_d02
  check_d04
  check_d05
  check_d07
  check_d08
  check_d12
  check_d13
  check_d15

  if ! $JSON_MODE; then
    echo ""
    echo "  Runtime Checks (require session log — skipped in static mode):"
  fi

  check_runtime

  if ! $JSON_MODE; then
    echo ""
    echo "────────────────────────────────────────────────────────────"
    printf "  TOTAL: %d DETECTED / %d CLEAN / %d SKIPPED\n" "$DETECTED" "$CLEAN" "$SKIP"
    echo "────────────────────────────────────────────────────────────"

    if [[ $DETECTED -gt 0 ]]; then
      echo "  ACTION: Review detected anti-patterns in references/anti-pattern-catalog.md"
    else
      echo "  VERDICT: No static anti-patterns detected"
    fi
  else
    echo "{"
    echo "  \"detected\": $DETECTED,"
    echo "  \"clean\": $CLEAN,"
    echo "  \"skipped\": $SKIP,"
    echo "  \"results\": ["
    local first=true
    for r in "${RESULTS[@]}"; do
      IFS='|' read -r id status message <<< "$r"
      $first || echo ","
      printf '    {"id": "%s", "status": "%s", "message": "%s"}' "$id" "$status" "$message"
      first=false
    done
    echo ""
    echo "  ]"
    echo "}"
  fi
}

main "$@"
