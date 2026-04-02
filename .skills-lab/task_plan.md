# Task Plan: Skill Authoring Package Rebuild

## Goal
Rebuild `use-authoring-skills` into a spec-compliant, progressively-disclosed, eval-driven skill authoring package — the meta-builder foundation for the harness framework.

## Status: IN-PROGRESS — Corrections Applied, Waves 2+3 Complete

## Phases
- [x] 1. Context Scouting (Wave 0: 4 agents)
- [x] 2. Deep Audit (Wave 1: 3 agents)
- [x] 3. Fix CRITICALs (Wave 2: 3 agents)
- [x] 4. Deduplicate (Wave 3: 3 agents)
- [ ] 5. Apply User Corrections (compatibility removal, archive, GCC)
- [ ] 6. Rebuild SKILL.md body as routing hub
- [ ] 7. Create new reference files (06, 09-12)
- [ ] 8. Create templates, scripts, examples
- [ ] 9. Validation gate

## Current Phase: 5

## Blockers: None

## Key Decisions (LOCKED)
- D1: Align with agentskills.io spec — metadata + allowed-tools are useful optionals, NO compatibility
- D2: Incremental scope (this session: fix + deduplicate, new content next session)
- D3-T1: Concise SKILL.md + deep progressive refs
- D3-T3: Adaptive with constraints (templates, examples, fallbacks) — NOT "flexibility"
- D3-T4: Granular hierarchy with incremental integration checkpoints, programmatic measurable gates
- D3-T5: Universal — "Claude"="Agent", "CLAUDE.md"="AGENTS.md" everywhere
- D4: Explicit skill loads (skill-creator, skill-development, writing-skills, skill-judge, skill-review)

## Active Skill Loads (Required in SKILL.md)
- Creating/improving: `skill-creator`, `skill-development`, `writing-skills`
- Audit/refactor: `skill-judge`, `skill-review`
- Memory: `gcc`
- Planning: `planning-with-files`
