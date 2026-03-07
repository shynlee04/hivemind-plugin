---
description: Static analysis of framework assets — commands, workflows, skills
agent: hiveq
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
