#!/usr/bin/env bash
# state-persist.sh — Read-only probe for MINDNETWORK graph state
# Pure helper: reports facts, always exits 0
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="${SKILL_DIR}/.meta-builder/state"
ACTION="${1:-status}"

case "${ACTION}" in
  status)
    echo "=== MINDNETWORK State Directory ==="
    echo "Path: ${STATE_DIR}"
    if [ -d "${STATE_DIR}" ]; then
      echo "PASS: state directory exists"
      echo "Session files: $(ls "${STATE_DIR}"/session-*.json 2>/dev/null | wc -l || echo 0)"
      echo "Checkpoint: $([ -f "${STATE_DIR}/checkpoint.json" ] && echo yes || echo no)"
      echo "Question tracking: $([ -f "${STATE_DIR}/question-count.json" ] && echo yes || echo no)"
    else
      echo "FINDING: state directory missing"
    fi
    ;;
  latest)
    LATEST=$(ls -t "${STATE_DIR}"/session-*.json 2>/dev/null | head -1 || true)
    if [ -z "${LATEST}" ]; then echo "No session state found"
    else echo "Latest session: ${LATEST}"; cat "${LATEST}"; fi
    ;;
  *) echo "Usage: state-persist.sh [status|latest]" ;;
esac
exit 0
