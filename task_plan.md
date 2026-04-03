# Task Plan: Meta-Builder Long-Haul — Skill Harness

**Goal:** Build the complete meta-builder harness: 5 skill packs (use-authoring-skills, user-intent-interactive-loop, coordinating-loop, planning-with-files, meta-builder) with zero-dependencies, cross-package bridging, HiveMind v3 alignment, and OpenCode concept integration.

**Current Phase:** Phase 3 — READY FOR USER TESTING

## Phases

- [x] Phase 1: Milestone 1 — 4 skill packs built, validated, committed (47 files, ~9,000 lines)
- [x] Phase 2: Batch 2 — Fixes + Meta-Builder + Integration Spec (3 builders dispatched)
- [x] Phase 3: Validation Gate — ALL 5 packs pass validate-skill.sh (11/11 each)
- [ ] Phase 4: User Testing — orchestrator loads coordinating-loop + meta-builder + planning-with-files + use-authoring-skills + user-intent-interactive-loop
- [ ] Phase 5: GROUP 2 Remaining — use-authoring-commands, use-authoring-agents, use-authoring-tools, use-authoring-workflows
- [ ] Phase 6: GROUP 1 Remaining — tech-to-feature-synthesis, deep-investigation (guided by deep-research-synthesis-repomix.md)
- [ ] Phase 7: Integration Testing — 6 real-world scenarios, conflict resolution, end-to-end workflows
- [ ] Phase 8: Polish & Ship — description optimization, eval runs, packaging

## Key Decisions (LOCKED)

| Decision | Rationale |
|----------|-----------|
| Coordinator NEVER executes directly | User mandate — plan + delegate only |
| All skills use "Agent" not "Claude" | Universal platform requirement |
| SKILL.md under 500 lines | Progressive disclosure — depth in references |
| No `compatibility` field in frontmatter | User explicitly rejected |
| Coverage wins over concision | Agents must not struggle to find depth |
| "Adaptive with constraints" not "flexibility" | User's framework — templates, examples, fallbacks |
| Programmatic measurable gates | Boolean/scoring, ralph-loop compatible |
| Write-to-disk every turn | Coherence lost between turns by default |
| Zero-dependency skills | Pure markdown + shell scripts only |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| planning-with-files SKILL.md duplicate sections | 0 | Fixed by fixer builder (commit af46bc3d) |
| user-intent-interactive-loop missing scripts/ | 0 | Fixed by fixer builder (commit af46bc3d) |
| use-authoring-skills missing GROUP 1 cross-refs | 0 | Fixed by fixer builder (commit af46bc3d) |
| Meta-builder parent skill missing | 0 | Created by meta-builder agent (commit ff845c65) |
| Cross-package bridging spec missing | 0 | Created by integration spec agent (commit 7c726efe) |

## Validation Gate Results (Phase 3)

| Pack | validate-skill.sh | check-overlaps.sh | coordination-check.sh |
|------|-------------------|-------------------|----------------------|
| use-authoring-skills | ✅ 11/11 PASS | ✅ No HIGH/MEDIUM | ✅ |
| user-intent-interactive-loop | ✅ 11/11 PASS | ✅ No HIGH/MEDIUM | ✅ |
| coordinating-loop | ✅ 11/11 PASS | ✅ No HIGH/MEDIUM | ✅ |
| planning-with-files | ✅ 11/11 PASS | ✅ No HIGH/MEDIUM | ✅ |
| meta-builder | ✅ 11/11 PASS | ✅ No HIGH/MEDIUM | ✅ |

## User Testing Checklist (Phase 4)

| Test | What to Verify |
|------|----------------|
| Interactive questioning | Agent asks probing questions, doesn't overwhelm |
| Intent recording | User intent persists across multiple turns/changes |
| Loop till success | Agent iterates, doesn't give up after first failure |
| Delegation over execution | Agent delegates to subagents, doesn't execute directly |
| Multi-checkpoint synthesis | Knowledge accumulates gradually across sessions |
| Skill triggering | Skills auto-detect from natural language |
| Cross-reference resolution | All SKILL.md references resolve to actual files |
