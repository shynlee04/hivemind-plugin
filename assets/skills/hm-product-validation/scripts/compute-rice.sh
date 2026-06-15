#!/usr/bin/env bash
# compute-rice.sh
# Computes RICE score from R/I/C/E inputs.
# Usage: ./compute-rice.sh <reach> <impact> <confidence> <effort>
set -euo pipefail

REACH="${1:-}"
IMPACT="${2:-}"
CONFIDENCE="${3:-}"
EFFORT="${4:-}"

if [[ -z "$REACH" ]] || [[ -z "$IMPACT" ]] || [[ -z "$CONFIDENCE" ]] || [[ -z "$EFFORT" ]]; then
  echo "Usage: $0 <reach_pct> <impact> <confidence_pct> <effort_pw>" >&2
  exit 64
fi

# Convert percentages to decimals
R=$(echo "$REACH / 100" | bc -l)
C=$(echo "$CONFIDENCE / 100" | bc -l)

SCORE=$(echo "scale=2; ($R * $IMPACT * $C) / $EFFORT" | bc -l)

echo "Reach:        $REACH% = $R"
echo "Impact:       $IMPACT"
echo "Confidence:   $CONFIDENCE% = $C"
echo "Effort:       $EFFORT person-weeks"
echo ""
echo "RICE Score:   $SCORE"

# Decision
if [[ $(echo "$SCORE > 10" | bc) -eq 1 ]]; then
  echo "Decision:     BUILD NOW"
elif [[ $(echo "$SCORE > 3" | bc) -eq 1 ]]; then
  echo "Decision:     BUILD THIS QUARTER"
elif [[ $(echo "$SCORE > 1" | bc) -eq 1 ]]; then
  echo "Decision:     BUILD EVENTUALLY"
else
  echo "Decision:     SKIP or DEPRECATE"
fi
