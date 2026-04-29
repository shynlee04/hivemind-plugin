#!/usr/bin/env bash
# validate-contracts.sh — Machine-verifiable integration contract validation
# Validates agent↔skill bindings across all 5 lineages.
# Reports orphan skills, cross-lineage violations, gate leaks, and dead references.
#
# Usage:
#   ./validate-contracts.sh                    # Run all checks
#   ./validate-contracts.sh --check-orphans    # Orphan detection only
#   ./validate-contracts.sh --check-cross-lineage  # Cross-lineage violations only
#   ./validate-contracts.sh --check-gates      # Gate-* leak detection only
#   ./validate-contracts.sh --check-dead-refs  # Dead reference detection only
#   ./validate-contracts.sh --summary          # Summary report only

set -euo pipefail

SKILLS_DIR="${SKILLS_DIR:-.opencode/skills}"
AGENTS_DIR="${AGENTS_DIR:-.opencode/agents}"
CONTRACT_REF="${CONTRACT_REF:-.hivefiver-meta-builder/skills-lab/active/refactoring/hm-l3-integration-contracts/references/skill-to-agent-bindings.md}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

violations=0
warnings=0
checks_run=0

log_pass() { echo -e "${GREEN}✅ $1${NC}"; }
log_fail() { echo -e "${RED}❌ $1${NC}"; violations=$((violations + 1)); }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; warnings=$((warnings + 1)); }

check_orphans() {
  echo "--- Orphan Detection ---"
  checks_run=$((checks_run + 1))
  local orphans=0

  for skill_md in "$SKILLS_DIR"/*/SKILL.md "$SKILLS_DIR"/*/*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    skill_name=$(basename "$(dirname "$skill_md")")

    # Extract consumed-by list from frontmatter
    consumers=$(grep -A 20 "consumed-by:" "$skill_md" 2>/dev/null | grep "^- " | wc -l | tr -d ' ' || true)

    if [ "$consumers" -eq 0 ] && [ -f "$CONTRACT_REF" ]; then
      if grep -q "| $skill_name |" "$CONTRACT_REF" 2>/dev/null; then
        consumers=1
      fi
    fi

    if [ "$consumers" -eq 0 ]; then
      # Check if this is an expected orphan (stack-* or unprefixed)
      if [[ "$skill_name" == stack-* ]] || [[ "$skill_name" == opencode-* ]]; then
        log_pass "$skill_name: EXEMPT (reference pack or unprefixed)"
      else
        log_warn "$skill_name: 0 consumers — possible orphan"
        orphans=$((orphans + 1))
      fi
    fi
  done

  if [ "$orphans" -eq 0 ]; then
    log_pass "0 orphan skills found"
  fi
  echo ""
}

check_cross_lineage() {
  echo "--- Cross-Lineage Validation ---"
  checks_run=$((checks_run + 1))

  local hm_to_hf=0
  local hf_to_hm_unjustified=0
  local hf_to_hm_justified=0

  for skill_md in "$SKILLS_DIR"/*/SKILL.md "$SKILLS_DIR"/*/*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    skill_name=$(basename "$(dirname "$skill_md")")

    # Get lineage-scope
    lineage_scope=$(grep "lineage-scope:" "$skill_md" 2>/dev/null | head -1 | sed 's/.*"\(.*\)".*/\1/' || echo "unknown")

    # Get consumed-by
    consumers=$(grep -A 20 "consumed-by:" "$skill_md" 2>/dev/null | grep "^- " | sed 's/.*"\(.*\)".*/\1/' || true)

    if [ -z "$consumers" ]; then
      continue
    fi

    case "$lineage_scope" in
      "hm-*")
        # Check for hm→hf violations
        for consumer in $consumers; do
          if [[ "$consumer" == hf-* ]]; then
            justification=$(grep "cross-lineage-justification:" "$skill_md" 2>/dev/null | grep -v "null" | wc -l | tr -d ' ')
            if [ "$justification" -gt 0 ]; then
              hf_to_hm_justified=$((hf_to_hm_justified + 1))
            else
              log_fail "$skill_name: $consumer (hf agent consuming hm skill WITHOUT justification)"
              hf_to_hm_unjustified=$((hf_to_hm_unjustified + 1))
            fi
          fi
        done
        ;;
      "hf-*")
        # Check for hf→hm violations
        for consumer in $consumers; do
          if [[ "$consumer" == hm-* ]]; then
            log_fail "$skill_name: $consumer (hm agent consuming hf skill — D-AD-01 STRICT violation)"
            hm_to_hf=$((hm_to_hf + 1))
          fi
        done
        ;;
    esac
  done

  if [ "$hm_to_hf" -eq 0 ]; then
    log_pass "hm→hf: 0 violations (no hm agent loads hf skills — D-AD-01 STRICT)"
  fi
  if [ "$hf_to_hm_unjustified" -eq 0 ] && [ "$hf_to_hm_justified" -gt 0 ]; then
    log_pass "hf→hm: $hf_to_hm_justified justified cross-lineage loads"
  elif [ "$hf_to_hm_unjustified" -eq 0 ] && [ "$hf_to_hm_justified" -eq 0 ]; then
    log_pass "hf→hm: 0 cross-lineage loads"
  fi
  echo ""
}

check_gates() {
  echo "--- Gate-* Leak Detection (D-02) ---"
  checks_run=$((checks_run + 1))
  local gate_leaks=0

  local permitted_consumers="hm-l2-auditor hm-l2-reviewer hm-l2-validator hm-l2-critic hm-l2-assessor hf-l2-auditor"

  for skill_md in "$SKILLS_DIR"/gate-*/SKILL.md "$SKILLS_DIR"/*/gate-*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    skill_name=$(basename "$(dirname "$skill_md")")

    consumers=$(grep -A 20 "consumed-by:" "$skill_md" 2>/dev/null | grep "^- " | sed 's/.*"\(.*\)".*/\1/' || true)

    if [ -z "$consumers" ]; then
      continue
    fi

    for consumer in $consumers; do
      if ! echo "$permitted_consumers" | grep -qw "$consumer"; then
        log_fail "$skill_name: $consumer (gate-* skill consumed by non-permitted agent — D-02 violation)"
        gate_leaks=$((gate_leaks + 1))
      fi
    done
  done

  if [ "$gate_leaks" -eq 0 ]; then
    log_pass "0 gate-* leaks (all consumers in permitted list)"
  fi
  echo ""
}

check_dead_refs() {
  echo "--- Dead Reference Detection ---"
  checks_run=$((checks_run + 1))
  local dead_refs=0

  for skill_md in "$SKILLS_DIR"/*/SKILL.md "$SKILLS_DIR"/*/*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    skill_name=$(basename "$(dirname "$skill_md")")

    consumers=$(grep -A 20 "consumed-by:" "$skill_md" 2>/dev/null | grep "^- " | sed 's/.*"\(.*\)".*/\1/' || true)

    for consumer in $consumers; do
      # Skip if this is a domain-level entry (not a specific agent)
      if [[ "$consumer" == *domain* ]] || [[ "$consumer" == all-* ]]; then
        continue
      fi

      # Check if the agent file exists
      if [ ! -f "$AGENTS_DIR/$consumer.md" ]; then
        log_warn "$skill_name: $consumer (agent file not found — possible dead ref)"
        dead_refs=$((dead_refs + 1))
      fi
    done
  done

  if [ "$dead_refs" -eq 0 ]; then
    log_pass "0 dead references"
  fi
  echo ""
}

print_summary() {
  echo "==============================================="
  echo "       Integration Contract Validation"
  echo "==============================================="
  echo "Checks run:  $checks_run"
  echo "Violations:  $violations ${RED}❌${NC}"
  echo "Warnings:    $warnings ${YELLOW}⚠️${NC}"
  echo ""

  if [ "$violations" -gt 0 ]; then
    echo -e "${RED}RESULT: FAIL${NC} — $violations contract violation(s) found"
    exit 1
  elif [ "$warnings" -gt 0 ]; then
    echo -e "${YELLOW}RESULT: PASS WITH WARNINGS${NC} — $warnings warning(s)"
    exit 0
  else
    echo -e "${GREEN}RESULT: PASS${NC} — All contracts valid"
    exit 0
  fi
}

# Main
case "${1:-}" in
  --check-orphans)
    check_orphans
    print_summary
    ;;
  --check-cross-lineage)
    check_cross_lineage
    print_summary
    ;;
  --check-gates)
    check_gates
    print_summary
    ;;
  --check-dead-refs)
    check_dead_refs
    print_summary
    ;;
  --summary)
    print_summary
    ;;
  *)
    check_orphans
    check_cross_lineage
    check_gates
    check_dead_refs
    print_summary
    ;;
esac
