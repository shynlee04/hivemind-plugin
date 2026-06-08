#!/bin/bash
# add-tools-to-agents.sh
# Adds Hivemind custom tools to agent frontmatter based on agent role.
# Idempotent: skips agents that already have a tools: field.
# macOS-compatible (no bash associative arrays).

AGENTS_DIR="assets/agents"

# Function: get tools for an agent name
get_tools() {
  case "$1" in
    hm-orchestrator) echo "delegate-task,delegation-status,hivemind-trajectory,hivemind-steer,hivemind-agent-work" ;;
    hm-coordinator) echo "delegate-task,delegation-status,hivemind-trajectory" ;;
    hm-l0-orchestrator) echo "delegate-task,delegation-status,hivemind-trajectory,hivemind-steer,hivemind-pressure,semantic-agent-selector" ;;
    hm-executor) echo "delegate-task,hivemind-doc,run-background-command" ;;
    hm-debugger) echo "hivemind-doc,hivemind-trajectory" ;;
    hm-debug-session-manager) echo "delegate-task,hivemind-doc,hivemind-trajectory" ;;
    hm-architect) echo "hivemind-doc,delegate-task" ;;
    hm-specifier) echo "hivemind-doc,hivemind-agent-work" ;;
    hm-planner) echo "hivemind-doc,hivemind-agent-work" ;;
    hm-plan-checker) echo "hivemind-doc,delegate-task" ;;
    hm-codebase-mapper) echo "hivemind-doc,delegate-task" ;;
    hm-intel-updater) echo "hivemind-doc" ;;
    hm-pattern-mapper) echo "hivemind-doc" ;;
    hm-phase-researcher) echo "hivemind-doc,delegate-task" ;;
    hm-project-researcher) echo "hivemind-doc,delegate-task" ;;
    hm-research-synthesizer) echo "hivemind-doc" ;;
    hm-roadmapper) echo "hivemind-doc,hivemind-agent-work" ;;
    hm-doc-writer) echo "hivemind-doc" ;;
    hm-doc-verifier) echo "hivemind-doc" ;;
    hm-code-reviewer) echo "hivemind-doc,delegate-task" ;;
    hm-code-fixer) echo "hivemind-doc,run-background-command" ;;
    hm-ui-researcher) echo "hivemind-doc" ;;
    hm-ui-auditor) echo "hivemind-doc" ;;
    hm-ui-checker) echo "hivemind-doc" ;;
    hm-integration-checker) echo "hivemind-doc,delegate-task" ;;
    hm-ecologist) echo "hivemind-doc,delegate-task" ;;
    hm-nyquist-auditor) echo "hivemind-doc" ;;
    hm-product-validator) echo "hivemind-doc,delegate-task" ;;
    hm-intent-loop) echo "hivemind-doc,delegate-task" ;;
    hm-debug-systematic) echo "hivemind-doc,hivemind-trajectory" ;;
    hm-shipper) echo "delegate-task,validate-restart" ;;
    hf-meta-builder) echo "configure-primitive,delegate-task,hivemind-doc" ;;
    hf-coordinator) echo "delegate-task,delegation-status" ;;
    hf-l0-orchestrator) echo "delegate-task,delegation-status,configure-primitive,hivemind-steer" ;;
    hf-agent-builder) echo "configure-primitive,delegate-task" ;;
    hf-skill-builder) echo "configure-primitive,delegate-task,hivemind-doc" ;;
    hf-command-builder) echo "configure-primitive,delegate-task" ;;
    hf-tool-builder) echo "configure-primitive,delegate-task" ;;
    hf-auditor) echo "hivemind-doc,delegate-task" ;;
    hf-refactorer) echo "hivemind-doc,delegate-task" ;;
    hf-prompter) echo "hivemind-doc" ;;
    hf-synthesizer) echo "hivemind-doc,delegate-task" ;;
    *) echo "" ;;
  esac
}

added=0
skipped=0
not_in_map=0
for agent_file in "$AGENTS_DIR"/*.md; do
  name=$(basename "$agent_file" .md)
  tools=$(get_tools "$name")
  if [[ -z "$tools" ]]; then
    not_in_map=$((not_in_map + 1))
    continue
  fi
  # Check if tools: field already exists
  if grep -qE "^tools:|^permission:" "$agent_file"; then
    skipped=$((skipped + 1))
    continue
  fi
  # Inject tools: field after the closing --- of frontmatter
  awk -v tools="$tools" '
    /^---$/ && !done && second==1 {
      print "tools:"
      n = split(tools, arr, ",")
      for (i = 1; i <= n; i++) {
        print "  - " arr[i]
      }
      done = 1
    }
    /^---$/ { second++ }
    { print }
  ' "$agent_file" > /tmp/agent.tmp && mv /tmp/agent.tmp "$agent_file"
  added=$((added + 1))
done

echo "Added: $added | Skipped (existing): $skipped | Not in map: $not_in_map"
