---
name: "hivefiver-skillforge"
description: "Discover, validate, and compose cross-domain skill bundles with automation scripts, deterministic triggers, and governance checks."
---

# HiveFiver SkillForge

## Purpose
Build a minimal but complete skill bundle for the active workflow, including non-dev use cases.

## Discovery Sources
1. Local installed skills (`find-skills` pattern)
2. Project-native skills (HiveMind/HiveFiver packs)
3. External catalogs (for example skill.sh listings) with trust review

## Priority Skills for Meta Building
- `find-skills`
- `skill-creator`
- writing/packaging skills used to generate deterministic scripts and templates

## Required Domain Packs
Always propose at least one pack from:
- `dev` (architecture, TDD, research, implementation)
- `marketing` (content, campaign planning, market research)
- `finance` (analysis, reporting, compliance review)
- `office-ops` (documentation, workflow automation, SOP)
- `web-browsing/research` (web retrieval and synthesis)
- `openclaw-style browsing automation` (only if trusted integration is available in environment)

## Composition Workflow
1. Discover candidate skills.
2. Score each skill on relevance, freshness, overlap, risk.
3. Build phase-by-phase trigger matrix.
4. Attach scripts/templates/references per phase.
5. Add fallback skill plan if a required skill is missing.

## Automation Contract
For each selected pack, output:
- command sequence,
- deterministic workflow mapping,
- delegated sub-agent suggestions,
- validation checkpoints.

## Required Checkpoint
```ts
map_context({ level: "action", content: "Skill package discovery and deterministic composition" })
save_mem({ shelf: "project-intel", content: "Cross-domain skill package generated", tags: ["hivefiver", "skills", "automation"] })
```

## Output Contract
- `selected_skills`
- `skill_source_links`
- `trigger_matrix`
- `automation_bundle`
- `coverage_gaps`
- `next_command`: `/hivefiver-gsd-bridge` or `/hivefiver-ralph-bridge`
