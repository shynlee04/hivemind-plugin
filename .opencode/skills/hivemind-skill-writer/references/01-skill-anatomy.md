# Skill Anatomy Template

## Purpose

Standard structure for all HiveMind skills. Every skill must follow this anatomy.

---

## Required Elements

### SKILL.md (Entry Point)

Every skill directory MUST have a `SKILL.md` at its root.

```
skill-name/
└── SKILL.md                    # REQUIRED
```

### Minimum Frontmatter

```yaml
---
name: skill-name-with-hyphens
description: Use when [triggering conditions] — [effect]
version: 1.0.0
framework: hivemind
pack: pack-name
entry-level: L1|L2|L3
pattern: P1|P2|P3
stacking: 0-3
owner: hivemind
status: active
---
```

### Required Sections in SKILL.md

1. **Purpose** — What the skill does (1-2 sentences)
2. **When to Activate** — Specific trigger conditions
3. **Core Behavior** — How it works
4. **Anti-Patterns** — What NOT to do

---

## Optional Elements

### references/

For P2 and P3 skills, create a `references/` directory:

```
skill-name/
├── SKILL.md
└── references/
    ├── 01-topic-alpha.md
    ├── 02-topic-beta.md
    └── index.md          # TOC for P3
```

**Rules:**
- Number files for ordering
- One topic per file
- 1-level depth MAX
- P3 skills MUST have index.md with TOC + jump links

### scripts/

For skills requiring discovery tooling:

```
skill-name/
├── SKILL.md
└── scripts/
    └── detect-pattern.sh    # Discovery only
```

**Rules:**
- Read-only by default
- No mutation scripts
- Safe for multi-environment

### templates/

For reusable output formats:

```
skill-name/
├── SKILL.md
└── templates/
    └── report-template.md
```

---

## Pattern-Specific Requirements

### P1 Skills (High-Level Routing)

| Requirement | Specification |
|-------------|---------------|
| SKILL.md size | <200 lines |
| Body | Route conditions only |
| References | Optional |
| Stacking | Typically 1 |

**Example P1:**
```markdown
# Skill Name

## Purpose
Thin routing skill that directs to specialized sub-packs.

## When to Activate
- Trigger A
- Trigger B

## Routing Logic
IF condition A → load sub-pack-X
IF condition B → load sub-pack-Y

## References
(references/ for detail)
```

### P2 Skills (Domain-Specific)

| Requirement | Specification |
|-------------|---------------|
| SKILL.md size | 200-500 lines |
| Body | Step-by-step guidance |
| References | Required |
| Templates | As needed |

**Example P2:**
```markdown
# Skill Name

## Purpose
Domain-specific guidance for [area].

## When to Activate
- Trigger A
- Trigger B

## Step-by-Step Process

### Step 1: [Name]
Description...

### Step 2: [Name]
Description...

## Templates
(template link)

## Anti-Patterns
- What NOT to do
```

### P3 Skills (Expertise Depth)

| Requirement | Specification |
|-------------|---------------|
| SKILL.md size | >500 lines OR |
| Body | TOC + section targets |
| References | Heavy bundle |
| index.md | REQUIRED with jumps |

**Example P3 Structure:**
```markdown
# Skill Name

## Overview

## Table of Contents
- [Section A](#section-a)
- [Section B](#section-b)
- [Section C](#section-c)

## Section A
Content...

## Section B
Content...

## Section C
Content...

---

# References

## Detailed Topic A
Heavy content...

## Detailed Topic B
Heavy content...

## index.md (TOC)
(reference bundle TOC)
```

---

## Naming Rules

| Element | Format | Example |
|---------|--------|---------|
| Skill directory | kebab-case | `context-intelligence` |
| SKILL.md | literal | `SKILL.md` |
| Reference files | nn-name.md | `01-context-rot.md` |
| TOC index | literal | `index.md` |
| Scripts | kebab-case | `detect-pattern.sh` |
| Templates | kebab-case | `report-template.md` |

---

## Version Policy

| Change | Bump |
|--------|------|
| New trigger | MINOR |
| Breaking trigger | MAJOR |
| New reference | PATCH |
| Bug fix | PATCH |

---

## Status Values

| Status | Meaning |
|--------|---------|
| `active` | Ready for use |
| `draft` | In development |
| `deprecated` | Will be removed |
| `archived` | Historical only |

---

## Integration Points

Every skill should document:

1. **Parent Pack**: What pack does it belong to?
2. **Entry Level**: When does it load?
3. **Pattern**: P1/P2/P3?
4. **Stacking**: How does it affect stack count?
5. **Context Integration**: Does it use context-intelligence?
