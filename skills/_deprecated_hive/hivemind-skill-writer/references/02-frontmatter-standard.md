# Frontmatter Standard

## Purpose

YAML frontmatter schema for HiveMind skills. Every SKILL.md must have valid frontmatter.

---

## Complete Schema

```yaml
---
name: skill-name-with-hyphens
description: Use when [triggering conditions] — [effect] — [constraints]
---
```

---

## Field Definitions

### name (REQUIRED)

**Type:** string  
**Format:** kebab-case (lowercase with hyphens)

```yaml
name: context-intelligence
name: delegation-scope
name: context-rot-recovery
```

**Rules:**
- Lowercase only
- Hyphens between words
- No numbers at start
- Descriptive but concise

### description (REQUIRED)

**Type:** string  
**Format:** "Use when [conditions] — [effect] — [constraints]"

```yaml
description: >
  Use when starting a session, resuming after interruption,
  detecting context drift, or when delegation scope is unclear.
  Provides context rot defense and trust scoring.
```

**Rules:**
- Start with "Use when..."
- Include specific trigger conditions
- Describe effect clearly
- Add constraints if any
- Max 500 characters
- Third person perspective

### version (REQUIRED)

**Type:** string  
**Format:** Semantic versioning (semver)

```yaml
version: 1.0.0
version: 1.2.0
version: 2.0.0
```

**Semver Rules:**
- MAJOR: Breaking trigger change
- MINOR: New trigger added
- PATCH: Bug fix, new reference

### framework (REQUIRED)

**Type:** string  
**Value:** `hivemind`

```yaml
framework: hivemind
```

### pack (REQUIRED)

**Type:** string  
**Format:** Pack hierarchy

```yaml
pack: context-intelligence
pack: context-intelligence/delegation
pack: hivemind-skill-writer
pack: explore
pack: general
```

### entry-level (REQUIRED)

**Type:** string  
**Values:** L1, L2, L3

| Level | When | Size |
|-------|------|------|
| L1 | Always loaded at entry | ~100 words |
| L2 | On trigger match | ~500 lines |
| L3 | Explicit request | References |

```yaml
entry-level: L1   # Always loaded
entry-level: L2   # On trigger
entry-level: L3   # On explicit request
```

### pattern (REQUIRED)

**Type:** string  
**Values:** P1, P2, P3

| Pattern | Purpose |
|---------|---------|
| P1 | High-level routing |
| P2 | Domain-specific |
| P3 | Expertise depth |

```yaml
pattern: P1
pattern: P2
pattern: P3
```

### stacking (REQUIRED)

**Type:** integer  
**Range:** 0-3

```yaml
stacking: 1   # Counts against stack limit
stacking: 0   # Does not count (meta skills)
```

**Note:** hivemind-skill-writer has stacking: 0 because it's a meta skill.

### owner (REQUIRED)

**Type:** string  
**Value:** `hivemind`

```yaml
owner: hivemind
```

### status (REQUIRED)

**Type:** string  
**Values:** active, deprecated, draft, archived

```yaml
status: active      # Ready for use
status: draft       # In development
status: deprecated  # Will be removed
status: archived    # Historical only
```

### tags (OPTIONAL)

**Type:** array of strings

```yaml
tags: [delegation, scope, hierarchy]
tags: [context, rot, recovery]
```

### depends-on (OPTIONAL)

**Type:** array of strings

```yaml
depends-on:
  - context-intelligence
  - delegation-scope
```

---

## Validation Checklist

- [ ] name is kebab-case
- [ ] description starts with "Use when..."
- [ ] version is valid semver
- [ ] framework is "hivemind"
- [ ] pack is recognized
- [ ] entry-level is L1, L2, or L3
- [ ] pattern is P1, P2, or P3
- [ ] stacking is 0-3
- [ ] owner is "hivemind"
- [ ] status is valid value

---

## Examples

### P1 Entry Skill

```yaml
---
name: context-intelligence
description: Use when starting a session, resuming after interruption, detecting context drift, or when delegation scope is unclear. Provides context rot defense and trust scoring.
version: 1.0.0
framework: hivemind
pack: context-intelligence
entry-level: L1
pattern: P1
stacking: 1
owner: hivemind
status: active
---
```

### P2 Sub-Pack Skill

```yaml
---
name: delegation-scope
description: Use when delegating to subagents or receiving delegated scope. Covers scope inheritance, chain of command, and anti-patterns.
version: 1.0.0
framework: hivemind
pack: context-intelligence/delegation
entry-level: L2
pattern: P2
stacking: 1
owner: hivemind
status: active
depends-on:
  - context-intelligence
---
```

### P3 Recovery Skill

```yaml
---
name: context-rot-recovery
description: Use when context rot severity exceeds 9. Activated by context-intelligence when degradation is detected beyond safe thresholds.
version: 1.0.0
framework: hivemind
pack: context-intelligence/recovery
entry-level: L3
pattern: P3
stacking: 1
owner: hivemind
status: active
depends-on:
  - context-intelligence
---
```

### Meta Skill (No Stack)

```yaml
---
name: hivemind-skill-writer
description: Use when creating, auditing, refactoring, or packaging HiveMind framework skills. Activates the meta-builder for skill authoring.
version: 1.0.0
framework: hivemind
pack: hivemind-skill-writer
entry-level: L1
pattern: P1
stacking: 0
owner: hivemind
status: active
---
```

---

## Anti-Patterns

**WRONG:**
```yaml
name: contextIntelligence      # camelCase
name: context_intelligence     # snake_case
name: Context-Intelligence     # PascalCase
```

**RIGHT:**
```yaml
name: context-intelligence     # kebab-case
```

**WRONG:**
```yaml
description: Manages context    # Too vague
description: Use always         # Not specific
```

**RIGHT:**
```yaml
description: Use when starting a session, resuming after interruption, or detecting context drift. Provides defense against context rot.
```
