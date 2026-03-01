#!/usr/bin/env bash
# hivefiver-must-pack.sh — Unified mandatory skill/script bundle for HiveFiver commands
#
# Purpose:
# - Ensure every hivefiver command has one deterministic enforcement payload
# - Run intent classification + user profiling + journey QA pack consistently
# - Emit MUST obligations (pre-turn, post-turn, schema-guard requirement)
#
# Usage:
#   hivefiver-must-pack.sh <stage> [user_input] [workdir]
#
# Output:
#   JSON object with:
#   - stage
#   - classified_intent
#   - user_profile
#   - journey_pack
#   - must_obligations

set -Eeuo pipefail

STAGE="${1:-unknown}"
USER_INPUT="${2:-}"
WORKDIR="${3:-.}"

ROOT="$(cd "$WORKDIR" && pwd)"
MODE_DIR="$ROOT/.opencode/skills/hivefiver-mode/scripts"
COORD_DIR="$ROOT/.opencode/skills/hivefiver-coordination/scripts"

die_json() {
  local message="$1"
  jq -n --arg error "$message" '{ok:false,error:$error}'
  exit 0
}

command -v jq >/dev/null 2>&1 || { echo '{"ok":false,"error":"jq_not_found"}'; exit 0; }

[[ -x "$MODE_DIR/classify-intent.sh" ]] || die_json "missing_classify_intent_script"
[[ -x "$MODE_DIR/guided-discovery.sh" ]] || die_json "missing_guided_discovery_script"
[[ -x "$COORD_DIR/journey-intake-qa.sh" ]] || die_json "missing_journey_intake_qa_script"

INTENT_JSON="$(bash "$MODE_DIR/classify-intent.sh" "$USER_INPUT")"
PROFILE_JSON="$(bash "$MODE_DIR/guided-discovery.sh" "$USER_INPUT")"

INTENT="$(echo "$INTENT_JSON" | jq -r '.intent // "unknown"')"
MATURITY="$(echo "$PROFILE_JSON" | jq -r '.maturity // "L1"')"
INPUT_BAND="$(echo "$PROFILE_JSON" | jq -r '.input_band // "medium"')"

JOURNEY_JSON="$(bash "$COORD_DIR/journey-intake-qa.sh" "$INTENT" "$MATURITY" "$INPUT_BAND")"

if [[ "$(echo "$JOURNEY_JSON" | jq -r '.ok // false')" != "true" ]]; then
  JOURNEY_JSON="$(bash "$COORD_DIR/journey-intake-qa.sh" auto L1 medium)"
fi

SCHEMA_GUARD_REQUIRED=false
case "$STAGE" in
  build|doctor) SCHEMA_GUARD_REQUIRED=true ;;
esac

jq -n \
  --arg stage "$STAGE" \
  --argjson intent "$INTENT_JSON" \
  --argjson profile "$PROFILE_JSON" \
  --argjson journey "$JOURNEY_JSON" \
  --argjson schema_required "$SCHEMA_GUARD_REQUIRED" \
  '{
    ok: true,
    stage: $stage,
    classified_intent: $intent,
    user_profile: $profile,
    journey_pack: $journey,
    required_skills: [
      "hivefiver-mode",
      "hivefiver-coordination",
      "hivefiver-guided-discovery"
    ],
    must_obligations: {
      runtime_gate_pre_turn: true,
      runtime_gate_post_turn: true,
      runtime_gate_export_on_pipeline_close: true,
      schema_guard_required_for_writes: $schema_required,
      evidence_required_before_completion: true
    }
  }'
