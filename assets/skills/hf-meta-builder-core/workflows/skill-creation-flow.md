# Workflow: Skill Creation

> **Loading trigger:** When routing to skill creation.

## 5-Step Procedural

1. **Classify intent** — match against routing table, confirm skill type
2. **Select pattern** — P1 (router), P2 (balanced), P3 (deep) based on complexity
3. **Write frontmatter** — use templates/skill-frontmatter.md, run validate
4. **Write body** — follow agentskills.io principles (procedures over declarations)
5. **Validate** — run validate-skill.sh → check-overlaps.sh → critic review → fix → repeat

## Delegation
Route to: `hf-use-authoring-skills` → Hivemind skill-author specialist
