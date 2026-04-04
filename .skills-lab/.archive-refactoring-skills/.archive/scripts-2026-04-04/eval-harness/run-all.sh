#!/usr/bin/env bash
set -euo pipefail

# run-all.sh — Run evals for all 5 skills and produce a benchmark report
#
# Usage:
#   bash run-all.sh [--verbose]
#
# Output:
#   - JSON results to stdout
#   - Benchmark report to results/benchmark.json

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EVAL_RUNNER="$SCRIPT_DIR/eval-runner.sh"
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

VERBOSE=false
if [[ "${1:-}" == "--verbose" ]]; then
  VERBOSE=true
fi

ALL_SKILLS=("meta-builder" "user-intent-interactive-loop" "planning-with-files" "coordinating-loop" "use-authoring-skills")

# ── Helpers ──
timestamp_ms() {
  if date +%s%N >/dev/null 2>&1; then
    local ns
    ns=$(date +%s%N)
    echo $(( ns / 1000000 ))
  else
    python3 -c "import time; print(int(time.time()*1000))" 2>/dev/null || echo "0"
  fi
}

iso_timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# ── Run all evals ──
main() {
  local overall_start
  overall_start=$(timestamp_ms)

  local total_evals=0
  local total_passed=0
  local total_failed=0
  local per_skill_json=""
  local all_results_json="["
  local first_result=true

  for skill in "${ALL_SKILLS[@]}"; do
    local skill_start
    skill_start=$(timestamp_ms)

    local skill_total=0
    local skill_passed=0
    local skill_failed=0

    # Run evals for this skill
    local skill_results
    if [[ "$VERBOSE" == true ]]; then
      skill_results=$(bash "$EVAL_RUNNER" --skill "$skill" --verbose 2>/dev/null || true)
    else
      skill_results=$(bash "$EVAL_RUNNER" --skill "$skill" 2>/dev/null || true)
    fi

    # Count results from JSON output
    # Each eval result has "eval_id" and "passed" fields
    local eval_ids
    eval_ids=$(echo "$skill_results" | grep -o '"eval_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"eval_id"[[:space:]]*:[[:space:]]*"//;s/"$//' || true)

    while IFS= read -r eid; do
      [[ -z "$eid" ]] && continue
      skill_total=$((skill_total + 1))
      total_evals=$((total_evals + 1))

      # Check if this eval passed
      # Find the "passed" field after this eval_id
      local passed_val
      passed_val=$(echo "$skill_results" | awk -v id="$eid" '
        BEGIN { found=0 }
        /"eval_id"[[:space:]]*:[[:space:]]*"/ {
          if (index($0, id) > 0) found=1
          else if (found) found=2
        }
        found==1 && /"passed"[[:space:]]*:[[:space:]]*(true|false)/ {
          if (index($0, "true") > 0) print "true"
          else print "false"
          exit
        }
      ')

      if [[ "$passed_val" == "true" ]]; then
        skill_passed=$((skill_passed + 1))
        total_passed=$((total_passed + 1))
      else
        skill_failed=$((skill_failed + 1))
        total_failed=$((total_failed + 1))
      fi
    done <<< "$eval_ids"

    local skill_end
    skill_end=$(timestamp_ms)
    local skill_duration=$(( skill_end - skill_start ))

    local skill_pass_rate="0.00"
    if [[ $skill_total -gt 0 ]]; then
      skill_pass_rate=$(python3 -c "print(f'{$skill_passed/$skill_total:.2f}')" 2>/dev/null || echo "0.00")
    fi

    # Build per-skill JSON
    if [[ -n "$per_skill_json" ]]; then
      per_skill_json="$per_skill_json,"
    fi
    per_skill_json="$per_skill_json
    \"$skill\": {\"total\": $skill_total, \"passed\": $skill_passed, \"failed\": $skill_failed, \"pass_rate\": $skill_pass_rate}"

    # Collect all results
    if [[ "$first_result" == true ]]; then
      first_result=false
    else
      all_results_json="$all_results_json,"
    fi
    all_results_json="$all_results_json
$skill_results"

    echo "[$skill] $skill_passed/$skill_total passed (${skill_pass_rate}) — ${skill_duration}ms"
  done

  local overall_end
  overall_end=$(timestamp_ms)
  local overall_duration=$(( overall_end - overall_start ))

  all_results_json="$all_results_json
]"

  # Calculate overall pass rate
  local overall_pass_rate="0.00"
  if [[ $total_evals -gt 0 ]]; then
    overall_pass_rate=$(python3 -c "print(f'{$total_passed/$total_evals:.2f}')" 2>/dev/null || echo "0.00")
  fi

  # Write benchmark report
  local benchmark_json
  benchmark_json=$(cat <<EOJSON
{
  "timestamp": "$(iso_timestamp)",
  "total_evals": $total_evals,
  "passed": $total_passed,
  "failed": $total_failed,
  "pass_rate": $overall_pass_rate,
  "total_duration_ms": $overall_duration,
  "per_skill": {$per_skill_json
  }
}
EOJSON
)

  echo "$benchmark_json" > "$RESULTS_DIR/benchmark.json"

  echo ""
  echo "=== Benchmark Summary ==="
  echo "Total: $total_evals | Passed: $total_passed | Failed: $total_failed | Rate: $overall_pass_rate"
  echo "Duration: ${overall_duration}ms"
  echo "Report: $RESULTS_DIR/benchmark.json"

  # Also write full results
  echo "$all_results_json" > "$RESULTS_DIR/all-results.json"
}

main
