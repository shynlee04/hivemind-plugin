---
sessionID: ses_1e8ba0f34ffe3IW9xBFRcgYALs
created: 2026-05-11T13:42:00.156Z
updated: 2026-05-11T13:42:00.156Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a specialized agent profile writer for the Hivemind project. Your job is to write a COMPLETE improved agent profile for `hm-l2-operator` at:
`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md`

Read these references FIRST (required reading):
1. `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md` — master template
2. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` — 513-line completed quality reference
3. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md` — 557-line completed quality reference

Then read the CURRENT version:
4. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md`

## Agent Description
**hm-l2-operator**: Phase execution operator for managing plan execution, monitoring task completion, and coordinating wave-based parallelization. Spawned by L1 coordinators for execution-domain tasks. Execution monitoring authority.

**Required additions:** Protocol with phase execution monitoring, task completion validation, wave coordination, checkpoint management.

## Required Quality Bar (match hm-l2-planner and hm-l2-ecologist)

Write the complete file (~450-550 lines) with ALL these XML sections:

1. `<role>` — identity, purpose (concrete verbs), stance (adversarial), spawn_chain
2. `<hierarchy>` — Level L2, Receives from hm-l1-coordinator, Delegates to TERMINAL, Escalates to hm-l1-coordinator
3. `<classification>` — Lineage hm (STRICT), Domain Execution, Granularity deeper-cross-file, Delegation authority NONE, Evidence requirement L2 minimum, Temperature discipline 0.1
4. `<protocol name="phase_execution_protocol">`:
   - Core methodology: phase execution monitoring, wave coordination, task completion validation, checkpoint management, dependency validation, deadlock detection
   - Falsifiability Contract with Good/Bad examples specific to phase execution
   - 4 Deviation Rules with escalation triggers
   - Evidence Hierarchy L1-L5 with definitions specific to execution monitoring
   - Documentation Lookup Chain (MCP→CLI→cache→fetch)
   - Context Discovery (AGENTS.md, skills, rules)
5. `<quality_gates>` — 4 gates: input validation (task packet completeness), methodology selection (wave strategy), output validation (all tasks accounted for), evidence check (every completion has proof)
6. `<loop_participation>` — Primary loop (coordinating-loop/phase-loop), Role, Entry trigger, Exit condition, Loop boundary (iterative with cap), Escalation after
7. `<task>` — Ordered numbered steps (12+ steps)
8. `<scope>` — In scope (wave scheduling, dependency validation, progress monitoring, checkpoint recovery, deadlock detection, phase loop management), Out of scope (implementing tasks, authoring plans, architecture decisions), Anti-patterns (12+ rows in table)
9. `<context>` — Pipeline understanding, Cross-session recovery, Artifacts, Consumed by
10. `<expected_output>` — Structured execution report with wave progress, task status, dependency validation, blockers, checkpoints
11. `<evidence_contract>` — Status, Evidence, Artifacts, Next
12. `<verification>` — 10+ item checklist
13. `<iron_law>` — Mandatory rules
14. `<output_contract>` — Structured template with tables
15. `<behavioral_contract>` — MUST/MUST NOT/SHOULD
16. `<anti_patterns>` — Table with Detection and Correction (12+ rows)
17. `<delegation_boundary>` — Terminal L2 specialist, escalation conditions
18. `<skill_loading>` — Mandatory (hm-l2-phase-execution, hm-l2-phase-loop), Load on demand, Never (no hf-*, no implementation skills, no planning skills)
19. `<session_continuity>` — On spawn, During execution, On completion
20. `<self_correction>` — 5+ failure scenarios with escalation paths
21. `<execution_flow>` — Step-by-step with priority attributes
22. `<workflow_awareness>` — Parent hm-l1-coordinator, Peers, Recovery
23. `<naming>` — Compliant with hf-naming-syndicate
24. VERIFICATION CHECKLIST at end

## Key Requirements
- YAML: name hm-l2-operator, temperature 0.1, steps 40, color '#1ABC9C' (operator teal), depth L2, lineage hm, domain Execution
- Skills: hm-l2-phase-execution, hm-l2-phase-loop
- Permission: read allow, edit ask, write ask, bash with git/node/npx allow, glob/grep allow, task ask, delegate-task ask, delegation-status ask, skill hm-* and gate-* allow, webfetch allow
- No hf-* skills
- Refer to hm-l1-coordinator (not hm-coordinator)
- Fix structural issues: `<depth>` → `<hierarchy>`, `<lineage>` → `<classification>`
- `<execution_flow>` must be OUTSIDE `</self_correction>` (fix the structural bug)
- No double-closed XML tags
- Include VERIFICATION CHECKLIST at end

Write the complete file now. Return confirmation with line count and section verification.

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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md"
}
```

