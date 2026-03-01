#!/usr/bin/env bash
# classify-intent.sh — Free-form intent classifier for HiveFiver V2
#
# Takes free-form user input and classifies it into one of 7 intents:
#   build_new | fix_broken | audit_health | extend | improve | learn | unknown
#
# Uses keyword-family scoring with weighted matches for deterministic classification.
# No LLM needed — pure pattern matching for speed and reliability.
#
# Usage:
#   classify-intent.sh "build me an agent for code review"
#   classify-intent.sh --json "fix my broken commands"
#   classify-intent.sh --suggest "I need help"
#
# Output:
#   JSON: { "intent", "confidence", "next_stage", "next_command", "reasoning" }
#
# Dependencies: bash 4+, no external tools required

set -Eeuo pipefail

# --- Arg parsing ---

MODE="json"
INPUT=""

for arg in "$@"; do
  case "$arg" in
    --json)    MODE="json" ;;
    --suggest) MODE="suggest" ;;
    --*)       printf '{"error":"unknown_flag","flag":"%s"}\n' "$arg" >&2; exit 1 ;;
    *)         INPUT="$arg" ;;
  esac
done

# --- Guard: empty input ---

if [[ -z "$INPUT" ]]; then
  printf '{"intent":"unknown","confidence":"none","next_stage":"start","next_command":"/hivefiver-start","reasoning":"No input provided. Starting guided onboarding."}\n'
  exit 0
fi

# --- Normalize input to lowercase ---

NORM=$(printf '%s' "$INPUT" | tr '[:upper:]' '[:lower:]')

# --- Keyword families with weights ---
# Each family maps to an intent. Matches are scored by weight.
# Higher weight = stronger signal. Final intent = highest total score.

score_build=0
score_fix=0
score_audit=0
score_extend=0
score_improve=0
score_learn=0

# --- BUILD family: creating new framework assets ---

for kw in "build" "create" "make" "new agent" "new skill" "new command" "new workflow" \
           "add an agent" "add a skill" "add a command" "write an agent" "generate" \
           "scaffold" "bootstrap" "set up" "design an agent" "implement"; do
  if [[ "$NORM" == *"$kw"* ]]; then
    score_build=$((score_build + 3))
  fi
done

# Asset-type mentions boost build intent
for asset in "agent" "skill" "command" "workflow" "template" "reference"; do
  if [[ "$NORM" == *"$asset"* ]]; then
    score_build=$((score_build + 1))
  fi
done

# Strong build signals (full phrases)
for phrase in "build me" "create a" "i need a new" "i want to build" "set up a" \
              "design a new" "make me" "write a new"; do
  if [[ "$NORM" == *"$phrase"* ]]; then
    score_build=$((score_build + 5))
  fi
done

# --- FIX family: repairing broken framework ---

for kw in "fix" "broken" "repair" "doesn't work" "not working" "failing" \
           "error" "bug" "crash" "dead" "zombie" "orphan" "dangling" \
           "missing" "wrong" "incorrect" "broke" "corrupted"; do
  if [[ "$NORM" == *"$kw"* ]]; then
    score_fix=$((score_fix + 3))
  fi
done

for phrase in "it's broken" "doesn't work" "stopped working" "is broken" \
              "fix my" "repair my" "something is wrong" "not functioning"; do
  if [[ "$NORM" == *"$phrase"* ]]; then
    score_fix=$((score_fix + 5))
  fi
done

# --- AUDIT family: health checking ---

for kw in "audit" "check" "health" "scan" "inspect" "review" "analyze" \
           "status" "report" "diagnose" "assessment" "evaluate" "quality"; do
  if [[ "$NORM" == *"$kw"* ]]; then
    score_audit=$((score_audit + 3))
  fi
done

for phrase in "audit my" "check my" "health check" "framework health" \
              "run audit" "what's the status" "how healthy" "scan the" \
              "review my" "assess the"; do
  if [[ "$NORM" == *"$phrase"* ]]; then
    score_audit=$((score_audit + 5))
  fi
done

# --- EXTEND family: adding new capabilities ---

for kw in "extend" "capability" "enhance" "upgrade" "evolve" "add to" \
           "integrate" "connect" "wire" "hook into" "plug in"; do
  if [[ "$NORM" == *"$kw"* ]]; then
    score_extend=$((score_extend + 3))
  fi
done

for phrase in "add a capability" "new capability" "extend the" "add support for" \
              "integrate with" "hook into" "plug in a"; do
  if [[ "$NORM" == *"$phrase"* ]]; then
    score_extend=$((score_extend + 5))
  fi
done

# --- IMPROVE family: refactoring / cleanup ---

for kw in "improve" "refactor" "cleanup" "clean up" "optimize" "simplify" \
           "reorganize" "restructure" "tidy" "streamline" "polish" "reduce"; do
  if [[ "$NORM" == *"$kw"* ]]; then
    score_improve=$((score_improve + 3))
  fi
done

for phrase in "clean up my" "refactor the" "improve my" "optimize the" \
              "simplify the" "tidy up" "reorganize my" "reduce complexity"; do
  if [[ "$NORM" == *"$phrase"* ]]; then
    score_improve=$((score_improve + 5))
  fi
done

# --- LEARN family: help / onboarding ---

for kw in "help" "how" "what" "explain" "tutorial" "guide" "learn" \
           "documentation" "show me" "teach" "understand" "usage" "example"; do
  if [[ "$NORM" == *"$kw"* ]]; then
    score_learn=$((score_learn + 3))
  fi
done

for phrase in "how do i" "what can you" "show me how" "help me understand" \
              "teach me" "what does" "how to use" "explain how" "guide me" \
              "what is hivefiver" "what can hivefiver"; do
  if [[ "$NORM" == *"$phrase"* ]]; then
    score_learn=$((score_learn + 5))
  fi
done

# --- Find winner (bash 3.2 compatible — no associative arrays) ---

best_intent="unknown"
best_score=0

# Priority order for tie-breaking: build > fix > audit > extend > improve > learn
# Check each in order; first one with highest score wins ties.

if (( score_build > best_score )); then
  best_score=$score_build
  best_intent="build_new"
fi
if (( score_fix > best_score )); then
  best_score=$score_fix
  best_intent="fix_broken"
fi
if (( score_audit > best_score )); then
  best_score=$score_audit
  best_intent="audit_health"
fi
if (( score_extend > best_score )); then
  best_score=$score_extend
  best_intent="extend"
fi
if (( score_improve > best_score )); then
  best_score=$score_improve
  best_intent="improve"
fi
if (( score_learn > best_score )); then
  best_score=$score_learn
  best_intent="learn"
fi

# --- Map intent to stage + command ---

map_stage() {
  case "$1" in
    build_new)    echo "intake" ;;
    fix_broken)   echo "doctor" ;;
    audit_health) echo "audit" ;;
    extend)       echo "spec" ;;
    improve)      echo "audit" ;;
    learn)        echo "start" ;;
    *)            echo "start" ;;
  esac
}

map_command() {
  case "$1" in
    build_new)    echo "/hivefiver-intake" ;;
    fix_broken)   echo "/hivefiver-doctor" ;;
    audit_health) echo "/hivefiver-audit" ;;
    extend)       echo "/hivefiver-spec" ;;
    improve)      echo "/hivefiver-audit" ;;
    learn)        echo "/hivefiver-start" ;;
    *)            echo "/hivefiver-start" ;;
  esac
}

# --- Determine confidence ---

confidence="none"
if (( best_score >= 8 )); then
  confidence="high"
elif (( best_score >= 5 )); then
  confidence="medium"
elif (( best_score >= 3 )); then
  confidence="low"
fi

# If unknown (no matches), default to start with guided onboarding
if [[ "$best_intent" == "unknown" ]]; then
  confidence="none"
fi

# --- Build reasoning ---

reasoning=""
if [[ "$best_intent" == "unknown" ]]; then
  reasoning="No keywords matched any intent family. Recommending guided onboarding via /hivefiver-start."
else
  # Find second-best for reasoning
  second_best=""
  second_score=0

  for intent_name in build_new fix_broken audit_health extend improve learn; do
    case "$intent_name" in
      build_new)    s=$score_build ;;
      fix_broken)   s=$score_fix ;;
      audit_health) s=$score_audit ;;
      extend)       s=$score_extend ;;
      improve)      s=$score_improve ;;
      learn)        s=$score_learn ;;
    esac
    if [[ "$intent_name" != "$best_intent" ]] && (( s > second_score )); then
      second_score=$s
      second_best="$intent_name"
    fi
  done

  if (( second_score > 0 )); then
    reasoning="Classified as ${best_intent} (score: ${best_score}) over ${second_best} (score: ${second_score})."
  else
    reasoning="Classified as ${best_intent} (score: ${best_score}). No competing intents."
  fi
fi

# --- Output ---

next_stage="$(map_stage "$best_intent")"
next_command="$(map_command "$best_intent")"

case "$MODE" in
  json)
    printf '{"intent":"%s","confidence":"%s","score":%d,"next_stage":"%s","next_command":"%s","reasoning":"%s"}\n' \
      "$best_intent" "$confidence" "$best_score" "$next_stage" "$next_command" "$reasoning"
    ;;
  suggest)
    printf '\n'
    printf 'Intent Classification\n'
    printf '=====================\n'
    printf '  Intent:     %s\n' "$best_intent"
    printf '  Confidence: %s (score: %d)\n' "$confidence" "$best_score"
    printf '  Next stage: %s\n' "$next_stage"
    printf '  Command:    %s\n' "$next_command"
    printf '  Reasoning:  %s\n' "$reasoning"
    printf '\n'
    printf 'Scores: build=%d fix=%d audit=%d extend=%d improve=%d learn=%d\n' \
      "$score_build" "$score_fix" "$score_audit" "$score_extend" "$score_improve" "$score_learn"
    printf '\n'
    ;;
esac
