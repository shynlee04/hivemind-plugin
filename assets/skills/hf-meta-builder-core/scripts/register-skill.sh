#!/usr/bin/env bash
# register-skill.sh — Read-only probe: reports skill status from loaded-skills.json
# Usage: bash register-skill.sh [skill-name]
# Always exits 0
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_FILE="${SCRIPT_DIR}/../../../state/loaded-skills.json"
echo "=== Skill Registration Probe ==="
if [ ! -f "${STATE_FILE}" ]; then echo "FINDING: loaded-skills.json not found"; exit 0; fi
if [ $# -ge 1 ]; then
  SKILL_NAME="$1"
  if grep -q "\"${SKILL_NAME}\"" "${STATE_FILE}" 2>/dev/null; then
    POSITION=$(grep -n "\"${SKILL_NAME}\"" "${STATE_FILE}" | head -1 | cut -d: -f1)
    TS=$(grep -A2 "\"${SKILL_NAME}\"" "${STATE_FILE}" | grep "loaded_at" | sed 's/.*: "//;s/".*//')
    echo "SKILL: ${SKILL_NAME} | STATUS: loaded | ORDER: ${POSITION} | TIMESTAMP: ${TS}"
  else
    echo "SKILL: ${SKILL_NAME} | STATUS: missing"
  fi
else
  COUNT=$(grep -c '"status": "loaded"' "${STATE_FILE}" || echo 0)
  echo "Registered skills: ${COUNT}"
fi
exit 0
