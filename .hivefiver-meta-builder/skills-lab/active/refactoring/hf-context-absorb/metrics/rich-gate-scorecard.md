# RICH Gate Scorecard: hf-context-absorb

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution protocol — multi-wave swarm for absorbing dense user context (links, text, files, stories, events, actors) into persistent session-context-prompt.md.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 12 | 20 | Multi-wave swarm protocol with 4 parallel waves. YAML merge rules with schema compatibility. XML body schema defined. Domain-specific to context management — acceptable for meta-builder. |
| D2: Mindset + Procedures | 13 | 15 | Wave protocol with 5 waves (0-4) and transition gates. Subagent prompt envelopes defined. Error recovery table with 5 scenarios. |
| D3: Anti-Pattern Quality | 11 | 15 | 5 anti-patterns with correction (silent overwrite, YAML corruption, phantom URLs, ghost actors, wave skip). Missing detection column — could be more actionable. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Description includes 10+ trigger phrases covering absorption, extraction, merge, append, ingest. |
| D5: Progressive Disclosure | 12 | 15 | 118 LOC SKILL.md. 4 references (wave-protocol-detail, yaml-merge-operations, xml-body-schema, tool-selection-matrix). Summaries inline, details in references. |
| D6: Freedom Calibration | 12 | 15 | Structured waves with gates — appropriate for a protocol. Max 5 questions in Wave 3. Max 2 retries in Wave 1. |
| D7: Pattern Recognition | 8 | 10 | Wave-based swarm pattern with sequential wave gates and parallel subagent dispatch. Clear entry/exit criteria per wave. |
| D8: Practical Usability | 13 | 15 | Tool selection matrix (primary + fallback). YAML merge rules with per-field operations. XML body schema for output. Skills loaded on execution. |
| **D1-D8 Total** | **94/120 (78%)** | | **Grade: B-** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Swarm protocol pattern adapted from parallel orchestration. Tool selection matrix references context7, tavily, brave, deepwiki tools. |
| RICH-2 | PASS | 4 waves compared with different subagent dispatches. Tool selection compared (primary vs fallback). YAML merge operations compared per field. |
| RICH-3 | PASS | Cross-refs to hm-detective (disk reading), hm-synthesis (compression), hm-deep-research (URL extraction). Loads these on execution. |
| RICH-4 | PASS | Wave protocol with sequential gates (Wave 0→1→2→3→4). Conditional Wave 3. Max retries defined. |
| RICH-5 | PASS | 4 domain-specific references: wave-protocol-detail.md, yaml-merge-operations.md, xml-body-schema.md, tool-selection-matrix.md. |
| RICH-6 | PASS | Tool selection matrix references OpenCode-specific tools (context7, tavily, brave, deepwiki). Target file is .hivemind/state/session-context-prompt.md. |
| RICH-7 | PASS | Routes to hm-detective, hm-synthesis, hm-deep-research for specialist work. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 6/8 ✅ (Anti-pattern detection could be more actionable)

All RICH gates pass. D1-D8 score: 94/120 (B-).
