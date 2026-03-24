# Source Validation and Grading

## Purpose

Grade sources by authority, freshness, and corroboration to establish evidence quality.

## Authority Hierarchy

| Level | Source Type | Trust | Examples |
|-------|------------|-------|----------|
| 1 | Official docs / SDK source | Highest | OpenCode SDK source, official API docs |
| 2 | Project source code | High | Codebase files, test files |
| 3 | Blog posts / tutorials | Medium | Tech blogs, official tutorials |
| 4 | Forum answers / discussions | Low | Stack Overflow, GitHub discussions |
| 5 | Uncited claims | None | Any claim without source reference |

## Freshness Grading

| Grade | Definition | Action |
|-------|-----------|--------|
| `current` | Within 6 months or matches current codebase | Trust |
| `recent` | 6-12 months old | Verify before citing |
| `stale` | >12 months old | Treat with skepticism |
| `unknown` | No date available | Mark as unverified |

## Corroboration Rules

- **Multi-source confirmation** → `corroborated: true` — high confidence
- **Single source** → `corroborated: false` — acceptable but noted
- **Contradictions** → flag both sources, do not resolve — synthesizer decides

## Grading Application

When collecting evidence:
1. Record the source for every claim
2. Assign authority level based on source type
3. Assign freshness based on date or codebase match
4. Check for corroboration from other sources
5. Flag contradictions without resolving them

## Synthesizer Responsibility

The synthesizer (not the child) resolves contradictions by:
1. Comparing authority levels — higher authority wins
2. Comparing freshness — current wins over stale
3. Checking for corroboration — corroborated wins
4. If still ambiguous, escalating to user
