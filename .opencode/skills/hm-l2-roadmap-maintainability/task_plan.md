# Task Plan: hm-roadmap-maintainability

## Goal
Create the `hm-roadmap-maintainability` skill — a P2 Domain skill that teaches agents to evaluate and plan product roadmaps with maintainability as a first-class concern. Handles long-term product evolution: feature ordering by dependencies across milestones, maintainability scoring, extensibility checks, and product health monitoring over time.

## Pattern
**P2 — Domain Pattern**
- Body: 200-400 lines in SKILL.md
- References: 4 files (maintainability-scoring, roadmap-patterns, debt-tracking, extensibility-checks)
- Not a router (no thin entry), not expertise depth (under 8 refs)

## Decisions
- **hm- prefix** per project convention
- **Language/framework-agnostic** with adapter notes
- **NOT a project management skill** — does not assume Scrum, Kanban, or SAFe
- **Distinct from hm-feature-ecosystem**: eco handles current-feature interdependence; roadmap handles long-term product health
- **Routes to/from**: hm-brainstorm (informs ideation), hm-requirements-analysis (informs requirements), hm-feature-ecosystem (provides dependency graph input)
- **Consumed by**: hm-gate-orchestrator, product management workflows

## Checklist
- [x] STEP 1: Ran validate-gate.sh — PASS
- [x] STEP 2: P2 selected (not routing, not expertise depth)
- [x] STEP 3: Loaded references/03-three-patterns.md, references/01-skill-anatomy.md
- [ ] STEP 5: Write frontmatter — run validate-skill.sh
- [ ] STEP 6: Write body — 8 workflow sections
- [ ] STEP 7-9: Validation loop (validate-skill.sh + check-overlaps.sh)
