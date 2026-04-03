#!/usr/bin/env bash
# iterate.sh — Run evals, review failures, fix, rerun, compare.
# Usage: bash iterate.sh [--max-iterations N] [--skills s1,s2,...]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/eval-runner.sh"
RESULTS_DIR="$SCRIPT_DIR/results"
ITERATIONS_DIR="$RESULTS_DIR/iterations"

MAX_ITERATIONS="${MAX_ITERATIONS:-5}"
TARGET_SKILLS=""

mkdir -p "$ITERATIONS_DIR"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-iterations) MAX_ITERATIONS="$2"; shift 2 ;;
    --skills) TARGET_SKILLS="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

echo "=== Eval Iteration Loop ==="
echo "Max iterations: $MAX_ITERATIONS"
echo "Target skills: ${TARGET_SKILLS:-all}"
echo ""

PREV_PASS_RATE=0
PREV_REPORT=""

for iteration in $(seq 1 "$MAX_ITERATIONS"); do
  echo "=========================================="
  echo "Iteration $iteration / $MAX_ITERATIONS"
  echo "=========================================="

  ITER_DIR="$ITERATIONS_DIR/iter-$iteration"
  mkdir -p "$ITER_DIR"

  # Run evals
  if [[ -n "$TARGET_SKILLS" ]]; then
    IFS=',' read -ra SKILLS <<< "$TARGET_SKILLS"
    ALL_RESULTS="[]"
    for skill in "${SKILLS[@]}"; do
      RESULTS=$(bash "$RUNNER" --skill "$skill" --json 2>/dev/null)
      ALL_RESULTS=$(echo "$ALL_RESULTS" "$RESULTS" | python3 -c "
import json, sys
a = json.loads(sys.stdin.readline())
b = json.loads(sys.stdin.readline())
print(json.dumps(a + b))
")
    done
    echo "$ALL_RESULTS" > "$ITER_DIR/results.json"
  else
    bash "$RUNNER" --all --json 2>/dev/null > "$ITER_DIR/results.json"
  fi

  # Parse results
  TOTAL=$(python3 -c "import json; d=json.load(open('$ITER_DIR/results.json')); print(len(d))")
  PASSED=$(python3 -c "import json; d=json.load(open('$ITER_DIR/results.json')); print(sum(1 for x in d if x.get('passed')))")
  FAILED=$((TOTAL - PASSED))
  PASS_RATE=$(python3 -c "print(round($PASSED / $TOTAL, 4) if $TOTAL > 0 else 0)")

  echo "Total: $TOTAL | Passed: $PASSED | Failed: $FAILED | Rate: $PASS_RATE"

  # Generate failure report
  python3 -c "
import json
results = json.load(open('$ITER_DIR/results.json'))
failed = [r for r in results if not r.get('passed')]
if not failed:
    print('ALL EVALS PASS — no failures to report.')
    exit(0)
print(f'=== {len(failed)} Failed Evals ===')
for r in failed:
    eid = r.get('eval_id', r.get('chain_id', 'unknown'))
    skill = r.get('skill_name', r.get('name', 'unknown'))
    status = r.get('status', 'N/A')
    print(f'\n--- {skill}/{eid} (status: {status}) ---')
    for a in r.get('assertions', []):
        if not a.get('passed'):
            print(f'  FAIL: {a[\"text\"]}')
            print(f'        Evidence: {a[\"evidence\"]}')
    # For chain evals, show layer failures
    for layer in r.get('layers', []):
        if layer.get('status') in ('FAILED', 'SKIPPED'):
            print(f'  Layer {layer[\"layer\"]}: {layer[\"skill\"]} — {layer[\"status\"]}')
            for a in layer.get('assertions', []):
                if not a.get('passed'):
                    print(f'    FAIL: {a[\"text\"]}')
                    print(f'          Evidence: {a[\"evidence\"]}')
" > "$ITER_DIR/failures.txt"

  cat "$ITER_DIR/failures.txt"

  # Compare with previous iteration
  if [[ -n "$PREV_REPORT" ]]; then
    DIFF=$(python3 -c "
prev = $PREV_PASS_RATE
curr = $PASS_RATE
delta = curr - prev
if delta > 0:
    print(f'IMPROVED: +{delta:.2%} ({prev:.2%} → {curr:.2%})')
elif delta < 0:
    print(f'REGRESSION: {delta:.2%} ({prev:.2%} → {curr:.2%})')
else:
    print(f'NO CHANGE: {curr:.2%}')
")
    echo ""
    echo "Delta: $DIFF"
  fi

  # Check if all pass
  if [[ "$FAILED" -eq 0 ]]; then
    echo ""
    echo "🎉 ALL EVALS PASS after $iteration iteration(s)!"
    break
  fi

  # Check if improving
  if [[ -n "$PREV_REPORT" ]]; then
    IMPROVED=$(python3 -c "print('yes' if $PASS_RATE > $PREV_PASS_RATE else 'no')")
    if [[ "$IMPROVED" == "no" && "$iteration" -gt 1 ]]; then
      echo ""
      echo "⚠️  No improvement from previous iteration. Stopping."
      echo "Review failures.txt and fix the underlying issues."
      break
    fi
  fi

  PREV_PASS_RATE=$PASS_RATE
  PREV_REPORT="$ITER_DIR/results.json"

  echo ""
  echo "Review failures above. Fix the issues, then re-run iterate.sh."
  echo "Failure report saved to: $ITER_DIR/failures.txt"

  if [[ "$iteration" -lt "$MAX_ITERATIONS" ]]; then
    echo ""
    echo "Press Enter to continue (or Ctrl+C to stop)..."
    read -r
  fi
done

# Final summary
echo ""
echo "=== Final Summary ==="
echo "Iterations: $iteration"
echo "Final pass rate: $PASS_RATE ($PASSED/$TOTAL)"
echo "Reports saved to: $ITERATIONS_DIR/"

# Write iteration summary
python3 -c "
import json, os
summary = {
    'iterations': $iteration,
    'final_pass_rate': $PASS_RATE,
    'final_passed': $PASSED,
    'final_failed': $FAILED,
    'total_evals': $TOTAL,
    'reports': [f'iter-{i}/results.json' for i in range(1, $iteration + 1)]
}
os.makedirs('$RESULTS_DIR', exist_ok=True)
with open('$RESULTS_DIR/iteration-summary.json', 'w') as f:
    json.dump(summary, f, indent=2)
"

echo "Iteration summary: $RESULTS_DIR/iteration-summary.json"
