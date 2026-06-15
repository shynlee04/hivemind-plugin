#!/usr/bin/env bash
# graph-traverse.sh — Read-only probe of MINDNETWORK graph traversal state
# Pure helper: reports facts, always exits 0
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GRAPH_FILE="${SKILL_DIR}/.meta-builder/graph.json"
CHECKPOINT="${SKILL_DIR}/.meta-builder/state/checkpoint.json"
ACTION="${1:-status}"

case "${ACTION}" in
  status)
    [ -f "${GRAPH_FILE}" ] && echo "PASS: graph.json exists" || echo "FINDING: graph.json not found"
    if [ -f "${CHECKPOINT}" ]; then
      ACTIVE=$(grep -o '"active_node": *"[^"]*"' "${CHECKPOINT}" | cut -d'"' -f4 || echo "none")
      echo "Active node: ${ACTIVE}"
      echo "State: $(cat "${CHECKPOINT}")"
    else
      echo "FINDING: checkpoint.json not found"
    fi
    ;;
  next)
    if [ -f "${CHECKPOINT}" ]; then
      COMPLETED=$(grep -o '"completed_nodes": *\[[^]]*\]' "${CHECKPOINT}" | sed 's/"completed_nodes": *\[//;s/\]//' | tr ',' '\n' | tr -d '"' | tr -d ' ' || echo "")
      echo "Completed nodes: ${COMPLETED}"
      echo "Next: check graph.json edges for nodes with depends_on satisfied"
    else
      echo "FINDING: checkpoint.json not found — cannot determine next nodes"
    fi
    ;;
  *)
    echo "Usage: graph-traverse.sh [status|next]"
    echo "  status — Show current graph state"
    echo "  next   — Show next available nodes"
    ;;
esac
exit 0
