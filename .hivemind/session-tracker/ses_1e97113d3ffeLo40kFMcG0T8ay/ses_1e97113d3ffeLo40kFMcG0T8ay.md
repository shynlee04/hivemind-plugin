---
sessionID: ses_1e97113d3ffeLo40kFMcG0T8ay
created: 2026-05-11T10:22:05.896Z
updated: 2026-05-11T10:22:05.896Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are hm-l2-executor, dispatched by hm-l1-coordinator to improve agent profile files. You must follow the task below exactly.

## Task
Rewrite the agent profile at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md` following the master template at `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md`.

Read BOTH files first before writing.

## Scope
- WORK ONLY on: `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md`
- Do NOT touch any other file
- Do NOT change YAML schema fields that aren't defined in OpenCode spec
- Do NOT add invalid `color:` values (must be hex `#XXXXXX` or OpenCode theme names)
- Do NOT change the agent's fundamental purpose or description
- Keep domain as "Research", depth as "L2", lineage as "hm"
- Keep all existing YAML permissions intact

## Required Upgrades from Template

The template has these XML body sections (add any that are missing):
1. `<role>` — with identity, purpose, stance, spawn_chain
2. `<hierarchy>` — L2 specialist, receives from hm-l1-coordinator, terminal (never delegates), escalates to L1
3. `<classification>` — lineage, domain, granularity, delegation authority, evidence requirement, temperature discipline
4. `<protocol>` — Core methodology (spec-driven research), **Falsifiability Contract** (every output must contain disprovable claims with file:line or citations), **Deviation Rules** (4-rule decision tree), **Evidence Hierarchy** (L1-L5 tagging requirement)
5. `<quality_gates>` — Gate 1: input validation, Gate 2: methodology selection, Gate 3: output validation, Gate 4: evidence check
6. `<loop_participation>` — Primary loop, role, entry trigger, exit condition, loop boundary, escalation after N failures
7. `<task>` — Ordered numbered steps
8. `<scope>` — In scope / Out of scope / Anti-patterns
9. `<evidence_contract>` — Status + Evidence + Artifacts + Next

## Specific Upgrades for THIS Agent

1. **Add Falsifiability Contract** in `<protocol>`: Every research output must contain claims provable with file:line evidence; "Good: File X contains function Y with parameter Z", "Bad: The code was analyzed thoroughly"
2. **Add Evidence Hierarchy (L1-L5)** tagging requirement:
   - L1: Live runtime proof (test pass, build success)
   - L2: Tool-verified file read (glob+grep confirmation)
   - L3: Documented observation (file contents, git log)
   - L4: Deduced from evidence chain (logical inference)
   - L5: Documentation-only (spec claims, README)
3. **Add Documentation Lookup Chain**: MCP tools (Context7, DeepWiki, Exa) → CLI fallback (npx ctx7) → local cache (hm-tech-stack-ingest)
4. **Add Deviation Rules** (4 rules): auto-fix within task scope, auto-add missing critical functionality, escalate architecture changes, escalate scope expansion >20%
5. **Add Cross-Source Conflict Arbitration**: When 2 sources disagree, document both positions with evidence weight, pick the stronger one with rationale, or flag as UNRESOLVED
6. **Add Quality Gates**: Input validation (task packet contains question, scope, evidence requirements, output format) → Methodology (research chain selected) → Output (every claim has evidence) → Evidence (all claims tagged L1-L5)
7. **Add Loop Participation**: coordinating-loop, single-pass research with optional re-research loop
8. **Add Evidence Contract**: every return includes status (COMPLETED/FAILED/BLOCKED/ESCALATED), file:line evidence, artifacts list, next recommended step

## GSD Reference Patterns to Apply

From the GSD agents studied, apply these patterns:
- **Adversarial stance** (from gsd-code-reviewer): "Starting hypothesis: all sources contain gaps or inaccuracies until verified." 
- **Project context discovery** (from gsd-executor): Before research, discover AGENTS.md, project skills, and project-specific conventions
- **Documentation lookup chain** (from gsd-executor): Context7 MCP → CLI fallback (npx ctx7) → local cache
- **Execution flow** (from gsd-planner): XML-tagged numbered steps with priority attributes
- **Verification checklist** (from gsd-code-reviewer): I-AM-THE-VERIFICATION checklist at the end

## Current File Key Facts
- 264 lines, generic description
- Has basic role, depth, lineage, task, scope, context sections
- Missing: falsifiability contract, evidence hierarchy, deviation rules, documentation lookup chain, quality gates, loop participation, evidence contract, stance, cross-source arbitration

## Output Format
- Write the improved file preserving existing valid YAML frontmatter
- Add ALL missing XML body sections from the template
- Keep the existing execution flow and workflow awareness sections
- End with `<naming>` section

## Verification
1. Read the written file to confirm it exists and has valid structure
2. Confirm YAML frontmatter is valid (no invalid fields)
3. Confirm file still ends with proper XML closing
4. Report back: "RESEARCHER PROFILE IMPROVED" with summary of changes

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_7YAI3qDzgY6DCzLRp1gT1637"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_FAUXRRBTLUzPM5yXh6kQ0231"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_7CqLC4WyXsfTxB5ZLBPC8583"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_EWI6xszd3WfUlIQfbKYl2059"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_AswtAMwP4ymrS6fF797E8379"
}
```

