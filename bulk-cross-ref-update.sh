#!/bin/bash
# bulk-cross-ref-update.sh
# Updates all stale references to archived skill names in shipped assets.
# Run from .worktree/ root.
set -euo pipefail

# Map of archived name → replacement
declare -A RENAME_MAP=(
  # hm-l2-* → specialists (BATCH 1+2)
  ["hm-l2-brainstorm"]="hm-spec-authoring"
  ["hm-l2-debug"]="hm-debug-systematic"
  ["hm-l2-refactor"]="hm-arch-refactor"
  ["hm-l2-test-driven-execution"]="hm-test-driven"
  ["hm-l2-production-readiness"]="hm-ship-readiness"
  ["hm-l2-product-validation"]="hm-product-validation"
  ["hm-l2-governance-config"]="hivemind-power-on"
  ["hm-l2-phase-execution"]="hm-coord-loop"
  ["hm-l2-planning-persistence"]="__REMOVE__"
  ["hm-l2-requirements-analysis"]="hm-spec-authoring"
  ["hm-l2-roadmap-maintainability"]="hm-product-validation"
  ["hm-l2-feature-ecosystem"]="hm-product-validation"
  ["hm-l2-user-intent-interactive-loop"]="hm-coord-router"
  ["hm-l2-skill-router"]="hm-coord-router"
  ["hm-l2-lineage-router"]="hm-coord-router"
  ["hm-l2-gate-orchestrator"]="hm-gate-triad"
  ["hm-l2-coordinating-loop"]="hm-coord-loop"
  ["hm-l2-completion-looping"]="hm-loop-completion"
  ["hm-l2-phase-loop"]="hm-loop-phase"
  ["hm-l2-cross-cutting-change"]="hm-cross-change"
  ["hm-l2-spec-driven-authoring"]="hm-spec-authoring"
  # gate-* → hm-gate-triad
  ["gate-evidence-truth"]="hm-gate-triad"
  ["gate-lifecycle-integration"]="hm-gate-triad"
  ["gate-spec-compliance"]="hm-gate-triad"
  # stack-* → hm-stack-authoring
  ["stack-bun-pty"]="hm-stack-authoring"
  ["stack-json-render"]="hm-stack-authoring"
  ["stack-nextjs"]="hm-stack-authoring"
  ["stack-opencode"]="hm-stack-authoring"
  ["stack-vitest"]="hm-stack-authoring"
  ["stack-zod"]="hm-stack-authoring"
  # hm-l3-* → hm-platform-references (router)
  ["hm-l3-deep-research"]="hm-platform-references"
  ["hm-l3-detective"]="hm-platform-references"
  ["hm-l3-hivemind-engine-contracts"]="hm-platform-references"
  ["hm-l3-hivemind-state-reference"]="hm-platform-references"
  ["hm-l3-integration-contracts"]="hm-platform-references"
  ["hm-l3-omo-reference"]="hm-platform-references"
  ["hm-l3-opencode-non-interactive-shell"]="hm-platform-references"
  ["hm-l3-opencode-platform-reference"]="hm-platform-references"
  ["hm-l3-opencode-project-audit"]="hm-platform-references"
  ["hm-l3-research-chain"]="hm-platform-references"
  ["hm-l3-subagent-delegation-patterns"]="hm-platform-references"
  ["hm-l3-synthesis"]="hm-platform-references"
  ["hm-l3-tech-context-compliance"]="hm-platform-references"
  ["hm-l3-tech-stack-ingest"]="hm-platform-references"
  ["hm-l3-tool-capability-matrix"]="hm-platform-references"
  # hf-skill-router → hm-coord-router
  ["hf-skill-router"]="hm-coord-router"
)

# Apply rename to all shipped 7 surfaces
SURFACES=("assets/agents" "assets/commands" "assets/workflows" "assets/references" "assets/templates" "assets/agent-instructions")

for old_name in "${!RENAME_MAP[@]}"; do
  new_name="${RENAME_MAP[$old_name]}"
  if [[ "$new_name" == "__REMOVE__" ]]; then
    # Remove the line that mentions this skill (comment it out with a TODO)
    for surface in "${SURFACES[@]}"; do
      if [[ -d "$surface" ]]; then
        find "$surface" -type f \( -name "*.md" -o -name "*.json" -o -name "*.yaml" \) -exec sed -i '' "s|$old_name|TODO-REMOVE: $old_name|g" {} +
      fi
    done
  else
    for surface in "${SURFACES[@]}"; do
      if [[ -d "$surface" ]]; then
        find "$surface" -type f \( -name "*.md" -o -name "*.json" -o -name "*.yaml" \) -exec sed -i '' "s|$old_name|$new_name|g" {} +
      fi
    done
  fi
done

echo "Cross-ref updates complete"
