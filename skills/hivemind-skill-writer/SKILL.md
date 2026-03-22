---
name: hivemind-skill-writer
description: "Use when creating, auditing, refactoring, or packaging HiveMind framework skills. NOTE: This skill redirects to external skill-creator for core patterns. Use external skill-creator for skill authoring. Triggers: write a skill, create a new skill, audit this skill."
version: 1.0.0
framework: hivemind
pack: hivemind-skill-writer
entry-level: L1
pattern: P1
stacking: 0
owner: hivemind
status: redirect
tags: [meta, skill-authoring, skill-quality, tdd, hivemind, redirect]
---

# hivemind-skill-writer

## REDIRECT NOTICE

> **This skill redirects to external `skill-creator` for skill authoring patterns.**

HiveMind skills should follow external skill-creator patterns for:
- Skill structure and anatomy
- Description writing best practices  
- Progressive disclosure
- Quality metrics

## When to Use

**Primary Triggers:**
- "create a new skill"
- "write a skill for..."
- "skill authoring"

**For these tasks, use external `skill-creator` skill instead.**

## What This Skill Provides

This skill provides HiveMind-specific guidance for:

1. **HiveMind-specific conventions** - Naming, tags, framework integration
2. **Context-Intelligence integration** - Entry state, trust thresholds
3. **Stacking guidance** - Max 3 skills at entry

## How to Use

1. Load external `skill-creator` for core skill authoring patterns
2. Use this skill ONLY for HiveMind-specific conventions
3. Follow external skill-creator templates and structure

## References

For core patterns, see external `skill-creator` skill.

This skill's internal references are preserved for compatibility:
- `references/01-skill-anatomy.md` — Full anatomy template
- `references/02-frontmatter-standard.md` — YAML schema
- `references/03-three-patterns.md` — Pattern system
- `references/04-tdd-workflow.md` — TDD methodology
- `references/05-skill-quality-matrix.md` — Quality metrics
- `references/06-knowledge-delta.md` — Knowledge delta concept
