#!/usr/bin/env bash
set -euo pipefail

# score-confidence.sh — Deterministic confidence scoring for research findings
#
# Usage: score-confidence.sh <corroborated_count> <critical_gap_count> <unresolved_contradictions>
#
# Rules:
#   full:    corroborated >= 4, gaps == 0, contradictions == 0
#   partial: corroborated >= 2, gaps <= 1, contradictions <= 1
#   low:     everything else

corroborated="${1:-0}"
critical_gaps="${2:-0}"
contradictions="${3:-0}"

if ! [[ "$corroborated" =~ ^[0-9]+$ && "$critical_gaps" =~ ^[0-9]+$ && "$contradictions" =~ ^[0-9]+$ ]]; then
  echo "usage: score-confidence.sh <corroborated_count> <critical_gap_count> <unresolved_contradictions>" >&2
  echo "" >&2
  echo "  corroborated_count:          number of independent sources confirming the finding" >&2
  echo "  critical_gap_count:          number of critical evidence gaps" >&2
  echo "  unresolved_contradictions:   number of contradictions not yet resolved" >&2
  echo "" >&2
  echo "Output: full | partial | low" >&2
  exit 1
fi

# full: strong corroboration, no gaps, no contradictions
if (( corroborated >= 4 && critical_gaps == 0 && contradictions == 0 )); then
  echo "full"
  exit 0
fi

# partial: some corroboration, tolerable gaps/contradictions
if (( corroborated >= 2 && critical_gaps <= 1 && contradictions <= 1 )); then
  echo "partial"
  exit 0
fi

# low: insufficient corroboration, too many gaps, or unresolved contradictions
echo "low"
exit 0
