# RICH Gate Scorecard: hf-use-authoring-skills

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution skill authoring workflow — step-by-step checklist with validation loop and gate system for creating, auditing, and refactoring skills.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 15 | 20 | Deep agentskills.io integration (6 principles). 8 working scripts with real validation logic. 12+ reference files. Cross-platform adaptation table. Best-in-class for meta-builder skills. |
| D2: Mindset + Procedures | 14 | 15 | Iron law enforced. 10-step checklist with explicit validation loop. Three operating rules. Hierarchy enforcement and skill registration. |
| D3: Anti-Pattern Quality | 14 | 15 | 6 anti-patterns with detection+correction. "What agents rationalize" table exposes common rationalizations. Covers phantom deps, identity crisis, unenforceable gates. |
| D4: Spec Compliance | 14 | 15 | Excellent description with 12+ trigger phrases covering create/audit/refactor/doctor/fix. Has exclusions. |
| D5: Progressive Disclosure | 14 | 15 | 266 LOC SKILL.md. 12+ references loaded via decision tree. Rule: "Load only ONE reference file." |
| D6: Freedom Calibration | 13 | 15 | Structured but flexible — 3-question maximum before defaults. Pushes prescriptive on fragile steps, flexible on creative. |
| D7: Pattern Recognition | 9 | 10 | Checklist-driven with 6-gate system. Validation loop pattern with 5-iteration max. |
| D8: Practical Usability | 14 | 15 | 8 working scripts (not stubs). Worked example: document→skill conversion. Platform adaptation table. |
| **D1-D8 Total** | **107/120 (89%)** | | **Grade: A** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | agentskills.io principles sourced and applied. Script patterns from hm-opencode-non-interactive-shell. Platform patterns from opencode-platform-reference. |
| RICH-2 | PASS | Three patterns compared (P1/P2/P3) via references/03-three-patterns.md. Pattern selection enforced by validate-gate.sh. |
| RICH-3 | PASS | Cross-refs to meta-builder (routing source), skill-synthesis, skill-judge. Hierarchy verification via verify-hierarchy.sh. |
| RICH-4 | PASS | Decision tree with 10 user-intent paths mapping to specific references. Hierarchy enforcement before any action. |
| RICH-5 | PASS | 12 domain-specific references covering skill anatomy, frontmatter, patterns, quality, description optimization, cross-platform, iterative refinement, conflict detection, script authoring, eval lifecycle, anti-deception. |
| RICH-6 | PASS | Platform adaptation table (OpenCode, Claude Code, Codex, Cursor). Paths use framework-agnostic patterns with adapter notes. |
| RICH-7 | PASS | Routes to meta-builder for authoring requests. Cross-refs to skill-synthesis for synthesis-specific workflows. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 107/120 (A).
