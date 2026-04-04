#!/usr/bin/env bash
set -euo pipefail

# Non-interactive environment
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat

# ── Usage ──────────────────────────────────────────────────────────────────────
usage() {
  echo "Usage: run-trigger-evals.sh <skill-dir>" >&2
  echo "" >&2
  echo "Evaluate trigger-queries.json against SKILL.md description." >&2
  echo "Performs structural keyword matching — NOT LLM simulation." >&2
  echo "" >&2
  echo "Arguments:" >&2
  echo "  skill-dir   Path to a skill directory containing SKILL.md and evals/" >&2
  exit 1
}

# ── Parse args ─────────────────────────────────────────────────────────────────
if [ $# -lt 1 ]; then
  usage
fi
SKILL_DIR="$1"

# ── Validate: SKILL.md exists ─────────────────────────────────────────────────
skill_md="$SKILL_DIR/SKILL.md"
if [ ! -f "$skill_md" ]; then
  echo "{\"error\": \"no_skill_md\", \"path\": \"$SKILL_DIR\"}" >&2
  exit 1
fi

# ── Validate: trigger-queries.json exists ──────────────────────────────────────
queries_file="$SKILL_DIR/evals/trigger-queries.json"
if [ ! -f "$queries_file" ]; then
  echo "no trigger queries found" >&2
  exit 1
fi

# ── Extract description from frontmatter ───────────────────────────────────────
# Text between first --- markers, after the description: field
description=$(sed -n '/^---$/,/^---$/p' "$skill_md" \
  | grep -m1 '^description:' \
  | sed 's/^description:[[:space:]]*//' \
  | tr '[:upper:]' '[:lower:]' \
  || true)

if [ -z "$description" ]; then
  echo "{\"error\": \"no_description\", \"message\": \"SKILL.md frontmatter has no description field.\"}" >&2
  exit 1
fi

# ── Stop words ─────────────────────────────────────────────────────────────────
STOPWORDS="a an the is are was were be been being have has had do does did will would could should may might must shall can to of in for on with at by from as into through during before after above below between out off over under again further then once here there when where why how all both each few more most other some such no nor not only own same so than too very just because but and or if while about up that this these those i me my myself we our ours ourselves you your yours yourself yourselves he him his himself she her hers herself it its itself they them their theirs themselves what which who whom"

# ── Helper: check if word is a stop word ───────────────────────────────────────
is_stopword() {
  local word="$1"
  for sw in $STOPWORDS; do
    if [ "$word" = "$sw" ]; then
      return 0
    fi
  done
  return 1
}

# ── Helper: extract significant words from a query ─────────────────────────────
# Returns words >= 3 chars, not in STOPWORDS, one per line
extract_significant_words() {
  local text="$1"
  # Lowercase, split on non-alpha, filter length >= 3, filter stopwords
  echo "$text" \
    | tr '[:upper:]' '[:lower:]' \
    | tr -cs 'a-z' '\n' \
    | awk 'length >= 3' \
    | while read -r word; do
        if ! is_stopword "$word"; then
          echo "$word"
        fi
      done
}

# ── Helper: count how many significant words from query appear in description ──
count_matches_in_desc() {
  local query="$1"
  local desc="$2"
  local count=0

  while read -r word; do
    [ -z "$word" ] && continue
    if echo "$desc" | grep -qi "\b${word}\b"; then
      count=$((count + 1))
    fi
  done < <(extract_significant_words "$query")

  echo "$count"
}

# ── Process queries ────────────────────────────────────────────────────────────
total=0
true_positives=0
true_negatives=0
false_positives=0
false_negatives=0

# Read queries from JSON using jq
query_count=$(jq '.queries | length' "$queries_file")

for i in $(seq 0 $((query_count - 1))); do
  query=$(jq -r ".queries[$i].query" "$queries_file")
  should_trigger=$(jq -r ".queries[$i].should_trigger" "$queries_file")

  total=$((total + 1))

  # Count significant word matches in description
  match_count=$(count_matches_in_desc "$query" "$description")

  if [ "$should_trigger" = "true" ]; then
    # Should trigger: pass if >= 2 significant words match
    if [ "$match_count" -ge 2 ]; then
      true_positives=$((true_positives + 1))
    else
      false_negatives=$((false_negatives + 1))
    fi
  else
    # Should NOT trigger: pass if <= 1 significant word matches
    if [ "$match_count" -le 1 ]; then
      true_negatives=$((true_negatives + 1))
    else
      false_positives=$((false_positives + 1))
    fi
  fi
done

# ── Calculate coverage ─────────────────────────────────────────────────────────
if [ "$total" -gt 0 ]; then
  correct=$((true_positives + true_negatives))
  # Use awk for floating point
  coverage=$(awk "BEGIN {printf \"%.2f\", $correct / $total}")
else
  coverage="0.00"
fi

# ── Output JSON ───────────────────────────────────────────────────────────────
jq -n \
  --argjson total "$total" \
  --argjson true_positives "$true_positives" \
  --argjson true_negatives "$true_negatives" \
  --argjson false_positives "$false_positives" \
  --argjson false_negatives "$false_negatives" \
  --arg coverage "$coverage" \
  '{
    total: $total,
    true_positives: $true_positives,
    true_negatives: $true_negatives,
    false_positives: $false_positives,
    false_negatives: $false_negatives,
    coverage: ($coverage | tonumber)
  }'

# ── Exit code ──────────────────────────────────────────────────────────────────
pass=$(awk "BEGIN {print ($coverage >= 0.80) ? 1 : 0}")
if [ "$pass" -eq 1 ]; then
  exit 0
else
  exit 1
fi
