# Template: Skill Frontmatter

> **Loading trigger:** When creating a new skill.

## YAML Skeleton

```yaml
---
name: skill-name-with-hyphens
description: "Use when [specific triggering conditions and symptoms]"
metadata:
  layer: "0-4"
  role: "router|domain-execution"
  pattern: "Navigation|Process|Tool"
  version: "1.0.0"
---
```

## Description Formula

**WHAT** (what it does) + **WHEN** (trigger scenarios) + **KEYWORDS** (searchable terms)

```yaml
# Example
description: "Use when creating, auditing, or refactoring agent skills. Covers frontmatter, pattern selection, TDD workflows, quality scoring, and cross-platform compatibility. Triggers on: 'create a skill', 'audit this skill', 'fix skill trigger'."
```

## Rules
- `name`: lowercase, alphanumeric + hyphens only, ≤64 characters
- `description`: third person, starts with "Use when...", under 500 chars
- NEVER summarize workflow in description — only triggering conditions
