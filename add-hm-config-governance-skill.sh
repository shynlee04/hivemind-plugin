#!/bin/bash
# add-hm-config-governance-skill.sh
# Wires `skills: [hm-config-governance]` onto the 42 shipped agents that use
# Hivemind tools. Idempotent: re-running does NOT duplicate the entry.
#
# Behavior:
#   1. For each named agent in assets/agents/, check whether the file already
#      contains `hm-config-governance` (idempotency check). If yes, skip.
#   2. If the file has a `skills:` block in YAML frontmatter, append
#      `- hm-config-governance` as a new item at the end of that block.
#   3. If the file has NO `skills:` block, inject a new
#      `skills:\n  - hm-config-governance` block immediately after the
#      closing `---` of the frontmatter.
#
# YAML-aware: edits only happen between the two `---` frontmatter fences.
# macOS-compatible (no `mapfile`, no associative arrays).
# Run from repo root.

set -euo pipefail

AGENTS_DIR="assets/agents"
SKILL_NAME="hm-config-governance"

# 42 named agents that consume Hivemind tooling.
# 31 hm-* + 10 hf-* + 1 hm-l0-orchestrator
AGENT_NAMES=(
  # 31 hm-*
  hm-architect
  hm-code-fixer
  hm-code-reviewer
  hm-codebase-mapper
  hm-debugger
  hm-debug-session-manager
  hm-doc-verifier
  hm-doc-writer
  hm-ecologist
  hm-executor
  hm-integration-checker
  hm-intel-updater
  hm-intent-loop
  hm-nyquist-auditor
  hm-orchestrator
  hm-pattern-mapper
  hm-phase-researcher
  hm-plan-checker
  hm-planner
  hm-platform-references
  hm-project-researcher
  hm-roadmapper
  hm-security-auditor
  hm-shipper
  hm-specifier
  hm-synthesizer
  hm-ui-auditor
  hm-ui-checker
  hm-ui-researcher
  hm-user-profiler
  hm-verifier
  # 10 hf-*
  hf-agent-builder
  hf-auditor
  hf-command-builder
  hf-coordinator
  hf-meta-builder
  hf-prompter
  hf-refactorer
  hf-skill-builder
  hf-synthesizer
  hf-tool-builder
  # 1 hm-l0-orchestrator
  hm-l0-orchestrator
)

added=0
appended=0
injected=0
skipped_existing=0
missing=0

for name in "${AGENT_NAMES[@]}"; do
  agent_file="$AGENTS_DIR/$name.md"
  if [[ ! -f "$agent_file" ]]; then
    missing=$((missing + 1))
    echo "MISSING: $agent_file"
    continue
  fi

  # Idempotency check: if hm-config-governance is already in the file, skip.
  if grep -q "$SKILL_NAME" "$agent_file"; then
    skipped_existing=$((skipped_existing + 1))
    continue
  fi

  # Check whether the file has a YAML frontmatter `skills:` block.
  if awk '
    /^---$/ { fence++; next }
    fence == 1 && /^skills:[[:space:]]*$/ { in_skills=1; next }
    fence == 1 && in_skills && /^[[:space:]]+- / { found=1; exit }
    fence == 1 && in_skills && !/^[[:space:]]+- / && /^[^[:space:]]/ { in_skills=0 }
    END { exit !found }
  ' "$agent_file"; then
    # Has skills: block — append `- hm-config-governance` to the end of that list.
    awk -v skill="$SKILL_NAME" '
      /^---$/ { fence++ }
      fence == 1 && in_skills {
        if ($0 ~ /^[[:space:]]+- /) {
          print
          if (!appended) {
            last_skill_line = NR
          }
          prev_was_skill = 1
          next
        }
        if (prev_was_skill) {
          indent = "  "
          print indent "- " skill
          appended = 1
        }
        in_skills = 0
        prev_was_skill = 0
        print
        next
      }
      /^skills:[[:space:]]*$/ && fence == 1 {
        in_skills = 1
        print
        next
      }
      { print }
      END {
        if (in_skills && !appended) {
          print "  - " skill
        }
      }
    ' "$agent_file" > "$agent_file.tmp" && mv "$agent_file.tmp" "$agent_file"
    appended=$((appended + 1))
  else
    # No skills: block — inject BEFORE the closing --- of frontmatter.
    awk -v skill="$SKILL_NAME" '
      /^---$/ && !injected && fence == 1 {
        print "skills:"
        print "  - " skill
        injected = 1
        fence = 2
        print
        next
      }
      /^---$/ { fence++ }
      { print }
    ' "$agent_file" > "$agent_file.tmp" && mv "$agent_file.tmp" "$agent_file"
    injected=$((injected + 1))
  fi
done

total_wired=$(grep -l "$SKILL_NAME" "$AGENTS_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')

echo "==="
echo "Appended to existing skills:  $appended"
echo "Injected new skills: block:   $injected"
echo "Skipped (already present):    $skipped_existing"
echo "Missing files:                $missing"
echo "Total agents with $SKILL_NAME: $total_wired"
