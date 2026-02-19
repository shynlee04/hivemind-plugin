#!/usr/bin/env bash
set -euo pipefail

# Usage: score-confidence.sh <corroborated_count> <critical_gap_count> <unresolved_contradictions>
corroborated="${1:-0}"
critical_gaps="${2:-0}"
contradictions="${3:-0}"

if ! [[ "$corroborated" =~ ^[0-9]+$ && "$critical_gaps" =~ ^[0-9]+$ && "$contradictions" =~ ^[0-9]+$ ]]; then
  echo "usage: score-confidence.sh <corroborated_count> <critical_gap_count> <unresolved_contradictions>" >&2
  exit 1
fi

if (( corroborated >= 4 && critical_gaps == 0 && contradictions == 0 )); then
  echo "full"
elif (( corroborated >= 2 && critical_gaps <= 1 && contradictions <= 1 )); then
  echo "partial"
else
  echo "low"
fi
