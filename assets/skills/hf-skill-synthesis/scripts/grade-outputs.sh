#!/usr/bin/env bash
set -euo pipefail

# Non-interactive environment
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat

# ── Usage ──────────────────────────────────────────────────────────────────────
usage() {
  echo "Usage: grade-outputs.sh <skill-dir>" >&2
  echo "Grade a skill using mechanical proxies (NOT qualitative scoring)." >&2
  echo "Each dimension: 0-3 checks, scaled to 0-5." >&2
  exit 1
}

# ── Parse args ─────────────────────────────────────────────────────────────────
if [ $# -lt 1 ]; then
  usage
fi
SKILL_DIR="$1"

# ── Validate: SKILL.md exists ─────────────────────────────────────────────────
skill_md="$SKILL_DIR/SKILL.md"
[ ! -f "$skill_md" ] && { echo "{\"error\": \"no_skill_md\", \"path\": \"$SKILL_DIR\"}" >&2; exit 1; }

# ── Read content and extract description ───────────────────────────────────────
content=$(cat "$skill_md")
line_count=$(wc -l < "$skill_md")
description=$(sed -n '/^---$/,/^---$/p' "$skill_md" \
  | grep -m1 '^description:' \
  | sed 's/^description:[[:space:]]*//' \
  || true)
desc_length=${#description}

# ── Helper: scale 0-3 to 0-5 ──────────────────────────────────────────────────
scale() { awk "BEGIN {printf \"%.1f\", $1 * 5 / 3}"; }

# ── Dimension 1: Trigger Accuracy (0-3 → scale to 0-5) ────────────────────────
# Check 1: description length 100-1024?
# Check 2: Has "Use when"?
# Check 3: Has ≥3 trigger phrases (commas or "or" in description)?
trigger_score=0
if [ "$desc_length" -ge 100 ] && [ "$desc_length" -le 1024 ]; then
  trigger_score=$((trigger_score + 1))
fi
if echo "$description" | grep -qi "use when"; then
  trigger_score=$((trigger_score + 1))
fi
phrase_count=$(($(echo "$description" | grep -o ',' | wc -l || true) \
  + $(echo "$description" | grep -oi '\bor\b' | wc -l || true)))
if [ "$phrase_count" -ge 3 ]; then
  trigger_score=$((trigger_score + 1))
fi
trigger_scaled=$(scale $trigger_score)

# ── Dimension 2: Action Coherence (0-3 → scale to 0-5) ────────────────────────
# Check 1: Has decision tree/checklist?
# Check 2: Has Iron Law?
# Check 3: Has step-by-step workflow?
coherence_score=0
if echo "$content" | grep -qiE "decision tree|when to|pick your path|routing table|checklist|step.by.step|workflow"; then
  coherence_score=$((coherence_score + 1))
fi
if echo "$content" | grep -qiE "iron law|no stack without"; then
  coherence_score=$((coherence_score + 1))
fi
if echo "$content" | grep -qiE "^[0-9]+\." || echo "$content" | grep -qiE "step [0-9]|phase [0-9]"; then
  coherence_score=$((coherence_score + 1))
fi
coherence_scaled=$(scale $coherence_score)

# ── Dimension 3: Reference Integrity (0-3 → scale to 0-5) ─────────────────────
# Check 1: All referenced files exist?
# Check 2: No dead refs (no references to non-existent scripts)?
# Check 3: References numbered?
integrity_score=0
refs_exist=true
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$SKILL_DIR/$f" ] && { refs_exist=false; break; }
done < <(echo "$content" | grep -oE 'references/[^ )]+' || true)
[ "$refs_exist" = true ] && integrity_score=$((integrity_score + 1))

scripts_exist=true
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$SKILL_DIR/$f" ] && { scripts_exist=false; break; }
done < <(echo "$content" | grep -oE 'scripts/[^ )]+' || true)
[ "$scripts_exist" = true ] && integrity_score=$((integrity_score + 1))

if echo "$content" | grep -qE 'references/[0-9]'; then
  integrity_score=$((integrity_score + 1))
fi
integrity_scaled=$(scale $integrity_score)

# ── Dimension 4: Non-Redundancy (0-3 → scale to 0-5) ──────────────────────────
# Check 1: SKILL.md < 400 lines?
# Check 2: No duplicate content in refs (repeated section headers)?
# Check 3: No tutorial content (no "What is X" headers)?
redundancy_score=0
if [ "$line_count" -lt 400 ]; then
  redundancy_score=$((redundancy_score + 1))
fi
has_dup=false
if [ -d "$SKILL_DIR/references" ]; then
  dup_count=$(find "$SKILL_DIR/references" -name "*.md" -exec grep -h '^## ' {} + \
    | sort | uniq -d | wc -l || true)
  [ "$dup_count" -gt 0 ] && has_dup=true
fi
[ "$has_dup" = false ] && redundancy_score=$((redundancy_score + 1))
echo "$content" | grep -qiE '^#{1,3} what is ' || redundancy_score=$((redundancy_score + 1))
redundancy_scaled=$(scale $redundancy_score)

# ── Dimension 5: Edge Case Coverage (0-3 → scale to 0-5) ──────────────────────
# Check 1: Has anti-patterns table?
# Check 2: Has error handling?
# Check 3: Has platform adaptation?
edge_score=0
if echo "$content" | grep -qiE "anti.pattern|anti_pattern"; then
  edge_score=$((edge_score + 1))
fi
if echo "$content" | grep -qiE "error handling|error.*handl|fail|fallback|recovery"; then
  edge_score=$((edge_score + 1))
fi
if echo "$content" | grep -qiE "platform|adapt|cross.platform|claude.code|gemini|cursor|copilot"; then
  edge_score=$((edge_score + 1))
fi
edge_scaled=$(scale $edge_score)

# ── Calculate weighted total ───────────────────────────────────────────────────
total=$(awk "BEGIN {printf \"%.1f\", \
  $trigger_scaled * 0.25 + $coherence_scaled * 0.25 \
  + $integrity_scaled * 0.20 + $redundancy_scaled * 0.15 + $edge_scaled * 0.15}")

# ── Block rule: any dimension ≤ 2 → blocked ────────────────────────────────────
blocked=false
for dim in $trigger_scaled $coherence_scaled $integrity_scaled $redundancy_scaled $edge_scaled; do
  if awk "BEGIN {exit !($dim <= 2.0)}"; then
    blocked=true
    break
  fi
done

# ── Determine grade ────────────────────────────────────────────────────────────
grade=$(awk "BEGIN {
  t = $total
  if (t >= 4.5) print \"EXCELLENT\"
  else if (t >= 4.0) print \"GOOD\"
  else if (t >= 3.5) print \"ACCEPTABLE\"
  else print \"NEEDS WORK\"
}")

# ── Output JSON ───────────────────────────────────────────────────────────────
jq -n \
  --argjson trigger "$trigger_scaled" \
  --argjson coherence "$coherence_scaled" \
  --argjson integrity "$integrity_scaled" \
  --argjson redundancy "$redundancy_scaled" \
  --argjson edge "$edge_scaled" \
  --argjson total "$total" \
  --arg grade "$grade" \
  --argjson blocked "$blocked" \
  '{
    dimensions: {
      trigger_accuracy: $trigger,
      action_coherence: $coherence,
      reference_integrity: $integrity,
      non_redundancy: $redundancy,
      edge_case_coverage: $edge
    },
    total: $total,
    grade: $grade,
    blocked: $blocked
  }'

# ── Exit code: 0 if total ≥ 3.5 and not blocked, non-zero otherwise ───────────
if awk "BEGIN {exit !($total >= 3.5 && $blocked == 0)}"; then
  exit 0
else
  exit 1
fi
