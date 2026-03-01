#!/bin/bash
# route-stage.sh — Deterministic stage routing for HiveFiver V2
# Reads Pipeline State from STATE.md (machine-parseable table)
# Usage: ./route-stage.sh <working-directory>
# Output: JSON with current_stage, pipeline_active, command

set -eo pipefail

WORKDIR="${1:-.}"
STATE="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/STATE.md"

# Fallback if STATE.md missing
if [[ ! -f "$STATE" ]]; then
  cat <<'FALLBACK'
{"pipeline_active":false,"current_stage":"none","completed_stages":"","command":"/hivefiver","error":"STATE.md not found"}
FALLBACK
  exit 0
fi

# Parse machine-parseable Pipeline State table
# Extracts value from: | field_name | value |
parse_field() {
  local field="$1"
  awk -F'|' -v f="$field" '$2 ~ f {gsub(/^ +| +$/,"",$3); print $3}' "$STATE"
}

PIPELINE_ACTIVE=$(parse_field "pipeline_active")
CURRENT_STAGE=$(parse_field "current_stage")
COMPLETED=$(parse_field "completed_stages")
TARGET=$(parse_field "pipeline_target")

# Defaults for empty/missing values
PIPELINE_ACTIVE="${PIPELINE_ACTIVE:-false}"
CURRENT_STAGE="${CURRENT_STAGE:-none}"

# Map stage to command — deterministic, no keyword matching
case "$CURRENT_STAGE" in
  start)     COMMAND="/hivefiver-start" ;;
  discovery) COMMAND="/hivefiver-discovery" ;;
  intake)    COMMAND="/hivefiver-intake" ;;
  spec)      COMMAND="/hivefiver-spec" ;;
  architect) COMMAND="/hivefiver-architect" ;;
  build)     COMMAND="/hivefiver-build" ;;
  audit)     COMMAND="/hivefiver-audit" ;;
  doctor)    COMMAND="/hivefiver-doctor" ;;
  none)      COMMAND="/hivefiver" ;;
  *)         COMMAND="/hivefiver" ;;
esac

# Output deterministic JSON
cat <<EOF
{
  "pipeline_active": $PIPELINE_ACTIVE,
  "current_stage": "$CURRENT_STAGE",
  "completed_stages": "$COMPLETED",
  "pipeline_target": "$TARGET",
  "command": "$COMMAND"
}
EOF
