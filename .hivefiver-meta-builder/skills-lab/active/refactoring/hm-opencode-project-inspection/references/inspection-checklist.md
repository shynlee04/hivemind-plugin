# Inspection Checklist

Structured audit checklist for OpenCode project inspection.

## Pre-Inspection Setup

```bash
# Create audit directory
mkdir -p .temp/audit/$(date +%s)/findings

# Initialize audit log
cat << 'EOF' > .temp/audit/$(date +%s)/audit-log.md
# Audit Log
**Started:** $(date -Iseconds)
**Scope:** <skills | agents | commands | tools | permissions | all>
**Auditor:** <agent-name>
EOF
```

## Phase 1: Skills Audit

- [ ] Count skills in `.opencode/skills/` (or lab)
- [ ] Every skill has `SKILL.md`
- [ ] Every `SKILL.md` has YAML frontmatter with `name`, `description`, `metadata.layer`
- [ ] Description contains 5+ trigger phrases
- [ ] Description contains 1-2 "NOT for" exclusions
- [ ] No internal vocabulary in description (`harness`, `OMO`, `GSD`, `/hf-*`)
- [ ] References/ directory exists if body >200 LOC
- [ ] No stub references (<5 LOC)
- [ ] No dead references (referenced file exists)
- [ ] Scripts have non-zero exit on failure
- [ ] Evals exist (target: 60%+ coverage)

## Phase 2: Agents Audit

- [ ] Count agents in `.opencode/agents/`
- [ ] Every agent has YAML frontmatter with `name`, `description`, `permission`
- [ ] `permission.skill` uses explicit allow-list (never `"*": allow`)
- [ ] `bash` defaults to `ask` with explicit allow-list
- [ ] `task` is `deny` for level-3 task-completers
- [ ] No duplicate agent names
- [ ] Agent descriptions contain trigger phrases

## Phase 3: Commands Audit

- [ ] Count commands in `.opencode/commands/`
- [ ] Every command has YAML frontmatter with `description`, `agent`, `tools`
- [ ] `$ARGUMENTS` properly referenced in body
- [ ] `!bash` injections are output-only (no TTY)
- [ ] Commands survive `CI=true`
- [ ] No hardcoded paths

## Phase 4: Permissions Audit

- [ ] `opencode.json` exists and is valid JSON
- [ ] No wildcard permissions at top level
- [ ] Agent permissions are scoped
- [ ] MCP server permissions are read-only unless explicitly approved

## Phase 5: Rules Audit

- [ ] Rules in `.opencode/rules/` are documented
- [ ] Rules are hard boundaries (not suggestions)
- [ ] No contradictory rules

## Phase 6: Cross-Reference Validation

- [ ] Every skill referenced in agent permissions exists
- [ ] Every skill referenced in routing tables exists
- [ ] Every command references an existing agent
- [ ] No stale references to retired skills

## Output Format

```json
{
  "audit_id": "<timestamp>",
  "scope": "<skills|agents|commands|permissions|rules|all>",
  "summary": {
    "total_checked": 0,
    "passed": 0,
    "warnings": 0,
    "critical": 0
  },
  "findings": [
    {
      "severity": "CRITICAL|WARNING|INFO",
      "category": "skills|agents|commands|permissions|rules",
      "file": "path/to/file",
      "line": 0,
      "message": "Description of issue",
      "evidence": "Exact text or snippet"
    }
  ]
}
```
