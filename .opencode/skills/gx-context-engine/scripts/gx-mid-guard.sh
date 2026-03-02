#!/usr/bin/env bash
# gx-mid-guard.sh — Mid-session composite health adapter

set -euo pipefail

WORKDIR="${1:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_LEVEL="${AGENT_LEVEL:-2}"

HEALTH="$(bash "$SCRIPT_DIR/gx-health-compute.sh" "$WORKDIR" "$AGENT_LEVEL")"
COMPOSITE_SCORE="$(echo "$HEALTH" | jq '.composite.score')"
STATUS="$(echo "$HEALTH" | jq -r '.composite.status')"
HARD_BLOCKED="$(echo "$HEALTH" | jq '.composite.hard_blocked')"

jq -n \
  --argjson composite_score "$COMPOSITE_SCORE" \
  --arg status "$STATUS" \
  --argjson hard_blocked "$HARD_BLOCKED" \
  --argjson signals "$(echo "$HEALTH" | jq '.signals')" \
  --argjson profile_valid true \
  '{
    drift_score: (100 - $composite_score),
    composite_score: $composite_score,
    status: $status,
    hard_blocked: $hard_blocked,
    signals: $signals,
    depth_ok: true,
    profile_valid: $profile_valid,
    recommendations: []
  }'
