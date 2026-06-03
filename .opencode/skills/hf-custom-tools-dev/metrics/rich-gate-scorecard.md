# RICH Gate Scorecard: hf-custom-tools-dev

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution development guide — OpenCode plugin and custom tool building with Zod schema enforcement, plugin lifecycle, and CQRS boundaries.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 12 | 20 | Teaches Zod + @opencode-ai/plugin SDK patterns. Iron law enforces schema-first. CQRS split documented (tools=write, hooks=read). Domain-specific to OpenCode — acceptable for meta-builder. |
| D2: Mindset + Procedures | 12 | 15 | Iron law: "NO TOOL WITHOUT A ZOD SCHEMA." "What agents rationalize" table with 5 entries. Script rule: "REPORT FACTS and LEAVE JUDGMENT TO THE AGENT." |
| D3: Anti-Pattern Quality | 13 | 15 | 5 anti-patterns with detection+correction. Covers schema dodger, swiss army tool, fat plugin, state mutator, path hardcoder. |
| D4: Spec Compliance | 14 | 15 | Valid frontmatter. Description includes 10+ trigger phrases covering tool creation, plugin building, Zod schemas, hooks, CLI scripts. |
| D5: Progressive Disclosure | 11 | 15 | 121 LOC SKILL.md. 2 mandatory references (plugin-lifecycle.md, zod-patterns.md). Plugin lifecycle and worked example inline. |
| D6: Freedom Calibration | 12 | 15 | Structured for safety — schema-first prevents runtime errors. Flexible on tool design and implementation approach. |
| D7: Pattern Recognition | 8 | 10 | Tool-building pattern with schema→implement→validate→assemble lifecycle. Plugin lifecycle pattern (init→register→event loop→shutdown). |
| D8: Practical Usability | 13 | 15 | Complete worked example (TypeScript tool with Zod schema). Validation gate checklist (7 items). Script rule is actionable. |
| **D1-D8 Total** | **95/120 (79%)** | | **Grade: B-** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Zod patterns adapted from Zod documentation. Plugin lifecycle from @opencode-ai/plugin SDK source. CQRS split aligns with project architecture. |
| RICH-2 | PASS | Tools vs hooks compared (write-side vs read-side). Plugin layer vs business logic compared. Scripts vs tools compared (facts vs mutation). |
| RICH-3 | PASS | Cross-refs to hm-opencode-platform-reference for SDK details. Conforms to project architecture (src/ separation). |
| RICH-4 | PASS | On-load routing: read plugin-lifecycle.md + zod-patterns.md. Clear boundary: plugin layer <100 LOC, business logic in tools. |
| RICH-5 | PASS | 2 domain-specific references: plugin-lifecycle.md (init/register/event loop/shutdown), zod-patterns.md (Good/Bad patterns). |
| RICH-6 | PASS | OpenCode-specific: @opencode-ai/plugin SDK, tool() helper, Zod schemas, hook lifecycle, PreToolUse/PostToolUse hooks. |
| RICH-7 | PASS | Routes to hm-opencode-platform-reference for complete SDK documentation. Routes to hm-opencode-non-interactive-shell for script safety. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 6/8 ✅ (D5 and D7 slightly limited by focused scope)

All RICH gates pass. D1-D8 score: 95/120 (B-).
