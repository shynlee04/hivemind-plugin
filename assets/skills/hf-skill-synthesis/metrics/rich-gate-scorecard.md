# RICH Gate Scorecard: hf-skill-synthesis

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Synthesis workflow — INGEST→CLASSIFY→SCAFFOLD→VALIDATE pipeline for creating skills from GitHub repos and codebases.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 13 | 20 | Strong pipeline with tool-specific commands (repomix, webfetch). Classification axes cover pattern/routing/efficiency/testing/quality. agentskills.io spec integration. Domain-specific to skill creation — acceptable for meta-builder. |
| D2: Mindset + Procedures | 14 | 15 | Iron law ("NO SKILL WITHOUT EVALS"). Pipeline-driven workflow with 4 phases. Decision tree for path selection. Max 5 fix iterations. |
| D3: Anti-Pattern Quality | 13 | 15 | 4 anti-patterns with detection+correction (Hoarder, LLM Simulator, Template Copier, Silent Failure). Plus error handling table with 6 failure modes. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. Description includes 10+ trigger phrases covering all synthesis use cases. |
| D5: Progressive Disclosure | 13 | 15 | 177 LOC SKILL.md. 5 references loaded on-demand via decision tree. Rule: "Load only ONE reference file." |
| D6: Freedom Calibration | 12 | 15 | Script-driven pipeline with structural validation. Appropriate for synthesis task — loose creativity with structured gates. |
| D7: Pattern Recognition | 8 | 10 | Pipeline pattern with 4 sequential phases. Classification taxonomy is well-structured. |
| D8: Practical Usability | 13 | 15 | Phase 1-4 with actual tool commands. Decision tree maps user intent to references. Integration with existing skills documented. |
| **D1-D8 Total** | **100/120 (83%)** | | **Grade: B+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | agentskills.io/llms.txt as canonical spec source. Repomix patterns adapted from repomix-exploration-guide. GitHub websearch for pattern corpus. |
| RICH-2 | PASS | Pattern alternatives compared via classification matrix (P1/P2/P3, routing types, efficiency types). Quality axis with 5-tier grading. |
| RICH-3 | PASS | Cross-refs to meta-builder, use-authoring-skills, skill-judge, repomix-exploration-guide, opencode-platform-reference. |
| RICH-4 | PASS | Decision tree routes user intent to specific reference files. Pipeline phases have clear entry/exit criteria. |
| RICH-5 | PASS | 5 domain-specific references: github-ingestion, pattern-classifier, eval-framework, quality-matrix, template-library. |
| RICH-6 | PASS | OpenCode-specific patterns referenced. Compatible with agentskills.io spec (framework-agnostic target). |
| RICH-7 | PASS | Routes to meta-builder for skill synthesis requests. Cross-refs to use-authoring-skills for validation scripts. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 7/8 ✅ (RICH-6 not fully applicable)

All RICH gates pass. D1-D8 score: 100/120 (B+).
