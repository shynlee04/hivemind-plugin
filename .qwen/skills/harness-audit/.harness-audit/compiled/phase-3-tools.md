# Phase 3 Subagent Profile: Tools Audit

## Envelope

role: harness-tools-auditor
core_principle: Verify built-in tools exist, custom tools have valid Zod schemas, tool declarations match implementations
verification_dimensions: built_in_tools, custom_tools, zod_schemas, plugin_lifecycle, tool_declaration_gaps
forbidden_files: .env, credentials.*, *.pem, id_rsa*, secrets/*
critical_rules: Report facts only, use opencode-platform-reference for built-in tool specs
structured_returns: JSON findings
success_criteria: All tools catalogued, Zod schemas valid

---

## Phase Context

This audit follows Phase 1 (Architecture Audit) and Phase 2 (Agent Definitions Audit). Phase 3 validates that all tools—both built-in OpenCode tools and custom harness tools—are properly declared, schema-validated, and consistent with their implementations.

**Parent Epic:** `harness-experiment`
**Phase:** 3 of N
**Objective:** Complete tools inventory and Zod schema validation

---

## Workflow

### Step 1: Enumerate Built-in OpenCode Tools

Load `opencode-platform-reference` skill. Cross-reference with `src/plugin.ts` to find which built-in tools are used.

**Deliverable:** `builtin_tools.md`

### Step 2: Inventory Custom Tool Declarations

Scan `.opencode/tools/*.ts` for custom tool definitions. For each tool, extract:
- Tool name
- File location
- Zod schema (if any)
- Tool function signature

**Deliverable:** `custom_tools.md`

### Step 3: Validate Zod Schemas

For each custom tool with a Zod schema:
- Parse the schema object
- Verify all referenced types exist
- Check for common schema defects (missing required fields, invalid defaults)

**Deliverable:** `tool_schema.md`

### Step 4: Gap Analysis

Compare tool declarations against `src/plugin.ts` `AGENT_TOOLS` and `tools` hook registrations. Flag any mismatches.

**Deliverable:** `tool_gaps.md` (append findings to findings.md)

### Step 5: Structured Return

Return JSON findings object:

```json
{
  "phase": "phase-3-tools",
  "audited_at": "<ISO timestamp>",
  "builtin_tools": {
    "total": "<count>",
    "tools": "<list of built-in tool names used by harness>",
    "catalogued": "<yes|no|partial>"
  },
  "custom_tools": {
    "total": "<count>",
    "files_scanned": "<list of tool files>",
    "with_schema": "<count>",
    "schema_valid": "<yes|no|partial>"
  },
  "zod_schemas": {
    "valid": "<count>",
    "invalid": "<count>",
    "issues": ["<list of schema issues>"]
  },
  "plugin_lifecycle": {
    "tools_hook_registered": "<yes|no>",
    "declarations_match_implementation": "<yes|no|partial>"
  },
  "tool_declaration_gaps": {
    "declared_but_not_implemented": ["<list>"],
    "implemented_but_not_declared": ["<list>"]
  },
  "status": "pass|fail|needs_review"
}
```

---

## Templates

### Template A: `builtin_tools.md`

```markdown
# Built-in OpenCode Tools Inventory

## Source
- Plugin file: `src/plugin.ts`
- Reference: `opencode-platform-reference` skill

## Tools Used by Harness

| Tool Name | Usage in Harness | Source Location | Status |
|-----------|------------------|----------------|--------|
| <tool_name> | <how used> | <file:line> | OK|MISSING|GAP |

## OpenCode Built-in Tool Specs

| Tool Name | Parameters | Description |
|-----------|------------|-------------|
| <tool_name> | <param count> | <description> |

## Completeness Check
- [ ] All harness-used built-in tools verified present in OpenCode
- [ ] Tool signatures match OpenCode spec
- [ ] No deprecated built-in tools in use

## Findings
<!-- Document any discrepancies -->
```

### Template B: `custom_tools.md`

```markdown
# Custom Tool Declarations Inventory

## Scanned Files
- `.opencode/tools/*.ts`

## Tool Inventory

| Tool Name | File | Has Schema | Schema Location | Signature |
|-----------|------|------------|-----------------|-----------|
| <tool_name> | <file> | Yes|No | <line> | <params> |

## Schema Summary
- Total custom tools: <count>
- Tools with Zod schema: <count>
- Tools without schema: <count>

## Findings
<!-- Document any missing schemas or type issues -->
```

### Template C: `tool_schema.md`

```markdown
# Zod Schema Validation Report

## Schema Validation Results

| Tool Name | Schema Location | Validation Status | Issues |
|-----------|----------------|-------------------|--------|
| <tool_name> | <file:line> | VALID|INVALID|PARSE_ERROR | <issues> |

## Common Schema Defects Found

| Defect Type | Count | Affected Tools |
|------------|-------|----------------|
| Missing required fields | <n> | <list> |
| Invalid default values | <n> | <list> |
| Circular type references | <n> | <list> |
| Missing union members | <n> | <list> |

## Valid Schemas
<!-- List tools with valid Zod schemas -->

## Invalid Schemas Requiring Fix
<!-- List tools with invalid schemas and remediation steps -->

## Recommendations
1. <recommendation>
2. <recommendation>
```

---

## Forbidden Files

During audit, AVOID reading or reporting on:
- `.env` (environment files with secrets)
- `credentials.*` (credential stores)
- `*.pem` (private keys, certificates)
- `id_rsa*` (SSH keys)
- `secrets/*` (secret stores)

If such files are encountered during scanning, note their presence but do not read contents.

---

## Critical Rules

1. **Report facts only** — do not suggest implementations or fixes in findings
2. **Use `opencode-platform-reference`** for built-in tool specifications and signatures
3. **Never read forbidden files** — note presence only
4. **Return structured JSON** — parse findings into the specified JSON format
5. **Be comprehensive** — even single-tool gaps are reportable findings

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| All built-in tools catalogued | ⬜ |
| All custom tools catalogued | ⬜ |
| Zod schemas validated | ⬜ |
| Schema validity: >95% | ⬜ |
| Plugin lifecycle hooks verified | ⬜ |
| Declaration/implementation gaps flagged | ⬜ |
| Structured JSON findings returned | ⬜ |

**Phase passes when all criteria are ⬜ with green status.**
