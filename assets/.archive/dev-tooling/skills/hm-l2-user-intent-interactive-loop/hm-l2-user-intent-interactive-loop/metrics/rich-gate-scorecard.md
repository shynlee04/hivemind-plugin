# RICH Gate Scorecard: hm-user-intent-interactive-loop

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Front-agent skill — iterative user engagement with 5 hard gates, script-enforced validation, durable human interrupts, and 6-phase interactive loop (PROBE→UNDERSTAND→PLAN→DELEGATE→UPDATE→DELIVER).

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 16 | 20 | Phase 30 rich-lineage: LangGraph interrupts, AutoGen user handoff, Temporal reentrant workflow state. Durable human interrupt pattern. 5 hard gates with script enforcement. Significant domain knowledge. |
| D2: Mindset + Procedures | 14 | 15 | 5 hard gates with script enforcement (Gate 1: question cap, Gate 2: 6 stop conditions, Gate 3: ecosystem loading, Gate 4: validation loop, Gate 5: durable interrupt). 6-phase interactive loop. |
| D3: Anti-Pattern Quality | 14 | 15 | Ten anti-patterns: Premature Executor, Interrogator, Yes-Agent, Abandoner, Amnesiac, Silent Worker, Scope Creep, Orphan Dispatcher, Skill Ignorer, Coordinator Executor. Comprehensive with enforcement gates. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. 10+ trigger phrases. Clear boundary (NOT for ordinary clarification). Detailed description with context preservation keywords. |
| D5: Progressive Disclosure | 14 | 15 | 446 lines with 6 references, 2 scripts, worked examples. Core loop inline, deep material in references. Decision matrix and routing table. |
| D6: Freedom Calibration | 12 | 15 | Very structured with hard gates and question caps. Provides appropriate guardrails for front-agent role. Platform adaptation shows flexibility. |
| D7: Pattern Recognition | 9 | 10 | Interactive engagement pattern with 6-phase loop. Decision matrix for delegation. Durable interrupt for session continuity. |
| D8: Practical Usability | 13 | 15 | Decision matrix immediately usable. Question selection by user input table. Delegation rules clear. Platform adaptation covers 4 environments. |
| **D1-D8 Total** | **106/120 (88%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Phase 30: LangGraph interrupts (durable human interrupt), AutoGen user handoff, Temporal reentrant workflow. Script-enforced gates with verification. |
| RICH-2 | PASS | Three pattern alternatives for user engagement (PROBE-first, direct execution, clarification with delegation). Decision matrix. |
| RICH-3 | PASS | Cross-refs to hm-planning-persistence, dispatching-parallel-agents, deep-research, gcc, coordinating-loop with clear handoff points. |
| RICH-4 | PASS | 5 hard gates with script enforcement. Question cap (max 3). 6 stop conditions with checkable artifacts. Validation loop with max 3 iterations. |
| RICH-5 | PASS | 6 references (question-protocols, context-preservation, brainstorming-patterns, long-session-management, worked-examples, durable-human-interrupts). |
| RICH-6 | PASS | Platform adaptation covers 4 environments. File paths use <project-root>/ convention. Intent.json is portable. |
| RICH-7 | PASS | Gate 2 stop conditions prevent premature execution. Delegation rules prevent ambiguous dispatch. Recovery from corrupted intent.json from progress.md. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json + trigger-queries.json. Self-correction with 4 failure modes + 3 edge cases. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 106/120 (A). Excellent front-agent skill with script-enforced gates, durable interrupts, and comprehensive anti-pattern coverage.
