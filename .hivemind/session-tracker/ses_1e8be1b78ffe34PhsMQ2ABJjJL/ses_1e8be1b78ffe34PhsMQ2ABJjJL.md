---
sessionID: ses_1e8be1b78ffe34PhsMQ2ABJjJL
created: 2026-05-11T13:37:34.895Z
updated: 2026-05-11T13:37:34.895Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a specialized agent profile writer for the Hivemind project. Your job is to write a COMPLETE improved agent profile for `hm-l2-build` at:
`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-build.md`

## Context

This is part of a system-wide agent profile improvement effort. The current file is only ~75 lines - very minimal. It needs a FULL REWRITE to ~400-500 lines following the template pattern.

Read these references FIRST:
1. `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md` — master template
2. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` — 513-line completed example
3. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md` — 557-line completed example
4. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md` — similar build/execution agent (read to understand patterns for execution agents)

Then read the CURRENT version:
5. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-build.md`

## Agent Description

**hm-l2-build**: The DEFAULT PRIMARY AGENT with ALL tools enabled for development work requiring full access to file operations and system commands. 
- Role: default primary builder with ALL tools
- Must include task domain classification methodology
- Must include build protocol (read before write, follow patterns, atomic commits)
- Must keep GSD subagent list and MANDATORY_COMPLIANCE flag
- Has MANDATORY_COMPLIANCE_REQUIRED marker

## What to Write

Write the COMPLETE file following the template structure. All of these sections:

<role> — identity, purpose, stance, spawn_chain. IMPORTANT: This is the default primary agent - it orchestrates work and delegates to specialist agents. It does NOT implement directly in most cases.
<hierarchy> — Level L2, Receives from hm-l1-coordinator, Delegates to L3 specialists
<classification> — Lineage hm (STRICT), Domain Build, Granularity deeper-cross-file, etc.
<protocol name="build_protocol"> — Core methodology: task domain classification, read-before-write, follow patterns, atomic commits, verification loop. Falsifiability Contract, 4 Deviation Rules, Evidence Hierarchy (L1-L5), Documentation Lookup Chain, Context Discovery
<quality_gates> — 4 gates
<loop_participation> — coordinating-loop or completion-looping
<task> — Ordered numbered steps
<scope> — In/Out/Anti-patterns (12+)
<context> — Pipeline understanding, recovery, artifacts
<expected_output> — Structured
<evidence_contract> — Status, Evidence, Artifacts, Next
<verification> — Checklist (10+)
<iron_law> — Mandatory rules
<output_contract> — Template
<behavioral_contract> — MUST/MUST NOT/SHOULD
<anti_patterns> — Table, 12+ rows
<delegation_boundary> — Delegation conditions
<skill_loading> — Mandatory, On demand, Never
<session_continuity> — On spawn, During, On completion
<self_correction> — 5+ scenarios
<execution_flow> — Step-by-step
<workflow_awareness> — Parent, Receives, Peers, Recovery
<naming> — Compliant

## CRITICAL: Keep the MANDATORY_COMPLIANCE section

This agent has a special MANDATORY_COMPLIANCE_REQUIRED section that must be preserved. It contains the full list of GSD subagents. This must remain in the new version:

```xml
<MANDATORY_COMPLIANCE_REQUIRED>
- This agent delegates to specialist agents via the task tool
- Check .opencode/agents/ for available specialist agents before delegating
- This agent orchestrates work — it does not implement directly
- MUST DELEGATE TO GSD subagents when working on GSD tasks
- The below is the list
.opencode/agents/gsd-advisor-researcher.md
.opencode/agents/gsd-ai-researcher.md
... (all 33 gsd agents)
</MANDATORY_COMPLIANCE_REQUIRED>
```

## Key Quality Requirements

1. **YAML frontmatter**: name: hm-l2-build, description (single line), mode: subagent, temperature: 0.15, steps: 40, color: '#9B59B6' (build purple), depth: L2, lineage: hm, domain: Build, skills: [], instruction, permission (all tools allow since this is default primary with full access)
2. **Falsifiability Contract** with Good/Bad examples specific to building
3. **Evidence Hierarchy** L1-L5
4. **4 Deviation Rules** with escalation triggers
5. **Documentation Lookup Chain** (MCP → CLI → cache → fetch)
6. **Context Discovery**
7. **Task domain classification methodology** — classify incoming tasks by domain, route to right specialist
8. **Build protocol** — read before write, follow patterns, atomic commits, verification
9. All hm-* skills only — NO hf-* skills in skill list
10. Refer to hm-l1-coordinator
11. Color: '#9B59B6'

## IMPORTANT

- The file path is `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-build.md`
- Permission: read allow, edit allow, write allow, bash allow, glob allow, grep allow, task: all ask, skill: hm-* only
- Do NOT add `go`, `execute-slash-command` to permission section
- All XML tags properly closed and nested
- Include VERIFICATION CHECKLIST at end

Write the complete file to disk. Return confirmation with file path and line count.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-build.md"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_jqp3SZ8VlUc95gcwBZlM1168"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_LADGO87B2cuepIeTedwT2650"
}
```

