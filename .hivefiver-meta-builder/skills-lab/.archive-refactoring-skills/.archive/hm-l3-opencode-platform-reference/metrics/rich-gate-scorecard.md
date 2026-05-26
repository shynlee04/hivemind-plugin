# RICH Gate Scorecard: hm-opencode-platform-reference

**Date:** 2026-05-10 | **Auditor:** hf-l2-skill-builder (audit-refresh) | **Version:** 1.0.1

## RICH Classification: RICH
Reference skill — complete OpenCode platform documentation covering agents, plugins, custom tools, SDK, permissions, skills, commands, configs, MCP servers, and models.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 15 | 20 | 18 reference files covering entire OpenCode platform surface. Official scope matrix with 4 surfaces. Source freshness gate. Repomix pack for source verification. Comprehensive reference corpus. |
| D2: Mindset + Procedures | 12 | 15 | Progressive disclosure model (SKILL.md as index, references as content). Key composition patterns (permission cascading, tool hook pipeline, agent-skill loading, subtask spawning). |
| D3: Anti-Pattern Quality | 12 | 15 | Four anti-patterns: Memorizer, Outdated Citer, Over-Loader, Assumer. Detection+correction for each. Relevant to reference-heavy skills. |
| D4: Spec Compliance | 13 | 15 | Valid frontmatter. Complete description of platform coverage. Clear "NOT for general coding tasks" boundary. |
| D5: Progressive Disclosure | 14 | 15 | 134-line SKILL.md with loading decision table mapping 14 scenarios to specific reference files. "Do NOT load" guidance prevents over-loading. evals/, metrics/, scripts/ directories indexed. |
| D6: Freedom Calibration | 12 | 15 | Appropriate for reference skill — provides indexed knowledge, not rigid workflow. Independence notes clarify portability. |
| D7: Pattern Recognition | 8 | 10 | Reference index pattern with progressive disclosure. Source freshness gate for version-sensitive claims. |
| D8: Practical Usability | 13 | 15 | Reference file table immediately usable. Scope matrix maps 4 surfaces to official locations. Composition patterns provide implementation guidance. |
| **D1-D8 Total** | **99/120 (83%)** | | **Grade: B+** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | OpenCode official docs adopted. Local repomix OpenCode pack from anomalyco/opencode v1.14.44 (updated from v1.14.28). Freshness gate with 2026-05-10 date. |
| RICH-2 | PASS | Reference-heavy pattern intentionally chosen. Progressive disclosure model over tutorial approach. |
| RICH-3 | PASS | Cross-refs to command-dev, opencode-non-interactive-shell, meta-builder with explicit boundary descriptions. |
| RICH-4 | PASS | Source freshness gate. Reference file table with content descriptions. Official scope matrix. |
| RICH-5 | PASS | 18 reference files (agents, tools, commands, configs, custom-tools, formatter, github, lsp, mcp, models, permissions, plugins, rules, sdk, server, share-usage, skills, troubleshooting) + repomix pack. |
| RICH-6 | PASS | Independence notes clarify portability. Verify against actual config before reporting truth. |
| RICH-7 | PASS | Freshness gate prevents outdated claims. Anti-pattern "Assumer" warns against training-knowledge assumptions. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction added by SE-8 (4 failure modes). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 99/120 (B+). Strong reference skill with comprehensive platform documentation coverage. Self-correction added by SE-8.
