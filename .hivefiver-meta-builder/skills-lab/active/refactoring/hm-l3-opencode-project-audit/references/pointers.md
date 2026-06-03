# Harness-Audit Skill References

This file points to existing skills that provide execution context for audit phases.

## Skill Pointers

| Phase | Skill | Location | Purpose |
|-------|-------|----------|---------|
| 1 (Skills) | `use-authoring-skills` | `.opencode/skills/use-authoring-skills/SKILL.md` | Validate skill structure, triggers, frontmatter |
| 2 (Commands) | `command-dev` | `.opencode/skills/command-dev/SKILL.md` | Verify command integrity, $ARGUMENTS |
| 3 (Tools) | `custom-tools-dev` | `.opencode/skills/custom-tools-dev/SKILL.md` | Verify custom tool Zod schemas |
| 4 (Permissions) | `opencode-platform-reference` | `.opencode/skills/opencode-platform-reference/SKILL.md` | Built-in tools, permission cascading |
| 5 (Agents) | `agents-and-subagents-dev` | `.opencode/skills/agents-and-subagents-dev/SKILL.md` | Agent definitions, delegation chains |
| 6 (Subagents) | `agents-and-subagents-dev` | `.opencode/skills/agents-and-subagents-dev/SKILL.md` | Subagent spawn patterns |
| 7 (Synthesis) | `coordinating-loop` | `.opencode/skills/coordinating-loop/SKILL.md` | Parallel dispatch, result aggregation |

## Loading Instructions

For each phase, subagent should:

1. Load the referenced skill via `skill()` tool
2. Extract relevant verification dimensions from the skill
3. Apply those dimensions to the audit target
4. Do NOT rewrite the skill's knowledge — reference it

## Example

For Phase 1 (Skills Audit):

```
skill("use-authoring-skills")
→ Load references/05-skill-quality-matrix.md
→ Load references/01-skill-anatomy.md  
→ Apply to each skill in .opencode/skills/*/SKILL.md
→ Return findings in structured JSON
```

## No Knowledge Rewriting

These references are POINTERS, not rewrites. The knowledge lives in the original skill files. This file only indicates which skill to load for which phase.
