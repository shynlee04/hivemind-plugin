---
sessionID: ses_1e99ac4e3ffeSa0QV5dg96628Q
created: 2026-05-11T09:36:33.577Z
updated: 2026-05-11T09:36:33.577Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with adding/upgrading the IRON CLAW governance section in 3 skills: hm-l2 spec-driven-authoring, hm-l2 test-driven-execution, and opencode-config-workflow. You MUST read each SKILL.md, find the right insertion point, and add the standardized IRON CLAW block using the Edit tool.

## Files to Edit (in /Users/apple/hivemind-plugin-private/.opencode/skills/):

1. `hm-l2-spec-driven-authoring/SKILL.md` - Spec authoring skill that creates requirements. Read lines 1-50 to understand the structure (starts with Overview, Entry Gate). Add the IRON CLAW block right after "## Overview" section (around line 21-23) and before "## Entry Gate" section.

2. `hm-l2-test-driven-execution/SKILL.md` - TDD execution skill. Read lines 1-40 to understand structure (starts with Overview, Entry Gate). Add the IRON CLAW block right after "## Overview" section (around line 22-23) and before "## Entry Gate" section.

3. `opencode-config-workflow/SKILL.md` - Config workflow for OpenCode primitives. Has "## The Iron Law" at line 18. Read lines 1-30 to understand structure. Add the tech-stack IRON CLAW block as a new section after the "## The Iron Law" section (around line 22) and before "## 8-Turn Workflow".

## The Standardized IRON CLAW Block

Use this EXACT block for ALL three files:

```
## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |
```

## Execution Instructions

For each file:
1. Read the SKILL.md first to understand its structure fully
2. Find the best insertion point based on the hints above
3. Use the Edit tool to add the block
4. Adapt the heading level to match the file's heading hierarchy

## Return Format

Return a structured report listing each file edited, the insertion point chosen, and confirmation the edit was applied.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-spec-driven-authoring/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/opencode-config-workflow/SKILL.md"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_xjbdGQdJhgZIRa7E3qji6743"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_01_0XzECmimJAIdqVUJ6CXa3482"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_02_Yq3tkh8JizjcxqEPblxI6358"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-spec-driven-authoring/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-test-driven-execution/SKILL.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/skills/opencode-config-workflow/SKILL.md"
}
```

