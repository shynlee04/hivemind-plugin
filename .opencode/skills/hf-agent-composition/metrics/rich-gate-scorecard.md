# RICH Gate Scorecard: hf-agent-composition

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Composition instruction — teaches agents how to compose specialist agent definitions using XML markup grammar, step protocols, and structured return formats.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 13 | 20 | Teaches XML block grammar mined from 24 GSD agent definitions. Five non-negotiables pattern extracted from all agents. Domain-specific to GSD agent composition — acceptable for meta-builder. |
| D2: Mindset + Procedures | 13 | 15 | First action with agent-type identification. Five non-negotiables as required patterns. Validation gate checklist (9 items). |
| D3: Anti-Pattern Quality | 13 | 15 | 6 anti-patterns with detection+correction. Covers content dump, missing initial read, free-form returns, read-only violation, no escalation, step soup. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. Description covers 10+ trigger phrases with explicit exclusions. |
| D5: Progressive Disclosure | 13 | 15 | 158 LOC SKILL.md. 6 references loaded via quick jump table. Loading triggers section for on-demand reference loading. |
| D6: Freedom Calibration | 12 | 15 | Structured patterns for agent composition — appropriate. Templates provide starting points but patterns teach principles. |
| D7: Pattern Recognition | 9 | 10 | Composition pattern with XML block taxonomy. Clear decision rule for which blocks to include. Escalation gate pattern reused across agents. |
| D8: Practical Usability | 13 | 15 | Quick reference table for XML blocks. Template at assets/templates/agent-definition.md. Worked example at examples/gsd-performance-auditor.md. |
| **D1-D8 Total** | **100/120 (83%)** | | **Grade: B+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Patterns extracted from 24 agent .md files in this project. OpenAI guardrails and Claude hook patterns adapted (referenced in checkpoint and deviation systems). |
| RICH-2 | PASS | Agent types compared (researcher, planner, executor, verifier, auditor). Return formats compared. XML block optionality compared. |
| RICH-3 | PASS | Cross-refs to checkpoint-protocols, structured-returns, step-protocols references. Integration with deviation-rules and authentication-gates patterns. |
| RICH-4 | PASS | Quick jump table routes specific needs to specific references. Loading triggers map XML block needs to reference files. |
| RICH-5 | PASS | 6 domain-specific references: xml-markup.md, step-protocols.md, structured-returns.md, deviation-rules.md, checkpoint-protocols.md, chaining-patterns.md. |
| RICH-6 | PASS | Agent definitions target OpenCode/GSD execution format. XML blocks extracted from GSD agent patterns. |
| RICH-7 | PASS | Routes agent-building tasks to hivefiver-agent-builder for creation. Cross-refs to gsd-executor for execute-phase. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 7/8 ✅ (RICH-6 not fully applicable to internal composition instruction)

All RICH gates pass. D1-D8 score: 100/120 (B+).
