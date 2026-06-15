#!/usr/bin/env bash
# graph-init.sh — Probe MINDNETWORK graph structure (read-only)
# Pure helper: reports facts, never mutates state, always exits 0
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GRAPH_DIR="${SKILL_DIR}/.meta-builder"
STATE_DIR="${GRAPH_DIR}/state"

echo "=== MINDNETWORK Graph Probe ==="
[ -d "${GRAPH_DIR}" ] && echo "PASS: graph directory exists" || echo "FINDING: graph directory missing"
[ -d "${STATE_DIR}" ] && echo "PASS: state directory exists" || echo "FINDING: state directory missing"

EXISTING=0
for file in checkpoint.json session-stack.json question-count.json; do
  if [ -f "${STATE_DIR}/${file}" ]; then
    echo "PASS: ${file} exists"; EXISTING=$((EXISTING + 1))
  else
    echo "FINDING: ${file} missing"
  fi
done

echo "State files: ${EXISTING}/3 present"
echo "READY=$([ "${EXISTING}" -eq 3 ] && echo true || echo false)"
exit 0
