#!/usr/bin/env bash
# journey-intake-qa.sh — Deterministic requirement discovery question pack
#
# Produces a machine-parseable JSON question pack for brainstorming + QA-driven
# requirement clarification. Used before intake/spec to reduce ambiguity.
#
# Usage:
#   journey-intake-qa.sh [intent|auto] [level] [length_band]
#
# Inputs:
#   intent       auto | build_new | extend | improve | learn | fix_broken | audit_health
#   level        L0 | L1 | L2 | L3               (default: L1)
#   length_band  short | medium | long           (default: medium)
#
# Output:
#   JSON payload with question groups, required answers, and next stage routing

set -Eeuo pipefail

RAW_INTENT="${1:-auto}"
LEVEL="${2:-L1}"
LENGTH_BAND="${3:-medium}"

die_json() {
  local message="$1"
  printf '{"ok":false,"error":"%s"}\n' "$message"
  exit 0
}

normalize_intent() {
  case "$1" in
    auto) echo "auto" ;;
    build_new|build|create|new) echo "build_new" ;;
    extend|capability|new_workflow) echo "extend" ;;
    improve|refactor|cleanup|optimize) echo "improve" ;;
    learn|guided|onboarding) echo "learn" ;;
    fix_broken|fix|doctor|broken) echo "fix_broken" ;;
    audit_health|audit|check) echo "audit_health" ;;
    *) echo "unknown" ;;
  esac
}

INTENT="$(normalize_intent "$RAW_INTENT")"

infer_intent_from_state() {
  local state_file=".hivemind/hive-modules/hivefiver-v2/STATE.md"
  local target=""

  if [[ -f "$state_file" ]]; then
    target="$(awk -F'|' '$2 ~ /pipeline_target/ {gsub(/^ +| +$/, "", $3); print tolower($3)}' "$state_file")"
  fi

  case "$target" in
    *fix*|*broken*|*doctor*) echo "fix_broken" ;;
    *audit*|*health*|*check*) echo "audit_health" ;;
    *extend*|*capability*|*workflow*) echo "extend" ;;
    *improve*|*refactor*|*cleanup*|*optimize*) echo "improve" ;;
    *learn*|*onboard*|*guided*) echo "learn" ;;
    *) echo "build_new" ;;
  esac
}

if [[ "$INTENT" == "auto" ]]; then
  INTENT="$(infer_intent_from_state)"
fi

case "$LEVEL" in
  L0|L1|L2|L3) ;;
  *) die_json "invalid_level: expected L0|L1|L2|L3, got '$LEVEL'" ;;
esac

case "$LENGTH_BAND" in
  short|medium|long) ;;
  *) die_json "invalid_length_band: expected short|medium|long, got '$LENGTH_BAND'" ;;
esac

if [[ "$INTENT" == "unknown" ]]; then
  die_json "unknown_intent: supported build_new|extend|improve|learn|fix_broken|audit_health"
fi

# Defaults
JOURNEY="discovery_to_intake"
NEXT_STAGE="intake"
FOCUS="clarify_problem_constraints_success"

PROBLEM_Q='[
  "What painful problem are we solving right now?",
  "Who experiences this pain first, and how often?",
  "What happens if we do nothing for two sprints?"
]'

BOUNDARY_Q='[
  "What is strictly in scope for this iteration?",
  "What is explicitly out of scope (anti-goals)?",
  "Which constraints are non-negotiable (security, timeline, compatibility)?"
]'

SUCCESS_Q='[
  "What are the top three acceptance signals for success?",
  "What are the top three failure modes we must prevent?",
  "What minimum verification evidence is required before claiming done?"
]'

DISCOVERY_Q='[
  "Which assumptions are currently unverified?",
  "Which unknowns can block implementation if unanswered?",
  "What decision must be made first to unlock progress?"
]'

QA_Q='[
  "Which scenario is highest risk and must be tested first?",
  "What regression areas are likely impacted?",
  "What proof format will we accept (script output, diff evidence, checklist)?"
]'

case "$INTENT" in
  build_new)
    JOURNEY="build_new_discovery"
    NEXT_STAGE="intake"
    FOCUS="brainstorming_plus_spec_intake"
    ;;
  extend)
    JOURNEY="extend_capability_discovery"
    NEXT_STAGE="intake"
    FOCUS="compatibility_plus_incremental_scope"
    ;;
  improve)
    JOURNEY="improvement_discovery"
    NEXT_STAGE="intake"
    FOCUS="pain_points_plus_quality_outcomes"
    ;;
  learn)
    JOURNEY="guided_learning_discovery"
    NEXT_STAGE="intake"
    FOCUS="education_plus_requirement_distillation"
    ;;
  fix_broken)
    JOURNEY="breakage_triage"
    NEXT_STAGE="doctor"
    FOCUS="symptoms_repro_impact"
    PROBLEM_Q='[
      "What is broken now, in one sentence?",
      "How can we reproduce it deterministically?",
      "What user or pipeline impact does this breakage cause?"
    ]'
    ;;
  audit_health)
    JOURNEY="audit_scoping"
    NEXT_STAGE="audit"
    FOCUS="scope_risk_evidence"
    PROBLEM_Q='[
      "Which asset groups must be audited first?",
      "What risk signals triggered this audit request?",
      "What evidence threshold defines a complete audit?"
    ]'
    ;;
esac

# Level-driven follow-up depth
FOLLOWUP_LIMIT=2
QUESTION_CAP=12
MODE="guided"

case "$LEVEL" in
  L0)
    FOLLOWUP_LIMIT=1
    QUESTION_CAP=8
    MODE="guided_simplified"
    ;;
  L1)
    FOLLOWUP_LIMIT=2
    QUESTION_CAP=10
    MODE="guided_structured"
    ;;
  L2)
    FOLLOWUP_LIMIT=3
    QUESTION_CAP=12
    MODE="semi_direct"
    ;;
  L3)
    FOLLOWUP_LIMIT=2
    QUESTION_CAP=9
    MODE="expert_compact"
    ;;
esac

# Input length adaptation
if [[ "$LENGTH_BAND" == "long" ]]; then
  PRE_STEP='["Summarize input into 3 sections before asking questions", "Ask priority ranking for sections"]'
else
  PRE_STEP='["Proceed directly with grouped questions"]'
fi

jq -n \
  --arg intent "$INTENT" \
  --arg level "$LEVEL" \
  --arg length_band "$LENGTH_BAND" \
  --arg journey "$JOURNEY" \
  --arg next_stage "$NEXT_STAGE" \
  --arg focus "$FOCUS" \
  --arg mode "$MODE" \
  --argjson followup_limit "$FOLLOWUP_LIMIT" \
  --argjson question_cap "$QUESTION_CAP" \
  --argjson pre_step "$PRE_STEP" \
  --argjson problem_q "$PROBLEM_Q" \
  --argjson boundary_q "$BOUNDARY_Q" \
  --argjson success_q "$SUCCESS_Q" \
  --argjson discovery_q "$DISCOVERY_Q" \
  --argjson qa_q "$QA_Q" \
  '{
    ok: true,
    intent: $intent,
    journey: $journey,
    maturity_level: $level,
    length_band: $length_band,
    operating_mode: $mode,
    focus: $focus,
    selected_skill_patterns: ["brainstorming", "qa-test-planner"],
    pre_processing: $pre_step,
    question_groups: [
      {
        id: "problem_pain",
        required: true,
        questions: $problem_q
      },
      {
        id: "scope_boundaries",
        required: true,
        questions: $boundary_q
      },
      {
        id: "success_and_failures",
        required: true,
        questions: $success_q
      },
      {
        id: "discovery_unknowns",
        required: true,
        questions: $discovery_q
      },
      {
        id: "qa_verification",
        required: true,
        questions: $qa_q
      }
    ],
    required_answers: [
      "problem_statement",
      "primary_user_pain",
      "in_scope",
      "out_of_scope",
      "non_negotiable_constraints",
      "acceptance_signals",
      "failure_modes",
      "verification_evidence"
    ],
    ambiguity_threshold: {
      unresolved_critical_max: 0,
      unresolved_minor_max: 1,
      followup_limit_per_ambiguity: $followup_limit
    },
    controls: {
      max_total_questions: $question_cap,
      stop_rule: "if unresolved_critical > 0, do_not_promote_stage",
      escalation: "route_to_user_decision_with_2_options"
    },
    next_stage_recommendation: $next_stage
  }'
