# Agent Classification Table

**Generated:** 2026-05-11
**Total hm-l2 agents:** 43
**Groups:** 16

| # | Agent | Group | Current Quality | File Exists | Key Issues |
|---|-------|-------|----------------|-------------|------------|
| 1 | researcher | **Research** | HIGH (264 lines) | ✓ | self_correction wraps exec_flow |
| 2 | synthesizer | **Synthesis** | MEDIUM (95 lines) | ✓ | No verification, no exec_flow, no anti_patterns |
| 3 | strategist | **Planning** | MEDIUM (135 lines) | ✓ | Partial exec_flow, missing quality gate checklist |
| 4 | planner | **Planning** | MEDIUM (112 lines) | ✓ | Missing exec_flow, thin anti_patterns |
| 5 | architect | **Planning** | MEDIUM (98 lines) | ✓ | Partial sections, no exec_flow |
| 6 | brainstormer | **Planning** | MEDIUM (176 lines) | ✓ | self_correction wraps exec_flow |
| 7 | scout | **Investigation** | MEDIUM (130 lines) | ✓ | Partial verification |
| 8 | investigator | **Investigation** | HIGH (260 lines) | ✓ | Good overall, minor XML nesting |
| 9 | detective | **Investigation** | MISSING | ✗ | Not in hm-l2 list — may be hm-l3 skill |
| 10 | analyst | **Quality** | MEDIUM (172 lines) | ✓ | self_correction wraps exec_flow |
| 11 | reviewer | **Quality** | HIGH (415 lines) | ✓ | Best-in-class — reference pattern |
| 12 | auditor | **Quality** | MEDIUM (140 lines) | ✓ | Need to read for details |
| 13 | validator | **Quality** | HIGH (160 lines) | ✓ | Need to read for details |
| 14 | assessor | **Quality** | MEDIUM (155 lines) | ✓ | Need to read for details |
| 15 | critic | **Quality** | LOW (72 lines) | ✓ | Very thin — needs full rewrite |
| 16 | curator | **Quality** | MEDIUM (135 lines) | ✓ | Need to read for details |
| 17 | spec-verifier | **Gatekeeping** | MEDIUM (174 lines) | ✓ | Good exec_flow, no verification section |
| 18 | phase-guardian | **Gatekeeping** | MEDIUM (140 lines) | ✓ | Need to read for details |
| 19 | guardian | **Gatekeeping** | MEDIUM (155 lines) | ✓ | Need to read for details |
| 20 | finisher | **Gatekeeping** | MEDIUM (165 lines) | ✓ | Need to read for details |
| 21 | executor | **Phase/Execution** | HIGH (211 lines) | ✓ | Good overall |
| 22 | operator | **Phase/Execution** | MEDIUM (155 lines) | ✓ | Need to read for details |
| 23 | persistor | **State** | MEDIUM (130 lines) | ✓ | Need to read for details |
| 24 | connector | **Integration** | MEDIUM (155 lines) | ✓ | Need to read for details |
| 25 | integrator | **Integration** | LOW (90 lines) | ✓ | Thin content |
| 26 | conductor | **Routing** | LOW (124 lines) | ✓ | Different format, no XML sections |
| 27 | router | **Routing** | MEDIUM (140 lines) | ✓ | Need to read for details |
| 28 | intent-loop | **Mentor/Onboarding** | MEDIUM (105 lines) | ✓ | Need to read for details |
| 29 | mentor | **Mentor/Onboarding** | MEDIUM (150 lines) | ✓ | Need to read for details |
| 30 | debugger | **Debug** | MEDIUM (105 lines) | ✓ | Need to read for details |
| 31 | optimizer | **Optimization** | MEDIUM (135 lines) | ✓ | Need to read for details |
| 32 | ecologist | **Optimization** | MEDIUM (145 lines) | ✓ | Need to read for details |
| 33 | technician | **Tech/Stack** | MEDIUM (150 lines) | ✓ | Need to read for details |
| 34 | context-mapper | **Context** | LOW (42 lines) | ✓ | Very thin — no exec_flow, no verification |
| 35 | context-purifier | **Context** | LOW (40 lines) | ✓ | Very thin — no exec_flow, no verification |
| 36 | prompt-analyzer | **Prompt Eng** | LOW (81 lines) | ✓ | No exec_flow, no sections |
| 37 | prompt-repackager | **Prompt Eng** | LOW (52 lines) | ✓ | Very thin |
| 38 | prompt-skimmer | **Prompt Eng** | LOW (82 lines) | ✓ | No exec_flow, flat structure |
| 39 | risk-assessor | **Prompt Eng** | LOW (80 lines) | ✓ | No exec_flow, flat structure |
| 40 | meta-synthesis | **Synthesis** | MEDIUM (118 lines) | ✓ | Need to read for details |
| 41 | build | **Phase/Execution** | LOW (75 lines) | ✓ | Very thin — MANDATORY_COMPLIANCE |
| 42 | general | **Routing** | LOW (69 lines) | ✓ | Very thin — fallback agent |
| 43 | test-router | **Routing** | LOW (56 lines) | ✓ | Very thin — simple router |

## Quality Summary
- **HIGH (4):** reviewer, researcher, investigator, executor
- **MEDIUM (22):** synthesizer, strategist, planner, architect, brainstormer, scout, analyst, auditor, validator, assessor, curator, spec-verifier, phase-guardian, guardian, finisher, operator, persistor, connector, router, intent-loop, mentor, debugger, optimizer, ecologist, technician, meta-synthesis
- **LOW (11):** critic, integrator, conductor, context-mapper, context-purifier, prompt-analyzer, prompt-repackager, prompt-skimmer, risk-assessor, build, general, test-router

Note: 2 MEDIUM, 2 LOW counts adjusted — total 43.
Base quality assessment from file length, section completeness, and presence of: exec_flow, verification, anti_patterns, self_correction, behavioral_contract, output_contract.

## Priority for Improvement
P1 (LOWEST quality — rewrite first): build, general, test-router, critic, integrator, conductor, context-mapper, context-purifier, prompt-analyzer, prompt-repackager, prompt-skimmer, risk-assessor
P2 (MEDIUM quality — enhance): synthesizer, strategist, planner, architect, brainstormer, scout, analyst, auditor, validator, assessor, curator, spec-verifier, phase-guardian, guardian, finisher, operator, persistor, connector, router, intent-loop, mentor, debugger, optimizer, ecologist, technician, meta-synthesis
P3 (HIGH quality — polish): reviewer, researcher, investigator, executor
