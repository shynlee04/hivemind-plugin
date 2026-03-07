#!/usr/bin/env bash
# journey-intake-qa.sh — Generate intake questions based on intent and level
# Non-interactive: deterministic JSON output, no prompts, fail-fast
# Usage: bash journey-intake-qa.sh <intent> <level> <depth>
set -euo pipefail

INTENT="${1:-auto}"
LEVEL="${2:-L1}"
DEPTH="${3:-medium}"

case "$INTENT" in
  build_new|auto)
    QUESTIONS='["What are you building? (1-sentence summary)","Who is the target user?","What existing codebase does this integrate with?","What is the success criteria?","Any hard constraints or deadlines?"]'
    ;;
  fix_broken)
    QUESTIONS='["What is broken? (error message or behavior)","When did it start breaking?","What was the last change made?","Can you reproduce it consistently?","What have you tried so far?"]'
    ;;
  audit_health)
    QUESTIONS='["Which systems should be audited?","What specific concerns prompted this audit?","What is the current known health status?","Are there areas known to be fragile?","What is the desired outcome of this audit?"]'
    ;;
  extend)
    QUESTIONS='["What existing feature are you extending?","What new capability should it have?","What should NOT change?","What tests currently cover this area?","What is the expected impact radius?"]'
    ;;
  learn)
    QUESTIONS='["What topic do you want to understand?","What is your current knowledge level?","Do you prefer examples or theory?","Is this for immediate use or background knowledge?"]'
    ;;
  *)
    QUESTIONS='["Please describe your goal","What is the current state of the project?","What is the desired end state?"]'
    ;;
esac

cat <<EOF
{"intent":"${INTENT}","level":"${LEVEL}","depth":"${DEPTH}","questions":${QUESTIONS}}
EOF
