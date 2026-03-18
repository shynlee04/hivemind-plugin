# HiveMind Skill Module

**Last updated:** 2026-03-19  
**Status:** Active planning branch  
**Scope:** Skill-pack innovation for HiveMind with Pack 1 focused on Context-Intelligence and the later companion meta-builder pack

## What This Branch Is

This module is the stable planning surface for the HiveMind skill-pack initiative. It converts the current draft-note work into the live `.planning` authority so future sessions can continue from one clean branch instead of reopening multiple draft notes and re-deriving the same decisions.

This branch is intentionally planning-only. It does not authorize skill creation, deletion, or migration by itself.

## Why This Exists

The current repo has:

- multi-agent entry complexity
- delegated subagent handoff risk
- mixed framework surfaces across `.agent`, `.claude`, `.codex`, `.opencode`, `.qwen`, and similar directories
- context rot and governance pollution concerns from stale or false authority surfaces
- a user requirement to keep the solution broad at entry, conditional in branching, and non-breaking in packaging

The planning branch exists to frame those concerns once, then let later sessions author packs in a controlled sequence.

## Planning Surfaces

| File | Role | When to open |
|------|------|--------------|
| `architecture.md` | Module architecture and pack-shape rules | Open first when deciding how the pack system should be structured |
| `progress.md` | Cycle tracker, packet tracker, and next-session state | Open first when resuming work |
| `eval-tracking.md` | Shared quality rubric and pressure-test lanes | Open before scoring or validating any draft pack |
| `planning/index.md` | Planning packet navigation | Open when branching into packet families |
| `planning/skill-pack-naming/index.md` | Naming-track navigation | Open when working on pack framing or naming |
| `planning/skill-pack-naming/hivemind-skill-packages-innovations-planning-2026-03-19.md` | Current master outline packet | Open when deciding route, milestones, and branch order |

## Source Inputs

The current planning set is derived from these repo-local inputs:

- `docs/draft-notes/setting-the-theme.md`
- `docs/draft-notes/context-intelligence-entry-pack-plan-2026-03-19.md`
- `docs/draft-notes/my-prompt-to-investigation.md`
- `docs/draft-notes/the-second-context-investigation-round.md`
- `HIVEMIND-POLLUTION-AUDIT.md`

## Current Working Decisions

- Pack 1 stays `context-intelligence`.
- Pack 1 is a must-load, broad, thin entry pack.
- Branching follows the Pattern 1 / Pattern 2 / Pattern 3 model.
- The companion pack stays conceptually distinct from Pack 1.
- The companion draft name remains `meta-builder-hivemind`, with `hivemind-skill-writer` kept as an acceptable user-facing alias until naming is frozen.
- The active runtime roadmap remains separate; this is a parallel planning branch.

## Guardrails

- Do not collapse the whole skill system into one giant governance skill.
- Do not begin implementation from this branch without the next cycle being explicitly authorized.
- Do not let the companion authoring pack absorb the must-load entry pack.
- Do not let cross-framework references become authority just because they exist.
- Do not widen this branch into code or runtime changes unless that becomes an explicit later cycle.

## Recommended Start Points For Future Sessions

| If the session is about... | Start here |
|----------------------------|------------|
| Resuming this planning branch | `progress.md` |
| Deciding pack structure | `architecture.md` |
| Deciding route and milestone order | `planning/skill-pack-naming/hivemind-skill-packages-innovations-planning-2026-03-19.md` |
| Deciding how to score or stress-test draft packs | `eval-tracking.md` |

## Current Rule

Treat this module as the live planning authority for the skill-pack initiative until a later stable non-planning authority replaces it.
