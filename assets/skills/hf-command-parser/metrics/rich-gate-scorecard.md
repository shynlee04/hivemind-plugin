# RICH Gate Scorecard: hf-command-parser

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 1.0.0

## RICH Classification: RICH
Domain-execution parser — mental parsing of $ARGUMENT propositional command strings into structured key-value maps without code execution.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 11 | 20 | Teaches specific $ARGUMENT parsing with 5 patterns. Narrow scope but thorough with worked examples. Common errors table is useful. Limited external knowledge — parses from within. |
| D2: Mindset + Procedures | 12 | 15 | 5-step parsing procedure with clear output contract. Each pattern has syntax + example. Worked example walks through complex string step-by-step. |
| D3: Anti-Pattern Quality | 10 | 15 | Error handling table with 5 entries (detection+handling). No formal anti-patterns section — errors are operational, not philosophical. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Description covers 6+ trigger phrases with explicit exclusions (natural-language parsing, shell execution). |
| D5: Progressive Disclosure | 11 | 15 | 115 LOC SKILL.md. One reference file (parsing-rules.md) for grammar details. Balanced for a focused parser skill. |
| D6: Freedom Calibration | 11 | 15 | Specific parser with well-defined syntax. Appropriate — this is a deterministic tool, not a creative task. |
| D7: Pattern Recognition | 7 | 10 | Parser pattern with 5 sub-patterns (named args, quoted values, flags, propositions, positionals). Clear but not deeply structured. |
| D8: Practical Usability | 12 | 15 | Worked example with step-by-step trace and JSON output. Non-interactive shell compliance section ties to command generation. |
| **D1-D8 Total** | **87/120 (73%)** | | **Grade: C+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Parsing patterns derived from OpenCode $ARGUMENT syntax. Non-interactive shell section references hm-opencode-non-interactive-shell. |
| RICH-2 | PASS | Five parsing patterns compared with syntax + examples. Error scenarios compared with detection+handling. |
| RICH-3 | PASS | Cross-refs to hm-opencode-non-interactive-shell for shell safety. Pairs with hf-command-dev for command authoring. |
| RICH-4 | PASS | Parsing procedure with 5 sequential steps. "NOT for general natural-language parsing" boundary in description. |
| RICH-5 | PASS | 1 domain-specific reference: parsing-rules.md for detailed grammar and edge cases. |
| RICH-6 | PASS | Parser targets OpenCode $ARGUMENT format specifically. Syntax matches OpenCode command patterns. |
| RICH-7 | PASS | Routes shell execution to hm-opencode-non-interactive-shell. Routes command creation to hf-command-dev. |
| RICH-8 | PASS | This scorecard. Evals/ with 3 scenarios. Self-correction section with 4 failure modes. |

## Exit Decision: PASS
**RICH-8 Score:** 6/8 ✅ (Narrow scope limits D1/D5/D7)

All RICH gates pass. D1-D8 score: 87/120 (C+). Narrow scope is appropriate for a parser skill.
