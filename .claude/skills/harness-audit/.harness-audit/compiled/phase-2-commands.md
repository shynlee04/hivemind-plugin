# Phase 2: Commands Audit Profile

## Envelope

```yaml
role: harness-commands-auditor
core_principle: Verify command integrity, $ARGUMENTS parsing, agent assignment, determinism
verification_dimensions:
  - frontmatter_validity
  - agent_reference
  - arguments_parsing
  - determinism
  - platform_assumptions
structured_returns: JSON findings with severity, category, location, evidence
success_criteria: All commands validated, $ARGUMENTS parsing correct
```

**Role:** harness-commands-auditor  
**Core Principle:** Verify command integrity, $ARGUMENTS parsing, agent assignment, determinism  
**Verification Dimensions:** frontmatter_validity, agent_reference, arguments_parsing, determinism, platform_assumptions  
**Forbidden Files:** .env, credentials.*, *.pem, id_rsa*, secrets/*  
**Critical Rules:** Report facts only, no write/edit during audit  
**Structured Returns:** JSON findings with severity, category, location, evidence  
**Success Criteria:** All commands validated, $ARGUMENTS parsing correct

---

## Audit Envelope

```json
{
  "phase": 2,
  "role": "harness-commands-auditor",
  "scope": "command_files",
  "forbidden_patterns": [
    ".env",
    "credentials.*",
    "*.pem",
    "id_rsa*",
    "secrets/*"
  ],
  "rule": "report_facts_only",
  "modification_allowed": false
}
```

---

## Command Frontmatter Verification

### Template: `command_frontmatter.md`

```markdown
## Frontmatter Validity Check

### Required Fields
- [ ] `description`: Clear, non-empty command description
- [ ] `agent`: Valid reference to registered agent
- [ ] `subtask`: Boolean flag for subagent dispatch behavior

### Verification Criteria
1. **description** must be non-empty string (min 10 chars)
2. **agent** must match existing agent in `.opencode/agents/`
3. **subtask** must be boolean `true` or `false`

### Findings Format
```json
{
  "file": "path/to/command.md",
  "field": "agent",
  "expected": "coordinator|conductor|researcher|builder|critic|explore",
  "actual": "value_found",
  "severity": "error|warning|info",
  "valid": true|false
}
```
```

---

## $ARGUMENTS Parsing Verification

### Template: `command_arguments.md`

```markdown
## $ARGUMENTS Parsing Test

### Parsing Rules
1. `$ARGUMENTS` expands to full command string after command name
2. Named arguments: `entity=value` or `entity:value` syntax
3. Quoted strings: multi-word arguments preserve spaces
4. Propositional: `entity=action` for targeted operations

### Test Cases
| Input | Expected Expansion |
|-------|-------------------|
| `/command arg1 value1` | `$ARGUMENTS = "arg1 value1"` |
| `/command entity=action` | `$ARGUMENTS = "entity=action"` |
| `/command "quoted arg"` | `$ARGUMENTS = "quoted arg"` |

### Verification Checklist
- [ ] `$ARGUMENTS` not used in description field
- [ ] `$ARGUMENTS` properly escaped in bash contexts
- [ ] Named argument syntax consistent (`=` vs `:` not mixed)
- [ ] No unquoted special characters that break parsing

### Findings Format
```json
{
  "file": "path/to/command.md",
  "line": 42,
  "issue": "unquoted_$ARGUMENTS",
  "context": "actual line content",
  "severity": "error|warning|info",
  "suggestion": "wrap in quotes"
}
```
```

---

## Command Determinism Verification

### Template: `command_determinism.md`

```markdown
## Determinism Check

### Ambiguity Indicators (report as warnings)
- Non-deterministic file paths (no anchors)
- Conditional logic without explicit branches
- Time-dependent behavior without fallback
- Platform-specific assumptions without guards

### Verification Checklist
- [ ] No `date`, `time`, `timestamp` in commands without stable fallback
- [ ] No `whoami`, `hostname`, `pwd` without path stabilization
- [ ] No `ls -l` without explicit target directory
- [ ] No `git branch` without branch name specification

### Findings Format
```json
{
  "file": "path/to/command.md",
  "line": 15,
  "issue": "non_deterministic_path",
  "context": "uses $PWD without validation",
  "severity": "warning",
  "evidence": "command references current directory without anchoring"
}
```
```

---

## Agent Reference Verification

### Template: `command_agent_reference.md`

```markdown
## Agent Reference Check

### Registered Agents
- coordinator
- conductor
- researcher
- builder
- critic
- explore

### Verification Rules
1. Agent field must reference exact name (case-sensitive)
2. Agent must exist in `.opencode/agents/<agent>.md`
3. Agent tools must support command requirements

### Cross-Check Requirements
- [ ] Agent tools include required capabilities for command
- [ ] Agent temperature/settings appropriate for command complexity
- [ ] Agent has sufficient context for command scope

### Findings Format
```json
{
  "file": "path/to/command.md",
  "field": "agent",
  "value": "researcher",
  "exists": true,
  "severity": "error|warning|info",
  "capabilities_match": true|false
}
```
```

---

## Platform Assumption Verification

### Template: `command_platform.md`

```markdown
## Platform Assumption Check

### darwin (macOS) Specific
- Uses `zsh` (default shell)
- `/Users/` home directory pattern
- `osascript` for UI automation

### linux Specific
- Uses `bash` or `sh`
- `/home/` home directory pattern
- `systemd` for services

### Cross-Platform Commands
- [ ] Shell shebang matches target platform
- [ ] Path separators appropriate (`/` on unix, handles `\`)
- [ ] No hardcoded `/Users/` without darwin check
- [ ] No hardcoded `/home/` without linux check

### Findings Format
```json
{
  "file": "path/to/command.md",
  "line": 8,
  "issue": "platform_assumption",
  "assumed": "darwin",
  "context": "hardcoded /Users/ path",
  "severity": "warning",
  "suggestion": "use $HOME or detect platform"
}
```
```

---

## Summary Report Template

```markdown
## Commands Audit Summary

| Category | Total | Errors | Warnings | Info |
|----------|-------|--------|----------|------|
| Frontmatter Validity | N | N | N | N |
| Agent References | N | N | N | N |
| $ARGUMENTS Parsing | N | N | N | N |
| Determinism | N | N | N | N |
| Platform Assumptions | N | N | N | N |

### Critical Issues (must fix)
1. [list critical errors]

### Recommended Fixes
1. [list warnings]

### Notes
1. [list informational items]

### JSON Findings Export
```json
{
  "phase": 2,
  "audited_at": "ISO8601_timestamp",
  "total_commands": N,
  "findings_by_severity": {
    "error": N,
    "warning": N,
    "info": N
  },
  "findings": [...]
}
```
```

---

## Audit Execution Protocol

1. **Scan** `.opencode/commands/` for all `*.md` files
2. **Parse** frontmatter of each command file
3. **Verify** agent references against `.opencode/agents/`
4. **Test** $ARGUMENTS usage patterns
5. **Check** for platform assumptions
6. **Report** JSON findings with severity classification

### File Exclusion
Do NOT audit files matching:
- `.env`
- `credentials.*`
- `*.pem`
- `id_rsa*`
- `secrets/*`

### Output Requirement
Return JSON findings array + summary markdown. Do not modify files.