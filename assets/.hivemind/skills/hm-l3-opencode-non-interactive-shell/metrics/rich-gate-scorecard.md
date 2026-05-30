# RICH Gate Scorecard: hm-opencode-non-interactive-shell

**Date:** 2026-04-29 | **Auditor:** gsd-executor (SE-8) | **Version:** 2.0.0

## RICH Classification: RICH
Reference skill — shell command safety guide for headless agent execution with danger tier matrix, banned commands, and cognitive optimization patterns.

## D1-D8 Quality Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | 13 | 20 | Nanostack guard tiers adapted (ALLOW/WARN/BLOCK). OpenCode official docs adapted. Compact but targeted knowledge. Former source replaced with official docs + local repomix pack. |
| D2: Mindset + Procedures | 13 | 15 | Strong Iron Law ("NEVER run a command that waits for user input"). 6 core mandates. Danger tier matrix with actionable tiers. |
| D3: Anti-Pattern Quality | 13 | 15 | Six anti-patterns: Prompter, Editor, REPL, Git Pager, Silent Hang, Unsafe Force. All with detection+correction. Actionable. |
| D4: Spec Compliance | 12 | 15 | Valid frontmatter with 7 trigger phrases. Clear "NOT for general coding tasks" implication. Could use more explicit boundary. |
| D5: Progressive Disclosure | 12 | 15 | 89 lines with 5 references. Danger tier matrix inline. Details deferred to references (command-tables, env-variables, cognitive-patterns, prompt-handling, source-evidence). |
| D6: Freedom Calibration | 12 | 15 | Appropriate for safety guide. Danger tiers report facts but allow agent/user judgment. Platform-agnostic with macOS/BSD note. |
| D7: Pattern Recognition | 8 | 10 | Shell safety pattern with danger classification. Non-interactive flag conventions. Cognitive optimization framing. |
| D8: Practical Usability | 13 | 15 | Danger tier matrix immediately usable. Anti-patterns table actionable. Platform-specific flag guidance included. |
| **D1-D8 Total** | **96/120 (80%)** | | **Grade: B** |

## RICH Gate Evidence

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | Nanostack guard tiers adapted. OpenCode official docs adopted. Source evidence documented in references/source-evidence.md. |
| RICH-2 | PASS | Three-tier danger classification (ALLOW/WARN/BLOCK) with examples. Explicit action guidance per tier. |
| RICH-3 | PASS | Cross-refs to command-dev and opencode-platform-reference with explicit boundary descriptions. |
| RICH-4 | PASS | 6 core mandates. Danger tier matrix. Anti-pattern detection+correction for 6 patterns. |
| RICH-5 | PASS | 5 references (command-tables, env-variables, cognitive-patterns, prompt-handling, source-evidence). Evals/ with evals.json. |
| RICH-6 | PASS | Independence notes clarify non-GNU-only flags on macOS/BSD. No HiveMind state path assumptions. |
| RICH-7 | PASS | BLOCK tier includes git clean, force push, recursive deletion. WARN tier requires timeout/background strategy. |
| RICH-8 | PASS | This scorecard. Evals/ with evals.json. Self-correction added by SE-8 (4 failure modes). |

## Exit Decision: PASS
**RICH-8 Score:** 8/8 ✅

All RICH gates pass. D1-D8 score: 96/120 (B). Solid shell safety reference with high practical usability. Self-correction added by SE-8.
