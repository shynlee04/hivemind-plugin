#!/usr/bin/env bash
#
# classify-intent.sh - Deterministic keyword-based intent classification
#
# Input: text from stdin or arguments
# Output: single token to stdout: hivefiver | hiveminder | unresolved
#
# Classification logic (deterministic):
#   - Count framework keywords (hivefiver) vs product keywords (hiveminder)
#   - Higher score wins; tie or zero = unresolved
#   - Keyword lists are ordered; first match has priority in tie
#
# Framework keywords: framework, meta builder, orchestrator, agent, skill, command,
#                    plugin, tool, governance, lineage, entry protocol, delegation
# Product keywords:   feature, bug, fix, ui, frontend, backend, api, database,
#                    app, product, implementation, user story, acceptance criteria

set -u

input="$*"
if [ -z "$input" ]; then
  input="$(cat)"
fi

normalized="$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' ' ')"

score_hivefiver=0
score_hiveminder=0

framework_keywords=(
  "framework"
  "meta builder"
  "meta-builder"
  "orchestrator"
  "agent"
  "skill"
  "command"
  "plugin"
  "tool"
  "governance"
  "lineage"
  "entry protocol"
  "delegation"
)

product_keywords=(
  "feature"
  "bug"
  "fix"
  "ui"
  "frontend"
  "backend"
  "api"
  "database"
  "app"
  "product"
  "implementation"
  "user story"
  "acceptance criteria"
)

for keyword in "${framework_keywords[@]}"; do
  if printf '%s' "$normalized" | grep -Fq -- "$keyword"; then
    score_hivefiver=$((score_hivefiver + 1))
  fi
done

for keyword in "${product_keywords[@]}"; do
  if printf '%s' "$normalized" | grep -Fq -- "$keyword"; then
    score_hiveminder=$((score_hiveminder + 1))
  fi
done

if [ "$score_hivefiver" -gt "$score_hiveminder" ] && [ "$score_hivefiver" -gt 0 ]; then
  printf '%s\n' "hivefiver"
elif [ "$score_hiveminder" -gt "$score_hivefiver" ] && [ "$score_hiveminder" -gt 0 ]; then
  printf '%s\n' "hiveminder"
else
  printf '%s\n' "unresolved"
fi

