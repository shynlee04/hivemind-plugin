#!/usr/bin/env bash
# classify-intent.sh — Classify user input into hivefiver intent categories
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash classify-intent.sh "<user_arguments>"
set -euo pipefail

INPUT="${1:-}"

# No input = unknown
if [ -z "$INPUT" ]; then
  cat <<'EOF'
{"intent":"unknown","confidence":"none","next_command":"/hivefiver","suggestion":"No input provided. Use /hivefiver for guided routing."}
EOF
  exit 0
fi

# Lowercase for matching
INPUT_LOWER=$(echo "$INPUT" | tr '[:upper:]' '[:lower:]')

# Intent classification via keyword matching
INTENT="unknown"
CONFIDENCE="low"
NEXT_CMD="/hivefiver-start"

# Build/create patterns
if echo "$INPUT_LOWER" | grep -qE '(build|create|make|new|implement|add|develop|scaffold)'; then
  INTENT="build_new"
  CONFIDENCE="high"
  NEXT_CMD="/hivefiver-start"
fi

# Fix/debug patterns
if echo "$INPUT_LOWER" | grep -qE '(fix|bug|broken|error|crash|fail|debug|repair|heal)'; then
  INTENT="fix_broken"
  CONFIDENCE="high"
  NEXT_CMD="/hivefiver-doctor"
fi

# Audit/check patterns
if echo "$INPUT_LOWER" | grep -qE '(audit|check|health|status|verify|inspect|review)'; then
  INTENT="audit_health"
  CONFIDENCE="high"
  NEXT_CMD="/hivefiver-audit"
fi

# Extend patterns
if echo "$INPUT_LOWER" | grep -qE '(extend|enhance|improve|upgrade|refactor|optimize)'; then
  INTENT="extend"
  CONFIDENCE="medium"
  NEXT_CMD="/hivefiver-start"
fi

# Learn patterns
if echo "$INPUT_LOWER" | grep -qE '(learn|explain|understand|how|what|why|help|guide)'; then
  INTENT="learn"
  CONFIDENCE="medium"
  NEXT_CMD="/hivefiver-discovery"
fi

cat <<EOF
{"intent":"${INTENT}","confidence":"${CONFIDENCE}","next_command":"${NEXT_CMD}","raw_input":"$(echo "$INPUT" | sed 's/"/\\"/g')"}
EOF
