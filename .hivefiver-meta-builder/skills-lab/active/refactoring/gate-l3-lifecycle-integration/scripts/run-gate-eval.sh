#!/usr/bin/env bash
# run-gate-eval.sh — Deterministic 5-dimension lifecycle integration evaluator
# Reports FACTS only. Agent applies JUDGMENT using perspective rubrics.
#
# Usage: bash scripts/run-gate-eval.sh <artifact_path>
# Exit codes: 0 = no BLOCK findings, 1 = BLOCK finding detected

set -euo pipefail

ARTIFACT="${1:-}"
if [ -z "$ARTIFACT" ]; then
  echo "[Harness Gate] Usage: bash scripts/run-gate-eval.sh <artifact_path>"
  exit 1
fi

if [ ! -f "$ARTIFACT" ]; then
  echo "[Harness Gate] File not found: $ARTIFACT"
  exit 1
fi

BLOCK_COUNT=0
WARN_COUNT=0
ARTIFACT_DIR="$(cd "$(dirname "$ARTIFACT")" && pwd)"
PROJECT_ROOT="$(cd "$ARTIFACT_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "$ARTIFACT_DIR")"
RELATIVE_PATH="${ARTIFACT#$PROJECT_ROOT/}"

echo "=== Lifecycle Integration Gate: $RELATIVE_PATH ==="
echo ""

# ---------------------------------------------------------------------------
# Dimension 1: Classification Fit
# ---------------------------------------------------------------------------
echo "--- D1: Classification Fit ---"

CLASSIFICATION="UNKNOWN"
if [[ "$RELATIVE_PATH" == src/tools/* ]]; then
  CLASSIFICATION="TOOL"
elif [[ "$RELATIVE_PATH" == src/hooks/* ]]; then
  CLASSIFICATION="HOOK"
elif [[ "$RELATIVE_PATH" == src/lib/* ]]; then
  CLASSIFICATION="LIBRARY"
elif [[ "$RELATIVE_PATH" == src/plugin.ts ]]; then
  CLASSIFICATION="PLUGIN"
elif [[ "$RELATIVE_PATH" == src/shared/* ]]; then
  CLASSIFICATION="SHARED"
elif [[ "$RELATIVE_PATH" == src/schema-kernel/* ]]; then
  CLASSIFICATION="SCHEMA"
fi

echo "Classification: $CLASSIFICATION"

# Check cross-root contamination
if echo "$RELATIVE_PATH" | grep -qE "^src/.*\.\./\.\./\.opencode|^src/.*\.\./\.\./\.hivemind"; then
  echo "[BLOCK] AP-13: Cross-root import detected in $RELATIVE_PATH"
  BLOCK_COUNT=$((BLOCK_COUNT + 1))
fi

# ---------------------------------------------------------------------------
# Dimension 2: CQRS Boundary
# ---------------------------------------------------------------------------
echo ""
echo "--- D2: CQRS Boundary ---"

if [ "$CLASSIFICATION" = "HOOK" ]; then
  if grep -n "patchSessionContinuity\|recordSessionContinuity" "$ARTIFACT" 2>/dev/null; then
    echo "[BLOCK] AP-01: WRITE FROM READ-SIDE — hook calls patchSessionContinuity()"
    BLOCK_COUNT=$((BLOCK_COUNT + 1))
  else
    echo "CQRS read-side: CLEAR"
  fi

  if grep -n "client\.session\.\(create\|prompt\|abort\)" "$ARTIFACT" 2>/dev/null; then
    echo "[BLOCK] AP-02: DIRECT SDK CALL FROM HOOK"
    BLOCK_COUNT=$((BLOCK_COUNT + 1))
  else
    echo "No direct SDK mutations: CLEAR"
  fi

  if grep -n "delegationManager\.dispatch" "$ARTIFACT" 2>/dev/null; then
    echo "[BLOCK] AP-02 variant: Hook calls delegationManager.dispatch()"
    BLOCK_COUNT=$((BLOCK_COUNT + 1))
  else
    echo "No dispatch from hook: CLEAR"
  fi
fi

if [ "$CLASSIFICATION" = "TOOL" ]; then
  if grep -n "addEventListener\|\.on(\|subscribe" "$ARTIFACT" 2>/dev/null; then
    echo "[WARN] Tool subscribes to events — verify this is not CQRS violation"
    WARN_COUNT=$((WARN_COUNT + 1))
  else
    echo "CQRS write-side: CLEAR"
  fi
fi

# ---------------------------------------------------------------------------
# Dimension 3: Size and Structure
# ---------------------------------------------------------------------------
echo ""
echo "--- D3: Size and Structure ---"

LOC=$(wc -l < "$ARTIFACT" | tr -d ' ')
echo "Lines of code: $LOC"

case "$CLASSIFICATION" in
  TOOL|HOOK)
    if [ "$LOC" -gt 200 ]; then
      echo "[WARN] AP-14: ${CLASSIFICATION} exceeds 200 LOC ($LOC)"
      WARN_COUNT=$((WARN_COUNT + 1))
    else
      echo "Under 200 LOC: PASS"
    fi
    ;;
  LIBRARY)
    if [ "$LOC" -gt 500 ]; then
      echo "[WARN] AP-14: Library exceeds 500 LOC ($LOC)"
      WARN_COUNT=$((WARN_COUNT + 1))
    else
      echo "Under 500 LOC: PASS"
    fi
    ;;
  PLUGIN)
    if [ "$LOC" -gt 200 ]; then
      echo "[WARN] AP-14: plugin.ts exceeds 200 LOC ($LOC)"
      WARN_COUNT=$((WARN_COUNT + 1))
    else
      echo "Under 200 LOC: PASS"
    fi
    ;;
  *)
    echo "No LOC limit for $CLASSIFICATION classification"
    ;;
esac

# Check for any types (excluding known tech debt)
if grep -n ": any\b" "$ARTIFACT" 2>/dev/null | grep -v "client.*any" | grep -v "// @ts-expect"; then
  echo "[WARN] Implicit or explicit 'any' type detected (excluding client: any known debt)"
  WARN_COUNT=$((WARN_COUNT + 1))
else
  echo "No unexpected 'any' types: PASS"
fi

# Check [Harness] error prefix
if grep -qn "throw new" "$ARTIFACT" 2>/dev/null; then
  UNPREFIXED=$(grep -n "throw new" "$ARTIFACT" | grep -v "\[Harness\]" || true)
  if [ -n "$UNPREFIXED" ]; then
    echo "[WARN] Unprefixed thrown errors detected (should use [Harness] prefix):"
    echo "$UNPREFIXED"
    WARN_COUNT=$((WARN_COUNT + 1))
  else
    echo "Error prefix [Harness]: PASS"
  fi
fi

# ---------------------------------------------------------------------------
# Dimension 4: Actor Hierarchy (for delegation participants)
# ---------------------------------------------------------------------------
echo ""
echo "--- D4: Actor Hierarchy ---"

if [ "$CLASSIFICATION" = "TOOL" ] || [ "$CLASSIFICATION" = "LIBRARY" ]; then
  # Check delegation depth references
  if grep -qn "MAX_DELEGATION_DEPTH\|nestingDepth" "$ARTIFACT" 2>/dev/null; then
    echo "Delegation depth constants referenced: PASS"
    if grep -qn "nestingDepth.*>.*MAX_DELEGATION_DEPTH\|nestingDepth.*>=.*MAX_DELEGATION_DEPTH" "$ARTIFACT" 2>/dev/null; then
      echo "Depth check present: PASS"
    else
      echo "[WARN] AP-06: nestingDepth referenced but no depth guard found"
      WARN_COUNT=$((WARN_COUNT + 1))
    fi
  else
    echo "Not a delegation participant: N/A"
  fi

  # Check category validation
  if grep -qn "VALID_DELEGATION_CATEGORIES" "$ARTIFACT" 2>/dev/null; then
    echo "Category validation present: PASS"
  fi
else
  echo "Not applicable for $CLASSIFICATION"
fi

# ---------------------------------------------------------------------------
# Dimension 5: OpenCode Surface
# ---------------------------------------------------------------------------
echo ""
echo "--- D5: OpenCode Surface ---"

if [ "$CLASSIFICATION" = "TOOL" ]; then
  # Check tool registration reference
  if grep -rn "\"$(basename "$ARTIFACT" .ts)\"" "$PROJECT_ROOT/src/plugin.ts" 2>/dev/null | head -1; then
    echo "Tool registered in plugin.ts: PASS"
  else
    TOOL_NAME=$(basename "$ARTIFACT" .ts | sed 's/^create-//' | sed 's/-tool$//')
    if grep -rn "$TOOL_NAME" "$PROJECT_ROOT/src/plugin.ts" 2>/dev/null | head -1; then
      echo "Tool reference found in plugin.ts: PASS"
    else
      echo "[WARN] Tool may not be registered in plugin.ts — verify manually"
      WARN_COUNT=$((WARN_COUNT + 1))
    fi
  fi
fi

if [ "$CLASSIFICATION" = "HOOK" ]; then
  # Check hook registration
  if grep -qn "create.*Hooks\|Hooks()" "$ARTIFACT" 2>/dev/null; then
    echo "Hook factory pattern detected: PASS"
  else
    echo "[WARN] No hook factory pattern detected — verify registration"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
fi

# ---------------------------------------------------------------------------
# Error boundary check (hooks)
# ---------------------------------------------------------------------------
if [ "$CLASSIFICATION" = "HOOK" ]; then
  if grep -qn "try\s*{" "$ARTIFACT" 2>/dev/null; then
    echo "Error boundary (try/catch) present: PASS"
  else
    echo "[WARN] AP-07: No error boundary (try/catch) detected in hook"
    WARN_COUNT=$((WARN_COUNT + 1))
  fi
fi

# ---------------------------------------------------------------------------
# Sync I/O check (hooks)
# ---------------------------------------------------------------------------
if [ "$CLASSIFICATION" = "HOOK" ]; then
  if grep -qn "readFileSync\|writeFileSync\|execSync" "$ARTIFACT" 2>/dev/null; then
    echo "[BLOCK] AP-04: SYNC BLOCK IN ASYNC HOOK — synchronous I/O detected"
    BLOCK_COUNT=$((BLOCK_COUNT + 1))
  else
    echo "No sync I/O in hook: PASS"
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "=== Summary ==="
echo "BLOCK findings: $BLOCK_COUNT"
echo "WARN findings:  $WARN_COUNT"
echo ""

if [ "$BLOCK_COUNT" -gt 0 ]; then
  echo "VERDICT: FAIL — $BLOCK_COUNT blocking issue(s) must be resolved"
  echo "Routing: STOP — fix blocking issues before re-running gate"
  echo "Remediation targets (see references/remediation-paths.md):"
  echo "  Classification violation → hm-coordinating-loop"
  echo "  Lifecycle wiring → hm-phase-execution"
  echo "  Structural/architectural → hm-refactor"
  echo "  Unknown/unclear → hm-debug"
  echo "  Completion verification → hm-completion-looping"
  exit 1
else
  echo "VERDICT: PASS (automated checks) — agent must apply perspective rubrics"
  echo "Triad flow: lifecycle → spec-compliance → evidence-truth"
  echo "Next gate: gate-spec-compliance (after agent review)"
  exit 0
fi
