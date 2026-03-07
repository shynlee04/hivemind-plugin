---
name: hiveq-lint
description: Static analysis of framework assets — commands, workflows, skills
  for structural compliance.
owner_agent: hiveq
kind: router
execution_context: workflows/hiveq-gate-enforcement.yaml
required_skills:
  - compliance-checking
required_templates:
  - templates/gate-checklist-template.md
required_references:
  - references/quality-gate-definitions.md
required_prompts:
  - prompts/compliance-rules.md
chain_group: hiveq
group: hiveq
entry_gate: session_declared
---

# HiveQ Lint

## Objective

Run static validation on framework assets (commands, workflows, skills, templates) to verify structural compliance without executing them.

## Checks

1. **Command frontmatter** — Has `name`, `description`. If `execution_context` present, target file exists.
2. **Workflow structure** — Has `name`, `steps`. Each step has `name` and `tool`/`description`.
3. **Skill structure** — `SKILL.md` exists in skill directory with `name` and `description` in frontmatter.
4. **Template variables** — All `{{variable}}` placeholders are documented.
5. **Naming conventions** — Kebab-case filenames, agent prefix consistency, no date-stamps.
6. **Cross-references** — Skills referenced by commands exist. Workflows referenced by commands exist.
7. **Orphan detection** — Assets not referenced by any command or workflow.

## Arguments

- `$ARGUMENTS` — Target directory or asset type (e.g., "commands/", "all", "hiverd module").

## Output

A lint report with PASS/FAIL per check and file-level details for failures.
