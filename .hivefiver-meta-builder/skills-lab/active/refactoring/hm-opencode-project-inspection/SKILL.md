---
name: hm-opencode-project-inspection
description: Inspect and audit OpenCode project state across skills, agents, commands, tools, and permissions. Use when checking boundaries, verifying architecture, mapping ecosystem structure, or auditing setup. NOT for code review or direct implementation.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# OpenCode Project Inspection

## The Iron Law

```
Inspect before you act. Discovery first, assumptions never.
```

## On Load

1. Read `references/inspection-checklist.md` — structured audit checklist
2. Read `references/mcp-tool-matrix.md` — available MCP servers and their use cases
3. Read `references/ecosystem-structure.md` — labs→symlinks→.opencode pipeline

## Inspection Protocol

### Phase 0: Stack Discovery (ALWAYS FIRST)

Before any audit or inspection:

```bash
# Discover tech stack
node --version
npm ls --depth=0
cat package.json | jq '.dependencies, .peerDependencies, .devDependencies'

# Read architecture docs
cat AGENTS.md
cat docs/draft/architecture-proposal-hivemind-v3.md 2>/dev/null

# Map project structure
find .opencode/ -type f -name "*.md" | head -50
find .hivefiver-meta-builder/ -type f -name "*.md" | head -50
```

### Phase 1: Domain-Specific Slices

When scanning N slices:
1. **Output N structured JSON artifacts** — not markdown prose
2. Each slice writes to `.temp/audit/<audit-id>/findings/slice-N.json`
3. After all slices complete, synthesize from JSON → correlated report

### Phase 2: Cross-Reference Verification

For every finding:
1. Verify the claim against source files (grep, read)
2. Record file:line evidence
3. Classify severity: CRITICAL / WARNING / INFO

## MCP Tool Matrix

### Context7 MCP Usage

For EVERY tool/library lookup:
1. Call `context7_resolve-library-id` with query + library name
2. Call `context7_query-docs` with library ID + specific question
3. **Never assume** API signatures from training knowledge
4. Verify the tool's calling convention matches what's in the codebase

### Repomix MCP Usage

For codebase inspection:
1. Use `repomix_pack_codebase` with `compress: true` for essential structure
2. Use `repomix_grep_repomix_output` for pattern searches
3. Use `repomix_read_repomix_output` with offset/limit for targeted reads

### GitHub MCP Usage

For repo access:
1. Use `github_get_file_contents` for specific files
2. Use `github_search_code` for pattern searches across repos
3. Use `github_list_commits` for history inspection

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Broken functionality, data loss risk | Must fix before proceeding |
| WARNING | May cause failures under edge cases | Should fix |
| INFO | Improvement opportunity | Fix when convenient |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Assumer** | Assumes tech stack, API signatures, file locations | Discover first, verify always |
| **The Markdown Proser** | Outputs narrative reports instead of structured JSON | Each phase outputs JSON artifacts |
| **The Template Stuffer** | Creates markdown templates instead of executable scripts | Use bash scripts with real commands |
| **The Surface Scanner** | Reads only SKILL.md, skips references/ and scripts/ | Deep inspection: read references, run scripts |
| **The Orphan Finding** | Reports issues without file:line evidence | Every finding must cite source |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/inspection-checklist.md` | Always — structured audit checklist |
| `references/mcp-tool-matrix.md` | When using MCP servers for inspection |
| `references/ecosystem-structure.md` | When navigating the Hivefiver ecosystem |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-opencode-project-audit` | Orchestrates full project audits. This skill provides the inspection mechanics and tool matrix. |
| `hm-detective` | Investigates specific codebase questions. This skill audits meta-concept structure (skills, agents, commands). |
| `hm-meta-builder` | Routes meta-concept requests. This skill inspects those meta-concepts for quality and consistency. |
