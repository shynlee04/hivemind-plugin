#!/usr/bin/env bash
set -euo pipefail

# Non-interactive environment
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat

# ── Usage ──────────────────────────────────────────────────────────────────────
usage() {
  echo "Usage: classify-pattern.sh <skill-dir>" >&2
  echo "" >&2
  echo "Classify a skill directory by its architecture pattern (P1/P2/P3)." >&2
  echo "" >&2
  echo "Arguments:" >&2
  echo "  skill-dir   Path to a skill directory containing SKILL.md" >&2
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

# ── Validate: has frontmatter (--- markers) ────────────────────────────────────
frontmatter_lines=$(head -50 "$skill_md" | grep -c '^---$' || true)
if [ "$frontmatter_lines" -lt 2 ]; then
  echo '{"error": "no_frontmatter", "message": "SKILL.md must have YAML frontmatter between --- markers."}' >&2
  exit 1
fi

# ── Count metrics ──────────────────────────────────────────────────────────────
line_count=$(wc -l < "$skill_md")
ref_count=$(find "$SKILL_DIR/references" -name "*.md" 2>/dev/null | wc -l || true)
script_count=$(find "$SKILL_DIR/scripts" -type f 2>/dev/null | wc -l || true)
has_evals=$(test -d "$SKILL_DIR/evals" && echo true || echo false)
has_scripts=$(test -d "$SKILL_DIR/scripts" && echo true || echo false)
has_triggers=$(test -f "$SKILL_DIR/evals/trigger-queries.json" && echo true || echo false)

# ── Check: decision tree present ──────────────────────────────────────────────
has_decision_tree=$(grep -ciE "decision tree|when to load|pick your path|routing table" "$skill_md" || true)

# ── Check: Iron Law present ───────────────────────────────────────────────────
has_iron_law=$(grep -ciE "iron law|no stack without a reason" "$skill_md" || true)

# ── Check: anti-patterns section present ──────────────────────────────────────
has_antipatterns=$(grep -ciE "anti.pattern|anti_pattern" "$skill_md" || true)

# ── Classify pattern (P1/P2/P3) ───────────────────────────────────────────────
if [ "$line_count" -lt 200 ] && [ "$ref_count" -le 2 ]; then
  pattern="P1"
  pattern_name="Routing"
elif [ "$line_count" -le 400 ] && [ "$ref_count" -le 8 ]; then
  pattern="P2"
  pattern_name="Domain"
else
  pattern="P3"
  pattern_name="Expertise"
fi

# ── Determine routing type ────────────────────────────────────────────────────
if [ "$has_decision_tree" -gt 0 ] && [ "$ref_count" -le 2 ]; then
  routing="thin_router"
elif [ "$has_decision_tree" -gt 0 ] && [ "$ref_count" -gt 2 ]; then
  routing="context_router"
else
  routing="not_a_router"
fi

# ── Determine efficiency ──────────────────────────────────────────────────────
if [ "$has_scripts" = true ]; then
  efficiency="script_bundled"
elif [ "$ref_count" -eq 0 ]; then
  efficiency="pure_instructions"
elif [ "$ref_count" -le 2 ]; then
  efficiency="token_efficient"
elif [ "$ref_count" -le 8 ]; then
  efficiency="script_bundled"
else
  efficiency="context_heavy"
fi

# ── Determine testing maturity ────────────────────────────────────────────────
if [ "$has_evals" = true ] && [ "$has_scripts" = true ]; then
  testing="complete"
elif [ "$has_evals" = true ]; then
  testing="has_evals"
elif [ "$has_scripts" = true ]; then
  testing="has_scripts"
else
  testing="none"
fi

# ── Detect anti-patterns ──────────────────────────────────────────────────────
anti_pattern="false"
anti_pattern_detail="none"
if [ "$pattern" = "P1" ] && [ "$ref_count" -gt 2 ]; then
  anti_pattern="true"
  anti_pattern_detail="P1 with P3 content"
fi

# ── Output JSON ───────────────────────────────────────────────────────────────
jq -n \
  --arg pattern "$pattern" \
  --arg pattern_name "$pattern_name" \
  --arg routing "$routing" \
  --arg efficiency "$efficiency" \
  --arg testing "$testing" \
  --argjson lines "$line_count" \
  --argjson refs "$ref_count" \
  --argjson scripts "$script_count" \
  --argjson has_evals "$has_evals" \
  --argjson has_triggers "$has_triggers" \
  --argjson has_decision_tree "$([ "$has_decision_tree" -gt 0 ] && echo true || echo false)" \
  --argjson has_iron_law "$([ "$has_iron_law" -gt 0 ] && echo true || echo false)" \
  --argjson has_antipatterns "$([ "$has_antipatterns" -gt 0 ] && echo true || echo false)" \
  --argjson anti_pattern "$anti_pattern" \
  --arg anti_pattern_detail "$anti_pattern_detail" \
  '{
    pattern: $pattern,
    pattern_name: $pattern_name,
    routing: $routing,
    efficiency: $efficiency,
    testing: $testing,
    lines: $lines,
    refs: $refs,
    scripts: $scripts,
    has_evals: $has_evals,
    has_triggers: $has_triggers,
    has_decision_tree: $has_decision_tree,
    has_iron_law: $has_iron_law,
    has_antipatterns: $has_antipatterns,
    anti_pattern_detected: $anti_pattern,
    anti_pattern_detail: $anti_pattern_detail
  }'

exit 0
