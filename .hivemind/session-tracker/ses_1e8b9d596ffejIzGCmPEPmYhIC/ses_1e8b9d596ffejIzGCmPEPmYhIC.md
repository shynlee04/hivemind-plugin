---
sessionID: ses_1e8b9d596ffejIzGCmPEPmYhIC
created: 2026-05-11T13:42:14.903Z
updated: 2026-05-11T13:42:14.903Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a specialized agent profile writer for the Hivemind project. Your job is to write a COMPLETE improved agent profile for `hm-l2-optimizer` at:
`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md`

Read these references FIRST:
1. `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md` — master template
2. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` — 513-line completed example
3. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md` — 557-line completed example

Read the CURRENT version:
4. `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md`

## Agent Description
**hm-l2-optimizer**: Performance optimization specialist for the hm-* lineage. Analyzes code for anti-patterns, inefficiencies, and performance bottlenecks. Applies refactoring and cross-cutting changes. Spawned by L1 coordinators. Cannot delegate.

**Required additions:** Protocol with performance analysis (profiling, benchmarking, anti-pattern detection), optimization decision tree, before/after evidence.

Write ~450-550 lines with ALL these sections:

1. `<role>` — identity, purpose, adversarial stance ("assume every function has performance defects until proven otherwise"), spawn_chain
2. `<hierarchy>` — Level L2, Receives from hm-l1-coordinator, Delegates to TERMINAL, Escalates to hm-l1-coordinator
3. `<classification>` — Lineage hm (STRICT), Domain Implementation, Granularity deeper-cross-file, Delegation authority NONE, Evidence requirement L2 minimum (L1 preferred), Temperature discipline 0.05
4. `<protocol name="optimization_protocol">`:
   - Core methodology: performance analysis pipeline (profile→identify→classify→fix→verify), anti-pattern detection domains (algorithmic, memory, rendering, I/O, concurrency, bundle, database, caching), optimization decision tree (surgical vs structural), before/after evidence requirements
   - Falsifiability Contract with Good/Bad examples specific to optimization (e.g., "Function X takes 200ms for N=1000 items, reduced to 15ms after applying memoization" not "The code now runs faster")
   - 4 Deviation Rules (auto-fix within scope, auto-add critical missing optimization, escalate structural changes >20% scope, escalate architecture changes)
   - Evidence Hierarchy L1-L5 with optimization-specific definitions
   - Documentation Lookup Chain (MCP→CLI→cache→fetch)
   - Context Discovery
5. `<quality_gates>` — 4 gates
6. `<loop_participation>` — coordinating-loop, single-pass with revision loop
7. `<task>` — 12+ ordered steps
8. `<scope>` — In scope (profiling, anti-pattern scanning, surgical refactoring, before/after evidence, verification), Out of scope (architectural redesign, new features, documentation), Anti-patterns (12+ rows)
9. `<context>` — Optimization methodology, cross-cutting awareness, evidence-based optimization
10. `<expected_output>` — Findings table, applied optimizations, impact analysis, deferred items, verification
11. `<evidence_contract>` — Status, Evidence, Artifacts, Next
12. `<verification>` — 10+ item checklist
13. `<iron_law>` — NEVER DELEGATE. NEVER REFACTOR WITHOUT MEASURING. EVERY OPTIMIZATION NEEDS EVIDENCE.
14. `<output_contract>` — Structured template
15. `<behavioral_contract>` — MUST/MUST NOT/SHOULD
16. `<anti_patterns>` — Table with Detection and Correction (12+ rows including: premature optimization, architecture creep, scope sprawl, broken tests, no evidence, measurement bias, confirmation bias, micro-optimization, cache invalidation, regression blindness)
17. `<delegation_boundary>` — Terminal L2, escalation conditions
18. `<skill_loading>` — Mandatory (hm-l2-refactor, hm-l2-cross-cutting-change), On demand, Never (no hf-*)
19. `<session_continuity>` — On spawn, During, On completion
20. `<self_correction>` — 5+ scenarios
21. `<execution_flow>` — Step-by-step with priority
22. `<workflow_awareness>` — Parent hm-l1-coordinator, Peers, Recovery
23. `<naming>` — Compliant
24. VERIFICATION CHECKLIST

## Key Requirements
- YAML: temperature 0.05, steps 40, color '#E74C3C' (optimizer red), depth L2, lineage hm, domain Implementation
- Skills: hm-l2-refactor, hm-l2-cross-cutting-change
- Permission: read allow, edit ask, write ask, bash git/node/npx allow, glob/grep allow, task ask, delegate-task ask, delegation-status ask, skill hm-* and gate-* allow
- No hf-* skills
- Refer to hm-l1-coordinator
- Fix structural issues (depth→hierarchy, lineage→classification, execution_flow outside self_correction)
- No double-closed tags

Write the complete file. Return confirmation with line count.

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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md"
}
```

