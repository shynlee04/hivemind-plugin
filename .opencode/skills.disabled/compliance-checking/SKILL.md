---
name: compliance-checking
description: "Framework convention rules, naming validation, asset cross-reference integrity."
---

# Compliance Checking

Use this skill when validating framework assets against HiveMind naming conventions, structural rules, and organizational standards.

## Naming Rules

### Filenames
- **Format**: kebab-case only (`hiverd-research.md`, not `hiverdResearch.md`)
- **No date-stamps**: Never include dates in filenames (`2026-02-25-report.md` → `report.md`)
- **Agent prefix**: Commands and workflows use owning agent as prefix (`hiverd-*.md`, `hiveq-*.yaml`)
- **Skill directories**: kebab-case directory name matching skill identity (`research-methodology/`)

### Agent Names
- Lowercase, single word preferred (`hiverd`, `hiveq`)
- File: `{name}.md` in `agents/`
- Frontmatter `name` field matches filename (without `.md`)

### Template Names
- Format: `{purpose}-template.md`
- Must end with `-template.md` suffix

## Structural Rules

### Commands
- Must have YAML frontmatter with `name` and `description`
- If `execution_context` is present, the referenced workflow file must exist
- If `required_skills` is present, each skill directory must exist under `skills/`
- Body should include `## Objective` and `## Process` sections

### Workflows
- Must have `name`, `description`, `steps` fields
- Each step must have `name` and either `tool` or `description`
- `wave` field recommended for ordering

### Skills
- Directory must contain `SKILL.md`
- `SKILL.md` must have YAML frontmatter with `name` and `description`
- Subdirectories (`references/`, `templates/`, `scripts/`) are optional

### Templates
- Must contain at least one `{{variable}}` placeholder
- Variables should be documented in a comment or header

## Cross-Reference Integrity

1. Every command's `execution_context` → workflow file exists
2. Every command's `required_skills` → skill directory exists
3. Every command's `required_templates` → template file exists
4. Every workflow's `target_agent` → agent file exists
5. Root `agents/` content matches `.opencode/agents/` content

## Orphan Detection

An asset is orphaned if:
- No command references it (for workflows, skills, templates)
- No workflow references it (for skills)
- No agent definition corresponds to it (for commands with agent prefix)

Report orphans with recommendation: wire into a chain or remove.

## Sync Validation

Verify root assets match `.opencode/` mirror:
- `agents/` ↔ `.opencode/agents/`
- `commands/` ↔ `.opencode/commands/`
- `workflows/` ↔ `.opencode/workflows/`
- `skills/` ↔ `.opencode/skills/`
