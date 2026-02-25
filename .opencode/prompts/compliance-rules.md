# Compliance Rules

Framework-specific rules for HiveMind asset naming, structure, and cross-referencing. Used by HiveQ compliance checking.

## Rule Registry

### R01: Agent File Naming
- **Pattern**: `agents/{name}.md`
- **Constraint**: `name` is lowercase, no hyphens in core identity (e.g., `hiverd` not `hive-rd`)
- **Frontmatter**: Must contain `name`, `description`, `mode`
- **Check**: `ls agents/*.md` + frontmatter parse

### R02: Command File Naming
- **Pattern**: `commands/{agent-prefix}-{action}.md`
- **Constraint**: Agent prefix must match an existing agent name
- **Frontmatter**: Must contain `name`, `description`
- **Check**: For each command, verify `agents/{prefix}.md` exists

### R03: Workflow File Naming
- **Pattern**: `workflows/{agent-prefix}-{purpose}.yaml`
- **Constraint**: Agent prefix must match an existing agent name
- **Check**: For each workflow, verify `agents/{prefix}.md` exists

### R04: Skill Directory Structure
- **Pattern**: `skills/{skill-name}/SKILL.md`
- **Constraint**: Directory name is kebab-case, contains `SKILL.md`
- **Frontmatter**: `SKILL.md` must contain `name`, `description`
- **Check**: `ls skills/*/SKILL.md` + frontmatter parse

### R05: No Date-Stamps
- **Pattern**: Filenames must NOT contain date patterns (`YYYY-MM-DD`, `YYYYMMDD`)
- **Scope**: All asset directories (`agents/`, `commands/`, `workflows/`, `skills/`, `templates/`, `prompts/`, `scripts/`, `references/`)
- **Check**: `ls {dir}/ | grep -E '[0-9]{4}-[0-9]{2}-[0-9]{2}'` should return 0 matches

### R06: Cross-Reference Integrity
- Command `execution_context` → workflow file must exist
- Command `required_skills` → skill directory must exist
- Command `required_templates` → template file must exist
- Workflow `target_agent` → agent file must exist

### R07: Root-Mirror Sync
- `agents/` content must match `.opencode/agents/` content
- `commands/` content must match `.opencode/commands/` content
- `workflows/` content must match `.opencode/workflows/` content
- **Check**: `diff -rq agents/ .opencode/agents/` should show no differences

### R08: No Orphan Assets
- Every workflow must be referenced by at least one command's `execution_context`
- Every skill must be referenced by at least one command's `required_skills` or workflow's `skills_loaded`
- **Check**: For each workflow, grep all commands for its filename

## Severity Classification

- **R01-R04 violations**: P1 — must fix before milestone
- **R05 violations**: P2 — fix during housekeeping
- **R06 violations**: P0 — broken chain, blocks execution
- **R07 violations**: P1 — sync drift, blocks deployment
- **R08 violations**: P2 — dead code, housekeeping
