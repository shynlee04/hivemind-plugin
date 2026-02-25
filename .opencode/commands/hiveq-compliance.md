---
name: "hiveq-compliance"
description: "Check compliance with framework conventions, naming rules, and asset organization."
execution_context: "workflows/hiveq-audit-workflow.yaml"
required_skills:
  - "compliance-checking"
required_templates:
  - "templates/audit-report-template.md"
chain_group: "hiveq"
entry_gate: "session_declared"
---

# HiveQ Compliance

## Objective

Verify that framework assets comply with HiveMind conventions: naming rules, directory structure, cross-referencing integrity, and organizational standards.

## Compliance Rules

1. **Agent names** — lowercase, no hyphens in agent identity name, file is `{name}.md`
2. **Command prefix** — matches owning agent: `hiverd-*.md` for hiverd commands
3. **Workflow prefix** — matches owning agent: `hiverd-*.yaml` for hiverd workflows
4. **Skill directories** — kebab-case, contain `SKILL.md` with frontmatter
5. **No date-stamps** — filenames never contain dates (e.g., `2026-02-25-`)
6. **Root↔.opencode sync** — `agents/` content matches `.opencode/agents/` content
7. **No orphan assets** — every asset referenced by at least one command or workflow

## Arguments

- `$ARGUMENTS` — Scope (e.g., "all", "hiverd module", "commands/", "naming only").

## Output

A compliance report listing violations with file paths, rule violated, and recommended fix.
