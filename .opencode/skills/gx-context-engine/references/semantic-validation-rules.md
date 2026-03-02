# Semantic Validation Rules — Per-Asset-Type Criteria

> **SOT:** `docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md` § Mechanism: Semantic Chain Validation

## What Semantic Validation Checks

Unlike mechanical validation (does the file exist? does frontmatter parse?), semantic validation checks **intent alignment**:

1. Does the command actually route to the workflow it claims?
2. Does the workflow actually load the skill it references?
3. Does the skill actually contain the scripts the workflow calls?
4. Do the scripts actually produce the outputs the workflow expects?

## Chain Validation Rules

### Command → Workflow

| Rule ID | Check | Fail Condition |
|---------|-------|---------------|
| SV-01 | Command references a workflow file | Workflow file doesn't exist |
| SV-02 | Workflow entry criteria match command's `<enforcement>` | Entry criteria are broader than enforcement allows |
| SV-03 | Command intent matches workflow purpose | "recover" command pointing to "build" workflow |

### Workflow → Skill

| Rule ID | Check | Fail Condition |
|---------|-------|---------------|
| SV-04 | Workflow references a skill by name | Skill directory doesn't exist |
| SV-05 | Skill SKILL.md has matching trigger text | No trigger matches the workflow's context |
| SV-06 | Workflow steps match skill's script chains | Step calls script not in skill's scripts/ |

### Skill → Script

| Rule ID | Check | Fail Condition |
|---------|-------|---------------|
| SV-07 | SKILL.md lists script in a chain | Script referenced but not in scripts/ |
| SV-08 | Script is executable | Missing execute permission |
| SV-09 | Script produces JSON output | Non-JSON output breaks pipeline |
| SV-10 | Script dependencies are available | jq, shasum, etc. not installed |

### Intent Alignment

| Rule ID | Check | Fail Condition |
|---------|-------|---------------|
| SV-11 | Declared intent matches actual work | Profile says "audit" but agent is editing files |
| SV-12 | Scope matches profile capabilities | Files outside profile.capabilities.paths |
| SV-13 | Delegation matches profile envelope | Delegating to agent not in delegate_to[] |

## Severity Levels

| Severity | Action |
|----------|--------|
| CRITICAL | Block stage promotion. Must fix before proceeding. |
| HIGH | Warn + require acknowledgement. Can proceed with risk. |
| MEDIUM | Log finding. Report in summary. |
| LOW | Informational. No action required. |

## Implementation

`gx-semantic-validate.sh` runs these checks:

```bash
bash scripts/gx-semantic-validate.sh <workdir> <stage>
```

Output:
```json
{
  "valid": false,
  "mismatches": [
    {"rule": "SV-03", "severity": "HIGH", "detail": "gx-recover command routes to gx-semantic-pipeline workflow instead of gx-recover-loop"}
  ],
  "chain_integrity": {
    "commands_checked": 4,
    "workflows_checked": 3,
    "skills_checked": 1,
    "scripts_checked": 10,
    "links_valid": 15,
    "links_broken": 1
  }
}
```
