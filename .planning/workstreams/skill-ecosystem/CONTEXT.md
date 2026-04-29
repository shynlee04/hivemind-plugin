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

## Current State
- SE-1: COMPLETE (reclassification + cleanup)
- SE-2: PARTIALLY COMPLETE (plan execution pending)
- SE-3 through SE-14: NOT STARTED

## Key Documents
- ROADMAP.md: Phase overview with dependency chains
- STATE.md: Current progress, known issues, inventory
- REQUIREMENTS.md: Quality contract (HMQUAL-01→08), acceptance criteria
- phases/SE-X-*/SE-X-CONTEXT.md: Per-phase context

## Locked Decisions
- D-AD-01: hm-agents → hm-skills STRICT; hf-agents → hf-skills + hm-skills when needed
