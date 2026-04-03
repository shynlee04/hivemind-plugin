#!/usr/bin/env bash
set -euo pipefail

# preflight.sh — Intent classification gate for meta-builder.
# Returns key=value pairs for the orchestration layer.
# Exit 0 = routing clear. Exit 1 = blocked (empty request, skill not found, not my domain).
#
# BUG FIXES:
#   (a) Multi-intent: checks compound patterns BEFORE single-intent regex
#   (b) Default questions_allowed: set to 3 for GROUP_1 vague paths (was 2)
#   (c) Not-my-domain: rejects requests with no meta-creation intent

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly REQUEST="${1:-}"

fail() { echo "PREFLIGHT_FAIL: $1" >&2; exit 1; }

if [[ -z "$REQUEST" ]]; then
  echo "PREFLIGHT_FAIL: Empty request" >&2
  exit 1
fi

req_lower=$(echo "$REQUEST" | tr '[:upper:]' '[:lower:]')

# --- GATE 0: Not-my-domain rejection (Bug Fix C) ---
# If the request has NO skill/agent/command/tool/config/permission/rule/plugin/MCP/LSP
# creation intent AND no process/coordinating intent, reject it.
not_my_domain=true
if echo "$req_lower" | grep -qE "(create|build|write|design|set.up|add|configure|make|generate|scaffold|author|turn|convert|transform|implement).*(skill|agent|command|tool|plugin|rule|permission|config|mcp|lsp|workflow|subagent|prompt|instruction)"; then
  not_my_domain=false
fi
if echo "$req_lower" | grep -qE "(skill creation|skill authoring|skill building|skill design|agent creation|command creation|tool creation|plugin creation)"; then
  not_my_domain=false
fi
if echo "$req_lower" | grep -qE "(figure.out|explore|brainstorm|coordinate|dispatch|plan|organize|help.me.think|help.me.figure|run.these)"; then
  not_my_domain=false
fi
if echo "$req_lower" | grep -qE "(create.a.skill.like|stack.skills|combine.skills|audit.this.skill|improve.this.skill|fix.triggers|optimize.triggers)"; then
  not_my_domain=false
fi

if $not_my_domain; then
  echo "PREFLIGHT_FAIL: Request does not match any meta-builder routing domain (no skill/agent/command/tool/config/permission creation intent detected)" >&2
  echo "Hint: meta-builder handles skill creation, agent configuration, command authoring, tool building, and similar OpenCode platform configuration tasks." >&2
  exit 1
fi

# --- GROUP scoring ---
# GROUP 1 (process/methodology)
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

# GROUP 2 (creation/authoring)
g2_score=0
for verb in "create" "build" "write" "design" "set up" "add" "configure" "make" "generate"; do
  if echo "$req_lower" | grep -qiF "$verb" 2>/dev/null; then
    g2_score=$((g2_score + 3))
  fi
done
for noun in "skill" "agent" "command" "tool" "workflow" "mcp" "lsp" "rule" "permission" "plugin" "subagent"; do
  if echo "$req_lower" | grep -qiF "$noun" 2>/dev/null; then
    g2_score=$((g2_score + 2))
  fi
done
for mod in "new" "from scratch" "first time" "template" "like this" "from this"; do
  if echo "$req_lower" | grep -qiF "$mod" 2>/dev/null; then
    g2_score=$((g2_score + 1))
  fi
done

# --- MULTI-INTENT DETECTION (Bug Fix A) ---
# Check compound intent BEFORE routing to single-intent patterns
multi_intent=false
multi_intent_hint=""
if echo "$req_lower" | grep -qE "(create.*and.*(dispatch|coordinate|plan|run))"; then
  multi_intent=true
  multi_intent_hint="use-authoring-skills,coordinating-loop"
fi
if echo "$req_lower" | grep -qE "(plan.*and.*(build|create|implement|write))"; then
  multi_intent=true
  multi_intent_hint="planning-with-files,use-authoring-skills"
fi

# --- Route selection ---
diff=$(( g2_score - g1_score ))
if (( diff < 0 )); then diff=$(( -diff )); fi

primary_skill=""
group=""
stack=""
questions_allowed=3  # CORRECTED: was 2, now 3 (Bug Fix B)

if $multi_intent && [[ -n "$multi_intent_hint" ]]; then
  primary_skill="use-authoring-skills"
  stack="$multi_intent_hint"
  group="GROUP_2"
  questions_allowed=0
elif (( g2_score > g1_score )) && (( diff >= 3 )); then
  group="GROUP_2"
  questions_allowed=0
  if echo "$req_lower" | grep -qiE "(create|build|write).*(skill|like this)"; then
    primary_skill="use-authoring-skills"
    stack="skill-creator"
  elif echo "$req_lower" | grep -qiE "(create|build|write).*skill"; then
    primary_skill="use-authoring-skills"
  elif echo "$req_lower" | grep -qiE "(audit|improve|fix).*skill"; then
    primary_skill="use-authoring-skills"
  elif echo "$req_lower" | grep -qiE "(create|build|configure).*agent"; then
    primary_skill="use-authoring-agents"
  elif echo "$req_lower" | grep -qiE "(create|build|configure).*command"; then
    primary_skill="use-authoring-commands"
  elif echo "$req_lower" | grep -qiE "(create|build|configure).*permission"; then
    primary_skill="use-authoring-permissions"
  elif echo "$req_lower" | grep -qiE "(build|create|add).*tool"; then
    primary_skill="use-authoring-tools"
  elif echo "$req_lower" | grep -qiE "(create|build).*plugin"; then
    primary_skill="use-authoring-plugins"
  elif echo "$req_lower" | grep -qiE "(create|write).*rule|agents\.md"; then
    primary_skill="use-authoring-rules"
  elif echo "$req_lower" | grep -qiE "(add|configure).*mcp"; then
    primary_skill="use-authoring-mcp"
  elif echo "$req_lower" | grep -qiE "(add|configure).*lsp|language server"; then
    primary_skill="use-authoring-lsp"
  elif echo "$req_lower" | grep -qiE "(configure|opencode\.json|opencode config)"; then
    primary_skill="use-authoring-configs"
  elif echo "$req_lower" | grep -qiE "(stack|combine).*skill"; then
    primary_skill="meta-builder"
  elif echo "$req_lower" | grep -qiE "(typescript.*module|module.*authoring|cqrs|no circular)"; then
    primary_skill="typescript-module-architect"
  elif echo "$req_lower" | grep -qiE "(migrat|transition|hivemind.v3|v3.*migration)"; then
    primary_skill="migration-workflow"
  else
    primary_skill="use-authoring-skills"
    questions_allowed=3
  fi
elif (( g1_score > g2_score )) && (( diff >= 3 )); then
  group="GROUP_1"
  questions_allowed=3  # CORRECTED: was default 2, now 3
  if echo "$req_lower" | grep -qiE "(figure out|help me|what should|unclear)"; then
    primary_skill="user-intent-interactive-loop"
    questions_allowed=3
  elif echo "$req_lower" | grep -qiE "(coordinate|dispatch|parallel)"; then
    primary_skill="coordinating-loop"
    stack="dispatching-parallel-agents"
    questions_allowed=0
  elif echo "$req_lower" | grep -qiE "(plan|break down|multi.step)"; then
    primary_skill="planning-with-files"
    questions_allowed=0
  elif echo "$req_lower" | grep -qiE "(migrat|transition|hivemind.v3)"; then
    primary_skill="migration-workflow"
    questions_allowed=0
  else
    primary_skill="user-intent-interactive-loop"
    questions_allowed=3
  fi
else
  # Tie or both zero — check for file reference pattern
  if echo "$req_lower" | grep -qE "@.*\.(md|ts|js|json|txt|yaml|yml)" 2>/dev/null; then
    group="GROUP_2"
    primary_skill="use-authoring-skills"
    stack="skill-creator"
    questions_allowed=0
  else
    group="GROUP_1"
    primary_skill="user-intent-interactive-loop"
    questions_allowed=3
  fi
fi

# --- Gate 4: Validate primary skill exists ---
# Skills root comes from env or caller — NO hardcoded platform guesses.
SKILLS_ROOT="${SKILLS_ROOT:-$PWD}"
skill_found=false
if [[ -f "$SKILLS_ROOT/$primary_skill/SKILL.md" ]]; then
  skill_found=true
fi
[[ "$primary_skill" == "meta-builder" ]] && skill_found=true
[[ "$skill_found" == false ]] && fail "Primary skill '$primary_skill' not found at $SKILLS_ROOT/$primary_skill/SKILL.md. Set SKILLS_ROOT to your skills directory."

# --- Gate 5: Stack skills validation (if any) ---
if [[ -n "$stack" ]]; then
  IFS=',' read -ra STACK_ARRAY <<< "$stack"
  resolved_stack=""
  for skill in "${STACK_ARRAY[@]}"; do
    stack_found=false
    if [[ -f "$SKILLS_ROOT/$skill/SKILL.md" ]]; then
      stack_found=true
    fi
    # Skip if stack skill is same as primary (avoid redundancy)
    if [[ "$skill" == "$primary_skill" ]]; then
      continue
    fi
    if $stack_found; then
      resolved_stack="${resolved_stack}${skill},"
    else
      echo "PREFLIGHT_WARN: Stack skill '$skill' not found at $SKILLS_ROOT/$skill/SKILL.md — skipping" >&2
    fi
  done
  stack="${resolved_stack%,}"
fi

# --- Output ---
intent="User wants to $(echo "$REQUEST" | head -c 120)"
echo "INTENT=$intent"
echo "GROUP=$group"
echo "PRIMARY_SKILL=$primary_skill"
echo "STACK_SKILLS=$stack"
echo "QUESTIONS_ALLOWED=${questions_allowed}"
echo "G1_SCORE=${g1_score}"
echo "G2_SCORE=${g2_score}"
echo "PREFLIGHT_PASSED=true"
