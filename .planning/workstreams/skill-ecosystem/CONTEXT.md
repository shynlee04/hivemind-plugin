---
workstream: skill-ecosystem
created: 2026-04-29
status: ACTIVE
phase_count: 17
---

# Skill Ecosystem Workstream — Bootstrap Context

## Purpose
Own ALL SKILL.md files in `.opencode/skills/`. Ensure every skill has correct frontmatter, clear triggers, lineage classification, RICH-8 quality, and proper agent integration.

## Architecture
- **17 phases**: SE-1 through SE-14 (including SE-3.5, SE-3.6, SE-5.5)
- **2-lineage scope**: hm-* (28), hf-* (11), gate-* (3), stack-* (6), unprefixed (1) = 49 active + 1 disabled
- **Cross-workstream blocks**: SE-5 blocks AS-3, SE-5.5 blocks AS-7, SE-11 blocks AS-11, SE-12 blocks AS-9, SE-13 blocks AS-10, SE-14 blocks AS-7+AS-8

## Current State (updated 2026-04-29)
- SE-1: ✅ COMPLETE (reclassification + cleanup)
- SE-2: ✅ COMPLETE (planning pipeline backbone: 4 plans, hm-planning-persistence, 20+ reference fixes)
- SE-3: ✅ COMPLETE (4 pre-gate skills hardened to RICH-8 ≥6/8)
- SE-3.5: ✅ COMPLETE (feature ecosystem + production skills hardened)
- SE-3.6: ✅ COMPLETE (product validation skill hardened to RICH-8)
- SE-4: ✅ COMPLETE (research pipeline: 5 skills hardened to RICH-8 ≥8/8)
- SE-5: ✅ COMPLETE (gate orchestration + lineage routing: hm-gate-orchestrator + hm-lineage-router)
- SE-5.5: PLANNED (internal gate skills hardening)
- SE-6: ✅ COMPLETE (context validation sweep)
- SE-7 through SE-14: PLANNED
- SE-8: ✅ COMPLETE (31 orphan skills hardened)

## Key Documents
- ROADMAP.md: Phase overview with dependency chains
- STATE.md: Current progress, known issues, inventory
- REQUIREMENTS.md: Quality contract (HMQUAL-01→08), acceptance criteria
- phases/SE-X-*/SE-X-CONTEXT.md: Per-phase context

## Locked Decisions
- D-AD-01: hm-agents → hm-skills STRICT; hf-agents → hf-skills + hm-skills when needed
