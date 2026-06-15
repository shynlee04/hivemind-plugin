#!/usr/bin/env bash
# repro-template.sh
# Captures a reproduction of a bug as evidence for the debug report.
# Usage: ./repro-template.sh "<symptom>" "<command>" > evidence/repro.txt
set -euo pipefail

SYMPTOM="${1:-}"
COMMAND="${2:-}"

if [[ -z "$SYMPTOM" ]] || [[ -z "$COMMAND" ]]; then
  echo "Usage: $0 '<symptom>' '<command>' > evidence/repro.txt" >&2
  exit 64
fi

echo "=== Reproduction ==="
echo "Symptom: $SYMPTOM"
echo "Date: $(date -Iseconds)"
echo "Command: $COMMAND"
echo ""
echo "--- Output ---"
bash -c "$COMMAND" 2>&1 || true
echo "--- End Output ---"
echo ""
echo "Exit code: $?"
