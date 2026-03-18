# Skill Pack Naming Planning

**Last updated:** 2026-03-19  
**Status:** Active naming lane

## 1. Purpose

This file tracks naming posture for the skill revamp. It is not an implementation spec. It exists to keep naming, branching, and pack identity stable while the pack system is still being drafted.

## 2. Current Naming Posture

| Name | Status | Role |
|------|--------|------|
| `context-intelligence` | stable target | Pack 1 entry pack |
| `meta-builder-hivemind` | draft canonical candidate | companion pack for authoring, auditing, packaging |
| `hivemind-skill-writer` | accepted alias | user-facing shorthand until naming is frozen |

## 3. Naming Rules

- Use kebab-case.
- Keep names descriptive, not vague.
- Prefer role or problem nouns over generic verbs.
- Do not let aliases become separate physical packs.
- Freeze one canonical pack id once the companion pack cycle is approved.

## 4. Naming Anti-Patterns

- duplicate names for the same pack
- giant umbrella names that hide the pack’s job
- framework-copy names brought in without adaptation
- names that imply authority the pack does not actually own

## 5. Branch Framing Rule

The pack system should widen by branch, not by stacking more and more meaning into one name. When a new role appears, give it a new branch only if it has a distinct boundary.

## 6. Immediate Rule

For now:

- keep `context-intelligence` fixed
- keep `meta-builder-hivemind` as the draft canonical candidate
- keep `hivemind-skill-writer` as the acceptable alias
- do not mint another companion name until Cycle 3 begins
