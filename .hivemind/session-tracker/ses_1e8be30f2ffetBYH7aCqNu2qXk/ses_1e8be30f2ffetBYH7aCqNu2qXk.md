---
sessionID: ses_1e8be30f2ffetBYH7aCqNu2qXk
created: 2026-05-11T13:37:29.410Z
updated: 2026-05-11T13:37:29.410Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a specialized agent profile writer for the Hivemind project. Your job is to write a COMPLETE improved agent profile for `hm-l2-executor` at:
`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md`

## Context

This is part of a system-wide agent profile improvement effort. The current file is ~211 lines. It needs to be expanded to ~450-550 lines following the template pattern established by these completed references:
- `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md` (the master template)
- `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` (513 lines - completed example to match in quality)
- `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md` (557 lines - completed example to match in quality)

## Required: Read these references FIRST

Read these files to understand the quality bar and structure required:
1. `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md` — master template with all required sections
2. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` — completed 513-line reference demonstrating XML section quality
3. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md` — completed 557-line reference demonstrating XML section quality

Then read the CURRENT version of this file:
4. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md` — current file to improve

## Agent Description

**hm-l2-executor**: Execution specialist for running implementation plans with wave-based parallelization, checkpoint recovery, and deviation handling. Spawned by L1 coordinators for implementation-domain tasks. Writes code.

**Required additions:** 
- Protocol with atomic commit methodology, wave-based parallel execution, checkpoint recovery, deviation rules (4-rule), documentation lookup chain (MCP→CLI→cache), execution reporting contract with commit hashes and file:line evidence
- Full template sections as described below

## What to Write

Write the COMPLETE file following the template structure exactly. The file must contain ALL of these XML sections:

```xml
<role> — identity, purpose, stance (adversarial), spawn_chain
<hierarchy> — Level, Receives from, Delegates to, Escalates to
<classification> — Lineage, Domain, Granularity, Delegation authority, Evidence requirement, Temperature discipline
<protocol name="execution_protocol"> — Core methodology (atomic commits, wave execution, checkpoint recovery, TDD cycles), Falsifiability Contract (good/bad examples), Deviation Rules (4 rules), Evidence Hierarchy (L1-L5), Documentation Lookup Chain (MCP→CLI→cache→fetch), Context Discovery
<quality_gates> — 4 gates: input validation, methodology selection, output validation, evidence check
<loop_participation> — Primary loop, Role, Entry trigger, Exit condition, Loop boundary, Escalation after
<task> — Ordered numbered steps (receive, load skills, discover context, execute, verify, return)
<scope> — In scope, Out of scope, Anti-patterns (12+ rows)
<context> — Pipeline understanding, Cross-session recovery, Artifacts, Consumed by
<expected_output> — Structured execution report with status, tasks, deviations, verification
<evidence_contract> — Status, Evidence, Artifacts, Next
<verification> — Checklist (10+ items)
<iron_law> — Mandatory rules
<output_contract> — Structured template with tables
<behavioral_contract> — MUST/MUST NOT/SHOULD
<anti_patterns> — Table with Detection and Correction columns (10+ rows)
<delegation_boundary> — What it delegates/doesn't delegate, escalation conditions
<skill_loading> — Mandatory, Load on demand, Never load sections
<session_continuity> — On spawn, During execution, On completion
<self_correction> — Failure mode handlers (5+ scenarios with escalation paths)
<execution_flow> — Step-by-step with numbered steps and priority attributes
<workflow_awareness> — Parent, Receives from, Peers, Recovery
<naming> — Compliant with hf-naming-syndicate
```

## Key Quality Requirements

1. **YAML frontmatter** must be valid OpenCode YAML with: name, description (single line), mode: subagent, temperature: 0.05, steps: 40, color: '#E67E22' (executor orange), depth: L2, lineage: hm, domain: Implementation, skills, instruction, permission sections
2. **Falsifiability Contract** in `<protocol>` with concrete Good/Bad examples specific to execution
3. **Evidence Hierarchy** L1-L5 with clear definitions specific to code execution
4. **4 Deviation Rules** with escalation triggers
5. **Documentation Lookup Chain** (MCP → CLI → cache → fetch)
6. **Context Discovery** steps (AGENTS.md, skills, rules)
7. **Atomic commit protocol** with wave-based parallel execution
8. **Checkpoint recovery** methodology
9. **Execution reporting contract** with commit hashes and file:line evidence
10. Skill list must reference hm-l2-* skills only — NO hf-* skills
11. Refer to hm-l1-coordinator (not hm-coordinator)

## IMPORTANT NOTES

- The file path must remain `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md`
- Do NOT add any fields to YAML frontmatter that aren't listed - hm-* agents use specific fields
- The color for executor should be '#E67E22' (executor orange)
- Use `temperature: 0.05` for deterministic execution
- Use `steps: 40`
- Permission section should allow read, edit, write, bash with specific tool permissions
- The `go` and `execute-slash-command` tools should NOT be in the permission section
- All XML tags MUST be properly closed and nested
- `<execution_flow>` uses `<step name="" priority="">` format
- `<anti_patterns>` should have 12+ rows with detection and correction columns
- Ensure double-closed tags are avoided
- `<depth>` tag should be replaced with `<hierarchy>` 
- `<lineage>` tag should be replaced with `<classification>`

## Verification Checklist to include at the END of the file

```
## VERIFICATION CHECKLIST
- [ ] YAML frontmatter is valid
- [ ] All required XML body sections present (list them all)
- [ ] Falsifiability Contract present with Good/Bad examples
- [ ] Evidence Hierarchy (L1-L5) present
- [ ] Deviation Rules (4 rules) present
- [ ] Documentation Lookup Chain present
- [ ] Context Discovery present
- [ ] Quality Gates (4 gates) present
- [ ] Loop Participation present
- [ ] Evidence Contract present
- [ ] Adversarial stance present
- [ ] No hf-* skills
- [ ] Temperature at 0.05
- [ ] Lineage: hm (STRICT)
- [ ] References hm-l1-coordinator
- [ ] All XML tags properly closed
- [ ] <execution_flow> uses correct format
- [ ] <anti_patterns> has 12+ rows
```

## OUTPUT

Write the complete file to disk using the Write tool. The file should be 450-550 lines with the same quality and depth as the hm-l2-planner.md and hm-l2-ecologist.md references.

Return a confirmation with: file path, line count, and verification that all sections are present.

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


### Tool: write

**Input:**
```json
{
  "callID": "call_00_yZLPdZ8zEM28hlq3DBLp8124"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_V0OWRE9XH71oxiUo4lhx0869"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_0dT0ftCKAw8Jjzt7yzXp7916"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_OJH6og4Z3aRFUhmTWNCU5380"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_OPdQ7AObrPxh3jElbQlo1299"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_bhXFg5aOsAqmESUUGgO16605"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_YeouYetKOr4QyORpAnVV4218"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_OeROQp9sstOOwez64QuL8273"
}
```

