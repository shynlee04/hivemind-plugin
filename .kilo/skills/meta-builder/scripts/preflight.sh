#!/usr/bin/env bash
set -euo pipefail

# preflight.sh — Mandatory gate before meta-builder proceeds
# Usage: bash preflight.sh "<user-request>"
# Exit 0 = gates passed, intent extracted, route determined
# Exit 1 = blocked — must fix before proceeding
#
# Output format (stdout, parseable):
#   INTENT=<one-sentence intent>
#   GROUP=<GROUP_1|GROUP_2|GROUP_3>
#   PRIMARY_SKILL=<skill-name>
#   STACK_SKILLS=<comma-separated or empty>
#   QUESTIONS_ALLOWED=<0-3>

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly SCRIPT_NAME="$(basename "$0")"
if [[ $# -lt 1 ]]; then
  echo "PREFLIGHT_FAIL: No request provided. Usage: $SCRIPT_NAME \"<user request text>\"" >&2
  exit 1
fi
readonly USER_REQUEST="$1"

fail() { echo "PREFLIGHT_FAIL: $1" >&2; exit 1; }

# --- Gate 1: User request is non-empty ---
[[ -z "${USER_REQUEST// /}" ]] && fail "Empty request — cannot route"

# --- Gate 2: Deterministic intent classification ---
# Scoring uses the same formula as SKILL.md Routing Decision Formula
# GROUP 1 (process/methodology) vs GROUP 2 (creation/authoring)

req_lower=$(echo "$USER_REQUEST" | tr '[:upper:]' '[:lower:]')

# GROUP 1 scoring
g1_score=0
for verb in "figure out" "explore" "brainstorm" "coordinate" "dispatch" "plan" "organize" "help me" "how do" "what should"; do
  if echo "$req_lower" | grep -qiF "$verb" 2>/dev/null; then
    g1_score=$((g1_score + 3))
  fi
done
for noun in "parallel" "batch" "handoff" "orchestrate" "multiple" "agents" "workflow"; do
  if echo "$req_lower" | grep -qiF "$noun" 2>/dev/null; then
    g1_score=$((g1_score + 2))
  fi
done
for mod in "complex" "multi-step" "long-running" "iterative"; do
  if echo "$req_lower" | grep -qiF "$mod" 2>/dev/null; then
    g1_score=$((g1_score + 1))
  fi
done

# GROUP 2 scoring
g2_score=0
for verb in "create" "build" "write" "design" "set up" "add" "configure" "make" "generate"; do
  if echo "$req_lower" | grep -qiF "$verb" 2>/dev/null; then
    g2_score=$((g2_score + 3))
  fi
done
for noun in "skill" "agent" "command" "tool" "workflow" "mcp" "lsp" "rule"; do
  if echo "$req_lower" | grep -qiF "$noun" 2>/dev/null; then
    g2_score=$((g2_score + 2))
  fi
done
for mod in "new" "from scratch" "first time" "template"; do
  if echo "$req_lower" | grep -qiF "$mod" 2>/dev/null; then
    g2_score=$((g2_score + 1))
  fi
done

# --- Gate 3: Route selection ---
primary_skill=""
group=""
stack=""
questions_allowed=2

if [[ $g2_score -gt $g1_score ]]; then
  group="GROUP_2"
  # Pattern match within GROUP 2
  if echo "$req_lower" | grep -qiE "(create|build|write).*(skill|like this)"; then
    primary_skill="use-authoring-skills"
    stack="skill-creator"
  elif echo "$req_lower" | grep -qiE "(create|build|write).*skill"; then
    primary_skill="use-authoring-skills"
  elif echo "$req_lower" | grep -qiE "(audit|improve|fix).*skill"; then
    primary_skill="use-authoring-skills"
  elif echo "$req_lower" | grep -qiE "(create|build|configure).*agent"; then
    primary_skill="opencode-platform-reference"
  elif echo "$req_lower" | grep -qiE "(set up|add|create).*command"; then
    primary_skill="opencode-platform-reference"
  elif echo "$req_lower" | grep -qiE "(build|create|add).*tool"; then
    primary_skill="opencode-tool-architect"
  elif echo "$req_lower" | grep -qiE "(configure|opencode\.json|opencode config)"; then
    primary_skill="opencode-platform-reference"
  elif echo "$req_lower" | grep -qiE "(mcp|lsp|language server)"; then
    primary_skill="opencode-platform-reference"
  elif echo "$req_lower" | grep -qiE "(rule|agents\.md|governance)"; then
    primary_skill="opencode-platform-reference"
  elif echo "$req_lower" | grep -qiE "(stack|combine).*skill"; then
    primary_skill="meta-builder"
  else
    # Default GROUP 2: creation intent but unclear entity
    primary_skill="use-authoring-skills"
    questions_allowed=3
  fi
elif [[ $g1_score -gt $g2_score ]]; then
  group="GROUP_1"
  if echo "$req_lower" | grep -qiE "(figure out|help me|what should|unclear)"; then
    primary_skill="user-intent-interactive-loop"
  elif echo "$req_lower" | grep -qiE "(coordinate|dispatch|parallel)"; then
    primary_skill="coordinating-loop"
    stack="dispatching-parallel-agents"
  elif echo "$req_lower" | grep -qiE "(plan|break down|multi.step)"; then
    primary_skill="planning-with-files"
  else
    primary_skill="user-intent-interactive-loop"
    questions_allowed=3
  fi
else
  # Tie or both zero — check for file reference pattern
  if echo "$req_lower" | grep -qE "@.*\.(md|ts|js|json|txt|yaml|yml)" 2>/dev/null; then
    # File reference present — likely creation from template
    group="GROUP_2"
    primary_skill="use-authoring-skills"
    stack="skill-creator"
  else
    group="GROUP_1"
    primary_skill="user-intent-interactive-loop"
    questions_allowed=3
  fi
fi

# --- Gate 4: Validate primary skill exists ---
skill_found=false
for search_dir in \
  "$SCRIPT_DIR/../.." \
  "$HOME/.config/opencode/skills" \
  "$HOME/.agents/skills" \
  "$HOME/.claude/skills"; do
  if [[ -f "$search_dir/$primary_skill/SKILL.md" ]]; then
    skill_found=true
    break
  fi
done

# meta-builder is self-referential — always valid
[[ "$primary_skill" == "meta-builder" ]] && skill_found=true

[[ "$skill_found" == false ]] && fail "Primary skill '$primary_skill' not found on disk"

# --- Gate 5: Stack skills validation (if any) ---
if [[ -n "$stack" ]]; then
  stack_found=false
  for search_dir in \
    "$SCRIPT_DIR/../.." \
    "$HOME/.config/opencode/skills" \
    "$HOME/.agents/skills" \
    "$HOME/.claude/skills"; do
    if [[ -f "$search_dir/$stack/SKILL.md" ]]; then
      stack_found=true
      break
    fi
  done
  [[ "$stack_found" == false ]] && fail "Stack skill '$stack' not found on disk"
fi

# --- Output ---
intent="User wants to $(echo "$USER_REQUEST" | head -c 120)"
echo "INTENT=$intent"
echo "GROUP=$group"
echo "PRIMARY_SKILL=$primary_skill"
echo "STACK_SKILLS=$stack"
echo "QUESTIONS_ALLOWED=$questions_allowed"
echo "G1_SCORE=$g1_score"
echo "G2_SCORE=$g2_score"
echo "PREFLIGHT_PASSED=true"
