# Skill Audit Report — 20 Skills

**Date:** 2026-04-07
**Verdicts:** 4 CLEAN, 12 NEEDS_FIX, 4 NEEDS_REWRITE

---

## Summary Table

| # | Skill | Desc | Self-Contain | Pattern | Lines | Scripts | Refs | Verdict |
|---|-------|------|-------------|---------|-------|---------|------|---------|
| 1 | harness-delegation-inspection | 4/5 | 2/5 | P3 | 194 | EMPTY dir | 5/5 OK | **NEEDS_REWRITE** |
| 2 | harness-audit | 5/5 | 3/5 | P3 | 143 | 2 real | 1/1 OK | **NEEDS_FIX** |
| 3 | agent-authorization | 4/5 | 3/5 | P2 | 232 | 2 real | 1/1 OK | **NEEDS_FIX** |
| 4 | session-context-manager | 4/5 | 3/5 | P2 | 155 | 1 real | 2/2 OK | **NEEDS_FIX** |
| 5 | phase-loop | 4/5 | 4/5 | P2 | 107 | 0 | 1/1 OK | **NEEDS_FIX** |
| 6 | command-parser | 4/5 | 5/5 | P2 | 79 | 0 | 1/1 OK | **CLEAN** |
| 7 | agents-and-subagents-dev | 5/5 | 4/5 | -- | 85 | 0 | 2/2 OK | **CLEAN** |
| 8 | command-dev | 5/5 | 4/5 | -- | 68 | 0 | 2/2 OK | **NEEDS_FIX** |
| 9 | coordinating-loop | 3/5 | 2/5 | P3 | 371 | 8 real | 4/4 OK | **NEEDS_REWRITE** |
| 10 | custom-tools-dev | 5/5 | 4/5 | -- | 74 | 0 | 2/2 OK | **CLEAN** |
| 11 | meta-builder | 4/5 | 3/5 | P1 | 90 | 6 real | 5/5 OK* | **NEEDS_FIX** |
| 12 | oh-my-openagent-reference | 2/5 | 5/5 | -- | 46 | 0 | 3/3 OK | **NEEDS_FIX** |
| 13 | opencode-non-interactive-shell | 2/5 | 5/5 | -- | 229 | 0 | 0/0 | **NEEDS_FIX** |
| 14 | opencode-platform-reference | 2/5 | 4/5 | -- | 53 | 0 | 19/19 OK | **NEEDS_FIX** |
| 15 | planning-with-files | 5/5 | 5/5 | -- | 267 | 0 | 0/0 | **CLEAN** |
| 16 | repomix-exploration-guide | 2/5 | 4/5 | -- | 471 | 0 | 0/0 | **NEEDS_REWRITE** |
| 17 | repomix-explorer | 4/5 | 5/5 | -- | 301 | 0 | 0/0 | **NEEDS_FIX** |
| 18 | skill-synthesis | 5/5 | 2/5 | P2 | 180 | 7 real | 5/5 OK | **NEEDS_FIX** |
| 19 | use-authoring-skills | 4/5 | 2/5 | P2-hybrid | 255 | 8 real | 12/12 OK | **NEEDS_FIX** |
| 20 | user-intent-interactive-loop | 3/5 | 1/5 | -- | 379 | 5 real | 5/5 OK | **NEEDS_REWRITE** |

*meta-builder: All 5 refs exist, but SKILL.md claims 3 were deleted — contradiction.

---

## Cross-Cutting Issues

### `$HOME/.claude` Hardcoded Paths (CRITICAL)
| File | Location |
|------|----------|
| harness-delegation-inspection/SKILL.md:45 | `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` |
| harness-delegation-inspection/references/gsd-execution-patterns.md | Multiple lines |
| coordinating-loop/scripts/verify-hierarchy.sh:81 | `$HOME/.claude/skills/$skill` |
| use-authoring-skills/scripts/verify-hierarchy.sh:81 | `$HOME/.claude/skills/$skill` |
| user-intent-interactive-loop/scripts/verify-hierarchy.sh:81 | `$HOME/.claude/skills/$skill` |
| user-intent-interactive-loop/scripts/first-action.sh:101 | `$HOME/.claude/skills` |

### GSD-Specific Patterns
| Skill | Issue |
|-------|-------|
| harness-delegation-inspection | Entire Delegation Protocol section is GSD-specific |
| phase-loop | Description says "GSD revision-loop pattern" |
| harness-audit | References "gsd-verifier style" |

### Missing Metadata Blocks (9 skills)
agents-and-subagents-dev, command-dev, custom-tools-dev, oh-my-openagent-reference, opencode-non-interactive-shell, opencode-platform-reference, planning-with-files, repomix-explorer, user-intent-interactive-loop

### Missing Trigger Phrases (4 skills)
oh-my-openagent-reference (2/5), opencode-non-interactive-shell (2/5), opencode-platform-reference (2/5), repomix-exploration-guide (2/5)
