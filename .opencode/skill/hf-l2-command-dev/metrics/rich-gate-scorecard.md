# RICH Gate Scorecard: hf-command-dev

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution development guide — OpenCode command creation with non-interactive shell safety mandates and command anatomy patterns.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 9 | 20 | Thin but focused. Covers command anatomy (frontmatter, $ARGUMENTS, !bash, agent:, subtask:) and shell safety (banned commands, CI=true). Domain-specific to OpenCode — acceptable for meta-builder. |
| D2: Mindset + Procedures | 11 | 15 | Iron law enforced. "What agents rationalize" table exposes 4 common failure modes. On-load steps route to mandatory references. |
| D3: Anti-Pattern Quality | 11 | 15 | 4 anti-patterns with detection+correction. Covers interactive assumption, vague description, missing skill load, self-executor. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Description includes 8+ trigger phrases covering creation, updating, bash injection, agent configuration. |
| D5: Progressive Disclosure | 10 | 15 | 81 LOC SKILL.md. 2 mandatory references (non-interactive-shell.md, command-anatomy.md). Thin but avoids bloat. |
| D6: Freedom Calibration | 11 | 15 | Appropriate for command authoring — prescriptive on shell safety, flexible on command content. |
| D7: Pattern Recognition | 7 | 10 | Command creation pattern with anatomy requirements. Shell safety is the dominant concern. |
| D8: Practical Usability | 11 | 15 | Shell safety mandates are actionable. Command anatomy checklist is clear. No worked example — could benefit from one. |
| **D1-D8 Total** | **83/120 (69%)** | | **Grade: C** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Non-interactive shell mandates derived from hm-opencode-non-interactive-shell skill. Command anatomy from OpenCode platform reference. |
| RICH-2 | PASS | Interactive vs non-interactive shell patterns compared. subtask:true vs subtask:false compared. |
| RICH-3 | PASS | Cross-refs to hm-opencode-non-interactive-shell for complete banned commands list. Routes to hf-command-parser for argument parsing. |
| RICH-4 | PASS | On-load routing: read non-interactive-shell.md + command-anatomy.md. Clear boundary: this skill handles command structure, agent handles execution. |
| RICH-5 | PASS | 2 domain-specific references: non-interactive-shell.md (banned commands, flags), command-anatomy.md (structure, $ARGUMENTS, patterns). |
| RICH-6 | PASS | OpenCode-specific: $ARGUMENTS, !bash, @file, agent:, subtask: fields. CI=true headless environment awareness. |
| RICH-7 | PASS | Routes to hm-opencode-non-interactive-shell for complete shell safety. Routes to hf-command-parser for argument parsing. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 5/8 ✅ (Thin skill — appropriate scope but low coverage on D1, D5, D7)

All RICH gates pass. D1-D8 score: 83/120 (C). Thin by design — command creation is a focused task.
