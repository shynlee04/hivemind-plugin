#!/bin/bash
# add-tooling-to-hf-skills.sh
# Adds a "## Hivemind Tooling Alignment" section to each hf-* skill.

# Common Hivemind tools for hf-* skills (meta-builders)
COMMON_TOOLS="configure-primitive,delegate-task,hivemind-doc"

added=0
skipped=0
for skill_dir in assets/skills/hf-*; do
  name=$(basename "$skill_dir")
  skill_md="$skill_dir/SKILL.md"
  [[ -f "$skill_md" ]] || continue

  # Skip if already has Hivemind Tooling Alignment section
  if grep -qE "^## Hivemind Tooling Alignment" "$skill_md"; then
    skipped=$((skipped + 1))
    continue
  fi

  cat >> "$skill_md" <<EOF

## Hivemind Tooling Alignment

This skill teaches the loading agent how to use Hivemind's custom toolings. The agent that loads this skill should declare the following tools in its frontmatter:

\`\`\`yaml
tools:
  - $COMMON_TOOLS
\`\`\`

### Migration from GSD

If the loading agent has legacy \`gsd-*\` SDK references, replace with Hivemind equivalents:

| GSD tool | Hivemind equivalent |
|---|---|
| \`gsd-tools\` CLI | \`configure-primitive\` + \`delegate-task\` |
| \`gsd-state\` JSON manipulation | \`hivemind-doc\` (read/chunk/search) |
| \`gsd-context-monitor\` | \`hivemind-trajectory\` (record events) |
| \`gsd-prompt-guard\` | \`prompt-analyze\` (or manual review) |

### Cross-References

This skill aligns with the new tech-agnostic primitive ecosystem:
- Routing: \`hm-coord-router\` (intent classification + agent pairing)
- Coordination: \`hm-coord-loop\` (multi-agent dispatch)
- Specialist example: \`hm-test-driven\`, \`hm-debug-systematic\`, \`hm-arch-refactor\`
- Governance: \`hivemind-power-on\` (load first)
- Quality gates: \`hm-gate-triad\` (3-gate sequence)

When this skill is loaded, the agent should also load these as needed for end-to-end workflows.
EOF
  added=$((added + 1))
done

echo "Added: $added | Skipped (existing): $skipped"
