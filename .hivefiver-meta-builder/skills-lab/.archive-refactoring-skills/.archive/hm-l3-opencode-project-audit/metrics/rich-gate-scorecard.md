# RICH Gate Scorecard: hm-opencode-project-audit

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 3.0.0

## RICH Classification: RICH
Auditor skill — comprehensive parallel audit of OpenCode projects across skills, commands, tools, permissions, agents, and subagents with 7-phase dispatch.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | OpenCode official docs adopted for scope matrix. 7 audit phases with specialist profiles. Parallel dispatch architecture. Some internal path references (harness-audit) suggest non-portable lineage. |
| D2: Mindset + Procedures | 13 | 15 | Strong Iron Law ("AUDIT REPORTS FACTS. NEVER BLOCKS. NEVER FIXES."). 7-phase execution flow (Phases 1-6 parallel, Phase 7 synthesis). Severity levels (CRITICAL/WARNING/INFO). |
| D3: Anti-Pattern Quality | 12 | 15 | Four anti-patterns: Fixer, Hoarder, Blocker, Executor. Detection+correction for each. Focused on audit-role discipline. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Clear boundary (NOT for code review or implementation). Version 3.0.0 suggests maturity. |
| D5: Progressive Disclosure | 12 | 15 | 175 lines with 7 subagent profiles, 2 scripts, 1 reference. Core dispatch protocol inline. Subagent profiles carry detailed audit criteria. |
| D6: Freedom Calibration | 12 | 15 | Structured dispatch with 7 phases but flexible in how subagents execute. Severity levels inform but don't block. Independence notes for non-HiveMind projects. |
| D7: Pattern Recognition | 8 | 10 | Parallel audit pattern with synthesis phase. Subagent dispatch with structured profiles. Fact-based reporting pattern. |
| D8: Practical Usability | 11 | 15 | Phase table with execution contexts immediately usable. Subagent profile envelope documented. Some paths reference harness-audit which may not exist in other projects. |
| **D1-D8 Total** | **95/120 (79%)** | | **Grade: B** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | OpenCode official docs adopted for scope matrix (agents, commands, config/rules). GitHub agent skill resource model adapted for profiles. |
| RICH-2 | PASS | Parallel dispatch architecture with synthesis phase. 6 parallel audits + 1 sequential synthesis as distinct approach alternatives. |
| RICH-3 | PASS | Profiled with execution contexts pointing to use-authoring-skills, command-dev, custom-tools-dev, opencode-platform-reference, agents-and-subagents-dev. |
| RICH-4 | PASS | 7-phase execution flow with explicit parallel/sequential dispatch. Severity levels. Iron law prevents blocking/fixing. |
| RICH-5 | PASS | 7 subagent profile templates + 2 scripts (compile-bundle.sh, validate-skill.sh) + 1 reference (pointers.md). |
| RICH-6 | PASS | Independence notes clarify non-HiveMind/GSD/BMAD usage. Scope matrix from official OpenCode docs. |
| RICH-7 | PASS | Iron Law prevents fixing/blocking. Phase 7 synthesis catches cross-phase risks. Severity levels guide action. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json (added by SE-8). Self-correction added by SE-8 (4 failure modes). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 95/120 (B). Solid audit skill with parallel dispatch architecture. Self-correction and evals added by SE-8.
