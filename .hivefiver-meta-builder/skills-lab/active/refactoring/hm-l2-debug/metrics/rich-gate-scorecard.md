# RICH Gate Scorecard: hm-debug

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution workflow — systematic debugging with persistent state, evidence-grounded diagnosis, and stop-the-line entry gate.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 14 | 20 | Third-party synthesis: NousResearch/hermes-agent (systematic debugging), addyosmani/agent-skills (debugging recovery). Evidence framework with required proof table. Some generic debug concepts. |
| D2: Mindset + Procedures | 13 | 15 | Strong Iron Law ("NO FIXES BEFORE ROOT-CAUSE INVESTIGATION"). 6-step protocol (Reproduce→Isolate→Hypothesize→Test→Fix→Guard). Persistent debug state format. |
| D3: Anti-Pattern Quality | 12 | 15 | Four anti-patterns: Guesser, Symptom Fixer, Unverified Fix, Scattershot. Detection+correction for each. Could use more domain-specific patterns. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter with 10+ trigger phrases. Clear boundary (NOT for syntax errors or single log read). |
| D5: Progressive Disclosure | 12 | 15 | 169 lines with 2 references. Core protocol inline. Could benefit from more reference breakdown for complex scenarios. |
| D6: Freedom Calibration | 12 | 15 | Structured protocol with gates at each step. Flexibility in evidence collection methods. Independence notes for project-specific conventions. |
| D7: Pattern Recognition | 8 | 10 | Scientific method debugging pattern with hypothesis falsification. Evidence-first mindset. Recurrence guard as final step. |
| D8: Practical Usability | 12 | 15 | Persistent debug state format immediately usable. Evidence table actionable. Cross-refs to hm-detective and hm-synthesis. |
| **D1-D8 Total** | **96/120 (80%)** | | **Grade: B** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | NousResearch/hermes-agent systematic-debugging adopted. addyosmani/agent-skills debugging-and-error-recovery adapted. |
| RICH-2 | PASS | Evidence-first approach with required proof table. Stop-the-line entry gate prevents premature fixes. |
| RICH-3 | PASS | Cross-refs to hm-detective, hm-synthesis, hm-planning-persistence with explicit boundary descriptions. |
| RICH-4 | PASS | 6-step protocol with gates at each step. Required evidence table (failure capture, boundary trace, competing hypotheses, root-cause prediction, recurrence guard). |
| RICH-5 | PASS | 2 references (debug-state-machine.md, evidence-framework.md). Evals/ with evals.json. |
| RICH-6 | PASS | Independence notes clarify non-GSD usage. Default state path (.debug/) is project-local. |
| RICH-7 | PASS | Stop-the-line gate prevents premature fixes. Multiple competing hypotheses required before fix. Recurrence guard as final gate. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction added by SE-8 (4 failure modes). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 96/120 (B). Solid systematic debugging skill with evidence-first approach. Self-correction added by SE-8.
