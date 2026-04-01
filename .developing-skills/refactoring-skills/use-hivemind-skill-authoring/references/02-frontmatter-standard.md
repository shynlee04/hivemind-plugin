# Frontmatter Standard

## Purpose

YAML frontmatter schema for HiveMind skills. **CRITICAL: Only `name` and `description` are allowed in frontmatter.**

---

## CORRECT Schema (Required Fields ONLY)

```yaml
---
name: skill-name-with-hyphens
description: Use when [triggering conditions] — [effect] — [constraints]. Comprehensive description with WHAT, WHEN, and KEYWORDS for activation.
---
```

**This is the ONLY valid frontmatter format.**

---

## CRITICAL RULE

>**YAMLfrontmatter must ONLY contain `name` and `description`.**
>**All other fields (version, framework, pack, entry-level, pattern, stacking, owner, status, tags, depends-on, enables, complementary) are FORBIDDEN in frontmatter.**

---

## Field Definitions

### name (REQUIRED)

**Type:** string  
**Format:** kebab-case (lowercase with hyphens)

```yaml
name: context-intelligence
name: delegation-scope
name: context-rot-recovery
name: git-atomic-memory
name: use-hivemind-skill-authoring
```

**Rules:**
- Lowercase only
- Hyphens between words
- No numbers at start
- Descriptive but concise
- Must exactly match the skill directory name

### description (REQUIRED)

**Type:** string  
**Format:** Must answer THREE questions:
1. **WHAT**: What does this skill do?
2. **WHEN**: In what situations should it be used?
3. **KEYWORDS**: What terms should trigger this skill?

```yaml
description: Use when encoding commit intent as semantic memory, retrieving past decisions from git history, resuming work after context loss, or building knowledge networks from commit chains. PRIMARY USERS: hiveminder, hivemaker, hiveq, hiverd, hivefiver. Triggers: "what did we decide", "why was this changed", "resume from commits", "decision history", "git memory".
```

**Description Requirements (D4 Specification):**
- Start with "Use when..." or equivalent activation context
- Include specific trigger conditions
- Describe effect clearly
- Add constraints if any
- Include primary user roles (for HiveMind skills)
- Include session context (for HiveMind skills)
- Include trigger keywords
- Max recommended: 500-800 characters for comprehensive descriptions
- Third person perspective

---

## FORBIDDEN Fields

> **These fields must NEVER appear in YAMLfrontmatter:**

| Field | Why Forbidden |
|-------|---------------|
| `version` | Not recognized by any platform |
| `framework` | Redundant - implied by location |
| `pack` | Not recognized by platforms |
| `entry-level` | Internal metadata - belongs in SKILL.md body |
| `pattern` | Internal metadata - belongs in SKILL.md body |
| `stacking` | Internal metadata - belongs in SKILL.md body |
| `owner` | Internal metadata - belongs in SKILL.md body |
| `status` | Internal metadata - use file/directory status |
| `tags` | Not recognized - embed in description |
| `depends-on` | Internal metadata - belongs in SKILL.md body |
| `enables` | Internal metadata - belongs in SKILL.md body |
| `complementary` | Internal metadata - belongs in SKILL.md body |

---

## Where to Put Internal Metadata

Internal HiveMind metadata (pattern, stacking, depends-on, etc.) belongs in the SKILL.md body, NOT in frontmatter:

```markdown
---
name: context-intelligence
description: Use when starting a session, resuming after interruption, detecting context drift, or when delegation scope is unclear. Triggers: "help me", "continue", "start working", "what did we do", "what's the status". Framework: HiveMind context governance bootstrap gate.
---

# context-intelligence

## Purpose

P1 routing skill for HiveMind context governance. Loaded every turn to enforce checkpoints and activate discipline skills.

## Pattern

**Pattern:** P1 (High-level routing)
**Stacking:** 1 (counts against stack limit)

## Dependencies

**Depends-on:** None (entry skill)
**Enables:** delegation-scope, workflow-hierarchy, context-rot-recovery
```

---

## Validation Checklist

- [ ] **ONLY** `name` and `description` in frontmatter
- [ ] name is kebab-case
- [ ] description starts with "Use when..." or equivalent
- [ ] description includes WHAT, WHEN, and KEYWORDS
- [ ] description includes primary user roles (for HiveMind skills)
- [ ] description includes session context (for HiveMind skills)
- [ ] NO version, framework, pack, entry-level, pattern, stacking, owner, status, tags, depends-on, enables, complementary in frontmatter

---

## Correct Examples

### P1 Entry Skill

```yaml
---
name: context-intelligence
description: Use when starting a session, resuming after interruption, detecting context drift, or when delegation scope is unclear. Provides context rot defense and trust scoring. Triggers: "help me", "continue", "start working", "what did we do", "what's the status". Framework: HiveMind context governance bootstrap gate.
---
```

### P2 Domain Skill

```yaml
---
name: git-atomic-memory
description: Use when encoding commit intent as semantic memory, retrieving past decisions from git history, resuming work after context loss, or building knowledge networks from commit chains. PRIMARY USERS: hiveminder (orchestrator), hivemaker (executor), hiveq (verifier), hiverd (researcher), hivefiver (setup). SESSION CONTEXT: main session encode intent, sub-session retrieve parent decisions. Triggers: "what did we decide", "why was this changed", "resume from commits", "decision history", "git memory".
---
```

### Meta Skill (P1 Router)

```yaml
---
name: use-hivemind-skill-authoring
description: Use when creating, auditing, refactoring, or packaging HiveMind framework skills. Activates the meta-builder for skill authoring, TDD workflows, and quality validation. Triggers: "write a skill", "create a new skill", "audit this skill", "is this skill good", "skill quality", "skill design", "skill authoring".
---
```

---

## WRONG Examples (DO NOT USE)

### WRONG: Multiple forbidden fields

```yaml
---
name: context-intelligence
description: Use when starting a session...
version: 1.0.0# WRONG - FORBIDDEN
framework: hivemind# WRONG - FORBIDDEN
pack: context-intelligence# WRONG - FORBIDDEN
entry-level: L1# WRONG - FORBIDDEN
pattern: P1# WRONG - FORBIDDEN
stacking: 1# WRONG - FORBIDDEN
owner: hivemind# WRONG - FORBIDDEN
status: active# WRONG - FORBIDDEN
depends-on: []# WRONG - FORBIDDEN
---
```

### WRONG: Tags in frontmatter

```yaml
---
name: delegation-scope
description: Use when delegating...# WRONG - tags forbidden in frontmatter
tags: [delegation, scope, hierarchy]# WRONG - FORBIDDEN
---
```

---

## Cross-Platform Compatibility

This frontmatter standard is compatible with:

| Platform | Frontmatter Support |
|----------|--------------------|
| **OpenCode** | `name` + `description` only |
| **Claude Code (Anthropic)** | `name` + `description` only |
| **Cursor** | `name` + `description` only |
| **Gemini CLI** | `name` + `description` only |

**All platforms ignore or reject additional fields in frontmatter.**

---

## Anti-Patterns

### WRONG: camelCase name

```yaml
name: contextIntelligence# WRONG - use kebab-case
```

**RIGHT:**
```yaml
name: context-intelligence# RIGHT - kebab-case
```

### WRONG: snake_case name

```yaml
name: context_intelligence# WRONG - use kebab-case
```

**RIGHT:**
```yaml
name: context-intelligence# RIGHT - kebab-case
```

### WRONG: PascalCase name

```yaml
name: Context-Intelligence# WRONG - use lowercase
```

**RIGHT:**
```yaml
name: context-intelligence# RIGHT - lowercase kebab-case
```

### WRONG: Vague description

```yaml
description: Manages context# WRONG - too vague
description: Use always# WRONG - not specific
```

**RIGHT:**
```yaml
description: Use when starting a session, resuming after interruption, or detecting context drift. Provides defense against context rot. Triggers: "help me", "continue", "what did we do".
```

---

## HiveMind-Specific Notes

### Pattern Information

Pattern (P1/P2/P3) belongs in SKILL.md body:

```markdown
## Pattern

**Pattern:** P2 (Domain-specific)
**Stacking:** 1 (counts against stack limit)
```

### Stacking Information

Stacking belongs in SKILL.md body:

```markdown
## Stacking Discipline

At entry, maximum active skill stack is **3**.
This skill counts: 1
```

### Dependencies

Dependencies belong in SKILL.md body:

```markdown
## Dependencies

**Depends-on:** use-hivemind-context (P1)
**Enables:** session-memory-resume (P2)
**Complements:** git-advanced-workflows, conventional-commit
```

### Related Skills Table

```markdown
## Related Skills

| Skill | Relationship | When to Chain |
|-------|-------------|---------------|
| `use-hivemind-context` | **DEPENDS_ON** (P1) | Must load first for session validation |
| `session-memory-resume` | **ENABLES** (P2) | Uses anchors from this skill |
| `delegation-handoff` | **COMPLEMENTS** (P1) | Uses anchors for handoff context |
```

---

## Summary

> **YAMLfrontmatter = `name` + `description` ONLY**
> 
> Everything else belongs in the SKILL.md body.
> 
> This is non-negotiable for cross-platform compatibility.