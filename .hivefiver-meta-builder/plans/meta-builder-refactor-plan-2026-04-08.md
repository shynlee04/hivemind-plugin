# meta-builder SKILL.md v4.0 — Implementation Plan

**Date:** 2026-04-08
**Goal:** Rewrite meta-builder SKILL.md from 73/120 (Grade C) to 100+/120 (Grade A) following TDD for skills methodology.

---

## TDD Cycle

### RED Phase — Baseline Test
Run pressure scenarios against current meta-builder (v3.2). Document exact rationalizations, failures, and gaps. This proves WHY the skill needs rewriting.

### GREEN Phase — Write Minimal Skill
Rewrite SKILL.md section-by-section, each addressing specific baseline failures. Test after each section.

### REFACTOR Phase — Close Loopholes
Run new pressure scenarios against rewritten skill. Identify new rationalizations. Plug holes. Re-test.

---

## Section Breakdown

### SECTION 1: RED Baseline + Plan (Current)
- Write this plan
- Run 3 pressure scenarios against current meta-builder
- Document baseline behavior verbatim
- Identify rationalization patterns

### SECTION 2: Frontmatter + Overview + Harness + Principles
- Rewrite description with WHAT/WHEN/KEYWORDS (Hivefiver identity)
- Overview Routine: what it delivers under OpenCode AND HiveMind scope
- The Harness: teaching agents to manage OpenCode concepts
- Principles: iterative, guardrails, no-execution-unless-metrics
- **Test:** Agent correctly identifies as Hivefiver, not generic meta-builder

### SECTION 3: On Load + Iron Law + Mind Map + Domain Routing
- On Load: 7 specific Hivefiver files + planning files
- Iron Law: NO STACK WITHOUT A REASON
- Mind Map: full tree of OpenCode meta concepts
- Domain Routing: when to create skill vs agent vs command vs tool vs workflow
- **Test:** Agent loads correct files on startup, routes domain questions correctly

### SECTION 4: Power Tools (9 built-in tools)
- question, todowrite, patch, grep, glob, lsp, skill, webfetch, websearch
- Each: what it does, WHY it matters for meta-builder, WHEN to use, depth reference
- Quick reference table: tool → meta-builder use case → permission
- **Test:** Agent uses correct tool for meta-builder tasks, not generic alternatives

### SECTION 5: 5-Step Workflow + Routing Table + Stacking Recipes
- 5-step workflow ending with TODO list + design spec + user confirmation
- Routing table: 13 rows + /hf-* commands + fallback
- Stacking recipes: 5 patterns with max-3 enforcement
- **Test:** Agent follows 5-step workflow, routes correctly, respects max-3

### SECTION 6: Anti-Patterns + Question Discipline + Reference Map
- 8 anti-patterns (4 existing + 4 new)
- Question discipline: max 3, specific, document assumptions
- Reference map: 14 entries with loading triggers and "Do NOT load" guidance
- **Test:** Agent avoids all 8 anti-patterns, asks max 3 questions

### SECTION 7: Templates (3 files)
- templates/skill-frontmatter.md — YAML skeleton + description formula
- templates/agent-frontmatter.md — YAML skeleton + permissions model
- templates/command-frontmatter.md — YAML skeleton + $ARGUMENTS pattern
- **Test:** Agent uses templates when creating new meta-concepts

### SECTION 8: Workflows (3 files)
- workflows/skill-creation-flow.md — 5-step procedural
- workflows/agent-creation-flow.md — 5-step procedural
- workflows/command-creation-flow.md — 5-step procedural
- **Test:** Agent follows workflow steps in order

### SECTION 9: Depth References (4 files)
- references/depth-built-in-tools.md — detailed tool guides
- references/depth-repo-analysis.md — repomix-explorer quick reference
- references/depth-github-stacks.md — prompt-enhancer + deepwiki workflow
- references/depth-skill-synthesis.md — GitHub ingestion pipeline
- **Test:** Agent loads depth refs only when triggered, not by default

### SECTION 10: REFACTOR — Pressure Tests
- Run 5 new pressure scenarios against rewritten skill
- Document any new rationalizations
- Close loopholes, re-test until bulletproof
- **Test:** All 8 scenarios pass (3 RED + 5 new)

### SECTION 11: Final Validation Gate
- Run skill-judge evaluation — target 100+/120
- Verify all referenced files exist
- Verify no dead references
- Git commit with descriptive message
- User confirmation

---

## Success Criteria

- [ ] skill-judge score >= 100/120
- [ ] All 8 anti-patterns avoided under pressure
- [ ] All referenced files exist on disk
- [ ] No dead references
- [ ] Hivefiver identity explicit throughout
- [ ] 5-step workflow followed end-to-end
- [ ] Max 3 skills per stack enforced
- [ ] Committed to git with descriptive message
