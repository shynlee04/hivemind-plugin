#!/usr/bin/env bash
# guided-discovery.sh — Detect user profile (language, maturity, guidance needs)
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash guided-discovery.sh "<user_arguments>"
set -euo pipefail

INPUT="${1:-}"

# Defaults
LANG="en"
MATURITY="unknown"
GUIDANCE="standard"

# Detect non-English input (basic heuristic: non-ASCII chars)
if echo "$INPUT" | grep -qP '[^\x00-\x7F]' 2>/dev/null; then
  LANG="non-en"
  GUIDANCE="high"
fi

# Detect maturity signals
INPUT_LOWER=$(echo "$INPUT" | tr '[:upper:]' '[:lower:]')

if echo "$INPUT_LOWER" | grep -qE '(framework|architecture|refactor|governance|lifecycle|pipeline|orchestrat)'; then
  MATURITY="advanced"
  GUIDANCE="minimal"
elif echo "$INPUT_LOWER" | grep -qE '(help|how|start|begin|new|setup|first)'; then
  MATURITY="beginner"
  GUIDANCE="high"
else
  MATURITY="intermediate"
  GUIDANCE="standard"
fi

cat <<EOF
{"language":"${LANG}","maturity":"${MATURITY}","guidance_level":"${GUIDANCE}","input_length":${#INPUT}}
EOF
