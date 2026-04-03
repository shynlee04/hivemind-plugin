# Findings — Skill Audit Report

## Audit Summary
- Skill audited: deep-research
- Total flaws found: 56
- Audit date: 2026-04-02

## CRITICAL (8 issues)
1. Missing frontmatter `description` field — skill never loads
2. `triggers` array empty — no trigger patterns defined
3. SKILL.md body references non-existent reference files
4. No `scripts/` directory — validate-skill.sh missing
5. No `evals/` directory — no test coverage
6. Frontmatter `name` field contains spaces (invalid)
7. References section lists files that don't exist on disk
8. No platform compatibility field — breaks cross-platform loading

## HIGH (14 issues)
9. Frontmatter `description` too short (< 20 chars)
10. Body has no code examples
11. Missing progressive disclosure pattern
12. No anti-patterns section
13. References not organized by lifecycle stage
14. SKILL.md exceeds 200 lines without clear sections
15. No tool substitution table for non-CC platforms
16. Missing FIRST ACTION block
17. No gate enforcement scripts
18. References use absolute paths instead of relative
19. No version field in frontmatter
20. Body contains TODO comments
21. Missing error handling instructions
22. No escalation protocol defined
23. References missing summary.md
24. No project-structure.md in references/

## MEDIUM (20 issues)
25-44. Various formatting, consistency, and documentation issues

## LOW (14 issues)
45-56. Minor style, naming, and organizational improvements
