# Skill Anatomy Template

## Purpose

Standard structure for all agent skills. Every skill must follow this anatomy.

---

## Required Elements

### SKILL.md (Entry Point)

Every skill directory MUST have a `SKILL.md` at its root.

```
skill-name/
└── SKILL.md                    # REQUIRED
```

### Frontmatter

Frontmatter rules and constraints are in **02-frontmatter-standard.md**. That file defines the six recognized fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`), validation rules, and anti-patterns.

### Internal Metadata (in SKILL.md body)

Place pattern, stacking, and dependency information in the SKILL.md body. Alternatively, use the `metadata` frontmatter field — see **02-frontmatter-standard.md** for allowed fields.

```markdown
## Pattern

**Pattern:** P1 (High-level routing)
**Stacking:** 1 (counts against stack limit)

## Dependencies

**Depends-on:** None (entry skill)
**Enables:** delegation-scope, workflow-hierarchy
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

## Pattern-Specific Structure

Pattern-specific structure templates are in **03-three-patterns.md**. That file defines P1 (routing), P2 (domain-specific), and P3 (expertise depth) with complete examples, stacking rules, and anti-patterns per pattern.

The sections below describe the anatomy rules that apply across all patterns.

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

Document these integration properties for every skill:

1. **Parent Pack** — Identify the pack the skill belongs to. Example: `context-intelligence` belongs to the `context-intelligence` pack; `delegation-scope` belongs to `use-agent-skill-authoring`.
2. **Entry Level** — State when the skill loads during a session. Example: P1 skills load at session start; P2 skills load on demand when their domain is active; P3 skills load only when escalation triggers fire.
3. **Pattern** — Declare the pattern (P1/P2/P3). This determines the structure template — see **03-three-patterns.md** for pattern-specific requirements.
4. **Stacking** — State how the skill affects the stack count. Every loaded skill counts as 1 against the stack limit. Example: `P1 (1) + P2 (1) = 2 skills stacked`.
5. **Context Integration** — State whether the skill uses context-intelligence for session state, trust scoring, or rot detection. Example: `context-intelligence` integrates with all packs for entry state recognition and recovery awareness; `git-atomic-memory` reads trust thresholds before encoding decisions.
