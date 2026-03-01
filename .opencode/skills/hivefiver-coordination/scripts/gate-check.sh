#!/bin/bash
# gate-check.sh — Pipeline prerequisite enforcement for HiveFiver V2
# Blocks stage transitions that skip prerequisites.
# Supports ALL intent paths: build, fix, audit, extend, improve, learn, custom.
# Usage: ./gate-check.sh <requested_stage> <working-directory>
# Output: JSON with allowed/blocked + reason + next_command

set -eo pipefail

REQUESTED="${1:-}"
WORKDIR="${2:-.}"
STATE="$WORKDIR/.hivemind/hive-modules/hivefiver-v2/STATE.md"

# No stage specified
if [[ -z "$REQUESTED" ]]; then
  echo '{"stage":"unknown","allowed":false,"reason":"No stage specified. Usage: gate-check.sh <stage> <workdir>","valid_stages":"start,discovery,intake,spec,architect,build,audit,doctor,continue,recover"}'
  exit 0
fi

# Strip flags (e.g., --continue becomes continue)
REQUESTED="${REQUESTED#--}"

# Bypass stages: ALWAYS allowed (no pipeline prerequisite)
case "$REQUESTED" in
  audit|doctor)
    echo "{\"stage\":\"$REQUESTED\",\"allowed\":true,\"reason\":\"$REQUESTED bypasses pipeline — always allowed\",\"next_command\":\"/hivefiver-$REQUESTED\"}"
    exit 0
    ;;
  start)
    echo '{"stage":"start","allowed":true,"reason":"start bootstraps pipeline — always allowed","next_command":"/hivefiver-start"}'
    exit 0
    ;;
  continue)
    echo '{"stage":"continue","allowed":true,"reason":"continue bypasses pipeline — always allowed for session handoff","next_command":"/hivefiver-continue"}'
    exit 0
    ;;
  recover)
    echo '{"stage":"recover","allowed":true,"reason":"recover bypasses pipeline — always allowed for error recovery","next_command":"/hivefiver-start"}'
    exit 0
    ;;
esac

# STATE.md must exist for pipeline stages
if [[ ! -f "$STATE" ]]; then
  echo "{\"stage\":\"$REQUESTED\",\"allowed\":false,\"reason\":\"STATE.md not found. Run /hivefiver-start first to bootstrap.\",\"next_command\":\"/hivefiver-start\"}"
  exit 0
fi

# Parse Pipeline State table
parse_field() {
  local field="$1"
  awk -F'|' -v f="$field" '$2 ~ f {gsub(/^ +| +$/,"",$3); print $3}' "$STATE"
}

PIPELINE_ACTIVE=$(parse_field "pipeline_active")
CURRENT_STAGE=$(parse_field "current_stage")
COMPLETED=$(parse_field "completed_stages")
PIPELINE_ERROR=$(parse_field "pipeline_error")

PIPELINE_ACTIVE="${PIPELINE_ACTIVE:-false}"
CURRENT_STAGE="${CURRENT_STAGE:-none}"
COMPLETED="${COMPLETED:-}"
PIPELINE_ERROR="${PIPELINE_ERROR:-}"

# If pipeline has an error, only allow recover, doctor, or audit
if [[ -n "$PIPELINE_ERROR" ]]; then
  case "$REQUESTED" in
    recover|doctor|audit)
      echo "{\"stage\":\"$REQUESTED\",\"allowed\":true,\"reason\":\"Pipeline has error but $REQUESTED is allowed for recovery.\",\"pipeline_error\":\"$PIPELINE_ERROR\",\"next_command\":\"/hivefiver-$REQUESTED\"}"
      exit 0
      ;;
    *)
      echo "{\"stage\":\"$REQUESTED\",\"allowed\":false,\"reason\":\"BLOCKED: Pipeline has error: $PIPELINE_ERROR. Run /hivefiver recover or /hivefiver doctor to fix.\",\"pipeline_error\":\"$PIPELINE_ERROR\",\"next_command\":\"/hivefiver recover\"}"
      exit 0
      ;;
  esac
fi

# Pipeline must be active for sequential stages
if [[ "$PIPELINE_ACTIVE" != "true" ]]; then
  echo "{\"stage\":\"$REQUESTED\",\"allowed\":false,\"reason\":\"Pipeline not active. Run /hivefiver-start first to activate pipeline.\",\"next_command\":\"/hivefiver-start\"}"
  exit 0
fi

# Define prerequisite for each pipeline stage
# discovery sits between start and intake in the full_build pipeline
case "$REQUESTED" in
  discovery) PREREQ="start" ;;
  intake)    PREREQ="start" ;;     # intake can follow start OR discovery
  spec)      PREREQ="intake" ;;
  architect) PREREQ="spec" ;;
  build)     PREREQ="architect" ;;
  *)
    echo "{\"stage\":\"$REQUESTED\",\"allowed\":false,\"reason\":\"Unknown stage '$REQUESTED'. Valid: start, discovery, intake, spec, architect, build, audit, doctor, continue, recover\",\"next_command\":\"/hivefiver\"}"
    exit 0
    ;;
esac

# Special case: intake can proceed if either 'start' or 'discovery' is completed
# (discovery is optional in improve pipeline; required in full_build)
if [[ "$REQUESTED" == "intake" ]]; then
  if echo ",$COMPLETED," | grep -q ",discovery," || echo ",$COMPLETED," | grep -q ",start,"; then
    PREREQ_MET=true
  else
    PREREQ_MET=false
  fi
else
  if echo ",$COMPLETED," | grep -q ",$PREREQ,"; then
    PREREQ_MET=true
  else
    PREREQ_MET=false
  fi
fi

if [[ "$PREREQ_MET" == "true" ]]; then
  # Prerequisite met — now check for dead references (build stage only)
  if [[ "$REQUESTED" == "build" ]]; then
    DEAD_REFS=$(grep -rl \
      "meta-builder-governance\|hivefiver-persona-routing\|hivefiver-spec-distillation\|hivefiver-specforge\|hivefiver-skillforge\|hivefiver-gsd-bridge\|hivefiver-ralph-bridge\|hivefiver-gsd-compat" \
      "$WORKDIR/.opencode/" 2>/dev/null \
      | grep -v "scripts/gate-check.sh" \
      | grep -v "scripts/quality-check.sh" \
      | grep -v "hivefiver-doctor.md" \
      | head -5 || true)
    if [[ -n "$DEAD_REFS" ]]; then
      DEAD_REFS_ESCAPED=$(echo "$DEAD_REFS" | tr '\n' ',' | sed 's/,$//')
      echo "{\"stage\":\"build\",\"allowed\":false,\"reason\":\"Dead references found. Run /hivefiver-doctor first. Files: $DEAD_REFS_ESCAPED\",\"next_command\":\"/hivefiver-doctor\"}"
      exit 0
    fi
  fi

  echo "{\"stage\":\"$REQUESTED\",\"allowed\":true,\"reason\":\"Prerequisite '$PREREQ' completed\",\"completed_stages\":\"$COMPLETED\",\"next_command\":\"/hivefiver-$REQUESTED\"}"
else
  echo "{\"stage\":\"$REQUESTED\",\"allowed\":false,\"reason\":\"BLOCKED: Stage '$PREREQ' must complete before '$REQUESTED'. Completed so far: [$COMPLETED]. Run /hivefiver-$PREREQ first.\",\"next_command\":\"/hivefiver-$PREREQ\"}"
fi
