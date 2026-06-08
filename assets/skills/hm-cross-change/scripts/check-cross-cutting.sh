#!/usr/bin/env bash
# check-cross-cutting.sh
# Audits a cross-cutting change for completeness.
# Usage: ./check-cross-cutting.sh <old_name> <new_name>
set -euo pipefail

OLD="${1:-}"
NEW="${2:-}"

if [[ -z "$OLD" ]] || [[ -z "$NEW" ]]; then
  echo "Usage: $0 <old_name> <new_name>" >&2
  exit 64
fi

SURFACES=("assets/agents" "assets/commands" "assets/workflows" "assets/references" "assets/templates" "assets/agent-instructions" "assets/skills")
total_remaining=0
total_inbound=0

for surface in "${SURFACES[@]}"; do
  [[ -d "$surface" ]] || continue
  remaining=$(grep -rln "$OLD" "$surface" 2>/dev/null | wc -l | tr -d ' ')
  new_count=$(grep -rln "$NEW" "$surface" 2>/dev/null | wc -l | tr -d ' ')
  if [[ $remaining -gt 0 ]]; then
    echo "  $surface: $remaining stale refs to $OLD"
    total_remaining=$((total_remaining + remaining))
  fi
  total_inbound=$((total_inbound + new_count))
done

echo ""
echo "Total stale refs: $total_remaining"
echo "Total refs to new name: $total_inbound"

if [[ $total_remaining -gt 0 ]]; then
  echo "FAIL: cross-cutting change incomplete"
  exit 1
fi
echo "PASS: no stale refs remain"
