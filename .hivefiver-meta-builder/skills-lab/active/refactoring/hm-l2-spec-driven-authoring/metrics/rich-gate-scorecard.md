# RICH Gate Scorecard: hm-spec-driven-authoring

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.2.0

## RICH Classification: RICH
Domain-execution workflow — turns written intent into falsifiable implementation contracts through spec-locking, ambiguity rejection, and acceptance-test derivation.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 17 | 20 | Three-source synthesis: addyosmani spec-driven-development (gate sequence), professor-for-testing qe-requirements-validation (SMART/traceability), kw12121212 spec-driven-sync (drift mapping). Deep domain knowledge in requirement engineering. |
| D2: Mindset + Procedures | 14 | 15 | Strong spec-lock workflow (Source Audit→Ambiguity Gate→Requirement Table→Acceptance Test Matrix→Handoff Packet). SMART screening table. 6-NON defence table. |
| D3: Anti-Pattern Quality | 13 | 15 | Five anti-patterns: Vague Spec, Multi-Req Row, Test-Execution Grab, File-Existence Claim, Local-Path Trap. Each with specific detection and correction. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. 10+ trigger phrases. Clear boundary (NOT for exploratory coding). Explicit handoff to hm-test-driven-execution. |
| D5: Progressive Disclosure | 14 | 15 | 237 lines with 4 references, 1 template, 1 workflow, 1 rubric, 1 script. Core workflow inline, detail deferred. |
| D6: Freedom Calibration | 13 | 15 | Balanced: gates enforce rigor but platform adapters provide flexibility. Blocked state documents ambiguity rather than inventing precision. |
| D7: Pattern Recognition | 9 | 10 | Spec-lock workflow pattern with formal gates. Entry gate with tool-based input analysis (prompt-skim/prompt-analyze). Drift and mapping discipline. |
| D8: Practical Usability | 13 | 15 | Requirement extraction template immediately usable. Handoff packet format for hm-test-driven-execution. Cross-platform adapters. |
| **D1-D8 Total** | **107/120 (89%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Three inspected sources with adopt/adapt decisions. SMART validation from professor-for-testing. Drift mapping from kw12121212. |
| RICH-2 | PASS | Three pattern alternatives: spec-first gate sequence, SMART validation/traceability, drift mapping. Explicit adopt/adapt/reject decisions. |
| RICH-3 | PASS | Cross-refs to hm-test-driven-execution, hm-planning-persistence, generic planning, exploratory coding with explicit boundary rules. |
| RICH-4 | PASS | Entry gate with tool-based input checks. Ambiguity gate with SMART screening. Spec-lock workflow with 5 explicit gates. |
| RICH-5 | PASS | 4 references (source-synthesis, spec-to-req-mapping, acceptance-test-patterns, requirement-traceability-matrix) + workflow + rubric + script. |
| RICH-6 | PASS | Cross-platform adapters (OpenCode-native, Hivemind harness, arbitrary user project). Portable templates. |
| RICH-7 | PASS | Blocked handoff for ambiguous sources. Drift classification (implemented/missing/drifted/orphan-test/ambiguous-source/blocked-tooling). |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction with 4 failure modes. Rich-eval-rubric.json in metrics/. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 107/120 (A). Excellent spec-driven authoring skill with deep provenance and rigorous ambiguity rejection.
