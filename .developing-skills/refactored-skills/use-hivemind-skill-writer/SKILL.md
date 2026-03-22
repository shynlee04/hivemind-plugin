---
name: use-hivemind-skill-writer
description: "Entry router for HiveMind skill design. Routes to external skill-creator for creation and skill-review for auditing. Use when creating, auditing, or refactoring HiveMind skills."
---

# use-hivemind-skill-writer

Entry router for HiveMind-specific skill authoring. Routes to external skill-creator and skill-review for core patterns.

## When to Activate

| Trigger | Route To |
|---------|----------|
| "create a new skill" | External `skill-creator` |
| "write a skill for..." | External `skill-creator` |
| "audit this skill" | External `skill-review` |
| "evaluate this skill" | External `skill-review` |
| "refactor this skill" | External `skill-review` |
| "skill quality check" | External `skill-review` |

## Process Flow

```
Skill Work Request → Identify Intent
                         ↓
              ┌─────────┴─────────┐
              ↓                   ↓
         Create/Write?      Audit/Evaluate?
              ↓                   ↓
    External skill-creator  External skill-review
```

## Step-by-Step Protocol

1. **DETECT** — Is this a skill authoring request?
2. **IDENTIFY INTENT** — Create/Write or Audit/Evaluate?
3. **ROUTE** — Route to appropriate external skill:
   - Create/Write/Refactor → External `skill-creator`
   - Audit/Evaluate/Score → External `skill-review`
4. **AWAIT** — Wait for implementation or audit report

## HiveMind-Specific Conventions

This skill provides HiveMind-specific guidance that external skills may not cover:

- **Framework naming**: `use-hivemind-*` prefix for entry skills
- **Router pattern**: Entry skills are thin routers, not implementers
- **Stacking rules**: Max 3 active skills at entry

## Terminal State

- **Create intent**: Routed to external `skill-creator`
- **Audit intent**: Routed to external `skill-review`
