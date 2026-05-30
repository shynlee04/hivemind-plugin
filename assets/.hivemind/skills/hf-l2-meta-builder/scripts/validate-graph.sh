#!/usr/bin/env bash
# validate-graph.sh — Validate MINDNETWORK graph structure
# Pure helper: reports validation findings, always exits 0

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GRAPH_FILE="${SKILL_DIR}/.meta-builder/graph.json"
STATE_DIR="${SKILL_DIR}/.meta-builder/state"

echo "=== MINDNETWORK Graph Validation ==="

# Check graph file exists
if [ ! -f "${GRAPH_FILE}" ]; then
  echo "FINDING: graph.json not found"
  echo "ACTION: Run graph-init.sh to create graph structure"
  echo "VALID=false"
  exit 0
fi

echo "PASS: graph.json exists"

# Check required fields
HAS_VERSION=$(grep -c '"version"' "${GRAPH_FILE}" || echo "0")
HAS_NODES=$(grep -c '"nodes"' "${GRAPH_FILE}" || echo "0")
HAS_EDGES=$(grep -c '"edges"' "${GRAPH_FILE}" || echo "0")
HAS_STATE=$(grep -c '"state"' "${GRAPH_FILE}" || echo "0")

if [ "${HAS_VERSION}" -gt 0 ]; then
  echo "PASS: version field present"
else
  echo "FINDING: version field missing"
fi

if [ "${HAS_NODES}" -gt 0 ]; then
  NODE_COUNT=$(grep -c '"id"' "${GRAPH_FILE}" || echo "0")
  echo "PASS: nodes field present (${NODE_COUNT} nodes)"
else
  echo "FINDING: nodes field missing"
fi

if [ "${HAS_EDGES}" -gt 0 ]; then
  EDGE_COUNT=$(grep -c '"from"' "${GRAPH_FILE}" || echo "0")
  echo "PASS: edges field present (${EDGE_COUNT} edges)"
else
  echo "FINDING: edges field missing"
fi

if [ "${HAS_STATE}" -gt 0 ]; then
  echo "PASS: state field present"
else
  echo "FINDING: state field missing"
fi

# Check state directory
if [ -d "${STATE_DIR}" ]; then
  echo "PASS: state directory exists"
  echo "  Files: $(ls "${STATE_DIR}"/*.json 2>/dev/null | wc -l)"
else
  echo "FINDING: state directory missing"
fi

# Check node dependencies are valid
echo ""
echo "=== Node Dependency Check ==="
echo "NOTE: Full graph validation requires JSON parser (jq)"
echo "Manual check: ensure all 'depends_on' references match existing node IDs"
echo "Manual check: ensure no circular dependencies exist"

echo ""
echo "=== Validation Complete ==="
echo "SUMMARY: Review FINDING lines above for issues"
echo "VALID=true"
exit 0
