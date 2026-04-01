#!/usr/bin/env bash
# score-idea-viability.sh — Scores idea viability from JSON input
# Usage: score-idea-viability.sh --input <scores.json>
# Thresholds: >=0.7 PASS | 0.4-0.69 CONDITIONAL | <0.4 FAIL

set -euo pipefail
IFS=$'\n\t'

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

# --- Defaults ---
input_file=""
mode="viability"

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      input_file="$2"
      shift 2
      ;;
    --creep-check)
      mode="creep"
      shift
      ;;
    --help|-h)
      printf 'Usage: score-idea-viability.sh --input <scores.json> [--creep-check]\n'
      printf 'Thresholds: >=0.7 PASS | 0.4-0.69 CONDITIONAL | <0.4 FAIL\n'
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[[ -n "$input_file" ]] || fail "usage: score-idea-viability.sh --input <scores.json>"
[[ -f "$input_file" ]] || fail "file not found: $input_file"

# --- Weights for viability scoring ---
w_impact=0.25
w_reach=0.20
w_frequency=0.15
w_differentiation=0.15
w_defensibility=0.10
w_feasibility=0.15

# --- Validate JSON and extract scores ---
validate_score() {
  local label="$1"
  local val="$2"
  if [[ -z "$val" ]]; then
    fail "missing score for: $label"
  fi
  # Accept numeric values only
  if ! printf '%s' "$val" | grep -qE '^[0-9]+\.?[0-9]*$'; then
    fail "invalid score for $label: $val (must be 0.0-1.0)"
  fi
}

# --- Extract scores using python3 (portable JSON parsing) ---
read -r impact reach frequency differentiation defensibility feasibility <<< \
  "$(python3 - "$input_file" <<'PY'
import json
import sys

with open(sys.argv[1], "r") as f:
    data = json.load(f)

fields = ["impact", "reach", "frequency", "differentiation", "defensibility", "feasibility"]
values = []
for field in fields:
    val = data.get(field)
    if val is None:
        print(f"MISSING:{field}", file=sys.stderr)
        sys.exit(1)
    values.append(str(float(val)))
print(" ".join(values))
PY
)"

# --- Validate each score ---
validate_score "impact" "$impact"
validate_score "reach" "$reach"
validate_score "frequency" "$frequency"
validate_score "differentiation" "$differentiation"
validate_score "defensibility" "$defensibility"
validate_score "feasibility" "$feasibility"

# --- Calculate weighted score ---
weighted_score=$(python3 - <<PY
impact = $impact
reach = $reach
frequency = $frequency
differentiation = $differentiation
defensibility = $defensibility
feasibility = $feasibility

score = (
    impact * $w_impact +
    reach * $w_reach +
    frequency * $w_frequency +
    differentiation * $w_differentiation +
    defensibility * $w_defensibility +
    feasibility * $w_feasibility
)
print(f"{score:.4f}")
PY
)

# --- Determine result ---
if (( $(echo "$weighted_score >= 0.7" | bc -l) )); then
  result="PASS"
elif (( $(echo "$weighted_score >= 0.4" | bc -l) )); then
  result="CONDITIONAL"
else
  result="FAIL"
fi

# --- Score label ---
score_label() {
  local val="$1"
  if (( $(echo "$val >= 0.7" | bc -l) )); then
    printf '👍 Strong'
  elif (( $(echo "$val >= 0.4" | bc -l) )); then
    printf '🤔 Uncertain'
  else
    printf '❌ Weak'
  fi
}

# --- Output ---
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

printf '=== Idea Viability Score ===\n'
printf 'Impact:          %s (%s)\n' "$impact" "$(score_label "$impact")"
printf 'Reach:           %s (%s)\n' "$reach" "$(score_label "$reach")"
printf 'Frequency:       %s (%s)\n' "$frequency" "$(score_label "$frequency")"
printf 'Differentiation: %s (%s)\n' "$differentiation" "$(score_label "$differentiation")"
printf 'Defensibility:   %s (%s)\n' "$defensibility" "$(score_label "$defensibility")"
printf 'Feasibility:     %s (%s)\n' "$feasibility" "$(score_label "$feasibility")"
printf '---\n'
printf 'Weighted Score:  %s\n' "$weighted_score"
printf 'Result:          %s\n' "$result"

# --- Output JSON ---
output_json="${input_file%.json}-scored.json"
python3 - "$input_file" "$weighted_score" "$result" "$timestamp" <<PY
import json
import sys

with open(sys.argv[1], "r") as f:
    data = json.load(f)

scored = {
    "weighted_score": float(sys.argv[2]),
    "result": sys.argv[3],
    "criteria": {
        "impact": data.get("impact", 0),
        "reach": data.get("reach", 0),
        "frequency": data.get("frequency", 0),
        "differentiation": data.get("differentiation", 0),
        "defensibility": data.get("defensibility", 0),
        "feasibility": data.get("feasibility", 0)
    },
    "thresholds": {
        "pass": 0.7,
        "conditional": 0.4
    },
    "_meta": {
        "created_at": sys.argv[4],
        "updated_at": sys.argv[4],
        "producer": "use-hivemind-ideating/scripts/score-idea-viability.sh"
    }
}

with open(sys.argv[1].replace(".json", "-scored.json"), "w") as f:
    json.dump(scored, f, indent=2)
    f.write("\n")
PY

printf 'Scored output: %s\n' "$output_json"
[[ "$result" == "FAIL" ]] && exit 1
exit 0
