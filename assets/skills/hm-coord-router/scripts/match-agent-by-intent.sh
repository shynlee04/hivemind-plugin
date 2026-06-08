#!/usr/bin/env bash
# match-agent-by-intent.sh
# Given an intent class, print the canonical command + agent pair.
# Usage: ./match-agent-by-intent.sh <intent-class>
#   intent-class: spec | test | debug | refactor | ship | research | cross-cut | product | intent | coord
set -euo pipefail

INTENT="${1:-}"

if [[ -z "$INTENT" ]]; then
  echo "Usage: $0 <intent-class>" >&2
  echo "  intent-class: spec | test | debug | refactor | ship | research | cross-cut | product | intent | coord" >&2
  exit 64
fi

case "$INTENT" in
  spec)     echo "hm-spec-phase|hm-specifier" ;;
  test)     echo "hm-execute-phase|hm-executor" ;;
  debug)    echo "hm-debug-systematic|hm-debugger" ;;
  refactor) echo "hm-arch-refactor|hm-architect" ;;
  ship)     echo "hm-ship|hm-shipper" ;;
  research) echo "hm-research-deep|hm-l3-deep-research" ;;
  cross-cut) echo "hm-cross-change|hm-l2-cross-cutting-change" ;;
  product)  echo "hm-product-validation|hm-l2-product-validation" ;;
  intent)   echo "hm-intent-brainstorm|hm-l2-brainstorm" ;;
  coord)    echo "hm-coord-loop|hm-orchestrator" ;;
  *)
    echo "Unknown intent class: $INTENT" >&2
    echo "Valid: spec test debug refactor ship research cross-cut product intent coord" >&2
    exit 1
    ;;
esac
